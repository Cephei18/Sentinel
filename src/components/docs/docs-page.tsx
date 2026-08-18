import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { adjacentDocs, docsHref } from "@/lib/docs/nav";

export function DocsHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div>
      <span className="text-brand-muted font-mono text-[10px] tracking-[0.12em] uppercase">
        {eyebrow}
      </span>
      <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
      <p className="text-muted mt-4 max-w-2xl text-[15px]">{description}</p>
    </div>
  );
}

export function Section({
  id,
  title,
  children,
}: {
  id?: string;
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="border-border/60 border-t py-9 first:border-t-0 first:pt-0">
      {title ? <h2 className="text-xl font-bold tracking-tight">{title}</h2> : null}
      <div className={`flex flex-col gap-4 ${title ? "mt-4" : ""}`}>{children}</div>
    </section>
  );
}

interface ParamRow {
  name: string;
  type: string;
  required?: boolean;
  detail: string;
}

export function ParamTable({ rows }: { rows: ParamRow[] }) {
  return (
    <div className="border-border overflow-hidden rounded-lg border">
      <div className="divide-border/70 divide-y">
        {rows.map((r) => (
          <div
            key={r.name}
            className="bg-surface flex flex-col gap-1.5 px-4 py-3 sm:flex-row sm:gap-4"
          >
            <div className="flex shrink-0 items-baseline gap-2 sm:w-[220px]">
              <code className="text-foreground font-mono text-[13px] font-semibold">{r.name}</code>
              {r.required ? (
                <span className="text-danger text-[10.5px] tracking-wide">required</span>
              ) : (
                <span className="text-muted text-[10.5px] tracking-wide">optional</span>
              )}
            </div>
            <div className="flex flex-1 flex-col gap-0.5">
              <code className="text-brand-muted font-mono text-[12px]">{r.type}</code>
              <span className="text-muted text-[13px]">{r.detail}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function MethodList({ methods }: { methods: { call: string; detail: string }[] }) {
  return (
    <div className="border-border overflow-hidden rounded-lg border">
      <div className="divide-border/70 divide-y">
        {methods.map((m) => (
          <div
            key={m.call}
            className="bg-surface flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-baseline sm:gap-4"
          >
            <code className="text-brand-muted shrink-0 font-mono text-[13px] sm:w-[300px]">
              {m.call}
            </code>
            <span className="text-muted text-[13px]">{m.detail}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function DocsPager({ slug }: { slug: string }) {
  const { prev, next } = adjacentDocs(slug);
  if (!prev && !next) return null;
  return (
    <div className="border-border/60 mt-10 flex items-center justify-between gap-4 border-t pt-6">
      {prev ? (
        <Link
          href={docsHref(prev.slug)}
          data-cursor
          className="group hover:bg-foreground/6 flex flex-1 flex-col items-start gap-0.5 rounded-[var(--radius)] px-3 py-2"
        >
          <span className="text-muted flex items-center gap-1 text-[11px]">
            <ArrowLeft className="size-3" /> Previous
          </span>
          <span className="text-foreground text-sm font-medium">{prev.title}</span>
        </Link>
      ) : (
        <span />
      )}
      {next ? (
        <Link
          href={docsHref(next.slug)}
          data-cursor
          className="group hover:bg-foreground/6 flex flex-1 flex-col items-end gap-0.5 rounded-[var(--radius)] px-3 py-2 text-right"
        >
          <span className="text-muted flex items-center gap-1 text-[11px]">
            Next <ArrowRight className="size-3" />
          </span>
          <span className="text-foreground text-sm font-medium">{next.title}</span>
        </Link>
      ) : (
        <span />
      )}
    </div>
  );
}
