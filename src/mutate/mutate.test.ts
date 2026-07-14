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

  it('excludes outcome-ambiguous POST operations from the canonical surface', () => {
    expect(Object.values(WRITE_OPS).every((op) => String(op.method) !== 'post')).toBe(true);
    expect(WRITE_OPS).not.toHaveProperty('documentsDrop');
    expect(WRITE_OPS).not.toHaveProperty('webhooksUpdate');
  });
});
