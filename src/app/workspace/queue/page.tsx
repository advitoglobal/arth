"use client";

import { useMemo, useState } from "react";
import { dayPanel, enquiries, type Enquiry } from "@/lib/arth-data";
import { inr } from "@/lib/format";
import { RuleHeading, StatusStamp } from "@/components/brand/type";
import { Button } from "@/components/ui/button";

function weightFor(item: Enquiry) {
  if (item.semantic === "overdue") return "font-semibold";
  if (item.dueIn === "in 2h") return "font-medium";
  return "font-normal";
}

export default function QueuePage() {
  const [rows, setRows] = useState(enquiries);
  const open = rows.filter((r) => r.semantic !== "settled");
  const settled = rows.filter((r) => r.semantic === "settled");

  const sorted = useMemo(
    () =>
      [...open].sort((a, b) => {
        if (a.semantic === "overdue" && b.semantic !== "overdue") return -1;
        if (b.semantic === "overdue" && a.semantic !== "overdue") return 1;
        return b.hoursOpen - a.hoursOpen;
      }),
    [open],
  );

  function assign(id: string) {
    setRows((prev) =>
      prev.map((r) =>
        r.id === id
          ? { ...r, owner: "A. Iyer", note: "Assigned to A. Iyer" }
          : r,
      ),
    );
  }

  return (
    <div className="space-y-8">
      <div className="border border-[var(--arth-n10)] bg-[var(--arth-n00)] p-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--arth-slate)]">
          {dayPanel.person} · {dayPanel.date}
        </p>
        <p className="mt-3 max-w-[68ch] text-base">
          {dayPanel.closed} of {dayPanel.due} follow-ups closed. {dayPanel.carry}{" "}
          carry into tomorrow, the oldest {dayPanel.oldestDays} days old.
        </p>
      </div>

      <RuleHeading as="h1">My queue</RuleHeading>

      {sorted.length === 0 ? (
        <p className="text-[var(--arth-n60)]">
          No enquiries are unassigned. New ones will appear here within a minute
          of arriving.
        </p>
      ) : (
        <ul className="border border-[var(--arth-n10)] bg-[var(--arth-n00)]">
          {sorted.map((item) => (
            <li
              key={item.id}
              className="flex flex-col gap-3 border-b border-[var(--arth-n10)] px-4 py-3 last:border-b-0 sm:flex-row sm:items-center sm:justify-between"
              style={{
                borderLeftWidth: 3,
                borderLeftColor:
                  item.semantic === "overdue"
                    ? "var(--arth-overdue)"
                    : item.semantic === "settled"
                      ? "var(--arth-settled)"
                      : "var(--arth-n20)",
              }}
            >
              <div>
                <p className={`${weightFor(item)} text-sm`}>
                  {item.name} — {item.vehicle}
                </p>
                <p className="text-[12.5px] text-[var(--arth-n60)]">
                  {item.note} · {item.owner} · {item.branch}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                {item.dueIn ? (
                  <span className="font-data text-[12.5px] tabular-nums">
                    {item.dueIn}
                  </span>
                ) : null}
                {item.semantic ? <StatusStamp state={item.semantic} /> : null}
                <span className="font-data text-[12.5px] tabular-nums text-[var(--arth-brass-deep)]">
                  {inr(item.amount)}
                </span>
                <span className="font-data text-[12.5px] text-[var(--arth-n60)]">
                  {item.id}
                </span>
                {item.owner === "—" ? (
                  <Button size="sm" onClick={() => assign(item.id)}>
                    Assign
                  </Button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}

      {settled.length > 0 ? (
        <div>
          <h2 className="font-display text-[20px] font-semibold">Settled today</h2>
          <ul className="mt-3 border border-[var(--arth-n10)] bg-[var(--arth-n00)]">
            {settled.map((item) => (
              <li
                key={item.id}
                className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                style={{
                  borderLeftWidth: 3,
                  borderLeftColor: "var(--arth-settled)",
                }}
              >
                <p className="text-sm">
                  {item.name} — {item.vehicle}
                </p>
                <div className="flex items-center gap-3">
                  <StatusStamp state="settled" />
                  <span className="font-data text-[12.5px] tabular-nums">
                    {inr(item.amount)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
