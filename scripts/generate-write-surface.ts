/**
 * Generate the `mutate` write surface from the generated SDK.
 *
 * The `mutate` tool's model-facing surface is an **explicit write allowlist** over
 * the generated `/v1` SDK — NOT a naive `POST/PUT/PATCH/DELETE` verb filter (some
 * POSTs are state-transition / computed actions, not data writes). This script:
 *
 *   1. Parses the do-not-edit `src/generated/sdk.gen.ts` (one block per operation:
 *      JSDoc summary + `export const <op> = … .<method>({ url: '<url>' … })`).
 *   2. Keeps ONLY the operations whose id is in {@link WRITE_OP_ALLOWLIST} — the
 *      curated v1 set: **CREATE + value-UPDATE, additive only**. Row DELETE and
 *      destructive/lifecycle POSTs (void / disable / remove / unassign / submit /
 *      ping) are excluded by construction (spec §6.1: they gate on the rollback
 *      ledger). Fail-safe: a NEW write op is invisible to the agent until it is
 *      added here, so an un-reviewed mutation can never silently appear.
 *   3. Emits `src/mutate/write-surface.gen.ts`: the typed write-op table the
 *      generic dispatcher and the agent tool description consume.
 *
 * Re-run after any SDK regeneration:  pnpm --filter @saturation/sdk generate:mutate
 *
 * The allowlist is the security boundary; everything else is derived from the
 * spec by code, so the surface cannot drift from the real route set.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const SDK_GEN = join(HERE, '../src/generated/sdk.gen.ts');
const OUT = join(HERE, '../src/mutate/write-surface.gen.ts');

/** HTTP verbs a data write can use. The DELETE verb is intentionally absent in v1. */
type WriteMethod = 'post' | 'put' | 'patch';

/**
 * The explicit v1 write allowlist: CREATE + value-UPDATE, additive only.
 *
 * Curated from the route inventory. Excluded on purpose (NOT a write, or
 * destructive/deferred to the rollback ledger): every `*Delete*`, plus
 * `documentsUnassign`, `purchaseOrdersUnlink/Submit/Finalize/Void/CancelSubmission`,
 * `library{Disable,Remove}*`, and `webhooksPing` (a side-effecting test action,
 * not a data write — the exact "computed POST" a verb filter would leak).
 */
const WRITE_OP_ALLOWLIST: ReadonlySet<string> = new Set<string>([
  // ── budget: create lines/phases, set/upsert phase-data (value edits) ──
  'budgetCreateLine',
  'budgetCreateLinesBatch',
  'budgetCreatePhase',
  'budgetUpsertLinePhaseData',
  'budgetUpsertLinePhaseDataBatch',
  'budgetUpdateLine',
  'budgetUpdatePhase',
  // ── documents: drop (create) + assign (link) + field update ──
  'documentsDrop',
  'documentsAssign',
  'documentsUpdate',
  // ── library: workspace templates + project installs (additive) + field updates ──
  'libraryAddProjectCurrency',
  'libraryAddProjectFringe',
  'libraryAddProjectFringeTag',
  'libraryAddProjectGlobal',
  'libraryAddProjectIncentive',
  'libraryAddProjectTag',
  'libraryAddRatePack',
  'libraryCreateCurrencyTemplate',
  'libraryCreateCustomUnit',
  'libraryCreateFringeTagTemplate',
  'libraryCreateFringeTemplate',
  'libraryCreateGlobalTemplate',
  'libraryCreateRatePack',
  'libraryCreateRatePackItem',
  'libraryCreateTag',
  'libraryEnableIncentivePack',
  'libraryEnableRatePack',
  'libraryUpdateCurrencyTemplate',
  'libraryUpdateCustomUnit',
  'libraryUpdateFringeTagTemplate',
  'libraryUpdateFringeTemplate',
  'libraryUpdateGlobalTemplate',
  'libraryUpdateProjectCurrency',
  'libraryUpdateProjectFringe',
  'libraryUpdateProjectFringeTag',
  'libraryUpdateProjectGlobal',
  'libraryUpdateProjectIncentive',
  'libraryUpdateRatePack',
  'libraryUpdateRatePackItem',
  'libraryUpdateTag',
  // ── master data: contacts / projects / spaces / comments ──
  'masterDataCreateComment',
  'masterDataCreateContact',
  'masterDataCreateProject',
  'masterDataCreateSpace',
  'masterDataUpdateComment',
  'masterDataUpdateContact',
  'masterDataUpdateProject',
  'masterDataUpdateSpace',
  // ── purchase orders: create header/item, link to budget, field updates ──
  'purchaseOrdersCreate',
  'purchaseOrdersCreateItem',
  'purchaseOrdersLink',
  'purchaseOrdersUpdate',
  'purchaseOrdersUpdateItem',
  // ── transactions: create (single + batch), items, field updates ──
  'transactionsCreate',
  'transactionsBatchCreate',
  'transactionsItemsCreate',
  'transactionsUpdate',
  'transactionsItemsUpdate',
  // ── webhooks: create + field update ──
  'webhooksCreate',
  'webhooksUpdate',
]);

interface ParsedOp {
  op: string;
  method: WriteMethod;
  url: string;
  dataType: string;
  summary: string;
}

