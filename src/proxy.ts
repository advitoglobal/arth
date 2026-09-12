import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { canOpen } from "@/lib/access";
import {
  DEMO_USERS,
  hasDemoSession,
  isPlatformRole,
  resolveSeatKey,
  screenFromPath,
} from "@/lib/seats";

function passPath(req: NextRequest) {
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-arth-path", req.nextUrl.pathname);
  return NextResponse.next({ request: { headers: requestHeaders } });
}

function roleOf(req: NextRequest) {
  const fromCookie = req.cookies.get("arth_role")?.value?.trim();
  if (fromCookie) return fromCookie;
  const key = resolveSeatKey(req.cookies.get("arth_seat")?.value);
  return key ? DEMO_USERS[key].roleKey : null;
}

function sendLogin(req: NextRequest) {
  const login = req.nextUrl.clone();
  login.pathname = "/w/login";
  login.search = "";
  return NextResponse.redirect(login);
}

function rewriteDenied(req: NextRequest) {
  const denied = req.nextUrl.clone();
  denied.pathname = "/w/denied";
  denied.search = "";
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-arth-path", "/w/denied");
  requestHeaders.set("x-arth-refused", req.nextUrl.pathname);
  return NextResponse.rewrite(denied, {
    status: 403,
    request: { headers: requestHeaders },
  });
}

export function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const seatCookie = req.cookies.get("arth_seat")?.value;
  const signedIn = hasDemoSession(seatCookie);
  const role = roleOf(req);

  if (path === "/w/login") return passPath(req);
  if (path === "/w/denied") return passPath(req);

  if (path.startsWith("/a/")) {
    if (!signedIn || !role || !isPlatformRole(role)) {
      if (!signedIn) return sendLogin(req);
      return rewriteDenied(req);
    }
    if (path.startsWith("/a/onboard") && !canOpen(role, "aonboard")) {
      return rewriteDenied(req);
    }
    return passPath(req);
  }

  if (path.startsWith("/w/") && !signedIn) return sendLogin(req);

  if (path.startsWith("/w/") && role && isPlatformRole(role)) {
    const home = req.nextUrl.clone();
    home.pathname = role === "adv_onboard" ? "/a/onboard" : "/a/dealers";
    home.search = "";
    return NextResponse.redirect(home);
  }

  const screen = screenFromPath(path);
  if (!screen) return passPath(req);
  if (!role) return sendLogin(req);
  if (canOpen(role, screen)) return passPath(req);

  return rewriteDenied(req);
}

export const config = {
  matcher: ["/w/:path*", "/a/:path*"],
};
