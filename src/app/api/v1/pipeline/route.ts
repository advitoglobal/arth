import { NextResponse } from "next/server";
import { asSeat } from "@/db/session";
import { listPipeline } from "@/services/telecalling";
import { requireScreen } from "@/lib/http";

export async function GET() {
  return asSeat(async (tx, seat) => {
    const denied = requireScreen(seat, "pipe");
    if (denied) return denied;
    const rows = await listPipeline(tx, seat.userId);
    return NextResponse.json({
      source: "leads.expected_value_paise",
      period: "own book, all stages",
      rows,
    });
  });
}
