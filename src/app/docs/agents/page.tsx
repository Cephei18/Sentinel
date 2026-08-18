import type { Metadata } from "next";
import Link from "next/link";
import { CodeBlock } from "@/components/landing/code-block";
import {
  DocsHeader,
  DocsPager,
  MethodList,
  ParamTable,
  Section,
} from "@/components/docs/docs-page";
import { BRAND } from "@/lib/brand";

export const metadata: Metadata = {
  title: `Agents | Docs | ${BRAND.name}`,
  description: "Create an agent with a scoped authorization, then fetch its state.",
};

const CREATE = `const agent = await sentinel.agents.create({
  name: "Scout",
  model: "gpt-4o-mini",
  budgetUsdc: 50,
  perTxLimitUsdc: 5,
  expiresAt: "2027-01-01T00:00:00.000Z",
  categories: ["data"],
});

agent.id; // "agt_..." — pass this to check() and recordEvent()`;

const GET = `const { agent, trust, spend } = await fetch(
  \`https://api.sentinel.dev/v1/agents/\${agentId}\`,
  { headers: { Authorization: \`Bearer \${apiKey}\` } },
).then((r) => r.json());

// or the two convenience shortcuts:
const trust = await sentinel.agents.trust(agentId);
const events = await sentinel.agents.events(agentId);`;

const AGENT_SHAPE = `interface Agent {
  id: string;
  name: string;
  model: string;
  avatarSeed: string;
  createdAt: string;      // ISO timestamp
  status: "active" | "paused" | "expired" | "revoked";
  authorization: {
    budgetUsdc: number;
    perTxLimitUsdc: number;
    expiresAt: string;    // ISO timestamp
    categories: SpendCategory[];
  };
}`;

const CATEGORIES = [
  { name: "data", type: "category", detail: "Market data, indexers, premium endpoints." },
  { name: "compute", type: "category", detail: "Inference, GPU time, agent runtime." },
  { name: "storage", type: "category", detail: "Pinning, archives, blob storage." },
  { name: "services", type: "category", detail: "Paying other agents for tasks." },
];

export default function AgentsPage() {
  return (
    <div>
      <DocsHeader
        eyebrow="API reference"
        title="Agents"
        description="An agent is a scoped financial authorization — a budget, a per-transaction ceiling, an expiry, and the spend categories it may transact in. Nothing about it is implicit."
      />

      <Section id="create" title="Create an agent">
        <CodeBlock code={CREATE} label="agent.ts" />
        <p className="text-muted max-w-2xl text-[14.5px]">
          <code className="font-mono">POST /v1/agents</code> — creates the agent and its
          authorization in one call. There&apos;s no separate &quot;grant a budget&quot; step.
        </p>
        <ParamTable
          rows={[
            { name: "name", type: "string", required: true, detail: "Display name for the agent." },
            {
              name: "model",
              type: "string",
              required: true,
              detail: 'Backing model, e.g. "gpt-4o-mini" — shown on the profile, not load-bearing.',
            },
            {
              name: "budgetUsdc",
              type: "number > 0",
              required: true,
              detail: "Total lifetime budget the agent may spend.",
            },
            {
              name: "perTxLimitUsdc",
              type: "number > 0",
              required: true,
              detail: "Hard ceiling on any single payment.",
            },
            {
              name: "expiresAt",
              type: "ISO datetime string",
              required: true,
              detail: 'After this instant, every check blocks with "Authorization has expired."',
            },
            {
              name: "categories",
              type: "SpendCategory[]",
              required: true,
              detail: "At least one of: data, compute, storage, services.",
            },
          ]}
        />
      </Section>

      <Section title="Spend categories">
        <ParamTable rows={CATEGORIES} />
      </Section>

      <Section id="get" title="Fetch an agent">
        <CodeBlock code={GET} label="agent.ts" />
        <p className="text-muted max-w-2xl text-[14.5px]">
          <code className="font-mono">GET /v1/agents/:id</code> returns the agent alongside its
          current derived trust score and spend summary — both recomputed from the event log on
          every read, never stored. See{" "}
          <Link href="/docs/trust-score" className="text-brand-muted hover:underline">
            Trust score
          </Link>{" "}
          and{" "}
          <Link href="/docs/events" className="text-brand-muted hover:underline">
            Events
          </Link>
          .
        </p>
      </Section>

      <Section title="The Agent shape">
        <CodeBlock code={AGENT_SHAPE} label="types.ts" />
      </Section>

      <Section title="Methods on sentinel.agents">
        <MethodList
          methods={[
            {
              call: "sentinel.agents.create(input)",
              detail: "Create an agent with a scoped authorization.",
            },
            {
              call: "sentinel.agents.get(agentId)",
              detail: "Agent, current trust score, and spend summary.",
            },
            { call: "sentinel.agents.trust(agentId)", detail: "Just the trust score." },
            { call: "sentinel.agents.events(agentId)", detail: "The agent's audit trail." },
          ]}
        />
      </Section>

      <DocsPager slug="agents" />
    </div>
  );
}
