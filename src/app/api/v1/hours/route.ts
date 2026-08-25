import { NextResponse } from "next/server";
import { asSeat } from "@/db/session";
import { branchHoursForUser } from "@/services/telecalling";
import { requireScreen } from "@/lib/http";

export async function GET() {
  return asSeat(async (tx, seat) => {
    const denied = requireScreen(seat, "profile");
    if (denied) return denied;
    const rows = await branchHoursForUser(tx, seat.userId);
    return NextResponse.json({
      source: "working_hours",
      period: "this branch, Sunday to Saturday",
      rows,
    });
  });
}
