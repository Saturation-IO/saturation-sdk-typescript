import { describe, expect, it, vi } from 'vitest';

import * as sdk from '../generated/sdk.gen.js';
import type { Transport, Page } from '../http.js';
import { TransactionsResource } from './transactions.js';

type Options = {
  path?: Record<string, unknown>;
  body?: Record<string, unknown>;
};

function transport(): { t: Transport; run: ReturnType<typeof vi.fn>; runPage: ReturnType<typeof vi.fn> } {
  const run = vi.fn(async () => ({ data: [] }));
  const runPage = vi.fn(async () => ({ data: [] }) satisfies Page<unknown>);
  const fake = { paginate: vi.fn(async function* () {}), run, runPage } as unknown as Transport;
  return { t: fake, run, runPage };
}

describe('transaction resource grammar', () => {
  it('binds creates to the project scope', async () => {
    const { t, run } = transport();
    const transactions = new TransactionsResource(t, 'project_1');

    await transactions.create({
      type: 'Invoice',
      amount: { amount: 100, currency: 'USD' },
      timestamp: '2026-08-14T00:00:00.000Z',
      description: 'Rental',
    }, { idempotencyKey: 'transaction-create-key' });

    expect((run.mock.calls[0]?.[1] as Options).body).toEqual(expect.objectContaining({
      projectId: 'project_1',
    }));
  });

  it('returns the typed bulk collection and binds every row to the project', async () => {
    const { t, run } = transport();
    const transactions = new TransactionsResource(t, 'project_1');

    await transactions.createBulk({ transactions: [{
      type: 'Invoice',
      amount: { amount: 100, currency: 'USD' },
      timestamp: '2026-08-14T00:00:00.000Z',
      description: 'Rental',
    }] }, { idempotencyKey: 'transaction-bulk-key' });

    expect(run.mock.calls[0]?.[0]).toBe(sdk.transactionsCreateBulk);
    expect((run.mock.calls[0]?.[1] as Options).body).toEqual({
      transactions: [expect.objectContaining({ projectId: 'project_1' })],
    });
  });

  it('scopes item methods to one transaction', async () => {
    const { t, runPage } = transport();
    const items = new TransactionsResource(t, 'project_1').items('txn_1');

    await items.list().page();

    expect(runPage.mock.calls[0]?.[0]).toBe(sdk.transactionsListItems);
    expect((runPage.mock.calls[0]?.[1] as Options).path).toEqual({ transactionId: 'txn_1' });
  });
});
