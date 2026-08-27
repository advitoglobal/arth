import { redirect } from "next/navigation";
import { asSeat, canPlaceEnquiry, currentSeat } from "@/db/session";
import { withPlatformDealer } from "@/db/with-tenant";
import { placeWithTelecaller } from "@/services/assignment";
import { Button } from "@/components/ui/button";
import type { TeamSeat } from "@/services/control";

export function PlaceForm({
  leadId,
  teles,
  returnTo,
  tenantId,
}: {
  leadId: string;
  teles: TeamSeat[];
  returnTo: string;
  tenantId?: string;
}) {
  async function place(formData: FormData) {
    "use server";
    const teleId = String(formData.get("teleId") ?? "");
    const back = String(formData.get("returnTo") ?? returnTo);
    const dealer = String(formData.get("tenantId") ?? tenantId ?? "");
    if (!teleId) redirect(back);
    const seat = await currentSeat();
    if (seat.kind === "platform") {
      if (!dealer) redirect(back);
      await withPlatformDealer(
        { platformUserId: seat.userId, tenantId: dealer },
        async (tx) => {
          const [uid] = await tx<{ id: string }[]>`
            SELECT current_setting('app.user_id', true) AS id
          `;
          await placeWithTelecaller(tx, { leadId, teleId, actorId: uid.id });
        },
      );
      redirect(back);
    }
    await asSeat(async (tx, s) => {
      if (!canPlaceEnquiry(s.roleKey)) {
        throw new Error("Only the digital desk can place a name.");
      }
      await placeWithTelecaller(tx, { leadId, teleId, actorId: s.userId });
    });
    redirect(back);
  }

  if (teles.length === 0) return null;

  return (
    <form action={place} className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <input type="hidden" name="returnTo" value={returnTo} />
      {tenantId ? <input type="hidden" name="tenantId" value={tenantId} /> : null}
      <label className="sr-only" htmlFor={`tele-${leadId}`}>
        Telecaller
      </label>
      <select
        id={`tele-${leadId}`}
        name="teleId"
        className="h-11 rounded-[3px] border border-[var(--arth-n50)] bg-[var(--arth-n00)] px-2 text-sm"
        defaultValue={teles[0]?.id}
      >
        {teles.map((t) => (
          <option key={t.id} value={t.id}>
            {t.full_name}
          </option>
        ))}
      </select>
      <Button type="submit" className="h-11">
        Place
      </Button>
    </form>
  );
}
