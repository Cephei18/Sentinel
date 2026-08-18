import type { Metadata } from "next";
import Link from "next/link";
import { CodeBlock } from "@/components/landing/code-block";
import { DocsHeader, DocsPager, ParamTable, Section } from "@/components/docs/docs-page";
import { BRAND } from "@/lib/brand";

export const metadata: Metadata = {
  title: `Events | Docs | ${BRAND.name}`,
  description: "Append what actually happened. Immutable, hash-chained, never edited.",
};

const RECORD = `await sentinel.recordEvent(agentId, {
  kind: "payment_success",
  label: "Paid for a data API call",
  amountUsdc: 0.5,
  category: "data",
  txHash: "5xJ2...", // optional, if you settled on-chain
});`;

const LIST = `const events = await sentinel.agents.events(agentId);
// newest first`;

const EVENT_SHAPE = `interface AgentEvent {
  id: string;
  agentId: string;
  kind: "payment_success" | "payment_failed" | "task_completed" | "limit_blocked";
  label: string;
  amountUsdc?: number;
  category?: SpendCategory;
  txHash?: string;
  counterpartyId?: string;
  trustDelta?: number;   // how this event moved the trust score
  at: string;            // ISO timestamp, server-stamped
}`;

export default function EventsPage() {
  return (
    <div>
      <DocsHeader
        eyebrow="API reference"
        title="Events"
        description="An agent's audit trail is append-only by construction — nothing here is ever updated or deleted. Trust, spend, and history are all derived from this log, never stored as a separate mutable number."
      />

      <Section title="Record what happened">
        <CodeBlock code={RECORD} label="agent.ts" />
        <p className="text-muted max-w-2xl text-[14.5px]">
          <code className="font-mono">POST /v1/agents/:id/events</code>. Call this after{" "}
          <Link href="/docs/guardrail" className="text-brand-muted hover:underline">
            check()
          </Link>{" "}
          tells you a spend is allowed and you&apos;ve actually executed it — this endpoint reports
          outcomes, it doesn&apos;t re-scope the agent&apos;s authorization.
        </p>
        <ParamTable
          rows={[
            {
              name: "kind",
              type: "payment_success | payment_failed | task_completed | limit_blocked",
              required: true,
              detail:
                'What happened. "authorized" events come from creating/updating an agent, not from here.',
            },
            {
              name: "label",
              type: "string",
              required: true,
              detail: "Short human-readable description.",
            },
            { name: "amountUsdc", type: "number", detail: "USDC amount involved, if any." },
            {
              name: "category",
              type: "SpendCategory",
              detail: "One of data, compute, storage, services.",
            },
            {
              name: "txHash",
              type: "string",
              detail: "On-chain transaction hash, if the event settled a payment.",
            },
            {
              name: "counterpartyId",
              type: "string",
              detail: "The other agent's id, for agent-to-agent payments.",
            },
          ]}
        />
      </Section>

      <Section title="List an agent's events">
        <CodeBlock code={LIST} label="agent.ts" />
        <p className="text-muted max-w-2xl text-[14.5px]">
          <code className="font-mono">GET /v1/agents/:id/events</code>, ordered newest first.
        </p>
      </Section>

      <Section title="The AgentEvent shape">
        <CodeBlock code={EVENT_SHAPE} label="types.ts" />
        <p className="text-muted max-w-2xl text-[14.5px]">
          <code className="font-mono">trustDelta</code> is stamped server-side at write time —
          exactly how much this one event moved the score, so a UI can show a live &quot;+3
          Trust&quot; without recomputing the whole history.
        </p>
      </Section>

      <Section title="Why hash-chained">
        <p className="text-muted max-w-2xl text-[14.5px]">
          Every event links to the hash of the one before it — one chain per organization, spanning
          all of that org&apos;s agents. Rewriting history means breaking the chain, which makes
          tampering detectable rather than merely against policy. This is why the trust score is
          derived, never a stored mutable field: the log is the only thing that can be trusted to
          not have quietly changed.
        </p>
      </Section>

      <DocsPager slug="events" />
    </div>
  );
}
