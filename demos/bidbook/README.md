# Bidbook

Bidbook turns a live Saturation budget into a client-ready proposal.

[Open the live demo](https://bidbook-sdk-demo.saturation.io)

![Bidbook reads a project brief and budget through the Saturation SDK](public/bidbook-demo.gif)

[Watch the high-quality MP4](public/bidbook-demo.mp4)

It is a small Next.js app built on [`@saturationio/sdk`](../../README.md). Connect
an API token, choose a project, and Bidbook presents its brief, estimate, account
breakdown, and production notes as one shareable document.

The demo shows how Saturation can be the data layer for software you build
around production finance. The UI is custom. The project data stays in
Saturation.

## What it uses

Bidbook reads four public SDK resources:

```ts
const sat = new Saturation({ token });

const projects = await sat.projects.list({ limit: 100 }).all();
const project = await sat.projects.get(projectId, {
  expand: ['assumptions'],
});
const budget = await sat.projects(projectId).budget.document();
const comments = await sat.projects(projectId).comments.list().all();
```

From those calls, the app builds:

- a project cover with the current estimate total
- the pinned project brief
- an expandable account and line-item breakdown
- production comments and budget provenance

There is no demo database and no copied budget model. Reload the project in
Saturation and Bidbook reads the current result.

## Run it

From this directory:

```bash
npm install
npm run dev
```

Open [http://localhost:4600](http://localhost:4600).

Create a token in Saturation under **Settings > Developers > API**, then paste
it into the connection screen. The token stays in session storage and is
cleared when you disconnect or close the tab.

By default, the app sends requests through its same-origin Next.js proxy to
`http://localhost:4300`. To use another Saturation API origin:

```bash
SATURATION_API_URL=https://next-api.saturation.io npm run dev
```

The advanced connection field can point the browser directly at a local or
staging API when needed.

To host one project without showing the connection screen, set these variables
on the server:

```bash
SATURATION_API_TOKEN=your-read-only-token
SATURATION_API_URL=https://next-api.saturation.io
```

The token stays in the server route. Bidbook exposes only the read requests
used by the project picker and bid view. Without these variables, the
connection screen works as before.

## Make it yours

The demo is intentionally small. Replace the presentation, choose different
resources, or add a workflow of your own. The SDK provides typed access to the
same projects, budgets, transactions, purchase orders, payments, documents,
contacts, comments, search, and webhooks used by Saturation.

Start with [`src/app/page.tsx`](src/app/page.tsx) for connection and project
selection. The document view lives in
[`src/components/Bidbook.tsx`](src/components/Bidbook.tsx).

See the [SDK README](../../README.md) for authentication, pagination, writes,
errors, and the full client structure.
