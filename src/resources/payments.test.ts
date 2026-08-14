import { describe, expect, it, vi } from 'vitest';

import type { Transport, Page } from '../http.js';
import * as sdk from '../generated/sdk.gen.js';
import type { Payment } from '../generated/types.gen.js';
import { PaymentRequestsResource, PaymentsResource } from './payments.js';

type Options = { path?: Record<string, unknown>; query?: Record<string, unknown> };

function transport(): { t: Transport; run: ReturnType<typeof vi.fn>; runPage: ReturnType<typeof vi.fn> } {
  const run = vi.fn(async () => ({ id: 'pay_1' }) satisfies Partial<Payment>);
  const runPage = vi.fn(async () => ({ data: [] }) satisfies Page<Payment>);
  const fake = { paginate: vi.fn(async function* () {}), run, runPage } as unknown as Transport;
  return { t: fake, run, runPage };
}

describe('payment resources', () => {
  it('passes project filters and typed linked-record expansions', async () => {
    const { t, runPage } = transport();
    const payments = new PaymentsResource(t);
    const requests = new PaymentRequestsResource(t);

    await payments.list({ projectId: 'project_1', expand: ['request', 'transactions'] }).page();
    await requests.list({ projectId: 'project_1', expand: ['payment', 'document'] }).page();

    expect((runPage.mock.calls[0]?.[1] as Options).query).toEqual(expect.objectContaining({
      projectId: 'project_1',
      expand: ['request', 'transactions'],
    }));
    expect((runPage.mock.calls[1]?.[1] as Options).query).toEqual(expect.objectContaining({
      projectId: 'project_1',
      expand: ['payment', 'document'],
    }));
  });

  it('lists payment history', async () => {
    const { t, runPage } = transport();
    const payments = new PaymentsResource(t);

    await payments.timeline('pay_1').list({ limit: 25, cursor: 'cursor_1' }).page();

    expect(runPage.mock.calls[0]?.[0]).toBe(sdk.paymentsGetTimeline);
    expect(runPage.mock.calls[0]?.[1]).toEqual({
      path: { paymentId: 'pay_1' },
      query: { limit: 25, cursor: 'cursor_1' },
    });
  });

  it('uses the generated get operations', async () => {
    const { t, run } = transport();
    await new PaymentsResource(t).get('pay_1', { expand: ['request'] });
    await new PaymentRequestsResource(t).get('req_1', { expand: ['payment'] });

    expect(run.mock.calls[0]?.[0]).toBe(sdk.paymentsGet);
    expect(run.mock.calls[1]?.[0]).toBe(sdk.paymentRequestsGet);
  });
});
