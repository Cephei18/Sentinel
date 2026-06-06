import { toast } from "sonner";

/**
 * Surface a trust-score change as a styled, color-coded toast —
 * e.g. "Trust +3 · Successful x402 settlement". The emotional payload of the
 * demo: every action visibly, causally moves the score.
 */
export function notifyTrust(delta: number, reason: string) {
  const d = Math.round(delta);
  const label = d > 0 ? `Trust +${d}` : d < 0 ? `Trust ${d}` : "Trust unchanged";
  if (d > 0) toast.success(label, { description: reason });
  else if (d < 0) toast.error(label, { description: reason });
  else toast(label, { description: reason });
}
