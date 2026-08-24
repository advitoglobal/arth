import { forbidden } from "next/navigation";
import { canOpen, currentSeat } from "@/db/session";
import { RuleHeading } from "@/components/brand/type";

export default async function ProfilePage() {
  const seat = await currentSeat();
  if (!canOpen(seat.roleKey, "profile")) forbidden();
  return (
    <div className="space-y-6">
      <RuleHeading>My profile</RuleHeading>
      <div className="max-w-md space-y-3 border border-[var(--arth-n10)] bg-[var(--arth-n00)] p-6">
        <p><span className="text-[var(--arth-n60)]">Name</span> {seat.name}</p>
        <p><span className="text-[var(--arth-n60)]">Seat</span> {seat.roleLabel}</p>
        <p><span className="text-[var(--arth-n60)]">Landing</span> {seat.workspaceKey}</p>
        <p><span className="text-[var(--arth-n60)]">Tenant</span> {seat.tenantName}</p>
      </div>
    </div>
  );
}
