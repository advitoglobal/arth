"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Menu } from "lucide-react";
import { ArthWordmark } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { TENANT, enquiries } from "@/lib/arth-data";

function links(role: string) {
  const overdue = enquiries.filter((e) => e.semantic === "overdue").length;
  const unassigned = 4;
  const due = enquiries.filter((e) => e.dueIn).length;

  if (role === "principal") {
    return [
      { href: "/workspace", label: "The Exception Cockpit", count: null },
      { href: "/workspace/spend", label: "Cost per booking", count: null },
      { href: "/workspace/queue", label: "Overdue", count: overdue },
    ];
  }

  return [
    { href: "/workspace/queue", label: "My queue", count: enquiries.length },
    { href: "/workspace/queue", label: "Unassigned", count: unassigned, hash: "unassigned" },
    { href: "/workspace/queue", label: "Follow-ups due", count: due },
    { href: "/workspace/queue", label: "Overdue", count: overdue },
  ];
}

function NavLinks({
  role,
  onNavigate,
}: {
  role: string;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const items = links(role);

  return (
    <nav className="flex flex-col gap-1">
      {items.map((item) => {
        const active =
          item.label === "The Exception Cockpit"
            ? pathname === "/workspace"
            : item.label === "Cost per booking"
              ? pathname.startsWith("/workspace/spend")
              : pathname.startsWith("/workspace/queue");
        return (
          <Link
            key={item.label}
            href={`${item.href}?role=${role}`}
            onClick={onNavigate}
            className={cn(
              "flex items-center justify-between rounded-[3px] px-3 py-2 text-sm",
              active
                ? "bg-[var(--arth-n90)] text-[var(--arth-n00)]"
                : "text-[var(--arth-n20)] hover:bg-[var(--arth-n90)] hover:text-[var(--arth-n00)]",
            )}
          >
            <span>{item.label}</span>
            {item.count !== null && (
              <span className="font-data text-[12.5px] tabular-nums">
                {item.count}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}

export function WorkspaceNav() {
  const params = useSearchParams();
  const role = params.get("role") === "principal" ? "principal" : "telecaller";

  return (
    <>
      <aside className="hidden w-[240px] shrink-0 bg-[var(--arth-ink)] p-5 text-[var(--arth-n00)] lg:flex lg:flex-col">
        <Link href="/" className="mb-8 block py-2">
          <ArthWordmark invert />
        </Link>
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--arth-brass-lift)]">
          {TENANT.workspace}
        </p>
        <p className="mb-6 mt-1 text-sm">{TENANT.name}</p>
        <NavLinks role={role} />
        <p className="mt-auto pt-8 text-[12.5px] leading-relaxed text-[var(--arth-n40)]">
          Demo. Records are local and not persisted.
        </p>
      </aside>

      <div className="flex items-center justify-between border-b border-[var(--arth-n10)] bg-[var(--arth-n00)] px-4 py-3 lg:hidden">
        <Link href="/">
          <ArthWordmark />
        </Link>
        <Sheet>
          <SheetTrigger
            render={<Button variant="outline" size="icon" className="size-11" />}
          >
            <Menu strokeWidth={1.5} />
            <span className="sr-only">Open menu</span>
          </SheetTrigger>
          <SheetContent side="left" className="w-[240px] bg-[var(--arth-ink)] p-5 text-[var(--arth-n00)]">
            <SheetHeader>
              <SheetTitle className="text-[var(--arth-n00)]">arth</SheetTitle>
            </SheetHeader>
            <div className="mt-6">
              <NavLinks role={role} />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
