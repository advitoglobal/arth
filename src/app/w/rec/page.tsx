import { forbidden } from "next/navigation";
import { asSeat, canOpen } from "@/db/session";
import { getLead } from "@/services/telecalling";
import { RuleHeading } from "@/components/brand/type";

export default async function RecPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id } = await searchParams;
  return asSeat(async (tx, seat) => {
    if (!canOpen(seat.roleKey, "rec")) forbidden();
    if (!id) {
      return <p>Open a record from a row. It is not a menu item.</p>;
    }
    const { lead, events } = await getLead(tx, id);
    if (!lead) {
      return <p>This enquiry is not in your tenant.</p>;
    }
    return (
      <div className="space-y-6">
        <RuleHeading>Enquiry record</RuleHeading>
        <div className="border border-[var(--arth-n10)] bg-[var(--arth-n00)] p-6">
          <p className="font-display text-[28px] font-semibold">{lead.customer_name}</p>
          <p className="font-data">{lead.phone}</p>
          <p className="mt-2 text-sm">
            {lead.model_interest} · stage {lead.stage_key}
          </p>
        </div>
        <h2 className="font-display text-[20px] font-semibold">Activity ledger</h2>
        <ul className="border border-[var(--arth-n10)] bg-[var(--arth-n00)]">
          {events.map((ev) => (
            <li key={String(ev.id)} className="border-b border-[var(--arth-n10)] px-4 py-3 text-sm">
              <span className="font-data">{new Date(String(ev.created_at)).toLocaleString("en-IN")}</span>
              {" · "}
              {String(ev.actor_type)} · {String(ev.event_type)}
              {ev.note ? ` · ${String(ev.note)}` : ""}
            </li>
          ))}
        </ul>
      </div>
    );
  });
}
