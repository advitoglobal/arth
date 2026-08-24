import { NextResponse } from "next/server";
import { asSeat } from "@/db/session";
import { searchByPhone } from "@/services/telecalling";
import { requireScreen } from "@/lib/http";

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q") ?? "";
  return asSeat(async (tx, seat) => {
    const denied = requireScreen(seat, "search");
    if (denied) return denied;
    const rows = await searchByPhone(tx, q);
    return NextResponse.json({
      source: "customers.phone",
      period: "current tenant",
      rows,
    });
  });
}
