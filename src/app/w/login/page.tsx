import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { RuleHeading } from "@/components/brand/type";
import { Button } from "@/components/ui/button";

async function enter(formData: FormData) {
  "use server";
  const tenant = formData.get("tenant") === "coastal" ? "coastal" : "whitefield";
  const jar = await cookies();
  jar.set("arth_tenant", tenant, { httpOnly: true, sameSite: "lax", path: "/" });
  redirect("/w/dayb");
}

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-xl space-y-8 py-8">
      <RuleHeading>Sign in to a floor</RuleHeading>
      <p className="text-[var(--arth-n60)]">
        Demo seats. Production uses a server session. Two tenants exist so isolation can be proved.
      </p>
      <form action={enter} className="space-y-4 border border-[var(--arth-n10)] bg-[var(--arth-n00)] p-6">
        <label className="block text-sm">
          Tenant
          <select name="tenant" className="mt-1 block h-11 w-full rounded-[3px] border border-[var(--arth-n50)] px-2">
            <option value="whitefield">Whitefield Motors · A. Iyer</option>
            <option value="coastal">Coastal Cars · M. Pinto</option>
          </select>
        </label>
        <Button type="submit" className="h-11">
          Open Today
        </Button>
      </form>
    </div>
  );
}
