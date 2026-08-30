import { NextResponse } from "next/server";
import { asSeat } from "@/db/session";
import { requireScreen } from "@/lib/http";
import { REPORT_KINDS, rowsToCsv, rowsToPdf, runArthbot } from "@/services/arthbot";

export async function POST(req: Request) {
  const body = await req.json();
  try {
    return await asSeat(async (tx, seat) => {
      const denied = requireScreen(seat, "bot");
      if (denied) return denied;
      const question = String(body.question ?? "");
      const result = await runArthbot(tx, question, body.kind ? String(body.kind) : undefined);
      return NextResponse.json(result);
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Refused.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const kind = url.searchParams.get("kind") ?? "late";
  const format = url.searchParams.get("format") ?? "csv";
  try {
    return await asSeat(async (tx, seat) => {
      const denied = requireScreen(seat, "bot");
      if (denied) return denied;
      if (!(REPORT_KINDS as readonly string[]).includes(kind)) {
        return NextResponse.json({ error: "Unknown report." }, { status: 400 });
      }
      const result = await runArthbot(tx, kind, kind);
      if (format === "pdf") {
        const buf = rowsToPdf(`Arthbot ${kind} · ${seat.tenantName}`, result.rows);
        return new NextResponse(new Uint8Array(buf), {
          headers: {
            "content-type": "application/pdf",
            "content-disposition": `attachment; filename="arthbot-${kind}.pdf"`,
          },
        });
      }
      const csv = rowsToCsv(kind, result.rows);
      return new NextResponse(csv, {
        headers: {
          "content-type": "text/csv; charset=utf-8",
          "content-disposition": `attachment; filename="arthbot-${kind}.csv"`,
        },
      });
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Refused.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
