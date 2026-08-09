/**
 * `mutate` — the generic write dispatcher over the generated `/v1` SDK.
 *
 * One loop, no per-operation code. The model names a write op (`budgetCreateLine`,
 * `masterDataCreateContact`, …) from the generated {@link WRITE_OPS} table and
 * passes `{ path, body, query }`; the dispatcher resolves the op's verb + URL and
 * runs it through the shared {@link Transport}. When the transport is built with
 * `fetch: app.fetch`, the call executes the **full production chain in-process** —
 * `bearerAuth → CASL gate → $transaction → audit` — with no socket and no
 * self-HTTP. The gated write logic is reached verbatim; nothing is re-implemented.
 *
 * The {@link WRITE_OPS} allowlist is a defense-in-depth gate: a non-write or
 * unknown op is refused before any request is built. The real security boundary
 * is the **scoped, default-deny bearer token** the bridge mints (see the
 * `mintAgentToken` helper in next-api) — this surface only ensures the agent
 * cannot even *name* a read or a deferred destructive op.
 */

import { Transport, type FetchLike } from '../http.js';
import { SaturationError } from '../errors.js';
import type { Client } from '../generated/client/index.js';
import { WRITE_OPS, WRITE_OP_IDS, type WriteOp, type WriteOpDef } from './write-surface.gen.js';

export { WRITE_OPS, WRITE_OP_IDS } from './write-surface.gen.js';
export type { WriteOp, WriteOpDef } from './write-surface.gen.js';

/** Options for {@link createMutate}. The bearer token determines the workspace. */
export interface MutateOptions {
  /** A default-deny, write-scoped bearer token (NEVER a no-scopes/full-ability token). */
  token: string;
  /** API base URL. Must end in `/v1` so paths line up with the mounted router. */
  baseURL?: string;
  /**
   * The in-process executor. Pass a Hono `app.fetch` to reach the live `/v1`
   * handlers with no socket. Omit to hit the real network (`globalThis.fetch`).
   */
  fetch?: FetchLike;
}

/** Per-call arguments: path params + JSON body + query string for one write op. */
export interface MutateArgs {
  /** Path-parameter values, e.g. `{ projectId, lineId }`. */
  path?: Record<string, unknown>;
  /** The JSON request body the gated handler validates. */
  body?: unknown;
  /** Query-string parameters, if the op declares any. */
  query?: Record<string, unknown>;
  /** Extra headers (e.g. `Idempotency-Key`) merged onto the request. */
  headers?: Record<string, string>;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Validate the generated request envelope without executing a write. This is
 * intentionally structural: path/body presence and top-level fields come from
 * generated metadata; route-owned value semantics remain authoritative at
 * commit. */
export function validateMutateArgs(op: string, args: MutateArgs = {}): void {
  if (!MutateClient.isWriteOp(op)) {
    throw new SaturationError({
      status: 404,
      code: 'not_found',
      message: `'${op}' is not a mutate write operation.`,
      requestId: 'mutate-preview',
    });
  }
  const def = WRITE_OPS[op];
  const providedPath = args.path ?? {};
  const missingPath = def.pathParams.filter((field) => providedPath[field] === undefined);
  if (missingPath.length > 0) {
    throw new SaturationError({
      status: 400,
      code: 'validation',
      message: `mutate('${op}') is missing path parameter(s): ${missingPath.join(', ')}.`,
      requestId: 'mutate-preview',
    });
  }
  if (def.bodyRequired && args.body === undefined) {
    throw new SaturationError({
      status: 400,
      code: 'validation',
      message: `mutate('${op}') requires a JSON body.`,
      requestId: 'mutate-preview',
    });
  }
  if (args.body === undefined) return;
  if (String(def.bodyType) === 'never') {
    throw new SaturationError({
      status: 400,
      code: 'validation',
      message: `mutate('${op}') does not accept a JSON body.`,
      requestId: 'mutate-preview',
    });
  }
  const body = args.body;
  if (!isRecord(body)) {
    throw new SaturationError({
      status: 400,
      code: 'validation',
      message: `mutate('${op}') body must be a JSON object.`,
      requestId: 'mutate-preview',
    });
  }
  const missingBody = def.requiredBodyFields.filter((field) => body[field] === undefined);
  if (missingBody.length > 0) {
    throw new SaturationError({
      status: 400,
      code: 'validation',
      message: `mutate('${op}') is missing required body field(s): ${missingBody.join(', ')}.`,
      requestId: 'mutate-preview',
    });
  }
  if (def.allowedBodyFields.length > 0) {
    const allowed = new Set<string>(def.allowedBodyFields);
    const unknown = Object.keys(body).filter((field) => !allowed.has(field));
    if (unknown.length > 0) {
      throw new SaturationError({
        status: 400,
        code: 'validation',
        message: `mutate('${op}') has unknown body field(s): ${unknown.join(', ')}. Allowed body fields: ${def.allowedBodyFields.join(', ')}.`,
        requestId: 'mutate-preview',
      });
    }
  }
}

/** The minimal hey-api client surface the dispatcher invokes by verb. */
type MethodFn = (options: Record<string, unknown>) => Promise<{
  data?: unknown;
  error?: unknown;
  response?: Response;
  request?: Request;
}>;

/**
 * A write-only handle over the gated `/v1` API. Build it with `fetch: app.fetch`
 * for the in-process agent path; the generated {@link WRITE_OPS} table is the
 * only surface it exposes.
 */
export class MutateClient {
  private readonly transport: Transport;

