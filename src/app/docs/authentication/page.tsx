import type { Metadata } from "next";
import Link from "next/link";
import { CodeBlock } from "@/components/landing/code-block";
import { Button } from "@/components/ui/button";
import { DocsHeader, DocsPager, ParamTable, Section } from "@/components/docs/docs-page";
import { BRAND } from "@/lib/brand";

export const metadata: Metadata = {
  title: `Authentication | Docs | ${BRAND.name}`,
  description: "Bearer keys, how they're scoped to an org, and why requests without one fail.",
};

const CONTACT_EMAIL = "gopikachauhan1819@gmail.com";
const mailtoHref = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent("Sentinel API key")}`;

const HEADER_EXAMPLE = `Authorization: Bearer sk_live_...`;

export default function AuthenticationPage() {
  return (
    <div>
      <DocsHeader
        eyebrow="Get started"
        title="Authentication"
        description="Every request to the hosted API authenticates with a single Bearer API key. The SDK attaches it for you — you never construct the header by hand."
      />

      <Section title="The header">
        <CodeBlock code={HEADER_EXAMPLE} label="header" />
        <p className="text-muted max-w-2xl text-[14.5px]">
          The SDK sets this automatically from the <code className="font-mono">apiKey</code> you
          pass to <code className="font-mono">new Sentinel(...)</code>. Every method call carries it
          — there&apos;s nothing else to configure.
        </p>
      </Section>

      <Section title="How a key resolves">
        <p className="text-muted max-w-2xl text-[14.5px]">
          A key maps to exactly one organization. Every agent, event, and check you make is scoped
          to that org — there is no cross-org visibility, by construction, not by policy.
        </p>
        <ParamTable
          rows={[
            {
              name: "Storage",
              type: "hashed",
              detail: "Keys are hashed before storage; the raw value is shown once, at issuance.",
            },
            {
              name: "Revocation",
              type: "checked per request",
              detail:
                "A revoked key fails auth immediately — no caching window where a revoked key still works.",
            },
            {
              name: "Issuance",
              type: "manual",
              detail:
                "No self-serve signup yet — keys are issued by hand for early design partners.",
            },
          ]}
        />
      </Section>

      <Section title="Failure modes">
        <p className="text-muted max-w-2xl text-[14.5px]">
          Both cases return HTTP <code className="font-mono">401</code> and throw a{" "}
          <code className="font-mono">SentinelError</code> — see{" "}
          <Link href="/docs/errors" className="text-brand-muted hover:underline">
            Errors
          </Link>
          .
        </p>
        <ParamTable
          rows={[
            {
              name: "Missing or malformed header",
              type: "401",
              detail: '"Missing or malformed Authorization header. Expected: Bearer <api key>."',
            },
            {
              name: "Invalid or revoked key",
              type: "401",
              detail: '"Invalid or revoked API key."',
            },
          ]}
        />
      </Section>

      <Section title="Request a key">
        <div>
          <a href={mailtoHref}>
            <Button variant="secondary" size="sm">
              Request a key
            </Button>
          </a>
        </div>
      </Section>

      <DocsPager slug="authentication" />
    </div>
  );
}
