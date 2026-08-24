"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  LayoutDashboard,
  Target,
  GitBranch,
  Gavel,
  ShieldCheck,
  Menu,
} from "lucide-react";
import { ArthWordmark } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { TENANT } from "@/lib/arth-data";

const links = [
  { href: "/workspace", label: "Overview", icon: LayoutDashboard },
  { href: "/workspace/outcomes", label: "Outcomes", icon: Target },
  { href: "/workspace/workstreams", label: "Workstreams", icon: GitBranch },
  { href: "/workspace/decisions", label: "Decisions", icon: Gavel },
  { href: "/workspace/status", label: "Director status", icon: ShieldCheck },
];

function NavLinks({ role, onNavigate }: { role: string; onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1">
      {links.map((item) => {
        const active =
          item.href === "/workspace"
            ? pathname === "/workspace"
            : pathname.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={`${item.href}?role=${role}`}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
              active
                ? "bg-accent text-foreground"
                : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
            )}
          >
            <Icon className="size-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function WorkspaceNav() {
  const params = useSearchParams();
  const role = params.get("role") === "director" ? "director" : "client";

  return (
    <>
      <aside className="hidden w-64 shrink-0 border-r border-border bg-sidebar p-5 lg:flex lg:flex-col">
        <Link href="/" className="mb-8">
          <ArthWordmark />
        </Link>
        <p className="mb-1 text-xs uppercase tracking-[0.16em] text-muted-foreground">
          Tenant
        </p>
        <p className="mb-6 font-medium">{TENANT.name}</p>
        <NavLinks role={role} />
        <div className="mt-auto space-y-3 pt-8">
          <Badge variant="outline">{role === "director" ? "Director" : "Client"}</Badge>
          <p className="text-xs leading-relaxed text-muted-foreground">
            Demo workspace. Data is local, tenant-scoped, and not persisted.
          </p>
        </div>
      </aside>

      <div className="flex items-center justify-between border-b border-border px-4 py-3 lg:hidden">
        <Link href="/">
          <ArthWordmark />
        </Link>
        <Sheet>
          <SheetTrigger render={<Button variant="outline" size="icon" />}>
            <Menu />
            <span className="sr-only">Open menu</span>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-5">
            <SheetHeader>
              <SheetTitle>Arth</SheetTitle>
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
