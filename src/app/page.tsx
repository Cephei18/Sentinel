"use client";

import Link from "next/link";
import { useState } from "react";
import { motion } from "motion/react";
import { ArrowRight, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrustGraph } from "@/components/agents/trust-graph";
import { TrustScoreRing } from "@/components/agents/trust-score-ring";
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

const TICKER = [
  { kind: "payment", text: "Atlas · premium market data · $0.01 · Trust +3" },
  { kind: "blocked", text: "Probe · spend outside allowed category · Trust −4" },
  { kind: "payment", text: "Atlas → Nova · data enrichment · $1.20 · Trust +3" },
  { kind: "budget", text: "Atlas · allocation raised $100 → $150" },
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
];

const TRUST_FEED = [
  { label: "payment · $0.25", delta: "+2" },
  { label: "task completed", delta: null },
  { label: "payment · $1.20", delta: "+3" },
  { label: "blocked", delta: "−4" },
  { label: "failed · $1.50", delta: "−5" },
];

const TRUST_FACTORS = [
  { pct: "40%", label: "Payment reliability" },
  { pct: "25%", label: "Spending discipline" },
  { pct: "20%", label: "Task completion" },
  { pct: "15%", label: "Consistency" },
];

const STEPS = [
  { title: "Hire", body: "Grant a scoped budget." },
  { title: "Govern", body: "Watch a guardrail refuse." },
  { title: "Settle", body: "An x402 payment lands." },
  { title: "Delegate", body: "A worker hires a worker." },
  { title: "Allocate", body: "Back the reliable one." },
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
    heading: "Engine",
    links: [
      { label: "Trust model", href: "#trust-engine" },
      { label: "Governance", href: "#trust-engine" },
      { label: "How it works", href: "#how-it-works" },
    ],
  },
  {
    heading: "Company",
    links: [{ label: "Contact", href: "#contact" }],
  },
];

const fade = {
  hidden: { opacity: 0, y: 14 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.5, ease: [0.16, 1, 0.3, 1] as const },
  }),
};

function LandingHeader() {
  return (
    <header className="border-border/60 bg-background/70 sticky top-0 z-40 border-b backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-2 px-4">
        <Link href="/" className="mr-8 flex items-center gap-2.5 font-semibold">
          <span className="bg-brand text-brand-foreground grid size-7 place-items-center rounded-full text-sm">
            {BRAND.glyph}
          </span>
          {BRAND.name}
        </Link>
        <nav className="flex items-center gap-1">
          <a
            href="#product"
            className="text-muted hover:bg-foreground/8 hover:text-foreground hidden rounded-full px-3.5 py-2 text-sm transition-colors sm:block"
          >
            Product
          </a>
          <a
            href="#trust-engine"
            className="text-muted hover:bg-foreground/8 hover:text-foreground hidden rounded-full px-3.5 py-2 text-sm transition-colors sm:block"
          >
            Trust engine
          </a>
          <a
            href="#how-it-works"
            className="text-muted hover:bg-foreground/8 hover:text-foreground hidden rounded-full px-3.5 py-2 text-sm transition-colors sm:block"
          >
            Docs
          </a>
        </nav>
        <div className="ml-auto flex items-center gap-4">
          <Link href="/graph" className="text-brand-muted hidden text-sm font-medium sm:block">
            Open the demo
          </Link>
          <a href={mailtoHref()}>
            <Button size="sm">Get in touch</Button>
          </a>
        </div>
      </div>
    </header>
  );
}

