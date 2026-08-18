import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { CodeBlock } from "@/components/landing/code-block";
import { Button } from "@/components/ui/button";
import { BRAND } from "@/lib/brand";

export const metadata: Metadata = {
  title: `Docs | ${BRAND.name}`,
  description:
    "Install the Sentinel SDK, check a spend before it happens, and read the trust score.",
};

const CONTACT_EMAIL = "gopikachauhan1819@gmail.com";
const mailtoHref = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent("Sentinel API key")}`;

const INSTALL = `npm install @sentinel-hq/sdk`;

const USAGE = `import { Sentinel } from "@sentinel-hq/sdk";

const sentinel = new Sentinel({ apiKey: process.env.SENTINEL_API_KEY! });

const agent = await sentinel.agents.create({
  name: "Scout",
  model: "gpt-4o-mini",
  budgetUsdc: 50,
  perTxLimitUsdc: 5,
  expiresAt: "2027-01-01T00:00:00.000Z",
  categories: ["data"],
});

const verdict = await sentinel.check(agent.id, { amountUsdc: 0.5, category: "data" });

if (verdict.allowed) {
  // You execute the real payment through your own wallet/x402 code —
  // Sentinel never holds your keys.
  await sentinel.recordEvent(agent.id, {
    kind: "payment_success",
    label: "Paid for a data API call",
    amountUsdc: 0.5,
    category: "data",
  });
} else {
  console.log("Blocked:", verdict.reason);
}

const { score, grade } = await sentinel.agents.trust(agent.id);`;

const METHODS = [
  { call: "sentinel.agents.create(input)", detail: "Create an agent with a scoped authorization." },
  {
    call: "sentinel.agents.get(agentId)",
    detail: "Agent, current trust score, and spend summary.",
  },
  { call: "sentinel.agents.trust(agentId)", detail: "Just the trust score." },
  { call: "sentinel.agents.events(agentId)", detail: "The agent's audit trail." },
  {
    call: "sentinel.check(agentId, { amountUsdc, category })",
    detail: "The guardrail — read-only, records nothing.",
  },
  {
    call: "sentinel.recordEvent(agentId, input)",
    detail: "Append a settlement, failure, completed task, or block.",
  },
];

function Section({
  id,
  title,
  children,
}: {
  id?: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="border-border/60 border-t py-10 first:border-t-0 first:pt-0">
      <h2 className="text-xl font-bold tracking-tight">{title}</h2>
      <div className="mt-4 flex flex-col gap-4">{children}</div>
    </section>
  );
}

export default function DocsPage() {
  return (
    <div className="flex min-h-full flex-col">
      <Navbar />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-12">
        <span className="text-brand-muted font-mono text-[10px] tracking-[0.12em] uppercase">
          Docs
        </span>
        <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
          Give your agent a scoped budget in a few lines.
        </h1>
        <p className="text-muted mt-4 max-w-2xl text-[15px]">
          <code className="text-foreground font-mono text-[13.5px]">@sentinel-hq/sdk</code> is a
          thin HTTP client for the hosted Sentinel API: the guardrail and trust-scoring logic runs
          server-side, so a check is a real answer, not a client-side suggestion. This is the
          surface an external developer integrates against — separate from the operations dashboard
          and org graph, which run on local demo data.
        </p>

        <Section id="install" title="1. Install">
          <CodeBlock code={INSTALL} label="shell" />
        </Section>

        <Section title="2. Get an API key">
          <p className="text-muted max-w-2xl text-[14.5px]">
            No self-serve signup yet — keys are issued by hand for early design partners while the
            tenancy and billing layer is being built.
          </p>
          <div>
            <a href={mailtoHref}>
              <Button variant="secondary" size="sm">
                Request a key
              </Button>
            </a>
          </div>
        </Section>

        <Section title="3. Check, then record">
          <p className="text-muted max-w-2xl text-[14.5px]">
            Sentinel never executes payments for you — your agent&apos;s key stays yours. Check
            before you spend, record what actually happened after.
          </p>
          <CodeBlock code={USAGE} label="agent.ts" />
        </Section>

        <Section id="api" title="API reference">
          <div className="border-border overflow-hidden rounded-lg border">
            <div className="divide-border/70 divide-y">
              {METHODS.map((m) => (
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
          <p className="text-muted max-w-2xl text-[13.5px]">
            Errors are thrown as <code className="font-mono">SentinelError</code> (
            <code className="font-mono">.status</code>, <code className="font-mono">.body</code>{" "}
            carry the raw response) for any non-2xx response.
          </p>
        </Section>

        <div className="mt-10">
          <Link href="/" className="text-brand-muted text-sm hover:underline">
            ← Back home
          </Link>
        </div>
      </main>
    </div>
  );
}
