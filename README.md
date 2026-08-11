# @saturationio/sdk

The official TypeScript client for the [Saturation Public API](https://docs.saturation.io). It provides typed access to budgets, transactions, purchase orders, payments, documents, contacts, the Library, comments, search, and webhooks.

- Node.js 18 or later and modern browsers
- ESM, CommonJS, and TypeScript declarations
- Types generated from the OpenAPI contract
- Resource-based helpers for pagination, expansion, writes, and errors

## Install

```bash
pnpm add @saturationio/sdk
# or
npm install @saturationio/sdk
```

## Create a client

Create a token in Saturation under **Settings > Developers > API**, then set it in your environment:

```bash
export SATURATION_TOKEN="your-token"
```

```ts
import { Saturation } from '@saturationio/sdk';

const sat = new Saturation({
  token: process.env.SATURATION_TOKEN!,
});

const me = await sat.me();
const projects = await sat.projects.list({ limit: 10 }).page();

console.log(me.workspaces[0]?.workspaceName);
for (const project of projects.data) {
  console.log(project.name, project.id);
}
```

The token selects one workspace. You do not pass a workspace ID with each request. Tokens use the current permissions of their user or service identity, so removing access takes effect on the next request.

## Client structure

The client follows the same workspace and project hierarchy as Saturation:

| Scope | Resources |
| --- | --- |
| Workspace | `sat.projects`, `sat.library`, `sat.contacts`, `sat.spaces`, `sat.documents`, `sat.purchaseOrders`, `sat.paymentRequests`, `sat.payments`, `sat.webhooks`, `sat.search()`, `sat.me()` |
| Project | `sat.projects(id).budget`, `.transactions`, `.purchaseOrders`, `.paymentRequests`, `.payments`, `.library`, `.comments`, `.search()` |

Project handles accept a project ID or slug:

```ts
const project = sat.projects('prj_8a12');
const sameProject = sat.projects('feature-film-2026');
```

## Read data

### Pagination

Collection methods return a `List`. Iterate through every page, fetch one page, or collect all rows.

```ts
const project = sat.projects('feature-film-2026');

for await (const tx of project.transactions.list({
  source: 'manual',
  status: 'posted',
})) {
  console.log(tx.id, tx.amount);
}

const page = await project.transactions.list({ withCount: true }).page();
console.log(page.data, page.nextCursor, page.count);

const contacts = await sat.contacts.list({ q: 'Acme' }).all();
```

`page()` fetches one page. Async iteration and `all()` follow `nextCursor` until the collection ends. Page size defaults to 50 and cannot exceed 100.

### Expand related data

`expand` adds related records to the response type. Unexpanded relations stay absent from the type.

```ts
const line = await project.budget.lines.get('lin_3d77', {
  expand: ['contact', 'phaseData', 'phaseTotals'],
});

line.contact;
line.phaseData;
line.phaseTotals;

const leanLine = await project.budget.lines.get('lin_3d77');
// @ts-expect-error: contact was not expanded
leanLine.contact;
```

### Read budget data

Phase data contains editable values. Totals come from the budget engine.

```ts
await project.budget.lines.upsertPhaseData('lin_3d77', 'phase_estimate', {
  quantity: 5,
  rate: 12000,
});

const totals = await project.budget.totals.get({ phase: 'phase_estimate' });
console.log(totals.totals, totals.computedAt);
```

## Write data

Methods that require an idempotency key take it as a second argument. Reuse the key when retrying the same request.

```ts
const transaction = await project.transactions.create(
  {
    type: 'Invoice',
    amount: { amount: 152900, currency: 'USD' },
    timestamp: new Date().toISOString(),
    description: 'Camera rental',
  },
  { idempotencyKey: crypto.randomUUID() },
);
```

Reusing a key with a different request body returns `idempotency_conflict`.

### Link a document

Upload a document once, then link it to a typed target. A document can have one link of each kind.

```ts
const document = await sat.documents.upload(
  { file: invoiceFile },
  { idempotencyKey: crypto.randomUUID() },
);

await sat.documents.link(document.id, { transaction: transaction.id });
await sat.documents.link(document.id, { purchaseOrder: 'po_3d77' });

const currentLinks = (await sat.documents.get(document.id)).links;
```

Use `{ replace: true }` to replace an existing link of the same kind:

```ts
await sat.documents.link(
  document.id,
  { transaction: 'txn_replacement' },
  { replace: true },
);
```

### Use the Library

The workspace Library contains reusable sources. A project's Library contains the items added to that project.

```ts
await sat.library.ratePacks.enable('rtp_iatse_2026');

await project.library.ratePacks.add('rtp_iatse_2026');
await project.library.incentives.add({ programId: 'inc_ga_film_30' });
```

### Update comment reactions

`reactionEmojis` replaces the current user's reactions and leaves other users unchanged.

```ts
await project.comments.update('cmt_123', {
  reactionEmojis: ['👍', '🎬'],
});
```

Send an empty array to remove your reactions.

## Handle errors

Non-2xx responses throw `SaturationError`. Branch on `code`, and include `requestId` when contacting support.

```ts
import { SaturationError } from '@saturationio/sdk';

try {
  await sat.contacts.update('con_missing', { name: 'New name' });
} catch (error) {
  if (error instanceof SaturationError) {
    console.error(error.status, error.code, error.message, error.requestId);
    console.error(error.fieldErrors);
    console.error(error.retryAfter);
  }
}
```

Success responses return the resource or collection page directly. They do not use a `success: true` wrapper.

## Configuration

```ts
const sat = new Saturation({
  token: 'your-token',
  baseURL: 'http://127.0.0.1:4300/v1',
});
```

`baseURL` defaults to `https://next-api.saturation.io/v1`. The SDK also accepts a custom `fetch` implementation through the constructor.

## Data conventions

- Money uses integer minor units and an ISO 4217 currency code: `{ amount: 152900, currency: 'USD' }`.
- Dates use ISO 8601 strings.
- IDs use prefixed strings such as `prj_`, `txn_`, `lin_`, and `doc_`.
- List cursors are opaque. Pass `nextCursor` back unchanged.

## Development and releases

Generated files under `src/generated/` come from the canonical OpenAPI contract. Do not edit them by hand.

Run the package checks before opening a pull request:

```bash
pnpm install --frozen-lockfile
pnpm typecheck
pnpm test
pnpm build
npm pack --dry-run
```

Publishing a GitHub release runs the same checks, then publishes the matching package version to npm. See the [API documentation](https://docs.saturation.io) for the HTTP contract.

## License

[MIT](LICENSE)
