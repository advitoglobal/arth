import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { clearSeatCookies } from "@/lib/session-cookies";

async function leave() {
  "use server";
  const jar = await cookies();
  clearSeatCookies(jar);
  redirect("/w/login");
}

export function LeaveFloor({
  invert = false,
  compact = false,
}: {
  invert?: boolean;
  compact?: boolean;
}) {
  return (
    <form action={leave}>
      <Button
        type="submit"
        variant="outline"
        className={
          invert
            ? compact
              ? "h-8 shrink-0 rounded-[3px] border-[var(--arth-n00)] bg-transparent px-3 text-[12.5px] text-[var(--arth-n00)] hover:bg-[var(--arth-n90)]"
              : "h-9 w-full rounded-[3px] border-[var(--arth-n00)] bg-transparent text-[var(--arth-n00)] hover:bg-[var(--arth-n90)]"
            : "h-9 rounded-[3px]"
        }
      >
        Log out
      </Button>
    </form>
  );
}
