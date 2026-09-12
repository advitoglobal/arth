import { asSeat, canOpen } from "@/db/session";
import { branchHoursForUser } from "@/services/telecalling";
import { RuleHeading } from "@/components/brand/type";
import { LeaveFloor } from "@/components/leave-floor";
import { Forbidden } from "@/components/forbidden";
import { landingPath } from "@/lib/seats";
import { ScoreWallet } from "@/components/score-wallet";
import { ProfileForm } from "@/components/register-forms";
import { unofficialScoresCopy, pointsAreOfficial } from "@/vendors/status";
import { walletMovements } from "@/services/floor-register";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default async function ProfilePage() {
  return asSeat(async (tx, seat) => {
    if (!canOpen(seat.roleKey, "profile")) return <Forbidden screen="profile" />;
    const hours = await branchHoursForUser(tx, seat.userId);
    const branch = hours[0]?.branch ?? seat.tenantName;
    const wallet = await walletMovements(tx, seat.userId);
    const [me] = await tx<{ whatsapp_phone: string | null }[]>`
      SELECT whatsapp_phone FROM users WHERE id = ${seat.userId}::uuid
    `;
    return (
      <div className="space-y-6">
        <RuleHeading>My profile</RuleHeading>
        <div className="max-w-lg space-y-3 border border-[var(--arth-n10)] bg-[var(--arth-n00)] p-6">
          <p><span className="text-[var(--arth-n60)]">Seat </span>{seat.roleLabel}</p>
          <p><span className="text-[var(--arth-n60)]">Opens on </span>{landingPath(seat)}</p>
          <p><span className="text-[var(--arth-n60)]">Tenant </span>{seat.tenantName}</p>
          <p><span className="text-[var(--arth-n60)]">Branch </span>{branch}</p>
          <p><span className="text-[var(--arth-n60)]">Username </span><span className="font-data">{seat.username}</span></p>
          <LeaveFloor />
        </div>
        <ProfileForm fullName={seat.name} whatsappPhone={me?.whatsapp_phone ?? ""} />
        <div className="max-w-lg space-y-3">
          <h2 className="font-display text-[20px] font-semibold">Score wallet</h2>
          <p className="text-sm text-[var(--arth-n60)]">
            Each movement names the action. The wallet never shows a total that jumps. Connected under 20 seconds scores nothing. Penalties are for concealment only: a missed first call, a missed commitment, or no outcome logged.
            {pointsAreOfficial() ? "" : ` ${unofficialScoresCopy()}`}
          </p>
          <ScoreWallet rows={wallet} />
        </div>
        <div className="max-w-lg border border-[var(--arth-n10)] bg-[var(--arth-n00)] p-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--arth-slate)]">
            When this branch is open
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
