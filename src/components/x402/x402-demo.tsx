"use client";

import { useState } from "react";
import { Zap, ExternalLink } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { explorerTx } from "@/lib/tx";

type BuyResult = {
  ok: boolean;
  data?: unknown;
  payment?: { transaction?: string; network?: string } | null;
  error?: string;
};

/**
 * One-click x402 demo: the server agent wallet autonomously pays a gated
 * endpoint and returns the data + on-chain settlement proof. This is the
 * "agent pays for an API by itself" moment judges love.
 */
export function X402Demo() {
  const [result, setResult] = useState<BuyResult | null>(null);
  const [loading, setLoading] = useState(false);

  const buy = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/x402/buy", { method: "POST" });
      setResult(await res.json());
    } catch (err) {
      setResult({ ok: false, error: err instanceof Error ? err.message : "Request failed" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="size-4 text-brand-muted" /> x402 Autonomous Purchase
        </CardTitle>
        <CardDescription>
          Server agent pays $0.01 USDC to unlock a gated API — no human in the loop.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button onClick={buy} loading={loading} className="w-full">
          {loading ? "Agent paying…" : "Run x402 purchase"}
        </Button>

        {result && (
          <div className="space-y-2 rounded-[var(--radius)] border border-border bg-surface-2 p-3 text-sm">
            {result.ok ? (
              <>
                <div className="flex items-center justify-between">
                  <Badge variant="success">Paid &amp; unlocked</Badge>
                  {result.payment?.transaction && (
                    <a
                      href={explorerTx(result.payment.transaction as `0x${string}`)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-brand-muted hover:underline"
                    >
                      settlement <ExternalLink className="size-3" />
                    </a>
                  )}
                </div>
                <pre className="overflow-x-auto whitespace-pre-wrap break-all text-xs text-muted">
                  {JSON.stringify(result.data, null, 2)}
                </pre>
              </>
            ) : (
              <p className="text-danger">
                {result.error}
                <span className="mt-1 block text-xs text-muted">
                  Tip: set AGENT_PRIVATE_KEY (funded) + X402_PAY_TO_ADDRESS in .env.local.
                </span>
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
