import { NextResponse } from "next/server";
import { asSeat } from "@/db/session";
import { adviseSnapshot, recordAdviseTap, type AdviseTool } from "@/services/advise";
import { requireAnyScreen } from "@/lib/http";

export async function GET(req: Request) {
  const leadId = new URL(req.url).searchParams.get("leadId") ?? "";
  try {
    return await asSeat(async (tx, seat) => {
      const denied = requireAnyScreen(seat, ["tele", "new"]);
      if (denied) return denied;
      if (!leadId) return NextResponse.json({ error: "Choose an enquiry." }, { status: 400 });
      return NextResponse.json(await adviseSnapshot(tx, leadId));
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Not loaded.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function POST(req: Request) {
  const body = await req.json();
  try {
    return await asSeat(async (tx, seat) => {
      const denied = requireAnyScreen(seat, ["tele", "new"]);
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
