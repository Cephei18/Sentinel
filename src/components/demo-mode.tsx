"use client";

import { createContext, useContext, type ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";

/**
 * Demo mode — true when the app runs without a Privy app id (or Privy can't
 * load). The entire workforce experience (graph, trust, governance, delegation)
 * is client-side and works offline; only wallet/on-chain widgets degrade to
 * clean placeholders. This is what makes the live demo bulletproof against bad
 * wifi, a failed wallet, or a missing key.
 */
const DemoModeContext = createContext(false);

export function DemoModeProvider({ value, children }: { value: boolean; children: ReactNode }) {
  return <DemoModeContext.Provider value={value}>{children}</DemoModeContext.Provider>;
}

export function useIsDemoMode(): boolean {
  return useContext(DemoModeContext);
}

/** Calm placeholder shown in place of a wallet/on-chain widget during demo mode. */
export function DemoPlaceholder({ title, body }: { title: string; body: string }) {
  return (
    <Card>
      <CardContent className="space-y-1 py-7 text-center">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-muted mx-auto max-w-xs text-xs">{body}</p>
      </CardContent>
    </Card>
  );
}
