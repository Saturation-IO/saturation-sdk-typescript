import * as sdk from '../generated/sdk.gen.js';
import type {
  Document,
  DocumentCreateRequest,
  DocumentUpdateRequest,
  DocumentExpand,
  DocumentStatus,
  DocumentExtraction,
  DocumentTargetKind,
  DocumentAssignmentsCollection,
} from '../generated/types.gen.js';
import { Transport, List } from '../http.js';
import { serializeExpand } from '../expand.js';

/**
 * A typed assign/unassign target. Exactly one of the relation keys is supplied;
 * its value is the target entity's canonical id. This collapses the OpenAPI
 * `{ kind, id }` ref into an ergonomic discriminated shape so the SDK never
 * surfaces a hand-built domain address — `sat.documents.assign(doc, { transaction: txId })`.
 */
export type AssignTarget =
  | { transaction: string }
  | { purchaseOrder: string }
  | { contact: string }
  | { project: string };

/** Translate the ergonomic `AssignTarget` to the wire `{ kind, id }` ref. */
function toTargetRef(target: AssignTarget): { kind: DocumentTargetKind; id: string } {
  const entries = Object.entries(target);
  // A single-key object by construction of the union; guard defensively.
  const [kind, id] = entries[0] as [DocumentTargetKind, string];
  return { kind, id };
}

export interface DocumentListParams {
  /** Restrict to documents assigned to a target, as `kind:id` (e.g. `transaction:txn_…`). */
  assignedTo?: string;
  /** Restrict to documents with no entity assignment. */
  unassigned?: boolean;
  /** Restrict to documents in this folder (`fld_…`). */
  folder?: string;
  /** Restrict to documents in this processing status. */
  status?: DocumentStatus;
  /** Restrict to documents scoped to this project (`prj_…`). */
  project?: string;
  expand?: readonly DocumentExpand[];
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
      path: { workspaceId: this.t.workspaceId },
      query: {
        assignedTo: params.assignedTo,
        unassigned: params.unassigned,
        folder: params.folder,
        status: params.status,
        project: params.project,
        expand: serializeExpand(params.expand),
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
  async get(documentId: string, params: { expand?: readonly DocumentExpand[] } = {}): Promise<Document> {
    return this.t.run(sdk.documentsGet, {
      path: { workspaceId: this.t.workspaceId, documentId },
      query: { expand: serializeExpand(params.expand) },
    }) as Promise<Document>;
  }

  /** Drop a new document. Pass `idempotencyKey` to make the billable drop safe to retry. */
  async drop(
    body: DocumentCreateRequest,
    opts: { idempotencyKey?: string } = {},
  ): Promise<Document> {
    return this.t.run(sdk.documentsDrop, {
      path: { workspaceId: this.t.workspaceId },
      headers: opts.idempotencyKey ? { 'Idempotency-Key': opts.idempotencyKey } : undefined,
      body,
    }) as Promise<Document>;
  }

  /** Patch a document's writable fields (e.g. `name`, `description`). */
  async update(documentId: string, body: DocumentUpdateRequest): Promise<Document> {
    return this.t.run(sdk.documentsUpdate, {
      path: { workspaceId: this.t.workspaceId, documentId },
      body,
    }) as Promise<Document>;
  }

  /** Soft-delete a document. */
  async delete(documentId: string): Promise<void> {
    await this.t.run(sdk.documentsDelete, {
      path: { workspaceId: this.t.workspaceId, documentId },
    });
  }

  /** The compiled, queryable extraction for a `READY` document. */
  async extraction(documentId: string): Promise<DocumentExtraction> {
    return this.t.run(sdk.documentsGetExtraction, {
      path: { workspaceId: this.t.workspaceId, documentId },
    }) as Promise<DocumentExtraction>;
  }

  /**
   * Assign a dropped document to a typed target — `{ transaction }`,
   * `{ purchaseOrder }`, `{ contact }` or `{ project }`. Idempotent on the same id;
   * a same-kind assignment to a different id needs `replace: true` or it returns
   * `409 already_assigned`. There is no address-string overload.
   */
  async assign(
    documentId: string,
    target: AssignTarget,
    opts: { replace?: boolean } = {},
  ): Promise<Document> {
    return this.t.run(sdk.documentsAssign, {
      path: { workspaceId: this.t.workspaceId, documentId },
      body: { target: toTargetRef(target), replace: opts.replace ?? false },
    }) as Promise<Document>;
  }

  /** Unassign a document from a typed target. Idempotent (`200` no-op if not assigned). */
  async unassign(documentId: string, target: AssignTarget): Promise<Document> {
    return this.t.run(sdk.documentsUnassign, {
      path: { workspaceId: this.t.workspaceId, documentId },
      body: { target: toTargetRef(target) },
    }) as Promise<Document>;
  }

  /** The set of typed targets this document is currently assigned to. */
  async assignments(documentId: string): Promise<DocumentAssignmentsCollection> {
    return this.t.run(sdk.documentsListAssignments, {
      path: { workspaceId: this.t.workspaceId, documentId },
    }) as Promise<DocumentAssignmentsCollection>;
  }

  /** The compiled content blob for a `READY` document. */
  async content(documentId: string): Promise<Blob> {
    return this.t.run(sdk.documentsGetContent, {
      path: { workspaceId: this.t.workspaceId, documentId },
    }) as Promise<Blob>;
  }

  /** Reverse lookup: documents assigned to a workspace contact. */
  byContact(contactId: string): List<Document> {
    const options = { path: { workspaceId: this.t.workspaceId, contactId } };
    return new List<Document>(
      () => this.t.paginate<typeof options, Document>(sdk.documentsListByContact, options),
      () => this.t.runPage<typeof options, Document>(sdk.documentsListByContact, options),
    );
  }
}

/**
 * Project-scoped reverse document lookups, reached via `sat.projects(p).documents`.
 * These routes carry a `projectId`, distinct from the workspace-level `sat.documents`.
 */
export class ProjectDocumentsResource {
  constructor(
    private readonly t: Transport,
    private readonly projectId: string,
  ) {}

  /** All documents scoped to this project. */
  list(): List<Document> {
    const options = { path: { workspaceId: this.t.workspaceId, projectId: this.projectId } };
    return new List<Document>(
      () => this.t.paginate<typeof options, Document>(sdk.documentsListByProject, options),
      () => this.t.runPage<typeof options, Document>(sdk.documentsListByProject, options),
    );
  }

  /** Documents assigned to a transaction. */
  byTransaction(txId: string): List<Document> {
    const options = { path: { workspaceId: this.t.workspaceId, projectId: this.projectId, txId } };
    return new List<Document>(
      () => this.t.paginate<typeof options, Document>(sdk.documentsListByTransaction, options),
      () => this.t.runPage<typeof options, Document>(sdk.documentsListByTransaction, options),
    );
  }

  /** Documents assigned to a purchase order. */
  byPurchaseOrder(purchaseOrderId: string): List<Document> {
    const options = { path: { workspaceId: this.t.workspaceId, projectId: this.projectId, purchaseOrderId } };
    return new List<Document>(
      () => this.t.paginate<typeof options, Document>(sdk.documentsListByPurchaseOrder, options),
      () => this.t.runPage<typeof options, Document>(sdk.documentsListByPurchaseOrder, options),
    );
  }
}
