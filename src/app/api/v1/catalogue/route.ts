import { NextResponse } from "next/server";
import { asSeat } from "@/db/session";
import { listCatalogue, listPriceColours } from "@/services/catalogue";
import { requireAnyScreen } from "@/lib/http";

export async function GET(req: Request) {
  const model = new URL(req.url).searchParams.get("model") ?? "";
  try {
    return await asSeat(async (tx, seat) => {
      const denied = requireAnyScreen(seat, ["new", "tele", "admin"]);
      if (denied) return denied;
      const rows = await listCatalogue(tx);
      const colours = await listPriceColours(tx, model || undefined);
      const models = [...new Set(rows.map((r) => r.model))];
      const variants = rows
        .filter((r) => !model || r.model === model)
        .map((r) => ({ model: r.model, variant: r.variant }));
      return NextResponse.json({ models, variants, colours });
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Not loaded.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
