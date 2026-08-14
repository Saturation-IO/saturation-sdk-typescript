import * as sdk from '../generated/sdk.gen.js';
import type {
  Document,
  DocumentCreateRequest,
  DocumentUpdateRequest,
  DocumentStatus,
  DocumentExtraction,
  DocumentWritableTargetKind,
  DocumentLinkRequest,
} from '../generated/types.gen.js';
import { Transport, List } from '../http.js';

/**
 * A typed document link target. Exactly one relation key is supplied;
 * its value is the target entity's canonical id. This collapses the OpenAPI
 * `{ kind, id }` ref into an ergonomic discriminated shape so the SDK never
 * surfaces a hand-built domain address. Use `sat.documents.link(doc, { transaction: txId })`.
 */
export type LinkTarget =
  | { transaction: string }
  | { payment: string }
  | { budgetLine: string }
  | { purchaseOrder: string }
  | { contact: string }
  | { project: string };

/** Translate the ergonomic `LinkTarget` to the wire `{ kind, id }` ref. */
function toTargetRef(target: LinkTarget): { kind: DocumentWritableTargetKind; id: string } {
  const entries = Object.entries(target);
  // A single-key object by construction of the union; guard defensively.
  const [kind, id] = entries[0] as [DocumentWritableTargetKind, string];
  return { kind, id };
}

export interface DocumentListParams {
  /** Restrict to documents linked to a target, as `kind:id` (e.g. `transaction:txn_…`). */
  linkedTo?: string;
  /** Restrict to documents with no links. */
  unassigned?: boolean;
  /** Restrict to documents in this folder (`fld_…`). */
  folder?: string;
  /** Restrict to documents in this processing status. */
  status?: DocumentStatus;
  /** Restrict to documents scoped to this project (`prj_…`). */
  project?: string;
  limit?: number;
  cursor?: string;
  sort?: string;
  order?: 'asc' | 'desc';
  withCount?: boolean;
  view?: string;
}

/** The workspace-scoped documents namespace: `sat.documents`. */
export class DocumentsResource {
  constructor(private readonly t: Transport) {}

  /** List documents (keyset-paginated async iterator). */
  list(params: DocumentListParams = {}): List<Document> {
    const options = {
      query: {
        linkedTo: params.linkedTo,
        unassigned: params.unassigned,
        folder: params.folder,
        status: params.status,
        project: params.project,
        limit: params.limit,
        cursor: params.cursor,
        sort: params.sort,
        order: params.order,
        withCount: params.withCount,
        view: params.view,
      },
    };
    return new List<Document>(
      () => this.t.paginate<typeof options, Document>(sdk.documentsList, options),
      () => this.t.runPage<typeof options, Document>(sdk.documentsList, options),
    );
  }

  /** Get a document by id. */
  async get(documentId: string): Promise<Document> {
    return this.t.run(sdk.documentsGet, {
      path: { documentId },
    }) as Promise<Document>;
  }

  /** Upload a document. Pass `idempotencyKey` to make the upload safe to retry. */
  async upload(
    body: DocumentCreateRequest,
    opts: { idempotencyKey: string },
  ): Promise<Document> {
    return this.t.run(sdk.documentsUpload, {
      headers: { 'Idempotency-Key': opts.idempotencyKey },
      body,
    }) as Promise<Document>;
  }

  /** Patch a document's writable fields (e.g. `name`, `description`). */
  async update(documentId: string, body: DocumentUpdateRequest): Promise<Document> {
    return this.t.run(sdk.documentsUpdate, {
      path: { documentId },
      body,
    }) as Promise<Document>;
  }

  /** Soft-delete a document. */
  async delete(documentId: string): Promise<void> {
    await this.t.run(sdk.documentsDelete, {
      path: { documentId },
    });
  }

  /** The compiled, queryable extraction for a `READY` document. */
  async getExtraction(documentId: string): Promise<DocumentExtraction> {
    return this.t.run(sdk.documentsGetExtraction, {
      path: { documentId },
    }) as Promise<DocumentExtraction>;
  }

  /**
   * Link an uploaded document to `{ transaction }`, `{ purchaseOrder }`,
   * `{ contact }` or `{ project }`. A different target for the same kind needs
   * `replace: true` or returns a conflict. There is no address-string overload.
   */
  async link(
    documentId: string,
    target: LinkTarget,
    opts: { replace?: boolean } = {},
  ): Promise<Document> {
    const { kind, id: targetId } = toTargetRef(target);
    const body: DocumentLinkRequest = { targetId, replace: opts.replace };
    return this.t.run(sdk.documentsLink, {
      path: { documentId, kind },
      body,
    }) as Promise<Document>;
  }

  /** Remove the current document link for one kind. */
  async unlink(documentId: string, kind: DocumentWritableTargetKind): Promise<void> {
    await this.t.run(sdk.documentsUnlink, { path: { documentId, kind } });
  }

  /** The compiled content blob for a `READY` document. */
  async getContent(documentId: string): Promise<Blob> {
    return this.t.run(sdk.documentsGetContent, {
      path: { documentId },
    }) as Promise<Blob>;
  }

}
