import { Transport, type FetchLike } from './http.js';
import { LibraryResource } from './resources/library-workspace.js';
import { ProjectLibraryResource } from './resources/library-project.js';
import { BudgetResource } from './resources/budget.js';
import { TransactionsResource } from './resources/transactions.js';
import { DocumentsResource } from './resources/documents.js';
import { PurchaseOrdersResource } from './resources/purchase-orders.js';
import { PaymentRequestsResource, PaymentsResource } from './resources/payments.js';
import {
  ContactsResource,
  ProjectsResource,
  SpacesResource,
  SearchResource,
  MetaResource,
} from './resources/core.js';
import {
  CommentsResource,
  WebhooksResource,
} from './resources/extras.js';
import type { Me } from './generated/types.gen.js';

/** Constructor options. The bearer token determines the workspace. */
export interface SaturationOptions {
  /** A `Authorization: Bearer <token>` credential, minted in next-web Settings → Developers. */
  token: string;
  /** Override the API base URL (defaults to production). Use for local/staging. */
  baseURL?: string;
  /**
   * Override the request executor. Defaults to `globalThis.fetch`. Pass a Hono
   * `app.fetch` to run the SDK **in-process** against the live `/v1` handlers
   * (no socket) — the seam the agent `mutate` bridge plugs into.
   */
  fetch?: FetchLike;
}

/**
 * A project-scoped handle: `sat.projects(p)`. Everything reachable from here is
 * already bound to that project — budget, transactions, the resident Library,
 * and project-scoped search. The workspace comes from the bearer token.
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

  /** Payment requests for this project. */
  get paymentRequests(): PaymentRequestsResource {
    return new PaymentRequestsResource(this.t, this.id);
  }

  /** Payments for this project. */
  get payments(): PaymentsResource {
    return new PaymentsResource(this.t, this.id);
  }

  /** The project-resident Library (installed packs, added programs). */
  get library(): ProjectLibraryResource {
    return new ProjectLibraryResource(this.t, this.id);
  }

  /** Comments owned by this project. */
  get comments(): CommentsResource {
    return new CommentsResource(this.t, this.id);
  }

  /** Project-scoped Spotlight search. */
  search(q: string, params?: Parameters<SearchResource['run']>[1]): ReturnType<SearchResource['run']> {
    return new SearchResource(this.t, this.id).run(q, params);
  }
}

/**
 * `sat.projects` is both callable — `sat.projects(p)` opens a {@link ProjectScope} —
 * and a resource with `list/get/create/update` for workspace project master data.
 */
export interface ProjectsAccessor extends ProjectsResource {
  (projectId: string): ProjectScope;
}

/**
 * The Saturation API client.
 *
 * ```ts
 * const sat = new Saturation({ token });
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

  /** Workspace Library (rate packs, incentives, fringes, globals, currencies, tags, and units). */
  readonly library: LibraryResource;
  /** Workspace documents and their links to other records. */
  readonly documents: DocumentsResource;
  /** Workspace-scoped contacts (vendors, crew, payees). */
  readonly contacts: ContactsResource;
  /** Workspace-scoped purchase orders, including unassigned POs. */
  readonly purchaseOrders: PurchaseOrdersResource;
  /** Workspace-scoped payment requests, including unassigned requests. */
  readonly paymentRequests: PaymentRequestsResource;
  /** Workspace-scoped payments, including unassigned payments. */
  readonly payments: PaymentsResource;
  /** Workspace spaces (folders that group projects). */
  readonly spaces: SpacesResource;
  /** Outbound webhook subscriptions. */
  readonly webhooks: WebhooksResource;
  /** Callable project accessor: `sat.projects(p)` and `sat.projects.list()`. */
  readonly projects: ProjectsAccessor;

  private readonly meta: MetaResource;

  constructor(options: SaturationOptions) {
    this.t = new Transport({
      token: options.token,
      baseURL: options.baseURL,
      fetch: options.fetch,
    });
    this.library = new LibraryResource(this.t);
    this.documents = new DocumentsResource(this.t);
    this.contacts = new ContactsResource(this.t);
    this.purchaseOrders = new PurchaseOrdersResource(this.t);
    this.paymentRequests = new PaymentRequestsResource(this.t);
    this.payments = new PaymentsResource(this.t);
    this.spaces = new SpacesResource(this.t);
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

  /** Workspace-scoped Spotlight search. */
  search(q: string, params?: Parameters<SearchResource['run']>[1]): ReturnType<SearchResource['run']> {
    return new SearchResource(this.t).run(q, params);
  }

  /** The token's identity + permission-filtered workspace reach (the auth probe). */
  me(): Promise<Me> {
    return this.meta.me();
  }

}
