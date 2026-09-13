import { NextResponse } from "next/server";
import { asSeat } from "@/db/session";
import { recordDisposition, skipWrapUp } from "@/services/telecalling";
import { qualifyLead } from "@/services/floor-register";
import { requireScreen } from "@/lib/http";

export async function POST(req: Request) {
  const body = await req.json();
  try {
    return await asSeat(async (tx, seat) => {
      const denied = requireScreen(seat, "tele");
      if (denied) return denied;
      if (body.skipWrap) {
        const result = await skipWrapUp(tx, {
          leadId: String(body.leadId),
          userId: seat.userId,
          reason: String(body.skipReason ?? ""),
        });
        return NextResponse.json(result);
      }
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
        meetingAt: body.meetingAt,
        meetingPlace: body.meetingPlace,
        meetingBranch: body.meetingBranch,
        testdriveSlot: body.testdriveSlot,
        testdriveVariant: body.testdriveVariant,
        quoteRupees: body.quoteRupees,
        quoteVariant: body.quoteVariant,
        quoteValidUntil: body.quoteValidUntil,
      });
      if (body.qualifyLane) {
        const extras = (body.extras ?? {}) as Record<string, string>;
        const qualified = await qualifyLead(tx, {
          leadId: String(body.leadId),
          userId: seat.userId,
          lane: String(body.qualifyLane),
          note: String(body.note ?? ""),
          send: body.sendQualify !== false,
          testdrivePrefDate: body.testdrivePrefDate ? String(body.testdrivePrefDate) : undefined,
          extras,
        });
        return NextResponse.json({
          ...result,
          recorded: `${result.recorded} ${qualified.recorded}`,
          confirm: `${result.recorded} ${qualified.recorded}`,
        });
      }
      return NextResponse.json(result);
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Not saved.";
    const status = message.includes("do not own") ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
