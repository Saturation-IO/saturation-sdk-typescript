import * as sdk from '../generated/sdk.gen.js';
import type {
  PurchaseOrder,
  PurchaseOrderCreate,
  PurchaseOrderUpdate,
  PurchaseOrderExpand,
  PurchaseOrderItem,
  PurchaseOrderItemWrite,
  PurchaseOrderLifecycle,
  PurchaseOrderSort,
  PurchaseOrderStatus,
  Transaction,
} from '../generated/types.gen.js';
import { Transport, List } from '../http.js';
import { Expanded, type ExpandMap, serializeExpand } from '../expand.js';

const poExpandMap = {
  items: 'items',
  contact: 'contact',
  transactions: 'transactions',
  documents: 'documents',
  lifecycle: 'lifecycle',
} satisfies ExpandMap<PurchaseOrderExpand>;
type PoExpandMap = typeof poExpandMap;

export interface PurchaseOrderListParams<E extends PurchaseOrderExpand = never> {
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
 * action verbs are `submit` / `cancelSubmission` / `void`; `approved` / `committed`
 * / `paid` are reached by the lifecycle engine, never by an `/approve` or `/pay` verb.
 */
export class PurchaseOrdersResource {
  constructor(
    private readonly t: Transport,
    private readonly projectId: string,
  ) {}

  list<E extends PurchaseOrderExpand = never>(
    params: PurchaseOrderListParams<E> = {},
  ): List<Expanded<PurchaseOrder, PoExpandMap, E>> {
    const options = {
      path: { projectId: this.projectId },
      query: {
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
      path: { projectId: this.projectId, purchaseOrderId },
      query: { expand: serializeExpand(params.expand) },
    }) as Promise<Expanded<PurchaseOrder, PoExpandMap, E>>;
  }

  async create(body: PurchaseOrderCreate, opts: { idempotencyKey?: string } = {}): Promise<PurchaseOrder> {
    return this.t.run(sdk.purchaseOrdersCreate, {
      path: { projectId: this.projectId },
      headers: opts.idempotencyKey ? { 'Idempotency-Key': opts.idempotencyKey } : undefined,
      body,
    }) as Promise<PurchaseOrder>;
  }

  async update(purchaseOrderId: string, body: PurchaseOrderUpdate): Promise<PurchaseOrder> {
    return this.t.run(sdk.purchaseOrdersUpdate, {
      path: { projectId: this.projectId, purchaseOrderId },
      body,
    }) as Promise<PurchaseOrder>;
  }

  async delete(purchaseOrderId: string): Promise<void> {
    await this.t.run(sdk.purchaseOrdersDelete, {
      path: { projectId: this.projectId, purchaseOrderId },
    });
  }

  /** Submit a draft purchase order into the lifecycle flow. */
  async submit(purchaseOrderId: string): Promise<PurchaseOrder> {
    return this.t.run(sdk.purchaseOrdersSubmit, {
      path: { projectId: this.projectId, purchaseOrderId },
    }) as Promise<PurchaseOrder>;
  }

  /** Cancel a pending submission, returning the PO to draft. */
  async cancelSubmission(purchaseOrderId: string): Promise<PurchaseOrder> {
    return this.t.run(sdk.purchaseOrdersCancelSubmission, {
      path: { projectId: this.projectId, purchaseOrderId },
    }) as Promise<PurchaseOrder>;
  }

  /** Void a purchase order. */
  async void(purchaseOrderId: string): Promise<PurchaseOrder> {
    return this.t.run(sdk.purchaseOrdersVoid, {
      path: { projectId: this.projectId, purchaseOrderId },
    }) as Promise<PurchaseOrder>;
  }

  /** The read-only lifecycle state of a purchase order. */
  async lifecycle(purchaseOrderId: string): Promise<PurchaseOrderLifecycle> {
    return this.t.run(sdk.purchaseOrdersLifecycle, {
      path: { projectId: this.projectId, purchaseOrderId },
    }) as Promise<PurchaseOrderLifecycle>;
  }

  /** Transactions linked to a purchase order. */
  transactions(purchaseOrderId: string): List<Transaction> {
    const options = {
      path: { projectId: this.projectId, purchaseOrderId },
    };
    return new List<Transaction>(
      () => this.t.paginate<typeof options, Transaction>(sdk.purchaseOrdersListTransactions, options),
      () => this.t.runPage<typeof options, Transaction>(sdk.purchaseOrdersListTransactions, options),
    );
  }

  /** Line items on a purchase order. */
  items(purchaseOrderId: string): PurchaseOrderItemsResource {
    return new PurchaseOrderItemsResource(this.t, this.projectId, purchaseOrderId);
  }
}

export class PurchaseOrderItemsResource {
  constructor(
    private readonly t: Transport,
    private readonly projectId: string,
    private readonly purchaseOrderId: string,
  ) {}

  list(): List<PurchaseOrderItem> {
    const options = {
      path: { projectId: this.projectId,
        purchaseOrderId: this.purchaseOrderId,
      },
    };
    return new List<PurchaseOrderItem>(
      () => this.t.paginate<typeof options, PurchaseOrderItem>(sdk.purchaseOrdersListItems, options),
      () => this.t.runPage<typeof options, PurchaseOrderItem>(sdk.purchaseOrdersListItems, options),
    );
  }

  async create(body: PurchaseOrderItemWrite): Promise<PurchaseOrderItem> {
    return this.t.run(sdk.purchaseOrdersCreateItem, {
      path: { projectId: this.projectId,
        purchaseOrderId: this.purchaseOrderId,
      },
      body,
    }) as Promise<PurchaseOrderItem>;
  }

  async update(itemId: string, body: PurchaseOrderItemWrite): Promise<PurchaseOrderItem> {
    return this.t.run(sdk.purchaseOrdersUpdateItem, {
      path: { projectId: this.projectId,
        purchaseOrderId: this.purchaseOrderId,
        itemId,
      },
      body,
    }) as Promise<PurchaseOrderItem>;
  }

  async delete(itemId: string): Promise<void> {
    await this.t.run(sdk.purchaseOrdersDeleteItem, {
      path: { projectId: this.projectId,
        purchaseOrderId: this.purchaseOrderId,
        itemId,
      },
    });
  }
}
