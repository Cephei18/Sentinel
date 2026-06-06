/**
 * Presentation helpers shared across the agent UI — kept here so the trust
 * colour language and labels stay consistent everywhere they appear.
 */
import type { AgentStatus, AgentEventKind } from "./types";
import type { TrustGrade } from "./reputation";

/** Tailwind text-colour class for a trust score band. */
export function scoreColorClass(score: number): string {
  if (score >= 84) return "text-success";
  if (score >= 66) return "text-brand-muted";
  if (score >= 42) return "text-warning";
  return "text-danger";
}

/** Badge variant for a trust grade chip. */
export function gradeBadgeVariant(grade: TrustGrade): "success" | "brand" | "warning" | "danger" {
  if (grade === "AAA" || grade === "AA") return "success";
  if (grade === "A" || grade === "BBB") return "brand";
  if (grade === "BB" || grade === "B") return "warning";
  return "danger";
}

export function statusBadgeVariant(
  status: AgentStatus,
): "success" | "neutral" | "warning" | "danger" {
  switch (status) {
    case "active":
      return "success";
    case "paused":
      return "warning";
    case "expired":
      return "neutral";
    case "revoked":
      return "danger";
  }
}

/** Badge variant for an activity event kind. */
export function eventBadgeVariant(
  kind: AgentEventKind,
): "success" | "brand" | "warning" | "danger" | "neutral" {
  switch (kind) {
    case "payment_success":
      return "success";
    case "payment_failed":
      return "danger";
    case "limit_blocked":
      return "warning";
    case "task_completed":
      return "brand";
    case "authorized":
      return "neutral";
  }
}

export const EVENT_LABEL: Record<AgentEventKind, string> = {
  payment_success: "payment",
  payment_failed: "failed",
  limit_blocked: "blocked",
  task_completed: "task",
  authorized: "authorized",
};

/** Compact "2m ago" style relative time from an ISO string. */
export function timeAgo(iso: string, nowMs: number): string {
  const diff = Math.max(0, nowMs - new Date(iso).getTime());
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

/** Deterministic gradient for an agent avatar, derived from its seed. */
export function avatarGradient(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  const h1 = hash % 360;
  const h2 = (h1 + 48) % 360;
  return `linear-gradient(135deg, hsl(${h1} 70% 55%), hsl(${h2} 75% 45%))`;
}
