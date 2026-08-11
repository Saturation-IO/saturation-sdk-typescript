import { describe, expect, it } from 'vitest';
import { validateMutateArgs, WRITE_OPS } from './mutate.js';

describe('catalog teaches enums and Money minor units (B0 findings W-1/W-2)', () => {
  it('expands string-literal union aliases inline in bodyType', () => {
    const body = WRITE_OPS.transactionsCreate.bodyType;
    expect(body).toContain("'Invoice' | 'Projection' | 'Cash'");
    expect(body).not.toContain('TransactionJournalType');
  });

  it('expands Money inline with unambiguous minor-units semantics', () => {
    for (const op of ['transactionsCreate', 'masterDataUpdateContact'] as const) {
      const body = WRITE_OPS[op].bodyType;
      expect(body).toContain('MINOR units');
      expect(body).toContain('475000');
      expect(body).not.toMatch(/\bMoney\b/);
    }
  });

  it('expands money-bearing object aliases + PO item money fields inline (R6-F1)', () => {
    // The PO create's items array rendered as `Array<PurchaseOrderItemWrite>`
    // and taught nothing about units: a $16,850 PO committed as $168.50.
    const body = WRITE_OPS.purchaseOrdersCreate.bodyType;
    expect(body).not.toContain('PurchaseOrderItemWrite');
    expect(body).toContain('amount?: number (integer MINOR units - $12,400.00 = 1240000');
    expect(body).toContain('rate?: number (MINOR units per unit');
    for (const op of ['purchaseOrdersCreateItem', 'purchaseOrdersUpdateItem'] as const) {
      expect(WRITE_OPS[op].bodyType).toContain('integer MINOR units');
      expect(WRITE_OPS[op].bodyType).toContain('MINOR units per unit');
    }
    // Ratio rates stay untaught - a currency rate is not money.
    expect(WRITE_OPS.libraryUpdateCurrency.bodyType).not.toContain('MINOR units per unit');
  });

  it('expansion never disturbs the top-level field contract', () => {
    expect(WRITE_OPS.transactionsCreate.requiredBodyFields).toEqual(['type', 'amount', 'timestamp']);
    expect(WRITE_OPS.masterDataUpdateContact.allowedBodyFields).toContain('defaultRate');
  });
});

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
    // The rejection teaches the contract: it names the op's allowed fields so
    // one failed call self-corrects instead of a guess-loop (R7 iteration 1:
    // two 400s then a give-up on a dictated write).
    expect(() => validateMutateArgs('transactionsCreate', {
      body: { type: 'CreditCard', amount: { amount: 100, currency: 'USD' }, timestamp: '2026-01-01T00:00:00Z', merchant: 'X' },
    })).toThrow(/unknown body field\(s\): merchant. Allowed body fields: type, amount/);
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
      'budgetCreateLinesBulk',
      'budgetCreatePhase',
      'budgetUpsertLinePhaseDataBulk',
      'libraryCreateCurrency',
      'libraryCreateFringe',
      'libraryCreateFringeGroup',
      'libraryCreateGlobal',
      'libraryCreateRatePack',
      'libraryCreateRatePackItem',
      'libraryCreateTag',
      'libraryCreateUnit',
      'masterDataCreateComment',
      'masterDataCreateContact',
      'masterDataCreateProject',
      'masterDataCreateSpace',
      'purchaseOrdersCreate',
      'purchaseOrdersCreateItem',
      'transactionsBulkCreate',
      'transactionsCreate',
      'transactionsItemsCreate',
    ]);
    const natural = posts.filter((op) => op.idempotency === 'natural').map((op) => op.op).sort();
    expect(natural).toEqual([
      'libraryAddProjectCurrency',
      'libraryAddProjectFringe',
      'libraryAddProjectFringeGroup',
      'libraryAddProjectGlobal',
      'libraryAddProjectIncentive',
      'libraryEnableIncentivePack',
      'libraryEnableRatePack',
    ]);
    // PO lifecycle transitions (2026-08-07): retry identity is the route's
    // status preconditions — a repeat is a typed 4xx / same-state no-op.
    const transitions = posts.filter((op) => op.idempotency === 'transition').map((op) => op.op).sort();
    expect(transitions).toEqual([
      'purchaseOrdersCancelSubmission',
      'purchaseOrdersMarkPaid',
      'purchaseOrdersVoid',
      'webhooksCreate',
      'webhooksSendTestDelivery',
    ]);

    // Full-surface ruling (2026-08-07): only the two STRUCTURAL carve-outs
    // remain out — the reserved /v1 submit stub (always 409 until approval
    // wiring) and documentsDrop (multipart bytes ride the upload tool).
    expect(WRITE_OPS).not.toHaveProperty('purchaseOrdersSubmit');
    expect(WRITE_OPS).not.toHaveProperty('documentsDrop');
    expect(WRITE_OPS).toHaveProperty('webhooksCreate');
    expect(WRITE_OPS).toHaveProperty('webhooksUpdate');
    expect(WRITE_OPS).not.toHaveProperty('masterDataDeleteProject');
    expect(WRITE_OPS).toHaveProperty('libraryDisableRatePack');
  });
});
