import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { currentSeat } from "@/db/session";
import { FloorNav } from "@/components/floor-nav";
import { OfflineBar } from "@/components/offline-bar";
import { hasDemoSession } from "@/lib/seats";

export default async function FloorLayout({
  children,
}: {
  children: ReactNode;
}) {
  const jar = await cookies();
  if (!hasDemoSession(jar.get("arth_seat")?.value, jar.get("arth_tenant")?.value)) {
    return (
      <div className="min-h-full bg-[var(--arth-n05)]">
        <div className="px-8 py-8">{children}</div>
      </div>
    );
  }

  const seat = await currentSeat();
  return (
    <div className="flex min-h-full flex-col bg-[var(--arth-n05)] lg:flex-row">
      <FloorNav seat={seat} />
      <div className="min-w-0 flex-1">
        <OfflineBar />
        <div className="px-8 py-8">{children}</div>
      </div>
    </div>
  );
}
