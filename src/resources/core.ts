import * as sdk from '../generated/sdk.gen.js';
import type {
  Contact,
  ContactCreate,
  ContactUpdate,
  ContactExpand,
  ContactType,
  Project,
  ProjectCreate,
  ProjectUpdate,
  Space,
  SpaceCreate,
  SpaceUpdate,
  Me,
  Workspace,
  SearchHit,
  SearchKind,
  TagMode,
} from '../generated/types.gen.js';
import { Transport, List, type Page } from '../http.js';
import { Expanded, type ExpandMap, serializeExpand } from '../expand.js';

const contactExpandMap = {
  documents: 'documents',
  transactions: 'transactions',
} satisfies ExpandMap<ContactExpand>;
type ContactExpandMap = typeof contactExpandMap;

export interface ContactListParams<E extends ContactExpand = never> {
  q?: string;
  type?: ContactType | string;
  tags?: string;
  tagMode?: TagMode;
  track1099?: boolean;
  hasTaxId?: boolean;
  expand?: readonly E[];
  limit?: number;
  cursor?: string;
  sort?: string;
  order?: 'asc' | 'desc';
  withCount?: boolean;
  view?: string;
}

/** Workspace-scoped contacts: `sat.contacts`. */
export class ContactsResource {
  constructor(private readonly t: Transport) {}

  list<E extends ContactExpand = never>(
    params: ContactListParams<E> = {},
  ): List<Expanded<Contact, ContactExpandMap, E>> {
    const options = {
      query: {
        q: params.q,
        type: params.type,
        tags: params.tags,
        tagMode: params.tagMode,
        track1099: params.track1099,
        hasTaxId: params.hasTaxId,
        expand: serializeExpand(params.expand),
        limit: params.limit,
        cursor: params.cursor,
        sort: params.sort,
        order: params.order,
        withCount: params.withCount,
        view: params.view,
      },
    };
    type Row = Expanded<Contact, ContactExpandMap, E>;
    return new List<Row>(
      () => this.t.paginate<typeof options, Row>(sdk.masterDataListContacts, options),
      () => this.t.runPage<typeof options, Row>(sdk.masterDataListContacts, options),
    );
  }

  async get<E extends ContactExpand = never>(
    contactId: string,
    params: { expand?: readonly E[] } = {},
  ): Promise<Expanded<Contact, ContactExpandMap, E>> {
    return this.t.run(sdk.masterDataGetContact, {
      path: { contactId },
      query: { expand: serializeExpand(params.expand) },
    }) as Promise<Expanded<Contact, ContactExpandMap, E>>;
  }

  async create(body: ContactCreate, opts: { idempotencyKey: string }): Promise<Contact> {
    return this.t.run(sdk.masterDataCreateContact, {
      headers: { 'Idempotency-Key': opts.idempotencyKey },
      body,
    }) as Promise<Contact>;
  }

  async update(contactId: string, body: ContactUpdate): Promise<Contact> {
    return this.t.run(sdk.masterDataUpdateContact, {
      path: { contactId },
      body,
    }) as Promise<Contact>;
  }

  async delete(contactId: string): Promise<void> {
    await this.t.run(sdk.masterDataDeleteContact, {
      path: { contactId },
    });
  }
}

export interface ProjectListParams {
  status?: string;
  spaceId?: string;
  q?: string;
  limit?: number;
  cursor?: string;
  sort?: string;
  order?: 'asc' | 'desc';
  withCount?: boolean;
}

/** Workspace-scoped projects: `sat.projects.list/get/create/update/delete`. */
export class ProjectsResource {
  constructor(private readonly t: Transport) {}

  list(params: ProjectListParams = {}): List<Project> {
    const options = { query: { ...params } };
    return new List<Project>(
      () => this.t.paginate<typeof options, Project>(sdk.masterDataListProjects, options),
      () => this.t.runPage<typeof options, Project>(sdk.masterDataListProjects, options),
    );
  }

  /** Get a project by `id` or `slug`. */
  async get(slugOrId: string): Promise<Project> {
    return this.t.run(sdk.masterDataGetProject, {
      path: { slugOrId },
    }) as Promise<Project>;
  }

