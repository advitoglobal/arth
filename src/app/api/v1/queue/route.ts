import { NextResponse } from "next/server";
import { asSeat } from "@/db/session";
import { listQueue } from "@/services/telecalling";

export async function GET() {
  const rows = await asSeat((tx, seat) => listQueue(tx, seat.userId));
  return NextResponse.json({
    source: "leads.next_action_at",
    period: "today plus breaching",
    rows,
  });
}
