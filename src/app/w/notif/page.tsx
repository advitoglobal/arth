import { forbidden } from "next/navigation";
import { asSeat, canOpen } from "@/db/session";
import { listNotifications } from "@/services/telecalling";
import { RuleHeading } from "@/components/brand/type";
import Link from "next/link";

export default async function NotifPage() {
  return asSeat(async (tx, seat) => {
    if (!canOpen(seat.roleKey, "notif")) forbidden();
    const rows = await listNotifications(tx, seat.userId);
    return (
      <div className="space-y-6">
        <RuleHeading>Notifications</RuleHeading>
        {rows.length === 0 ? (
          <p>No notifications. New ones appear when an enquiry you own needs you.</p>
        ) : (
          <ul className="border border-[var(--arth-n10)] bg-[var(--arth-n00)]">
            {rows.map((n) => (
              <li key={String(n.id)} className="border-b border-[var(--arth-n10)] px-4 py-3">
                <p className="font-medium">{String(n.title)}</p>
                <p className="text-sm text-[var(--arth-n60)]">{String(n.why)}</p>
                {n.href ? (
                  <Link className="text-sm underline" href={String(n.href)}>
                    Open
                  </Link>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  });
}
