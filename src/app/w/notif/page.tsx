import { asSeat, canOpen } from "@/db/session";
import { listNotifications, raiseFirstResponseBreaches } from "@/services/telecalling";
import { RuleHeading } from "@/components/brand/type";
import { Forbidden } from "@/components/forbidden";
import { NotificationCard, MarkAllRead } from "@/components/notification-open";
import { FigureSource } from "@/components/figure-source";

export default async function NotifPage() {
  return asSeat(async (tx, seat) => {
    if (!canOpen(seat.roleKey, "notif")) return <Forbidden />;
    await raiseFirstResponseBreaches(tx, seat.userId);
    const rows = await listNotifications(tx, seat.userId);
    return (
      <div className="space-y-6">
        <RuleHeading>Notifications</RuleHeading>
        <p className="text-sm text-[var(--arth-n60)]">
          Every one says why you got it. The row opens the enquiry.
        </p>
        <FigureSource source="your notifications" period="unread and read, newest first" />
        {rows.length === 0 ? (
          <p>No notifications. New ones appear when an enquiry you own needs you.</p>
        ) : (
          <>
            {rows.some((n) => !n.read_at) ? <MarkAllRead /> : null}
            <ul className="border border-[var(--arth-n10)] bg-[var(--arth-n00)]">
            {rows.map((n) => (
              <NotificationCard
                key={String(n.id)}
                id={String(n.id)}
                href={n.href ? String(n.href) : null}
                title={String(n.title)}
                why={String(n.why)}
                read={Boolean(n.read_at)}
              />
            ))}
            </ul>
          </>
        )}
      </div>
    );
  });
}
