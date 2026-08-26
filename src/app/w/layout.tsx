import { cookies, headers } from "next/headers";
import { currentSeat, asSeat, canOpen } from "@/db/session";
import { FloorNav } from "@/components/floor-nav";
import { OfflineBar } from "@/components/offline-bar";
import { hasDemoSession } from "@/lib/seats";
import { countUnread, raiseFirstResponseBreaches } from "@/services/telecalling";
import type { ReactNode } from "react";

function isPublicFloorPath(path: string) {
  return path === "/w/login" || path === "/w/denied";
}

export default async function FloorLayout({
  children,
}: {
  children: ReactNode;
}) {
  const jar = await cookies();
  const path = (await headers()).get("x-arth-path") ?? "";
  const signedIn = hasDemoSession(jar.get("arth_seat")?.value);

  if (!signedIn || isPublicFloorPath(path)) {
    return (
      <div className="min-h-full bg-[var(--arth-n05)]">
        <div className="px-8 py-8">{children}</div>
      </div>
    );
  }

  const seat = await currentSeat();
  const unread = canOpen(seat.roleKey, "notif")
    ? await asSeat(async (tx, s) => {
        if (s.roleKey === "tele") await raiseFirstResponseBreaches(tx, s.userId);
        return countUnread(tx, s.userId);
      })
    : 0;

  return (
    <div className="flex min-h-full flex-col bg-[var(--arth-n05)] lg:flex-row">
      <FloorNav seat={seat} unread={unread} />
      <div className="min-w-0 flex-1">
        <OfflineBar />
        <div className="px-4 py-6 lg:px-8 lg:py-8">{children}</div>
      </div>
    </div>
  );
}
