import * as sdk from '../generated/sdk.gen.js';
import type {
  BudgetLine,
  BudgetLineCreate,
  BudgetLineUpdate,
  BudgetLineExpand,
  BudgetLineBatchCreate,
  BudgetLineBatchCreateResponse,
  BudgetLineInputUpsert,
  BudgetLineInputUpsertResponse,
  BudgetInputBatchUpsert,
  BudgetInputBatchUpsertResponse,
  BudgetCell,
  BudgetDocument,
  BudgetTotals,
  BudgetRollup,
  BudgetVariance,
  BudgetPhase,
  BudgetAccount,
  TagMode,
  BudgetCreatePhaseData,
  BudgetUpdatePhaseData,
} from '../generated/types.gen.js';

/** Phase write bodies, derived from the generated operation Data types. */
export type BudgetPhaseCreate = BudgetCreatePhaseData['body'];
export type BudgetPhaseUpdate = BudgetUpdatePhaseData['body'];
import { Transport, List, type Page } from '../http.js';
import { Expanded, type ExpandMap, serializeExpand } from '../expand.js';

/**
 * Map each budget-line expand key to the property it populates on `BudgetLine`,
 * so an expanded relation is widened to present-and-required in the return type.
 * `phases` populates the computed `values` matrix; `inputs` populates the raw
 * editable input matrix; the rest are 1:1 with their property name.
 *
 * `account` is a valid expand key but projects classifier fields (`code`/`path`)
 * that are already inline on the row, so it has no dedicated widened property and
 * is intentionally absent from the widening map (it stays a valid key via the
 * `BudgetLineExpand` union on `expand`).
 */
const budgetLineExpandMap = {
  phases: 'values',
  inputs: 'inputs',
  contact: 'contact',
  sourceItem: 'sourceItem',
} satisfies ExpandMap<BudgetLineExpand>;
type BudgetLineExpandMap = typeof budgetLineExpandMap;

export interface BudgetLineListParams<E extends BudgetLineExpand = never> {
  /** Account code classifier — returns a SET (a code may sit on many rows). */
  accountId?: string;
  /** Coded account path for an exact single-row read (e.g. `1100/1110`). */
  path?: string;
  /** Comma-separated tag ids/names; composed per `tagMode`. */
  tags?: string;
  /** How `tags` composes (`any` OR, `all` AND, `none` exclude). */
  tagMode?: TagMode;
  /** Filter by the `kind` discriminator (comma-separated). */
  kind?: string;
  /** Typed expand keys; expanding widens the row type to make them present. */
  expand?: readonly E[];
  /** Page size, capped at 100 (default 50). */
  limit?: number;
  /** Opaque keyset cursor from a prior page's `nextCursor`. */
  cursor?: string;
  /** Opt in to a total `count` on the envelope. */
  withCount?: boolean;
}

export interface BudgetGetLineParams<E extends BudgetLineExpand = never> {
  expand?: readonly E[];
}

export interface BudgetTotalsParams {
  phase?: string;
  accountId?: string;
  /** Coded account path for an exact subtree total (e.g. `1100/1110`). */
  path?: string;
}

export interface BudgetDocumentParams {
  /** Materialized account path for one root line and its descendants. */
  path?: string;
  /** Leaf account code for one root line and its descendants. */
  accountCode?: string;
  /** Visible phase id, alias, name, or type. */
  phase?: string;
}

/** The budget namespace, scoped to one project via `sat.projects(p).budget`. */
export class BudgetResource {
  constructor(
    private readonly t: Transport,
    private readonly projectId: string,
  ) {}

  get lines(): BudgetLinesResource {
    return new BudgetLinesResource(this.t, this.projectId);
  }

  get phases(): BudgetPhasesResource {
    return new BudgetPhasesResource(this.t, this.projectId);
  }

  get accounts(): BudgetAccountsResource {
    return new BudgetAccountsResource(this.t, this.projectId);
  }

  get totals(): BudgetTotalsResource {
    return new BudgetTotalsResource(this.t, this.projectId);
  }

  get cells(): BudgetCellsResource {
    return new BudgetCellsResource(this.t, this.projectId);
  }

  get inputs(): BudgetInputsResource {
    return new BudgetInputsResource(this.t, this.projectId);
  }

