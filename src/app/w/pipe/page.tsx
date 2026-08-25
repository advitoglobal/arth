import Link from "next/link";
import { asSeat, canOpen } from "@/db/session";
import { listPipeline } from "@/services/telecalling";
import { EnquiryRow, RowHead } from "@/components/enquiry-row";
import { RuleHeading } from "@/components/brand/type";
import { STAGE_KEYS } from "@/domain/clock";
import { ActionButton } from "@/components/action-button";
import { Forbidden } from "@/components/forbidden";

const LABELS: Record<string, string> = {
  new: "New",
  assigned: "Assigned",
  contacted: "Contacted",
  qualified: "Qualified",
  test_drive: "Test drive",
  quotation: "Quotation",
  negotiation: "Negotiation",
  booked: "Booked",
  delivered: "Delivered",
};

export default async function PipePage({
  searchParams,
}: {
  searchParams: Promise<{ stage?: string }>;
}) {
  const { stage } = await searchParams;
  return asSeat(async (tx, seat) => {
    if (!canOpen(seat.roleKey, "pipe")) return <Forbidden />;
    const rows = await listPipeline(tx, seat.userId);
    const active = STAGE_KEYS.includes(stage as (typeof STAGE_KEYS)[number])
      ? stage
      : undefined;
    const shown = active ? rows.filter((r) => r.stage_key === active) : rows;
    const canCall = canOpen(seat.roleKey, "tele");

    return (
      <div className="space-y-6">
        <RuleHeading>My enquiries</RuleHeading>
        <p className="text-sm text-[var(--arth-n60)]">
          The full book, nine stages. Value from expected_value_paise. The queue is only what is due today.
        </p>
        <nav className="flex flex-wrap gap-2">
          <Link
            href="/w/pipe"
            className={`rounded-[3px] border px-3 py-1 text-sm ${!active ? "border-[var(--arth-ink)]" : "border-[var(--arth-n10)]"}`}
          >
            All · {rows.length}
          </Link>
          {STAGE_KEYS.map((key) => {
            const n = rows.filter((r) => r.stage_key === key).length;
            return (
              <Link
                key={key}
                href={`/w/pipe?stage=${key}`}
                className={`rounded-[3px] border px-3 py-1 text-sm ${active === key ? "border-[var(--arth-ink)]" : "border-[var(--arth-n10)]"}`}
              >
                {LABELS[key]} · {n}
              </Link>
            );
          })}
        </nav>
        {shown.length === 0 ? (
          <p>
            {active
              ? `No enquiries in ${LABELS[active]}. They appear here when the stage moves.`
              : "No enquiries are assigned to you."}
            {!canCall && !active ? (
              <span className="mt-3 inline-block">
                <ActionButton href="/w/dayb">Open Today</ActionButton>
              </span>
            ) : null}
          </p>
        ) : (
          <div className="border border-[var(--arth-n10)] bg-[var(--arth-n00)]">
            <RowHead />
            {shown.map((row) => (
              <EnquiryRow key={row.id} row={row} showBand={false} canCall={canCall} />
            ))}
          </div>
        )}
      </div>
    );
  });
}
