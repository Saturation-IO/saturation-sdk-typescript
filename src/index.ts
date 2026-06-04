/**
 * @saturation/sdk — the official TypeScript SDK for the Saturation API (`/v1`).
 *
 * Types are generated from the OpenAPI 3.1 document (`src/generated`, do-not-edit);
 * the ergonomic client below is hand-written on top.
 */

// Root client + scopes.
export { Saturation, ProjectScope } from './saturation.js';
export type { SaturationOptions, ProjectsAccessor } from './saturation.js';

// Error model (§5d): typed, status-keyed.
export { SaturationError } from './errors.js';
export type { ErrorCode } from './errors.js';

// Pagination primitives.
export { List } from './http.js';
export type { Page } from './http.js';

// Document assign targets (typed `{ transaction | purchaseOrder | … }` refs).
export type { AssignTarget } from './resources/documents.js';

// Phase write bodies, derived from the generated operation Data types.
export type { BudgetPhaseCreate, BudgetPhaseUpdate } from './resources/budget.js';

// Expand widening helpers (advanced; most callers only touch the typed unions).
export type { Expanded, ExpandMap } from './expand.js';

// Re-export the generated domain types so callers get `BudgetLine`, `Transaction`,
// `Money`, the expand-key unions, etc. without reaching into `./generated`.
export type * from './generated/types.gen.js';
