# @saturation/sdk

The official TypeScript SDK for the [Saturation](https://saturation.io) Public API (`/v1`) — the metered, token-authenticated surface for production-finance data: budgets, transactions, purchase orders, documents, the Library (rates, incentives, fringes, globals, currencies, tags, units), search and outbound webhooks.

The SDK is a thin, fully typed layer over the API's OpenAPI contract. All types are generated from that contract, so the surface always matches the live API. The ergonomic client adds resource namespaces, transparent keyset pagination, typed `expand` with return-type widening, typed document targets, and a status-keyed error model.

- Works in Node.js (18+) and the browser.
- Ships ESM, CommonJS, and TypeScript declarations.
- No floating casts, no `?.` sprawl: an expanded relation is present in the type; an un-expanded one is absent.

## Install

```bash
pnpm add @saturation/sdk
# or: npm install @saturation/sdk
```

## Authentication

The API authenticates with a single header — `Authorization: Bearer <token>`. A token acts **as a user** (or a workspace-owned service identity) and inherits that principal's live permissions in the workspace. Permissions resolve per request, so a token stops working the instant its principal loses access.

Mint a token in the Saturation app under **Settings → Developers**. Treat it like a password: it carries the full reach of the principal it was issued for.

## Quickstart

```ts
import { Saturation, SaturationError } from '@saturation/sdk';

// Inject the token once. The token determines the workspace.
const sat = new Saturation({
  token: process.env.SATURATION_TOKEN!,
});

// Confirm who the token is and which workspace it can reach.
const me = await sat.me();

// Open a project scope, then read its budget lines (keyset-paginated).
const project = sat.projects('feature-film-2026'); // accepts a slug or prj_… id
for await (const line of project.budget.lines.list({ kind: 'line' })) {
  console.log(line.name, line.code);
}

// Write a transaction; non-2xx throws a typed error.
try {
  const tx = await project.transactions.create({
    type: 'Invoice',
    amount: { amount: 152900, currency: 'USD' }, // integer minor units
    timestamp: new Date().toISOString(),
  });
  console.log('created', tx.id);
} catch (err) {
  if (err instanceof SaturationError) {
    console.error(err.code, err.message, err.requestId);
  }
}
```

## The shape of the client

The grammar mirrors the API routes and the product UI exactly:

| Scope | Reach |
| --- | --- |
| Workspace | `sat.library.*`, `sat.documents.*`, `sat.contacts.*`, `sat.spaces.*`, `sat.search(q)`, `sat.me()`, `sat.workspaces()` |
| Project | `sat.projects(p).budget.*`, `.transactions.*`, `.library.*`, `.search(q)` |

The token is bound to one workspace, so there is no workspace id to configure or pass per call. The two-scope Library is visible at the call site: `sat.library.*` is the workspace **source**, `sat.projects(p).library.*` is the project-**resident** copy.

## Examples

### The two-scope Library

Packs are enabled at the workspace, then installed into a project (copy-on-use).

```ts
// Workspace source: enable a rate pack so projects can install it.
await sat.library.rates.enable('rtp_iatse_2026');

// Project resident: install the enabled pack, then add an incentive program.
const project = sat.projects('prj_8a12');
await project.library.rates.install('rtp_iatse_2026');
await project.library.incentives.add({ programId: 'inc_ga_film_30' });
```

### Typed `expand` with return-type widening

An expanded relation is **present and non-optional** in the return type. A relation you did not expand is **absent** — accessing it is a compile error, not a silent `undefined`.

```ts
const line = await project.budget.lines.get('lin_3d77', {
  expand: ['contact', 'documents'],
});

line.contact.name;        // OK — `contact` was expanded, no `?.` needed
line.documents.length;    // OK — `documents` is present

const lean = await project.budget.lines.get('lin_3d77');
// @ts-expect-error — `contact` was not expanded, so it is not on the type.
lean.contact;
```

### Pagination

`list()` returns a value that is both an async-iterable over **every** row (it follows `nextCursor` for you, capped at 100 per page) and awaitable to a single raw page.

```ts
// Iterate every matching transaction across all pages.
for await (const tx of project.transactions.list({ source: 'journal', status: 'posted' })) {
  console.log(tx.id, tx.amount);
}

// Or take one raw page when you want the cursor and count yourself.
const page = await project.transactions.list({ withCount: true }).page();
console.log(page.data.length, page.count, page.nextCursor);

// Or collect everything into an array (use with care on large sets).
const all = await sat.contacts.list({ q: 'acme' }).all();
```

### Drop a document, then assign it to a typed target

Documents are dropped once, then assigned to a typed `{ transaction | budgetLine | purchaseOrder | contact | project }` target — never a hand-built address.

```ts
const doc = await sat.documents.drop({ file: invoiceFile });

await sat.documents.assign(doc.id, { transaction: 'txn_8f2a1c9e' });
// Move it to a budget line instead (an explicit move needs replace: true):
await sat.documents.assign(doc.id, { budgetLine: 'lin_3d77' }, { replace: true });

const assignments = await sat.documents.assignments(doc.id);
```

### Read a positional cell

Cells are read by explicit `{ account, column }` coordinates — the internal address grammar is never exposed.

```ts
const cell = await project.budget.cells.get({ account: '1100/1110', column: 'estimate' });
console.log(cell.value.combined, cell.computedAt); // engine truth + freshness
```

### Idempotent retries

Lifecycle verbs (`enable` / `disable`, `install` / `uninstall`, `add`) are idempotent and safe to re-run. Unsafe creates accept an `Idempotency-Key` so a network retry never double-writes; replaying the same key with a different body surfaces `idempotency_conflict`.

```ts
const key = crypto.randomUUID();
try {
  await project.transactions.create(
    { type: 'Invoice', amount: { amount: 50000, currency: 'USD' }, timestamp: now },
    { idempotencyKey: key },
  );
} catch (err) {
  if (err instanceof SaturationError && err.isIdempotencyConflict) {
    // The same key was already used with a different body.
  }
}
```

### Error handling

Success is the bare resource (or a `{ data, nextCursor }` page) — there is no `success: true` wrapper. The client keys success off the HTTP status and throws a `SaturationError` on anything else, carrying the typed `code`, the human-readable `message`, the `requestId` to quote in support tickets, and `fieldErrors` on validation failures.

```ts
try {
  await sat.contacts.update('con_404', { name: 'New' });
} catch (err) {
  if (err instanceof SaturationError) {
    err.code;          // e.g. 'not_found' | 'permission_revoked' | 'validation'
    err.status;        // the HTTP status
    err.requestId;     // correlate with usage logs / support
    err.fieldErrors;   // { field: string[] } on validation errors
    err.requiredAbility; // on permission_revoked: the missing action:subject
  }
}
```

`404 not_found` is returned for exists-but-unauthorized as well, so existence never leaks.

## Configuration

```ts
new Saturation({
  token: '…',          // required: Bearer token (acts as a user)
  baseURL: '…',        // optional: override for local/staging
});
```

| Option | Default |
| --- | --- |
| `baseURL` | `https://api.saturation.io/v1` |

## Conventions

- **Money** is always an integer count of minor units plus an explicit ISO-4217 `currency` (`{ amount: 152900, currency: 'USD' }`) — never a float.
- **Dates** are ISO-8601 strings.
- **Identifiers** are stable, prefixed strings (`ws_…`, `prj_…`, `txn_…`, `lin_…`, `doc_…`). The internal domain address is never exposed.
- **Pagination** caps at `limit` 100 (default 50).

## Regenerating types

The generated layer (`src/generated/`) is produced from the OpenAPI document and must not be edited by hand. To refresh it after the contract changes:

```bash
pnpm generate
```

## License

Proprietary. See [LICENSE](./LICENSE).
