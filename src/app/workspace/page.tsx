import Link from "next/link";
import { TENANT, decisions, outcomes } from "@/lib/arth-data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

function statusVariant(status: (typeof outcomes)[number]["status"]) {
  if (status === "on-track") return "secondary" as const;
  if (status === "watch") return "outline" as const;
  return "destructive" as const;
}

export default function WorkspaceOverview({
  searchParams,
}: {
  searchParams: Promise<{ role?: string }>;
}) {
  return (
    <Overview searchParams={searchParams} />
  );
}

async function Overview({
  searchParams,
}: {
  searchParams: Promise<{ role?: string }>;
}) {
  const { role } = await searchParams;
  const qs = `?role=${role === "director" ? "director" : "client"}`;

  return (
    <div className="space-y-8">
      <header>
        <p className="text-xs uppercase tracking-[0.22em] text-primary">
          {TENANT.programme}
        </p>
        <h1 className="mt-2 font-display text-4xl tracking-tight">
          {TENANT.name} is in control of the next three decisions.
        </h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Sponsor {TENANT.clientSponsor} · Delivery {TENANT.deliveryLead} ·{" "}
          {TENANT.regions.join(" · ")}
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Decisions waiting</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-display text-4xl">{decisions.length}</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Client-owned. Nothing else unblocks the Q3 ledger.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Outcomes on track</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-display text-4xl">
              {outcomes.filter((o) => o.status === "on-track").length}/
              {outcomes.length}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              APAC vendor hygiene is the only watch item.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Empty theatre</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Status lives here. Friday steering is for decisions, not slides.
            </p>
          </CardContent>
        </Card>
      </div>

      <section>
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="font-display text-2xl">Outcome pulse</h2>
          <Button
            variant="outline"
            size="sm"
            nativeButton={false}
            render={<Link href={`/workspace/outcomes${qs}`} />}
          >
            All outcomes
          </Button>
        </div>
        <div className="space-y-3">
          {outcomes.map((item) => (
            <div
              key={item.id}
              className="flex flex-col gap-2 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-medium">{item.name}</p>
                <p className="text-sm text-muted-foreground">
                  {item.current} · {item.region}
                </p>
              </div>
              <Badge variant={statusVariant(item.status)}>{item.status}</Badge>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
