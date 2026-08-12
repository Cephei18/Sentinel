"use client";

import { LogOut, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useWallet } from "@/hooks/use-wallet";
import { useIsDemoMode } from "@/components/demo-mode";
import { truncateAddress } from "@/lib/utils";
import { clusterLabel } from "@/lib/solana";

/** Drop-in wallet connect / account button powered by Privy's Solana wallets. */
export function ConnectButton() {
  // In demo mode there's no wallet stack mounted — render a calm badge instead
  // of calling wallet hooks (which would have no provider).
  if (useIsDemoMode()) {
    return <Badge variant="neutral">Demo mode</Badge>;
  }
  return <ConnectButtonLive />;
}

function ConnectButtonLive() {
  const { ready, authenticated, address, login, logout } = useWallet();

  if (!ready) {
    return (
      <Button variant="secondary" size="sm" loading>
        Loading
      </Button>
    );
  }

  if (!authenticated) {
    return (
      <Button size="sm" onClick={login}>
        <Wallet className="size-4" />
        Connect Wallet
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Badge variant="brand">{clusterLabel}</Badge>
      <Badge variant="neutral" className="font-mono">
        {truncateAddress(address)}
      </Badge>
      <Button size="sm" variant="ghost" onClick={logout} aria-label="Disconnect">
        <LogOut className="size-4" />
      </Button>
    </div>
  );
}
