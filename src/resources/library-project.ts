import * as sdk from '../generated/sdk.gen.js';
import type {
  ProjectIncentive,
  ProjectIncentiveAdd,
  ProjectIncentiveUpdate,
  ProjectIncentiveExpand,
  ProjectFringe,
  ProjectGlobal,
  ProjectCurrency,
  ProjectFringeGroup,
  FringeWrite,
  GlobalWrite,
  CurrencyWrite,
  FringeGroupWrite,
} from '../generated/types.gen.js';
import { Transport, List } from '../http.js';
import { Expanded, type ExpandMap, serializeExpand } from '../expand.js';

const projectIncentiveExpandMap = {
  source: 'source',
} satisfies ExpandMap<ProjectIncentiveExpand>;
type ProjectIncentiveExpandMap = typeof projectIncentiveExpandMap;

/**
 * The project-scope Library contains resident incentives, fringes, globals,
 * currencies, and fringe groups added from a workspace source. Editing a resident
 * copy diverges it without breaking provenance (`sourceId`).
 */
export class ProjectLibraryResource {
  constructor(
    private readonly t: Transport,
    private readonly projectId: string,
  ) {}

  get incentives(): ProjectIncentivesResource {
    return new ProjectIncentivesResource(this.t, this.projectId);
  }
  get fringes(): ProjectFringesResource {
    return new ProjectFringesResource(this.t, this.projectId);
  }
  get globals(): ProjectGlobalsResource {
    return new ProjectGlobalsResource(this.t, this.projectId);
  }
  get currencies(): ProjectCurrenciesResource {
    return new ProjectCurrenciesResource(this.t, this.projectId);
  }
  get fringeGroups(): ProjectFringeGroupsResource {
    return new ProjectFringeGroupsResource(this.t, this.projectId);
  }
  get tags(): ProjectTagsResource {
    return new ProjectTagsResource(this.t, this.projectId);
  }
}

export class ProjectIncentivesResource {
  constructor(
    private readonly t: Transport,
    private readonly projectId: string,
  ) {}

  list<E extends ProjectIncentiveExpand = never>(
    params: { expand?: readonly E[]; limit?: number; cursor?: string } = {},
  ): List<Expanded<ProjectIncentive, ProjectIncentiveExpandMap, E>> {
    const options = {
      path: { projectId: this.projectId },
      query: { expand: serializeExpand(params.expand), limit: params.limit, cursor: params.cursor },
    };
    type Row = Expanded<ProjectIncentive, ProjectIncentiveExpandMap, E>;
    return new List<Row>(
      () => this.t.paginate<typeof options, Row>(sdk.libraryListProjectIncentives, options),
      () => this.t.runPage<typeof options, Row>(sdk.libraryListProjectIncentives, options),
    );
  }

  async get<E extends ProjectIncentiveExpand = never>(
    incentiveId: string,
    params: { expand?: readonly E[] } = {},
  ): Promise<Expanded<ProjectIncentive, ProjectIncentiveExpandMap, E>> {
    return this.t.run(sdk.libraryGetProjectIncentive, {
      path: { projectId: this.projectId, incentiveId },
      query: { expand: serializeExpand(params.expand) },
    }) as Promise<Expanded<ProjectIncentive, ProjectIncentiveExpandMap, E>>;
  }

  /** Add an incentive to the project from a workspace/saturation source (idempotent). */
  async add(body: ProjectIncentiveAdd): Promise<ProjectIncentive> {
    return this.t.run(sdk.libraryAddProjectIncentive, {
      path: { projectId: this.projectId },
      body,
    }) as Promise<ProjectIncentive>;
  }

  async update(incentiveId: string, body: ProjectIncentiveUpdate): Promise<ProjectIncentive> {
    return this.t.run(sdk.libraryUpdateProjectIncentive, {
      path: { projectId: this.projectId, incentiveId },
      body,
    }) as Promise<ProjectIncentive>;
  }

  async delete(incentiveId: string): Promise<void> {
    await this.t.run(sdk.libraryDeleteProjectIncentive, {
      path: { projectId: this.projectId, incentiveId },
    });
  }
}

export class ProjectFringesResource {
  constructor(
    private readonly t: Transport,
    private readonly projectId: string,
  ) {}

  list(params: { limit?: number; cursor?: string } = {}): List<ProjectFringe> {
    const options = {
      path: { projectId: this.projectId },
      query: { ...params },
    };
    return new List<ProjectFringe>(
      () => this.t.paginate<typeof options, ProjectFringe>(sdk.libraryListProjectFringes, options),
      () => this.t.runPage<typeof options, ProjectFringe>(sdk.libraryListProjectFringes, options),
    );
  }
  async add(sourceId: string): Promise<ProjectFringe> {
    return this.t.run(sdk.libraryAddProjectFringe, {
      path: { projectId: this.projectId },
      body: { sourceId },
    }) as Promise<ProjectFringe>;
  }
  async get(fringeId: string): Promise<ProjectFringe> {
    return this.t.run(sdk.libraryGetProjectFringe, {
      path: { projectId: this.projectId, fringeId },
    }) as Promise<ProjectFringe>;
  }
  async update(fringeId: string, body: FringeWrite): Promise<ProjectFringe> {
    return this.t.run(sdk.libraryUpdateProjectFringe, {
      path: { projectId: this.projectId, fringeId },
      body,
    }) as Promise<ProjectFringe>;
  }
  async delete(fringeId: string): Promise<void> {
    await this.t.run(sdk.libraryDeleteProjectFringe, {
      path: { projectId: this.projectId, fringeId },
    });
  }
}

