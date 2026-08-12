import { Navbar } from "@/components/layout/navbar";
import { WalletStatus } from "@/components/wallet/wallet-status";
import { UsdcPayment } from "@/components/payment/usdc-payment";
import { AgentChat } from "@/components/agent/agent-chat";
import { X402Demo } from "@/components/x402/x402-demo";
import { ControlStats } from "@/components/agents/control-stats";
import { AgentRoster } from "@/components/agents/agent-roster";
import { WorkforceRankings } from "@/components/agents/workforce-rankings";
import { GlobalActivity } from "@/components/agents/global-activity";
import { DemoReset } from "@/components/agents/demo-reset";

export default function DashboardPage() {
  return (
    <div className="flex min-h-full flex-col">
      <Navbar />
      <main className="mx-auto w-full max-w-6xl flex-1 space-y-6 px-4 py-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Operations</h1>
            <p className="text-muted text-sm">
              Your autonomous AI workforce — budgets, behaviour, and trust at a glance.
            </p>
          </div>
          <DemoReset />
        </div>

        <ControlStats />

        {/* Workforce + intelligence */}
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <AgentRoster />
          </div>
          <div className="space-y-6">
            <WorkforceRankings />
            <WalletStatus />
          </div>
        </div>

        {/* Operations log + live rails */}
        <div className="grid gap-6 lg:grid-cols-3">
          <GlobalActivity limit={8} />
          <X402Demo />
          <UsdcPayment label="Send USDC" description="Transfer USDC to any address on Solana." />
        </div>

        {/* The commerce agent */}
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Talk to the workforce</h2>
          <p className="text-muted mb-4 text-sm">
            A tool-calling agent on the same x402 rails your workers run on.
          </p>
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-3">
              <AgentChat />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
