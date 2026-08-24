import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { canOpen, currentSeat } from "@/db/session";
import { RuleHeading } from "@/components/brand/type";
import { Button } from "@/components/ui/button";
import { Forbidden } from "@/components/forbidden";

async function leave() {
  "use server";
  const jar = await cookies();
  jar.delete("arth_seat");
  jar.delete("arth_tenant");
  redirect("/w/login");
}

export default async function ProfilePage() {
  const seat = await currentSeat();
  if (!canOpen(seat.roleKey, "profile")) return <Forbidden />;
  return (
    <div className="space-y-6">
      <RuleHeading>My profile</RuleHeading>
      <div className="max-w-md space-y-3 border border-[var(--arth-n10)] bg-[var(--arth-n00)] p-6">
        <p><span className="text-[var(--arth-n60)]">Name </span>{seat.name}</p>
        <p><span className="text-[var(--arth-n60)]">Seat </span>{seat.roleLabel}</p>
        <p><span className="text-[var(--arth-n60)]">Landing </span>{seat.workspaceKey}</p>
        <p><span className="text-[var(--arth-n60)]">Tenant </span>{seat.tenantName}</p>
        <p className="text-sm text-[var(--arth-n60)]">
          Demo session. Production uses a server session and SSO.
        </p>
        <form action={leave}>
          <Button type="submit" variant="outline" className="mt-2">
            Leave this floor
          </Button>
        </form>
      </div>
    </div>
  );
}
