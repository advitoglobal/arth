import { NextResponse } from "next/server";
import { asSeat } from "@/db/session";
import { markDial } from "@/services/conversion";
import { requireScreen } from "@/lib/http";

export async function POST(req: Request) {
  const body = await req.json();
  try {
    return await asSeat(async (tx, seat) => {
      const denied = requireScreen(seat, "tele");
      if (denied) return denied;
      await markDial(tx, String(body.leadId), seat.userId);
      return NextResponse.json({ recorded: "Dial started. Connected points need this Dial, not the timer alone." });
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Not recorded.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
