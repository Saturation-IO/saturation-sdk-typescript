"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, KeyRound } from "lucide-react";
import { SaturationError } from "@saturationio/sdk";
import type {
  BudgetDocument,
  BudgetDocumentLine,
  Me,
  Project,
} from "@saturationio/sdk";
import { makeClient } from "@/lib/sat";
import { fmtMoney, inferScaleFromAmounts, type MoneyScale } from "@/lib/money";
import { lineLabel, lineCode } from "@/lib/lines";

export function Bidbook({
  me,
  project,
  onBack,
  onDisconnect,
}: {
  me: Me;
  project: Project;
  onBack: () => void;
  onDisconnect: () => void;
}) {
  const [doc, setDoc] = useState<BudgetDocument | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    makeClient()
      .projects(project.id)
      .budget.document()
      .then(setDoc)
      .catch((e) =>
        setError(e instanceof SaturationError ? e.message : "Failed to load budget")
      );
  }, [project.id]);

  return (
    <div className="min-h-screen">
      <TopBar
        projectName={project.name}
        onBack={onBack}
        onDisconnect={onDisconnect}
      />

      {error && (
        <div className="mx-auto max-w-3xl px-6 pt-32 text-red-300">{error}</div>
      )}

      {!doc && !error && (
        <div className="flex min-h-[70vh] items-center justify-center text-[var(--color-muted)]">
          Preparing your bidbook
        </div>
      )}

      {doc && <Document me={me} project={project} doc={doc} />}
    </div>
  );
}

function TopBar({
  projectName,
  onBack,
  onDisconnect,
}: {
  projectName: string;
  onBack: () => void;
  onDisconnect: () => void;
}) {
  return (
    <div className="sticky top-0 z-40 border-b hairline bg-[var(--color-ink)]/85 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3.5">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-[13px] text-[var(--color-muted)] hover:text-[var(--color-cream)]"
        >
          <ArrowLeft size={15} /> Projects
        </button>
        <div className="text-[12px] uppercase tracking-[0.16em] text-[var(--color-muted)]">
          {projectName}
        </div>
        <button
          onClick={onDisconnect}
          className="flex items-center gap-2 text-[13px] text-[var(--color-muted)] hover:text-[var(--color-cream)]"
        >
          <KeyRound size={14} /> Disconnect
        </button>
      </div>
    </div>
  );
}

function Document({
  me,
  project,
  doc,
}: {
  me: Me;
  project: Project;
  doc: BudgetDocument;
}) {
  const phases = doc.phases.filter((p) => !p.isHidden);
  const estimate = phases.find((p) => p.type === "estimate") ?? phases[0];
  const totals = doc.totals ?? {};
  const estimateTotals = estimate ? totals[estimate.id] : undefined;
  const currency = estimateTotals?.currency ?? "USD";
  const grand = estimateTotals?.amount ?? 0;
  const scale: MoneyScale = useMemo(() => {
    const amounts: number[] = [];
    for (const l of doc.lines) {
      for (const v of Object.values(l.values ?? {})) {
        if (v && typeof v.amount === "number") amounts.push(v.amount);
      }
    }
    return inferScaleFromAmounts(amounts, grand);
  }, [doc.lines, grand]);

  // Top-level accounts (depth 0), each with its estimate amount.
  const accounts = useMemo(() => {
    if (!estimate) return [];
    return doc.lines
      .filter((l) => l.depth === 0)
      .map((l) => ({
        line: l,
        amount: l.values?.[estimate.id]?.amount ?? 0,
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [doc.lines, estimate]);

  const maxAcct = Math.max(0, ...accounts.map((a) => a.amount));

  return (
    <main className="mx-auto w-full max-w-3xl px-6 pb-40">
      {/* Cover */}
      <section className="flex min-h-[88vh] flex-col justify-center py-24">
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-[12px] uppercase tracking-[0.22em] text-[var(--color-gold)]"
        >
          A budget proposal
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="font-display mt-6 text-7xl leading-[0.98] font-light"
        >
          {project.name}
        </motion.h1>
        {project.summary && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.16 }}
            className="mt-6 max-w-xl text-[16px] leading-relaxed text-[var(--color-muted)]"
          >
            {project.summary}
          </motion.p>
        )}

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.24 }}
          className="mt-16"
        >
          <div className="text-[11px] uppercase tracking-[0.2em] text-[var(--color-muted)]">
            {estimate?.name ?? "Estimate"} total
          </div>
          <div className="font-display num mt-2 text-[64px] leading-none font-light text-[var(--color-gold-2)]">
            {fmtMoney(grand, currency, scale)}
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            {phases.map((p) => (
              <span
                key={p.id}
                className="rounded-full border hairline px-3 py-1 text-[11px] uppercase tracking-[0.12em] text-[var(--color-muted)]"
              >
                {p.alias ?? p.name}
              </span>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-20 text-[12px] text-[var(--color-muted)]"
        >
          Prepared by {me.name ?? me.email ?? "the production"} ·{" "}
          {new Date(doc.computedAt).toLocaleDateString(undefined, {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </motion.div>
      </section>

      {/* The shape of the budget */}
      <section className="py-16">
        <SectionHeading
          kicker="The shape of the money"
          title="Where it goes"
        />
        <div className="mt-10 space-y-5">
          {accounts.slice(0, 14).map(({ line, amount }, i) => (
            <AccountRow
              key={line.id}
              line={line}
              amount={amount}
              max={maxAcct}
              currency={currency}
              scale={scale}
              index={i}
            />
          ))}
        </div>
      </section>
    </main>
  );
}

function SectionHeading({ kicker, title }: { kicker: string; title: string }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-[0.22em] text-[var(--color-gold)]">
        {kicker}
      </div>
      <h2 className="font-display mt-3 text-4xl font-light">{title}</h2>
    </div>
  );
}

function AccountRow({
  line,
  amount,
  max,
  currency,
  scale,
  index,
}: {
  line: BudgetDocumentLine;
  amount: number;
  max: number;
  currency: string;
  scale: MoneyScale;
  index: number;
}) {
  const pct = max > 0 ? (amount / max) * 100 : 0;
  const label = lineLabel(line);
  const code = lineCode(line);
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ delay: index * 0.03 }}
    >
      <div className="flex items-baseline justify-between gap-4">
        <div className="min-w-0 truncate text-[15px]">
          {code && (
            <span className="mr-3 text-[12px] tabular-nums text-[var(--color-muted)]">
              {code}
            </span>
          )}
          {label}
        </div>
        <div className="num shrink-0 text-[15px] text-[var(--color-cream)]">
          {fmtMoney(amount, currency, scale)}
        </div>
      </div>
      <div className="mt-2 h-[3px] w-full overflow-hidden rounded-full bg-[var(--color-ink-3)]">
        <motion.div
          initial={{ width: 0 }}
          whileInView={{ width: `${pct}%` }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
          className="h-full rounded-full bg-[var(--color-gold)]"
        />
      </div>
    </motion.div>
  );
}
