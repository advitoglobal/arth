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
import { isFirstResponseLate, isFollowUpLate } from "@/domain/clock";
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

function todayBrief(late: LeadRow[], later: LeadRow[], pool: number) {
  const parts: string[] = [];
  if (late.length > 0) {
    parts.push(
      `${listNames(late)} ${late.length === 1 ? "is" : "are"} late. Call ${late.length === 1 ? "this one" : "these"} first.`,
    );
  } else {
    parts.push("Nothing is late.");
  }
  if (later.length > 0) {
    parts.push(
      `${listNames(later)} still ${later.length === 1 ? "needs" : "need"} a call later today.`,
    );
  } else if (late.length === 0) {
    parts.push("Nothing else is due today.");
  }
  if (pool > 0) {
    parts.push(
      `${pool} new ${pool === 1 ? "enquiry is" : "enquiries are"} still in the shared book. They stay there until a telecaller reaches the customer.`,
    );
  }
  return parts.join(" ");
}

function Block({
  title,
  note,
  rows,
}: {
  title: string;
  note: string;
  rows: LeadRow[];
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
          <EnquiryList rows={rows} canCall />
        </div>
      )}
    </section>
  );
}

export default async function DayPanelPage() {
  return asSeat(async (tx, seat) => {
    if (!canOpen(seat.roleKey, "dayb")) return <Forbidden />;
    await armUnownedClocks(tx);
    await raiseFirstResponseBreaches(tx, seat.userId);
    const rows = await listQueue(tx, seat.userId);
    const breaching = rows.filter(
      (r) => isFirstResponseLate(r) || isFollowUpLate(r.next_action_at),
    );
    const promised = rows.filter(
      (r) =>
        !isFirstResponseLate(r) &&
        !isFollowUpLate(r.next_action_at) &&
        r.next_action_at,
    );
    const seen = new Set([...breaching, ...promised].map((r) => r.id));
    const rest = rows.filter((r) => !seen.has(r.id));
    const pool = rows.filter((r) => !r.owner_user_id).length;
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
            {todayBrief(breaching, promised, pool)}
          </p>
          {next ? (
            <div className="mt-4">
              <ActionButton href={`/w/tele?id=${next.id}&auto=1`} variant="default">
                Start next call · {next.customer_name}
              </ActionButton>
              <p className="mt-2 text-sm text-[var(--arth-n60)]">
                Lines up late names first, then the rest of Today, until the list is finished.
              </p>
            </div>
          ) : null}
        </div>
        <RuleHeading>Today</RuleHeading>
        <p className="text-sm text-[var(--arth-n60)]">
          Your list for today: late calls first, then what you still promised to do today. New names are on this list for every telecaller at the branch until someone reaches the customer. After that they stay with that seat. Qualify, then hand to sales. The rest of your book is in My enquiries. Today loads at most 200 due names so a dumped old book cannot stall this screen.
        </p>
        <FigureSource
          source="your queue"
          period="today in India Standard Time, late first"
        />
        {rows.length === 0 ? (
          <p>No enquiries are due. New names appear here for every telecaller until someone reaches the customer.</p>
        ) : (
          <>
            <Block
              title="Late"
              note="First call missed, or a follow-up already late. Start here."
              rows={breaching}
            />
            <Block
              title="Due later today"
              note="You still owe a call today. It is not late yet."
              rows={promised}
            />
            {rest.length > 0 ? (
              <Block
                title="Also due"
                note="On today without a timed follow-up."
                rows={rest}
              />
            ) : null}
          </>
        )}
        <PerformancePanel view={perf} />
      </div>
    );
  });
}
