"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { ArrowRight, Check, Mail, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrustGraph } from "@/components/agents/trust-graph";
import { BRAND } from "@/lib/brand";

const CONTACT_EMAIL = "gopikachauhan1819@gmail.com";
const MAILTO_HREF = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(
  "Interested in Sentinel",
)}&body=${encodeURIComponent(
  "Hi,\n\nTell us a bit about the agents you're running and what you'd want governed.\n\n",
)}`;

const NOT_US = [
  "A wallet gives an agent a signing key. It has no idea what that agent is allowed to spend.",
  "An observability tool tells you what already happened. It cannot stop a payment before it moves.",
];

const LEGEND = [
  { className: "bg-success", label: "Autonomous" },
  { className: "bg-brand-muted", label: "Trusted" },
  { className: "bg-warning", label: "Supervised" },
  { className: "bg-danger", label: "At risk" },
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
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <span className="bg-brand text-brand-foreground grid size-7 place-items-center rounded-lg text-sm">
            {BRAND.glyph}
          </span>
          {BRAND.name}
        </Link>
        <nav className="flex items-center gap-6">
          <a href="#demo" className="text-muted hover:text-foreground hidden text-sm sm:block">
            How it works
          </a>
          <a href="#contact" className="text-muted hover:text-foreground hidden text-sm sm:block">
            Contact
          </a>
          <a href="#contact">
            <Button size="sm">Get in touch</Button>
          </a>
        </nav>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="mx-auto max-w-5xl px-4 pt-20 pb-16 sm:pt-28 sm:pb-24">
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
        className="max-w-3xl text-4xl font-bold tracking-tight text-balance sm:text-6xl"
      >
        Governance infrastructure for AI agents that spend money.
      </motion.h1>
      <motion.p
        custom={2}
        variants={fade}
        initial="hidden"
        animate="show"
        className="text-muted mt-5 max-w-xl text-balance sm:text-lg"
      >
        Give every agent a scoped budget, enforce it before a payment moves, and let a trust score
        decide how much autonomy it earns. Built for teams already running agents that spend real
        money, settled in USDC on Solana.
      </motion.p>
      <motion.div
        custom={3}
        variants={fade}
        initial="hidden"
        animate="show"
        className="mt-8 flex flex-wrap items-center gap-3"
      >
        <a href="#contact">
          <Button size="lg">
            Get in touch <ArrowRight className="size-4" />
          </Button>
        </a>
        <a href="#demo">
          <Button size="lg" variant="outline">
            See how it works
          </Button>
        </a>
      </motion.div>
      <motion.p
        custom={4}
        variants={fade}
        initial="hidden"
        animate="show"
        className="text-muted mt-10 max-w-lg text-sm"
      >
        74% of companies plan to run agentic AI. Only 21% have any governance in place for it.
        <span className="text-muted/70"> (Deloitte)</span>
      </motion.p>
    </section>
  );
}

function WhyUs() {
  return (
    <section className="border-border/60 border-t px-4 py-16 sm:py-20">
      <div className="mx-auto max-w-3xl">
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Today, the plan is: hand an agent a key, and hope.
        </h2>
        <div className="mt-8 space-y-4">
          {NOT_US.map((line) => (
            <div key={line} className="flex items-start gap-3">
              <X className="text-danger mt-0.5 size-4 shrink-0" />
              <p className="text-muted">{line}</p>
            </div>
          ))}
          <div className="flex items-start gap-3">
            <Check className="text-brand mt-0.5 size-4 shrink-0" />
            <p className="text-foreground">
              Sentinel checks every payment against a scoped budget before it moves, and turns
              behavior into an explainable trust score that decides what an agent earns next.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function DemoPreview() {
  return (
    <section id="demo" className="border-border/60 border-t px-4 py-16 sm:py-20">
      <div className="mx-auto max-w-4xl">
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
          This is your AI workforce, live.
        </h2>
        <p className="text-muted mt-3 max-w-xl">
          A real, working view of how Sentinel governs a team of AI agents: trust scores, spend, and
          the autonomous payments moving between them.
        </p>

        <div className="border-border bg-surface mt-8 overflow-hidden rounded-2xl border shadow-2xl">
          <div className="border-border/60 bg-surface-2 flex h-10 items-center gap-2 border-b px-4">
            <span className="bg-danger/60 size-2.5 rounded-full" />
            <span className="bg-warning/60 size-2.5 rounded-full" />
            <span className="bg-brand/60 size-2.5 rounded-full" />
            <span className="text-muted ml-2 text-xs font-medium">Organization graph</span>
          </div>
          <div className="p-4 sm:p-6">
            <TrustGraph />
            <div className="border-border/60 mt-2 flex flex-wrap gap-x-5 gap-y-2 border-t pt-4">
              {LEGEND.map((l) => (
                <span key={l.label} className="text-muted flex items-center gap-2 text-xs">
                  <span className={`size-2.5 rounded-full ${l.className}`} />
                  {l.label}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/graph">
            <Button size="lg">
              Explore the live graph <ArrowRight className="size-4" />
            </Button>
          </Link>
          <Link href="/dashboard">
            <Button size="lg" variant="outline">
              Open the dashboard
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}

function Contact() {
  return (
    <section id="contact" className="border-border/60 border-t px-4 py-16 sm:py-24">
      <div className="mx-auto max-w-xl text-center">
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Want to try this with your own agents?
        </h2>
        <p className="text-muted mt-3">
          We&apos;re onboarding a small number of early teams by hand. Tell us what your agents do
          and we&apos;ll get back to you personally.
        </p>
        <div className="mt-8 flex flex-col items-center gap-3">
          <a href={MAILTO_HREF}>
            <Button size="lg">
              <Mail className="size-4" /> Email us
            </Button>
          </a>
          <a href={MAILTO_HREF} className="text-muted hover:text-foreground font-mono text-sm">
            {CONTACT_EMAIL}
          </a>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-border/60 border-t px-4 py-8">
      <div className="text-muted mx-auto flex max-w-5xl flex-col items-center justify-between gap-3 text-sm sm:flex-row">
        <div className="flex items-center gap-2">
          <Badge variant="neutral">Startup in the making</Badge>
          <span>{BRAND.name}. Governance infrastructure for autonomous AI agents.</span>
        </div>
        <Link href="/graph" className="hover:text-foreground">
          Open the live graph
        </Link>
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
        <WhyUs />
        <DemoPreview />
        <Contact />
      </main>
      <Footer />
    </div>
  );
}
