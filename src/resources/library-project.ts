import * as sdk from '../generated/sdk.gen.js';
import type {
  ProjectRatePack,
  ProjectRatePackExpand,
  ProjectIncentive,
  ProjectIncentiveAdd,
  ProjectIncentiveUpdate,
  ProjectIncentiveExpand,
  FringeCopy,
  GlobalCopy,
  CurrencyCopy,
  FringeTagCopy,
  FringeTemplateWrite,
  GlobalTemplateWrite,
  CurrencyTemplateWrite,
  FringeTagTemplateWrite,
  TagCreate,
} from '../generated/types.gen.js';
import { Transport, List } from '../http.js';
import { Expanded, type ExpandMap, serializeExpand } from '../expand.js';

const projectRatePackExpandMap = {
  installedPack: 'installedPack',
} satisfies ExpandMap<ProjectRatePackExpand>;
type ProjectRatePackExpandMap = typeof projectRatePackExpandMap;

const projectIncentiveExpandMap = {
  sourceItem: 'sourceItem',
  components: 'components',
} satisfies ExpandMap<ProjectIncentiveExpand>;
type ProjectIncentiveExpandMap = typeof projectIncentiveExpandMap;

/**
 * The project-scope Library — *resident* copies. Rate packs are installed here
 * (copy-on-use from the workspace source); incentives / fringes / globals /
 * currencies / fringe-tags are added from a workspace source. Editing a resident
 * copy diverges it without breaking provenance (`sourceId`).
 */
export class ProjectLibraryResource {
  constructor(
    private readonly t: Transport,
    private readonly projectId: string,
  ) {}

  get rates(): ProjectRatesResource {
    return new ProjectRatesResource(this.t, this.projectId);
  }
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
  get fringeTags(): ProjectFringeTagsResource {
    return new ProjectFringeTagsResource(this.t, this.projectId);
  }
  get tags(): ProjectTagsResource {
    return new ProjectTagsResource(this.t, this.projectId);
  }
}

export class ProjectRatesResource {
  constructor(
    private readonly t: Transport,
    private readonly projectId: string,
  ) {}

  list<E extends ProjectRatePackExpand = never>(
    params: { expand?: readonly E[]; limit?: number; cursor?: string } = {},
  ): List<Expanded<ProjectRatePack, ProjectRatePackExpandMap, E>> {
    const options = {
      path: { workspaceId: this.t.workspaceId, projectId: this.projectId },
      query: { expand: serializeExpand(params.expand), limit: params.limit, cursor: params.cursor },
    };
    type Row = Expanded<ProjectRatePack, ProjectRatePackExpandMap, E>;
    return new List<Row>(
      () => this.t.paginate<typeof options, Row>(sdk.libraryListProjectRatePacks, options),
      () => this.t.runPage<typeof options, Row>(sdk.libraryListProjectRatePacks, options),
    );
  }

  /** Add a workspace-enabled rate pack to this project. Safe to call again. */
  async add(packId: string): Promise<ProjectRatePack> {
    return this.t.run(sdk.libraryAddRatePack, {
      path: { workspaceId: this.t.workspaceId, projectId: this.projectId, packId },
    }) as Promise<ProjectRatePack>;
  }

  /** Remove a rate pack from this project. Safe to call again. */
  async remove(packId: string): Promise<void> {
    await this.t.run(sdk.libraryRemoveRatePack, {
      path: { workspaceId: this.t.workspaceId, projectId: this.projectId, packId },
    });
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
      path: { workspaceId: this.t.workspaceId, projectId: this.projectId },
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
      path: { workspaceId: this.t.workspaceId, projectId: this.projectId, incentiveId },
      query: { expand: serializeExpand(params.expand) },
    }) as Promise<Expanded<ProjectIncentive, ProjectIncentiveExpandMap, E>>;
  }

  /** Add an incentive to the project from a workspace/saturation source (idempotent). */
  async add(body: ProjectIncentiveAdd): Promise<ProjectIncentive> {
    return this.t.run(sdk.libraryAddProjectIncentive, {
      path: { workspaceId: this.t.workspaceId, projectId: this.projectId },
      body,
    }) as Promise<ProjectIncentive>;
  }

  async update(incentiveId: string, body: ProjectIncentiveUpdate): Promise<ProjectIncentive> {
    return this.t.run(sdk.libraryUpdateProjectIncentive, {
      path: { workspaceId: this.t.workspaceId, projectId: this.projectId, incentiveId },
      body,
    }) as Promise<ProjectIncentive>;
  }

  async delete(incentiveId: string): Promise<void> {
    await this.t.run(sdk.libraryDeleteProjectIncentive, {
      path: { workspaceId: this.t.workspaceId, projectId: this.projectId, incentiveId },
    });
  }
}

