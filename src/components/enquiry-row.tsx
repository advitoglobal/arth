import Link from "next/link";
import { ActionButton } from "@/components/action-button";
import { inr, indianMobile } from "@/lib/format";
import { StatusStamp } from "@/components/brand/type";
import { isParked } from "@/domain/clock";
import { sourceLabel, enquiryNo, INTAKE_LABEL } from "@/lib/labels";
import { StageLadder } from "@/components/stage-ladder";
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
    ? "lg:grid-cols-[minmax(9rem,0.9fr)_minmax(7rem,0.7fr)_5rem_auto_minmax(6rem,0.7fr)_minmax(6rem,0.7fr)_minmax(5.5rem,0.55fr)_minmax(11rem,1.35fr)_minmax(10rem,1.2fr)_minmax(0,0.55fr)_6.5rem]"
    : "lg:grid-cols-[minmax(9rem,0.95fr)_minmax(7rem,0.7fr)_5rem_auto_minmax(6rem,0.7fr)_minmax(6rem,0.7fr)_minmax(5.5rem,0.55fr)_minmax(11rem,1.4fr)_minmax(10rem,1.25fr)_6.5rem]";
}

function Field({
  label,
  value,
  sub,
  warn = false,
  wrap = false,
}: {
  label: string;
  value: string;
  sub?: string | null;
  warn?: boolean;
  wrap?: boolean;
}) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--arth-slate)] lg:hidden">
        {label}
      </p>
      <p
        className={`mt-1 text-sm leading-snug lg:mt-0 ${wrap ? "whitespace-normal break-words" : "truncate"} ${warn ? "font-semibold text-[var(--arth-overdue)]" : ""}`}
        title={value}
      >
        {value}
      </p>
      {sub ? (
        <p
          className={`text-[12.5px] text-[var(--arth-n60)] ${wrap ? "whitespace-normal break-words" : "truncate"}`}
          title={sub}
        >
          {sub}
        </p>
      ) : null}
    </div>
  );
}

export function EnquiryRow({
  row,
  canCall,
  showValue = false,
  hideOverdueStamp = false,
}: {
  row: LeadRow;
  showBand?: boolean;
  canCall: boolean;
  showValue?: boolean;
  hideOverdueStamp?: boolean;
}) {
  const next = nextDue(row);
  const parked = isParked(row);
  const firstResponseLate =
    !!row.first_response_due &&
    !row.first_responded_at &&
    new Date(row.first_response_due).getTime() < Date.now();
  const settled = row.stage_key === "delivered";
  const showCall = canCall && !settled && !row.lost_reason_key;
  const number = enquiryNo(row.id);

  return (
    <article
      className={`relative cursor-pointer border border-[var(--arth-n10)] bg-[var(--arth-n00)] p-4 transition-colors hover:bg-[var(--arth-n05)] lg:border-x-0 lg:border-t-0 lg:px-3 lg:py-3 ${cols(showValue)} lg:grid lg:items-start lg:gap-2`}
    >
      <Link
        href={`/w/rec?id=${row.id}`}
        className="absolute inset-0 z-0"
        aria-label={`Open ${row.customer_name}`}
      />
      <div className="flex items-start justify-between gap-3 lg:contents">
        <div className="min-w-0 lg:contents">
          <p className="truncate font-semibold" title={row.customer_name}>
            {row.customer_name}
          </p>
          <div className="mt-2 lg:col-span-full">
            <StageLadder current={row.stage_key} compact />
          </div>
          <p className="font-data mt-1 truncate text-[12.5px] text-[var(--arth-n60)] lg:mt-0">
            {indianMobile(row.phone)}
          </p>
          <p className="font-data truncate text-[12.5px] text-[var(--arth-n60)]">
            {`Enquiry ${number}`}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap justify-end gap-1 lg:justify-start">
          {settled ? <StatusStamp state="settled" /> : null}
          {!settled && !hideOverdueStamp && (next.overdue || firstResponseLate) ? (
            <StatusStamp state="overdue" />
          ) : null}
          {parked ? <StatusStamp state="parked" /> : null}
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 lg:mt-0 lg:contents">
        <Field
          label="Vehicle"
          value={row.model_interest ?? "Not recorded"}
          sub={row.variant_interest}
        />
        <Field
          label="Source"
          value={sourceLabel(row.source_key) || "Not recorded"}
          sub={row.source_detail}
        />
        <Field
          label="Stage"
          value={row.stage_label ?? "Not recorded"}
          sub={
            row.intake_kind
              ? `${INTAKE_LABEL[row.intake_kind] ?? row.intake_kind}${row.pool_open ? " · In pool" : ""}`
              : row.stage_order
                ? `${row.stage_order} of 9`
                : null
          }
        />
        <Field label="Last activity" value={eventDate(row)} wrap />
        <Field label="Next" value={next.text} warn={next.overdue} wrap />
        {showValue ? (
          <Field
            label="Value"
            value={inr(Number(row.expected_value_paise) / 100)}
          />
        ) : null}
      </div>
      <div className="mt-4 lg:mt-0">
        {showCall ? (
          <ActionButton
            href={`/w/tele?id=${row.id}`}
            variant="default"
            className="w-full lg:w-auto"
          >
            Call
          </ActionButton>
        ) : null}
      </div>
    </article>
  );
}

export function RowHead({ showValue = false }: { showValue?: boolean }) {
  return (
    <div
      className={`hidden border-b border-[var(--arth-ink)] bg-[var(--arth-n00)] px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--arth-slate)] lg:grid lg:gap-2 lg:items-start ${cols(showValue)}`}
    >
      <span>Name</span>
      <span>Phone</span>
      <span>Enquiry</span>
      <span>Stamp</span>
      <span>Vehicle</span>
      <span>Source</span>
      <span>Stage</span>
      <span>Last activity</span>
      <span>Next</span>
      {showValue ? <span className="text-right">Value</span> : null}
      <span>Actions</span>
    </div>
  );
}

export function EnquiryList({
  rows,
  canCall,
  showValue = false,
  hideOverdueStamp = false,
}: {
  rows: LeadRow[];
  canCall: boolean | ((row: LeadRow) => boolean);
  showValue?: boolean;
  hideOverdueStamp?: boolean;
}) {
  return (
    <div className="space-y-3 lg:space-y-0 lg:border lg:border-[var(--arth-n10)] lg:bg-[var(--arth-n00)]">
      <RowHead showValue={showValue} />
      {rows.map((row) => (
        <EnquiryRow
          key={row.id}
          row={row}
          canCall={typeof canCall === "function" ? canCall(row) : canCall}
          showValue={showValue}
          hideOverdueStamp={hideOverdueStamp}
        />
      ))}
    </div>
  );
}
