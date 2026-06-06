"use client";

import { ArrowUpRight, Copy } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useWallet } from "@/hooks/use-wallet";
import { useUsdcBalance } from "@/hooks/use-usdc-balance";
import { copyToClipboard, truncateAddress } from "@/lib/utils";
import { chainLabel } from "@/lib/chains";
import { explorerAddress } from "@/lib/tx";

/** Live account panel: address, network, and streaming USDC balance. */
export function WalletStatus() {
  const { address, isConnected } = useWallet();
  const { formatted, isLoading } = useUsdcBalance(address);

  if (!isConnected || !address) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted">
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
          <p className="text-xs text-muted">Address</p>
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
          <p className="text-xs text-muted">USDC Balance</p>
          <p className="text-2xl font-semibold tabular-nums">
            {isLoading ? "—" : Number(formatted).toLocaleString(undefined, { maximumFractionDigits: 2 })}
            <span className="ml-1 text-sm font-normal text-muted">USDC</span>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
