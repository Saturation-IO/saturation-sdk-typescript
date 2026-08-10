# Saturation TypeScript SDK

[![npm version](https://img.shields.io/npm/v/%40saturationio%2Fsdk?label=npm)](https://www.npmjs.com/package/@saturationio/sdk)
[![CI](https://github.com/Saturation-IO/saturation-sdk-typescript/actions/workflows/ci.yml/badge.svg)](https://github.com/Saturation-IO/saturation-sdk-typescript/actions/workflows/ci.yml)

The official TypeScript client for the [Saturation API](https://docs.saturation.io).

> The SDK is in public alpha. Pin the alpha tag while the API and client surface
> settle before the first stable release.

The SDK works in Node.js 18 or newer and modern browsers. It ships ESM,
CommonJS, and TypeScript declarations.

## Install

```console
npm install @saturationio/sdk@alpha
```

```console
pnpm add @saturationio/sdk@alpha
```

## Get started

Create a personal token in Saturation under **Settings > Developers > API**.
The token selects one workspace and carries your permissions in that workspace.

```ts
import { Saturation } from '@saturationio/sdk';

const sat = new Saturation({
  token: process.env.SATURATION_TOKEN!,
});

const me = await sat.me();
console.log(me.email);

for await (const project of sat.projects.list()) {
  console.log(project.id, project.name);
}
```

Keep tokens out of source control. The SDK sends the token as an
`Authorization: Bearer <token>` header on each request.

## Work with a project

Open a project scope with a project ID or slug, then use its resources:

```ts
const project = sat.projects('feature-film-2026');

for await (const line of project.budget.lines.list({ kind: 'line' })) {
  console.log(line.code, line.name);
}

for await (const transaction of project.transactions.list({ status: 'posted' })) {
  console.log(transaction.id, transaction.amount);
}
```

The client follows cursor pagination while you iterate. Use `.page()` when you
need one response page or `.all()` when the result set is small enough to hold
in memory.

```ts
const page = await project.transactions.list({ withCount: true }).page();
console.log(page.data.length, page.count, page.nextCursor);

const contacts = await sat.contacts.list({ q: 'acme' }).all();
```

## Create and update records

Creates that can produce duplicate records require an idempotency key. Reuse
the same key when retrying the same request.

```ts
const transaction = await project.transactions.create(
  {
    type: 'Invoice',
    amount: { amount: 152900, currency: 'USD' },
    timestamp: new Date().toISOString(),
  },
  { idempotencyKey: crypto.randomUUID() },
);

await project.transactions.update(transaction.id, {
  merchant: 'Camera Rental Co.',
});
```

Money uses integer minor units with an ISO 4217 currency. In the example above,
`152900` USD means `$1,529.00`.

## Handle errors

Non-2xx responses throw `SaturationError`. Use `code` for program logic and
include `requestId` when contacting support.

```ts
import { SaturationError } from '@saturationio/sdk';

try {
  await sat.contacts.get('con_missing');
} catch (error) {
  if (error instanceof SaturationError) {
    console.error(error.code, error.message, error.requestId);
  } else {
    throw error;
  }
}
```

## Expand related records

The return type widens when you request a related record. Expanded fields are
present in the type, and fields you did not request stay absent.

```ts
const line = await project.budget.lines.get('lin_3d77', {
  expand: ['contact', 'documents'],
});

console.log(line.contact.name);
console.log(line.documents.length);
```

## Client shape

| Scope | Examples |
| --- | --- |
| Workspace | `sat.library`, `sat.documents`, `sat.contacts`, `sat.spaces`, `sat.search()`, `sat.me()` |
| Project | `sat.projects(id).budget`, `.transactions`, `.purchaseOrders`, `.library`, `.search()` |

The token is bound to one workspace, so workspace IDs do not appear in resource
paths. The workspace Library is the source. A project's Library contains the
packs and programs installed in that project.

## Configuration

```ts
const sat = new Saturation({
  token: process.env.SATURATION_TOKEN!,
  baseURL: 'https://next-api.saturation.io/v1',
});
```

`baseURL` defaults to `https://next-api.saturation.io/v1`. Override it only for
a matching local or staging API.

## Documentation for tools and agents

- [API guides](https://docs.saturation.io)
- [OpenAPI contract](https://docs.saturation.io/openapi.yaml)
- [Agent documentation index](https://docs.saturation.io/llms.txt)
- [Complete agent documentation](https://docs.saturation.io/llms-full.txt)

The generated types come from the same OpenAPI contract used by the API docs.

## Development

Install Node.js 18 or newer and pnpm 10.26.2, then run:

```console
pnpm install --frozen-lockfile
pnpm typecheck
pnpm test
pnpm build
npm pack --dry-run
```

The repository includes an OpenAPI snapshot at `openapi/openapi.yaml`. Files in
`src/generated` and the `src/mutate/*.gen.ts` files are generated. Update the
snapshot from the published OpenAPI contract, then regenerate and verify:

```console
curl --proto '=https' --tlsv1.2 -fsSL \
  https://docs.saturation.io/openapi.yaml \
  --output openapi/openapi.yaml
pnpm generate
pnpm generate:check
```

`pnpm generate:check` fails when committed generated files do not match the
snapshot. See [CONTRIBUTING.md](CONTRIBUTING.md) for the pull request checklist.

## License

See [LICENSE](LICENSE).
