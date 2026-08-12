"use client";

import { useState } from "react";
import { CheckCircle2, ExternalLink, XCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usePayment } from "@/hooks/use-payment";
import { useWallet } from "@/hooks/use-wallet";
import { ConnectButton } from "@/components/wallet/connect-button";
import { useIsDemoMode, DemoPlaceholder } from "@/components/demo-mode";

interface UsdcPaymentProps {
  recipient?: string;
  amount?: string;
  label?: string;
  description?: string;
}

/**
 * Self-contained USDC checkout card. Pass a fixed `recipient`/`amount` for a
 * product, or leave editable for a send-money demo. Handles validation,
 * signing, confirmation, success + explorer link, and errors.
 */
export function UsdcPayment(props: UsdcPaymentProps) {
  if (useIsDemoMode()) {
    return (
      <DemoPlaceholder
        title={props.label ?? "Pay with USDC"}
        body="On-chain payments are disabled in demo mode — the workforce flows run without a wallet."
      />
    );
  }
  return <UsdcPaymentLive {...props} />;
}

function UsdcPaymentLive({
  recipient,
  amount: fixedAmount,
  label = "Pay with USDC",
  description = "Settled on-chain in seconds.",
}: UsdcPaymentProps) {
  const { isConnected } = useWallet();
  const { pay, status, error, explorerUrl, isBusy, reset } = usePayment();
  const [to, setTo] = useState(recipient ?? "");
  const [amount, setAmount] = useState(fixedAmount ?? "1.00");

  const isSuccess = status === "success";

  return (
    <Card>
      <CardHeader>
        <CardTitle>{label}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isConnected ? (
          <ConnectButton />
        ) : isSuccess ? (
          <div className="space-y-3 text-center">
            <CheckCircle2 className="text-success mx-auto size-10" />
            <p className="font-medium">Payment confirmed</p>
            {explorerUrl && (
              <a
                href={explorerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-muted inline-flex items-center gap-1 text-sm hover:underline"
              >
                View on explorer <ExternalLink className="size-3.5" />
              </a>
            )}
            <Button variant="secondary" size="sm" className="w-full" onClick={reset}>
              Make another payment
            </Button>
          </div>
        ) : (
          <>
            <div className="space-y-1.5">
              <label className="text-muted text-xs">Recipient</label>
              <Input
                placeholder="Solana address…"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                disabled={Boolean(recipient) || isBusy}
                className="font-mono"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-muted text-xs">Amount (USDC)</label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={Boolean(fixedAmount) || isBusy}
              />
            </div>

            {error && (
              <p className="text-danger flex items-center gap-1.5 text-sm">
                <XCircle className="size-4" /> {error}
              </p>
            )}

            <Button className="w-full" onClick={() => pay(to, amount)} loading={isBusy}>
              {status === "signing"
                ? "Confirm in wallet…"
                : status === "confirming"
                  ? "Settling on-chain…"
                  : `Pay ${amount} USDC`}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
