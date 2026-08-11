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
  WebhookEvent,
} from '../generated/types.gen.js';
import { Transport, List } from '../http.js';

export interface CommentListParams {
  targetKind?: CommentTargetKind;
  targetId?: string;
  threadId?: string;
  resolved?: boolean;
  limit?: number;
  cursor?: string;
  sort?: string;
  order?: 'asc' | 'desc';
  withCount?: boolean;
}

/** Comments owned by one project: `sat.projects(p).comments`. */
export class CommentsResource {
  constructor(private readonly t: Transport, private readonly projectId: string) {}

  list(params: CommentListParams = {}): List<Comment> {
    const options = { path: { projectId: this.projectId }, query: { ...params } };
    return new List<Comment>(
      () => this.t.paginate<typeof options, Comment>(sdk.masterDataListComments, options),
      () => this.t.runPage<typeof options, Comment>(sdk.masterDataListComments, options),
    );
  }
  async create(body: CommentCreate, opts: { idempotencyKey: string }): Promise<Comment> {
    return this.t.run(sdk.masterDataCreateComment, {
      path: { projectId: this.projectId },
      headers: { 'Idempotency-Key': opts.idempotencyKey },
      body,
    }) as Promise<Comment>;
  }
  async update(commentId: string, body: CommentUpdate): Promise<Comment> {
    return this.t.run(sdk.masterDataUpdateComment, {
      path: { projectId: this.projectId, commentId }, body,
    }) as Promise<Comment>;
  }
  async delete(commentId: string): Promise<void> {
    await this.t.run(sdk.masterDataDeleteComment, {
      path: { projectId: this.projectId, commentId },
    });
  }
}

/** Outbound webhook subscriptions: `sat.webhooks`. */
export class WebhooksResource {
  constructor(private readonly t: Transport) {}

  list(params: { events?: WebhookEvent[]; active?: boolean; limit?: number; cursor?: string; sort?: string; order?: 'asc' | 'desc'; withCount?: boolean } = {}): List<Webhook> {
    const options = { query: { ...params } };
    return new List<Webhook>(
      () => this.t.paginate<typeof options, Webhook>(sdk.webhooksList, options),
      () => this.t.runPage<typeof options, Webhook>(sdk.webhooksList, options),
    );
  }

  async get(webhookId: string): Promise<Webhook> {
    return this.t.run(sdk.webhooksGet, { path: { webhookId } }) as Promise<Webhook>;
  }
  async create(body: WebhookCreate): Promise<WebhookWithSecret> {
    return this.t.run(sdk.webhooksCreate, { body }) as Promise<WebhookWithSecret>;
  }
  async update(webhookId: string, body: WebhookUpdate): Promise<Webhook> {
    return this.t.run(sdk.webhooksUpdate, { path: { webhookId }, body }) as Promise<Webhook>;
  }
  async delete(webhookId: string): Promise<void> {
    await this.t.run(sdk.webhooksDelete, { path: { webhookId } });
  }
  async testDelivery(webhookId: string): Promise<WebhookDelivery> {
    return this.t.run(sdk.webhooksSendTestDelivery, { path: { webhookId } }) as Promise<WebhookDelivery>;
  }
  deliveries(webhookId: string, params: { limit?: number; cursor?: string; sort?: string; order?: 'asc' | 'desc'; withCount?: boolean } = {}): List<WebhookDelivery> {
    const options = { path: { webhookId }, query: { ...params } };
    return new List<WebhookDelivery>(
      () => this.t.paginate<typeof options, WebhookDelivery>(sdk.webhooksListDeliveries, options),
      () => this.t.runPage<typeof options, WebhookDelivery>(sdk.webhooksListDeliveries, options),
    );
  }
}
