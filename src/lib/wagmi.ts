import { createConfig } from "@privy-io/wagmi";
import { http } from "wagmi";
import { base, baseSepolia } from "viem/chains";
import { FALLBACK_RPC } from "./constants";

/**
 * wagmi config wired through Privy. Connectors are managed by Privy
 * (embedded + external wallets), so we only declare chains + transports.
 * Both chains are registered; `defaultChain` is chosen in <Providers />.
 */
export const wagmiConfig = createConfig({
  chains: [baseSepolia, base],
  transports: {
    [base.id]: http(process.env.NEXT_PUBLIC_BASE_RPC_URL || FALLBACK_RPC[base.id]),
    [baseSepolia.id]: http(
      process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL || FALLBACK_RPC[baseSepolia.id],
    ),
  },
});

declare module "wagmi" {
  interface Register {
    config: typeof wagmiConfig;
  }
}
