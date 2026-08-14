import type { BudgetDocumentLine } from "@saturationio/sdk";

/**
 * The budget-document line shape drifted across API builds: the OpenAPI
 * contract (and SDK 0.1.2 types) describe `description` + `type`, while some
 * served payloads use `name` + `kind` + `code`. Read defensively so the demo
 * renders correctly against either.
 */
type AnyLine = BudgetDocumentLine & {
  name?: string | null;
  code?: string | null;
  kind?: string | null;
};

export function lineLabel(line: AnyLine): string {
  return (
    line.description ||
    line.name ||
    line.code ||
    line.accountId ||
    "Untitled"
  );
}

export function lineCode(line: AnyLine): string | null {
  return line.code ?? line.accountId ?? null;
}

export function lineIsAccount(line: AnyLine): boolean {
  const k = (line.type ?? line.kind ?? "") as string;
  return k === "account" || line.depth === 0;
}
