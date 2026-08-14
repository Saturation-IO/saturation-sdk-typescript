# @saturationio/sdk

The TypeScript SDK for the [Saturation API](https://docs.saturation.io). Read and
write budgets, transactions, documents, contacts, purchase orders, payments, and
Library data through typed workspace and project resources.

## Install

```bash
npm install @saturationio/sdk@alpha
```

## Create a client

Create a token under **Settings > Developers > API** and keep it on the server.

```ts
import { Saturation } from '@saturationio/sdk';

const sat = new Saturation({
  token: process.env.SATURATION_TOKEN!,
});

const projects = await sat.projects.list().page();
```

The token selects one workspace. Requests use the token identity's current
permissions. Never embed a token in a browser bundle.

## Client structure

Workspace resources live on `sat`. Project resources live on a project handle:

```ts
const project = sat.projects('feature-film-2026');

await sat.contacts.get('con_123');
await project.budget.get();
await project.transactions.get('txn_123');
```

The common grammar is `list`, `get`, `create`, `update`, and `delete`. Bulk
writes put the verb first, such as `createBulk`. Special reads say what they
return, such as `getStats` and `getContent`. Child collections bind their parent:
`sat.purchaseOrders.timeline(id).list()` and `project.transactions.items(id).list()`.

## Read collections

Collection methods return a `List`. Iterate through every page, fetch one page,
or collect all rows.

```ts
for await (const transaction of project.transactions.list({ status: 'posted' })) {
  console.log(transaction.id, transaction.amount);
}

const page = await project.transactions.list({ withCount: true }).page();
const contacts = await sat.contacts.list({ q: 'Acme' }).all();
```

`page()` fetches one page. Async iteration and `all()` follow `nextCursor` until
the collection ends.

## Expand related data

Expanded fields become required in the returned TypeScript type.

```ts
const projectWithBrief = await sat.projects.get('feature-film-2026', {
  expand: ['assumptions'],
});

const line = await project.budget.lines.get('lin_123', {
  expand: ['contact', 'phaseData', 'phaseTotals'],
});

console.log(projectWithBrief.assumptions, line.contact);
```

## Write data

Methods that require an idempotency key take it as a second argument. Reuse the
same key when retrying the same request.

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

Money uses integer minor units. Dates use ISO 8601 strings. List cursors are
opaque and must be passed back unchanged.

## Documents and Library data

```ts
const document = await sat.documents.upload(
  { file: invoiceFile },
  { idempotencyKey: crypto.randomUUID() },
);

await sat.documents.link(document.id, { transaction: transaction.id });
await sat.library.ratePacks.enable('rtp_iatse_2026');
await project.library.incentives.add({ programId: 'inc_ga_film_30' });
```

## Handle errors

Non-2xx responses throw `SaturationError`. Include `requestId` when contacting
support.

```ts
import { SaturationError } from '@saturationio/sdk';

try {
  await sat.contacts.get('con_missing');
} catch (error) {
  if (error instanceof SaturationError) {
    console.error(error.status, error.code, error.requestId);
  }
}
```

## Build with an AI coding agent

Give your coding agent access to this repository and use this prompt:

```text
I am building a TypeScript app with @saturationio/sdk. Read this README, the
exported types, and the Bidbook demo to understand the available resources and
how they fit together.
```

See [Bidbook](demos/bidbook), or [open the live demo](https://bidbook-sdk-demo.saturation.io).

## Development

Generated files under `src/generated/` come from the OpenAPI contract. Run
`pnpm generate:check`, `pnpm typecheck`, `pnpm test`, and `pnpm build` before
opening a pull request.

## License

[MIT](LICENSE)
