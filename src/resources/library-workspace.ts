import * as sdk from '../generated/sdk.gen.js';
import type {
  RatePack,
  RatePackCreate,
  RatePackUpdate,
  RatePackItem,
  RatePackItemCreate,
  RatePackItemUpdate,
  RatePackEnableLink,
  IncentivePack,
  IncentiveProgram,
  IncentivePackEnableLink,
  FringeTemplate,
  FringeTemplateWrite,
  GlobalTemplate,
  GlobalTemplateWrite,
  CurrencyTemplate,
  CurrencyTemplateWrite,
  FringeTagTemplate,
  FringeTagTemplateWrite,
  Tag,
  TagCreate,
  TagUpdate,
  Unit,
  CustomUnit,
  CustomUnitCreate,
  CustomUnitUpdate,
} from '../generated/types.gen.js';
import { Transport, List } from '../http.js';

/**
 * The workspace-scope Library — the *source* surface. Packs are enabled here;
 * resident copies live on a project (`sat.projects(p).library.*`). The two scopes
 * are visible at the call site by construction.
 */
export class LibraryResource {
  constructor(private readonly t: Transport) {}

  get rates(): WorkspaceRatesResource {
    return new WorkspaceRatesResource(this.t);
  }
  get incentives(): WorkspaceIncentivesResource {
    return new WorkspaceIncentivesResource(this.t);
  }
  get fringes(): WorkspaceFringesResource {
    return new WorkspaceFringesResource(this.t);
  }
  get globals(): WorkspaceGlobalsResource {
    return new WorkspaceGlobalsResource(this.t);
  }
  get currencies(): WorkspaceCurrenciesResource {
    return new WorkspaceCurrenciesResource(this.t);
  }
  get fringeTags(): WorkspaceFringeTagsResource {
    return new WorkspaceFringeTagsResource(this.t);
  }
  get tags(): WorkspaceTagsResource {
    return new WorkspaceTagsResource(this.t);
  }
  get units(): WorkspaceUnitsResource {
    return new WorkspaceUnitsResource(this.t);
  }
}

interface ListParams {
  limit?: number;
  cursor?: string;
  sort?: string;
  order?: 'asc' | 'desc';
  withCount?: boolean;
}

export class WorkspaceRatesResource {
  constructor(private readonly t: Transport) {}

  list(params: ListParams = {}): List<RatePack> {
    const options = { path: { workspaceId: this.t.workspaceId }, query: { ...params } };
    return new List<RatePack>(
      () => this.t.paginate<typeof options, RatePack>(sdk.libraryListRatePacks, options),
      () => this.t.runPage<typeof options, RatePack>(sdk.libraryListRatePacks, options),
    );
  }

  async get(packId: string, params: { expand?: readonly 'items'[] } = {}): Promise<RatePack> {
    return this.t.run(sdk.libraryGetRatePack, {
      path: { workspaceId: this.t.workspaceId, packId },
      query: params.expand ? { expand: [...params.expand] } : undefined,
    }) as Promise<RatePack>;
  }

  async create(body: RatePackCreate, opts: { idempotencyKey?: string } = {}): Promise<RatePack> {
    return this.t.run(sdk.libraryCreateRatePack, {
      path: { workspaceId: this.t.workspaceId },
      headers: opts.idempotencyKey ? { 'Idempotency-Key': opts.idempotencyKey } : undefined,
      body,
    }) as Promise<RatePack>;
  }

  async update(packId: string, body: RatePackUpdate): Promise<RatePack> {
    return this.t.run(sdk.libraryUpdateRatePack, {
      path: { workspaceId: this.t.workspaceId, packId },
      body,
    }) as Promise<RatePack>;
  }

  async delete(packId: string): Promise<void> {
    await this.t.run(sdk.libraryDeleteRatePack, {
      path: { workspaceId: this.t.workspaceId, packId },
    });
  }

  /** Enable a rate pack at the workspace (idempotent lifecycle verb). */
  async enable(packId: string): Promise<RatePackEnableLink> {
    return this.t.run(sdk.libraryEnableRatePack, {
      path: { workspaceId: this.t.workspaceId, packId },
    }) as Promise<RatePackEnableLink>;
  }

  /** Disable a rate pack at the workspace (idempotent lifecycle verb). */
  async disable(packId: string): Promise<void> {
    await this.t.run(sdk.libraryDisableRatePack, {
      path: { workspaceId: this.t.workspaceId, packId },
    });
  }

