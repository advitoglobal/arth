import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { authenticateSeat } from "@/lib/auth";
import { DEMO_USERS, hasDemoSession, resolveSeatKey } from "@/lib/seats";
import { RuleHeading } from "@/components/brand/type";
import { Button } from "@/components/ui/button";

async function enter(formData: FormData) {
  "use server";
  const username = String(formData.get("username") ?? "");
  const password = String(formData.get("password") ?? "");
  const result = await authenticateSeat(username, password);
  if (!result.ok) {
    redirect(`/w/login?e=1`);
  }
  const jar = await cookies();
  jar.set("arth_seat", result.seat.seatKey, { httpOnly: true, sameSite: "lax", path: "/" });
  jar.set(
    "arth_tenant",
    result.seat.tenantId.startsWith("2222") ? "coastal" : "whitefield",
    { httpOnly: true, sameSite: "lax", path: "/" },
  );
  redirect(`/w/${result.seat.workspaceKey}`);
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ e?: string }>;
}) {
  const { e } = await searchParams;
  const jar = await cookies();
  const key = resolveSeatKey(jar.get("arth_seat")?.value);
  if (!e && hasDemoSession(jar.get("arth_seat")?.value) && key) {
    redirect(`/w/${DEMO_USERS[key].workspaceKey}`);
  }
  return (
    <div className="mx-auto max-w-xl space-y-8 py-8">
      <RuleHeading>Sign in to the telecalling floor</RuleHeading>
      <p className="text-[var(--arth-n60)]">
        Telecalling qualifies the enquiry and hands it to sales. Sales converts. New names are on every telecaller list until someone reaches the customer. Then that name stays with that telecaller.
      </p>
      <ul className="list-disc space-y-1 pl-5 text-sm text-[var(--arth-n60)]">
        <li>iyer · Whitefield telecaller. Password is the demonstration password.</li>
        <li>nair · Whitefield telecaller. Same shared new book until a connect.</li>
        <li>pinto · Coastal telecaller.</li>
        <li>rao · Whitefield sales. Today is refused. Converts after handoff.</li>
        <li>dsouza · Coastal sales.</li>
      </ul>
      <p className="text-sm text-[var(--arth-n60)]">
        Demonstration password for every seat: <span className="font-data">arth-demo</span>. Production uses a server session and SSO.
      </p>
      {e ? (
        <p className="text-sm text-[var(--arth-overdue)]">That username or password is not right.</p>
      ) : null}
      <form action={enter} className="space-y-4 border border-[var(--arth-n10)] bg-[var(--arth-n00)] p-6">
        <label className="block text-sm">
          Username
          <input
            name="username"
            autoComplete="username"
            className="mt-1 block h-11 w-full rounded-[3px] border border-[var(--arth-n50)] px-2"
          />
        </label>
        <label className="block text-sm">
          Password
          <input
            name="password"
            type="password"
            autoComplete="current-password"
            className="mt-1 block h-11 w-full rounded-[3px] border border-[var(--arth-n50)] px-2"
          />
        </label>
        <Button type="submit" className="h-11">
          Sign in
        </Button>
      </form>
    </div>
  );
}
