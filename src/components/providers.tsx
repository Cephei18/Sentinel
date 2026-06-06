"use client";

import { useEffect, useState, type ReactNode } from "react";
import { PrivyProvider } from "@privy-io/react-auth";
import { WagmiProvider } from "@privy-io/wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { base, baseSepolia } from "viem/chains";
import { wagmiConfig } from "@/lib/wagmi";
import { activeChain } from "@/lib/chains";
import { clientEnv } from "@/lib/env";

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
  useEffect(() => setMounted(true), []);

  const appId = clientEnv.NEXT_PUBLIC_PRIVY_APP_ID;
  const hasPrivy = Boolean(appId && appId.length >= 10);

  // SSR / prerender: render nothing heavy so Privy never instantiates.
  if (!mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="size-6 animate-spin rounded-full border-2 border-border border-t-brand" />
      </div>
    );
  }

  // Running without credentials: show a friendly setup notice instead of crashing.
  if (!hasPrivy) {
    return <SetupNotice />;
  }

  return (
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
        <WagmiProvider config={wagmiConfig}>{children}</WagmiProvider>
      </QueryClientProvider>
    </PrivyProvider>
  );
}

/** Shown when NEXT_PUBLIC_PRIVY_APP_ID is missing — clear next step, no crash. */
function SetupNotice() {
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="max-w-md space-y-4 rounded-[var(--radius)] border border-border bg-surface p-6 text-center">
        <div className="mx-auto grid size-10 place-items-center rounded-lg bg-brand text-white">B</div>
        <h1 className="text-lg font-semibold">One step to go</h1>
        <p className="text-sm text-muted">
          Add your Privy App ID to <code className="text-foreground">.env.local</code> to enable
          wallet login, then restart the dev server.
        </p>
        <pre className="rounded-md border border-border bg-surface-2 p-3 text-left text-xs text-muted">
          NEXT_PUBLIC_PRIVY_APP_ID=your_app_id
        </pre>
        <a
          href="https://dashboard.privy.io"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block text-sm text-brand-muted hover:underline"
        >
          Get one at dashboard.privy.io →
        </a>
      </div>
    </div>
  );
}
