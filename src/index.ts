/**
 * @saturationio/sdk - the official TypeScript SDK for the Saturation API (`/v1`).
 *
 * Types are generated from the OpenAPI 3.1 document. The resource client adds
 * project scopes, pagination, and typed expansions.
 */

// Root client + scopes.
export { Saturation, ProjectScope } from './saturation.js';
export type { SaturationOptions, ProjectsAccessor } from './saturation.js';

// Typed, status-keyed errors.
export { SaturationError } from './errors.js';
export type { ErrorCode } from './errors.js';

// Pagination primitives.
export { List } from './http.js';
export type { Page, FetchLike } from './http.js';

// Document link targets.
export type { DocumentListParams, LinkTarget } from './resources/documents.js';

// Phase write bodies, derived from the generated operation Data types.
export type {
  Budget,
  BudgetGetLineParams,
  BudgetGetParams,
  BudgetLineListParams,
  BudgetPhaseCreate,
  BudgetPhaseUpdate,
  BudgetTotalsParams,
} from './resources/budget.js';
export type { ContactListParams, ProjectListParams, SearchParams } from './resources/core.js';
export type { CommentListParams } from './resources/extras.js';
export type { PaymentListParams, PaymentRequestListParams } from './resources/payments.js';
export type { PurchaseOrderListParams } from './resources/purchase-orders.js';
export type {
  ProjectTransactionBulkCreate,
  ProjectTransactionCreate,
  TransactionListParams,
} from './resources/transactions.js';

// Expand widening helpers (advanced; most callers only touch the typed unions).
export type { Expanded, ExpandMap } from './expand.js';

// Re-export the generated domain types so callers get `BudgetLine`, `Transaction`,
// `Money`, the expand-key unions, etc. without reaching into `./generated`.
export type * from './generated/types.gen.js';
