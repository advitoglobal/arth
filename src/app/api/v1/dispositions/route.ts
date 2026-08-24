import { NextResponse } from "next/server";
import { asSeat } from "@/db/session";
import { recordDisposition } from "@/services/telecalling";

export async function POST(req: Request) {
  const body = await req.json();
  try {
    const result = await asSeat((tx, seat) =>
      recordDisposition(tx, {
        leadId: body.leadId,
        userId: seat.userId,
        dispositionKey: body.dispositionKey,
        note: body.note ?? "",
        revisitAt: body.revisitAt,
        lostReasonKey: body.lostReasonKey,
      }),
    );
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Not saved.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
