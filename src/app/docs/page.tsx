import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { CodeBlock } from "@/components/landing/code-block";
import { Button } from "@/components/ui/button";
import { DocsHeader, DocsPager, Section } from "@/components/docs/docs-page";
import { BRAND } from "@/lib/brand";

export const metadata: Metadata = {
  title: `Docs | ${BRAND.name}`,
  description:
    "Install the Sentinel SDK, check a spend before it happens, and read the trust score.",
};

const CONTACT_EMAIL = "gopikachauhan1819@gmail.com";
const mailtoHref = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent("Sentinel API key")}`;

const INSTALL = `npm install @sentinel-hq/sdk`;

const CARDS = [
  {
    href: "/docs/quickstart",
    title: "Quickstart",
    body: "Install the SDK, get a key, and ship your first guardrail check.",
  },
  {
    href: "/docs/agents",
    title: "Agents",
    body: "Create an agent with a scoped budget, per-tx limit, expiry, and categories.",
  },
  {
    href: "/docs/guardrail",
    title: "Guardrail check",
    body: 'The read-only, pre-flight answer to "is this spend allowed, right now?"',
  },
  {
    href: "/docs/trust-score",
    title: "Trust score",
    body: "How a deterministic 0–100 score is derived from the event log.",
  },
];

export default function DocsIntroPage() {
  return (
    <div>
      <DocsHeader
        eyebrow="Introduction"
        title="Give your agent a scoped budget in a few lines."
        description="@sentinel-hq/sdk is a thin HTTP client for the hosted Sentinel API: the guardrail and trust-scoring logic runs server-side, so a check is a real answer, not a client-side suggestion. This is the surface an external developer integrates against — separate from the operations dashboard and org graph, which run on local demo data."
      />

      <Section title="Install">
        <CodeBlock code={INSTALL} label="shell" />
      </Section>

      <Section title="No self-serve signup yet">
        <p className="text-muted max-w-2xl text-[14.5px]">
          Keys are issued by hand for early design partners while the tenancy and billing layer is
          being built. Request one and it&apos;ll be hashed before storage and never shown again.
        </p>
        <div>
          <a href={mailtoHref}>
            <Button variant="secondary" size="sm">
              Request a key
            </Button>
          </a>
        </div>
      </Section>

      <Section title="Where to go next">
        <div className="grid gap-4 sm:grid-cols-2">
          {CARDS.map((c) => (
            <Link
              key={c.href}
              href={c.href}
              data-cursor
              className="border-border bg-surface hover:border-brand-muted/50 group flex flex-col gap-2 rounded-lg border p-5 transition-colors"
            >
              <span className="text-foreground flex items-center gap-1.5 text-[15px] font-semibold">
                {c.title}
                <ArrowRight className="size-3.5 -translate-x-1 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" />
              </span>
              <span className="text-muted text-[13px]">{c.body}</span>
            </Link>
          ))}
        </div>
      </Section>

      <DocsPager slug="" />
    </div>
  );
}
