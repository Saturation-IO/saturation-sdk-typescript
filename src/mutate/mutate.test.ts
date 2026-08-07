import { describe, expect, it } from 'vitest';
import { validateMutateArgs, WRITE_OPS } from './mutate.js';

describe('validateMutateArgs', () => {
  it('accepts a generated request envelope without dispatching it', () => {
    expect(() => validateMutateArgs('masterDataUpdateContact', {
      path: { contactId: 'con_1' },
      body: { name: 'Jane Doe', email: 'jane@example.com' },
    })).not.toThrow();
  });

  it('rejects missing generated path parameters', () => {
    expect(() => validateMutateArgs('budgetUpsertLinePhaseData', {
      path: { projectId: 'prj_1' },
      body: {},
    })).toThrow(/lineId, phaseId/);
  });

  it('rejects missing and unknown generated body fields', () => {
    expect(() => validateMutateArgs('masterDataUpdateContact', {
      path: { contactId: 'con_1' },
      body: { invented: true },
    })).toThrow(/unknown body field.*invented/);
  });

  it('every POST on the surface carries a retry identity (receipt key or natural idempotency)', () => {
    // POSTs are re-admitted (SAT-5831): durable transactional idempotency
    // receipts enforce retry identity, so an outcome-ambiguous timeout replays
    // instead of duplicating. The generator gate proves the declarations; this
    // pins the emitted classification.
    const posts = Object.values(WRITE_OPS).filter((op) => String(op.method) === 'post');
    expect(posts.length).toBeGreaterThan(0);
    expect(
      posts.every(
        (op) =>
          op.idempotency === 'required' ||
          op.idempotency === 'natural' ||
          op.idempotency === 'transition',
      ),
    ).toBe(true);

    const keyed = posts.filter((op) => op.idempotency === 'required').map((op) => op.op).sort();
    expect(keyed).toEqual([
      'budgetCreateLine',
      'budgetCreateLinesBatch',
      'budgetCreatePhase',
      'budgetUpsertLinePhaseDataBatch',
      'libraryCreateCurrencyTemplate',
      'libraryCreateCustomUnit',
      'libraryCreateFringeTagTemplate',
      'libraryCreateFringeTemplate',
      'libraryCreateGlobalTemplate',
      'libraryCreateRatePack',
      'libraryCreateRatePackItem',
      'libraryCreateTag',
      'masterDataCreateComment',
      'masterDataCreateContact',
      'masterDataCreateProject',
      'masterDataCreateSpace',
      'purchaseOrdersCreate',
      'purchaseOrdersCreateItem',
      'transactionsBatchCreate',
      'transactionsCreate',
      'transactionsItemsCreate',
    ]);
    const natural = posts.filter((op) => op.idempotency === 'natural').map((op) => op.op).sort();
    expect(natural).toEqual([
      'documentsAssign',
      'libraryAddProjectIncentive',
      'libraryAddRatePack',
      'libraryEnableIncentivePack',
      'libraryEnableRatePack',
    ]);
    // PO lifecycle transitions (2026-08-07): retry identity is the route's
    // status preconditions — a repeat is a typed 4xx / same-state no-op.
    const transitions = posts.filter((op) => op.idempotency === 'transition').map((op) => op.op).sort();
    expect(transitions).toEqual([
      'purchaseOrdersCancelSubmission',
      'purchaseOrdersLink',
      'purchaseOrdersMarkPaid',
      'purchaseOrdersUnlink',
      'purchaseOrdersVoid',
    ]);

    // Still out: upload rides its own tool; webhooks are standing config;
    // purchaseOrdersSubmit is a reserved /v1 stub until approval wiring lands.
    expect(WRITE_OPS).not.toHaveProperty('purchaseOrdersSubmit');
    expect(WRITE_OPS).not.toHaveProperty('documentsDrop');
    expect(WRITE_OPS).not.toHaveProperty('webhooksCreate');
    expect(WRITE_OPS).not.toHaveProperty('webhooksUpdate');
  });
});
