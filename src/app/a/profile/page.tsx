import { asPlatform } from "@/db/session";
import { RuleHeading } from "@/components/brand/type";
import { LeaveFloor } from "@/components/leave-floor";

export default async function AdvitoProfilePage() {
  return asPlatform(async (_tx, seat) => (
    <div className="space-y-6">
      <RuleHeading>My profile</RuleHeading>
      <div className="max-w-lg space-y-3 border border-[var(--arth-n10)] bg-[var(--arth-n00)] p-6">
        <p><span className="text-[var(--arth-n60)]">Name </span>{seat.name}</p>
        <p><span className="text-[var(--arth-n60)]">Seat </span>{seat.roleLabel}</p>
        <p><span className="text-[var(--arth-n60)]">Opens on </span>Dealers</p>
        <p><span className="text-[var(--arth-n60)]">Username </span><span className="font-data">{seat.username}</span></p>
        <p className="text-sm text-[var(--arth-n60)]">
          {seat.roleKey === "adv_admin"
            ? "Admin control can onboard dealers and enter one dealer at a time to inspect the floor."
            : "Support enters one dealer at a time to fix a floor problem. Support cannot onboard and cannot see Advito commercial terms."}
        </p>
        <LeaveFloor />
      </div>
    </div>
  ));
}
