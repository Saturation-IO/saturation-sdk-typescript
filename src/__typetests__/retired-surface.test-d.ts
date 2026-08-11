import { Saturation } from '../index.js';
import * as generated from '../generated/sdk.gen.js';

declare const sat: Saturation;
const project = sat.projects('project_1');

// Positive checks pin the replacement resource grammar.
sat.library.ratePacks.list();
project.library.ratePacks.list();
project.comments.list();
sat.documents.link('doc_1', 'transaction', 'txn_1');
project.transactions.bulkCreate({ transactions: [] }, { idempotencyKey: '0123456789abcdef' });
project.purchaseOrders.linkTransaction('po_1', 'txn_1');

// @ts-expect-error Project deletion is not public.
sat.projects.delete('project_1');
// @ts-expect-error Comments are project-owned.
sat.comments;
// @ts-expect-error Saved views are not a public resource.
project.views;
// @ts-expect-error Project document reverse routes were removed.
project.documents;
// @ts-expect-error Workspace discovery was removed.
sat.workspaces();
// @ts-expect-error API health is not an SDK resource.
sat.health();
// @ts-expect-error Budget rollup is not a public route.
project.budget.rollup();
// @ts-expect-error Budget variance is not a public route.
project.budget.variance();
// @ts-expect-error Cell transport routes are retired.
project.budget.cells;
// @ts-expect-error Account transport routes are retired.
project.budget.accounts;
// @ts-expect-error Batch naming is retired.
project.budget.lines.createBatch([]);
// @ts-expect-error Batch naming is retired.
project.budget.phaseData.upsertBatch([]);
// @ts-expect-error Transaction batch naming is retired.
project.transactions.batchCreate({ transactions: [] }, { idempotencyKey: '0123456789abcdef' });
// @ts-expect-error Transaction type discovery is retired.
project.transactions.types();
// @ts-expect-error Rate packs use their public noun.
sat.library.rates;
// @ts-expect-error Fringe tags are not public.
sat.library.fringeTags;
// @ts-expect-error Units are unified without a custom subresource.
sat.library.units.custom;
// @ts-expect-error Document assignments were replaced by typed links.
sat.documents.assign('doc_1', { transaction: 'txn_1' });
// @ts-expect-error Document link collections are inline and have no list route.
sat.documents.assignments('doc_1');
// @ts-expect-error PO activity is exposed through expanded purchase orders.
project.purchaseOrders.activity('po_1');
// @ts-expect-error Suggested matches are not a public route.
project.purchaseOrders.suggestedMatches('po_1');
// @ts-expect-error Old PO link helper is retired.
project.purchaseOrders.link('po_1', { transactionId: 'txn_1' });
// @ts-expect-error Removed operation cannot reappear in generated code.
generated.masterDataDeleteProject;
// @ts-expect-error Removed operation cannot reappear in generated code.
generated.documentsListAssignments;
// @ts-expect-error Removed operation cannot reappear in generated code.
generated.masterDataListViews;
