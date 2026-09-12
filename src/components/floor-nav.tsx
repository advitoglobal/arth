import Link from "next/link";
import { ArthWordmark } from "@/components/brand/logo";
import { canOpen, type Seat } from "@/db/session";
import { FloorLinks } from "@/components/floor-links";
import { LeaveFloor } from "@/components/leave-floor";

const items = [
  { href: "/w/dayb", screen: "dayb", label: "Today" },
  { href: "/w/new", screen: "new", label: "Add enquiry" },
  { href: "/w/desk", screen: "desk", label: "The floor" },
  { href: "/w/gm", screen: "gm", label: "All departments" },
  { href: "/w/prin", screen: "prin", label: "This dealer" },
  { href: "/w/perf", screen: "perf", label: "Performance" },
  { href: "/w/tele", screen: "tele", label: "Log a call" },
  { href: "/w/msg", screen: "msg", label: "Messages" },
  { href: "/w/pipe", screen: "pipe", label: "My enquiries" },
  { href: "/w/svc", screen: "svc", label: "Service" },
  { href: "/w/ins", screen: "ins", label: "Insurance" },
  { href: "/w/stock", screen: "stock", label: "Stock" },
  { href: "/w/delivery", screen: "delivery", label: "Delivery" },
  { href: "/w/drive", screen: "drive", label: "Test drives" },
  { href: "/w/search", screen: "search", label: "Search" },
  { href: "/w/bot", screen: "bot", label: "Arthbot" },
  { href: "/w/notif", screen: "notif", label: "Notifications" },
  { href: "/w/admin", screen: "admin", label: "Dealer setup" },
  { href: "/w/books", screen: "books", label: "Accounts" },
  { href: "/w/profile", screen: "profile", label: "My profile" },
];

export function FloorNav({
  seat,
  unread = 0,
}: {
  seat: Seat;
  unread?: number;
}) {
  const visible = items
    .filter((item) => canOpen(seat.roleKey, item.screen))
    .map(({ href, label, screen }) => ({
      href,
      label:
        screen === "notif" && unread > 0 ? `${label} · ${unread}` : label,
    }));
  return (
    <>
      <aside className="hidden w-[240px] shrink-0 bg-[var(--arth-ink)] p-5 text-[var(--arth-n00)] lg:flex lg:flex-col">
        <div className="mb-8 flex items-start justify-between gap-3">
          <Link href="/" className="py-1">
            <ArthWordmark invert />
          </Link>
          <LeaveFloor invert compact />
        </div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--arth-brass-lift)]">
          {seat.roleKey === "tele"
            ? "Telecalling"
            : seat.roleKey === "sales"
              ? "Sales"
              : seat.roleKey === "mgr"
                ? "Digital desk"
                : seat.roleKey === "owner"
                  ? "Dealer principal"
                  : seat.roleKey === "admin"
                    ? "Dealer admin"
                    : seat.roleKey === "acct"
                      ? "Accounts"
                      : seat.roleKey === "svctele"
                        ? "Service telecalling"
                  : seat.roleKey === "gm"
                    ? "General manager"
                    : seat.roleKey === "salesmgr"
                      ? "Sales manager"
                      : seat.roleKey === "svc"
                        ? "Service"
                        : seat.roleKey === "svcmgr"
                          ? "Service manager"
                          : seat.roleKey === "instele"
                            ? "Insurance telecalling"
                            : seat.roleKey === "ins"
                              ? "Insurance"
                              : seat.roleKey === "tdcoord"
                                ? "Test drives"
                  : "Management"}
        </p>
        <p className="mb-6 mt-1 text-sm">{seat.tenantName}</p>
        <nav className="flex flex-col gap-1">
          <FloorLinks items={visible} invert />
        </nav>
        <p className="mt-auto pt-8 text-[12.5px] text-[var(--arth-n40)]">
          {seat.name} · {seat.roleLabel}
        </p>
      </aside>
      <div className="border-b border-[var(--arth-n10)] bg-[var(--arth-ink)] px-4 py-3 text-[var(--arth-n00)] lg:hidden">
        <div className="flex items-start justify-between gap-3">
          <div>
            <Link href="/" className="block w-fit">
              <ArthWordmark invert />
            </Link>
            <p className="mt-2 text-[12.5px] text-[var(--arth-n40)]">
              {seat.name} · {seat.roleLabel}
            </p>
          </div>
          <LeaveFloor invert compact />
        </div>
        <nav className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
          <FloorLinks items={visible} invert />
        </nav>
      </div>
    </>
  );
}
