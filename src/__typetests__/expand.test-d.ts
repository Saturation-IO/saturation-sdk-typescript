/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * Type-level tests for `expand` return-type widening. This file is NOT compiled
 * into the build (excluded by tsconfig); it documents and pins the widening
 * contract. `pnpm exec tsc --noEmit -p tsconfig.typetest.json` runs it.
 *
 * The assertions are the *positive* cases (expanded relations need no `?.`). The
 * negative cases (un-expanded access is a compile error) are kept as commented
 * `@ts-expect-error` lines so the file itself stays green while still recording
 * the intent.
 */
import type { Expanded, ExpandMap } from '../expand.js';
import type { BudgetLine, BudgetLineContactRef, Transaction, TransactionExpandKey } from '../generated/types.gen.js';
import type { Saturation } from '../saturation.js';

// A representative budget-line expand map (mirrors resources/budget.ts).
type BLMap = {
  phaseTotals: 'phaseTotals';
  phaseData: 'phaseData';
  contact: 'contact';
};

// 1. Expanding `contact` makes it present-and-required (no `?.`).
declare const withContact: Expanded<BudgetLine, BLMap, 'contact'>;
const _c: BudgetLineContactRef | null = withContact.contact; // OK: present, non-optional

// 2. Without expanding `contact`, the property is absent from the type.
declare const noExpand: Expanded<BudgetLine, BLMap, never>;
// @ts-expect-error `contact` was not expanded, so it is not on the type.
const _cFail = noExpand.contact;

// 4. Transactions: expanding `items` populates `items`.
type TxMap = {
  contact: 'contact';
  documents: 'documents';
  items: 'items';
  account: 'account';
  purchaseOrder: 'purchaseOrder';
};
declare const txItemized: Expanded<Transaction, TxMap, 'items'>;
const _items = txItemized.items; // OK: present (the depth-1 itemized lines)

// 5. A key outside the map (`account` on a budget line) widens nothing but is
//    still a valid `ExpandMap` key union member when present in the map.
type _AssertMapShape = ExpandMap<TransactionExpandKey>;

// Public methods preserve literal expand keys in their return types.
declare const sat: Saturation;

async function publicMethodTypes(): Promise<void> {
  const project = await sat.projects.get('project_1', { expand: ['assumptions'] });
  project.assumptions;
  const plainProject = await sat.projects.get('project_1');
  // @ts-expect-error `assumptions` is absent unless requested.
  plainProject.assumptions;

  const ratePack = await sat.library.ratePacks.get('pack_1', { expand: ['items'] });
  ratePack.items;
  const plainRatePack = await sat.library.ratePacks.get('pack_1');
  // @ts-expect-error `items` is absent unless requested.
  plainRatePack.items;

  const incentivePack = await sat.library.incentives.get('pack_1', { expand: ['programs'] });
  incentivePack.programs;
  const plainIncentivePack = await sat.library.incentives.get('pack_1');
  // @ts-expect-error `programs` is absent unless requested.
  plainIncentivePack.programs;

  const transaction = await sat.projects('project_1').transactions.get('txn_1', { expand: ['items'] });
  transaction.items;
  const plainTransaction = await sat.projects('project_1').transactions.get('txn_1');
  // @ts-expect-error `items` is absent unless requested.
  plainTransaction.items;

  const line = await sat.projects('project_1').budget.lines.get('line_1', { expand: ['contact'] });
  line.contact;
  const plainLine = await sat.projects('project_1').budget.lines.get('line_1');
  // @ts-expect-error `contact` is absent unless requested.
  plainLine.contact;
}
