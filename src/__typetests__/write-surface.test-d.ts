/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * Type-level tests for the generated {@link WriteSurface} CONTRACT — the forcing
 * function. This file is NOT compiled into the build (excluded by tsconfig); it
 * pins the property the whole design rests on: an implementation that diverges
 * from the regenerated interface FAILS `tsc`.
 *
 *   pnpm exec tsc --noEmit -p tsconfig.typetest.json
 *
 * Positive cases compile; the negative cases are `@ts-expect-error` lines that
 * MUST stay errors — if a regeneration ever weakened the contract, the
 * `@ts-expect-error` would become unused and this file would fail to compile.
 */
import type { WriteSurface } from '../mutate/write-surface.interface.gen.js';
import { createBridgeWriteSurface, type WriteBridge } from '../mutate/write-surface.bridge.gen.js';
import type {
  BudgetUpsertLinePhaseDataData,
  BudgetUpsertLinePhaseDataResponse,
  MasterDataUpdateContactData,
  MasterDataUpdateContactResponse,
  BudgetLine,
} from '../generated/types.gen.js';

declare const bridge: WriteBridge;

// 1. The generated bridge surface IS a full WriteSurface (every op covered).
const full: WriteSurface = createBridgeWriteSurface(bridge);

// 2. Composing the bridge with a correctly-typed native override satisfies the
//    contract, including a native override for one operation.
const composed = {
  ...createBridgeWriteSurface(bridge),
  budgetUpsertLinePhaseData: (
    _data: BudgetUpsertLinePhaseDataData,
  ): Promise<BudgetUpsertLinePhaseDataResponse> => Promise.reject(new Error('stub')),
} satisfies WriteSurface;

// 3. FORCING FUNCTION — a WRONG return type for one op breaks `satisfies`.
//    (Edit the interface's response type and this override stops matching.)
const badReturn = {
  ...createBridgeWriteSurface(bridge),
  // @ts-expect-error — `Promise<number>` is not the op's `Promise<…Response>`.
  budgetUpsertLinePhaseData: (_data: BudgetUpsertLinePhaseDataData): Promise<number> =>
    Promise.resolve(1),
} satisfies WriteSurface;

// 4. FORCING FUNCTION — a single op whose return type drifts from the contract.
const oneOp: Pick<WriteSurface, 'masterDataUpdateContact'> = {
  // @ts-expect-error — must resolve `MasterDataUpdateContactResponse`, not `BudgetLine`.
  masterDataUpdateContact: (_data: MasterDataUpdateContactData): Promise<BudgetLine> =>
    Promise.reject(new Error('stub')),
};

// 5. FORCING FUNCTION — an impl MISSING ops does not satisfy the full contract.
// @ts-expect-error — only one operation is present; the remainder are missing.
const incomplete: WriteSurface = {
  masterDataUpdateContact: (
    _data: MasterDataUpdateContactData,
  ): Promise<MasterDataUpdateContactResponse> => Promise.reject(new Error('stub')),
};
