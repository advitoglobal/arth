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
        variant={invert ? "ghost" : "outline"}
        className={
          invert
            ? "h-auto px-0 py-0 text-[12.5px] text-[var(--arth-n40)] hover:bg-transparent hover:text-[var(--arth-n00)]"
            : undefined
        }
      >
        Leave this floor
      </Button>
    </form>
  );
}
