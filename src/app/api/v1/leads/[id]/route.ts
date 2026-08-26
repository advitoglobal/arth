import { NextResponse } from "next/server";
import { asSeat } from "@/db/session";
import { getLead } from "@/services/telecalling";
import { requireScreen } from "@/lib/http";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  return asSeat(async (tx, seat) => {
    const denied = requireScreen(seat, "rec");
    if (denied) return denied;
    const data = await getLead(tx, id);
    if (!data.lead) {
      return NextResponse.json({ error: "This enquiry is not in your tenant." }, { status: 404 });
    }
    return NextResponse.json({
      source: "enquiry record and activity ledger",
      period: "full ledger",
      ...data,
    });
  });
}