function GuardrailWidget() {
  const steps = ["Status active", "Not expired", "Category data authorized"];
  return (
    <motion.div custom={4} variants={fade} initial="hidden" animate="show" className="relative">
      <div className="bg-brand/[0.16] absolute -top-8 -left-8 size-32 rounded-full" />
      <div className="border-border/70 absolute -right-9 -bottom-8 size-24 rounded-full border" />
      <div className="bg-surface relative overflow-hidden rounded-lg p-6 shadow-2xl">
        <div className="relative flex items-center justify-between gap-2">
          <span className="text-muted text-[11px] tracking-wider uppercase">
            Authorization check
          </span>
          <span className="text-muted flex items-center gap-1.5 text-[11.5px]">
            <span
              className="bg-brand-muted size-1.5 rounded-full"
              style={{ animation: "blink 1.6s ease-in-out infinite" }}
            />
            live
          </span>
        </div>
        <p className="relative mt-4.5 text-[17px] font-bold">Probe wants to pay $8.00</p>
        <p className="text-muted relative mt-0.5 text-[12.5px]">
          category: data · per-transaction cap $2
        </p>
        <div className="relative mt-5 flex flex-col gap-1.5">
          {steps.map((s, i) => (
            <motion.div
              key={s}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.15, duration: 0.4 }}
              className="bg-background flex items-center gap-2.5 rounded-[10px] px-3.5 py-2 text-[13.5px]"
            >
              <Check className="text-success size-3.5 shrink-0" strokeWidth={2.75} />
              <span className="flex-1">{s}</span>
            </motion.div>
          ))}
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.75, duration: 0.4 }}
            className="bg-danger/20 flex items-center gap-2.5 rounded-[10px] px-3.5 py-2 text-[13.5px]"
          >
            <X className="text-danger size-3.5 shrink-0" strokeWidth={2.75} />
            <span className="text-danger flex-1">$8 exceeds the $2 limit</span>
          </motion.div>
        </div>
        <motion.div
          initial={{ opacity: 0, scale: 1.2 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.05, duration: 0.4 }}
          className="bg-danger/25 relative mt-4 flex items-center justify-between gap-3 rounded-xl px-4.5 py-3"
        >
          <div>
            <p className="text-danger text-[18px] font-semibold">Blocked by guardrail</p>
            <p className="text-danger/80 mt-0.5 text-xs">No value left the wallet.</p>
          </div>
          <span className="bg-danger/30 text-danger rounded-full px-2.5 py-1 text-[13px] font-bold">
            Trust −4
          </span>
        </motion.div>
      </div>
    </motion.div>
  );
}

function Hero() {
  return (
    <section id="product" className="mx-auto max-w-6xl px-4 pt-16 pb-20 sm:pt-20">
      <div className="grid items-center gap-14 lg:grid-cols-[1fr_440px]">
        <div>
          <motion.div custom={0} variants={fade} initial="hidden" animate="show">
            <Badge variant="brand" className="mb-6">
              Startup in the making
            </Badge>
          </motion.div>
          <motion.h1
            custom={1}
            variants={fade}
            initial="hidden"
            animate="show"
            className="max-w-lg text-5xl font-bold tracking-tight text-balance sm:text-6xl"
          >
            Give AI agents money. Keep the keys.
          </motion.h1>
          <motion.p
            custom={2}
            variants={fade}
            initial="hidden"
            animate="show"
            className="text-muted mt-6 max-w-md text-lg text-balance"
          >
            Scoped budgets, enforced before a payment moves — and a trust score that decides what
            each worker earns next.
          </motion.p>
          <motion.div
            custom={3}
            variants={fade}
            initial="hidden"
            animate="show"
            className="mt-9 flex flex-wrap items-center gap-3"
          >
            <a href={mailtoHref()}>
              <Button size="lg">
                Get in touch <ArrowRight className="size-4" />
              </Button>
            </a>
            <Link href="/graph">
              <Button size="lg" variant="secondary">
                Explore the demo
              </Button>
            </Link>
          </motion.div>
        </div>
        <GuardrailWidget />
      </div>
    </section>
  );
}

function Ticker() {
  const row = (key: string) => (
    <div key={key} className="flex gap-11 pr-11 text-[12.5px] whitespace-nowrap">
      {TICKER.map((t, i) => (
        <span key={i} className="text-muted">
          <strong className={t.kind === "blocked" ? "text-danger" : "text-brand-muted"}>
            {t.kind}
          </strong>{" "}
          {t.text}
        </span>
      ))}
    </div>
  );
  return (
    <div className="border-border/60 bg-surface overflow-hidden border-y py-3.5">
      <div className="flex w-max" style={{ animation: "marquee 38s linear infinite" }}>
        {row("a")}
        {row("b")}
      </div>
    </div>
  );
}