  /** Items inside a workspace-source rate pack. */
  items(packId: string): WorkspaceRatePackItemsResource {
    return new WorkspaceRatePackItemsResource(this.t, packId);
  }
}

export class WorkspaceRatePackItemsResource {
  constructor(
    private readonly t: Transport,
    private readonly packId: string,
  ) {}

  list(params: ListParams = {}): List<RatePackItem> {
    const options = {
      path: { workspaceId: this.t.workspaceId, packId: this.packId },
      query: { ...params },
    };
    return new List<RatePackItem>(
      () => this.t.paginate<typeof options, RatePackItem>(sdk.libraryListRatePackItems, options),
      () => this.t.runPage<typeof options, RatePackItem>(sdk.libraryListRatePackItems, options),
    );
  }

  async create(body: RatePackItemCreate): Promise<RatePackItem> {
    return this.t.run(sdk.libraryCreateRatePackItem, {
      path: { workspaceId: this.t.workspaceId, packId: this.packId },
      body,
    }) as Promise<RatePackItem>;
  }

  async update(itemId: string, body: RatePackItemUpdate): Promise<RatePackItem> {
    return this.t.run(sdk.libraryUpdateRatePackItem, {
      path: { workspaceId: this.t.workspaceId, packId: this.packId, itemId },
      body,
    }) as Promise<RatePackItem>;
  }

  async delete(itemId: string): Promise<void> {
    await this.t.run(sdk.libraryDeleteRatePackItem, {
      path: { workspaceId: this.t.workspaceId, packId: this.packId, itemId },
    });
  }
}

export class WorkspaceIncentivesResource {
  constructor(private readonly t: Transport) {}

  list(params: ListParams = {}): List<IncentivePack> {
    const options = { path: { workspaceId: this.t.workspaceId }, query: { ...params } };
    return new List<IncentivePack>(
      () => this.t.paginate<typeof options, IncentivePack>(sdk.libraryListIncentivePacks, options),
      () => this.t.runPage<typeof options, IncentivePack>(sdk.libraryListIncentivePacks, options),
    );
  }

  async get(packId: string, params: { expand?: readonly 'programs'[] } = {}): Promise<IncentivePack> {
    return this.t.run(sdk.libraryGetIncentivePack, {
      path: { workspaceId: this.t.workspaceId, packId },
      query: params.expand ? { expand: [...params.expand] } : undefined,
    }) as Promise<IncentivePack>;
  }

  /** Programs inside a workspace-source incentive pack. */
  programs(packId: string): List<IncentiveProgram> {
    const options = { path: { workspaceId: this.t.workspaceId, packId } };
    return new List<IncentiveProgram>(
      () => this.t.paginate<typeof options, IncentiveProgram>(sdk.libraryListIncentivePrograms, options),
      () => this.t.runPage<typeof options, IncentiveProgram>(sdk.libraryListIncentivePrograms, options),
    );
  }

  async enable(packId: string): Promise<IncentivePackEnableLink> {
    return this.t.run(sdk.libraryEnableIncentivePack, {
      path: { workspaceId: this.t.workspaceId, packId },
    }) as Promise<IncentivePackEnableLink>;
  }

  async disable(packId: string): Promise<void> {
    await this.t.run(sdk.libraryDisableIncentivePack, {
      path: { workspaceId: this.t.workspaceId, packId },
    });
  }
}

export class WorkspaceFringesResource {
  constructor(private readonly t: Transport) {}

  list(params: ListParams = {}): List<FringeTemplate> {
    const options = { path: { workspaceId: this.t.workspaceId }, query: { ...params } };
    return new List<FringeTemplate>(
      () => this.t.paginate<typeof options, FringeTemplate>(sdk.libraryListFringeTemplates, options),
      () => this.t.runPage<typeof options, FringeTemplate>(sdk.libraryListFringeTemplates, options),
    );
  }
  async get(fringeId: string): Promise<FringeTemplate> {
    return this.t.run(sdk.libraryGetFringeTemplate, {
      path: { workspaceId: this.t.workspaceId, fringeId },
    }) as Promise<FringeTemplate>;
  }
  async create(body: FringeTemplateWrite): Promise<FringeTemplate> {
    return this.t.run(sdk.libraryCreateFringeTemplate, {
      path: { workspaceId: this.t.workspaceId },
      body,
    }) as Promise<FringeTemplate>;
  }
  async update(fringeId: string, body: FringeTemplateWrite): Promise<FringeTemplate> {
    return this.t.run(sdk.libraryUpdateFringeTemplate, {
      path: { workspaceId: this.t.workspaceId, fringeId },
      body,
    }) as Promise<FringeTemplate>;
  }
  async delete(fringeId: string): Promise<void> {
    await this.t.run(sdk.libraryDeleteFringeTemplate, {
      path: { workspaceId: this.t.workspaceId, fringeId },
    });
  }
}

