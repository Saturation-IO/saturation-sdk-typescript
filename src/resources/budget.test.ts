import { describe, expect, it, vi } from 'vitest';

import type { Page, Transport } from '../http.js';
import * as sdk from '../generated/sdk.gen.js';
import type { BudgetLine } from '../generated/types.gen.js';
import { BudgetResource } from './budget.js';

describe('BudgetLinesResource', () => {
  it('serializes the OpenAPI type filter', async () => {
    const runPage = vi.fn(async (_operation: unknown, _options: unknown) => (
      { data: [] } satisfies Page<BudgetLine>
    ));
    const transport = {
      paginate: vi.fn(async function* () {}),
      runPage,
    } as unknown as Transport;

    await new BudgetResource(transport, 'project_1').lines.list({ type: 'Account,Detail' }).page();

    expect(runPage.mock.calls[0]?.[0]).toBe(sdk.budgetListLines);
    expect(runPage.mock.calls[0]?.[1]).toEqual(expect.objectContaining({
      path: { projectId: 'project_1' },
      query: expect.objectContaining({ type: 'Account,Detail' }),
    }));
    expect((runPage.mock.calls[0]?.[1] as { query: Record<string, unknown> }).query).not.toHaveProperty('kind');
  });
});
