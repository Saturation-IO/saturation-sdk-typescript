import { describe, expect, it, vi } from 'vitest';

import type { Transport, Page } from '../http.js';
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

    await projectResource.create(body);
    expect((run.mock.calls[0]?.[1] as Options).body).toEqual({
      title: 'Camera package',
      projectId: 'project_1',
    });

    await workspaceResource.create(body);
    expect((run.mock.calls[1]?.[1] as Options).body).toEqual({
      title: 'Camera package',
    });
  });
});