  /** The full budget document: lines, visible phases, totals, and editable inputs. */
  async document(params: BudgetDocumentParams = {}): Promise<BudgetDocument> {
    return this.t.run(sdk.budgetGetDocument, {
      path: { projectId: this.projectId },
      query: {
        path: params.path,
        accountCode: params.accountCode,
        phase: params.phase,
      },
    }) as Promise<BudgetDocument>;
  }

  /** Engine-computed rollup for one phase (id or `type`, e.g. `estimate`). */
  async rollup(phase: string): Promise<BudgetRollup> {
    return this.t.run(sdk.budgetGetRollup, {
      path: { projectId: this.projectId },
      query: { phase },
    }) as Promise<BudgetRollup>;
  }

  /** Engine-computed variance between two phases (`from` → `to`). */
  async variance(from: string, to: string): Promise<BudgetVariance> {
    return this.t.run(sdk.budgetGetVariance, {
      path: { projectId: this.projectId },
      query: { from, to },
    }) as Promise<BudgetVariance>;
  }
}

export class BudgetLinesResource {
  constructor(
    private readonly t: Transport,
    private readonly projectId: string,
  ) {}

  /**
   * List budget lines. Returns an async-iterable `List` that transparently
   * follows `nextCursor`; `await .page()` for one raw page. Expanding a relation
   * widens each row so the relation is present without `?.`.
   */
  list<E extends BudgetLineExpand = never>(
    params: BudgetLineListParams<E> = {},
  ): List<Expanded<BudgetLine, BudgetLineExpandMap, E>> {
    const options = {
      path: { projectId: this.projectId },
      query: {
        accountId: params.accountId,
        path: params.path,
        tags: params.tags,
        tagMode: params.tagMode,
        kind: params.kind,
        expand: serializeExpand(params.expand),
        limit: params.limit,
        cursor: params.cursor,
        withCount: params.withCount,
      },
    };
    type Row = Expanded<BudgetLine, BudgetLineExpandMap, E>;
    return new List<Row>(
      () => this.t.paginate<typeof options, Row>(sdk.budgetListLines, options),
      () => this.t.runPage<typeof options, Row>(sdk.budgetListLines, options),
    );
  }

  /** Get a single budget line by id, with optional typed expand widening. */
  async get<E extends BudgetLineExpand = never>(
    lineId: string,
    params: BudgetGetLineParams<E> = {},
  ): Promise<Expanded<BudgetLine, BudgetLineExpandMap, E>> {
    return this.t.run(sdk.budgetGetLine, {
      path: { projectId: this.projectId, lineId },
      query: { expand: serializeExpand(params.expand) },
    }) as Promise<Expanded<BudgetLine, BudgetLineExpandMap, E>>;
  }

  /** Create a budget line. Pass `idempotencyKey` to replay same-body retries. */
  async create(
    body: BudgetLineCreate,
    opts: { idempotencyKey?: string } = {},
  ): Promise<BudgetLine> {
    return this.t.run(sdk.budgetCreateLine, {
      path: { projectId: this.projectId },
      headers: opts.idempotencyKey ? { 'Idempotency-Key': opts.idempotencyKey } : undefined,
      body,
    }) as Promise<BudgetLine>;
  }

  /** Create budget lines in one all-or-nothing batch. */
  async createBatch(
    body: BudgetLineBatchCreate,
    opts: { idempotencyKey?: string } = {},
  ): Promise<BudgetLineBatchCreateResponse> {
    return this.t.run(sdk.budgetCreateLinesBatch, {
      path: { projectId: this.projectId },
      headers: opts.idempotencyKey ? { 'Idempotency-Key': opts.idempotencyKey } : undefined,
      body,
    }) as Promise<BudgetLineBatchCreateResponse>;
  }

  /** Patch a budget line (allow-list only; server-owned fields → `field_read_only`). */
  async update(lineId: string, body: BudgetLineUpdate): Promise<BudgetLine> {
    return this.t.run(sdk.budgetUpdateLine, {
      path: { projectId: this.projectId, lineId },
      body,
    }) as Promise<BudgetLine>;
  }

  /** Upsert one editable input for a line/phase intersection. */
  async upsertInput(
    lineId: string,
    phaseId: string,
    body: BudgetLineInputUpsert,
  ): Promise<BudgetLineInputUpsertResponse> {
    return this.t.run(sdk.budgetUpsertLineInput, {
      path: { projectId: this.projectId, lineId, phaseId },
      body,
    }) as Promise<BudgetLineInputUpsertResponse>;
  }

