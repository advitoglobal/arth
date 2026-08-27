import Link from "next/link";
import { asPlatform, canOpen } from "@/db/session";
import { listPlatformDealers } from "@/services/platform";
import { RuleHeading } from "@/components/brand/type";
import { Forbidden } from "@/components/forbidden";
import { ActionButton } from "@/components/action-button";

export default async function DealersPage() {
  return asPlatform(async (tx, seat) => {
    if (!canOpen(seat.roleKey, "adealers")) {
      return <Forbidden landing="/w/login" />;
    }
    const dealers = await listPlatformDealers(tx);
    return (
      <div className="space-y-6">
        <RuleHeading>Dealers</RuleHeading>
        <p className="max-w-[68ch] text-[var(--arth-n60)]">
          Advito onboards dealers onto Arth. Each dealer is a wall. Opening a dealer shows that dealer only. Support cannot onboard. Admin cannot see two dealers' enquiries on one screen.
        </p>
        {seat.roleKey === "adv_admin" ? (
          <ActionButton href="/a/onboard">Onboard a dealer</ActionButton>
        ) : (
          <p className="text-sm text-[var(--arth-n60)]">
            Support enters one dealer to fix a floor problem. Every entry is written to the Advito log. Pricing is not on this seat.
          </p>
        )}
        {dealers.length === 0 ? (
          <p>No dealers are on the product yet.</p>
        ) : (
          <ul className="divide-y divide-[var(--arth-n10)] border border-[var(--arth-n10)] bg-[var(--arth-n00)]">
            {dealers.map((d) => (
              <li key={d.id} className="flex flex-wrap items-baseline justify-between gap-2 px-4 py-3">
                <div>
                  <Link href={`/a/dealers/${d.id}`} className="font-semibold underline-offset-2 hover:underline">
                    {d.name}
                  </Link>
                  <p className="text-sm text-[var(--arth-n60)]">
                    {d.status} · {d.branch_count} branch · {d.seat_count} seats
                  </p>
                </div>
                <span className="font-data text-sm text-[var(--arth-n60)]">{d.plan_key}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  });
}
