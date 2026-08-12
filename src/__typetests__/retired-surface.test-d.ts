import type { Saturation } from '../saturation.js';

declare const sat: Saturation;
const project = sat.projects('prj_1');

// The ergonomic SDK must not preserve aliases for retired public operations.
// @ts-expect-error: views are not public resources.
project.views;
// @ts-expect-error: owner-specific document collections were replaced by linkedTo.
project.documents;
// @ts-expect-error: fringe tags are public fringe groups.
sat.library.fringeTags;
// @ts-expect-error: rate packs use their product name.
sat.library.rates;
// @ts-expect-error: units are one resource, not a custom subresource.
sat.library.units.custom();
// @ts-expect-error: positional cells are not public reads.
project.budget.cells;
// @ts-expect-error: rollup is represented by totals with a phase filter.
project.budget.rollup('phase_1');
// @ts-expect-error: transaction imports use bulkCreate.
project.transactions.batchCreate;
// @ts-expect-error: webhook test delivery is not called ping.
sat.webhooks.ping;
// @ts-expect-error: workspace context comes from me().
sat.workspaces;
// @ts-expect-error: health is not part of the public SDK.
sat.health;
// @ts-expect-error: projects cannot be deleted through the public API.
sat.projects.delete;
// @ts-expect-error: documents use link.
sat.documents.assign;
