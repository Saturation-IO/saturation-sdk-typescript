/**
 * The `mutate` write surface, a generated write-only handle over the `/v1` API.
 */

export {
  MutateClient,
  createMutate,
  validateMutateArgs,
  WRITE_OPS,
  WRITE_OP_IDS,
} from './mutate.js';
export type {
  MutateOptions,
  MutateArgs,
  WriteOp,
  WriteOpDef,
} from './mutate.js';

// The generated typed write contract and its bridge implementation.
export type { WriteSurface } from './write-surface.interface.gen.js';
export { createBridgeWriteSurface } from './write-surface.bridge.gen.js';
export type { WriteBridge, WriteBridgeArgs } from './write-surface.bridge.gen.js';
