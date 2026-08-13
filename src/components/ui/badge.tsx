import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 font-mono text-[10.5px] font-medium tracking-wide",
  {
    variants: {
      variant: {
        brand: "bg-brand/20 text-brand-muted",
        neutral: "bg-surface-2 text-muted",
        success: "bg-success/20 text-success",
        warning: "bg-warning/20 text-warning",
        danger: "bg-danger/20 text-danger",
      },
    },
    defaultVariants: { variant: "neutral" },
  },
);

export function Badge({
  className,
  variant,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
