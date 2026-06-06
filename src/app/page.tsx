import Link from "next/link";
import { ArrowRight, Bot, ShieldCheck, Wallet, Zap } from "lucide-react";
import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { chainLabel } from "@/lib/chains";

const FEATURES = [
  { icon: Wallet, title: "Privy Auth + Wallets", body: "Email, social, and external wallets with embedded wallet fallback — one provider." },
  { icon: Zap, title: "x402 Payments", body: "HTTP-native USDC micropayments. Agents pay APIs autonomously on 402." },
  { icon: Bot, title: "AI Commerce Agent", body: "Streaming, tool-calling agent that quotes, prepares, and verifies payments." },
  { icon: ShieldCheck, title: "Onchain Verification", body: "Server-side USDC transfer verification before granting access." },
];

export default function Home() {
  return (
    <div className="flex min-h-full flex-col">
      <Navbar />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4">
        {/* Hero */}
        <section className="flex flex-col items-center py-20 text-center sm:py-28">
          <Badge variant="brand" className="mb-5">
            Base · Privy · x402 — live on {chainLabel}
          </Badge>
          <h1 className="max-w-3xl text-balance text-4xl font-bold tracking-tight sm:text-6xl">
            Agentic commerce on Base, ready to ship.
          </h1>
          <p className="mt-5 max-w-xl text-balance text-muted sm:text-lg">
            A production-grade starter for USDC payments, wallet auth, and AI agents that
            pay for things — so you spend the hackathon building, not configuring.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link href="/dashboard">
              <Button size="lg">
                Open Dashboard <ArrowRight className="size-4" />
              </Button>
            </Link>
            <a href="https://docs.base.org" target="_blank" rel="noopener noreferrer">
              <Button size="lg" variant="outline">
                Base Docs
              </Button>
            </a>
          </div>
        </section>

        {/* Features */}
        <section className="grid gap-4 pb-24 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <Card key={f.title}>
              <CardContent className="space-y-3 p-6">
                <div className="grid size-10 place-items-center rounded-xl bg-brand/15 text-brand-muted">
                  <f.icon className="size-5" />
                </div>
                <h3 className="font-semibold">{f.title}</h3>
                <p className="text-sm text-muted">{f.body}</p>
              </CardContent>
            </Card>
          ))}
        </section>
      </main>

      <footer className="border-t border-border/60 py-6 text-center text-sm text-muted">
        Built for the Base + Privy hackathon · {chainLabel}
      </footer>
    </div>
  );
}
