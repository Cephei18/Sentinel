import { NextResponse } from "next/server";
import { clusterLabel, activeCluster } from "@/lib/solana";

/** Liveness probe + environment sanity (no secrets leaked). */
export async function GET() {
  return NextResponse.json({
    status: "ok",
    chain: clusterLabel,
    cluster: activeCluster,
    providers: {
      privy: Boolean(process.env.NEXT_PUBLIC_PRIVY_APP_ID),
      openai: Boolean(process.env.OPENAI_API_KEY),
      anthropic: Boolean(process.env.ANTHROPIC_API_KEY),
      agentWallet: Boolean(process.env.AGENT_PRIVATE_KEY),
      x402Gate: Boolean(process.env.X402_PAY_TO_ADDRESS),
    },
    time: new Date().toISOString(),
  });
}
