import { Navbar } from "@/components/layout/navbar";
import { WalletStatus } from "@/components/wallet/wallet-status";
import { UsdcPayment } from "@/components/payment/usdc-payment";
import { AgentChat } from "@/components/agent/agent-chat";
import { X402Demo } from "@/components/x402/x402-demo";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DEMO_ACTIVITY } from "@/lib/mock";
import { formatUsd } from "@/lib/utils";

const STATS = [
  { label: "Total volume", value: formatUsd(48230) },
  { label: "Payments", value: "1,284" },
  { label: "Agent actions", value: "372" },
  { label: "Avg settle", value: "1.9s" },
];

export default function DashboardPage() {
  return (
    <div className="flex min-h-full flex-col">
      <Navbar />
      <main className="mx-auto w-full max-w-6xl flex-1 space-y-6 px-4 py-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Commerce Dashboard</h1>
          <p className="text-sm text-muted">Payments, agents, and x402 — all on Base.</p>
        </div>

        {/* Stat row */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {STATS.map((s) => (
            <Card key={s.label}>
              <CardContent className="p-5">
                <p className="text-xs text-muted">{s.label}</p>
                <p className="mt-1 text-2xl font-semibold tabular-nums">{s.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6">
            <WalletStatus />
            <UsdcPayment label="Send USDC" description="Transfer USDC to any address on Base." />
          </div>

          <div className="space-y-6">
            <X402Demo />
            <Card>
              <CardContent className="space-y-3 p-5">
                <p className="text-sm font-medium">Recent activity</p>
                <ul className="space-y-2.5">
                  {DEMO_ACTIVITY.map((a) => (
                    <li key={a.id} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={a.kind === "x402" ? "brand" : a.kind === "agent" ? "warning" : "neutral"}
                        >
                          {a.kind}
                        </Badge>
                        <span className="text-muted">{a.label}</span>
                      </div>
                      <span className="tabular-nums">{a.amountUsdc} USDC</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          <div>
            <AgentChat />
          </div>
        </div>
      </main>
    </div>
  );
}
