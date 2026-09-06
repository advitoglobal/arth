import { NextResponse } from "next/server";
import { asSeat } from "@/db/session";
import { requireAnyScreen } from "@/lib/http";
import { exportOffboarding } from "@/services/ops";

export async function POST() {
  try {
    return await asSeat(async (tx, seat) => {
      const denied = requireAnyScreen(seat, ["admin", "prin"]);
      if (denied) return denied;
      const result = await exportOffboarding(tx, seat.userId);
      return NextResponse.json(result);
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Export failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
