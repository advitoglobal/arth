import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({
    service: "arth",
    status: "ok",
    slice: "client-os-demo",
    time: new Date().toISOString(),
  });
}
