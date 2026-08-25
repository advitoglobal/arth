import { NextResponse } from "next/server";
import { asSeat } from "@/db/session";
import { markAllNotificationsRead, markNotificationRead } from "@/services/telecalling";
import { requireScreen } from "@/lib/http";

export async function POST(req: Request) {
  const body = await req.json();
  return asSeat(async (tx, seat) => {
    const denied = requireScreen(seat, "notif");
    if (denied) return denied;
    if (body.all) {
      return NextResponse.json(await markAllNotificationsRead(tx, seat.userId));
    }
    const result = await markNotificationRead(tx, seat.userId, String(body.id ?? ""));
    return NextResponse.json(result);
  });
}
