import { asSeat, canOpen } from "@/db/session";
import { listTestDrives } from "@/services/conversion";
import { RuleHeading } from "@/components/brand/type";
import { Forbidden } from "@/components/forbidden";
import { istDateTime } from "@/lib/format";

export default async function DrivePage() {
  return asSeat(async (tx, seat) => {
    if (!canOpen(seat.roleKey, "drive")) return <Forbidden screen="drive" />;
    const rows = await listTestDrives(tx);
    return (
      <div className="space-y-6">
        <RuleHeading>Test drives</RuleHeading>
        <p className="text-sm text-[var(--arth-n60)]">
          The coordinator owns the car and the slot. Service telecalling does not check whether the demo car is washed.
        </p>
        {rows.length === 0 ? (
          <p>No test drives are booked.</p>
        ) : (
          <ul className="divide-y divide-[var(--arth-n10)] border border-[var(--arth-n10)] bg-[var(--arth-n00)]">
            {rows.map((t) => (
              <li key={t.id} className="px-4 py-3">
                <a className="font-medium hover:underline" href={`/w/rec?id=${t.lead_id}`}>{t.customer_name}</a>
                <p className="font-data text-sm text-[var(--arth-n60)]">
                  {istDateTime(t.slot_at)} · {t.model ?? "Car not allocated"} · {t.status}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  });
}
