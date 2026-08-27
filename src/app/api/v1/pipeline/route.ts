import { NextResponse } from "next/server";
import { asSeat } from "@/db/session";
import { listPipeline } from "@/services/telecalling";
import { requireScreen } from "@/lib/http";

export async function GET(req: Request) {
  return asSeat(async (tx, seat) => {
    const denied = requireScreen(seat, "pipe");
    if (denied) return denied;
    const stage = new URL(req.url).searchParams.get("stage") ?? undefined;
    const page = await listPipeline(tx, seat.userId, { stage });
    return NextResponse.json({
      source: "your full book",
      period: "all nine stages, current",
      rows: page.rows,
      counts: page.counts,
      total: page.total,
      limit: page.limit,
    });
  });
}
