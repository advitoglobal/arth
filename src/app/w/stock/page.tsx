import { asSeat, canOpen } from "@/db/session";
import { listStock } from "@/services/conversion";
import { RuleHeading } from "@/components/brand/type";
import { Forbidden } from "@/components/forbidden";
import { StockRelease } from "@/components/stock-release";

export default async function StockPage() {
  return asSeat(async (tx, seat) => {
    if (!canOpen(seat.roleKey, "stock")) return <Forbidden screen="stock" />;
    const rows = await listStock(tx);
    const canRelease = ["salesmgr", "owner", "gm", "admin"].includes(seat.roleKey);
    return (
      <div className="space-y-6">
        <RuleHeading>Stock</RuleHeading>
        <p className="text-sm text-[var(--arth-n60)]">
          Sales decides which car is booked and when it delivers. A booked unit stays booked until a sales manager releases it.
        </p>
        {rows.length === 0 ? (
          <p>No stock units on this dealer.</p>
        ) : (
          <ul className="divide-y divide-[var(--arth-n10)] border border-[var(--arth-n10)] bg-[var(--arth-n00)]">
            {rows.map((s) => (
              <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
                <span>
                  {s.model} {s.variant} · {s.colour}
                  <span className="ml-2 font-data text-sm text-[var(--arth-n60)]">{s.vin}</span>
                </span>
                <span className="text-sm">{s.status}</span>
              </li>
            ))}
          </ul>
        )}
        {canRelease ? <StockRelease rows={rows.filter((r) => r.status === "booked")} /> : (
          <p className="text-sm text-[var(--arth-n60)]">Ask the sales manager to release a cancelled booking.</p>
        )}
      </div>
    );
  });
}
