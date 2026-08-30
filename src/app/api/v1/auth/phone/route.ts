import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { authenticatePhone } from "@/lib/auth";
import { landingPath } from "@/lib/seats";
import { applySeatCookies } from "@/lib/session-cookies";

export async function POST(req: Request) {
  const body = await req.json();
  const result = await authenticatePhone(String(body.phone ?? ""), String(body.code ?? ""));
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  const jar = await cookies();
  applySeatCookies(jar, result.seat);
  return NextResponse.json({ ok: true, href: landingPath(result.seat) });
}
