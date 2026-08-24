import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { canOpen } from "@/lib/access";
import { DEMO_USERS, resolveSeatKey, screenFromPath } from "@/lib/seats";

export function middleware(req: NextRequest) {
  const screen = screenFromPath(req.nextUrl.pathname);
  if (!screen) return NextResponse.next();

  const key = resolveSeatKey(
    req.cookies.get("arth_seat")?.value,
    req.cookies.get("arth_tenant")?.value,
  );
  if (canOpen(DEMO_USERS[key].roleKey, screen)) return NextResponse.next();

  const denied = req.nextUrl.clone();
  denied.pathname = "/w/denied";
  denied.search = "";
  return NextResponse.rewrite(denied, { status: 403 });
}

export const config = {
  matcher: ["/w/dayb", "/w/tele", "/w/pipe", "/w/rec", "/w/search", "/w/notif", "/w/profile"],
};
