# Contributing

Thanks for helping improve the Saturation TypeScript SDK.

## Development

Install Node.js 18 or newer and pnpm 10.26.2, then run:

```console
pnpm install --frozen-lockfile
pnpm generate:check
pnpm typecheck
pnpm test
pnpm build
npm pack --dry-run
```

Keep changes focused. Add a regression test for behavior changes and update the
README when the public client surface changes.

## OpenAPI client

The repository includes the API contract snapshot at `openapi/openapi.yaml`.
Update it from `https://docs.saturation.io/openapi.yaml`, then run:

```console
pnpm generate
pnpm generate:check
```

Commit the snapshot and generated files together. Do not edit files under
`src/generated` or files named `*.gen.ts` by hand.

## Pull requests

Explain the user-visible change and list the checks you ran. Generated changes
should identify the OpenAPI source used for the snapshot.

## Security

Report suspected vulnerabilities through the private process in
[SECURITY.md](SECURITY.md).