export class ProjectFringesResource {
  constructor(
    private readonly t: Transport,
    private readonly projectId: string,
  ) {}

  list(params: { limit?: number; cursor?: string } = {}): List<FringeCopy> {
    const options = {
      path: { workspaceId: this.t.workspaceId, projectId: this.projectId },
      query: { ...params },
    };
    return new List<FringeCopy>(
      () => this.t.paginate<typeof options, FringeCopy>(sdk.libraryListProjectFringes, options),
      () => this.t.runPage<typeof options, FringeCopy>(sdk.libraryListProjectFringes, options),
    );
  }
  async add(sourceId: string): Promise<FringeCopy> {
    return this.t.run(sdk.libraryAddProjectFringe, {
      path: { workspaceId: this.t.workspaceId, projectId: this.projectId },
      body: { sourceId },
    }) as Promise<FringeCopy>;
  }
  async get(fringeId: string): Promise<FringeCopy> {
    return this.t.run(sdk.libraryGetProjectFringe, {
      path: { workspaceId: this.t.workspaceId, projectId: this.projectId, fringeId },
    }) as Promise<FringeCopy>;
  }
  async update(fringeId: string, body: FringeTemplateWrite): Promise<FringeCopy> {
    return this.t.run(sdk.libraryUpdateProjectFringe, {
      path: { workspaceId: this.t.workspaceId, projectId: this.projectId, fringeId },
      body,
    }) as Promise<FringeCopy>;
  }
  async delete(fringeId: string): Promise<void> {
    await this.t.run(sdk.libraryDeleteProjectFringe, {
      path: { workspaceId: this.t.workspaceId, projectId: this.projectId, fringeId },
    });
  }
}

export class ProjectGlobalsResource {
  constructor(
    private readonly t: Transport,
    private readonly projectId: string,
  ) {}

  list(params: { limit?: number; cursor?: string } = {}): List<GlobalCopy> {
    const options = {
      path: { workspaceId: this.t.workspaceId, projectId: this.projectId },
      query: { ...params },
    };
    return new List<GlobalCopy>(
      () => this.t.paginate<typeof options, GlobalCopy>(sdk.libraryListProjectGlobals, options),
      () => this.t.runPage<typeof options, GlobalCopy>(sdk.libraryListProjectGlobals, options),
    );
  }
  async add(sourceId: string): Promise<GlobalCopy> {
    return this.t.run(sdk.libraryAddProjectGlobal, {
      path: { workspaceId: this.t.workspaceId, projectId: this.projectId },
      body: { sourceId },
    }) as Promise<GlobalCopy>;
  }
  async get(globalId: string): Promise<GlobalCopy> {
    return this.t.run(sdk.libraryGetProjectGlobal, {
      path: { workspaceId: this.t.workspaceId, projectId: this.projectId, globalId },
    }) as Promise<GlobalCopy>;
  }
  async update(globalId: string, body: GlobalTemplateWrite): Promise<GlobalCopy> {
    return this.t.run(sdk.libraryUpdateProjectGlobal, {
      path: { workspaceId: this.t.workspaceId, projectId: this.projectId, globalId },
      body,
    }) as Promise<GlobalCopy>;
  }
  async delete(globalId: string): Promise<void> {
    await this.t.run(sdk.libraryDeleteProjectGlobal, {
      path: { workspaceId: this.t.workspaceId, projectId: this.projectId, globalId },
    });
  }
}

export class ProjectCurrenciesResource {
  constructor(
    private readonly t: Transport,
    private readonly projectId: string,
  ) {}

