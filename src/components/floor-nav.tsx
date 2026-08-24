import Link from "next/link";
import { ArthWordmark } from "@/components/brand/logo";
import { canOpen, type Seat } from "@/db/session";

const items = [
  { href: "/w/dayb", screen: "dayb", label: "Today" },
  { href: "/w/tele", screen: "tele", label: "On a call" },
  { href: "/w/pipe", screen: "pipe", label: "My enquiries" },
  { href: "/w/search", screen: "search", label: "Search" },
  { href: "/w/notif", screen: "notif", label: "Notifications" },
  { href: "/w/profile", screen: "profile", label: "My profile" },
];

export function FloorNav({ seat }: { seat: Seat }) {
  const visible = items.filter((item) => canOpen(seat.roleKey, item.screen));
  return (
    <>
      <aside className="hidden w-[240px] shrink-0 bg-[var(--arth-ink)] p-5 text-[var(--arth-n00)] lg:flex lg:flex-col">
        <Link href="/" className="mb-8 block py-2">
          <ArthWordmark invert />
        </Link>
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--arth-brass-lift)]">
          {seat.roleKey === "tele" ? "Telecalling" : "Sales"}
        </p>
        <p className="mb-6 mt-1 text-sm">{seat.tenantName}</p>
        <nav className="flex flex-col gap-1">
          {visible.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-[3px] px-3 py-2 text-sm text-[var(--arth-n20)] hover:bg-[var(--arth-n90)] hover:text-[var(--arth-n00)]"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <p className="mt-auto pt-8 text-[12.5px] text-[var(--arth-n40)]">
          {seat.name} · {seat.roleLabel}
        </p>
      </aside>
      <div className="border-b border-[var(--arth-n10)] bg-[var(--arth-ink)] px-4 py-3 text-[var(--arth-n00)] lg:hidden">
        <Link href="/" className="block w-fit">
          <ArthWordmark invert />
        </Link>
        <p className="mt-2 text-[12.5px] text-[var(--arth-n40)]">
          {seat.name} · {seat.roleLabel}
        </p>
        <nav className="mt-3 flex flex-wrap gap-3">
          {visible.map((item) => (
            <Link key={item.href} href={item.href} className="text-sm underline">
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </>
  );
}
