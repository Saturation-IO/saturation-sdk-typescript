import * as sdk from '../generated/sdk.gen.js';
import type {
  Transaction,
  TransactionExpandKey,
  TransactionSource,
  TransactionStatus,
  TransactionManualCreate,
  TransactionPatch,
  TransactionBulkCreate,
  TransactionStats,
  TransactionItem,
  TransactionItemCreate,
  TransactionItemPatch,
  TransactionSortField,
} from '../generated/types.gen.js';
import { Transport, List } from '../http.js';
import { Expanded, type ExpandMap, serializeExpand } from '../expand.js';

/**
 * Transaction expand widening. `items` populates `items`; the rest are 1:1.
 * `items.account` is a valid depth-2 key with no dedicated property, so it
 * stays a valid `expand` value without a widening entry.
 */
const transactionExpandMap = {
  contact: 'contact',
  documents: 'documents',
  items: 'items',
  account: 'account',
  purchaseOrder: 'purchaseOrder',
} satisfies ExpandMap<TransactionExpandKey>;
type TransactionExpandMap = typeof transactionExpandMap;

export interface TransactionListParams<E extends TransactionExpandKey = never> {
  source?: TransactionSource;
  type?: string;
  status?: TransactionStatus;
  isReversal?: boolean;
  contactId?: string;
  budgetLineId?: string;
  purchaseOrderId?: string;
  currency?: string;
  dateFrom?: string;
  dateTo?: string;
  amountMin?: number;
  amountMax?: number;
  isItemized?: boolean;
  merchant?: string;
  hasDocuments?: boolean;
  /** Free-text query across visible transaction fields. */
  q?: string;
  expand?: readonly E[];
  sort?: TransactionSortField;
  order?: 'asc' | 'desc';
  limit?: number;
  cursor?: string;
  withCount?: boolean;
}

/** The project-scoped transactions namespace: `sat.projects(p).transactions`. */
export class TransactionsResource {
  constructor(
    private readonly t: Transport,
    private readonly projectId: string,
  ) {}

  /** List transactions (keyset-paginated async iterator), with typed expand widening. */
  list<E extends TransactionExpandKey = never>(
    params: TransactionListParams<E> = {},
  ): List<Expanded<Transaction, TransactionExpandMap, E>> {
    const options = {
      query: {
        projectId: this.projectId,
        source: params.source,
        type: params.type,
        status: params.status,
        isReversal: params.isReversal,
        contactId: params.contactId,
        budgetLineId: params.budgetLineId,
        purchaseOrderId: params.purchaseOrderId,
        currency: params.currency,
        dateFrom: params.dateFrom,
        dateTo: params.dateTo,
        amountMin: params.amountMin,
        amountMax: params.amountMax,
        isItemized: params.isItemized,
        merchant: params.merchant,
        hasDocuments: params.hasDocuments,
        q: params.q,
        expand: serializeExpand(params.expand),
        sort: params.sort,
        order: params.order,
        limit: params.limit,
        cursor: params.cursor,
        withCount: params.withCount,
      },
    };
    type Row = Expanded<Transaction, TransactionExpandMap, E>;
    return new List<Row>(
      () => this.t.paginate<typeof options, Row>(sdk.transactionsList, options),
      () => this.t.runPage<typeof options, Row>(sdk.transactionsList, options),
    );
  }

  /** Get a transaction by id, with typed expand widening. */
  async get<E extends TransactionExpandKey = never>(
    txId: string,
    params: { expand?: readonly E[] } = {},
  ): Promise<Expanded<Transaction, TransactionExpandMap, E>> {
    return this.t.run(sdk.transactionsGet, {
      path: { transactionId: txId },
      query: { expand: serializeExpand(params.expand) },
    }) as Promise<Expanded<Transaction, TransactionExpandMap, E>>;
  }

  /** Create a manual transaction. Pass `idempotencyKey` for a safe retry of the billable create. */
  async create(
    body: TransactionManualCreate,
    opts: { idempotencyKey: string },
  ): Promise<Transaction> {
    return this.t.run(sdk.transactionsCreate, {
      headers: { 'Idempotency-Key': opts.idempotencyKey },
      body: { ...body, projectId: body.projectId ?? this.projectId },
    }) as Promise<Transaction>;
  }

  /** Bulk-create manual transactions. */
  async bulkCreate(
    body: TransactionBulkCreate,
    opts: { idempotencyKey: string },
  ): Promise<unknown> {
    return this.t.run(sdk.transactionsCreateBulk, {
      headers: { 'Idempotency-Key': opts.idempotencyKey },
      body: {
        transactions: body.transactions.map((transaction) => ({
          ...transaction,
          projectId: transaction.projectId ?? this.projectId,
        })),
      },
    });
  }

  /** Patch a transaction. */
  async update(txId: string, body: TransactionPatch): Promise<Transaction> {
    return this.t.run(sdk.transactionsUpdate, {
      path: { transactionId: txId },
      body,
    }) as Promise<Transaction>;
  }

  /** Soft-delete a transaction. */
  async delete(txId: string): Promise<void> {
    await this.t.run(sdk.transactionsDelete, {
      path: { transactionId: txId },
    });
  }

  /** Aggregate stats for a transaction filter. */
  async stats(
    params: Omit<TransactionListParams, 'expand' | 'sort' | 'order' | 'limit' | 'cursor' | 'withCount'> & { currency: string },
  ): Promise<TransactionStats> {
    return this.t.run(sdk.transactionsStats, {
      query: { ...params, projectId: this.projectId },
    }) as Promise<TransactionStats>;
  }

  /** Itemized lines on a transaction. */
  get items(): TransactionItemsResource {
    return new TransactionItemsResource(this.t);
  }
}

export class TransactionItemsResource {
  constructor(
    private readonly t: Transport,
  ) {}

  list(txId: string): List<TransactionItem> {
    const options = {
      path: { transactionId: txId },
    };
    return new List<TransactionItem>(
      () => this.t.paginate<typeof options, TransactionItem>(sdk.transactionsListItems, options),
      () => this.t.runPage<typeof options, TransactionItem>(sdk.transactionsListItems, options),
    );
  }

  /** Add a transaction item. Pass `idempotencyKey` for a safe retry of the billable create. */
  async create(
    txId: string,
    body: TransactionItemCreate,
    opts: { idempotencyKey: string },
  ): Promise<TransactionItem> {
    return this.t.run(sdk.transactionsCreateItem, {
      path: { transactionId: txId },
      headers: { 'Idempotency-Key': opts.idempotencyKey },
      body,
    }) as Promise<TransactionItem>;
  }

  async update(txId: string, itemId: string, body: TransactionItemPatch): Promise<TransactionItem> {
    return this.t.run(sdk.transactionsUpdateItem, {
      path: { transactionId: txId, itemId },
      body,
    }) as Promise<TransactionItem>;
  }

  async delete(txId: string, itemId: string): Promise<void> {
    await this.t.run(sdk.transactionsDeleteItem, {
      path: { transactionId: txId, itemId },
    });
  }
}
