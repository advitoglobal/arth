import { NextResponse } from "next/server";
import { asSeat } from "@/db/session";
import { assignUnowned } from "@/services/assignment";
import { requireScreen } from "@/lib/http";

export async function POST() {
  return asSeat(async (tx, seat) => {
    const denied = requireScreen(seat, "dayb");
    if (denied) return denied;
    const result = await assignUnowned(tx, seat.userId);
    return NextResponse.json(result);
  });
}
