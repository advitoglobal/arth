import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { DEMO_USERS, type SeatKey } from "@/db/session";
import { RuleHeading } from "@/components/brand/type";
import { Button } from "@/components/ui/button";

async function enter(formData: FormData) {
  "use server";
  const raw = String(formData.get("seat") ?? "iyer");
  const seatKey = (raw in DEMO_USERS ? raw : "iyer") as SeatKey;
  const seat = DEMO_USERS[seatKey];
  const jar = await cookies();
  jar.set("arth_seat", seatKey, { httpOnly: true, sameSite: "lax", path: "/" });
  jar.set(
    "arth_tenant",
    seat.tenantId.startsWith("2222") ? "coastal" : "whitefield",
    { httpOnly: true, sameSite: "lax", path: "/" },
  );
  redirect(`/w/${seat.workspaceKey}`);
}

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-xl space-y-8 py-8">
      <RuleHeading>Sign in to a floor</RuleHeading>
      <p className="text-[var(--arth-n60)]">
        Demo seats. Production uses a server session. Two telecallers on Whitefield exist so own-book scope can be proved. The sales seat receives 403 on Today.
      </p>
      <form action={enter} className="space-y-4 border border-[var(--arth-n10)] bg-[var(--arth-n00)] p-6">
        <label className="block text-sm">
          Seat
          <select name="seat" className="mt-1 block h-11 w-full rounded-[3px] border border-[var(--arth-n50)] px-2">
            <option value="iyer">Whitefield Motors · A. Iyer · telecaller</option>
            <option value="nair">Whitefield Motors · K. Nair · telecaller</option>
            <option value="pinto">Coastal Cars · M. Pinto · telecaller</option>
            <option value="rao">Whitefield Motors · S. Rao · sales consultant</option>
          </select>
        </label>
        <Button type="submit" className="h-11">
          Open landing screen
        </Button>
      </form>
    </div>
  );
}
