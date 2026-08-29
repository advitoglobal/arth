import { NextResponse } from "next/server";
import { asSeat } from "@/db/session";
import {
  freezeQuotation,
  setAssignmentMode,
  uploadServiceDue,
  saveProfile,
  requestPasswordReset,
} from "@/services/floor-register";
import { requireAnyScreen } from "@/lib/http";

export async function POST(req: Request) {
  const body = await req.json();
  const action = String(body.action ?? "");
  try {
    if (action === "forgot") {
      const { sql } = await import("@/db/with-tenant");
      await sql`SELECT arth_request_password_reset(${String(body.username ?? "")})`;
      return NextResponse.json({ recorded: "If that username exists, the manager has been told." });
    }
    return await asSeat(async (tx, seat) => {
      if (action === "quote") {
        const denied = requireAnyScreen(seat, ["tele", "pipe"]);
        if (denied) return denied;
        return NextResponse.json(await freezeQuotation(tx, String(body.leadId), seat.userId));
      }
      if (action === "mode") {
        const denied = requireAnyScreen(seat, ["desk", "admin"]);
        if (denied) return denied;
        const [pos] = await tx<{ branch_id: string | null }[]>`
          SELECT p.branch_id::text FROM users u
          LEFT JOIN positions p ON p.id = u.position_id
          WHERE u.id = ${seat.userId}::uuid
        `;
        if (!pos?.branch_id) throw new Error("This seat has no branch.");
        return NextResponse.json(
          await setAssignmentMode(tx, seat.userId, pos.branch_id, body.mode === "pool" ? "pool" : "direct"),
        );
      }
      if (action === "upload") {
        const denied = requireAnyScreen(seat, ["upload", "desk", "admin"]);
        if (denied) return denied;
        const rows = String(body.csv ?? "")
          .split(/\n/)
          .map((line) => line.split(",").map((s) => s.trim()))
          .filter((p) => p[0] && p[1])
          .map(([name, phone, model]) => ({ name, phone, model }));
        return NextResponse.json(
          await uploadServiceDue(tx, {
            actorId: seat.userId,
            batchName: String(body.batchName || "Manager upload"),
            rows,
          }),
        );
      }
      if (action === "profile") {
        return NextResponse.json(
          await saveProfile(tx, seat.userId, {
            fullName: String(body.fullName ?? ""),
            whatsappPhone: String(body.whatsappPhone ?? ""),
          }),
        );
      }
      if (action === "reassign") {
        const denied = requireAnyScreen(seat, ["desk", "pipe", "admin", "prin"]);
        if (denied) return denied;
        const { reassignLead } = await import("@/services/floor-register");
        return NextResponse.json(
          await reassignLead(tx, {
            leadId: String(body.leadId),
            actorId: seat.userId,
            toUserId: String(body.toUserId),
            reason: String(body.reason ?? ""),
          }),
        );
      }
      return NextResponse.json({ error: "Unknown action." }, { status: 400 });
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Not saved." },
      { status: 400 },
    );
  }
}
