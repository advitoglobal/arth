import { NextResponse } from "next/server";
import { asSeat } from "@/db/session";
import { createOwnedEnquiry } from "@/services/assignment";
import { saveEnquiryDepth } from "@/services/floor-register";
import { findDuplicatesByPhone } from "@/services/conversion";
import { requireScreen } from "@/lib/http";

export async function GET(req: Request) {
  const phone = new URL(req.url).searchParams.get("phone") ?? "";
  try {
    return await asSeat(async (tx, seat) => {
      const denied = requireScreen(seat, "new");
      if (denied) return denied;
      const matches = await findDuplicatesByPhone(tx, phone);
      return NextResponse.json({ matches });
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Not searched.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function POST(req: Request) {
  const body = await req.json();
  try {
    return await asSeat(async (tx, seat) => {
      const denied = requireScreen(seat, "new");
      if (denied) return denied;
      const rupees = Number(String(body.expectedValueRupees ?? "0").replace(/,/g, ""));
      const paise = Number.isFinite(rupees) ? Math.round(rupees * 100) : 0;
      const result = await createOwnedEnquiry(tx, {
        userId: seat.userId,
        customerName: String(body.customerName ?? ""),
        phone: String(body.phone ?? ""),
        modelInterest: String(body.modelInterest ?? ""),
        variantInterest: String(body.variantInterest ?? ""),
        sourceKey: String(body.sourceKey ?? "inbound_call"),
        sourceDetail: String(body.sourceDetail ?? ""),
        expectedValuePaise: paise,
        departmentKey: body.departmentKey ? String(body.departmentKey) : undefined,
      });
      if (body.depth && result.leadId) {
        const d = body.depth as Record<string, unknown>;
        await saveEnquiryDepth(tx, {
          leadId: result.leadId,
          userId: seat.userId,
          colour: d.colour != null ? String(d.colour) : undefined,
          variant: d.variant != null ? String(d.variant) : undefined,
          buyerType: d.buyerType != null ? String(d.buyerType) : undefined,
          altModel: d.altModel != null ? String(d.altModel) : undefined,
          expectedBookingDate: d.expectedBookingDate != null ? String(d.expectedBookingDate) : undefined,
          expectedDeliveryDate: d.expectedDeliveryDate != null ? String(d.expectedDeliveryDate) : undefined,
          exchangeVehicle: d.exchangeVehicle != null ? String(d.exchangeVehicle) : undefined,
          exchangePlace: d.exchangePlace != null ? String(d.exchangePlace) : undefined,
          meetingKind: d.meetingKind != null ? String(d.meetingKind) : undefined,
          meetingAt: d.meetingAt != null ? String(d.meetingAt) : undefined,
          testdriveNeeded: typeof d.testdriveNeeded === "boolean" ? d.testdriveNeeded : undefined,
          testdrivePrefDate: d.testdrivePrefDate != null ? String(d.testdrivePrefDate) : undefined,
          financeBankKey: d.financeBankKey != null ? String(d.financeBankKey) : undefined,
          whoElseDecides: d.whoElseDecides != null ? String(d.whoElseDecides) : undefined,
          seenVehicle: typeof d.seenVehicle === "boolean" ? d.seenVehicle : undefined,
          financeNeeded: typeof d.financeNeeded === "boolean" ? d.financeNeeded : undefined,
          intakeSaid: d.intakeSaid != null ? String(d.intakeSaid) : undefined,
        });
      }
      return NextResponse.json({
        ...result,
        recorded: `${result.recorded} Filed in that department.`,
      });
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Not saved.";
    const existingLeadId =
      err instanceof Error
        ? (err as Error & { existingLeadId?: string }).existingLeadId
        : undefined;
    return NextResponse.json(
      { error: message, existingLeadId },
      { status: 400 },
    );
  }
}
