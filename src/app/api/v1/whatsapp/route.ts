import { NextResponse } from "next/server";
import { asSeat } from "@/db/session";
import { sendWhatsApp } from "@/services/telecalling";
import { requireScreen } from "@/lib/http";
import type { WhatsAppKind } from "@/lib/whatsapp";

const KINDS: WhatsAppKind[] = ["brochure", "quotation", "both"];

export async function POST(req: Request) {
  const body = await req.json();
  try {
    return await asSeat(async (tx, seat) => {
      const denied = requireScreen(seat, "tele");
      if (denied) return denied;
      const kind = body.kind as WhatsAppKind;
      if (!KINDS.includes(kind)) {
        return NextResponse.json({ error: "Unknown WhatsApp template." }, { status: 400 });
      }
      const result = await sendWhatsApp(tx, {
        leadId: body.leadId,
        userId: seat.userId,
        kind,
        conversation: String(body.conversation ?? ""),
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
