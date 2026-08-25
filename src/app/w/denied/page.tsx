import { currentSeat } from "@/db/session";
import { Forbidden } from "@/components/forbidden";

export default async function DeniedPage() {
  const seat = await currentSeat();
  return <Forbidden landing={`/w/${seat.workspaceKey}`} />;
}
