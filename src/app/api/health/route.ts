import { NextResponse } from "next/server";
import { sql } from "@/db/with-tenant";

export async function GET() {
  try {
    const [row] = await sql<{ n: string }[]>`SELECT 1::text AS n`;
    return NextResponse.json({
      service: "arth",
      status: "ok",
      db: row.n === "1" ? "up" : "unknown",
      slice: "telecalling-m2",
      time: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json(
      { service: "arth", status: "degraded", db: "down" },
      { status: 503 },
    );
  }
}
