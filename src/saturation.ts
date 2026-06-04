import { Transport } from './http.js';
import { LibraryResource } from './resources/library-workspace.js';
import { ProjectLibraryResource } from './resources/library-project.js';
import { BudgetResource } from './resources/budget.js';
import { TransactionsResource } from './resources/transactions.js';
import { DocumentsResource, ProjectDocumentsResource } from './resources/documents.js';
import { PurchaseOrdersResource } from './resources/purchase-orders.js';
import {
  ContactsResource,
  ProjectsResource,
  SpacesResource,
  SearchResource,
  MetaResource,
} from './resources/core.js';
import {
  CommentsResource,
  ViewsResource,
  UsageResource,
  WebhooksResource,
} from './resources/extras.js';
import type { Me, Workspace } from './generated/types.gen.js';

/** Constructor options. `workspaceId` is injected once and never repeated per call. */
export interface SaturationOptions {
  /** A `Authorization: Bearer <token>` credential, minted in next-web Settings → Developers. */
  token: string;
  /** The workspace this client acts on (`ws_…`). Explicit in every path; set once here. */
  workspaceId: string;
  /** Override the API base URL (defaults to production). Use for local/staging. */
  baseURL?: string;
}

/**
 * A project-scoped handle: `sat.projects(p)`. Everything reachable from here is
 * already bound to that project — budget, transactions, the resident Library, and
 * project-scoped search. The workspace is still the one set on the client.
 */
export class ProjectScope {
  constructor(
    private readonly t: Transport,
    readonly id: string,
  ) {}

  /** Budget ledger + engine-computed reads for this project. */
  get budget(): BudgetResource {
    return new BudgetResource(this.t, this.id);
  }

  /** The unified transactions ledger for this project. */
  get transactions(): TransactionsResource {
    return new TransactionsResource(this.t, this.id);
  }

  /** Purchase orders for this project. */
  get purchaseOrders(): PurchaseOrdersResource {
    return new PurchaseOrdersResource(this.t, this.id);
  }

  /** The project-resident Library (installed packs, added programs). */
  get library(): ProjectLibraryResource {
    return new ProjectLibraryResource(this.t, this.id);
  }

  /** Project-scoped document reverse lookups (by transaction, budget line, PO). */
  get documents(): ProjectDocumentsResource {
    return new ProjectDocumentsResource(this.t, this.id);
  }

  /** Saved views for this project. */
  get views(): ViewsResource {
    return new ViewsResource(this.t, this.id);
  }

  /** Per-project usage rollups. */
  usage(params?: Parameters<UsageResource['projectRollups']>[1]): ReturnType<UsageResource['projectRollups']> {
    return new UsageResource(this.t).projectRollups(this.id, params);
  }

  /** Project-scoped Spotlight search. */
  search(q: string, params?: Parameters<SearchResource['run']>[1]): ReturnType<SearchResource['run']> {
    return new SearchResource(this.t, this.id).run(q, params);
  }
}

/**
 * `sat.projects` is both callable — `sat.projects(p)` opens a {@link ProjectScope} —
 * and a resource with `list/get/create/update/delete` for workspace project master data.
 */
export interface ProjectsAccessor extends ProjectsResource {
  (projectId: string): ProjectScope;
}

/**
 * The Saturation API client.
 *
 * ```ts
 * const sat = new Saturation({ token, workspaceId: 'ws_…' });
 * const lines = await sat.projects('prj_…').budget.lines.list().all();
 * ```
 *
 * Resource grammar mirrors the API routes and the product UI exactly:
 *   - workspace scope: `sat.library.*`, `sat.documents.*`, `sat.contacts.*`,
 *     `sat.spaces.*`, `sat.search(...)`, `sat.me()`
 *   - project scope:   `sat.projects(p).budget.*`, `.transactions.*`,
 *     `.library.*`, `.search(...)`
 */
export class Saturation {
  private readonly t: Transport;

  /** Workspace-source Library (rates, incentives, fringes, globals, currencies, tags, units). */
  readonly library: LibraryResource;
  /** First-class documents (drop once, then assign to typed targets). */
  readonly documents: DocumentsResource;
  /** Workspace-scoped contacts (vendors, crew, payees). */
  readonly contacts: ContactsResource;
  /** Workspace spaces (folders that group projects). */
  readonly spaces: SpacesResource;
  /** Workspace comments attached to entities. */
  readonly comments: CommentsResource;
  /** Metered usage and credit dashboards. */
  readonly usage: UsageResource;
  /** Outbound webhook subscriptions. */
  readonly webhooks: WebhooksResource;
  /** Callable project accessor: `sat.projects(p)` and `sat.projects.list()`. */
  readonly projects: ProjectsAccessor;

  private readonly meta: MetaResource;

  constructor(options: SaturationOptions) {
    this.t = new Transport({
      token: options.token,
      workspaceId: options.workspaceId,
      baseURL: options.baseURL,
    });
    this.library = new LibraryResource(this.t);
    this.documents = new DocumentsResource(this.t);
    this.contacts = new ContactsResource(this.t);
    this.spaces = new SpacesResource(this.t);
    this.comments = new CommentsResource(this.t);
    this.usage = new UsageResource(this.t);
    this.webhooks = new WebhooksResource(this.t);
    this.meta = new MetaResource(this.t);

    // Build the callable-projects accessor: a function that opens a project scope,
    // with the workspace ProjectsResource methods bound onto it.
    const resource = new ProjectsResource(this.t);
    const accessor = ((projectId: string) => new ProjectScope(this.t, projectId)) as ProjectsAccessor;
    Object.setPrototypeOf(accessor, ProjectsResource.prototype);
    Object.assign(accessor, resource);
    this.projects = accessor;
  }

  /** The workspace this client is bound to (`ws_…`). */
  get workspaceId(): string {
    return this.t.workspaceId;
  }

  /** Workspace-scoped Spotlight search. */
  search(q: string, params?: Parameters<SearchResource['run']>[1]): ReturnType<SearchResource['run']> {
    return new SearchResource(this.t).run(q, params);
  }

  /** The token's identity + permission-filtered workspace reach (the auth probe). */
  me(): Promise<Me> {
    return this.meta.me();
  }

  /** The workspaces this token can act on (not limited to the constructor workspace). */
  workspaces(params?: { limit?: number; cursor?: string }): ReturnType<MetaResource['workspaces']> {
    return this.meta.workspaces(params);
  }

  /** Fetch a single workspace by id. */
  workspace(workspaceId: string): Promise<Workspace> {
    return this.meta.workspace(workspaceId);
  }

  /** Unauthenticated liveness check. */
  health(): Promise<unknown> {
    return this.meta.health();
  }
}
