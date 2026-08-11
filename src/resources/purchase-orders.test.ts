import { describe, expect, it, vi } from 'vitest';

import type { Transport, Page } from '../http.js';
import * as sdk from '../generated/sdk.gen.js';
import { PurchaseOrdersResource } from './purchase-orders.js';
import type { PurchaseOrder, PurchaseOrderCreate } from '../generated/types.gen.js';

type Options = {
  query?: Record<string, unknown>;
  body?: Record<string, unknown>;
};

function transport(): {
  t: Transport;
  run: ReturnType<typeof vi.fn>;
  runPage: ReturnType<typeof vi.fn>;
} {
  const run = vi.fn(async () => ({ id: 'po_1' }) satisfies Partial<PurchaseOrder>);
  const runPage = vi.fn(async () => ({ data: [] }) satisfies Page<PurchaseOrder>);
  const fake = {
    paginate: vi.fn(async function* () {}),
    run,
    runPage,
  } as unknown as Transport;
  return { t: fake, run, runPage };
}

describe('PurchaseOrdersResource scope defaults', () => {
  it('leaves workspace-level list calls unfiltered unless a project filter is supplied', async () => {
    const { t, runPage } = transport();
    const resource = new PurchaseOrdersResource(t);

    await resource.list().page();
    expect((runPage.mock.calls[0]?.[1] as Options).query).toEqual(expect.objectContaining({
      projectId: undefined,
    }));

    await resource.list({ projectId: 'none' }).page();
    expect((runPage.mock.calls[1]?.[1] as Options).query).toEqual(expect.objectContaining({
      projectId: 'none',
    }));
  });

  it('defaults project-scoped convenience calls to the project without changing workspace calls', async () => {
    const { t, run, runPage } = transport();
    const projectResource = new PurchaseOrdersResource(t, 'project_1');
    const workspaceResource = new PurchaseOrdersResource(t);
    const body: PurchaseOrderCreate = { title: 'Camera package' };

    await projectResource.list().page();
    expect((runPage.mock.calls[0]?.[1] as Options).query).toEqual(expect.objectContaining({
      projectId: 'project_1',
    }));

    await projectResource.create(body, { idempotencyKey: 'project-create' });
    expect((run.mock.calls[0]?.[1] as Options).body).toEqual({
      title: 'Camera package',
      projectId: 'project_1',
    });

    await workspaceResource.create(body, { idempotencyKey: 'workspace-create' });
    expect((run.mock.calls[1]?.[1] as Options).body).toEqual({
      title: 'Camera package',
    });
  });

  it('exposes Timeline through its generated operation', async () => {
    const { t, runPage } = transport();
    const resource = new PurchaseOrdersResource(t);

    await resource.timeline('po_1', { limit: 25, cursor: 'cursor_1' }).page();
    expect(runPage.mock.calls[0]?.[0]).toBe(sdk.purchaseOrdersTimeline);
    expect(runPage.mock.calls[0]?.[1]).toEqual({
      path: { purchaseOrderId: 'po_1' },
      query: { limit: 25, cursor: 'cursor_1' },
    });
  });

  it('exposes Mark paid, link transaction, and unlink transaction through their generated operations', async () => {
    const { t, run } = transport();
    const resource = new PurchaseOrdersResource(t);

    await resource.markPaid('po_1');
    expect(run.mock.calls[0]?.[0]).toBe(sdk.purchaseOrdersMarkPaid);

    await resource.linkTransaction('po_1', 'txn_1');
    expect(run.mock.calls[1]?.[0]).toBe(sdk.purchaseOrdersPutTransaction);

    await resource.unlinkTransaction('po_1', 'txn_1');
    expect(run.mock.calls[2]?.[0]).toBe(sdk.purchaseOrdersDeleteTransaction);

  });
});
