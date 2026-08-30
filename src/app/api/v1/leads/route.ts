import { NextResponse } from "next/server";
import { asSeat } from "@/db/session";
import { createOwnedEnquiry } from "@/services/assignment";
import { findByPhone } from "@/services/conversion";
import { requireScreen } from "@/lib/http";

export async function GET(req: Request) {
  const phone = new URL(req.url).searchParams.get("phone") ?? "";
  try {
    return await asSeat(async (tx, seat) => {
      const denied = requireScreen(seat, "new");
      if (denied) return denied;
      const matches = await findByPhone(tx, phone);
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
      });
      return NextResponse.json(result);
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
