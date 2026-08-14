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
  Fringe,
  FringeWrite,
  Global,
  GlobalWrite,
  Currency,
  CurrencyWrite,
  FringeGroup,
  FringeGroupWrite,
  Tag,
  TagCreate,
  TagUpdate,
  Unit,
  UnitCreate,
  UnitUpdate,
} from '../generated/types.gen.js';
import { Transport, List } from '../http.js';
import { Expanded, type ExpandMap, serializeExpand } from '../expand.js';

const ratePackExpandMap = { items: 'items' } as const satisfies ExpandMap<'items'>;
const incentivePackExpandMap = { programs: 'programs' } as const satisfies ExpandMap<'programs'>;

/**
 * Reusable Library data for the workspace. Enable packs here, then add their data
 * to a project through `sat.projects(projectId).library`.
 */
export class LibraryResource {
  constructor(private readonly t: Transport) {}

  get ratePacks(): WorkspaceRatePacksResource {
    return new WorkspaceRatePacksResource(this.t);
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
  get fringeGroups(): WorkspaceFringeGroupsResource {
    return new WorkspaceFringeGroupsResource(this.t);
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

export class WorkspaceRatePacksResource {
  constructor(private readonly t: Transport) {}

  list(params: ListParams = {}): List<RatePack> {
    const options = { query: { ...params } };
    return new List<RatePack>(
      () => this.t.paginate<typeof options, RatePack>(sdk.libraryListRatePacks, options),
      () => this.t.runPage<typeof options, RatePack>(sdk.libraryListRatePacks, options),
    );
  }

  async get<E extends 'items' = never>(packId: string, params: { expand?: readonly E[] } = {}): Promise<Expanded<RatePack, typeof ratePackExpandMap, E>> {
    return this.t.run(sdk.libraryGetRatePack, {
      path: { packId },
      query: { expand: serializeExpand(params.expand) },
    }) as Promise<Expanded<RatePack, typeof ratePackExpandMap, E>>;
  }

  async create(body: RatePackCreate, opts: { idempotencyKey: string }): Promise<RatePack> {
    return this.t.run(sdk.libraryCreateRatePack, {
      headers: { 'Idempotency-Key': opts.idempotencyKey },
      body,
    }) as Promise<RatePack>;
  }

  async update(packId: string, body: RatePackUpdate): Promise<RatePack> {
    return this.t.run(sdk.libraryUpdateRatePack, {
      path: { packId },
      body,
    }) as Promise<RatePack>;
  }

  async delete(packId: string): Promise<void> {
    await this.t.run(sdk.libraryDeleteRatePack, {
      path: { packId },
    });
  }

  /** Enable a rate pack for the workspace. Safe to repeat. */
  async enable(packId: string): Promise<RatePackEnableLink> {
    return this.t.run(sdk.libraryEnableRatePack, {
      path: { packId },
    }) as Promise<RatePackEnableLink>;
  }

  /** Disable a rate pack for the workspace. Safe to repeat. */
  async disable(packId: string): Promise<void> {
    await this.t.run(sdk.libraryDisableRatePack, {
      path: { packId },
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
      path: { packId: this.packId },
      query: { ...params },
    };
    return new List<RatePackItem>(
      () => this.t.paginate<typeof options, RatePackItem>(sdk.libraryListRatePackItems, options),
      () => this.t.runPage<typeof options, RatePackItem>(sdk.libraryListRatePackItems, options),
    );
  }

  async create(body: RatePackItemCreate, opts: { idempotencyKey: string }): Promise<RatePackItem> {
    return this.t.run(sdk.libraryCreateRatePackItem, {
      path: { packId: this.packId },
      headers: { 'Idempotency-Key': opts.idempotencyKey },
      body,
    }) as Promise<RatePackItem>;
  }

  async update(itemId: string, body: RatePackItemUpdate): Promise<RatePackItem> {
    return this.t.run(sdk.libraryUpdateRatePackItem, {
      path: { packId: this.packId, itemId },
      body,
    }) as Promise<RatePackItem>;
  }

  async delete(itemId: string): Promise<void> {
    await this.t.run(sdk.libraryDeleteRatePackItem, {
      path: { packId: this.packId, itemId },
    });
  }
}

export class WorkspaceIncentivesResource {
  constructor(private readonly t: Transport) {}

  list(params: ListParams = {}): List<IncentivePack> {
    const options = { query: { ...params } };
    return new List<IncentivePack>(
      () => this.t.paginate<typeof options, IncentivePack>(sdk.libraryListIncentivePacks, options),
      () => this.t.runPage<typeof options, IncentivePack>(sdk.libraryListIncentivePacks, options),
    );
  }

  async get<E extends 'programs' = never>(packId: string, params: { expand?: readonly E[] } = {}): Promise<Expanded<IncentivePack, typeof incentivePackExpandMap, E>> {
    return this.t.run(sdk.libraryGetIncentivePack, {
      path: { packId },
      query: { expand: serializeExpand(params.expand) },
    }) as Promise<Expanded<IncentivePack, typeof incentivePackExpandMap, E>>;
  }

  /** Programs inside a workspace-source incentive pack. */
  programs(packId: string): IncentiveProgramsResource {
    return new IncentiveProgramsResource(this.t, packId);
  }

  async enable(packId: string): Promise<IncentivePackEnableLink> {
    return this.t.run(sdk.libraryEnableIncentivePack, {
      path: { packId },
    }) as Promise<IncentivePackEnableLink>;
  }

  async disable(packId: string): Promise<void> {
    await this.t.run(sdk.libraryDisableIncentivePack, {
      path: { packId },
    });
  }
}

export class IncentiveProgramsResource {
  constructor(private readonly t: Transport, private readonly packId: string) {}

  list(): List<IncentiveProgram> {
    const options = { path: { packId: this.packId } };
    return new List<IncentiveProgram>(
      () => this.t.paginate<typeof options, IncentiveProgram>(sdk.libraryListIncentivePrograms, options),
      () => this.t.runPage<typeof options, IncentiveProgram>(sdk.libraryListIncentivePrograms, options),
    );
  }

}

export class WorkspaceFringesResource {
  constructor(private readonly t: Transport) {}

  list(params: ListParams = {}): List<Fringe> {
    const options = { query: { ...params } };
    return new List<Fringe>(
      () => this.t.paginate<typeof options, Fringe>(sdk.libraryListFringes, options),
      () => this.t.runPage<typeof options, Fringe>(sdk.libraryListFringes, options),
    );
  }
  async get(fringeId: string): Promise<Fringe> {
    return this.t.run(sdk.libraryGetFringe, {
      path: { fringeId },
    }) as Promise<Fringe>;
  }
  async create(body: FringeWrite, opts: { idempotencyKey: string }): Promise<Fringe> {
    return this.t.run(sdk.libraryCreateFringe, {
      headers: { 'Idempotency-Key': opts.idempotencyKey },
      body,
    }) as Promise<Fringe>;
  }
  async update(fringeId: string, body: FringeWrite): Promise<Fringe> {
    return this.t.run(sdk.libraryUpdateFringe, {
      path: { fringeId },
      body,
    }) as Promise<Fringe>;
  }
  async delete(fringeId: string): Promise<void> {
    await this.t.run(sdk.libraryDeleteFringe, {
      path: { fringeId },
    });
  }
}

export class WorkspaceGlobalsResource {
  constructor(private readonly t: Transport) {}

  list(params: ListParams = {}): List<Global> {
    const options = { query: { ...params } };
    return new List<Global>(
      () => this.t.paginate<typeof options, Global>(sdk.libraryListGlobals, options),
      () => this.t.runPage<typeof options, Global>(sdk.libraryListGlobals, options),
    );
  }
  async get(globalId: string): Promise<Global> {
    return this.t.run(sdk.libraryGetGlobal, {
      path: { globalId },
    }) as Promise<Global>;
  }
  async create(body: GlobalWrite, opts: { idempotencyKey: string }): Promise<Global> {
    return this.t.run(sdk.libraryCreateGlobal, {
      headers: { 'Idempotency-Key': opts.idempotencyKey },
      body,
    }) as Promise<Global>;
  }
  async update(globalId: string, body: GlobalWrite): Promise<Global> {
    return this.t.run(sdk.libraryUpdateGlobal, {
      path: { globalId },
      body,
    }) as Promise<Global>;
  }
  async delete(globalId: string): Promise<void> {
    await this.t.run(sdk.libraryDeleteGlobal, {
      path: { globalId },
    });
  }
}

export class WorkspaceCurrenciesResource {
  constructor(private readonly t: Transport) {}

  list(params: ListParams = {}): List<Currency> {
    const options = { query: { ...params } };
    return new List<Currency>(
      () => this.t.paginate<typeof options, Currency>(sdk.libraryListCurrencies, options),
      () => this.t.runPage<typeof options, Currency>(sdk.libraryListCurrencies, options),
    );
  }
  async get(currencyId: string): Promise<Currency> {
    return this.t.run(sdk.libraryGetCurrency, {
      path: { currencyId },
    }) as Promise<Currency>;
  }
  async create(body: CurrencyWrite, opts: { idempotencyKey: string }): Promise<Currency> {
    return this.t.run(sdk.libraryCreateCurrency, {
      headers: { 'Idempotency-Key': opts.idempotencyKey },
      body,
    }) as Promise<Currency>;
  }
  async update(currencyId: string, body: CurrencyWrite): Promise<Currency> {
    return this.t.run(sdk.libraryUpdateCurrency, {
      path: { currencyId },
      body,
    }) as Promise<Currency>;
  }
  async delete(currencyId: string): Promise<void> {
    await this.t.run(sdk.libraryDeleteCurrency, {
      path: { currencyId },
    });
  }
}

export class WorkspaceFringeGroupsResource {
  constructor(private readonly t: Transport) {}

  list(params: ListParams = {}): List<FringeGroup> {
    const options = { query: { ...params } };
    return new List<FringeGroup>(
      () => this.t.paginate<typeof options, FringeGroup>(sdk.libraryListFringeGroups, options),
      () => this.t.runPage<typeof options, FringeGroup>(sdk.libraryListFringeGroups, options),
    );
  }
  async get(fringeGroupId: string): Promise<FringeGroup> {
    return this.t.run(sdk.libraryGetFringeGroup, {
      path: { fringeGroupId },
    }) as Promise<FringeGroup>;
  }
  async create(body: FringeGroupWrite, opts: { idempotencyKey: string }): Promise<FringeGroup> {
    return this.t.run(sdk.libraryCreateFringeGroup, {
      headers: { 'Idempotency-Key': opts.idempotencyKey },
      body,
    }) as Promise<FringeGroup>;
  }
  async update(fringeGroupId: string, body: FringeGroupWrite): Promise<FringeGroup> {
    return this.t.run(sdk.libraryUpdateFringeGroup, {
      path: { fringeGroupId },
      body,
    }) as Promise<FringeGroup>;
  }
  async delete(fringeGroupId: string): Promise<void> {
    await this.t.run(sdk.libraryDeleteFringeGroup, {
      path: { fringeGroupId },
    });
  }
}

export class WorkspaceTagsResource {
  constructor(private readonly t: Transport) {}

  list(params: ListParams = {}): List<Tag> {
    const options = { query: { ...params } };
    return new List<Tag>(
      () => this.t.paginate<typeof options, Tag>(sdk.libraryListTags, options),
      () => this.t.runPage<typeof options, Tag>(sdk.libraryListTags, options),
    );
  }
  async get(tagId: string): Promise<Tag> {
    return this.t.run(sdk.libraryGetTag, {
      path: { tagId },
    }) as Promise<Tag>;
  }
  async create(body: TagCreate, opts: { idempotencyKey: string }): Promise<Tag> {
    return this.t.run(sdk.libraryCreateTag, {
      headers: { 'Idempotency-Key': opts.idempotencyKey },
      body,
    }) as Promise<Tag>;
  }
  async update(tagId: string, body: TagUpdate): Promise<Tag> {
    return this.t.run(sdk.libraryUpdateTag, {
      path: { tagId },
      body,
    }) as Promise<Tag>;
  }
  async delete(tagId: string): Promise<void> {
    await this.t.run(sdk.libraryDeleteTag, {
      path: { tagId },
    });
  }
}

export class WorkspaceUnitsResource {
  constructor(private readonly t: Transport) {}

  /** Built-in + custom units available in the workspace. */
  list(): List<Unit> {
    const options = {};
    return new List<Unit>(
      () => this.t.paginate<typeof options, Unit>(sdk.libraryListUnits, options),
      () => this.t.runPage<typeof options, Unit>(sdk.libraryListUnits, options),
    );
  }

  async get(unitId: string): Promise<Unit> {
    return this.t.run(sdk.libraryGetUnit, { path: { unitId } }) as Promise<Unit>;
  }
  async create(body: UnitCreate, opts: { idempotencyKey: string }): Promise<Unit> {
    return this.t.run(sdk.libraryCreateUnit, {
      headers: { 'Idempotency-Key': opts.idempotencyKey },
      body,
    }) as Promise<Unit>;
  }
  async update(unitId: string, body: UnitUpdate): Promise<Unit> {
    return this.t.run(sdk.libraryUpdateUnit, {
      path: { unitId },
      body,
    }) as Promise<Unit>;
  }
  async delete(unitId: string): Promise<void> {
    await this.t.run(sdk.libraryDeleteUnit, {
      path: { unitId },
    });
  }
}
