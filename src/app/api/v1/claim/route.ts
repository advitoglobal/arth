import { NextResponse } from "next/server";
import { asSeat } from "@/db/session";
import { claimPool } from "@/services/floor-register";
import { requireScreen } from "@/lib/http";

export async function POST(req: Request) {
  const body = await req.json();
  try {
    return await asSeat(async (tx, seat) => {
      const denied = requireScreen(seat, "pipe");
      if (denied) return denied;
      const result = await claimPool(tx, String(body.leadId), seat.userId);
      return NextResponse.json(result);
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Not claimed." },
      { status: 400 },
    );
  }
}
