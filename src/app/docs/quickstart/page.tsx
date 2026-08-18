import type { Metadata } from "next";
import Link from "next/link";
import { CodeBlock } from "@/components/landing/code-block";
import { Button } from "@/components/ui/button";
import { DocsHeader, DocsPager, Section } from "@/components/docs/docs-page";
import { BRAND } from "@/lib/brand";

export const metadata: Metadata = {
  title: `Quickstart | Docs | ${BRAND.name}`,
  description: "Install the SDK, get a key, and ship your first guardrail check.",
};

const CONTACT_EMAIL = "gopikachauhan1819@gmail.com";
const mailtoHref = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent("Sentinel API key")}`;

const INSTALL = `npm install @sentinel-hq/sdk`;

const INIT = `import { Sentinel } from "@sentinel-hq/sdk";

const sentinel = new Sentinel({ apiKey: process.env.SENTINEL_API_KEY! });`;

const FULL_EXAMPLE = `import { Sentinel } from "@sentinel-hq/sdk";

const sentinel = new Sentinel({ apiKey: process.env.SENTINEL_API_KEY! });

// 1. Grant a scoped authorization.
const agent = await sentinel.agents.create({
  name: "Scout",
  model: "gpt-4o-mini",
  budgetUsdc: 50,
  perTxLimitUsdc: 5,
  expiresAt: "2027-01-01T00:00:00.000Z",
  categories: ["data"],
});

// 2. Check before you spend. Read-only — records nothing.
const verdict = await sentinel.check(agent.id, { amountUsdc: 0.5, category: "data" });

if (verdict.allowed) {
  // 3. You execute the real payment through your own wallet/x402 code —
  //    Sentinel never holds your keys.
  await sentinel.recordEvent(agent.id, {
    kind: "payment_success",
    label: "Paid for a data API call",
    amountUsdc: 0.5,
    category: "data",
  });
} else {
  console.log("Blocked:", verdict.reason);
}

// 4. Trust moves as behaviour accumulates.
const { score, grade } = await sentinel.agents.trust(agent.id);`;

export default function QuickstartPage() {
  return (
    <div>
      <DocsHeader
        eyebrow="Get started"
        title="Quickstart"
        description="Four steps from zero to a governed agent: install, get a key, grant a scoped budget, and check a spend before it happens."
      />

      <Section title="1. Install">
        <CodeBlock code={INSTALL} label="shell" />
      </Section>

      <Section title="2. Get an API key">
        <p className="text-muted max-w-2xl text-[14.5px]">
          No self-serve signup yet — keys are issued by hand for early design partners. See{" "}
          <Link href="/docs/authentication" className="text-brand-muted hover:underline">
            Authentication
          </Link>{" "}
          for how the key is used on every request.
        </p>
        <div>
          <a href={mailtoHref}>
            <Button variant="secondary" size="sm">
              Request a key
            </Button>
          </a>
        </div>
      </Section>

      <Section title="3. Initialize the client">
        <CodeBlock code={INIT} label="sentinel.ts" />
      </Section>

      <Section title="4. Grant, check, record">
        <p className="text-muted max-w-2xl text-[14.5px]">
          Sentinel never executes payments for you — your agent&apos;s key stays yours. Check before
          you spend, record what actually happened after. This mirrors exactly how the
          product&apos;s own demo app uses the engine internally.
        </p>
        <CodeBlock code={FULL_EXAMPLE} label="agent.ts" />
      </Section>

      <Section title="What's next">
        <p className="text-muted max-w-2xl text-[14.5px]">
          Read{" "}
          <Link href="/docs/agents" className="text-brand-muted hover:underline">
            Agents
          </Link>{" "}
          for the full authorization shape and categories,{" "}
          <Link href="/docs/guardrail" className="text-brand-muted hover:underline">
            Guardrail check
          </Link>{" "}
          for how the block decision is made, and{" "}
          <Link href="/docs/trust-score" className="text-brand-muted hover:underline">
            Trust score
          </Link>{" "}
          for how the number is computed.
        </p>
      </Section>

      <DocsPager slug="quickstart" />
    </div>
  );
}
