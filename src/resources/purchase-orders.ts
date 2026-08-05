import * as sdk from '../generated/sdk.gen.js';
import type {
  PurchaseOrder,
  PurchaseOrderCreate,
  PurchaseOrderUpdate,
  PurchaseOrderExpand,
  PurchaseOrderItem,
  PurchaseOrderItemWrite,
  PurchaseOrderActivity,
  PurchaseOrderLink,
  PurchaseOrderSort,
  PurchaseOrderStatus,
  PurchaseOrderSuggestedMatch,
  PurchaseOrderTimelineEvent,
  Transaction,
} from '../generated/types.gen.js';
import { Transport, List } from '../http.js';
import { Expanded, type ExpandMap, serializeExpand } from '../expand.js';

const poExpandMap = {
  items: 'items',
  contact: 'contact',
  transactions: 'transactions',
  documents: 'documents',
  paymentRequests: 'paymentRequests',
  payments: 'payments',
  budgetLine: 'budgetLine',
  activity: 'activity',
  summary: 'summary',
} satisfies ExpandMap<PurchaseOrderExpand>;
type PoExpandMap = typeof poExpandMap;

export interface PurchaseOrderListParams<E extends PurchaseOrderExpand = never> {
  projectId?: string;
  status?: PurchaseOrderStatus;
  contactId?: string;
  budgetLineId?: string;
  number?: string;
  q?: string;
  expand?: readonly E[];
  sort?: PurchaseOrderSort;
  order?: 'asc' | 'desc';
  limit?: number;
  cursor?: string;
  withCount?: boolean;
  view?: string;
}

/**
 * Purchase orders with flow-derived, read-only `status`. The only user-driven
 * action verbs include submission, cancellation, voiding, finalization, and
 * transaction linking. Approval states remain flow-derived and read-only.
 */
export class PurchaseOrdersResource {
  constructor(
    private readonly t: Transport,
    private readonly projectId?: string,
  ) {}

  list<E extends PurchaseOrderExpand = never>(
    params: PurchaseOrderListParams<E> = {},
  ): List<Expanded<PurchaseOrder, PoExpandMap, E>> {
    const options = {
      query: {
        projectId: params.projectId ?? this.projectId,
        status: params.status,
        contactId: params.contactId,
        budgetLineId: params.budgetLineId,
        number: params.number,
        q: params.q,
        expand: serializeExpand(params.expand),
        sort: params.sort,
        order: params.order,
        limit: params.limit,
        cursor: params.cursor,
        withCount: params.withCount,
        view: params.view,
      },
    };
    type Row = Expanded<PurchaseOrder, PoExpandMap, E>;
    return new List<Row>(
      () => this.t.paginate<typeof options, Row>(sdk.purchaseOrdersList, options),
      () => this.t.runPage<typeof options, Row>(sdk.purchaseOrdersList, options),
    );
  }

  async get<E extends PurchaseOrderExpand = never>(
    purchaseOrderId: string,
    params: { expand?: readonly E[] } = {},
  ): Promise<Expanded<PurchaseOrder, PoExpandMap, E>> {
    return this.t.run(sdk.purchaseOrdersGet, {
      path: { purchaseOrderId },
      query: { expand: serializeExpand(params.expand) },
    }) as Promise<Expanded<PurchaseOrder, PoExpandMap, E>>;
  }

  async create(body: PurchaseOrderCreate, opts: { idempotencyKey: string }): Promise<PurchaseOrder> {
    const projectId = body.projectId ?? this.projectId;
    return this.t.run(sdk.purchaseOrdersCreate, {
      headers: { 'Idempotency-Key': opts.idempotencyKey },
      body: projectId === undefined ? body : { ...body, projectId },
    }) as Promise<PurchaseOrder>;
  }

  async update(purchaseOrderId: string, body: PurchaseOrderUpdate): Promise<PurchaseOrder> {
    return this.t.run(sdk.purchaseOrdersUpdate, {
      path: { purchaseOrderId },
      body,
    }) as Promise<PurchaseOrder>;
  }

  async delete(purchaseOrderId: string): Promise<void> {
    await this.t.run(sdk.purchaseOrdersDelete, {
      path: { purchaseOrderId },
    });
  }

  /** Reserved public-v1 submit path; throws until wired to the workspace approval-run service. */
  async submit(purchaseOrderId: string): Promise<never> {
    return this.t.run(sdk.purchaseOrdersSubmit, {
      path: { purchaseOrderId },
    }) as Promise<never>;
  }

  /** Cancel a pending submission, returning the PO to draft. */
  async cancelSubmission(purchaseOrderId: string): Promise<PurchaseOrder> {
    return this.t.run(sdk.purchaseOrdersCancelSubmission, {
      path: { purchaseOrderId },
    }) as Promise<PurchaseOrder>;
  }