  list(params: { limit?: number; cursor?: string } = {}): List<CurrencyCopy> {
    const options = {
      path: { workspaceId: this.t.workspaceId, projectId: this.projectId },
      query: { ...params },
    };
    return new List<CurrencyCopy>(
      () => this.t.paginate<typeof options, CurrencyCopy>(sdk.libraryListProjectCurrencies, options),
      () => this.t.runPage<typeof options, CurrencyCopy>(sdk.libraryListProjectCurrencies, options),
    );
  }
  async add(sourceId: string): Promise<CurrencyCopy> {
    return this.t.run(sdk.libraryAddProjectCurrency, {
      path: { workspaceId: this.t.workspaceId, projectId: this.projectId },
      body: { sourceId },
    }) as Promise<CurrencyCopy>;
  }
  async get(currencyId: string): Promise<CurrencyCopy> {
    return this.t.run(sdk.libraryGetProjectCurrency, {
      path: { workspaceId: this.t.workspaceId, projectId: this.projectId, currencyId },
    }) as Promise<CurrencyCopy>;
  }
  async update(currencyId: string, body: CurrencyTemplateWrite): Promise<CurrencyCopy> {
    return this.t.run(sdk.libraryUpdateProjectCurrency, {
      path: { workspaceId: this.t.workspaceId, projectId: this.projectId, currencyId },
      body,
    }) as Promise<CurrencyCopy>;
  }
  async delete(currencyId: string): Promise<void> {
    await this.t.run(sdk.libraryDeleteProjectCurrency, {
      path: { workspaceId: this.t.workspaceId, projectId: this.projectId, currencyId },
    });
  }
}

export class ProjectFringeTagsResource {
  constructor(
    private readonly t: Transport,
    private readonly projectId: string,
  ) {}

  list(params: { limit?: number; cursor?: string } = {}): List<FringeTagCopy> {
    const options = {
      path: { workspaceId: this.t.workspaceId, projectId: this.projectId },
      query: { ...params },
    };
    return new List<FringeTagCopy>(
      () => this.t.paginate<typeof options, FringeTagCopy>(sdk.libraryListProjectFringeTags, options),
      () => this.t.runPage<typeof options, FringeTagCopy>(sdk.libraryListProjectFringeTags, options),
    );
  }
  async add(sourceId: string): Promise<FringeTagCopy> {
    return this.t.run(sdk.libraryAddProjectFringeTag, {
      path: { workspaceId: this.t.workspaceId, projectId: this.projectId },
      body: { sourceId },
    }) as Promise<FringeTagCopy>;
  }
  async get(fringeTagId: string): Promise<FringeTagCopy> {
    return this.t.run(sdk.libraryGetProjectFringeTag, {
      path: { workspaceId: this.t.workspaceId, projectId: this.projectId, fringeTagId },
    }) as Promise<FringeTagCopy>;
  }
  async update(fringeTagId: string, body: FringeTagTemplateWrite): Promise<FringeTagCopy> {
    return this.t.run(sdk.libraryUpdateProjectFringeTag, {
      path: { workspaceId: this.t.workspaceId, projectId: this.projectId, fringeTagId },
      body,
    }) as Promise<FringeTagCopy>;
  }
  async delete(fringeTagId: string): Promise<void> {
    await this.t.run(sdk.libraryDeleteProjectFringeTag, {
      path: { workspaceId: this.t.workspaceId, projectId: this.projectId, fringeTagId },
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
      path: { workspaceId: this.t.workspaceId, projectId: this.projectId },
      query: { ...params },
    };
    type Row = import('../generated/types.gen.js').Tag;
    return new List<Row>(
      () => this.t.paginate<typeof options, Row>(sdk.libraryListProjectTags, options),
      () => this.t.runPage<typeof options, Row>(sdk.libraryListProjectTags, options),
    );
  }

  /** Add a tag to the project (creating it inline if `tag` is supplied). Safe to call again. */
  async add(tagId: string, body: { tag?: TagCreate } = {}): Promise<unknown> {
    return this.t.run(sdk.libraryAddProjectTag, {
      path: { workspaceId: this.t.workspaceId, projectId: this.projectId, tagId },
      body,
    });
  }

  /** Remove a tag from the project. Safe to call again. */
  async remove(tagId: string): Promise<void> {
    await this.t.run(sdk.libraryRemoveProjectTag, {
      path: { workspaceId: this.t.workspaceId, projectId: this.projectId, tagId },
    });
  }
}
