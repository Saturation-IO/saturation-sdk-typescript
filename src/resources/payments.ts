import * as sdk from '../generated/sdk.gen.js';
import type {
  Payment,
  PaymentExpand,
  PaymentRequest,
  PaymentRequestExpand,
  PaymentRequestStatus,
  PaymentStatus,
  PaymentTimelineEvent,
} from '../generated/types.gen.js';
import { Transport, List } from '../http.js';
import { Expanded, type ExpandMap } from '../expand.js';

const paymentRequestExpandMap = {
  contact: 'contact',
  purchaseOrder: 'purchaseOrder',
  document: 'document',
  payment: 'payment',
  transactions: 'transactions',
  budgetLine: 'budgetLine',
} satisfies ExpandMap<PaymentRequestExpand>;

const paymentExpandMap = {
  request: 'request',
  purchaseOrder: 'purchaseOrder',
  transactions: 'transactions',
  contact: 'contact',
  budgetLine: 'budgetLine',
  document: 'document',
} satisfies ExpandMap<PaymentExpand>;

type PaymentRequestExpandMap = typeof paymentRequestExpandMap;
type PaymentExpandMap = typeof paymentExpandMap;

export interface PaymentRequestListParams<E extends PaymentRequestExpand = never> {
  status?: PaymentRequestStatus;
  projectId?: string;
  purchaseOrderId?: string;
  contactId?: string;
  expand?: readonly E[];
  limit?: number;
  cursor?: string;
}

export interface PaymentListParams<E extends PaymentExpand = never> {
  status?: PaymentStatus;
  projectId?: string;
  purchaseOrderId?: string;
  paymentRequestId?: string;
  contactId?: string;
  expand?: readonly E[];
  limit?: number;
  cursor?: string;
}

function expandValue(keys: readonly string[] | undefined): string | undefined {
  return keys?.length ? keys.join(',') : undefined;
}

export class PaymentRequestsResource {
  constructor(
    private readonly t: Transport,
    private readonly projectId?: string,
  ) {}

  list<E extends PaymentRequestExpand = never>(
    params: PaymentRequestListParams<E> = {},
  ): List<Expanded<PaymentRequest, PaymentRequestExpandMap, E>> {
    const options = {
      query: {
        status: params.status,
        projectId: params.projectId ?? this.projectId,
        purchaseOrderId: params.purchaseOrderId,
        contactId: params.contactId,
        expand: expandValue(params.expand),
        limit: params.limit,
        cursor: params.cursor,
      },
    };
    type Row = Expanded<PaymentRequest, PaymentRequestExpandMap, E>;
    return new List<Row>(
      () => this.t.paginate<typeof options, Row>(sdk.paymentRequestsList, options),
      () => this.t.runPage<typeof options, Row>(sdk.paymentRequestsList, options),
    );
  }

  async get<E extends PaymentRequestExpand = never>(
    paymentRequestId: string,
    params: { expand?: readonly E[] } = {},
  ): Promise<Expanded<PaymentRequest, PaymentRequestExpandMap, E>> {
    return this.t.run(sdk.paymentRequestsGet, {
      path: { paymentRequestId },
      query: { expand: expandValue(params.expand) },
    }) as Promise<Expanded<PaymentRequest, PaymentRequestExpandMap, E>>;
  }
}

export class PaymentsResource {
  constructor(
    private readonly t: Transport,
    private readonly projectId?: string,
  ) {}

  list<E extends PaymentExpand = never>(
    params: PaymentListParams<E> = {},
  ): List<Expanded<Payment, PaymentExpandMap, E>> {
    const options = {
      query: {
        status: params.status,
        projectId: params.projectId ?? this.projectId,
        purchaseOrderId: params.purchaseOrderId,
        paymentRequestId: params.paymentRequestId,
        contactId: params.contactId,
        expand: expandValue(params.expand),
        limit: params.limit,
        cursor: params.cursor,
      },
    };
    type Row = Expanded<Payment, PaymentExpandMap, E>;
    return new List<Row>(
      () => this.t.paginate<typeof options, Row>(sdk.paymentsList, options),
      () => this.t.runPage<typeof options, Row>(sdk.paymentsList, options),
    );
  }

  async get<E extends PaymentExpand = never>(
    paymentId: string,
    params: { expand?: readonly E[] } = {},
  ): Promise<Expanded<Payment, PaymentExpandMap, E>> {
    return this.t.run(sdk.paymentsGet, {
      path: { paymentId },
      query: { expand: expandValue(params.expand) },
    }) as Promise<Expanded<Payment, PaymentExpandMap, E>>;
  }

  timeline(
    paymentId: string,
    params: { limit?: number; cursor?: string } = {},
  ): List<PaymentTimelineEvent> {
    const options = { path: { paymentId }, query: params };
    return new List<PaymentTimelineEvent>(
      () => this.t.paginate<typeof options, PaymentTimelineEvent>(sdk.paymentsTimeline, options),
      () => this.t.runPage<typeof options, PaymentTimelineEvent>(sdk.paymentsTimeline, options),
    );
  }
}
