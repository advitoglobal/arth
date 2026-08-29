import { NextResponse } from "next/server";
import { asSeat } from "@/db/session";
import { saveEnquiryDepth } from "@/services/floor-register";
import { requireAnyScreen } from "@/lib/http";

export async function POST(req: Request) {
  const body = await req.json();
  try {
    return await asSeat(async (tx, seat) => {
      const denied = requireAnyScreen(seat, ["new", "tele"]);
      if (denied) return denied;
      const result = await saveEnquiryDepth(tx, {
        leadId: String(body.leadId),
        userId: seat.userId,
        colour: body.colour,
        variant: body.variant,
        buyerType: body.buyerType,
        financeNeeded: Boolean(body.financeNeeded),
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
        testdriveNeeded: body.testdriveNeeded,
        testdrivePrefDate: body.testdrivePrefDate,
        financeBankKey: body.financeBankKey,
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
