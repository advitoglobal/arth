"use client";

import { useMemo, useState } from "react";
import { decisions as seed, type Decision } from "@/lib/arth-data";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type State = Decision & { state: "open" | "approved" | "deferred" };

export function DecisionQueue() {
  const [items, setItems] = useState<State[]>(
    seed.map((d) => ({ ...d, state: "open" })),
  );

  const open = useMemo(
    () => items.filter((d) => d.state === "open"),
    [items],
  );
  const closed = useMemo(
    () => items.filter((d) => d.state !== "open"),
    [items],
  );

  function setState(id: string, state: State["state"]) {
    setItems((prev) => prev.map((d) => (d.id === id ? { ...d, state } : d)));
  }

  if (open.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border p-10 text-center">
        <h2 className="font-display text-3xl">Queue clear</h2>
        <p className="mt-2 text-muted-foreground">
          Nothing is waiting on the client. Delivery can move. Refresh the
          page to restore the demo queue.
        </p>
        {closed.length > 0 && (
          <ul className="mt-6 space-y-2 text-left text-sm text-muted-foreground">
            {closed.map((d) => (
              <li key={d.id}>
                {d.title} — {d.state}
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {open.map((item) => (
        <Card key={item.id}>
          <CardHeader>
            <p className="text-xs uppercase tracking-wider text-primary">
              Due {item.due}
            </p>
            <CardTitle className="font-display text-2xl">{item.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-relaxed text-muted-foreground">
            <p>{item.summary}</p>
            <p>
              <span className="text-foreground">Unlocks: </span>
              {item.impact}
            </p>
            <p>
              <span className="text-foreground">If it sits: </span>
              {item.riskIfIdle}
            </p>
            <p>Owner: {item.owner}</p>
          </CardContent>
          <CardFooter className="flex flex-col gap-2 sm:flex-row">
            <Button onClick={() => setState(item.id, "approved")}>
              Approve
            </Button>
            <Button
              variant="outline"
              onClick={() => setState(item.id, "deferred")}
            >
              Defer with reason later
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
