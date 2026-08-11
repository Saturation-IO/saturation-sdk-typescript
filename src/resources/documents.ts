import * as sdk from '../generated/sdk.gen.js';
import type {
  Document,
  DocumentCreateRequest,
  DocumentUpdateRequest,
  DocumentExpand,
  DocumentStatus,
  DocumentCoarseType,
  DocumentExtraction,
  DocumentTargetKind,
} from '../generated/types.gen.js';
import { Transport, List } from '../http.js';
import { serializeExpand } from '../expand.js';

export interface DocumentListParams {
  linkedTo?: string;
  unassigned?: boolean;
  folder?: string;
  status?: DocumentStatus;
  project?: string;
  classification?: string;
  coarseType?: DocumentCoarseType;
  q?: string;
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

  list(params: DocumentListParams = {}): List<Document> {
    const options = { query: { ...params, expand: serializeExpand(params.expand) } };
    return new List<Document>(
      () => this.t.paginate<typeof options, Document>(sdk.documentsList, options),
      () => this.t.runPage<typeof options, Document>(sdk.documentsList, options),
    );
  }

  async get(documentId: string, params: { expand?: readonly DocumentExpand[] } = {}): Promise<Document> {
    return this.t.run(sdk.documentsGet, {
      path: { documentId },
      query: { expand: serializeExpand(params.expand) },
    }) as Promise<Document>;
  }

  async drop(body: DocumentCreateRequest): Promise<Document> {
    return this.t.run(sdk.documentsDrop, { body }) as Promise<Document>;
  }

  async update(documentId: string, body: DocumentUpdateRequest): Promise<Document> {
    return this.t.run(sdk.documentsUpdate, { path: { documentId }, body }) as Promise<Document>;
  }

  async delete(documentId: string): Promise<void> {
    await this.t.run(sdk.documentsDelete, { path: { documentId } });
  }

  async extraction(documentId: string): Promise<DocumentExtraction> {
    return this.t.run(sdk.documentsGetExtraction, { path: { documentId } }) as Promise<DocumentExtraction>;
  }

  /** Link a document to one target of the selected kind. */
  async link(
    documentId: string,
    kind: DocumentTargetKind,
    targetId: string,
    opts: { replace?: boolean } = {},
  ): Promise<Document> {
    return this.t.run(sdk.documentsPutLink, {
      path: { documentId, kind },
      body: { targetId, replace: opts.replace ?? false },
    }) as Promise<Document>;
  }

  /** Remove the document link for the selected target kind. */
  async unlink(documentId: string, kind: DocumentTargetKind): Promise<Document> {
    return this.t.run(sdk.documentsDeleteLink, { path: { documentId, kind } }) as Promise<Document>;
  }

  async content(documentId: string): Promise<Blob> {
    return this.t.run(sdk.documentsGetContent, { path: { documentId } }) as Promise<Blob>;
  }
}
