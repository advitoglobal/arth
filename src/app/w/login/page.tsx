import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { authenticateSeat } from "@/lib/auth";
import { landingPath } from "@/lib/seats";
import { applySeatCookies } from "@/lib/session-cookies";
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
  applySeatCookies(jar, result.seat);
  redirect(landingPath(result.seat));
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ e?: string }>;
}) {
  const { e } = await searchParams;
  return (
    <div className="mx-auto max-w-xl space-y-8 py-8">
      <RuleHeading>Sign in to Arth</RuleHeading>
      <p className="text-[var(--arth-n60)]">
        Telecalling qualifies the enquiry and hands it to sales. The digital desk runs that team. The dealer principal sees this dealer only. Advito admin onboards dealers. Advito support enters one dealer at a time to fix a problem.
      </p>
      <ul className="list-disc space-y-1 pl-5 text-sm text-[var(--arth-n60)]">
        <li>iyer · Whitefield telecaller. Password is the demonstration password.</li>
        <li>nair · Whitefield telecaller. Same shared new book until a connect.</li>
        <li>pinto · Coastal telecaller.</li>
        <li>rao · Whitefield sales. Today is refused. Converts after handoff.</li>
        <li>gupta · Whitefield digital desk manager. Telecalling team at this branch only.</li>
        <li>shah · Whitefield dealer principal. This dealer only, never Coastal.</li>
        <li>fernandes / kamath · Coastal digital desk and principal.</li>
        <li>advito · Advito admin. Onboard dealers. Enter one dealer at a time.</li>
        <li>support · Advito support. Enter one dealer at a time. Cannot onboard.</li>
        <li>captele · Capacity Motors. A twenty lakh enquiry book for load checks. Not the Whitefield walk-through.</li>
        <li>Every dealer seat has Performance: what is holding, what is late, and what to do next from the live book.</li>
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
