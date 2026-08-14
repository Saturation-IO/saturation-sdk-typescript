import * as sdk from '../generated/sdk.gen.js';
import type {
  Contact,
  ContactCreate,
  ContactUpdate,
  ContactExpand,
  ContactType,
  Project,
  ProjectCreate,
  ProjectExpand,
  ProjectUpdate,
  Space,
  SpaceCreate,
  SpaceUpdate,
  Me,
  SearchHit,
  SearchKind,
  TagMode,
} from '../generated/types.gen.js';
import { Transport, List, type Page } from '../http.js';
import { Expanded, type ExpandMap, serializeExpand } from '../expand.js';

const contactExpandMap = {
  documents: 'documents',
  transactions: 'transactions',
} as const satisfies ExpandMap<ContactExpand>;
type ContactExpandMap = typeof contactExpandMap;

const projectExpandMap = {
  assumptions: 'assumptions',
} as const satisfies ExpandMap<ProjectExpand>;
type ProjectExpandMap = typeof projectExpandMap;

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
      () => this.t.paginate<typeof options, Row>(sdk.contactsList, options),
      () => this.t.runPage<typeof options, Row>(sdk.contactsList, options),
    );
  }

  async get<E extends ContactExpand = never>(
    contactId: string,
    params: { expand?: readonly E[] } = {},
  ): Promise<Expanded<Contact, ContactExpandMap, E>> {
    return this.t.run(sdk.contactsGet, {
      path: { contactId },
      query: { expand: serializeExpand(params.expand) },
    }) as Promise<Expanded<Contact, ContactExpandMap, E>>;
  }

  async create(body: ContactCreate, opts: { idempotencyKey: string }): Promise<Contact> {
    return this.t.run(sdk.contactsCreate, {
      headers: { 'Idempotency-Key': opts.idempotencyKey },
      body,
    }) as Promise<Contact>;
  }

  async update(contactId: string, body: ContactUpdate): Promise<Contact> {
    return this.t.run(sdk.contactsUpdate, {
      path: { contactId },
      body,
    }) as Promise<Contact>;
  }

  async delete(contactId: string): Promise<void> {
    await this.t.run(sdk.contactsDelete, {
      path: { contactId },
    });
  }
}

export interface ProjectListParams<E extends ProjectExpand = never> {
  status?: string;
  spaceId?: string;
  q?: string;
  expand?: readonly E[];
  limit?: number;
  cursor?: string;
  sort?: string;
  order?: 'asc' | 'desc';
  withCount?: boolean;
}

/** Workspace-scoped projects: `sat.projects.list/get/create/update`. */
export class ProjectsResource {
  constructor(private readonly t: Transport) {}

  list<E extends ProjectExpand = never>(params: ProjectListParams<E> = {}): List<Expanded<Project, ProjectExpandMap, E>> {
    const options = {
      query: {
        ...params,
        expand: serializeExpand(params.expand),
      },
    };
    type Row = Expanded<Project, ProjectExpandMap, E>;
    return new List<Row>(
      () => this.t.paginate<typeof options, Row>(sdk.projectsList, options),
      () => this.t.runPage<typeof options, Row>(sdk.projectsList, options),
    );
  }

  /** Get a project by `id` or `slug`. Pass `expand: ['assumptions']` to include the pinned project brief. */
  async get<E extends ProjectExpand = never>(
    projectId: string,
    params: { expand?: readonly E[] } = {},
  ): Promise<Expanded<Project, ProjectExpandMap, E>> {
    return this.t.run(sdk.projectsGet, {
      path: { projectId },
      query: { expand: serializeExpand(params.expand) },
    }) as Promise<Expanded<Project, ProjectExpandMap, E>>;
  }

  async create(body: ProjectCreate, opts: { idempotencyKey: string }): Promise<Project> {
    return this.t.run(sdk.projectsCreate, {
      headers: { 'Idempotency-Key': opts.idempotencyKey },
      body,
    }) as Promise<Project>;
  }

  async update(projectId: string, body: ProjectUpdate): Promise<Project> {
    return this.t.run(sdk.projectsUpdate, {
      path: { projectId },
      body,
    }) as Promise<Project>;
  }

}

/** Workspace spaces (folders that group projects): `sat.spaces`. */
export class SpacesResource {
  constructor(private readonly t: Transport) {}

  list(params: { limit?: number; cursor?: string } = {}): List<Space> {
    const options = { query: { ...params } };
    return new List<Space>(
      () => this.t.paginate<typeof options, Space>(sdk.spacesList, options),
      () => this.t.runPage<typeof options, Space>(sdk.spacesList, options),
    );
  }
  /** Create a space. Pass `idempotencyKey` for a safe retry of the create. */
  async create(body: SpaceCreate, opts: { idempotencyKey: string }): Promise<Space> {
    return this.t.run(sdk.spacesCreate, {
      headers: { 'Idempotency-Key': opts.idempotencyKey },
      body,
    }) as Promise<Space>;
  }
  async update(spaceId: string, body: SpaceUpdate): Promise<Space> {
    return this.t.run(sdk.spacesUpdate, {
      path: { spaceId },
      body,
    }) as Promise<Space>;
  }
  async delete(spaceId: string): Promise<void> {
    await this.t.run(sdk.spacesDelete, {
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

/** Search visible workspace or project data. */
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
      projectId: this.projectId,
      limit: params.limit,
      cursor: params.cursor,
      withCount: params.withCount,
    };
    const options = { query };
    return new List<SearchHit>(
      () => this.t.paginate<typeof options, SearchHit>(sdk.searchWorkspace, options),
      () => this.t.runPage<typeof options, SearchHit>(sdk.searchWorkspace, options),
    );
  }
}

/** The `GET /v1/me` identity probe. */
export class MetaResource {
  constructor(private readonly t: Transport) {}

  /** Get the current identity and accessible workspace. */
  async me(): Promise<Me> {
    return this.t.run(sdk.meGet, {}) as Promise<Me>;
  }

}

export type { Page };
