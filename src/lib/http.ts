import { NextResponse } from "next/server";
import { canOpen, type Seat } from "@/db/session";

export function forbiddenJson() {
  return NextResponse.json(
    { error: "You cannot open this screen" },
    { status: 403 },
  );
}

export function requireScreen(seat: Seat, screen: string) {
  if (!canOpen(seat.roleKey, screen)) return forbiddenJson();
  return null;
}
