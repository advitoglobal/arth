import { asSeat, canOpen } from "@/db/session";
import { listDelivery } from "@/services/delivery";
import { DeliveryBoard } from "@/components/delivery-board";
import { RuleHeading } from "@/components/brand/type";
import { Forbidden } from "@/components/forbidden";
import { FigureSource } from "@/components/figure-source";

export default async function DeliveryPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id } = await searchParams;
  return asSeat(async (tx, seat) => {
    if (!canOpen(seat.roleKey, "delivery")) return <Forbidden screen="delivery" />;
    if (!id) {
      const booked = await tx<{ id: string; customer_name: string }[]>`
        SELECT l.id::text, c.full_name AS customer_name
        FROM leads l JOIN customers c ON c.id = l.customer_id
        WHERE l.stage_key IN ('booked', 'delivered')
          AND COALESCE(l.is_not_enquiry, false) = false
        ORDER BY l.created_at DESC
        LIMIT 40
      `;
      return (
        <div className="space-y-4">
          <RuleHeading>Delivery chain</RuleHeading>
          <p className="max-w-[68ch] text-sm text-[var(--arth-n60)]">
            Twelve steps, three lanes. The promised date is the longest path. Every movement writes a new promise row. A date cannot be typed without a reason.
          </p>
          <FigureSource source="booked and delivered enquiries at this dealer" period="open chain" />
          {booked.length === 0 ? (
            <p>No bookings yet. Book a car on the enquiry record first.</p>
          ) : (
            <ul className="divide-y divide-[var(--arth-n10)] border border-[var(--arth-n10)] bg-[var(--arth-n00)]">
              {booked.map((row) => (
                <li key={row.id} className="px-4 py-3">
                  <a className="hover:underline" href={`/w/delivery?id=${row.id}`}>
                    {row.customer_name}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      );
    }
    const data = await listDelivery(tx, id);
    return (
      <div className="space-y-6">
        <RuleHeading>Delivery chain</RuleHeading>
        <FigureSource source="delivery_steps and delivery_promises for this enquiry" period="full ledger" />
        <DeliveryBoard
          leadId={id}
          steps={data.steps}
          promises={data.promises}
          trackingToken={data.trackingToken}
        />
      </div>
    );
  });
}