export class WorkspaceGlobalsResource {
  constructor(private readonly t: Transport) {}

  list(params: ListParams = {}): List<GlobalTemplate> {
    const options = { path: { workspaceId: this.t.workspaceId }, query: { ...params } };
    return new List<GlobalTemplate>(
      () => this.t.paginate<typeof options, GlobalTemplate>(sdk.libraryListGlobalTemplates, options),
      () => this.t.runPage<typeof options, GlobalTemplate>(sdk.libraryListGlobalTemplates, options),
    );
  }
  async get(globalId: string): Promise<GlobalTemplate> {
    return this.t.run(sdk.libraryGetGlobalTemplate, {
      path: { workspaceId: this.t.workspaceId, globalId },
    }) as Promise<GlobalTemplate>;
  }
  async create(body: GlobalTemplateWrite): Promise<GlobalTemplate> {
    return this.t.run(sdk.libraryCreateGlobalTemplate, {
      path: { workspaceId: this.t.workspaceId },
      body,
    }) as Promise<GlobalTemplate>;
  }
  async update(globalId: string, body: GlobalTemplateWrite): Promise<GlobalTemplate> {
    return this.t.run(sdk.libraryUpdateGlobalTemplate, {
      path: { workspaceId: this.t.workspaceId, globalId },
      body,
    }) as Promise<GlobalTemplate>;
  }
  async delete(globalId: string): Promise<void> {
    await this.t.run(sdk.libraryDeleteGlobalTemplate, {
      path: { workspaceId: this.t.workspaceId, globalId },
    });
  }
}

export class WorkspaceCurrenciesResource {
  constructor(private readonly t: Transport) {}

  list(params: ListParams = {}): List<CurrencyTemplate> {
    const options = { path: { workspaceId: this.t.workspaceId }, query: { ...params } };
    return new List<CurrencyTemplate>(
      () => this.t.paginate<typeof options, CurrencyTemplate>(sdk.libraryListCurrencyTemplates, options),
      () => this.t.runPage<typeof options, CurrencyTemplate>(sdk.libraryListCurrencyTemplates, options),
    );
  }
  async get(currencyId: string): Promise<CurrencyTemplate> {
    return this.t.run(sdk.libraryGetCurrencyTemplate, {
      path: { workspaceId: this.t.workspaceId, currencyId },
    }) as Promise<CurrencyTemplate>;
  }
  async create(body: CurrencyTemplateWrite): Promise<CurrencyTemplate> {
    return this.t.run(sdk.libraryCreateCurrencyTemplate, {
      path: { workspaceId: this.t.workspaceId },
      body,
    }) as Promise<CurrencyTemplate>;
  }
  async update(currencyId: string, body: CurrencyTemplateWrite): Promise<CurrencyTemplate> {
    return this.t.run(sdk.libraryUpdateCurrencyTemplate, {
      path: { workspaceId: this.t.workspaceId, currencyId },
      body,
    }) as Promise<CurrencyTemplate>;
  }
  async delete(currencyId: string): Promise<void> {
    await this.t.run(sdk.libraryDeleteCurrencyTemplate, {
      path: { workspaceId: this.t.workspaceId, currencyId },
    });
  }
}

export class WorkspaceFringeTagsResource {
  constructor(private readonly t: Transport) {}

