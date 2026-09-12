import { NextResponse } from "next/server";
import { asSeat } from "@/db/session";
import { listPipeline } from "@/services/telecalling";
import { requireScreen } from "@/lib/http";

export async function GET(req: Request) {
  return asSeat(async (tx, seat) => {
    const denied = requireScreen(seat, "pipe");
    if (denied) return denied;
    const q = new URL(req.url).searchParams;
    const page = await listPipeline(tx, seat.userId, {
      stage: q.get("stage") ?? undefined,
      source: q.get("source") ?? undefined,
      overdue: q.get("overdue") ?? undefined,
      parked: q.get("parked") ?? undefined,
      owner: q.get("owner") ?? undefined,
    });
    return NextResponse.json({
      source: "your full book",
      period: "all nine stages, current",
      rows: page.rows,
      counts: page.counts,
      total: page.total,
      limit: page.limit,
      owners: page.owners,
      filters: page.filters,
    });
  });
}
