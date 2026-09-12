import { NextResponse } from "next/server";
import { asSeat } from "@/db/session";
import { undoDisposition } from "@/services/telecalling";
import { requireAnyScreen } from "@/lib/http";

export async function POST(req: Request) {
  const body = await req.json();
  try {
    return await asSeat(async (tx, seat) => {
      const denied = requireAnyScreen(seat, ["tele", "rec", "pipe"]);
      if (denied) return denied;
      const result = await undoDisposition(tx, {
        leadId: body.leadId,
        userId: seat.userId,
        eventId: String(body.eventId),
      });
      return NextResponse.json(result);
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Not saved.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
