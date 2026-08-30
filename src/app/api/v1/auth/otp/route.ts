import { NextResponse } from "next/server";
import { issueLoginOtp } from "@/lib/auth";

export async function POST(req: Request) {
  const body = await req.json();
  const result = await issueLoginOtp(String(body.phone ?? ""));
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({
    recorded: "If this number belongs to a live seat, a six-digit code was issued. No SMS vendor is connected. The demonstration code is shown once so the floor can sign in.",
    demoCode: result.demoCode || undefined,
  });
}
