import type { ErrorCode } from './generated/types.gen.js';

export type { ErrorCode } from './generated/types.gen.js';

/**
 * The documented error envelope, thrown on any non-2xx response.
 *
 * Success is keyed off the HTTP status, never a `success` field — a 2xx returns
 * the bare resource (or `{ data, nextCursor }` collection); anything else throws
 * this. The typed `code` is the stable, documented string from the OpenAPI
 * `ErrorCode` enum (`permission_revoked`, `idempotency_conflict`, `expand_invalid`,
 * `cursor_invalid`, `not_found`, …) so callers branch on a contract, not a string
 * literal they hand-maintain.
 */
export class SaturationError extends Error {
  /** HTTP status of the failed response. */
  readonly status: number;
  /** Stable, typed error code from the `/v1` envelope. */
  readonly code: ErrorCode;
  /** The id of the failed request — quote it in support tickets. */
  readonly requestId: string;
  /** Per-field messages on validation / mass-assignment failures. */
  readonly fieldErrors?: Record<string, string[]>;
  /** On `permission_revoked` (403): the missing ability, e.g. `update:Transaction`. */
  readonly requiredAbility?: string;
  /** On `rate_limited` (429): seconds to wait before retrying. */
  readonly retryAfter?: number;

  constructor(args: {
    status: number;
    code: ErrorCode;
    message: string;
    requestId: string;
    fieldErrors?: Record<string, string[]>;
    requiredAbility?: string;
    retryAfter?: number;
  }) {
    super(args.message);
    this.name = 'SaturationError';
    this.status = args.status;
    this.code = args.code;
    this.requestId = args.requestId;
    this.fieldErrors = args.fieldErrors;
    this.requiredAbility = args.requiredAbility;
    this.retryAfter = args.retryAfter;
    // Restore prototype chain for instanceof across transpile targets.
    Object.setPrototypeOf(this, SaturationError.prototype);
  }

  /** True when the failure is a typed conflict on a replayed `Idempotency-Key`. */
  get isIdempotencyConflict(): boolean {
    return this.code === 'idempotency_conflict';
  }

  /** True when the principal's live ability ∩ token scopes no longer permits the action. */
  get isPermissionRevoked(): boolean {
    return this.code === 'permission_revoked';
  }

  /** True when the resource does not exist OR exists-but-unauthorized (existence never leaks). */
  get isNotFound(): boolean {
    return this.code === 'not_found' || this.code === 'document_target_not_found';
  }
}

/** Raw shape of the body documented by the OpenAPI `Error` schema. */
interface RawErrorBody {
  success?: false;
  code?: ErrorCode;
  message?: string;
  requestId?: string;
  fieldErrors?: Record<string, string[]>;
  requiredAbility?: string;
  retryAfter?: number;
}

/**
 * Build a `SaturationError` from a non-2xx response + parsed body. Falls back to
 * `internal_error` if the body is not a recognizable envelope (e.g. a proxy 502),
 * so the client never throws an untyped, status-less error.
 */
export function toSaturationError(status: number, body: unknown): SaturationError {
  const e = (body ?? {}) as RawErrorBody;
  return new SaturationError({
    status,
    code: e.code ?? 'internal_error',
    message: e.message ?? `Request failed with HTTP ${status}`,
    requestId: e.requestId ?? 'unknown',
    fieldErrors: e.fieldErrors,
    requiredAbility: e.requiredAbility,
    retryAfter: e.retryAfter,
  });
}
