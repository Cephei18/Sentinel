import { Navbar } from "@/components/layout/navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrustGraph } from "@/components/agents/trust-graph";
import { AgentCommerce } from "@/components/agents/agent-commerce";
import { GlobalActivity } from "@/components/agents/global-activity";

const LEGEND = [
  { className: "bg-success", label: "Autonomous (AA+)" },
  { className: "bg-brand-muted", label: "Trusted (A–BBB)" },
  { className: "bg-warning", label: "Supervised (BB–B)" },
  { className: "bg-danger", label: "At risk (C)" },
];

export default function GraphPage() {
  return (
    <div className="flex min-h-full flex-col">
      <Navbar />
      <main className="mx-auto w-full max-w-6xl flex-1 space-y-6 px-4 py-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Organization graph</h1>
          <p className="text-muted text-sm">
            Your AI-native company, live. Workers orbit you — the more trusted, the closer — and
            edges are autonomous payments between them.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Autonomous workforce network</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <TrustGraph />
              <div className="border-border/60 mt-2 flex flex-wrap gap-x-5 gap-y-2 border-t pt-4">
                {LEGEND.map((l) => (
                  <span key={l.label} className="text-muted flex items-center gap-2 text-xs">
                    <span className={`size-2.5 rounded-full ${l.className}`} />
                    {l.label}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <AgentCommerce />
            <GlobalActivity limit={6} />
          </div>
        </div>
      </main>
    </div>
  );
}
