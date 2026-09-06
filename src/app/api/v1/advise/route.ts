import { NextResponse } from "next/server";
import { asSeat } from "@/db/session";
import { recordAdviseTap, type AdviseTool } from "@/services/advise";
import { requireScreen } from "@/lib/http";

export async function POST(req: Request) {
  const body = await req.json();
  try {
    return await asSeat(async (tx, seat) => {
      const denied = requireScreen(seat, "tele");
      if (denied) return denied;
      const result = await recordAdviseTap(tx, {
        leadId: String(body.leadId),
        userId: seat.userId,
        tool: body.tool as AdviseTool,
        values: (body.values ?? {}) as Record<string, unknown>,
      });
      return NextResponse.json(result);
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Not saved.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
