"use client";

import { useEffect, useState, type ReactNode } from "react";
import { PrivyProvider } from "@privy-io/react-auth";
import { WagmiProvider } from "@privy-io/wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { base, baseSepolia } from "viem/chains";
import { wagmiConfig } from "@/lib/wagmi";
import { activeChain } from "@/lib/chains";
import { clientEnv } from "@/lib/env";
import { AgentsProvider } from "@/components/agents/agents-provider";
import { DemoModeProvider } from "@/components/demo-mode";

/**
 * Provider stack — ORDER MATTERS.
 *   PrivyProvider (auth + embedded wallets)
 *     └─ QueryClientProvider (wagmi's async cache)
 *         └─ WagmiProvider from @privy-io/wagmi (bridges Privy wallets → wagmi)
 *
 * Privy is the single wallet layer: email/social login mints an embedded
 * wallet, and external wallets connect through the same provider.
 *
 * Mounted client-side only: Privy can't initialize during SSR/prerender
 * (it throws on a missing/invalid app id) and gating on mount also avoids
 * wallet hydration mismatches.
 */
export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  const [mounted, setMounted] = useState(false);
  // Deliberate client-only gate: Privy throws if it initializes during SSR/
  // prerender, so we render nothing heavy until after mount. This is the one
  // place a mount-flag setState in an effect is intended.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), []);

  const appId = clientEnv.NEXT_PUBLIC_PRIVY_APP_ID;
  const hasPrivy = Boolean(appId && appId.length >= 10);

  // SSR / prerender: render nothing heavy so Privy never instantiates.
  if (!mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="border-border border-t-brand size-6 animate-spin rounded-full border-2" />
      </div>
    );
  }

  // No Privy credentials (or we want a wallet-free run): boot straight into
  // DEMO MODE. The full workforce experience renders; only wallet/on-chain
  // widgets degrade to placeholders. Keeps the live demo bulletproof.
  if (!hasPrivy) {
    return (
      <DemoModeProvider value={true}>
        <QueryClientProvider client={queryClient}>
          <AgentsProvider>{children}</AgentsProvider>
        </QueryClientProvider>
      </DemoModeProvider>
    );
  }

  return (
    <DemoModeProvider value={false}>
      <PrivyProvider
        appId={appId}
        config={{
          // Spin up an embedded wallet automatically for users without one.
          embeddedWallets: { ethereum: { createOnLogin: "users-without-wallets" } },
          loginMethods: ["email", "wallet", "google"],
          defaultChain: activeChain,
          supportedChains: [baseSepolia, base],
          appearance: {
            theme: "dark",
            accentColor: "#0052FF", // Base brand blue
            walletChainType: "ethereum-only",
          },
        }}
      >
        <QueryClientProvider client={queryClient}>
          <WagmiProvider config={wagmiConfig}>
            <AgentsProvider>{children}</AgentsProvider>
          </WagmiProvider>
        </QueryClientProvider>
      </PrivyProvider>
    </DemoModeProvider>
  );
}