export class ProjectGlobalsResource {
  constructor(
    private readonly t: Transport,
    private readonly projectId: string,
  ) {}

  list(params: { limit?: number; cursor?: string } = {}): List<ProjectGlobal> {
    const options = {
      path: { projectId: this.projectId },
      query: { ...params },
    };
    return new List<ProjectGlobal>(
      () => this.t.paginate<typeof options, ProjectGlobal>(sdk.libraryListProjectGlobals, options),
      () => this.t.runPage<typeof options, ProjectGlobal>(sdk.libraryListProjectGlobals, options),
    );
  }
  async add(sourceId: string): Promise<ProjectGlobal> {
    return this.t.run(sdk.libraryAddProjectGlobal, {
      path: { projectId: this.projectId },
      body: { sourceId },
    }) as Promise<ProjectGlobal>;
  }
  async get(globalId: string): Promise<ProjectGlobal> {
    return this.t.run(sdk.libraryGetProjectGlobal, {
      path: { projectId: this.projectId, globalId },
    }) as Promise<ProjectGlobal>;
  }
  async update(globalId: string, body: GlobalWrite): Promise<ProjectGlobal> {
    return this.t.run(sdk.libraryUpdateProjectGlobal, {
      path: { projectId: this.projectId, globalId },
      body,
    }) as Promise<ProjectGlobal>;
  }
  async delete(globalId: string): Promise<void> {
    await this.t.run(sdk.libraryDeleteProjectGlobal, {
      path: { projectId: this.projectId, globalId },
    });
  }
}

export class ProjectCurrenciesResource {
  constructor(
    private readonly t: Transport,
    private readonly projectId: string,
  ) {}

  list(params: { limit?: number; cursor?: string } = {}): List<ProjectCurrency> {
    const options = {
      path: { projectId: this.projectId },
      query: { ...params },
    };
    return new List<ProjectCurrency>(
      () => this.t.paginate<typeof options, ProjectCurrency>(sdk.libraryListProjectCurrencies, options),
      () => this.t.runPage<typeof options, ProjectCurrency>(sdk.libraryListProjectCurrencies, options),
    );
  }
  async add(sourceId: string): Promise<ProjectCurrency> {
    return this.t.run(sdk.libraryAddProjectCurrency, {
      path: { projectId: this.projectId },
      body: { sourceId },
    }) as Promise<ProjectCurrency>;
  }
  async get(currencyId: string): Promise<ProjectCurrency> {
    return this.t.run(sdk.libraryGetProjectCurrency, {
      path: { projectId: this.projectId, currencyId },
    }) as Promise<ProjectCurrency>;
  }
  async update(currencyId: string, body: CurrencyWrite): Promise<ProjectCurrency> {
    return this.t.run(sdk.libraryUpdateProjectCurrency, {
      path: { projectId: this.projectId, currencyId },
      body,
    }) as Promise<ProjectCurrency>;
  }
  async delete(currencyId: string): Promise<void> {
    await this.t.run(sdk.libraryDeleteProjectCurrency, {
      path: { projectId: this.projectId, currencyId },
    });
  }
}

export class ProjectFringeGroupsResource {
  constructor(
    private readonly t: Transport,
    private readonly projectId: string,
  ) {}

  list(params: { limit?: number; cursor?: string } = {}): List<ProjectFringeGroup> {
    const options = {
      path: { projectId: this.projectId },
      query: { ...params },
    };
    return new List<ProjectFringeGroup>(
      () => this.t.paginate<typeof options, ProjectFringeGroup>(sdk.libraryListProjectFringeGroups, options),
      () => this.t.runPage<typeof options, ProjectFringeGroup>(sdk.libraryListProjectFringeGroups, options),
    );
  }
  async add(sourceId: string): Promise<ProjectFringeGroup> {
    return this.t.run(sdk.libraryAddProjectFringeGroup, {
      path: { projectId: this.projectId },
      body: { sourceId },
    }) as Promise<ProjectFringeGroup>;
  }
  async get(fringeGroupId: string): Promise<ProjectFringeGroup> {
    return this.t.run(sdk.libraryGetProjectFringeGroup, {
      path: { projectId: this.projectId, fringeGroupId },
    }) as Promise<ProjectFringeGroup>;
  }
  async update(fringeGroupId: string, body: FringeGroupWrite): Promise<ProjectFringeGroup> {
    return this.t.run(sdk.libraryUpdateProjectFringeGroup, {
      path: { projectId: this.projectId, fringeGroupId },
      body,
    }) as Promise<ProjectFringeGroup>;
  }
  async delete(fringeGroupId: string): Promise<void> {
    await this.t.run(sdk.libraryDeleteProjectFringeGroup, {
      path: { projectId: this.projectId, fringeGroupId },
    });
  }
}

export class ProjectTagsResource {
  constructor(
    private readonly t: Transport,
    private readonly projectId: string,
  ) {}

  list(params: { limit?: number; cursor?: string } = {}): List<import('../generated/types.gen.js').Tag> {
    const options = {
      path: { projectId: this.projectId },
      query: { ...params },
    };
    type Row = import('../generated/types.gen.js').Tag;
    return new List<Row>(
      () => this.t.paginate<typeof options, Row>(sdk.libraryListProjectTags, options),
      () => this.t.runPage<typeof options, Row>(sdk.libraryListProjectTags, options),
    );
  }

}
