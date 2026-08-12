import { openai } from "@ai-sdk/openai";
import { anthropic } from "@ai-sdk/anthropic";
import { streamText, convertToModelMessages, stepCountIs, type UIMessage } from "ai";
import { commerceTools } from "@/lib/ai/tools";
import { COMMERCE_AGENT_SYSTEM } from "@/lib/ai/system";

// Wallet-aware tools touch @solana/web3.js → run on Node, not edge.
export const runtime = "nodejs";
export const maxDuration = 30;

/**
 * Streaming, tool-calling commerce agent.
 * Provider auto-selects from whichever API key is configured
 * (OpenAI preferred, Anthropic fallback).
 */
export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const model = process.env.OPENAI_API_KEY
    ? openai("gpt-4o-mini")
    : process.env.ANTHROPIC_API_KEY
      ? anthropic("claude-3-5-haiku-latest")
      : null;

  if (!model) {
    return new Response(
      JSON.stringify({ error: "Set OPENAI_API_KEY or ANTHROPIC_API_KEY in .env.local" }),
      { status: 500, headers: { "content-type": "application/json" } },
    );
  }

  const result = streamText({
    model,
    system: COMMERCE_AGENT_SYSTEM,
    messages: await convertToModelMessages(messages),
    tools: commerceTools,
    // Allow the model to chain tool calls (e.g. quote → prepare) before replying.
    stopWhen: stepCountIs(5),
  });

  return result.toUIMessageStreamResponse();
}
