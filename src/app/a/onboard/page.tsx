import { redirect } from "next/navigation";
import { asPlatform, canOpen } from "@/db/session";
import { onboardDealer } from "@/services/platform";
import { RuleHeading } from "@/components/brand/type";
import { Forbidden } from "@/components/forbidden";
import { Button } from "@/components/ui/button";

export default async function OnboardPage({
  searchParams,
}: {
  searchParams: Promise<{ e?: string }>;
}) {
  const { e } = await searchParams;

  async function create(formData: FormData) {
    "use server";
    const fields = {
      dealerName: String(formData.get("dealerName") ?? ""),
      branchName: String(formData.get("branchName") ?? ""),
      principalName: String(formData.get("principalName") ?? ""),
      principalPhone: String(formData.get("principalPhone") ?? ""),
      principalUsername: String(formData.get("principalUsername") ?? ""),
      deskName: String(formData.get("deskName") ?? ""),
      deskPhone: String(formData.get("deskPhone") ?? ""),
      deskUsername: String(formData.get("deskUsername") ?? ""),
      teleName: String(formData.get("teleName") ?? ""),
      telePhone: String(formData.get("telePhone") ?? ""),
      teleUsername: String(formData.get("teleUsername") ?? ""),
      password: String(formData.get("password") ?? ""),
    };
    let id = "";
    try {
      id = await asPlatform(async (tx, seat) => {
        if (!canOpen(seat.roleKey, "aonboard")) {
          throw new Error("Advito admin only");
        }
        return onboardDealer(tx, fields);
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Onboarding failed";
      redirect(`/a/onboard?e=${encodeURIComponent(message)}`);
    }
    redirect(`/a/dealers/${id}`);
  }

  return asPlatform(async (_tx, seat) => {
    if (!canOpen(seat.roleKey, "aonboard")) {
      return <Forbidden landing="/a/dealers" />;
    }
    return (
      <div className="space-y-6">
        <RuleHeading>Onboard a dealer</RuleHeading>
        <p className="max-w-[68ch] text-[var(--arth-n60)]">
          Creates a new dealer wall: branch hours, stages, dispositions, a dealer principal, a digital desk manager, and one telecaller. They cannot see Whitefield, Coastal, or any other dealer.
        </p>
        {e ? <p className="text-sm text-[var(--arth-overdue)]">{e}</p> : null}
        <form action={create} className="max-w-xl space-y-4 border border-[var(--arth-n10)] bg-[var(--arth-n00)] p-6">
          {[
            ["dealerName", "Dealer name", "Example Motors"],
            ["branchName", "First branch", "Showroom"],
            ["principalName", "Dealer principal name", ""],
            ["principalPhone", "Principal phone", ""],
            ["principalUsername", "Principal username", ""],
            ["deskName", "Digital desk manager name", ""],
            ["deskPhone", "Desk phone", ""],
            ["deskUsername", "Desk username", ""],
            ["teleName", "First telecaller name", ""],
            ["telePhone", "Telecaller phone", ""],
            ["teleUsername", "Telecaller username", ""],
          ].map(([name, label, ph]) => (
            <label key={name} className="block text-sm">
              {label}
              <input
                name={name}
                required
                placeholder={ph}
                className="mt-1 block h-11 w-full rounded-[3px] border border-[var(--arth-n50)] px-2"
              />
            </label>
          ))}
          <label className="block text-sm">
            First password for those three seats
            <input
              name="password"
              type="password"
              required
              minLength={8}
              className="mt-1 block h-11 w-full rounded-[3px] border border-[var(--arth-n50)] px-2"
            />
          </label>
          <Button type="submit" className="h-11">
            Create dealer wall
          </Button>
        </form>
      </div>
    );
  });
}
