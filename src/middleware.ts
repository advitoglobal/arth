import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { canOpen } from "@/lib/access";
import {
  DEMO_USERS,
  hasDemoSession,
  resolveSeatKey,
  screenFromPath,
} from "@/lib/seats";

export function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  if (path === "/w/login" || path === "/w/denied") return NextResponse.next();

  const seatCookie = req.cookies.get("arth_seat")?.value;
  const tenantCookie = req.cookies.get("arth_tenant")?.value;
  if (path.startsWith("/w/") && !hasDemoSession(seatCookie, tenantCookie)) {
    const login = req.nextUrl.clone();
    login.pathname = "/w/login";
    login.search = "";
    return NextResponse.redirect(login);
  }

  const screen = screenFromPath(path);
  if (!screen) return NextResponse.next();

  const key = resolveSeatKey(seatCookie, tenantCookie);
  if (canOpen(DEMO_USERS[key].roleKey, screen)) return NextResponse.next();

  const denied = req.nextUrl.clone();
  denied.pathname = "/w/denied";
  denied.search = "";
  return NextResponse.rewrite(denied, { status: 403 });
}

export const config = {
  matcher: ["/w/:path*"],
};
