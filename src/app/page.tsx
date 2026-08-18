"use client";

import Link from "next/link";
import { useState } from "react";
import { motion } from "motion/react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrustGraph } from "@/components/agents/trust-graph";
import { PointerField, Spotlight } from "@/components/landing/pointer-field";
import { ScrollProgress } from "@/components/landing/scroll-progress";
import { TiltCard } from "@/components/landing/tilt-card";
import { Magnetic } from "@/components/landing/magnetic";
import { LiveGuardrail } from "@/components/landing/live-guardrail";
import { LiveTrust } from "@/components/landing/live-trust";
import { CodeBlock } from "@/components/landing/code-block";
import { fade } from "@/components/landing/motion-presets";
import { BRAND } from "@/lib/brand";

const CONTACT_EMAIL = "gopikachauhan1819@gmail.com";
const mailtoHref = (from?: string) =>
  `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(
    "Interested in Sentinel",
  )}&body=${encodeURIComponent(
    `Hi,\n\nTell us a bit about the agents you're running and what you'd want governed.\n\n${
      from ? `Reach me at: ${from}\n\n` : ""
    }`,
  )}`;

const LEGEND = [
  { className: "bg-success", label: "Autonomous" },
  { className: "bg-brand-muted", label: "Trusted" },
  { className: "bg-warning", label: "Supervised" },
  { className: "bg-danger", label: "At risk" },
];

const TILES = [
  {
    kicker: "Authorization",
    title: "Scoped authority",
    body: (
      <div className="mt-auto flex flex-col gap-1.5">
        {[
          ["Total budget", "$100"],
          ["Per transaction", "$5"],
          ["Expires", "30d"],
        ].map(([label, value]) => (
          <span
            key={label}
            className="bg-background flex justify-between rounded-[var(--radius)] px-3.5 py-2 text-[13px]"
          >
            {label} <strong>{value}</strong>
          </span>
        ))}
      </div>
    ),
  },
  {
    kicker: "Guardrails",
    title: "Checked on the way in",
    body: (
      <div className="mt-auto">
        <p className="text-[64px] leading-none font-semibold">2</p>
        <p className="text-muted mt-2 text-sm">payments stopped before value moved</p>
      </div>
    ),
  },
  {
    kicker: "Autonomy",
    title: "Trust buys freedom",
    body: (
      <div className="mt-auto flex flex-col gap-1.5">
        {[
          ["bg-warning", "Supervised", "0–65"],
          ["bg-brand-muted", "Trusted", "66–83"],
          ["bg-success", "Autonomous", "84–100"],
        ].map(([dot, label, range]) => (
          <span
            key={label}
            className="bg-background flex items-center gap-2.5 rounded-[var(--radius)] px-3.5 py-2 text-[13px]"
          >
            <span className={`size-2 rounded-full ${dot}`} />
            {label}
            <span className="text-muted ml-auto">{range}</span>
          </span>
        ))}
      </div>
    ),
  },
  {
    kicker: "Audit",
    title: "Hash-chained, not just logged",
    body: (
      <div className="mt-auto">
        <p className="text-[64px] leading-none font-semibold">0</p>
        <p className="text-muted mt-2 text-sm">edits possible without breaking the chain</p>
      </div>
    ),
  },
];

const STEPS = [
  { title: "Hire", body: "Grant a scoped budget." },
  { title: "Govern", body: "Watch a guardrail refuse." },
  { title: "Settle", body: "An x402 payment lands." },
  { title: "Delegate", body: "A worker hires a worker." },
  { title: "Allocate", body: "Back the reliable one." },
];

const SDK_SNIPPET = `import { Sentinel } from "@sentinel-hq/sdk";

const sentinel = new Sentinel({ apiKey: process.env.SENTINEL_API_KEY! });

const verdict = await sentinel.check(agentId, {
  amountUsdc: 0.5,
  category: "data",
});

if (verdict.allowed) {
  // You execute the real payment through your own wallet/x402 code.
  const txHash = await payViaYourOwnRail();

  await sentinel.recordEvent(agentId, {
    kind: "payment_success",
    label: "Paid for a data API call",
    amountUsdc: 0.5,
    category: "data",
    txHash,
  });
} else {
  console.log("Blocked:", verdict.reason);
}`;

const SDK_METHODS = [
  { call: "sentinel.agents.create()", detail: "Grant an agent a scoped budget" },
  { call: "sentinel.check()", detail: "The guardrail — read-only" },
  { call: "sentinel.recordEvent()", detail: "Append a settlement, failure, task, or block" },
  { call: "sentinel.agents.trust()", detail: "The current explainable score" },
];

