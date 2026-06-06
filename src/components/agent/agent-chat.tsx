"use client";

import { useState } from "react";
import { Bot, Send, User, Wrench } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAgent } from "@/hooks/use-agent";

/**
 * AI commerce agent chat. Renders streaming text plus tool-call activity
 * (balance checks, payment quotes, prepared transfers) so judges can SEE the
 * agent reasoning about money. Uses AI SDK v6 message `parts`.
 */
export function AgentChat() {
  const { messages, sendMessage, isStreaming } = useAgent();
  const [input, setInput] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    sendMessage({ text: input });
    setInput("");
  };

  return (
    <Card className="flex h-[32rem] flex-col">
      <CardHeader className="flex-row items-center justify-between border-b border-border">
        <CardTitle className="flex items-center gap-2">
          <Bot className="size-4 text-brand-muted" /> Commerce Agent
        </CardTitle>
        {isStreaming && <Badge variant="brand">thinking…</Badge>}
      </CardHeader>

      <CardContent className="flex-1 space-y-4 overflow-y-auto py-4">
        {messages.length === 0 && (
          <div className="space-y-2 text-sm text-muted">
            <p>Try asking:</p>
            <ul className="space-y-1">
              <li>• “What’s the USDC balance of 0x…?”</li>
              <li>• “Quote a payment of 2.50 USDC to 0x…”</li>
              <li>• “Prepare a 1 USDC transfer to 0x…”</li>
            </ul>
          </div>
        )}

        {messages.map((m) => (
          <div key={m.id} className="flex gap-3 text-sm">
            <div className="mt-0.5 shrink-0">
              {m.role === "user" ? (
                <User className="size-4 text-muted" />
              ) : (
                <Bot className="size-4 text-brand-muted" />
              )}
            </div>
            <div className="min-w-0 space-y-2">
              {m.parts.map((part, i) => {
                if (part.type === "text") {
                  return (
                    <p key={i} className="whitespace-pre-wrap leading-relaxed">
                      {part.text}
                    </p>
                  );
                }
                // Tool calls render as a compact activity chip.
                if (part.type.startsWith("tool-")) {
                  return (
                    <div
                      key={i}
                      className="flex items-center gap-1.5 rounded-md border border-border bg-surface-2 px-2 py-1 text-xs text-muted"
                    >
                      <Wrench className="size-3" />
                      <span className="font-mono">{part.type.replace("tool-", "")}</span>
                    </div>
                  );
                }
                return null;
              })}
            </div>
          </div>
        ))}
      </CardContent>

      <form onSubmit={submit} className="flex gap-2 border-t border-border p-3">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask the agent to move money…"
          disabled={isStreaming}
        />
        <Button type="submit" size="md" loading={isStreaming} aria-label="Send">
          <Send className="size-4" />
        </Button>
      </form>
    </Card>
  );
}
