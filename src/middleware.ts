import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { canOpen } from "@/lib/access";
import {
  DEMO_USERS,
  hasDemoSession,
  resolveSeatKey,
  screenFromPath,
} from "@/lib/seats";

function passPath(req: NextRequest) {
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-arth-path", req.nextUrl.pathname);
  return NextResponse.next({ request: { headers: requestHeaders } });
}

export function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const seatCookie = req.cookies.get("arth_seat")?.value;
  const signedIn = hasDemoSession(seatCookie);
  const key = resolveSeatKey(seatCookie);

  if (path === "/w/login") {
    return passPath(req);
  }

  if (path === "/w/denied") return passPath(req);

  if (path.startsWith("/w/") && !signedIn) {
    const login = req.nextUrl.clone();
    login.pathname = "/w/login";
    login.search = "";
    return NextResponse.redirect(login);
  }

  const screen = screenFromPath(path);
  if (!screen) return passPath(req);
  if (!key) {
    const login = req.nextUrl.clone();
    login.pathname = "/w/login";
    login.search = "";
    return NextResponse.redirect(login);
  }
  if (canOpen(DEMO_USERS[key].roleKey, screen)) return passPath(req);

  const denied = req.nextUrl.clone();
  denied.pathname = "/w/denied";
  denied.search = "";
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-arth-path", "/w/denied");
  return NextResponse.rewrite(denied, {
    status: 403,
    request: { headers: requestHeaders },
  });
}

export const config = {
  matcher: ["/w/:path*"],
};
