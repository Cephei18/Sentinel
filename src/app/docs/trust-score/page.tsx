import type { Metadata } from "next";
import Link from "next/link";
import { CodeBlock } from "@/components/landing/code-block";
import { DocsHeader, DocsPager, ParamTable, Section } from "@/components/docs/docs-page";
import { BRAND } from "@/lib/brand";

export const metadata: Metadata = {
  title: `Trust score | Docs | ${BRAND.name}`,
  description: "How a deterministic 0–100 score is derived from an agent's event log.",
};

const TRUST_CALL = `const { score, grade, confidence, factors, sampleSize } =
  await sentinel.agents.trust(agentId);`;

const SHAPE = `interface TrustScore {
  score: number;           // 0..100
  grade: "AAA" | "AA" | "A" | "BBB" | "BB" | "B" | "C";
  confidence: "low" | "medium" | "high";
  factors: TrustFactor[];  // one per weighted component, each with a plain-language reason
  sampleSize: number;      // count of settled payments
}`;

const FACTORS = [
  {
    name: "reliability",
    type: "40%",
    detail: "Share of payment attempts (success vs. failure) that settled.",
  },
  {
    name: "discipline",
    type: "25%",
    detail:
      "Stays within budget and per-transaction limits; guardrail blocks are a mild negative signal.",
  },
  { name: "completion", type: "20%", detail: "Completed tasks relative to payments made." },
  {
    name: "consistency",
    type: "15%",
    detail: "A longer clean track record; each failure erodes it.",
  },
];

const GRADES = [
  { name: "AAA", type: "≥ 92", detail: "Autonomous tier." },
  { name: "AA", type: "≥ 84", detail: "Autonomous tier (84 is the autonomy threshold)." },
  { name: "A", type: "≥ 75", detail: "Trusted tier." },
  { name: "BBB", type: "≥ 66", detail: "Trusted tier (66 is the trusted threshold)." },
  { name: "BB", type: "≥ 55", detail: "Supervised tier." },
  { name: "B", type: "≥ 42", detail: "Supervised tier." },
  { name: "C", type: "< 42", detail: "Supervised tier." },
];

const CONFIDENCE = [
  { name: "low", type: "< 4 settled payments", detail: "Too little history to weigh heavily." },
  { name: "medium", type: "4–11 settled payments", detail: "An emerging track record." },
  {
    name: "high",
    type: "≥ 12 settled payments",
    detail: "Enough history that the score is well-supported.",
  },
];

export default function TrustScorePage() {
  return (
    <div>
      <DocsHeader
        eyebrow="API reference"
        title="Trust score"
        description="A deterministic blend of behavioural factors, recomputed from the full event log on every read — never stored as a mutable number, never an opaque model at the core. Same history, same score, every time."
      />

      <Section title="Read it">
        <CodeBlock code={TRUST_CALL} label="agent.ts" />
        <p className="text-muted max-w-2xl text-[14.5px]">
          Also returned inline from{" "}
          <Link href="/docs/agents#get" className="text-brand-muted hover:underline">
            sentinel.agents.get()
          </Link>{" "}
          — use the dedicated call when you only need the number.
        </p>
      </Section>

      <Section title="The shape">
        <CodeBlock code={SHAPE} label="types.ts" />
      </Section>

      <Section title="The four factors">
        <p className="text-muted max-w-2xl text-[14.5px]">
          Weights sum to 1. Each factor carries a <code className="font-mono">detail</code> string
          explaining exactly why it landed where it did — every point is attributable, by design.
        </p>
        <ParamTable rows={FACTORS} />
      </Section>

      <Section title="Grade thresholds">
        <ParamTable rows={GRADES} />
      </Section>

      <Section title="Confidence">
        <p className="text-muted max-w-2xl text-[14.5px]">
          A perfect record over 2 events isn&apos;t the same as over 50 — confidence says how much
          weight to put on the score itself, independent of what the score is.
        </p>
        <ParamTable rows={CONFIDENCE} />
      </Section>

      <Section title="What it gates">
        <p className="text-muted max-w-2xl text-[14.5px]">
          The score isn&apos;t a vanity metric — it drives autonomy tier (Supervised → Trusted at 66
          → Autonomous at 84, which also unlocks delegation) and budget recommendations. Trust
          converts directly into how much an agent is allowed to do next.
        </p>
      </Section>

      <DocsPager slug="trust-score" />
    </div>
  );
}
