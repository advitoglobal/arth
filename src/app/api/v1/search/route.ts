import { NextResponse } from "next/server";
import { asSeat } from "@/db/session";
import { searchEnquiries } from "@/services/telecalling";
import { requireScreen } from "@/lib/http";

export async function GET(req: Request) {
  const p = new URL(req.url).searchParams;
  return asSeat(async (tx, seat) => {
    const denied = requireScreen(seat, "search");
    if (denied) return denied;
    const rows = await searchEnquiries(tx, {
      q: p.get("q") ?? "",
      source: p.get("source") ?? "",
      stage: p.get("stage") ?? "",
      overdue: p.get("overdue") ?? "",
      parked: p.get("parked") ?? "",
      model: p.get("model") ?? "",
    });
    return NextResponse.json({
      source: "customers and leads",
      period: "current tenant",
      rows,
    });
  });
}
