/**
 * Re-export of the agent store hook so consumers import from `@/hooks/*`
 * alongside the other data hooks, while the provider implementation lives
 * with its context in `components/agents`.
 */
export { useAgents } from "@/components/agents/agents-provider";
export type { CreateAgentInput } from "@/components/agents/agents-provider";
