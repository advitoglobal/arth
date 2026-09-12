import { NextResponse } from "next/server";
import { asSeat } from "@/db/session";
import { listQueue } from "@/services/telecalling";
import { requireScreen } from "@/lib/http";

export async function GET() {
  return asSeat(async (tx, seat) => {
    const denied = requireScreen(seat, "dayb");
    if (denied) return denied;
    const rows = await listQueue(tx, seat.userId);
    const next = rows[0] ?? null;
    return NextResponse.json({
      source: "priority queue",
      period: "six published bands, late first inside each band",
      next,
      remaining: rows.length,
    });
  });
}
