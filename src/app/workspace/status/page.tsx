import { auditLog, directorNotes, outcomes, workstreams } from "@/lib/arth-data";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const metadata = { title: "Director status" };

export default function StatusPage() {
  const watch = outcomes.filter((o) => o.status !== "on-track");
  const lagging = workstreams.filter((w) => w.progress < 70);

  return (
    <div className="space-y-8">
      <header>
        <p className="text-xs uppercase tracking-[0.22em] text-primary">
          Product · IT
        </p>
        <h1 className="font-display text-4xl tracking-tight">
          Status for directors
        </h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Snapshot for the product engineering director and IT director. What
          is true, what is blocked, what engineering is holding next.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        {directorNotes.map((note) => (
          <Card key={note.title}>
            <CardHeader>
              <CardTitle>{note.title}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm leading-relaxed text-muted-foreground">
              {note.body}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Watch list</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {watch.length === 0 && lagging.length === 0 ? (
            <p className="text-muted-foreground">No watch items this week.</p>
          ) : (
            <>
              {watch.map((o) => (
                <p key={o.id}>
                  Outcome · {o.name} is {o.status} in {o.region}.
                </p>
              ))}
              {lagging.map((w) => (
                <p key={w.id}>
                  Workstream · {w.name} at {w.progress}% · {w.region}.
                </p>
              ))}
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Audit</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>When</TableHead>
                <TableHead>Actor</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Object</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {auditLog.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{row.at}</TableCell>
                  <TableCell>{row.actor}</TableCell>
                  <TableCell>{row.action}</TableCell>
                  <TableCell>{row.object}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
