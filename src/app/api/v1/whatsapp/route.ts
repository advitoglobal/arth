import { NextResponse } from "next/server";
import { asSeat } from "@/db/session";
import { sendWhatsAppLoop, receiveWhatsApp, listMessageInbox } from "@/services/whatsapp-loop";
import { requireAnyScreen } from "@/lib/http";
import type { WhatsAppKind } from "@/lib/whatsapp";

export async function GET(req: Request) {
  const leadId = new URL(req.url).searchParams.get("leadId");
  try {
    return await asSeat(async (tx, seat) => {
      const denied = requireAnyScreen(seat, ["tele", "msg", "rec", "new"]);
      if (denied) return denied;
      const rows = await listMessageInbox(tx, seat.userId);
      return NextResponse.json({ rows, leadId: leadId || null });
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
      const denied = requireAnyScreen(seat, ["tele", "msg", "rec", "new"]);
      if (denied) return denied;
      const action = String(body.action ?? "send");
      if (action === "inbound") {
        const result = await receiveWhatsApp(tx, {
          fromPhone: String(body.fromPhone ?? ""),
          text: String(body.text ?? ""),
          mediaKind: body.mediaKind ? String(body.mediaKind) : null,
          userId: seat.userId,
        });
        return NextResponse.json(result);
      }
      const result = await sendWhatsAppLoop(tx, {
        leadId: String(body.leadId),
        userId: seat.userId,
        kind: body.kind as WhatsAppKind,
        senderName: seat.name,
        dealer: seat.tenantName,
      });
      return NextResponse.json(result);
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Not sent.";
    const status = message.includes("do not own") ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
