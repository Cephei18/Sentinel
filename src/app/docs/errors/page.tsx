import type { Metadata } from "next";
import { CodeBlock } from "@/components/landing/code-block";
import { DocsHeader, DocsPager, ParamTable, Section } from "@/components/docs/docs-page";
import { BRAND } from "@/lib/brand";

export const metadata: Metadata = {
  title: `Errors | Docs | ${BRAND.name}`,
  description: "Status codes and the SentinelError shape thrown for any non-2xx response.",
};

const CATCH = `import { Sentinel, SentinelError } from "@sentinel-hq/sdk";

try {
  await sentinel.check(agentId, { amountUsdc: 5, category: "data" });
} catch (err) {
  if (err instanceof SentinelError) {
    console.log(err.status, err.message, err.body);
  }
}`;

const SHAPE = `class SentinelError extends Error {
  name: "SentinelError";
  status: number;   // the HTTP status code
  body: unknown;    // the raw parsed response body
}`;

const CODES = [
  {
    name: "400",
    type: "Invalid request body",
    detail:
      "e.g. a non-positive budgetUsdc, or a categories array with an unknown value. body.details carries the field-level Zod errors.",
  },
  {
    name: "401",
    type: "Missing or malformed Authorization header",
    detail: "No Bearer token was sent — see Authentication.",
  },
  {
    name: "401",
    type: "Invalid or revoked API key",
    detail: "The token doesn't resolve to an active key.",
  },
  {
    name: "404",
    type: "Agent not found",
    detail: "Either the id doesn't exist, or it belongs to a different org than your key.",
  },
];

export default function ErrorsPage() {
  return (
    <div>
      <DocsHeader
        eyebrow="Reference"
        title="Errors"
        description="Any non-2xx response is thrown as a SentinelError, never returned as a normal value — you don't need to check a status field on every call."
      />

      <Section title="Catching it">
        <CodeBlock code={CATCH} label="agent.ts" />
      </Section>

      <Section title="The shape">
        <CodeBlock code={SHAPE} label="types.ts" />
        <p className="text-muted max-w-2xl text-[14.5px]">
          <code className="font-mono">message</code> is the server&apos;s{" "}
          <code className="font-mono">error</code> string when the response body has one, or a
          generic{" "}
          <code className="font-mono">
            &quot;Sentinel API request failed ({"{"}status{"}"})&quot;
          </code>{" "}
          fallback otherwise.
        </p>
      </Section>

      <Section title="Status codes">
        <ParamTable rows={CODES} />
      </Section>

      <DocsPager slug="errors" />
    </div>
  );
}
