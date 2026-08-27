import Link from "next/link";
import { ArthWordmark } from "@/components/brand/logo";
import { LeaveFloor } from "@/components/leave-floor";
import { FloorLinks } from "@/components/floor-links";
import type { Seat } from "@/lib/seats";

export function PlatformNav({
  seat,
  viewing,
}: {
  seat: Seat;
  viewing?: string | null;
}) {
  const items = [
    { href: "/a/dealers", label: "Dealers" },
    ...(seat.roleKey === "adv_admin" ? [{ href: "/a/onboard", label: "Onboard a dealer" }] : []),
    { href: "/a/profile", label: "My profile" },
  ];
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
          Advito
        </p>
        <p className="mb-6 mt-1 text-sm">
          {seat.roleKey === "adv_admin" ? "Admin control" : "Support"}
        </p>
        <nav className="flex flex-col gap-1">
          <FloorLinks items={items} invert />
        </nav>
        {viewing ? (
          <p className="mt-6 text-[12.5px] text-[var(--arth-n40)]">In dealer: one at a time. Leave dealer before opening another.</p>
        ) : null}
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
        <nav className="mt-3 grid grid-cols-2 gap-2">
          <FloorLinks items={items} invert />
        </nav>
      </div>
    </>
  );
}
