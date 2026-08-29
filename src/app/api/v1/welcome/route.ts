import { NextResponse } from "next/server";
import { asSeat } from "@/db/session";
import { dismissWelcome } from "@/services/floor-register";

export async function POST() {
  try {
    return await asSeat(async (tx, seat) => {
      await dismissWelcome(tx, seat.userId);
      return NextResponse.json({ ok: true });
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Not saved." },
      { status: 400 },
    );
  }
}