/** Parse every operation block out of the generated `sdk.gen.ts`. */
function parseOperations(source: string): ParsedOp[] {
  const lines = source.split('\n');
  const ops: ParsedOp[] = [];

  // Matches: export const NAME = <ThrowOnError…>(options: Options<DATA, ThrowOnError>) => (options.client ?? client).METHOD<…>({
  const declRe =
    /^export const (\w+) = <ThrowOnError[^>]*>\(options: Options<(\w+), ThrowOnError>\) => \(options\.client \?\? client\)\.(get|post|put|patch|delete|head|options)</;
  const urlRe = /^\s*url: '([^']+)',/;

  for (let i = 0; i < lines.length; i++) {
    const m = declRe.exec(lines[i]!);
    if (!m) continue;
    const [, op, dataType, method] = m as unknown as [string, string, string, string];

    // The url is on one of the next few lines (after `security:`).
    let url = '';
    for (let j = i + 1; j < Math.min(i + 8, lines.length); j++) {
      const um = urlRe.exec(lines[j]!);
      if (um) {
        url = um[1]!;
        break;
      }
    }

    // The JSDoc summary is the first content line after the nearest `/**` above.
    let summary = '';
    for (let k = i - 1; k >= 0 && k > i - 30; k--) {
      const line = lines[k]!.trim();
      if (line.startsWith('export const')) break; // hit the previous op
      if (line === '*/') {
        // Walk up to the first ` * <text>` line inside this block.
        for (let s = k - 1; s >= 0; s--) {
          const inner = lines[s]!.trim();
          if (inner.startsWith('/**')) break;
          if (inner.startsWith('* ') && inner.length > 2) {
            summary = inner.slice(2).trim();
          }
        }
        break;
      }
    }

    ops.push({ op, method: method as WriteMethod, url, dataType, summary });
  }

  return ops;
}

/** Extract `{param}` path-parameter names from a templated url, in order. */
function pathParams(url: string): string[] {
  return [...url.matchAll(/\{(\w+)\}/g)].map((m) => m[1]!);
}

function main(): void {
  const source = readFileSync(SDK_GEN, 'utf8');
  const all = parseOperations(source);

  // Filter to the explicit allowlist; sort for a stable diff.
  const selected = all
    .filter((o) => WRITE_OP_ALLOWLIST.has(o.op))
    .sort((a, b) => a.op.localeCompare(b.op));

  // Fail loud: every allowlisted op MUST resolve to a real generated operation,
  // and it must be a write verb. A typo'd allowlist entry is a generation bug.
  const found = new Set(selected.map((o) => o.op));
  const missing = [...WRITE_OP_ALLOWLIST].filter((op) => !found.has(op));
  if (missing.length > 0) {
    throw new Error(
      `Allowlisted write ops absent from the generated SDK (typo or removed route): ${missing.join(', ')}`,
    );
  }
  const nonWrite = selected.filter((o) => o.method === ('get' as WriteMethod));
  if (nonWrite.length > 0) {
    throw new Error(
      `Allowlisted ops resolve to a read verb (GET): ${nonWrite.map((o) => o.op).join(', ')}`,
    );
  }

  const entries = selected
    .map((o) => {
      const params = pathParams(o.url);
      const summary = o.summary.replace(/'/g, "\\'");
      return `  ${o.op}: {
    op: '${o.op}',
    method: '${o.method}',
    url: '${o.url}',
    pathParams: [${params.map((p) => `'${p}'`).join(', ')}],
    dataType: '${o.dataType}',
    summary: '${summary}',
  },`;
    })
    .join('\n');

  const out = `// AUTO-GENERATED by scripts/generate-write-surface.ts — DO NOT EDIT.
//
// The \`mutate\` write surface: an explicit allowlist over the generated /v1 SDK
// (CREATE + value-UPDATE, additive only). Regenerate with:
//   pnpm --filter @saturation/sdk generate:mutate
//
// ${selected.length} write operations selected from ${all.length} total operations.

/** A single write operation's static metadata, derived from the OpenAPI spec. */
export interface WriteOpDef {
  /** The operation id — the \`mutate\` op key the model passes. */
  readonly op: string;
  /** HTTP verb the gated /v1 handler is reached through. */
  readonly method: 'post' | 'put' | 'patch';
  /** Templated path (\`{param}\` segments filled from \`path\`). */
  readonly url: string;
  /** Ordered path-parameter names this op requires (e.g. \`projectId\`, \`lineId\`). */
  readonly pathParams: readonly string[];
  /** The generated request-data type name (provenance; the body shape lives there). */
  readonly dataType: string;
  /** One-line human summary from the OpenAPI operation. */
  readonly summary: string;
}

/** The generated write-op table, keyed by operation id. */
export const WRITE_OPS = {
${entries}
} as const satisfies Record<string, WriteOpDef>;

/** Every allowlisted write operation id (the model-facing op vocabulary). */
export type WriteOp = keyof typeof WRITE_OPS;

/** The ordered list of write-op ids. */
export const WRITE_OP_IDS = Object.keys(WRITE_OPS) as WriteOp[];
`;

  writeFileSync(OUT, out, 'utf8');
  // eslint-disable-next-line no-console
  console.log(
    `[generate-write-surface] wrote ${selected.length} write ops to ${OUT}`,
  );
}

main();
