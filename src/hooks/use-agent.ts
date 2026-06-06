"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";

/**
 * Thin wrapper over the AI SDK chat hook, pointed at our wallet-aware
 * agent route. Returns demo-friendly state (isStreaming) alongside the
 * raw message stream.
 *
 * Messages are AI SDK `UIMessage`s — render `message.parts`, not `.content`.
 */
export function useAgent(endpoint: string = "/api/agent") {
  const chat = useChat({
    transport: new DefaultChatTransport({ api: endpoint }),
  });

  return {
    ...chat,
    isStreaming: chat.status === "submitted" || chat.status === "streaming",
  };
}
