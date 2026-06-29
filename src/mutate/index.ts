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

// The generated typed write CONTRACT + its interim bridge implementation.
export type { WriteSurface } from './write-surface.interface.gen.js';
export { createBridgeWriteSurface } from './write-surface.bridge.gen.js';
export type { WriteBridge, WriteBridgeArgs } from './write-surface.bridge.gen.js';
