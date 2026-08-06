import { defineConfig } from '@hey-api/openapi-ts';

/**
 * Fresh @hey-api/openapi-ts config authored against the current plugin model.
 *
 * Deliberate departures from the legacy `@saturation-api/js` config:
 *  - NO `services.asClass` — the current @hey-api plugin model emits the flat
 *    `sdk.gen.ts` shape; the legacy `asClass` flag was stale and no longer
 *    matched its own committed output.
 *  - Version is PINNED in package.json (legacy floated `^0.80.8`), so a
 *    regeneration is reproducible across machines and CI.
 *
 * The single source of truth is the v1 OpenAPI 3.1 document. Everything under
 * `src/generated/` is do-not-edit; the ergonomic client in `src/resources/`
 * and `src/saturation.ts` is the hand-written layer on top.
 */
export default defineConfig({
  input:
    '../../docs/next/next-api-build/openapi/openapi.yaml',
  output: {
    path: './src/generated',
    // Emit `.js` import extensions so the generated ESM resolves under the
    // package's `nodenext` module resolution (matches how the build emits ESM/CJS).
    importFileExtension: '.js',
  },
  plugins: ['@hey-api/client-fetch', '@hey-api/typescript', '@hey-api/sdk'],
});
