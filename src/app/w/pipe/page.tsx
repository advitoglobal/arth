import Link from "next/link";
import { asSeat, canOpen } from "@/db/session";
import { listPipeline } from "@/services/telecalling";
import { EnquiryList } from "@/components/enquiry-row";
import { RuleHeading } from "@/components/brand/type";
import { STAGE_KEYS } from "@/domain/clock";
import { ActionButton } from "@/components/action-button";
import { Forbidden } from "@/components/forbidden";
import { FigureSource } from "@/components/figure-source";
import { STAGE_LABEL } from "@/lib/labels";

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
          {seat.roleKey === "sales"
            ? "Enquiries handed to you after telecalling qualifies them. Convert them here. Stage moves write to the ledger."
            : "Your full book, in nine stages. Today is only what is due now. New names stay on Today for every telecaller until you reach the customer. After you qualify, hand the enquiry to sales. Open a name for the history."}
        </p>
        <FigureSource
          source="your full book"
          period="all nine stages, current"
        />
        {canCall ? (
          <ActionButton href="/w/new" variant="default">
            Add enquiry
          </ActionButton>
        ) : null}
        <nav className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          <Link
            href="/w/pipe"
            className={`flex h-11 items-center justify-center rounded-[3px] border px-2 text-center text-sm ${!active ? "border-[var(--arth-ink)] font-semibold" : "border-[var(--arth-n10)]"}`}
          >
            All · {rows.length}
          </Link>
          {STAGE_KEYS.map((key) => {
            const n = rows.filter((r) => r.stage_key === key).length;
            return (
              <Link
                key={key}
                href={`/w/pipe?stage=${key}`}
                className={`flex h-11 items-center justify-center rounded-[3px] border px-2 text-center text-sm ${active === key ? "border-[var(--arth-ink)] font-semibold" : "border-[var(--arth-n10)]"}`}
              >
                {STAGE_LABEL[key]} · {n}
              </Link>
            );
          })}
        </nav>
        {shown.length === 0 ? (
          <p>
            {active
              ? `No enquiries in ${STAGE_LABEL[active]}. They appear here when the stage moves.`
              : "No enquiries are assigned to you."}
            {canOpen(seat.roleKey, "dayb") && !active ? (
              <span className="mt-3 block">
                <ActionButton href="/w/dayb">Open Today</ActionButton>
              </span>
            ) : !canCall && !active ? (
              <span className="mt-3 block">
                <ActionButton href="/w/search">Open Search</ActionButton>
              </span>
            ) : null}
          </p>
        ) : (
          <EnquiryList rows={shown} canCall={canCall} />
        )}
      </div>
    );
  });
}
