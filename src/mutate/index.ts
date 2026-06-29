/**
 * The `mutate` write surface — a generated, write-only handle over the gated
 * `/v1` API, runnable in-process via `fetch: app.fetch`.
 */

export {
  MutateClient,
  createMutate,
  WRITE_OPS,
  WRITE_OP_IDS,
} from './mutate.js';
export type {
  MutateOptions,
  MutateArgs,
  WriteOp,
  WriteOpDef,
} from './mutate.js';
