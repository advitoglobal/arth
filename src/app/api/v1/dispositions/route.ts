import { NextResponse } from "next/server";
import { asSeat } from "@/db/session";
import { recordDisposition } from "@/services/telecalling";
import { requireScreen } from "@/lib/http";

export async function POST(req: Request) {
  const body = await req.json();
  try {
    return await asSeat(async (tx, seat) => {
      const denied = requireScreen(seat, "tele");
      if (denied) return denied;
      const result = await recordDisposition(tx, {
        leadId: body.leadId,
        userId: seat.userId,
        dispositionKey: body.dispositionKey,
        note: body.note ?? "",
        revisitAt: body.revisitAt,
        lostReasonKey: body.lostReasonKey,
        callbackReason: body.callbackReason,
        lostFact: body.lostFact,
        callSeconds: body.callSeconds,
        notEnquiryReason: body.notEnquiryReason,
        mergeLeadId: body.mergeLeadId,
        routeDepartment: body.routeDepartment,
      });
      return NextResponse.json(result);
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Not saved.";
    const status = message.includes("do not own") ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