function ControlPlane() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-20 sm:py-24">
      <h2 className="max-w-xl text-3xl font-bold tracking-tight sm:text-4xl">
        A control plane, not a key.
      </h2>
      <div className="mt-10 grid gap-5 sm:grid-cols-3">
        {TILES.map((tile, i) => (
          <motion.div
            key={tile.title}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ delay: i * 0.08, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="border-border bg-surface flex min-h-[232px] flex-col gap-4 rounded-lg border p-7 transition-transform hover:-translate-y-1"
          >
            <span className="text-brand-muted font-mono text-[10px] tracking-[0.12em] uppercase">
              {tile.kicker}
            </span>
            <div className="text-[22px] font-semibold">{tile.title}</div>
            {tile.body}
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
          the same number.
        </p>

        <div className="mt-12 grid items-center gap-10 lg:grid-cols-[268px_40px_1fr]">
          <div className="flex flex-col gap-2">
            {TRUST_FEED.map((f, i) => (
              <motion.div
                key={f.label}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05, duration: 0.4 }}
                className="bg-background flex items-center gap-2.5 rounded-[10px] px-4 py-2.5 text-[13px]"
              >
                <span
                  className={`size-2 shrink-0 rounded-full ${
                    f.delta === null
                      ? "bg-brand"
                      : f.delta.startsWith("+")
                        ? "bg-brand-muted"
                        : "bg-danger"
                  }`}
                />
                <span className="flex-1">{f.label}</span>
                {f.delta && (
                  <span
                    className={`text-xs font-bold ${
                      f.delta.startsWith("+") ? "text-brand-muted" : "text-danger"
                    }`}
                  >
                    {f.delta}
                  </span>
                )}
              </motion.div>
            ))}
          </div>

          <ArrowRight className="text-muted/40 mx-auto hidden size-6 lg:block" />

          <div className="flex flex-wrap items-center gap-10">
            <TrustScoreRing score={96} grade="AAA" size={200} />
            <div className="flex flex-col gap-4">
              {TRUST_FACTORS.map((f) => (
                <div key={f.label} className="flex items-center gap-3">
                  <span className="w-14 text-xl font-semibold">{f.pct}</span>
                  <span className="text-[15px]">{f.label}</span>
                </div>
              ))}
            </div>
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
        <div className="border-border/60 absolute top-6.5 right-6.5 left-6.5 h-px border-t" />
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
    <section className="border-border/60 border-y bg-neutral-900/40 px-4 py-20 sm:py-24">
      <div className="mx-auto max-w-6xl">
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
            <Link href="/graph">
              <Button>
                Open the graph <ArrowRight className="size-4" />
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="secondary">Operations</Button>
            </Link>
          </div>
        </div>

        <div className="border-border bg-background mt-12 rounded-lg border p-6 shadow-2xl">
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
          className="relative flex min-w-0 gap-2.5 sm:min-w-[380px]"
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
          <Button type="submit" className="shrink-0">
            Request access
          </Button>
        </form>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-border/60 border-t px-4 py-12">
      <div className="mx-auto max-w-6xl">
        <div className="border-border/60 grid gap-10 border-b pb-8 sm:grid-cols-[2fr_1fr_1fr_1fr]">
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
                  className="text-muted hover:text-brand-muted text-[13.5px]"
                >
                  {l.label}
                </Link>
              ))}
            </div>
          ))}
        </div>
        <div className="text-muted flex flex-wrap items-center justify-between gap-3 pt-5 text-[12.5px]">
          <span>© 2026 {BRAND.name}. Startup in the making.</span>
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
    <div className="flex min-h-full flex-col">
      <LandingHeader />
      <main className="flex-1">
        <Hero />
        <Ticker />
        <ControlPlane />
        <TrustEngine />
        <HowItWorks />
        <CompanyInMotion />
        <CallToAction />
      </main>
      <Footer />
    </div>
  );
}
