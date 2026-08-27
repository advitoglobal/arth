import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { currentSeat } from "@/db/session";
import { hasDemoSession, landingPath } from "@/lib/seats";
import { Forbidden } from "@/components/forbidden";

export default async function DeniedPage() {
  const jar = await cookies();
  if (!hasDemoSession(jar.get("arth_seat")?.value)) {
    redirect("/w/login");
  }
  const seat = await currentSeat();
  return <Forbidden landing={landingPath(seat)} />;
}
