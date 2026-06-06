"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { ArrowRight, Activity, Gauge, ShieldCheck } from "lucide-react";
import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { chainLabel } from "@/lib/chains";
import { BRAND } from "@/lib/brand";

const PILLARS = [
  {
    icon: ShieldCheck,
    title: "Hire & authorize",
    body: "Bring on AI workers with a scoped budget, a per-transaction ceiling, an expiry, and the categories they may spend on. Pause or revoke in one click.",
  },
  {
    icon: Activity,
    title: "Govern spend",
    body: "Every autonomous payment is a first-class event — settled on-chain via x402, streamed to a live operations log with verifiable proof.",
  },
  {
    icon: Gauge,
    title: "Allocate by trust",
    body: "Behaviour becomes an economic trust score that governs autonomy and capital — reliable workers earn larger budgets and the right to hire others.",
  },
];

const STEPS = [
  "Hire AI workers with scoped budgets",
  "They transact and collaborate via x402",
  "Trust decides who earns more autonomy",
];

const fade = {
  hidden: { opacity: 0, y: 16 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: [0.16, 1, 0.3, 1] as const },
  }),
};

export default function Home() {
  return (
    <div className="flex min-h-full flex-col">
      <Navbar />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4">
        {/* Hero */}
        <section className="flex flex-col items-center py-20 text-center sm:py-28">
          <motion.div custom={0} variants={fade} initial="hidden" animate="show">
            <Badge variant="brand" className="mb-5">
              Base · Privy · x402 — live on {chainLabel}
            </Badge>
          </motion.div>
          <motion.h1
            custom={1}
            variants={fade}
            initial="hidden"
            animate="show"
            className="max-w-3xl text-4xl font-bold tracking-tight text-balance sm:text-6xl"
          >
            The operating system for AI-native companies.
          </motion.h1>
          <motion.p
            custom={2}
            variants={fade}
            initial="hidden"
            animate="show"
            className="text-muted mt-5 max-w-xl text-balance sm:text-lg"
          >
            Tomorrow&apos;s companies run on fleets of autonomous AI workers that spend, hire, and
            coordinate on their own. {BRAND.name} is how a founder allocates budgets, governs that
            spending, and lets trust decide which workers earn more autonomy.
          </motion.p>
          <motion.div
            custom={3}
            variants={fade}
            initial="hidden"
            animate="show"
            className="mt-8 flex flex-wrap items-center justify-center gap-3"
          >
            <Link href="/graph">
              <Button size="lg">
                Enter the network <ArrowRight className="size-4" />
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button size="lg" variant="outline">
                Open control room
              </Button>
            </Link>
          </motion.div>

          {/* How it works — one line narrative */}
          <motion.div
            custom={4}
            variants={fade}
            initial="hidden"
            animate="show"
            className="text-muted mt-12 flex flex-col items-center gap-2 text-sm sm:flex-row sm:gap-3"
          >
            {STEPS.map((step, i) => (
              <span key={step} className="flex items-center gap-2 sm:gap-3">
                <span className="flex items-center gap-2">
                  <span className="border-border bg-surface-2 text-foreground grid size-5 place-items-center rounded-full border text-[11px] font-medium">
                    {i + 1}
                  </span>
                  {step}
                </span>
                {i < STEPS.length - 1 && (
                  <ArrowRight className="text-border hidden size-3.5 sm:block" />
                )}
              </span>
            ))}
          </motion.div>
        </section>

        {/* Pillars */}
        <section className="grid gap-4 pb-24 sm:grid-cols-3">
          {PILLARS.map((p, i) => (
            <motion.div
              key={p.title}
              custom={i + 5}
              variants={fade}
              initial="hidden"
              animate="show"
            >
              <Card className="h-full">
                <CardContent className="space-y-3 p-6">
                  <div className="bg-brand/15 text-brand-muted grid size-10 place-items-center rounded-xl">
                    <p.icon className="size-5" />
                  </div>
                  <h3 className="font-semibold">{p.title}</h3>
                  <p className="text-muted text-sm">{p.body}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </section>
      </main>

      <footer className="border-border/60 text-muted border-t py-6 text-center text-sm">
        {BRAND.name} · Built for the Base + Privy hackathon · {chainLabel}
      </footer>
    </div>
  );
}
