"use client";

import { RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useAgents } from "@/hooks/use-agents";
import { useIsDemoMode } from "@/components/demo-mode";

/**
 * Restores the ideal seeded workforce — so the presenter can re-run the demo
 * from clean, deterministic state after rehearsing. Demo mode only.
 */
export function DemoReset() {
  const { reset } = useAgents();
  if (!useIsDemoMode()) return null;
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => {
        reset();
        toast.success("Demo reset", { description: "Workforce restored to its starting state." });
      }}
    >
      <RotateCcw className="size-4" /> Reset demo
    </Button>
  );
}
