"use client";

import { motion } from "framer-motion";

/**
 * Render the project brief (a markdown note) with editorial typography.
 *
 * The brief is plain markdown: `#` headings, `**bold**` leads, `- ` bullets,
 * and paragraphs. Rather than pull a full markdown renderer for one document,
 * we parse the small, well-defined subset the production briefs use and lay it
 * out with the same typographic care as the rest of the bid. Unknown inline
 * markdown is stripped to its text.
 */

type Block =
  | { kind: "heading"; text: string }
  | { kind: "paragraph"; text: string }
  | { kind: "list"; items: string[] };

function parse(md: string): Block[] {
  const lines = md.split(/\r?\n/);
  const blocks: Block[] = [];
  let para: string[] = [];
  let list: string[] = [];

  const flushPara = () => {
    if (para.length) {
      blocks.push({ kind: "paragraph", text: para.join(" ") });
      para = [];
    }
  };
  const flushList = () => {
    if (list.length) {
      blocks.push({ kind: "list", items: list });
      list = [];
    }
  };

  for (const raw of lines) {
    const line = raw.trim();
    if (line === "") {
      flushPara();
      flushList();
      continue;
    }
    if (line.startsWith("#")) {
      flushPara();
      flushList();
      blocks.push({ kind: "heading", text: line.replace(/^#+\s*/, "") });
      continue;
    }
    if (line.startsWith("- ") || line.startsWith("* ")) {
      flushPara();
      list.push(line.slice(2));
      continue;
    }
    para.push(line);
  }
  flushPara();
  flushList();
  return blocks;
}

/** Render inline `**bold**` and `*italic*` as styled spans; strip the rest. */
function Inline({ text }: { text: string }) {
  const parts: React.ReactNode[] = [];
  const re = /(\*\*([^*]+)\*\*|\*([^*]+)\*)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let key = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    if (m[2] !== undefined) {
      parts.push(
        <strong key={key++} className="font-semibold text-[var(--color-cream)]">
          {m[2]}
        </strong>
      );
    } else if (m[3] !== undefined) {
      parts.push(
        <em key={key++} className="italic">
          {m[3]}
        </em>
      );
    }
    last = re.lastIndex;
  }
  if (last < text.length) parts.push(text.slice(last));
  return <>{parts}</>;
}

export function Brief({ content }: { content: string }) {
  const blocks = parse(content);
  return (
    <div className="space-y-6">
      {blocks.map((b, i) => {
        if (b.kind === "heading") {
          // Skip a leading H1 that repeats the project name; the page already has it.
          if (i === 0) return null;
          return (
            <motion.h3
              key={i}
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              className="font-display pt-4 text-2xl font-normal"
            >
              {b.text}
            </motion.h3>
          );
        }
        if (b.kind === "list") {
          return (
            <motion.ul
              key={i}
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              className="space-y-2.5 border-l-2 border-[var(--color-gold)]/40 pl-5"
            >
              {b.items.map((item, j) => (
                <li key={j} className="text-[15px] leading-relaxed text-[var(--color-cream)]/85">
                  <Inline text={item} />
                </li>
              ))}
            </motion.ul>
          );
        }
        return (
          <motion.p
            key={i}
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            className="text-[15.5px] leading-[1.75] text-[var(--color-cream)]/85"
          >
            <Inline text={b.text} />
          </motion.p>
        );
      })}
    </div>
  );
}
