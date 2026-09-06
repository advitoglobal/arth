import { NextResponse } from "next/server";
import { asSeat } from "@/db/session";
import { moveDeliveryStep, writePromise } from "@/services/delivery";
import { requireAnyScreen } from "@/lib/http";

export async function POST(req: Request) {
  const body = await req.json();
  try {
    return await asSeat(async (tx, seat) => {
      const denied = requireAnyScreen(seat, ["rec", "stock", "gm", "prin", "pipe"]);
      if (denied) return denied;
      if (body.action === "step") {
        return NextResponse.json(
          await moveDeliveryStep(tx, {
            leadId: String(body.leadId),
            actorId: seat.userId,
            stepKey: String(body.stepKey),
            status: body.status,
            blockReason: body.blockReason,
            blockKind: body.blockKind,
          }),
        );
      }
      if (body.action === "promise") {
        return NextResponse.json(
          await writePromise(tx, {
            leadId: String(body.leadId),
            actorId: seat.userId,
            promisedOn: String(body.promisedOn ?? ""),
            reason: String(body.reason ?? ""),
          }),
        );
      }
      return NextResponse.json({ error: "Unknown action." }, { status: 400 });
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Not saved.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
