import Link from "next/link";
import { inr } from "@/lib/format";
import type { LeadRow } from "@/services/telecalling";

function eventDate(row: LeadRow) {
  if (!row.last_event_at) return "No activity recorded";
  const d = new Date(row.last_event_at).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
  });
  return `${row.last_event ?? "Activity"} · ${d}`;
}

function nextDue(row: LeadRow): { text: string; overdue: boolean } {
  if (!row.next_action_at) return { text: "No next action", overdue: false };
  const due = new Date(row.next_action_at);
  const d = due.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
  const overdue = due.getTime() < Date.now();
  return {
    text: `Follow-up due · ${d}`,
    overdue,
  };
}

export function EnquiryRow({
  row,
  showBand,
}: {
  row: LeadRow;
  showBand: boolean;
}) {
  const next = nextDue(row);
  return (
    <div className="grid grid-cols-1 gap-2 border-b border-[var(--arth-n10)] px-4 py-3 lg:grid-cols-[repeat(9,minmax(0,1fr))] lg:items-center">
      <div className="min-w-0">
        <p className="truncate font-semibold" title={row.customer_name}>{row.customer_name}</p>
        <p className="font-data truncate text-[12.5px] text-[var(--arth-n60)]">{row.phone}</p>
      </div>
      <div className="min-w-0">
        <p className="truncate">{row.model_interest}</p>
        <p className="truncate text-[12.5px] text-[var(--arth-n60)]">{row.variant_interest}</p>
      </div>
      <div className="min-w-0">
        <p className="truncate">{row.source_key}</p>
        <p className="truncate text-[12.5px] text-[var(--arth-n60)]">{row.source_detail}</p>
      </div>
      <div className="min-w-0">
        <p className="truncate">{row.stage_label}</p>
        <p className="truncate text-[12.5px] text-[var(--arth-n60)]">
          {row.stage_order ? `${row.stage_order} of 9` : ""}
        </p>
      </div>
      <div className="min-w-0 truncate text-[12.5px]">{eventDate(row)}</div>
      <div
        className={
          next.overdue
            ? "min-w-0 truncate font-semibold text-[var(--arth-overdue)]"
            : "min-w-0 truncate font-medium"
        }
      >
        {next.text}
      </div>
      <div className="min-w-0 truncate">{showBand ? row.difficulty_band : ""}</div>
      <div className="arth-num min-w-0 truncate font-data">{inr(Number(row.expected_value_paise) / 100)}</div>
      <div className="flex gap-2">
        <Link className="text-sm underline" href={`/w/tele?id=${row.id}`}>
          Call
        </Link>
        <Link className="text-sm underline" href={`/w/rec?id=${row.id}`}>
          Record
        </Link>
      </div>
    </div>
  );
}

export function RowHead() {
  return (
    <div className="hidden grid-cols-[repeat(9,minmax(0,1fr))] gap-2 border-b border-[var(--arth-ink)] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--arth-slate)] lg:grid">
      <span>Customer</span>
      <span>Vehicle</span>
      <span>Source</span>
      <span>Stage</span>
      <span>Last activity</span>
      <span>Next action</span>
      <span>Band</span>
      <span className="text-right">Value</span>
      <span>Actions</span>
    </div>
  );
}
