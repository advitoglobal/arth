import { NextResponse } from "next/server";
import { asSeat } from "@/db/session";
import { armUnownedClocks } from "@/services/assignment";
import { requireScreen } from "@/lib/http";

export async function POST() {
  return asSeat(async (tx, seat) => {
    const denied = requireScreen(seat, "dayb");
    if (denied) return denied;
    const result = await armUnownedClocks(tx);
    return NextResponse.json(result);
  });
}
