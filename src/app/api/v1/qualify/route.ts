import { NextResponse } from "next/server";
import { asSeat } from "@/db/session";
import { saveEnquiryDepth, qualifyLead } from "@/services/floor-register";
import { requireAnyScreen } from "@/lib/http";

export async function POST(req: Request) {
  const body = await req.json();
  try {
    return await asSeat(async (tx, seat) => {
      const denied = requireAnyScreen(seat, ["new", "tele"]);
      if (denied) return denied;
      if (body.lane) {
        const extras = (body.extras ?? {}) as Record<string, string>;
        const result = await qualifyLead(tx, {
          leadId: String(body.leadId),
          userId: seat.userId,
          lane: String(body.lane),
          note: String(body.note ?? ""),
          send: body.send !== false,
          testdrivePrefDate: body.testdrivePrefDate ? String(body.testdrivePrefDate) : undefined,
          extras,
          salesUserId: body.salesUserId ? String(body.salesUserId) : undefined,
          mode: body.mode ? String(body.mode) : undefined,
        });
        return NextResponse.json(result);
      }
      const financeNeeded =
        body.financeNeeded === undefined && body.financePath === undefined
          ? undefined
          : body.financePath === "cash"
            ? false
            : Boolean(body.financeNeeded ?? body.financePath === "finance");
      const testdriveNeeded =
        body.testdriveNeeded === undefined ? undefined : Boolean(body.testdriveNeeded);
      const seenVehicle = body.seenVehicle === undefined ? undefined : Boolean(body.seenVehicle);
      const result = await saveEnquiryDepth(tx, {
        leadId: String(body.leadId),
        userId: seat.userId,
        colour: body.colour,
        variant: body.variant,
        buyerType: body.buyerType,
        financeNeeded,
        altModel: body.altModel,
        altVariant: body.altVariant,
        expectedBookingDate: body.expectedBookingDate,
        expectedDeliveryDate: body.expectedDeliveryDate,
        exchangeVehicle: body.exchangeVehicle,
        exchangeEvalNeeded: body.exchangeEvalNeeded,
        exchangeEvalAt: body.exchangeEvalAt,
        exchangePlace: body.exchangePlace,
        meetingKind: body.meetingKind,
        meetingAt: body.meetingAt,
        testdriveNeeded,
        testdrivePrefDate: body.testdrivePrefDate,
        financeBankKey: body.financeBankKey,
        whoElseDecides: body.whoElseDecides,
        seenVehicle,
        intakeSaid: body.intakeSaid,
      });
      return NextResponse.json(result);
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Not saved." },
      { status: 400 },
    );
  }
}
