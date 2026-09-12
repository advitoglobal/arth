import { NextResponse } from "next/server";
import { asSeat } from "@/db/session";
import { dialPreflight, markDial } from "@/services/conversion";
import { requireScreen } from "@/lib/http";

export async function GET(req: Request) {
  const leadId = new URL(req.url).searchParams.get("leadId") ?? "";
  try {
    return await asSeat(async (tx, seat) => {
      const denied = requireScreen(seat, "tele");
      if (denied) return denied;
      const pre = await dialPreflight(tx, leadId, seat.userId);
      return NextResponse.json(pre);
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Not ready.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function POST(req: Request) {
  const body = await req.json();
  try {
    return await asSeat(async (tx, seat) => {
      const denied = requireScreen(seat, "tele");
      if (denied) return denied;
      await markDial(tx, String(body.leadId), seat.userId);
      return NextResponse.json({
        recorded: "Dial started. Duration is a desk simulation until a telephone vendor is connected.",
      });
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Not recorded.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