const FOOTER_COLUMNS = [
  {
    heading: "Product",
    links: [
      { label: "Operations", href: "/dashboard" },
      { label: "Org graph", href: "/graph" },
    ],
  },
  {
    heading: "Developers",
    links: [
      { label: "Docs", href: "/docs" },
      { label: "SDK reference", href: "/docs/agents" },
    ],
  },
  {
    heading: "Engine",
    links: [
      { label: "Trust model", href: "#trust-engine" },
      { label: "How it works", href: "#how-it-works" },
    ],
  },
  {
    heading: "Company",
    links: [{ label: "Contact", href: "#contact" }],
  },
];

function LandingHeader() {
  return (
    <header className="border-border/60 bg-background/70 sticky top-0 z-40 border-b backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-2 px-4">
        <Link href="/" className="mr-8 flex items-center gap-2.5 font-semibold">
          <span
            className="bg-brand text-brand-foreground grid size-7 place-items-center rounded-full text-sm"
            style={{ animation: "breathe 5s ease-in-out infinite" }}
          >
            {BRAND.glyph}
          </span>
          {BRAND.name}
        </Link>
        <nav className="flex items-center gap-1">
          <a
            href="#product"
            data-cursor
            className="text-muted hover:bg-foreground/8 hover:text-foreground hidden rounded-full px-3.5 py-2 text-sm transition-colors sm:block"
          >
            Product
          </a>
          <a
            href="#trust-engine"
            data-cursor
            className="text-muted hover:bg-foreground/8 hover:text-foreground hidden rounded-full px-3.5 py-2 text-sm transition-colors sm:block"
          >
            Trust engine
          </a>
          <a
            href="#sdk"
            data-cursor
            className="text-muted hover:bg-foreground/8 hover:text-foreground hidden rounded-full px-3.5 py-2 text-sm transition-colors sm:block"
          >
            SDK
          </a>
          <Link
            href="/docs"
            data-cursor
            className="text-muted hover:bg-foreground/8 hover:text-foreground hidden rounded-full px-3.5 py-2 text-sm transition-colors sm:block"
          >
            Docs
          </Link>
        </nav>
        <div className="ml-auto flex items-center gap-4">
          <Link
            href="/graph"
            data-cursor
            className="text-brand-muted hidden text-sm font-medium sm:block"
          >
            Org graph
          </Link>
          <Magnetic>
            <a href={mailtoHref()}>
              <Button size="sm">Get in touch</Button>
            </a>
          </Magnetic>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section
      id="product"
      className="relative mx-auto max-w-6xl overflow-hidden px-4 pt-16 pb-20 sm:pt-20"
    >
      <span
        aria-hidden
        className="bg-brand/10 pointer-events-none absolute top-24 -left-20 size-72 rounded-full blur-3xl"
        style={
          {
            "--drift-x": "24px",
            "--drift-y": "-20px",
            animation: "drift 12s ease-in-out infinite",
          } as React.CSSProperties
        }
      />
      <span
        aria-hidden
        className="bg-brand-muted/10 pointer-events-none absolute -right-15 bottom-0 size-64 rounded-full blur-3xl"
        style={
          {
            "--drift-x": "-18px",
            "--drift-y": "22px",
            animation: "drift 15s ease-in-out infinite 1s",
          } as React.CSSProperties
        }
      />
      <div className="relative grid items-center gap-14 lg:grid-cols-[1fr_440px]">
        <div>
          <motion.div custom={0} variants={fade} initial="hidden" animate="show">
            <Badge variant="brand" className="mb-6">
              npm install @sentinel-hq/sdk
            </Badge>
          </motion.div>
          <motion.h1
            custom={1}
            variants={fade}
            initial="hidden"
            animate="show"
            className="max-w-lg text-5xl font-bold tracking-tight text-balance sm:text-6xl"
          >
            Give AI agents money. Let them earn more.
          </motion.h1>
          <motion.p
            custom={2}
            variants={fade}
            initial="hidden"
            animate="show"
            className="text-muted mt-6 max-w-md text-lg text-balance"
          >
            Every agent starts scoped and supervised. A deterministic trust score turns demonstrated
            behavior into greater autonomy and a bigger budget — callable straight from your own
            agent code, never the other way around.
          </motion.p>
          <motion.div
            custom={3}
            variants={fade}
            initial="hidden"
            animate="show"
            className="mt-9 flex flex-wrap items-center gap-3"
          >
            <Magnetic>
              <a href={mailtoHref()}>
                <Button size="lg">
                  Get in touch <ArrowRight className="size-4" />
                </Button>
              </a>
            </Magnetic>
            <Magnetic>
              <Link href="/dashboard">
                <Button size="lg" variant="secondary">
                  Open the dashboard
                </Button>
              </Link>
            </Magnetic>
          </motion.div>
        </div>
        <LiveGuardrail />
      </div>
    </section>
  );
}