  async create(body: ProjectCreate, opts: { idempotencyKey: string }): Promise<Project> {
    return this.t.run(sdk.masterDataCreateProject, {
      headers: { 'Idempotency-Key': opts.idempotencyKey },
      body,
    }) as Promise<Project>;
  }

  async update(slugOrId: string, body: ProjectUpdate): Promise<Project> {
    return this.t.run(sdk.masterDataUpdateProject, {
      path: { slugOrId },
      body,
    }) as Promise<Project>;
  }

  async delete(slugOrId: string): Promise<void> {
    await this.t.run(sdk.masterDataDeleteProject, {
      path: { slugOrId },
    });
  }
}

/** Workspace spaces (folders that group projects): `sat.spaces`. */
export class SpacesResource {
  constructor(private readonly t: Transport) {}

  list(params: { limit?: number; cursor?: string } = {}): List<Space> {
    const options = { query: { ...params } };
    return new List<Space>(
      () => this.t.paginate<typeof options, Space>(sdk.masterDataListSpaces, options),
      () => this.t.runPage<typeof options, Space>(sdk.masterDataListSpaces, options),
    );
  }
  async create(body: SpaceCreate): Promise<Space> {
    return this.t.run(sdk.masterDataCreateSpace, {
      body,
    }) as Promise<Space>;
  }
  async update(spaceId: string, body: SpaceUpdate): Promise<Space> {
    return this.t.run(sdk.masterDataUpdateSpace, {
      path: { spaceId },
      body,
    }) as Promise<Space>;
  }
  async delete(spaceId: string): Promise<void> {
    await this.t.run(sdk.masterDataDeleteSpace, {
      path: { spaceId },
    });
  }
}

export interface SearchParams {
  /** Restrict to these entity kinds (transactions, documents, contacts, budget lines). */
  types?: readonly SearchKind[];
  limit?: number;
  cursor?: string;
  withCount?: boolean;
}

/** Spotlight search, permission-scoped in-query and keyset-paginated. */
export class SearchResource {
  constructor(
    private readonly t: Transport,
    private readonly projectId?: string,
  ) {}

  /** Run a search for `q`. Returns an async-iterable `List` over ranked hits. */
  run(q: string, params: SearchParams = {}): List<SearchHit> {
    const query = {
      q,
      types: params.types ? [...params.types] : undefined,
      limit: params.limit,
      cursor: params.cursor,
      withCount: params.withCount,
    };
    if (this.projectId) {
      const options = {
        path: { projectId: this.projectId },
        query,
      };
      return new List<SearchHit>(
        () => this.t.paginate<typeof options, SearchHit>(sdk.searchProject, options),
        () => this.t.runPage<typeof options, SearchHit>(sdk.searchProject, options),
      );
    }
    const options = { query };
    return new List<SearchHit>(
      () => this.t.paginate<typeof options, SearchHit>(sdk.searchWorkspace, options),
      () => this.t.runPage<typeof options, SearchHit>(sdk.searchWorkspace, options),
    );
  }
}

/** The `GET /v1/me` identity probe + workspace reach. */
export class MetaResource {
  constructor(private readonly t: Transport) {}

  /** The token's identity and permission-filtered workspace reach (the auth probe). */
  async me(): Promise<Me> {
    return this.t.run(sdk.metaAuthGetMe, {}) as Promise<Me>;
  }

  /** The workspaces this token can act on. */
  workspaces(params: { limit?: number; cursor?: string } = {}): List<Workspace> {
    const options = { query: { ...params } };
    return new List<Workspace>(
      () => this.t.paginate<typeof options, Workspace>(sdk.metaAuthListWorkspaces, options),
      () => this.t.runPage<typeof options, Workspace>(sdk.metaAuthListWorkspaces, options),
    );
  }

  /** Unauthenticated liveness check. */
  async health(): Promise<unknown> {
    return this.t.run(sdk.metaAuthHealth, {});
  }
}

export type { Page };
