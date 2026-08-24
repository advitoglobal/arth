import { asSeat, canOpen } from "@/db/session";
import { listNotifications, raiseFirstResponseBreaches } from "@/services/telecalling";
import { RuleHeading } from "@/components/brand/type";
import { Forbidden } from "@/components/forbidden";
import { NotificationOpen } from "@/components/notification-open";

export default async function NotifPage() {
  return asSeat(async (tx, seat) => {
    if (!canOpen(seat.roleKey, "notif")) return <Forbidden />;
    await raiseFirstResponseBreaches(tx, seat.userId);
    const rows = await listNotifications(tx, seat.userId);
    return (
      <div className="space-y-6">
        <RuleHeading>Notifications</RuleHeading>
        <p className="text-sm text-[var(--arth-n60)]">
          Every row says why you got it. Opening it marks it read.
        </p>
        {rows.length === 0 ? (
          <p>No notifications. New ones appear when an enquiry you own needs you.</p>
        ) : (
          <ul className="border border-[var(--arth-n10)] bg-[var(--arth-n00)]">
            {rows.map((n) => (
              <li key={String(n.id)} className="border-b border-[var(--arth-n10)] px-4 py-3">
                <p className="font-medium">{String(n.title)}</p>
                <p className="text-sm text-[var(--arth-n60)]">{String(n.why)}</p>
                <p className="mt-1 text-[12.5px] text-[var(--arth-n60)]">
                  {n.read_at ? "Read" : "Unread"}
                </p>
                {n.href ? (
                  <NotificationOpen id={String(n.id)} href={String(n.href)} />
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  });
}
