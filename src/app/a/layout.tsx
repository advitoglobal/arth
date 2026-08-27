import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { currentSeat, viewTenantId } from "@/db/session";
import { hasDemoSession, isPlatformRole } from "@/lib/seats";
import { isSessionGuardError } from "@/db/with-tenant";
import { PlatformNav } from "@/components/platform-nav";
import { OfflineBar } from "@/components/offline-bar";
import type { ReactNode } from "react";

export default async function AdvitoLayout({ children }: { children: ReactNode }) {
  const jar = await cookies();
  const path = (await headers()).get("x-arth-path") ?? "";
  if (!hasDemoSession(jar.get("arth_seat")?.value)) {
    redirect("/w/login");
  }

  let seat;
  try {
    seat = await currentSeat();
  } catch (err) {
    if (isSessionGuardError(err)) redirect("/w/login");
    throw err;
  }
  if (!isPlatformRole(seat.roleKey)) {
    redirect("/w/denied");
  }

  const viewing = path.startsWith("/a/dealers/") ? await viewTenantId() : await viewTenantId();

  return (
    <div className="flex min-h-full flex-col bg-[var(--arth-n05)] lg:flex-row">
      <PlatformNav seat={seat} viewing={viewing} />
      <div className="min-w-0 flex-1">
        <OfflineBar />
        <div className="px-4 py-6 lg:px-8 lg:py-8">{children}</div>
      </div>
    </div>
  );
}
