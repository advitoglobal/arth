import type { ReactNode } from "react";
import { currentSeat } from "@/db/session";
import { FloorNav } from "@/components/floor-nav";
import { OfflineBar } from "@/components/offline-bar";

export default async function FloorLayout({
  children,
}: {
  children: ReactNode;
}) {
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
