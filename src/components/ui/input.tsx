import { forwardRef } from "react";
import { cn } from "@/lib/utils";

export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "border-border bg-background text-foreground placeholder:text-muted/70 focus-visible:border-brand-muted h-11 w-full rounded-[var(--radius)] border px-3.5 text-sm transition-colors focus-visible:outline-none",
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = "Input";
