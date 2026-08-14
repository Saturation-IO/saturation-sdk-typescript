"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowLeft, KeyRound, FileText, MessageSquare } from "lucide-react";
import { SaturationError } from "@saturationio/sdk";
import type {
  BudgetDocument,
  BudgetDocumentLine,
  Comment,
  Me,
  Project,
  ProjectAssumptions,
} from "@saturationio/sdk";
import { makeClient } from "@/lib/sat";
import { fmtMoney, inferScaleFromAmounts, type MoneyScale } from "@/lib/money";
import { lineLabel, lineCode } from "@/lib/lines";
import { noteFor } from "@/lib/notes";
import { Brief } from "@/components/Brief";

/** Map a project slug to its local hero image. Unknown slugs fall back to none. */
function heroFor(slug: string | undefined): string | null {
  if (!slug) return null;
  const file = slug === "honda-commercial-demo" ? "honda" : slug;
  const known = ["space-ranger", "harbor-lights", "wild-coast", "neon-nights", "honda"];
  return known.includes(file) ? `/projects/${file}.png` : null;
}

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
  const [assumptions, setAssumptions] = useState<ProjectAssumptions | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const client = makeClient();
    let live = true;
    // The list projection omits the brief; the single-get returns it when
    // expanded with `assumptions`.
    client.projects
      .get(project.id, { expand: ["assumptions"] })
      .then((p) => {
        if (live) setAssumptions(p.assumptions ?? null);
      })
      .catch(() => {});
    client
      .projects(project.id)
      .budget.document()
      .then((d) => live && setDoc(d))
      .catch(
        (e) =>
          live &&
          setError(e instanceof SaturationError ? e.message : "Failed to load budget")
      );
    client
      .projects(project.id)
      .comments.list({ limit: 50 })
      .all()
      .then((c) => live && setComments(c))
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [project.id]);

  return (
    <div className="min-h-screen">
      <TopBar projectName={project.name} onBack={onBack} onDisconnect={onDisconnect} />

      {error && (
        <div className="mx-auto max-w-3xl px-6 pt-32 text-red-300">{error}</div>
      )}

      {!doc && !error && (
        <div className="flex min-h-[70vh] items-center justify-center text-[var(--color-muted)]">
          Preparing your bidbook
        </div>
      )}

      {doc && (
        <Document
          me={me}
          project={project}
          doc={doc}
          assumptions={assumptions}
          comments={comments}
        />
      )}
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
    <div className="sticky top-0 z-40 border-b hairline bg-[var(--color-ink)]/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3.5">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-[13px] text-[var(--color-muted)] transition hover:text-[var(--color-cream)]"
        >
          <ArrowLeft size={15} /> Projects
        </button>
        <div className="text-[12px] uppercase tracking-[0.16em] text-[var(--color-muted)]">
          {projectName}
        </div>
        <button
          onClick={onDisconnect}
          className="flex items-center gap-2 text-[13px] text-[var(--color-muted)] transition hover:text-[var(--color-cream)]"
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
  assumptions,
  comments,
}: {
  me: Me;
  project: Project;
  doc: BudgetDocument;
  assumptions: ProjectAssumptions | null;
  comments: Comment[];
}) {
  const phases = doc.phases.filter((p) => !p.isHidden);
  const estimate = phases.find((p) => p.type === "estimate") ?? phases[0];
  const totals = doc.totals ?? {};
  const estimateTotals = estimate ? totals[estimate.id] : undefined;
  const currency = estimateTotals?.currency ?? "USD";
  const grand = estimateTotals?.amount ?? 0;
  const hero = heroFor(project.slug);

  const scale: MoneyScale = useMemo(() => {
    const amounts: number[] = [];
    for (const l of doc.lines) {
      for (const v of Object.values(l.values ?? {})) {
        if (v && typeof v.amount === "number") amounts.push(v.amount);
      }
    }
    return inferScaleFromAmounts(amounts, grand);
  }, [doc.lines, grand]);

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
    <main className="pb-40">
      <Cover
        me={me}
        project={project}
        hero={hero}
        grand={grand}
        currency={currency}
        scale={scale}
        phases={phases}
        estimateName={estimate?.name ?? "Estimate"}
        computedAt={doc.computedAt}
        accountCount={accounts.length}
        lineCount={doc.lines.length}
      />

      {assumptions && (
        <section className="mx-auto w-full max-w-3xl px-6 py-24">
          <SectionHeading kicker="The plan" title="How we get there" />
          <div className="mt-10">
            <Brief content={assumptions.content} />
          </div>
          <div className="mt-8 text-[12px] text-[var(--color-muted)]">
            The project brief, pinned on the Project Info sheet. Updated{" "}
            {new Date(assumptions.updatedAt).toLocaleDateString(undefined, {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
            .
          </div>
        </section>
      )}

      <section className="mx-auto w-full max-w-3xl px-6 py-16">
        <SectionHeading kicker="The shape of the money" title="Where it goes" />
        <p className="mt-4 max-w-xl text-[14px] leading-relaxed text-[var(--color-muted)]">
          {accounts.length} accounts, {doc.lines.length} lines, every dollar
          accounted for. Open an account to read the line-by-line reasoning.
        </p>
        <div className="mt-10 space-y-3">
          {accounts.map(({ line, amount }, i) => (
            <AccountSection
              key={line.id}
              line={line}
              amount={amount}
              max={maxAcct}
              grand={grand}
              currency={currency}
              scale={scale}
              estimateId={estimate?.id ?? ""}
              allLines={doc.lines}
              index={i}
            />
          ))}
        </div>
      </section>

      {comments.length > 0 && (
        <section className="mx-auto w-full max-w-3xl px-6 py-16">
          <SectionHeading kicker="From the production" title="Notes" />
          <div className="mt-10 space-y-6">
            {comments.map((c) => (
              <NoteCard key={c.id} comment={c} />
            ))}
          </div>
        </section>
      )}

      <Footer me={me} computedAt={doc.computedAt} />
    </main>
  );
}

function Cover({
  me,
  project,
  hero,
  grand,
  currency,
  scale,
  phases,
  estimateName,
  computedAt,
  accountCount,
  lineCount,
}: {
  me: Me;
  project: Project;
  hero: string | null;
  grand: number;
  currency: string;
  scale: MoneyScale;
  phases: BudgetDocument["phases"];
  estimateName: string;
  computedAt: string;
  accountCount: number;
  lineCount: number;
}) {
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 600], [0, 120]);
  const opacity = useTransform(scrollY, [0, 420], [1, 0.15]);

  return (
    <section className="relative flex min-h-[92vh] flex-col justify-end overflow-hidden">
      {hero && (
        <motion.div style={{ y, opacity }} className="absolute inset-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={hero} alt={project.name} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-ink)] via-[var(--color-ink)]/40 to-[var(--color-ink)]/20" />
        </motion.div>
      )}

      <div className="relative mx-auto w-full max-w-3xl px-6 pb-24">
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
          className="font-display mt-6 text-6xl leading-[0.98] font-light sm:text-7xl"
        >
          {project.name}
        </motion.h1>
        {project.summary && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.16 }}
            className="mt-6 max-w-xl text-[16px] leading-relaxed text-[var(--color-cream)]/85"
          >
            {project.summary}
          </motion.p>
        )}

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.24 }}
          className="mt-14"
        >
          <div className="text-[11px] uppercase tracking-[0.2em] text-[var(--color-muted)]">
            {estimateName} total
          </div>
          <div className="font-display num mt-2 text-[64px] leading-none font-light text-[var(--color-gold-2)]">
            {fmtMoney(grand, currency, scale)}
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-2">
            {phases.map((p) => (
              <span
                key={p.id}
                className="rounded-full border hairline px-3 py-1 text-[11px] uppercase tracking-[0.12em] text-[var(--color-muted)]"
              >
                {p.alias ?? p.name}
              </span>
            ))}
            <span className="ml-2 text-[11px] uppercase tracking-[0.12em] text-[var(--color-muted)]">
              {accountCount} accounts · {lineCount} lines
            </span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-16 text-[12px] text-[var(--color-muted)]"
        >
          Prepared by {me.name ?? me.email ?? "the production"} ·{" "}
          {new Date(computedAt).toLocaleDateString(undefined, {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </motion.div>
      </div>
    </section>
  );
}

function AccountSection({
  line,
  amount,
  max,
  grand,
  currency,
  scale,
  estimateId,
  allLines,
  index,
}: {
  line: BudgetDocumentLine;
  amount: number;
  max: number;
  grand: number;
  currency: string;
  scale: MoneyScale;
  estimateId: string;
  allLines: BudgetDocumentLine[];
  index: number;
}) {
  const [open, setOpen] = useState(false);
  const pct = max > 0 ? (amount / max) * 100 : 0;
  const share = grand > 0 ? (amount / grand) * 100 : 0;
  const label = lineLabel(line);
  const code = lineCode(line);
  const note = noteFor(code);

  const children = useMemo(
    () =>
      allLines
        .filter((l) => l.parentId === line.id)
        .map((l) => ({
          line: l,
          amount: l.values?.[estimateId]?.amount ?? 0,
        }))
        .sort((a, b) => b.amount - a.amount),
    [allLines, line.id, estimateId]
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ delay: index * 0.02 }}
      className="overflow-hidden rounded-lg border hairline bg-[var(--color-ink-2)]"
    >
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full px-5 py-4 text-left transition hover:bg-[var(--color-ink-3)]"
      >
        <div className="flex items-baseline justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-baseline gap-3">
              {code && (
                <span className="num shrink-0 text-[12px] tabular-nums text-[var(--color-muted)]">
                  {code}
                </span>
              )}
              <span className="truncate text-[15px] font-medium">{label}</span>
            </div>
          </div>
          <div className="flex shrink-0 items-baseline gap-4">
            <span className="num text-[12px] tabular-nums text-[var(--color-muted)]">
              {share.toFixed(1)}%
            </span>
            <span className="num text-[15px] tabular-nums text-[var(--color-cream)]">
              {fmtMoney(amount, currency, scale)}
            </span>
          </div>
        </div>
        <div className="mt-3 h-[3px] w-full overflow-hidden rounded-full bg-[var(--color-ink-3)]">
          <motion.div
            initial={{ width: 0 }}
            whileInView={{ width: `${pct}%` }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
            className="h-full rounded-full bg-[var(--color-gold)]"
          />
        </div>
      </button>

      {open && (
        <div className="border-t hairline px-5 py-5">
          {note && (
            <p className="max-w-2xl text-[14px] leading-relaxed text-[var(--color-muted)]">
              {note}
            </p>
          )}
          {children.length > 0 && (
            <div className="mt-5 space-y-2.5">
              {children.map(({ line: c, amount: a }) => (
                <div
                  key={c.id}
                  className="flex items-baseline justify-between gap-4 text-[13px]"
                >
                  <span className="min-w-0 truncate text-[var(--color-muted)]">
                    {lineCode(c) && (
                      <span className="num mr-2.5 tabular-nums text-[var(--color-muted)]/60">
                        {lineCode(c)}
                      </span>
                    )}
                    {lineLabel(c)}
                  </span>
                  <span className="num shrink-0 tabular-nums text-[var(--color-cream)]/80">
                    {fmtMoney(a, currency, scale)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}

function NoteCard({ comment }: { comment: Comment }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      className="rounded-lg border hairline bg-[var(--color-ink-2)] px-5 py-4"
    >
      <div className="flex items-center gap-2.5">
        <MessageSquare size={13} className="text-[var(--color-gold)]" />
        <span className="text-[13px] font-medium">{comment.author.name}</span>
        <span className="text-[12px] text-[var(--color-muted)]">
          {new Date(comment.createdAt).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
          })}
        </span>
        {comment.resolved && (
          <span className="ml-auto rounded-full border hairline px-2 py-0.5 text-[10px] uppercase tracking-[0.1em] text-[var(--color-muted)]">
            Resolved
          </span>
        )}
      </div>
      <p className="mt-3 text-[14px] leading-relaxed text-[var(--color-cream)]/90">
        {comment.content}
      </p>
    </motion.div>
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

function Footer({ me, computedAt }: { me: Me; computedAt: string }) {
  return (
    <footer className="border-t hairline">
      <div className="mx-auto flex w-full max-w-3xl items-center justify-between px-6 py-10 text-[12px] text-[var(--color-muted)]">
        <div>
          Prepared by {me.name ?? me.email ?? "the production"} ·{" "}
          {new Date(computedAt).toLocaleDateString(undefined, {
            month: "long",
            day: "numeric",
            year: "numeric",
          })}
        </div>
        <div className="flex items-center gap-1.5">
          <FileText size={12} />
          Built on @saturationio/sdk
        </div>
      </div>
    </footer>
  );
}
