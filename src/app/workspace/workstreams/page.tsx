import { workstreams } from "@/lib/arth-data";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress, ProgressLabel, ProgressValue } from "@/components/ui/progress";

export const metadata = { title: "Workstreams" };

export default function WorkstreamsPage() {
  if (workstreams.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border p-10 text-center">
        <h1 className="font-display text-3xl">No workstreams open</h1>
        <p className="mt-2 text-muted-foreground">
          When a workstream starts, it will show phase, owner, and the next
          milestone — never a wall of tasks.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-4xl tracking-tight">Workstreams</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Delivery is organised so a sponsor can see what is moving, who owns
          it, and what lands next. Regions stay visible.
        </p>
      </header>
      <div className="grid gap-4">
        {workstreams.map((item) => (
          <Card key={item.id}>
            <CardHeader>
              <CardTitle className="font-display text-2xl">{item.name}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {item.phase} · {item.region} · {item.lead}
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              <Progress value={item.progress}>
                <ProgressLabel>Progress</ProgressLabel>
                <ProgressValue />
              </Progress>
              <p className="text-sm text-muted-foreground">
                Next: {item.nextMilestone} · due {item.due}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
