import { NextResponse } from "next/server";
import { asSeat } from "@/db/session";
import { listNotifications } from "@/services/telecalling";
import { requireScreen } from "@/lib/http";

export async function GET() {
  return asSeat(async (tx, seat) => {
    const denied = requireScreen(seat, "notif");
    if (denied) return denied;
    const rows = await listNotifications(tx, seat.userId);
    return NextResponse.json({
      source: "notifications",
      period: "unread and read, newest first",
      rows,
    });
  });
}