  constructor(opts: MutateOptions) {
    this.transport = new Transport({
      token: opts.token,
      baseURL: opts.baseURL,
      fetch: opts.fetch,
    });
  }

  /** Is `op` an allowlisted write operation? */
  static isWriteOp(op: string): op is WriteOp {
    return Object.prototype.hasOwnProperty.call(WRITE_OPS, op);
  }

  /** The full write-op catalog (op id + verb + path + summary) — model-facing. */
  catalog(): WriteOpDef[] {
    return WRITE_OP_IDS.map((id) => WRITE_OPS[id]);
  }

  /** Resolve one op's static metadata, or throw if it is not an allowlisted write. */
  def(op: string): WriteOpDef {
    if (!MutateClient.isWriteOp(op)) {
      throw new SaturationError({
        status: 404,
        code: 'not_found',
        message:
          `'${op}' is not a mutate write operation. Reads live in the perception lane; ` +
          `row-DELETE and destructive ops are deferred. Allowed write ops: ${WRITE_OP_IDS.join(', ')}.`,
        requestId: 'mutate-local',
      });
    }
    return WRITE_OPS[op];
  }

  /**
   * Execute one allowlisted write op. Resolves to the parsed success body (the
   * created/updated resource), or throws a typed {@link SaturationError} carrying
   * the gate's status + code (e.g. `403 scope_exceeded`, `404 not_found`,
   * `422 field_read_only`). `204 No Content` resolves to `undefined`.
   */
  async mutate(op: string, args: MutateArgs = {}): Promise<unknown> {
    const { data } = await this.mutateWithMeta(op, args);
    return data;
  }

  /**
   * Like {@link mutate}, but also surfaces retry-identity metadata from the
   * response headers: `replayed` is true when the /v1 route answered from a
   * stored idempotency receipt (`Idempotency-Replayed: true`) instead of
   * creating a new record.
   */
  async mutateWithMeta(op: string, args: MutateArgs = {}): Promise<{ data: unknown; replayed: boolean }> {
    const def = this.def(op);
    validateMutateArgs(op, args);

    // Build a synthetic operation that calls the verb-method with this op's URL,
    // then route it through the shared transport's success/error normalization.
    // `security` is what the generated ops pass to trigger `setAuthParams` (the
    // bearer Authorization header); without it the in-process request is
    // unauthenticated. JSON Content-Type mirrors every generated write op.
    const runOp = (options: { client: Client } & Record<string, unknown>) => {
      const method = (options.client as unknown as Record<string, MethodFn>)[def.method];
      const callerHeaders = (options.headers as Record<string, string> | undefined) ?? {};
      return method({
        security: [{ scheme: 'bearer', type: 'http' }],
        url: def.url,
        ...options,
        headers: { 'Content-Type': 'application/json', ...callerHeaders },
      });
    };

    const { data, response } = await this.transport.runWithResponse(runOp, {
      ...(args.path ? { path: args.path } : {}),
      ...(args.body !== undefined ? { body: args.body } : {}),
      ...(args.query ? { query: args.query } : {}),
      ...(args.headers ? { headers: args.headers } : {}),
    });
    return { data, replayed: response.headers.get('idempotency-replayed') === 'true' };
  }
}

/** Build a {@link MutateClient}. The token MUST be write-scoped + default-deny. */
export function createMutate(opts: MutateOptions): MutateClient {
  return new MutateClient(opts);
}
