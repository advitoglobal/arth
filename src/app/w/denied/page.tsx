import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { currentSeat } from "@/db/session";
import { hasDemoSession, landingPath, screenFromPath } from "@/lib/seats";
import { Forbidden } from "@/components/forbidden";

export default async function DeniedPage() {
  const jar = await cookies();
  if (!hasDemoSession(jar.get("arth_seat")?.value)) {
    redirect("/w/login");
  }
  const seat = await currentSeat();
  const refused = (await headers()).get("x-arth-refused");
  return <Forbidden landing={landingPath(seat)} screen={screenFromPath(refused ?? "")} />;
}
