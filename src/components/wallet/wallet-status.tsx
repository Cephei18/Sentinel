"use client";

import { ArrowUpRight, Copy } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useWallet } from "@/hooks/use-wallet";
import { useUsdcBalance } from "@/hooks/use-usdc-balance";
import { useIsDemoMode, DemoPlaceholder } from "@/components/demo-mode";
import { copyToClipboard, truncateAddress } from "@/lib/utils";
import { chainLabel } from "@/lib/chains";
import { explorerAddress } from "@/lib/tx";

/** Live account panel: address, network, and streaming USDC balance. */
export function WalletStatus() {
  if (useIsDemoMode()) {
    return (
      <DemoPlaceholder
        title="Wallet · demo mode"
        body="Wallet and balances are disabled in demo mode. Workforce, trust, and governance are fully live."
      />
    );
  }
  return <WalletStatusLive />;
}

function WalletStatusLive() {
  const { address, isConnected } = useWallet();
  const { formatted, isLoading } = useUsdcBalance(address);

  if (!isConnected || !address) {
    return (
      <Card>
        <CardContent className="text-muted py-8 text-center text-sm">
          Connect a wallet to see your balance.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>Wallet</CardTitle>
        <Badge variant="brand">{chainLabel}</Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-muted text-xs">Address</p>
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm">{truncateAddress(address, 6)}</span>
            <button
              onClick={async () => {
                if (await copyToClipboard(address)) toast.success("Address copied");
              }}
              className="text-muted hover:text-foreground"
              aria-label="Copy address"
            >
              <Copy className="size-3.5" />
            </button>
            <a
              href={explorerAddress(address)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted hover:text-foreground"
              aria-label="View on explorer"
            >
              <ArrowUpRight className="size-3.5" />
            </a>
          </div>
        </div>
        <div>
          <p className="text-muted text-xs">USDC Balance</p>
          <p className="text-2xl font-semibold tabular-nums">
            {isLoading
              ? "—"
              : Number(formatted).toLocaleString(undefined, { maximumFractionDigits: 2 })}
            <span className="text-muted ml-1 text-sm font-normal">USDC</span>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
