import * as sdk from '../generated/sdk.gen.js';
import type {
  Comment,
  CommentCreate,
  CommentUpdate,
  CommentTargetKind,
  Webhook,
  WebhookCreate,
  WebhookUpdate,
  WebhookWithSecret,
  WebhookDelivery,
} from '../generated/types.gen.js';
import { Transport, List } from '../http.js';

export interface CommentListParams {
  targetKind?: CommentTargetKind;
  targetId?: string;
  limit?: number;
  cursor?: string;
  sort?: string;
  order?: 'asc' | 'desc';
  withCount?: boolean;
}

/** Project comments: `sat.projects(projectId).comments`. */
export class CommentsResource {
  constructor(private readonly t: Transport, private readonly projectId: string) {}

  list(params: CommentListParams = {}): List<Comment> {
    const options = { path: { projectId: this.projectId }, query: { ...params } };
    return new List<Comment>(
      () => this.t.paginate<typeof options, Comment>(sdk.commentsList, options),
      () => this.t.runPage<typeof options, Comment>(sdk.commentsList, options),
    );
  }
  /** Create a comment. Pass `idempotencyKey` for a safe retry of the create. */
  async create(body: CommentCreate, opts: { idempotencyKey: string }): Promise<Comment> {
    return this.t.run(sdk.commentsCreate, {
      path: { projectId: this.projectId },
      headers: { 'Idempotency-Key': opts.idempotencyKey },
      body,
    }) as Promise<Comment>;
  }
  async update(commentId: string, body: CommentUpdate): Promise<Comment> {
    return this.t.run(sdk.commentsUpdate, {
      path: { projectId: this.projectId, commentId },
      body,
    }) as Promise<Comment>;
  }
  async delete(commentId: string): Promise<void> {
    await this.t.run(sdk.commentsDelete, {
      path: { projectId: this.projectId, commentId },
    });
  }
}

/** Outbound webhook subscriptions: `sat.webhooks`. Deliveries are HMAC-signed. */
export class WebhooksResource {
  constructor(private readonly t: Transport) {}

  list(params: { limit?: number; cursor?: string } = {}): List<Webhook> {
    const options = {
      query: { limit: params.limit, cursor: params.cursor },
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
  async sendTestDelivery(webhookId: string): Promise<WebhookDelivery> {
    return this.t.run(sdk.webhooksSendTestDelivery, {
      path: { webhookId },
    }) as Promise<WebhookDelivery>;
  }

  /** Inspect the delivery history of a subscription. */
  deliveries(webhookId: string): WebhookDeliveriesResource {
    return new WebhookDeliveriesResource(this.t, webhookId);
  }
}

export class WebhookDeliveriesResource {
  constructor(private readonly t: Transport, private readonly webhookId: string) {}

  list(params: { limit?: number; cursor?: string } = {}): List<WebhookDelivery> {
    const options = {
      path: { webhookId: this.webhookId },
      query: { ...params },
    };
    return new List<WebhookDelivery>(
      () => this.t.paginate<typeof options, WebhookDelivery>(sdk.webhooksListDeliveries, options),
      () => this.t.runPage<typeof options, WebhookDelivery>(sdk.webhooksListDeliveries, options),
    );
  }
}