function ControlPlane() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-20 sm:py-24">
      <h2 className="max-w-xl text-3xl font-bold tracking-tight sm:text-4xl">
        A control plane, not a key.
      </h2>
      <p className="text-muted mt-4 max-w-2xl">
        The foundation every payment passes through before trust decides what&apos;s next.
      </p>
      <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {TILES.map((tile, i) => (
          <motion.div
            key={tile.title}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ delay: i * 0.08, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            <TiltCard
              max={6}
              className="border-border bg-surface flex min-h-[232px] flex-col gap-4 rounded-lg border p-7"
            >
              <span className="text-brand-muted font-mono text-[10px] tracking-[0.12em] uppercase">
                {tile.kicker}
              </span>
              <div className="text-[22px] font-semibold">{tile.title}</div>
              {tile.body}
            </TiltCard>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function TrustEngine() {
  return (
    <section id="trust-engine" className="border-border/60 border-t px-4 py-20 sm:py-24">
      <div className="mx-auto max-w-6xl">
        <h2 className="max-w-xl text-3xl font-bold tracking-tight sm:text-4xl">
          Behaviour in. A score out.
        </h2>
        <p className="text-muted mt-4 max-w-2xl">
          Recomputed from an append-only event log on every read, so the same history always returns
          the same number. This is Atlas&apos;s real record — scroll, and watch the score build from
          it.
        </p>
        <LiveTrust />
      </div>
    </section>
  );
}

function SdkSection() {
  return (
    <section id="sdk" className="border-border/60 border-t px-4 py-20 sm:py-24">
      <div className="mx-auto max-w-6xl">
        <span className="text-brand-muted font-mono text-[10px] tracking-[0.12em] uppercase">
          Developer surface
        </span>
        <h2 className="mt-3 max-w-xl text-3xl font-bold tracking-tight sm:text-4xl">
          Check first. Record what happened.
        </h2>
        <p className="text-muted mt-4 max-w-2xl">
          A thin TypeScript client over the hosted API. Sentinel never holds your agent&apos;s keys
          or executes a payment for you — it just answers one question before you spend, and keeps
          the record after.
        </p>
        <div className="mt-10 grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
          <CodeBlock code={SDK_SNIPPET} label="agent.ts" />
          <div className="flex flex-col gap-5">
            <div className="border-border bg-surface flex flex-col gap-3 rounded-lg border p-5">
              {SDK_METHODS.map((m) => (
                <div key={m.call} className="flex flex-col gap-0.5">
                  <span className="font-mono text-[13px] font-semibold">{m.call}</span>
                  <span className="text-muted text-[12.5px]">{m.detail}</span>
                </div>
              ))}
            </div>
            <Magnetic>
              <Link href="/docs">
                <Button variant="secondary" className="w-full">
                  Read the docs <ArrowRight className="size-4" />
                </Button>
              </Link>
            </Magnetic>
          </div>
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  return (
    <section id="how-it-works" className="mx-auto max-w-6xl px-4 py-20 sm:py-24">
      <h2 className="max-w-xl text-3xl font-bold tracking-tight sm:text-4xl">
        Five moves, ninety seconds.
      </h2>
      <div className="relative mt-12">
        <div className="border-border/60 absolute top-6.5 right-6.5 left-6.5 hidden h-px border-t sm:block" />
        <div className="relative grid grid-cols-2 gap-6 sm:grid-cols-5">
          {STEPS.map((s, i) => (
            <motion.div
              key={s.title}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col gap-4"
            >
              <span
                className={`text-brand-foreground grid size-13 place-items-center rounded-full text-xl font-semibold ${
                  i % 2 === 0 ? "bg-brand" : "bg-brand-muted"
                }`}
                style={{ boxShadow: "0 0 0 10px var(--color-background)" }}
              >
                {i + 1}
              </span>
              <div>
                <p className="text-[17px] font-bold">{s.title}</p>
                <p className="text-muted mt-1.5 text-sm">{s.body}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CompanyInMotion() {
  return (
    <section className="border-border/60 relative overflow-hidden border-y bg-neutral-900/40 px-4 py-20 sm:py-24">
      <span
        aria-hidden
        className="bg-brand-muted/8 pointer-events-none absolute -top-16 right-1/4 size-80 rounded-full blur-3xl"
        style={
          {
            "--drift-x": "-14px",
            "--drift-y": "20px",
            animation: "drift 14s ease-in-out infinite",
          } as React.CSSProperties
        }
      />
      <div className="relative mx-auto max-w-6xl">
        <div className="flex flex-wrap items-end justify-between gap-10">
          <div>
            <h2 className="max-w-xl text-3xl font-bold tracking-tight sm:text-4xl">
              The company, in motion.
            </h2>
            <p className="text-muted mt-4 max-w-xl">
              Distance to the founder is inverse to trust. Bright edges are workers paying each
              other.
            </p>
          </div>
          <div className="flex gap-3">
            <Magnetic>
              <Link href="/graph">
                <Button>
                  Open the graph <ArrowRight className="size-4" />
                </Button>
              </Link>
            </Magnetic>
            <Magnetic>
              <Link href="/dashboard">
                <Button variant="secondary">Operations</Button>
              </Link>
            </Magnetic>
          </div>
        </div>

        <div className="border-border bg-background mt-12 overflow-x-auto rounded-lg border p-6 shadow-2xl">
          <TrustGraph />
          <div className="border-border/60 mt-2 flex flex-wrap items-center gap-x-6 gap-y-2 border-t pt-4">
            {LEGEND.map((l) => (
              <span key={l.label} className="text-muted flex items-center gap-2 text-xs">
                <span className={`size-2.5 rounded-full ${l.className}`} />
                {l.label}
              </span>
            ))}
            <span className="text-muted ml-auto flex items-center gap-2 text-xs">
              <span className="bg-brand h-0.5 w-4.5" />
              agent-to-agent payment
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

function CallToAction() {
  const [email, setEmail] = useState("");
  return (
    <section id="contact" className="mx-auto max-w-6xl px-4 py-20 sm:py-24">
      <div className="from-brand/25 to-surface border-border relative flex flex-col gap-8 overflow-hidden rounded-2xl border bg-gradient-to-br p-10 sm:flex-row sm:items-center sm:justify-between sm:p-14">
        <div className="bg-brand/20 pointer-events-none absolute -top-24 -right-20 size-72 rounded-full" />
        <h2 className="relative max-w-sm text-3xl font-bold tracking-tight sm:text-4xl">
          Try it with your own agents.
        </h2>
        <form
          className="relative flex min-w-0 flex-col gap-2.5 sm:min-w-[380px] sm:flex-row"
          onSubmit={(e) => {
            e.preventDefault();
            window.location.href = mailtoHref(email || undefined);
          }}
        >
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
            className="bg-background border-border placeholder:text-muted/70 focus-visible:border-brand-muted h-11 min-w-0 flex-1 rounded-[var(--radius)] border px-3.5 text-sm focus-visible:outline-none"
          />
          <Magnetic>
            <Button type="submit" className="shrink-0">
              Request access
            </Button>
          </Magnetic>
        </form>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-border/60 border-t px-4 py-12">
      <div className="mx-auto max-w-6xl">
        <div className="border-border/60 grid gap-10 border-b pb-8 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr_1fr]">
          <span className="flex items-center gap-2.5 text-lg font-semibold">
            <span className="bg-brand text-brand-foreground grid size-7 place-items-center rounded-full text-sm">
              {BRAND.glyph}
            </span>
            {BRAND.name}
          </span>
          {FOOTER_COLUMNS.map((col) => (
            <div key={col.heading} className="flex flex-col gap-2.5">
              <span className="text-muted text-[11px] tracking-wider uppercase">{col.heading}</span>
              {col.links.map((l) => (
                <Link
                  key={l.label}
                  href={l.href}
                  data-cursor
                  className="text-muted hover:text-brand-muted text-[13.5px]"
                >
                  {l.label}
                </Link>
              ))}
            </div>
          ))}
        </div>
        <div className="text-muted flex flex-wrap items-center justify-between gap-3 pt-5 text-[12.5px]">
          <span>
            © 2026 {BRAND.name}. {BRAND.tagline}
          </span>
          <span className="flex items-center gap-2">
            <span
              className="bg-brand-muted size-1.5 rounded-full"
              style={{ animation: "blink 2.4s ease-in-out infinite" }}
            />
            devnet · all systems nominal
          </span>
        </div>
      </div>
    </footer>
  );
}

export default function Home() {
  return (
    <div className="relative flex min-h-full flex-col">
      <ScrollProgress />
      <PointerField />
      <Spotlight />
      <LandingHeader />
      <main className="flex-1">
        <Hero />
        <ControlPlane />
        <TrustEngine />
        <SdkSection />
        <HowItWorks />
        <CompanyInMotion />
        <CallToAction />
      </main>
      <Footer />
    </div>
  );
}
