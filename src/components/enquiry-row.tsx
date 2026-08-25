import Link from "next/link";
import { ActionButton } from "@/components/action-button";
import { inr, indianMobile } from "@/lib/format";
import { StatusStamp } from "@/components/brand/type";
import { isParked } from "@/domain/clock";
import { sourceLabel } from "@/lib/labels";
import type { LeadRow } from "@/services/telecalling";

function eventDate(row: LeadRow) {
  if (!row.last_event_at) return "No activity recorded";
  const d = new Date(row.last_event_at).toLocaleDateString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "short",
  });
  return `${row.last_event ?? "Activity"} · ${d}`;
}

function nextDue(row: LeadRow): { text: string; overdue: boolean } {
  if (!row.next_action_at) return { text: "No next action", overdue: false };
  const due = new Date(row.next_action_at);
  const d = due.toLocaleDateString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "short",
  });
  const overdue = due.getTime() < Date.now();
  return {
    text: `Follow-up due · ${d}`,
    overdue,
  };
}

function cols(showValue: boolean) {
  return showValue
    ? "gap-2 px-3 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,0.85fr)_minmax(0,0.85fr)_minmax(0,1.15fr)_minmax(0,1.15fr)_minmax(0,0.75fr)_6.5rem] lg:items-start"
    : "gap-2 px-3 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,0.9fr)_minmax(0,0.9fr)_minmax(0,1.2fr)_minmax(0,1.2fr)_6.5rem] lg:items-start";
}

export function EnquiryRow({
  row,
  canCall,
  showValue = false,
}: {
  row: LeadRow;
  showBand?: boolean;
  canCall: boolean;
  showValue?: boolean;
}) {
  const next = nextDue(row);
  const parked = isParked(row);
  const firstResponseLate =
    !!row.first_response_due &&
    !row.first_responded_at &&
    new Date(row.first_response_due).getTime() < Date.now();
  const settled = row.stage_key === "delivered";

  return (
    <div className={`grid grid-cols-1 border-b border-[var(--arth-n10)] py-3 ${cols(showValue)}`}>
      <div className="min-w-0">
        <Link
          href={`/w/rec?id=${row.id}`}
          className="block truncate font-semibold hover:underline"
          title="Open the enquiry"
        >
          {row.customer_name}
        </Link>
        <p className="font-data truncate text-[12.5px] text-[var(--arth-n60)]">
          {indianMobile(row.phone)}
        </p>
        <div className="mt-1 flex flex-wrap gap-1">
          {settled ? <StatusStamp state="settled" /> : null}
          {!settled && (next.overdue || firstResponseLate) ? (
            <StatusStamp state="overdue" />
          ) : null}
          {parked ? (
            <span className="text-[11px] font-semibold uppercase tracking-wide text-[var(--arth-n60)]">
              Parked
            </span>
          ) : null}
        </div>
      </div>
      <div className="min-w-0">
        <p className="truncate" title={row.model_interest ?? ""}>
          {row.model_interest}
        </p>
        <p className="truncate text-[12.5px] text-[var(--arth-n60)]" title={row.variant_interest ?? ""}>
          {row.variant_interest}
        </p>
      </div>
      <div className="min-w-0">
        <p className="truncate">{sourceLabel(row.source_key)}</p>
        <p className="truncate text-[12.5px] text-[var(--arth-n60)]" title={row.source_detail ?? ""}>
          {row.source_detail}
        </p>
      </div>
      <div className="min-w-0">
        <p className="truncate">{row.stage_label}</p>
        <p className="truncate text-[12.5px] text-[var(--arth-n60)]">
          {row.stage_order ? `${row.stage_order} of 9` : ""}
        </p>
      </div>
      <div className="min-w-0 text-[12.5px]" title={eventDate(row)}>
        {eventDate(row)}
      </div>
      <div
        className={
          next.overdue
            ? "min-w-0 text-[12.5px] font-semibold text-[var(--arth-overdue)]"
            : "min-w-0 text-[12.5px] font-medium"
        }
        title={next.text}
      >
        {next.text}
      </div>
      {showValue ? (
        <div className="arth-num min-w-0 truncate text-right font-data text-[12.5px]">
          {inr(Number(row.expected_value_paise) / 100)}
        </div>
      ) : null}
      <div className="flex min-w-0 flex-col gap-1">
        {canCall && !settled && !row.lost_reason_key ? (
          <ActionButton href={`/w/tele?id=${row.id}`} variant="default">
            Call
          </ActionButton>
        ) : null}
      </div>
    </div>
  );
}

export function RowHead({ showValue = false }: { showValue?: boolean }) {
  return (
    <div
      className={`hidden border-b border-[var(--arth-ink)] py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--arth-slate)] lg:grid ${cols(showValue)}`}
    >
      <span>Customer</span>
      <span>Vehicle</span>
      <span>Source</span>
      <span>Stage</span>
      <span>Last activity</span>
      <span>Next action</span>
      {showValue ? <span className="text-right">Value</span> : null}
      <span>Actions</span>
    </div>
  );
}
