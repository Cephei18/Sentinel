"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAgents } from "@/hooks/use-agents";
import { SPEND_CATEGORIES, type SpendCategory } from "@/lib/agents/types";
import { cn } from "@/lib/utils";

const MODELS = ["gpt-4o-mini", "gpt-4o", "claude-3-5-haiku", "claude-3-5-sonnet"];
const EXPIRY_OPTIONS = [
  { label: "7 days", days: 7 },
  { label: "30 days", days: 30 },
  { label: "90 days", days: 90 },
];

const DAY = 24 * 60 * 60 * 1000;

export function CreateAgentDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { createAgent } = useAgents();
  const router = useRouter();

  const [name, setName] = useState("");
  const [model, setModel] = useState(MODELS[0]);
  const [budget, setBudget] = useState("50");
  const [perTx, setPerTx] = useState("5");
  const [expiryDays, setExpiryDays] = useState(30);
  const [categories, setCategories] = useState<SpendCategory[]>(["data", "compute"]);

  const budgetNum = Number(budget);
  const perTxNum = Number(perTx);
  const error = !name.trim()
    ? "Give your agent a name."
    : !(budgetNum > 0)
      ? "Budget must be greater than 0."
      : !(perTxNum > 0)
        ? "Per-transaction limit must be greater than 0."
        : perTxNum > budgetNum
          ? "Per-transaction limit can't exceed the total budget."
          : categories.length === 0
            ? "Authorize at least one spend category."
            : null;

  const toggle = (id: SpendCategory) =>
    setCategories((c) => (c.includes(id) ? c.filter((x) => x !== id) : [...c, id]));

  const reset = () => {
    setName("");
    setModel(MODELS[0]);
    setBudget("50");
    setPerTx("5");
    setExpiryDays(30);
    setCategories(["data", "compute"]);
  };

  const submit = () => {
    if (error) return;
    const agent = createAgent({
      name: name.trim(),
      model,
      authorization: {
        budgetUsdc: budgetNum,
        perTxLimitUsdc: perTxNum,
        expiresAt: new Date(Date.now() + expiryDays * DAY).toISOString(),
        categories,
      },
    });
    toast.success(`${agent.name} hired`, {
      description: `Scoped to $${budgetNum} · $${perTxNum}/tx · ${expiryDays}d`,
    });
    reset();
    onClose();
    router.push(`/agents/${agent.id}`);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Hire an AI worker"
      description="Delegate scoped financial authority. The worker can transact autonomously within these limits — and never beyond them."
      className="max-w-lg"
    >
      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Worker name">
            <Input
              autoFocus
              placeholder="e.g. Research Agent"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </Field>
          <Field label="Model">
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="border-border bg-surface-2 text-foreground focus-visible:border-brand h-11 w-full rounded-[var(--radius)] border px-3 text-sm focus-visible:outline-none"
            >
              {MODELS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Total budget (USDC)" hint="Lifetime cap">
            <Input
              type="number"
              min="0"
              step="1"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
            />
          </Field>
          <Field label="Per-transaction limit (USDC)" hint="Max single payment">
            <Input
              type="number"
              min="0"
              step="0.5"
              value={perTx}
              onChange={(e) => setPerTx(e.target.value)}
            />
          </Field>
        </div>

        <Field label="Authorization expires">
          <div className="flex gap-2">
            {EXPIRY_OPTIONS.map((o) => (
              <button
                key={o.days}
                onClick={() => setExpiryDays(o.days)}
                className={cn(
                  "flex-1 rounded-[var(--radius)] border px-3 py-2 text-sm transition-colors",
                  expiryDays === o.days
                    ? "border-brand bg-brand/10 text-foreground"
                    : "border-border bg-surface-2 text-muted hover:text-foreground",
                )}
              >
                {o.label}
              </button>
            ))}
          </div>
        </Field>

        <Field label="Allowed spend categories">
          <div className="flex flex-wrap gap-2">
            {SPEND_CATEGORIES.map((c) => {
              const on = categories.includes(c.id);
              return (
                <button
                  key={c.id}
                  onClick={() => toggle(c.id)}
                  title={c.hint}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-sm transition-colors",
                    on
                      ? "border-brand bg-brand/15 text-brand-muted"
                      : "border-border bg-surface-2 text-muted hover:text-foreground",
                  )}
                >
                  {c.label}
                </button>
              );
            })}
          </div>
        </Field>

        <div className="border-border/60 flex items-center justify-between gap-3 border-t pt-4">
          <p className="text-danger text-xs">{error ?? " "}</p>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={submit} disabled={!!error}>
              Hire worker
            </Button>
          </div>
        </div>
      </div>
    </Dialog>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-muted flex items-baseline justify-between text-xs font-medium">
        {label}
        {hint && <span className="text-muted/70 font-normal">{hint}</span>}
      </span>
      {children}
    </label>
  );
}
