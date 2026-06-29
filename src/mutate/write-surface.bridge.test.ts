/**
 * Unit tests for the generated bridge {@link WriteSurface} — `createBridgeWriteSurface`.
 *
 * The bridge surface is the interim impl: every typed op method forwards its
 * `{ path, body, query }` to the generic dispatcher under its own op id. These
 * tests pin that delegation (op id + arg shape) without any transport — the
 * dispatcher is a spy.
 */
import { describe, expect, it, vi } from 'vitest';

import { createBridgeWriteSurface, type WriteBridge } from './write-surface.bridge.gen.js';

function spyBridge(): { bridge: WriteBridge; calls: Array<{ op: string; args: unknown }> } {
  const calls: Array<{ op: string; args: unknown }> = [];
  const bridge: WriteBridge = {
    mutate: vi.fn((op: string, args: unknown) => {
      calls.push({ op, args });
      return Promise.resolve({ ok: true });
    }) as WriteBridge['mutate'],
  };
  return { bridge, calls };
}

describe('createBridgeWriteSurface delegates each op to the generic dispatcher', () => {
  it('forwards a path+body op under its own op id', async () => {
    const { bridge, calls } = spyBridge();
    const surface = createBridgeWriteSurface(bridge);

    await surface.budgetUpsertLinePhaseData({
      path: { projectId: 'prj_1', lineId: 'lin_1', phaseId: 'phs_1' },
      body: { rate: '2500', quantity: '2', multiplier: '1' },
      url: '/projects/{projectId}/budget/lines/{lineId}/phase-data/{phaseId}',
    });

    expect(calls).toHaveLength(1);
    expect(calls[0]!.op).toBe('budgetUpsertLinePhaseData');
    expect(calls[0]!.args).toEqual({
      path: { projectId: 'prj_1', lineId: 'lin_1', phaseId: 'phs_1' },
      body: { rate: '2500', quantity: '2', multiplier: '1' },
    });
  });

  it('forwards a body-only (path-less) op without an undefined path key', async () => {
    const { bridge, calls } = spyBridge();
    const surface = createBridgeWriteSurface(bridge);

    await surface.masterDataCreateContact({
      body: { name: 'Jane Doe', email: 'jane@example.com' },
      url: '/contacts',
    });

    expect(calls[0]!.op).toBe('masterDataCreateContact');
    // No `path`/`query` keys leak through for an op that declares neither.
    expect(calls[0]!.args).toEqual({ body: { name: 'Jane Doe', email: 'jane@example.com' } });
    expect(Object.prototype.hasOwnProperty.call(calls[0]!.args, 'path')).toBe(false);
    expect(Object.prototype.hasOwnProperty.call(calls[0]!.args, 'query')).toBe(false);
  });

  it('resolves the dispatcher result as the typed response', async () => {
    const { bridge } = spyBridge();
    const surface = createBridgeWriteSurface(bridge);
    const result = await surface.transactionsUpdate({
      path: { txId: 'txn_1' },
      body: { status: 'posted' },
      url: '/transactions/{txId}',
    });
    expect(result).toEqual({ ok: true });
  });
});
