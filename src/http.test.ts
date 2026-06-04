/**
 * Behavior tests for `Transport.paginate` — the keyset async-iterator.
 *
 * WHY this matters: the opaque cursor encodes the mint-time filter + sort but
 * NOT the page size. If `paginate` forwards only `{ cursor }` on follow-up
 * pages (dropping the caller's `limit`), the server silently reverts to its
 * default page size (50) after the first page. A caller iterating with
 * `limit: 100` would then get 100 rows, then 50, then 50, … — a correctness
 * regression that no type-test can catch, so it is pinned at runtime here.
 */
import { describe, expect, it } from 'vitest';
import { Transport, type Operation, type Page, type RawResult } from './http.js';

/** Minimal OK `Response` stub: only `ok`/`status`/`headers` are read by `run`. */
function okResponse(): Response {
  return {
    ok: true,
    status: 200,
    headers: new Headers(),
  } as unknown as Response;
}

interface Row {
  id: string;
}

/**
 * A fake generated operation that records the `query` it was called with on
 * every page and walks a fixed two-page result. The presence of `nextCursor`
 * on page 1 drives the iterator into the follow-up page where the `limit`
 * regression would manifest.
 */
function makePagedOp(): {
  op: Operation<{ query?: Record<string, unknown> }>;
  queries: Array<Record<string, unknown> | undefined>;
} {
  const queries: Array<Record<string, unknown> | undefined> = [];
  const pages: Array<Page<Row>> = [
    { data: [{ id: 'a' }, { id: 'b' }], nextCursor: 'CURSOR_2' },
    { data: [{ id: 'c' }], nextCursor: undefined },
  ];
  let call = 0;
  const op: Operation<{ query?: Record<string, unknown> }> = async (options) => {
    queries.push(options.query);
    const data = pages[call] ?? { data: [], nextCursor: undefined };
    call += 1;
    return { data, response: okResponse() } satisfies RawResult;
  };
  return { op, queries };
}

describe('Transport.paginate', () => {
  function transport(): Transport {
    return new Transport({ token: 't', workspaceId: 'ws_1', baseURL: 'http://x' });
  }

  it('carries the caller limit forward onto every follow-up page', async () => {
    const { op, queries } = makePagedOp();
    const rows: Row[] = [];
    for await (const row of transport().paginate<{ query?: Record<string, unknown> }, Row>(op, {
      query: { limit: 100, status: 'open' },
    })) {
      rows.push(row);
    }

    // All rows across both pages were yielded.
    expect(rows.map((r) => r.id)).toEqual(['a', 'b', 'c']);

    // Page 1 honors the full caller query (filters + limit).
    expect(queries[0]).toEqual({ limit: 100, status: 'open' });

    // Page 2 drops the filter (it lives in the cursor) but MUST keep the limit,
    // otherwise the server reverts to its default page size of 50.
    expect(queries[1]).toMatchObject({ cursor: 'CURSOR_2', limit: 100 });
    expect(queries[1]).not.toHaveProperty('status');
  });

  it('forwards an undefined limit when the caller did not set one', async () => {
    const { op, queries } = makePagedOp();
    const rows: Row[] = [];
    for await (const row of transport().paginate<{ query?: Record<string, unknown> }, Row>(op, {
      query: { status: 'open' },
    })) {
      rows.push(row);
    }

    expect(rows).toHaveLength(3);
    // No caller limit → follow-up page carries the cursor with limit:undefined,
    // letting the server apply its own default (not an accidental override).
    expect(queries[1]).toEqual({ cursor: 'CURSOR_2', limit: undefined });
  });
});
