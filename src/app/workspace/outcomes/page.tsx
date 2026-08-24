import { outcomes } from "@/lib/arth-data";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata = { title: "Outcomes" };

export default function OutcomesPage() {
  if (outcomes.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border p-10 text-center">
        <h1 className="font-display text-3xl">No outcomes yet</h1>
        <p className="mt-2 text-muted-foreground">
          Name the results the client cares about. Delivery will attach proof.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-4xl tracking-tight">Outcomes</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          These are the scores the client named. Green is not activity. Green is
          a result moving toward the target they set.
        </p>
      </header>
      <div className="grid gap-4">
        {outcomes.map((item) => (
          <Card key={item.id}>
            <CardHeader className="flex-row items-start justify-between gap-4">
              <div>
                <CardTitle className="font-display text-2xl">
                  {item.name}
                </CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">
                  {item.owner} · {item.region}
                </p>
              </div>
              <Badge
                variant={
                  item.status === "on-track"
                    ? "secondary"
                    : item.status === "watch"
                      ? "outline"
                      : "destructive"
                }
              >
                {item.status}
              </Badge>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-4">
              <Metric label="Baseline" value={item.baseline} />
              <Metric label="Current" value={item.current} />
              <Metric label="Target" value={item.target} />
              <Metric
                label="Move"
                value={`${item.deltaPct > 0 ? "+" : ""}${item.deltaPct}%`}
              />
              <p className="sm:col-span-4 text-sm leading-relaxed text-muted-foreground">
                Next proof: {item.nextProof}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 font-medium">{value}</p>
    </div>
  );
}
