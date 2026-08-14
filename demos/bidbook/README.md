# Bidbook

Bidbook turns a Saturation project into a client-ready proposal.

[Live demo](https://bidbook-sdk-demo.saturation.io) · [Saturation SDK](../../README.md)

![Bidbook reads a project brief and budget through the Saturation SDK](public/bidbook-demo.gif)

## What it demonstrates

A custom Next.js app can use Saturation as its production data layer. Bidbook
reads the selected project's brief, budget, and comments through the TypeScript
SDK, then presents them as a proposal.

```ts
const project = await sat.projects.get(projectId, {
  expand: ['assumptions'],
});
const budget = await sat.projects(projectId).budget.document();
const comments = await sat.projects(projectId).comments.list().all();
```

## Run it

```bash
git clone https://github.com/Saturation-IO/saturation-sdk-typescript.git
cd saturation-sdk-typescript/demos/bidbook
npm install
npm run dev
```

Create a token under **Settings > Developers > API** in Saturation and paste it
into Bidbook.

To host the app without its connection screen, set these server variables:

```bash
SATURATION_API_TOKEN=your-token
SATURATION_API_URL=https://next-api.saturation.io
```

The token is read only by the Next.js server route.
