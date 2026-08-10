import { createClient } from './generated/client/index.js';
import type { Client } from './generated/client/index.js';
import { toSaturationError } from './errors.js';

/** Default production base URL. Overridable through the client constructor. */
export const DEFAULT_BASE_URL = 'https://next-api.saturation.io/v1';

/**
 * The request executor used by the generated client. It defaults to
 * `globalThis.fetch` and can be replaced for tests or custom runtimes.
 */
export type FetchLike = (request: Request) => Response | Promise<Response>;

/**
 * The result shape every generated `sdk.gen` function returns under the default
 * `responseStyle: 'fields'`: the parsed success body, the parsed error body, and
 * the raw `Response` (so we can key success off the HTTP status, not a body field).
 */
export interface RawResult {
  data?: unknown;
  error?: unknown;
  response?: Response;
  request?: Request;
}

/** A generated `sdk.gen` operation: takes hey-api options, returns a `RawResult`. */
export type Operation<TOptions> = (
  options: TOptions & { client: Client; throwOnError?: boolean },
) => Promise<RawResult>;

/** A page of any keyset-paginated collection. */
export interface Page<T> {
  data: T[];
  nextCursor?: string;
  /** Present only when `withCount=true` was passed. */
  count?: number;
  /** True when a permission/expand under-fetch bounded the page short of `limit`. */
  truncated?: boolean;
}

/**
 * The single transport seam. Wraps the @hey-api fetch client, injects the bearer
 * token, and turns every generated operation into a clean promise that either
 * resolves to the bare success body or throws a typed `SaturationError`.
 * Success is determined by `response.ok` (HTTP status), never a `success` field
 * in the body.
 */
export class Transport {
  readonly client: Client;

  constructor(opts: { token: string; baseURL?: string; fetch?: FetchLike }) {
    this.client = createClient({
      baseUrl: opts.baseURL ?? DEFAULT_BASE_URL,
      // Single auth path: `Authorization: Bearer <token>`. No X-API-Key, no
      // workspace header — the token determines the workspace.
      auth: opts.token,
      throwOnError: false,
      // Use the caller's executor when provided. The generated client otherwise
      // delegates to `globalThis.fetch`.
      ...(opts.fetch ? { fetch: opts.fetch as typeof globalThis.fetch } : {}),
    });
  }

  /**
   * Run one generated operation and normalize its documented result:
   *   - 2xx → resolve the bare success body (caller casts to the widened type),
   *   - otherwise → throw a typed `SaturationError` carrying `code`/`requestId`/…
   *
   * `204 No Content` resolves to `undefined`.
   */
  async run<TOptions>(
    op: Operation<TOptions>,
    options: TOptions,
  ): Promise<unknown> {
    const { data } = await this.runWithResponse(op, options);
    return data;
  }

  /**
   * Like {@link run}, but also returns the raw `Response` on success — for
   * callers that need response HEADERS (e.g. `Idempotency-Replayed` on keyed
   * creates). Error normalization is identical.
   */
  async runWithResponse<TOptions>(
    op: Operation<TOptions>,
    options: TOptions,
  ): Promise<{ data: unknown; response: Response }> {
    const result = await op({
      ...(options as TOptions),
      client: this.client,
      throwOnError: false,
    });

    const response = result.response;
    // A missing response means the request never left (build/network failure).
    if (!response) {
      throw toSaturationError(0, result.error);
    }
    if (!response.ok) {
      // Prefer the parsed error body; fall back to status-only.
      const body = result.error ?? result.data;
      // Surface the documented 429 Retry-After header even if the body omits it.
      const retryAfterHeader = response.headers.get('retry-after');
      const err = toSaturationError(response.status, body);
      if (err.retryAfter === undefined && retryAfterHeader) {
        return Promise.reject(
          toSaturationError(response.status, {
            ...(body as object),
            retryAfter: Number(retryAfterHeader),
          }),
        );
      }
      throw err;
    }
    return { data: result.data, response };
  }

  /**
   * Keyset pagination as a transparent async iterator. Yields every row across
   * pages, following `nextCursor` (cap-100 per page) until it is absent. The
   * mint-time filter/sort live in the cursor, so we never re-send filters on
   * follow-up pages — that is exactly what `400 cursor_invalid` guards against.
   *
   * The cursor encodes filter + sort but NOT the page size, so the caller's
   * `limit` is carried forward explicitly on every follow-up page. Without it,
   * the server falls back to its default page size (50) after the first page,
   * silently shrinking the requested page size mid-iteration.
   *
   * Raw single-page access is available via `runPage`.
   */
  async *paginate<TOptions, TRow>(
    op: Operation<TOptions>,
    options: TOptions,
  ): AsyncGenerator<TRow, void, void> {
    const initialQuery = (options as { query?: Record<string, unknown> }).query;
    let cursor: string | undefined =
      (initialQuery?.cursor as string | undefined) ?? undefined;
    // The first page honors the caller's filters; subsequent pages carry only
    // the opaque cursor (which already encodes filter + sort) plus the caller's
    // `limit`, which the cursor does not encode.
    let firstPage = true;
    for (;;) {
      const query = firstPage
        ? initialQuery
        : { cursor, limit: initialQuery?.limit };
      const page = (await this.run(op, {
        ...options,
        query,
      } as TOptions)) as Page<TRow>;
      for (const row of page.data) {
        yield row;
      }
      if (!page.nextCursor) return;
      cursor = page.nextCursor;
      firstPage = false;
    }
  }

  /** Fetch a single raw page (the `{ data, nextCursor, count?, truncated? }` envelope). */
  async runPage<TOptions, TRow>(
    op: Operation<TOptions>,
    options: TOptions,
  ): Promise<Page<TRow>> {
    return (await this.run(op, options)) as Page<TRow>;
  }
}

/**
 * A list result that is *both* an async-iterable over all rows AND awaitable to a
 * single raw page. `for await (const row of sat.transactions.list(...))` follows
 * the cursor; `await sat.transactions.list(...).page()` returns one envelope.
 */
export class List<TRow> implements AsyncIterable<TRow> {
  constructor(
    private readonly iterate: () => AsyncGenerator<TRow, void, void>,
    private readonly fetchPage: () => Promise<Page<TRow>>,
  ) {}

  [Symbol.asyncIterator](): AsyncIterator<TRow> {
    return this.iterate();
  }

  /** The raw first page: `{ data, nextCursor?, count?, truncated? }`. */
  page(): Promise<Page<TRow>> {
    return this.fetchPage();
  }

  /** Collect every row across all pages into an array. Use with care on large sets. */
  async all(): Promise<TRow[]> {
    const out: TRow[] = [];
    for await (const row of this.iterate()) out.push(row);
    return out;
  }
}
