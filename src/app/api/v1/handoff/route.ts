import { NextResponse } from "next/server";
import { asSeat } from "@/db/session";
import { handoffToSales } from "@/services/assignment";
import { requireScreen } from "@/lib/http";

export async function POST(req: Request) {
  const body = await req.json();
  try {
    return await asSeat(async (tx, seat) => {
      const denied = requireScreen(seat, "tele");
      if (denied) return denied;
      const result = await handoffToSales(tx, {
        leadId: body.leadId,
        userId: seat.userId,
        note: String(body.note ?? ""),
      });
      return NextResponse.json(result);
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Not handed over.";
    const status = message.includes("Only the telecaller") ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
