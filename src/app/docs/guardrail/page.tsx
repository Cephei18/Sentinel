import type { Metadata } from "next";
import Link from "next/link";
import { CodeBlock } from "@/components/landing/code-block";
import { DocsHeader, DocsPager, ParamTable, Section } from "@/components/docs/docs-page";
import { BRAND } from "@/lib/brand";

export const metadata: Metadata = {
  title: `Guardrail check | Docs | ${BRAND.name}`,
  description: "The pre-flight, read-only answer to whether a spend is allowed right now.",
};

const CHECK = `const verdict = await sentinel.check(agentId, {
  amountUsdc: 0.5,
  category: "data",
});

if (verdict.allowed) {
  // proceed with your own payment code
} else {
  console.log("Blocked:", verdict.reason);
}`;

const RESULT_TYPE = `type CheckResult =
  | { allowed: true }
  | { allowed: false; reason: string };`;

const ORDER = [
  {
    name: "1. Status",
    type: "active only",
    detail:
      '"{name} is {status} — not authorized to transact." Paused, expired, or revoked agents fail here first.',
  },
  {
    name: "2. Expiry",
    type: "expiresAt vs. now",
    detail:
      '"Authorization has expired." — checked against the time you call check(), not creation time.',
  },
  {
    name: "3. Category",
    type: "category ⊆ categories",
    detail: '"Category \\"{category}\\" is outside {name}\'s authorization."',
  },
  {
    name: "4. Amount sanity",
    type: "amountUsdc > 0",
    detail: '"Enter an amount greater than 0."',
  },
  {
    name: "5. Per-transaction limit",
    type: "amountUsdc ≤ perTxLimitUsdc",
    detail: '"${amountUsdc} exceeds the ${perTxLimitUsdc} per-transaction limit."',
  },
  {
    name: "6. Remaining budget",
    type: "amountUsdc ≤ remainingUsdc",
    detail:
      '"{name}\'s budget is exhausted." — remaining is lifetime budget minus successful settlements.',
  },
];

export default function GuardrailPage() {
  return (
    <div>
      <DocsHeader
        eyebrow="API reference"
        title="Guardrail check"
        description="Is this agent allowed to spend this amount, in this category, right now? Read-only — it records nothing. This is the one function every spend path calls before value moves."
      />

      <Section title="Call it before every spend">
        <CodeBlock code={CHECK} label="agent.ts" />
        <p className="text-muted max-w-2xl text-[14.5px]">
          <code className="font-mono">POST /v1/agents/:id/check</code>. Sentinel never executes the
          payment — you do, through your own wallet or x402 code. Once you know what actually
          happened, record it — see{" "}
          <Link href="/docs/events" className="text-brand-muted hover:underline">
            Events
          </Link>
          .
        </p>
      </Section>

      <Section title="The result">
        <CodeBlock code={RESULT_TYPE} label="types.ts" />
      </Section>

      <Section title="Check order (first failure wins)">
        <p className="text-muted max-w-2xl text-[14.5px]">
          The order is part of the contract, not an implementation detail — a blocked reason is
          always the *first* rule the request fails, so the same input always produces the same
          reason string. Deterministic, like the rest of the engine.
        </p>
        <ParamTable rows={ORDER} />
      </Section>

      <DocsPager slug="guardrail" />
    </div>
  );
}
