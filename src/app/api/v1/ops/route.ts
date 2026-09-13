import { NextResponse } from "next/server";
import { asSeat, canSeeMargin } from "@/db/session";
import { requireAnyScreen } from "@/lib/http";
import {
  answerInbound,
  bookStock,
  decideDiscount,
  insuranceCatalogue,
  listConsents,
  releaseStock,
  requestDiscount,
  scheduleTestDrive,
  setConsent,
  setDelivery,
  simulateInbound,
} from "@/services/conversion";

export async function POST(req: Request) {
  const body = await req.json();
  const action = String(body.action ?? "");
  try {
    return await asSeat(async (tx, seat) => {
      const denied = requireAnyScreen(seat, ["rec", "stock", "drive", "ins", "dayb", "tele", "gm", "prin", "new", "profile"]);
      if (denied) return denied;

      if (action === "book_stock") {
        return NextResponse.json(await bookStock(tx, String(body.leadId), String(body.stockId), seat.userId));
      }
      if (action === "release_stock") {
        return NextResponse.json(await releaseStock(tx, String(body.stockId), seat.userId, String(body.reason ?? "")));
      }
      if (action === "schedule_testdrive") {
        return NextResponse.json(
          await scheduleTestDrive(tx, {
            leadId: String(body.leadId),
            actorId: seat.userId,
            slotAt: String(body.slotAt),
            stockId: body.stockId ? String(body.stockId) : undefined,
          }),
        );
      }
      if (action === "request_discount") {
        const rupees = Number(String(body.amountRupees ?? "0").replace(/,/g, ""));
        return NextResponse.json(
          await requestDiscount(tx, String(body.leadId), seat.userId, Math.round(rupees * 100), String(body.reason ?? "")),
        );
      }
      if (action === "decide_discount") {
        return NextResponse.json(await decideDiscount(tx, String(body.requestId), seat.userId, Boolean(body.approve)));
      }
      if (action === "delivery") {
        return NextResponse.json(await setDelivery(tx, String(body.leadId), String(body.lane ?? ""), String(body.status ?? "")));
      }
      if (action === "simulate_inbound") {
        return NextResponse.json(await simulateInbound(tx, String(body.department), String(body.fromPhone)));
      }
      if (action === "answer_inbound") {
        return NextResponse.json(await answerInbound(tx, String(body.callId), seat.userId));
      }
      if (action === "consent") {
        return NextResponse.json(
          await setConsent(tx, String(body.leadId), String(body.purpose), Boolean(body.granted)),
        );
      }
      if (action === "consents") {
        return NextResponse.json({ rows: await listConsents(tx, String(body.leadId)) });
      }
      if (action === "insurance") {
        return NextResponse.json({ rows: await insuranceCatalogue(tx, canSeeMargin(seat.roleKey)) });
      }
      return NextResponse.json({ error: "Unknown action." }, { status: 400 });
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Not saved.";
    const status = message.includes("Only") ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
