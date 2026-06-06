/**
 * Deterministic-ish mock data for demos and empty states.
 * No randomness at module scope — generate on call so SSR/CSR agree.
 */

export type Product = {
  id: string;
  name: string;
  description: string;
  priceUsdc: string;
  emoji: string;
};

export const DEMO_PRODUCTS: Product[] = [
  { id: "api-call", name: "Premium API Call", description: "One x402-gated data request", priceUsdc: "0.01", emoji: "⚡" },
  { id: "report", name: "Market Report", description: "AI-generated onchain analytics", priceUsdc: "2.50", emoji: "📊" },
  { id: "compute", name: "Agent Compute Credit", description: "1 hour of autonomous agent runtime", priceUsdc: "5.00", emoji: "🤖" },
  { id: "pro", name: "Pro Membership", description: "30 days, unlimited agent actions", priceUsdc: "25.00", emoji: "💎" },
];

export type Activity = {
  id: string;
  kind: "payment" | "x402" | "agent";
  label: string;
  amountUsdc: string;
  ago: string;
};

export const DEMO_ACTIVITY: Activity[] = [
  { id: "1", kind: "x402", label: "Agent paid for premium data", amountUsdc: "0.01", ago: "2s ago" },
  { id: "2", kind: "payment", label: "USDC checkout — Market Report", amountUsdc: "2.50", ago: "1m ago" },
  { id: "3", kind: "agent", label: "Agent prepared transfer", amountUsdc: "1.00", ago: "3m ago" },
  { id: "4", kind: "x402", label: "Agent paid for compute", amountUsdc: "5.00", ago: "12m ago" },
];

/** Generate N synthetic activity rows for stress-testing UI lists. */
export function makeActivity(n: number): Activity[] {
  const kinds: Activity["kind"][] = ["payment", "x402", "agent"];
  return Array.from({ length: n }, (_, i) => ({
    id: `gen-${i}`,
    kind: kinds[i % kinds.length],
    label: `Synthetic ${kinds[i % kinds.length]} event #${i + 1}`,
    amountUsdc: ((i % 9) + 0.25).toFixed(2),
    ago: `${i + 1}m ago`,
  }));
}
