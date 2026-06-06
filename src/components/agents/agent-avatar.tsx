import { avatarGradient } from "@/lib/agents/format";
import { cn } from "@/lib/utils";

/** Deterministic gradient avatar with the agent's initial. */
export function AgentAvatar({
  name,
  seed,
  size = 40,
  className,
}: {
  name: string;
  seed: string;
  size?: number;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "grid shrink-0 place-items-center rounded-xl font-semibold text-white",
        className,
      )}
      style={{
        width: size,
        height: size,
        background: avatarGradient(seed),
        fontSize: size * 0.42,
      }}
      aria-hidden
    >
      {name.charAt(0).toUpperCase()}
    </span>
  );
}