  list(params: ListParams = {}): List<FringeTagTemplate> {
    const options = { path: { workspaceId: this.t.workspaceId }, query: { ...params } };
    return new List<FringeTagTemplate>(
      () => this.t.paginate<typeof options, FringeTagTemplate>(sdk.libraryListFringeTagTemplates, options),
      () => this.t.runPage<typeof options, FringeTagTemplate>(sdk.libraryListFringeTagTemplates, options),
    );
  }
  async get(fringeTagId: string): Promise<FringeTagTemplate> {
    return this.t.run(sdk.libraryGetFringeTagTemplate, {
      path: { workspaceId: this.t.workspaceId, fringeTagId },
    }) as Promise<FringeTagTemplate>;
  }
  async create(body: FringeTagTemplateWrite): Promise<FringeTagTemplate> {
    return this.t.run(sdk.libraryCreateFringeTagTemplate, {
      path: { workspaceId: this.t.workspaceId },
      body,
    }) as Promise<FringeTagTemplate>;
  }
  async update(fringeTagId: string, body: FringeTagTemplateWrite): Promise<FringeTagTemplate> {
    return this.t.run(sdk.libraryUpdateFringeTagTemplate, {
      path: { workspaceId: this.t.workspaceId, fringeTagId },
      body,
    }) as Promise<FringeTagTemplate>;
  }
  async delete(fringeTagId: string): Promise<void> {
    await this.t.run(sdk.libraryDeleteFringeTagTemplate, {
      path: { workspaceId: this.t.workspaceId, fringeTagId },
    });
  }
}

export class WorkspaceTagsResource {
  constructor(private readonly t: Transport) {}

  list(params: ListParams = {}): List<Tag> {
    const options = { path: { workspaceId: this.t.workspaceId }, query: { ...params } };
    return new List<Tag>(
      () => this.t.paginate<typeof options, Tag>(sdk.libraryListTags, options),
      () => this.t.runPage<typeof options, Tag>(sdk.libraryListTags, options),
    );
  }
  async get(tagId: string): Promise<Tag> {
    return this.t.run(sdk.libraryGetTag, {
      path: { workspaceId: this.t.workspaceId, tagId },
    }) as Promise<Tag>;
  }
  async create(body: TagCreate): Promise<Tag> {
    return this.t.run(sdk.libraryCreateTag, {
      path: { workspaceId: this.t.workspaceId },
      body,
    }) as Promise<Tag>;
  }
  async update(tagId: string, body: TagUpdate): Promise<Tag> {
    return this.t.run(sdk.libraryUpdateTag, {
      path: { workspaceId: this.t.workspaceId, tagId },
      body,
    }) as Promise<Tag>;
  }
  async delete(tagId: string): Promise<void> {
    await this.t.run(sdk.libraryDeleteTag, {
      path: { workspaceId: this.t.workspaceId, tagId },
    });
  }
}

export class WorkspaceUnitsResource {
  constructor(private readonly t: Transport) {}

  /** Built-in + custom units available in the workspace. */
  list(): List<Unit> {
    const options = { path: { workspaceId: this.t.workspaceId } };
    return new List<Unit>(
      () => this.t.paginate<typeof options, Unit>(sdk.libraryListUnits, options),
      () => this.t.runPage<typeof options, Unit>(sdk.libraryListUnits, options),
    );
  }

  /** Custom (workspace-defined) units. */
  custom(): WorkspaceCustomUnitsResource {
    return new WorkspaceCustomUnitsResource(this.t);
  }
}

export class WorkspaceCustomUnitsResource {
  constructor(private readonly t: Transport) {}

  list(): List<CustomUnit> {
    const options = { path: { workspaceId: this.t.workspaceId } };
    return new List<CustomUnit>(
      () => this.t.paginate<typeof options, CustomUnit>(sdk.libraryListCustomUnits, options),
      () => this.t.runPage<typeof options, CustomUnit>(sdk.libraryListCustomUnits, options),
    );
  }
  async create(body: CustomUnitCreate): Promise<CustomUnit> {
    return this.t.run(sdk.libraryCreateCustomUnit, {
      path: { workspaceId: this.t.workspaceId },
      body,
    }) as Promise<CustomUnit>;
  }
  async update(unitId: string, body: CustomUnitUpdate): Promise<CustomUnit> {
    return this.t.run(sdk.libraryUpdateCustomUnit, {
      path: { workspaceId: this.t.workspaceId, unitId },
      body,
    }) as Promise<CustomUnit>;
  }
  async delete(unitId: string): Promise<void> {
    await this.t.run(sdk.libraryDeleteCustomUnit, {
      path: { workspaceId: this.t.workspaceId, unitId },
    });
  }
}
