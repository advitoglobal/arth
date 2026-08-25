import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { asSeat, canOpen } from "@/db/session";
import { branchHoursForUser } from "@/services/telecalling";
import { RuleHeading } from "@/components/brand/type";
import { Button } from "@/components/ui/button";
import { Forbidden } from "@/components/forbidden";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

async function leave() {
  "use server";
  const jar = await cookies();
  jar.set("arth_seat", "", { httpOnly: true, sameSite: "lax", path: "/", maxAge: 0 });
  jar.set("arth_tenant", "", { httpOnly: true, sameSite: "lax", path: "/", maxAge: 0 });
  redirect("/w/login");
}

export default async function ProfilePage() {
  return asSeat(async (tx, seat) => {
    if (!canOpen(seat.roleKey, "profile")) return <Forbidden />;
    const hours = await branchHoursForUser(tx, seat.userId);
    const branch = hours[0]?.branch ?? seat.tenantName;
    return (
      <div className="space-y-6">
        <RuleHeading>My profile</RuleHeading>
        <div className="max-w-lg space-y-3 border border-[var(--arth-n10)] bg-[var(--arth-n00)] p-6">
          <p><span className="text-[var(--arth-n60)]">Name </span>{seat.name}</p>
          <p><span className="text-[var(--arth-n60)]">Seat </span>{seat.roleLabel}</p>
          <p><span className="text-[var(--arth-n60)]">Opens on </span>{seat.workspaceKey === "dayb" ? "Today" : seat.workspaceKey === "pipe" ? "My enquiries" : "Log a call"}</p>
          <p><span className="text-[var(--arth-n60)]">Tenant </span>{seat.tenantName}</p>
          <p><span className="text-[var(--arth-n60)]">Branch </span>{branch}</p>
          <p className="text-sm text-[var(--arth-n60)]">
            Demo session. Production uses a server session and SSO.
          </p>
          <form action={leave}>
            <Button type="submit" variant="outline" className="mt-2 h-9 rounded-[3px]">
              Log out
            </Button>
          </form>
        </div>
        <div className="max-w-lg border border-[var(--arth-n10)] bg-[var(--arth-n00)] p-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--arth-slate)]">
            Working hours
          </p>
          <p className="mt-2 text-sm text-[var(--arth-n60)]">
            Source: branch hours for {branch}. A call due after close waits until the next open.
          </p>
          <ul className="mt-4 space-y-1 font-data text-sm">
            {hours.length === 0 ? (
              <li>Hours are not on file for this branch. Clocks cannot be trusted until they are.</li>
            ) : (
              hours.map((h) => (
                <li key={h.day_of_week}>
                  {DAYS[h.day_of_week] ?? h.day_of_week}
                  {" · "}
                  {h.opens_at && h.closes_at
                    ? `${String(h.opens_at).slice(0, 5)} to ${String(h.closes_at).slice(0, 5)}`
                    : "Closed"}
                </li>
              ))
            )}
          </ul>
        </div>
      </div>
    );
  });
}
