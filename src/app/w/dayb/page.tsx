import { asSeat, canOpen } from "@/db/session";
import { listQueue, raiseFirstResponseBreaches } from "@/services/telecalling";
import { armUnownedClocks } from "@/services/assignment";
import { loadPerformance } from "@/services/performance";
import { PerformancePanel } from "@/components/performance-panel";
import { EnquiryList } from "@/components/enquiry-row";
import { FigureSource } from "@/components/figure-source";
import { RuleHeading } from "@/components/brand/type";
import { ActionButton } from "@/components/action-button";
import { Forbidden } from "@/components/forbidden";
import { groupQueueByBand } from "@/domain/queue-bands";
import type { LeadRow } from "@/services/telecalling";
import { DailyWelcome } from "@/components/daily-welcome";
import { loadWelcome } from "@/services/floor-register";

function listNames(rows: LeadRow[]) {
  const names = rows.map((r) => r.customer_name);
  if (names.length === 0) return "";
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  if (names.length === 3) return `${names[0]}, ${names[1]} and ${names[2]}`;
  return `${names.slice(0, 2).join(", ")} and ${names.length - 2} more`;
}

function todayBrief(
  bands: { key: string; rows: LeadRow[] }[],
  pool: number,
) {
  const late = bands.find((b) => b.key === "late")?.rows ?? [];
  const breaching = bands.find((b) => b.key === "breaching")?.rows ?? [];
  const promised = bands.find((b) => b.key === "promised")?.rows ?? [];
  const parts: string[] = [];
  if (breaching.length > 0) {
    parts.push(
      `${listNames(breaching)} ${breaching.length === 1 ? "is" : "are"} inside the last ten minutes of the first-response window.`,
    );
  }
  if (late.length > 0) {
    parts.push(
      `${listNames(late)} ${late.length === 1 ? "is" : "are"} already late. Call ${late.length === 1 ? "this one" : "these"} first.`,
    );
  }
  if (late.length === 0 && breaching.length === 0) {
    parts.push("Nothing is late.");
  }
  if (promised.length > 0) {
    parts.push(
      `${listNames(promised)} still ${promised.length === 1 ? "needs" : "need"} a call later today.`,
    );
  } else if (late.length === 0 && breaching.length === 0) {
    parts.push("Nothing else is due today.");
  }
  if (pool > 0) {
    parts.push(
      `${pool} new ${pool === 1 ? "enquiry is" : "enquiries are"} still in the shared book. They stay there until a telecaller reaches the customer.`,
    );
  }
  return parts.join(" ");
}

const BAND_NOTE: Record<string, string> = {
  breaching:
    "First-response window closes in under ten minutes. Acting now still prevents a breach.",
  late: "First call missed, or a follow-up already past its date. Worst first.",
  promised: "You told this customer you would ring today. That promise outranks a new name.",
  pool: "Unclaimed. Oldest first. Reaching the customer for 20 seconds or more moves it into your book.",
  due: "Scheduled callbacks and revisits that came due today.",
  revival:
    "Nothing else is due. Cold names, sorted by value. This hour is still worth working.",
};

function Block({
  title,
  note,
  rows,
  hideOverdueStamp = false,
}: {
  title: string;
  note: string;
  rows: LeadRow[];
  hideOverdueStamp?: boolean;
}) {
  const remaining =
    rows.length === 1 ? "1 remaining" : `${rows.length} remaining`;
  return (
    <section className="space-y-3">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="font-display text-[20px] font-semibold">{title}</h2>
        <p className="font-data shrink-0 text-sm tabular-nums text-[var(--arth-n60)]">
          {remaining}
        </p>
      </div>
      <p className="text-sm text-[var(--arth-n60)]">{note}</p>
      {rows.length === 0 ? (
        <p>None in this list.</p>
      ) : (
        <div className="lg:border-0">
          <EnquiryList rows={rows} canCall showBand hideOverdueStamp={hideOverdueStamp} />
        </div>
      )}
    </section>
  );
}

export default async function DayPanelPage() {
  return asSeat(async (tx, seat) => {
    if (!canOpen(seat.roleKey, "dayb")) return <Forbidden screen="dayb" />;
    await armUnownedClocks(tx);
    await raiseFirstResponseBreaches(tx, seat.userId);
    const rows = await listQueue(tx, seat.userId);
    const bands = groupQueueByBand(rows);
    const pool = rows.filter((r) => r.queue_band === "pool" || !r.owner_user_id).length;
    const next = rows[0];
    const perf = await loadPerformance(tx);
    const welcome = await loadWelcome(tx, seat.userId);

    return (
      <div className="space-y-8">
        {!welcome.dismissed ? (
          <DailyWelcome
            late={welcome.late}
            due={welcome.due}
            firstName={welcome.firstName}
            yesterdayOutcomes={welcome.yesterdayOutcomes}
          />
        ) : null}
        <div className="border border-[var(--arth-n10)] bg-[var(--arth-n00)] p-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--arth-slate)]">
            {new Date().toLocaleDateString("en-IN", {
              timeZone: "Asia/Kolkata",
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </p>
          <p className="mt-3 max-w-[68ch]">
            {todayBrief(bands, pool)}
          </p>
          {next ? (
            <div className="mt-4 flex flex-wrap gap-2">
              <ActionButton href={`/w/tele?id=${next.id}`} variant="default">
                Start next call · {next.customer_name}
              </ActionButton>
              <ActionButton href="/w/new" variant="outline">
                Add enquiry
              </ActionButton>
              <p className="mt-2 w-full text-sm text-[var(--arth-n60)]">
                Lines up the six published bands. You cannot re-sort this list. Add enquiry stays on this screen so names are not written on paper.
              </p>
            </div>
          ) : (
            <div className="mt-4">
              <ActionButton href="/w/new" variant="default">
                Add enquiry
              </ActionButton>
            </div>
          )}
        </div>
        <RuleHeading>Today</RuleHeading>
        <p className="text-sm text-[var(--arth-n60)]">
          Your list for today in this department. Six bands, always in this order. You cannot skip a band. You can still open any name in My enquiries; that call is recorded as out of order.           New names stay shared until someone reaches the customer.
        </p>
        <FigureSource
          source="your queue"
          period="today in India Standard Time, six published bands"
        />
        {rows.length === 0 ? (
          <p>No enquiries are due. New names appear here for every telecaller until someone reaches the customer.</p>
        ) : (
          bands
            .filter((band) => band.rows.length > 0)
            .map((band) => (
              <Block
                key={band.key}
                title={band.label}
                note={BAND_NOTE[band.key] ?? ""}
                rows={band.rows}
                hideOverdueStamp={band.key === "late" || band.key === "breaching"}
              />
            ))
        )}
        <PerformancePanel view={perf} />
      </div>
    );
  });
}
