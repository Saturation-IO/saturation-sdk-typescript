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
import type { BudgetLine, Transaction, Contact, TransactionExpandKey } from '../generated/types.gen.js';

// A representative budget-line expand map (mirrors resources/budget.ts).
type BLMap = {
  phases: 'values';
  phaseData: 'phaseData';
  contact: 'contact';
  sourceItem: 'sourceItem';
  documents: 'documents';
};

// 1. Expanding `contact` makes it present-and-required (no `?.`).
declare const withContact: Expanded<BudgetLine, BLMap, 'contact'>;
const _c: Contact = withContact.contact; // OK: present, non-optional

// 2. Expanding `documents` widens the array to required.
declare const withDocs: Expanded<BudgetLine, BLMap, 'documents'>;
const _d: unknown[] = withDocs.documents; // OK: present

// 3. Without expanding `contact`, the property is absent from the type.
declare const noExpand: Expanded<BudgetLine, BLMap, never>;
// @ts-expect-error — `contact` was not expanded, so it is not on the type.
const _cFail = noExpand.contact;

// 4. Transactions: expanding `itemized` populates `items`.
type TxMap = {
  contact: 'contact';
  documents: 'documents';
  itemized: 'items';
  account: 'account';
  purchaseOrder: 'purchaseOrder';
};
declare const txItemized: Expanded<Transaction, TxMap, 'itemized'>;
const _items = txItemized.items; // OK: present (the depth-1 itemized lines)

// 5. A key outside the map (`account` on a budget line) widens nothing but is
//    still a valid `ExpandMap` key union member when present in the map.
type _AssertMapShape = ExpandMap<TransactionExpandKey>;