  /** Soft-delete a budget line. `reset` re-snapshots from source on resurrect. */
  async delete(lineId: string, opts: { reset?: boolean } = {}): Promise<void> {
    await this.t.run(sdk.budgetDeleteLine, {
      path: { projectId: this.projectId, lineId },
      query: opts.reset ? { reset: true } : undefined,
    });
  }
}

export class BudgetInputsResource {
  constructor(
    private readonly t: Transport,
    private readonly projectId: string,
  ) {}

  /** Upsert editable budget inputs in one all-or-nothing batch. */
  async upsertBatch(
    body: BudgetInputBatchUpsert,
    opts: { idempotencyKey?: string } = {},
  ): Promise<BudgetInputBatchUpsertResponse> {
    return this.t.run(sdk.budgetUpsertInputsBatch, {
      path: { projectId: this.projectId },
      headers: opts.idempotencyKey ? { 'Idempotency-Key': opts.idempotencyKey } : undefined,
      body,
    }) as Promise<BudgetInputBatchUpsertResponse>;
  }
}

export class BudgetPhasesResource {
  constructor(
    private readonly t: Transport,
    private readonly projectId: string,
  ) {}

  list(): List<BudgetPhase> {
    const options = {
      path: { projectId: this.projectId },
    };
    return new List<BudgetPhase>(
      () => this.t.paginate<typeof options, BudgetPhase>(sdk.budgetListPhases, options),
      () => this.t.runPage<typeof options, BudgetPhase>(sdk.budgetListPhases, options),
    );
  }

  async get(phaseId: string): Promise<BudgetPhase> {
    return this.t.run(sdk.budgetGetPhase, {
      path: { projectId: this.projectId, phaseId },
    }) as Promise<BudgetPhase>;
  }

  async create(body: BudgetPhaseCreate): Promise<BudgetPhase> {
    return this.t.run(sdk.budgetCreatePhase, {
      path: { projectId: this.projectId },
      body,
    }) as Promise<BudgetPhase>;
  }

  async update(phaseId: string, body: BudgetPhaseUpdate): Promise<BudgetPhase> {
    return this.t.run(sdk.budgetUpdatePhase, {
      path: { projectId: this.projectId, phaseId },
      body,
    }) as Promise<BudgetPhase>;
  }

  async delete(phaseId: string): Promise<void> {
    await this.t.run(sdk.budgetDeletePhase, {
      path: { projectId: this.projectId, phaseId },
    });
  }
}

export class BudgetAccountsResource {
  constructor(
    private readonly t: Transport,
    private readonly projectId: string,
  ) {}

  list(): List<BudgetAccount> {
    const options = {
      path: { projectId: this.projectId },
    };
    return new List<BudgetAccount>(
      () => this.t.paginate<typeof options, BudgetAccount>(sdk.budgetListAccounts, options),
      () => this.t.runPage<typeof options, BudgetAccount>(sdk.budgetListAccounts, options),
    );
  }
}

export class BudgetTotalsResource {
  constructor(
    private readonly t: Transport,
    private readonly projectId: string,
  ) {}

  /** Engine-computed rolled-up totals, as of `computedAt`. */
  async get(params: BudgetTotalsParams = {}): Promise<BudgetTotals> {
    return this.t.run(sdk.budgetGetTotals, {
      path: { projectId: this.projectId },
      query: {
        phase: params.phase,
        accountId: params.accountId,
        path: params.path,
      },
    }) as Promise<BudgetTotals>;
  }
}

export class BudgetCellsResource {
  constructor(
    private readonly t: Transport,
    private readonly projectId: string,
  ) {}

  /**
   * Read one positional cell by explicit `{ account, column }` — never a raw
   * domain address. `account` is a path/code (`1100/1110`); `column` names a
   * value column (a phase id or `type` such as `estimate`).
   */
  async get(coords: { account: string; column: string }): Promise<BudgetCell> {
    return this.t.run(sdk.budgetGetCell, {
      path: { projectId: this.projectId },
      query: { account: coords.account, column: coords.column },
    }) as Promise<BudgetCell>;
  }
}

export type { Page };