  /** Void a purchase order. */
  async void(purchaseOrderId: string): Promise<PurchaseOrder> {
    return this.t.run(sdk.purchaseOrdersVoid, {
      path: { purchaseOrderId },
    }) as Promise<PurchaseOrder>;
  }

  /** Mark an eligible purchase order paid. */
  async markPaid(purchaseOrderId: string): Promise<PurchaseOrder> {
    return this.t.run(sdk.purchaseOrdersMarkPaid, {
      path: { purchaseOrderId },
    }) as Promise<PurchaseOrder>;
  }

  /** Link a transaction to a purchase order. */
  async link(purchaseOrderId: string, body: PurchaseOrderLink): Promise<PurchaseOrder> {
    return this.t.run(sdk.purchaseOrdersLink, {
      path: { purchaseOrderId },
      body,
    }) as Promise<PurchaseOrder>;
  }

  /** Unlink a transaction from a purchase order. */
  async unlink(purchaseOrderId: string, body: PurchaseOrderLink): Promise<PurchaseOrder> {
    return this.t.run(sdk.purchaseOrdersUnlink, {
      path: { purchaseOrderId },
      body,
    }) as Promise<PurchaseOrder>;
  }

  /** Current live conditions using the product's Activity vocabulary. */
  async activity(purchaseOrderId: string): Promise<PurchaseOrderActivity> {
    return this.t.run(sdk.purchaseOrdersActivity, {
      path: { purchaseOrderId },
    }) as Promise<PurchaseOrderActivity>;
  }

  /** Records that may belong to the purchase order but are not linked. */
  async suggestedMatches(purchaseOrderId: string): Promise<PurchaseOrderSuggestedMatch[]> {
    const result = await this.t.run(sdk.purchaseOrdersSuggestedMatches, {
      path: { purchaseOrderId },
    }) as { data: PurchaseOrderSuggestedMatch[] };
    return result.data;
  }

  /** Immutable purchase-order history, newest first. */
  timeline(
    purchaseOrderId: string,
    params: { limit?: number; cursor?: string } = {},
  ): List<PurchaseOrderTimelineEvent> {
    const options = { path: { purchaseOrderId }, query: params };
    return new List<PurchaseOrderTimelineEvent>(
      () => this.t.paginate<typeof options, PurchaseOrderTimelineEvent>(sdk.purchaseOrdersTimeline, options),
      () => this.t.runPage<typeof options, PurchaseOrderTimelineEvent>(sdk.purchaseOrdersTimeline, options),
    );
  }

  /** Transactions linked to a purchase order. */
  transactions(purchaseOrderId: string): List<Transaction> {
    const options = {
      path: { purchaseOrderId },
    };
    return new List<Transaction>(
      () => this.t.paginate<typeof options, Transaction>(sdk.purchaseOrdersListTransactions, options),
      () => this.t.runPage<typeof options, Transaction>(sdk.purchaseOrdersListTransactions, options),
    );
  }

  /** Line items on a purchase order. */
  items(purchaseOrderId: string): PurchaseOrderItemsResource {
    return new PurchaseOrderItemsResource(this.t, purchaseOrderId);
  }
}

export class PurchaseOrderItemsResource {
  constructor(
    private readonly t: Transport,
    private readonly purchaseOrderId: string,
  ) {}

  list(): List<PurchaseOrderItem> {
    const options = {
      path: { purchaseOrderId: this.purchaseOrderId },
    };
    return new List<PurchaseOrderItem>(
      () => this.t.paginate<typeof options, PurchaseOrderItem>(sdk.purchaseOrdersListItems, options),
      () => this.t.runPage<typeof options, PurchaseOrderItem>(sdk.purchaseOrdersListItems, options),
    );
  }

  async create(body: PurchaseOrderItemWrite, opts: { idempotencyKey: string }): Promise<PurchaseOrderItem> {
    return this.t.run(sdk.purchaseOrdersCreateItem, {
      path: { purchaseOrderId: this.purchaseOrderId },
      headers: { 'Idempotency-Key': opts.idempotencyKey },
      body,
    }) as Promise<PurchaseOrderItem>;
  }

  async update(itemId: string, body: PurchaseOrderItemWrite): Promise<PurchaseOrderItem> {
    return this.t.run(sdk.purchaseOrdersUpdateItem, {
      path: { purchaseOrderId: this.purchaseOrderId, itemId },
      body,
    }) as Promise<PurchaseOrderItem>;
  }

  async delete(itemId: string): Promise<void> {
    await this.t.run(sdk.purchaseOrdersDeleteItem, {
      path: { purchaseOrderId: this.purchaseOrderId, itemId },
    });
  }
}
