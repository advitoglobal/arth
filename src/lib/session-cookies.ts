import type { Seat } from "@/lib/seats";

type Jar = {
  set: (
    name: string,
    value: string,
    opts?: { httpOnly?: boolean; sameSite?: "lax"; path?: string; maxAge?: number },
  ) => void;
};

const base = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  secure: Boolean(process.env.VERCEL),
};

export function applySeatCookies(jar: Jar, seat: Seat) {
  jar.set("arth_seat", seat.username, base);
  jar.set("arth_role", seat.roleKey, base);
  jar.set("arth_kind", seat.kind, base);
  jar.set("arth_tenant", seat.kind === "platform" ? "" : seat.tenantId, base);
  jar.set("arth_view_tenant", "", { ...base, maxAge: 0 });
}

export function clearSeatCookies(jar: Jar) {
  const gone = { ...base, maxAge: 0 };
  jar.set("arth_seat", "", gone);
  jar.set("arth_role", "", gone);
  jar.set("arth_kind", "", gone);
  jar.set("arth_tenant", "", gone);
  jar.set("arth_view_tenant", "", gone);
}

export function setViewTenant(jar: Jar, tenantId: string) {
  jar.set("arth_view_tenant", tenantId, base);
}

export function clearViewTenant(jar: Jar) {
  jar.set("arth_view_tenant", "", { ...base, maxAge: 0 });
}
