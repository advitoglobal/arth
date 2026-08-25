import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";

async function leave() {
  "use server";
  const jar = await cookies();
  jar.set("arth_seat", "", { httpOnly: true, sameSite: "lax", path: "/", maxAge: 0 });
  jar.set("arth_tenant", "", { httpOnly: true, sameSite: "lax", path: "/", maxAge: 0 });
  redirect("/w/login");
}

export function LeaveFloor({ invert = false }: { invert?: boolean }) {
  return (
    <form action={leave}>
      <Button
        type="submit"
        variant="outline"
        className={
          invert
            ? "h-9 w-full rounded-[3px] border-[var(--arth-n00)] bg-transparent text-[var(--arth-n00)] hover:bg-[var(--arth-n90)]"
            : "h-9 rounded-[3px]"
        }
      >
        Log out
      </Button>
    </form>
  );
}
