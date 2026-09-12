import { NextResponse } from "next/server";
import { asSeat } from "@/db/session";
import { requireScreen } from "@/lib/http";
import { saveSampledReview, saveSelfReport } from "@/services/weekly-loop";

export async function POST(req: Request) {
  const body = await req.json();
  try {
    return await asSeat(async (tx, seat) => {
      const denied = requireScreen(seat, "loop");
      if (denied) return denied;
      const action = String(body.action ?? "");
      if (action === "self") {
        return NextResponse.json(await saveSelfReport(tx, seat.userId, String(body.text ?? "")));
      }
      if (action === "review") {
        return NextResponse.json(
          await saveSampledReview(tx, {
            reviewerId: seat.userId,
            eventId: String(body.eventId),
            scores: body.scores ?? {},
            note: String(body.note ?? ""),
          }),
        );
      }
      return NextResponse.json({ error: "Unknown action." }, { status: 400 });
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Not saved.";
    const status = message.includes("does not open") || message.includes("principal") ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
