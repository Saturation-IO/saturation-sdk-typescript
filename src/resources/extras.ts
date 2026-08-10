import * as sdk from '../generated/sdk.gen.js';
import type {
  Comment,
  CommentCreate,
  CommentUpdate,
  CommentTargetKind,
  View,
  ViewData,
  Webhook,
  WebhookCreate,
  WebhookUpdate,
  WebhookWithSecret,
  WebhookDelivery,
  WebhookExpand,
} from '../generated/types.gen.js';
import { Transport, List } from '../http.js';
import { serializeExpand } from '../expand.js';

export interface CommentListParams {
  projectId?: string;
  targetKind?: CommentTargetKind;
  targetId?: string;
  limit?: number;
  cursor?: string;
  sort?: string;
  order?: 'asc' | 'desc';
  withCount?: boolean;
}

/** Workspace comments attached to entities: `sat.comments`. */
export class CommentsResource {
  constructor(private readonly t: Transport) {}

  list(params: CommentListParams = {}): List<Comment> {
    const options = { query: { ...params } };
    return new List<Comment>(
      () => this.t.paginate<typeof options, Comment>(sdk.masterDataListComments, options),
      () => this.t.runPage<typeof options, Comment>(sdk.masterDataListComments, options),
    );
  }
  /** Create a comment. Pass `idempotencyKey` for a safe retry of the create. */
  async create(body: CommentCreate, opts: { idempotencyKey: string }): Promise<Comment> {
    return this.t.run(sdk.masterDataCreateComment, {
      headers: { 'Idempotency-Key': opts.idempotencyKey },
      body,
    }) as Promise<Comment>;
  }
  async update(commentId: string, body: CommentUpdate): Promise<Comment> {
    return this.t.run(sdk.masterDataUpdateComment, {
      path: { commentId },
      body,
    }) as Promise<Comment>;
  }
  async delete(commentId: string): Promise<void> {
    await this.t.run(sdk.masterDataDeleteComment, {
      path: { commentId },
    });
  }
}

/** Saved filter + shape bundles, scoped to one project: `sat.projects(p).views`. */
export class ViewsResource {
  constructor(
    private readonly t: Transport,
    private readonly projectId: string,
  ) {}

  list(params: { limit?: number; cursor?: string } = {}): List<View> {
    const options = {
      path: { projectId: this.projectId },
      query: { ...params },
    };
    return new List<View>(
      () => this.t.paginate<typeof options, View>(sdk.masterDataListViews, options),
      () => this.t.runPage<typeof options, View>(sdk.masterDataListViews, options),
    );
  }

  async get(viewId: string): Promise<View> {
    return this.t.run(sdk.masterDataGetView, {
      path: { projectId: this.projectId, viewId },
    }) as Promise<View>;
  }

  /** Resolve a view's rows. Returns the raw `{ subjectType, data, nextCursor }` page. */
  async data(
    viewId: string,
    params: { expand?: readonly string[]; limit?: number; cursor?: string } = {},
  ): Promise<ViewData> {
    return this.t.run(sdk.masterDataGetViewData, {
      path: { projectId: this.projectId, viewId },
      query: {
        expand: serializeExpand(params.expand),
        limit: params.limit,
        cursor: params.cursor,
      },
    }) as Promise<ViewData>;
  }
}

/** Outbound webhook subscriptions: `sat.webhooks`. Deliveries are HMAC-signed. */
export class WebhooksResource {
  constructor(private readonly t: Transport) {}

  list(params: { expand?: readonly WebhookExpand[]; limit?: number; cursor?: string } = {}): List<Webhook> {
    const options = {
      query: { expand: serializeExpand(params.expand), limit: params.limit, cursor: params.cursor },
    };
    return new List<Webhook>(
      () => this.t.paginate<typeof options, Webhook>(sdk.webhooksList, options),
      () => this.t.runPage<typeof options, Webhook>(sdk.webhooksList, options),
    );
  }

  async get(webhookId: string): Promise<Webhook> {
    return this.t.run(sdk.webhooksGet, {
      path: { webhookId },
    }) as Promise<Webhook>;
  }

  /** Create a subscription. The returned `WebhookWithSecret` exposes the signing secret once. */
  async create(body: WebhookCreate): Promise<WebhookWithSecret> {
    return this.t.run(sdk.webhooksCreate, {
      body,
    }) as Promise<WebhookWithSecret>;
  }

  async update(webhookId: string, body: WebhookUpdate): Promise<Webhook> {
    return this.t.run(sdk.webhooksUpdate, {
      path: { webhookId },
      body,
    }) as Promise<Webhook>;
  }

  async delete(webhookId: string): Promise<void> {
    await this.t.run(sdk.webhooksDelete, {
      path: { webhookId },
    });
  }

  /** Trigger a test delivery to the endpoint. */
  async ping(webhookId: string): Promise<WebhookDelivery> {
    return this.t.run(sdk.webhooksPing, {
      path: { webhookId },
    }) as Promise<WebhookDelivery>;
  }

  /** Inspect the delivery history of a subscription. */
  deliveries(webhookId: string, params: { limit?: number; cursor?: string } = {}): List<WebhookDelivery> {
    const options = {
      path: { webhookId },
      query: { ...params },
    };
    return new List<WebhookDelivery>(
      () => this.t.paginate<typeof options, WebhookDelivery>(sdk.webhooksListDeliveries, options),
      () => this.t.runPage<typeof options, WebhookDelivery>(sdk.webhooksListDeliveries, options),
    );
  }
}
