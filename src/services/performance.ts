import type { Tx } from "@/db/with-tenant";
import { STAGE_LABEL } from "@/lib/labels";

export type PerformanceTeammate = {
  full_name: string;
  username?: string | null;
  branch?: string | null;
  owned: number;
  late: number;
  connects_today: number;
};

export type PerformanceSnapshot = {
  ok: boolean;
  role: string;
  scope: string;
  book: number;
  owned: number;
  late: number;
  parked: number;
  due_today: number;
  unowned: number;
  teles: number;
  stages: Record<string, number>;
  team: PerformanceTeammate[];
  today_outcomes: number;
  today_connects: number;
  today_short_connects: number;
  today_points: number;
  today_handoffs: number;
};

export type PerformanceView = {
  snapshot: PerformanceSnapshot;
  holding: string[];
  gaps: string[];
  plan: { text: string; href?: string }[];
};

function n(value: unknown) {
  const x = Number(value ?? 0);
  return Number.isFinite(x) ? x : 0;
}

export async function performanceSnapshot(tx: Tx): Promise<PerformanceSnapshot> {
  const [row] = await tx<{ snap: PerformanceSnapshot }[]>`
    SELECT arth_performance_snapshot() AS snap
  `;
  const raw = (typeof row?.snap === "string" ? JSON.parse(row.snap) : row?.snap) as
    | PerformanceSnapshot
    | undefined;
  if (!raw || raw.ok === false) {
    throw new Error("Performance for this seat could not be read.");
  }
  const stages: Record<string, number> = {};
  for (const [k, v] of Object.entries(raw.stages ?? {})) {
    stages[k] = n(v);
  }
  const team = (raw.team ?? []).map((t) => ({
    full_name: t.full_name,
    username: t.username,
    branch: t.branch,
    owned: n(t.owned),
    late: n(t.late),
    connects_today: n(t.connects_today),
  }));
  return {
    ok: true,
    role: raw.role,
    scope: raw.scope,
    book: n(raw.book),
    owned: n(raw.owned),
    late: n(raw.late),
    parked: n(raw.parked),
    due_today: n(raw.due_today),
    unowned: n(raw.unowned),
    teles: n(raw.teles),
    stages,
    team,
    today_outcomes: n(raw.today_outcomes),
    today_connects: n(raw.today_connects),
    today_short_connects: n(raw.today_short_connects),
    today_points: n(raw.today_points),
    today_handoffs: n(raw.today_handoffs),
  };
}

function names(n: number, one: string, many: string) {
  return n === 1 ? `1 ${one}` : `${n} ${many}`;
}

export function analysePerformance(snap: PerformanceSnapshot): PerformanceView {
  const holding: string[] = [];
  const gaps: string[] = [];
  const plan: { text: string; href?: string }[] = [];
  const role = snap.role;
  const qualified = n(snap.stages.qualified);
  const booked = n(snap.stages.booked);
  const delivered = n(snap.stages.delivered);
  const heaviest = [...snap.team].sort((a, b) => b.late - a.late)[0];

  if (role === "tele" || role === "svctele") {
    if (snap.late === 0) {
      holding.push("Nothing you own is late. First calls and follow-ups are inside the clock.");
    }
    if (snap.today_connects > 0) {
      holding.push(
        `${names(snap.today_connects, "scoring connect", "scoring connects")} logged today. Those names now sit on your book.`,
      );
    }
    if (snap.today_handoffs > 0) {
      holding.push(`${names(snap.today_handoffs, "enquiry was", "enquiries were")} handed to sales today.`);
    }
    if (snap.late > 0) {
      gaps.push(
        `${names(snap.late, "enquiry is", "enquiries are")} late on your book. Superiors will read this number first. Today already lines them up.`,
      );
    }
    if (snap.unowned > 0) {
      gaps.push(
        `${names(snap.unowned, "new name is", "new names are")} still shared at this branch. They stay there until someone reaches the customer for 20 seconds or more.`,
      );
    }
    if (snap.today_connects === 0 && snap.due_today > 0) {
      gaps.push("No scoring connect is on the ledger today. A dial without 20 seconds on the timer does not move ownership.");
    }
    if (snap.today_short_connects > 0) {
      gaps.push(
        `${names(snap.today_short_connects, "connected call was", "connected calls were")} under 20 seconds today. Those score nothing and do not claim the name.`,
      );
    }
    if (snap.parked > 0) {
      gaps.push(`${names(snap.parked, "name is", "names are")} parked. They are off Today until the revisit day.`);
    }
    if (qualified > 0 && snap.today_handoffs === 0) {
      gaps.push(
        `${names(qualified, "enquiry sits", "enquiries sit")} at Qualified. Hand to sales when the customer is ready to convert. Telecalling does not close the deal.`,
      );
    }
    if (snap.due_today > 0) {
      plan.push({
        text: `Work Today. ${snap.due_today} ${snap.due_today === 1 ? "name is" : "names are"} due now, late first.`,
        href: "/w/dayb",
      });
    } else {
      plan.push({ text: "Today is clear. File new inbound names in Search, or open My enquiries for the rest of the book.", href: "/w/search" });
    }
    if (qualified > 0) {
      plan.push({ text: "Open Qualified names and hand them to sales.", href: "/w/pipe?stage=qualified" });
    }
  } else if (role === "sales") {
    if (snap.late === 0 && snap.owned > 0) {
      holding.push("Follow-ups on names handed to you are inside the clock.");
    }
    if (booked > 0) {
      holding.push(`${names(booked, "enquiry is", "enquiries are")} booked. Protect the promise through delivery.`);
    }
    if (snap.owned === 0) {
      gaps.push("Nothing has been handed to you yet. Conversion starts after telecalling qualifies.");
    }
    if (snap.late > 0) {
      gaps.push(`${names(snap.late, "handed enquiry is", "handed enquiries are")} late. That is the conversion clock, not telecalling.`);
    }
    const waiting = n(snap.stages.quotation) + n(snap.stages.negotiation) + n(snap.stages.test_drive);
    if (waiting > 0) {
      gaps.push(`${names(waiting, "enquiry is", "enquiries are")} between test drive and negotiation. Stage moves one step. It is not edited.`);
    }
    if (snap.owned > 0) {
      plan.push({ text: "Open My enquiries and convert what telecalling handed you.", href: "/w/pipe" });
    } else {
      plan.push({ text: "Wait for a handoff, or ask the digital desk why Qualified names are not moving.", href: "/w/pipe" });
    }
  } else if (role === "lead") {
    if (snap.late === 0) {
      holding.push("The team book has no late follow-up on this read.");
    }
    if (snap.team.some((t) => t.connects_today > 0)) {
      holding.push("At least one telecaller logged a scoring connect today.");
    }
    if (snap.late > 0) {
      gaps.push(`${names(snap.late, "enquiry is", "enquiries are")} late on the team book. That is the number a superior will ask about.`);
    }
    if (heaviest && heaviest.late > 0) {
      gaps.push(`${heaviest.full_name} is carrying ${heaviest.late} late ${heaviest.late === 1 ? "name" : "names"}.`);
    }
    if (snap.unowned > 0) {
      gaps.push(`${names(snap.unowned, "shared name is", "shared names are")} still unowned. The team reaches them; you do not assign on open.`);
    }
    plan.push({ text: "Read the team rows below, then open My enquiries for the names in your bucket.", href: "/w/pipe" });
    if (snap.unowned > 0) {
      plan.push({ text: "The shared book is on Today for every telecaller at the branch until a reach.", href: "/w/search" });
    }
  } else if (role === "mgr") {
    if (snap.late === 0) {
      holding.push("This branch has no late telecalling clock on this read.");
    }
    if (snap.unowned === 0 && snap.book > 0) {
      holding.push("The shared book is empty. New names have been reached or none have arrived.");
    }
    if (snap.today_connects > 0) {
      holding.push(`${names(snap.today_connects, "scoring connect", "scoring connects")} on this branch today.`);
    }
    if (snap.late > 0) {
      gaps.push(`${names(snap.late, "enquiry is", "enquiries are")} late at this branch. That is the floor target to clear.`);
    }
    if (heaviest && heaviest.late > 0) {
      gaps.push(`${heaviest.full_name} has ${heaviest.late} late. Place or coach against that load, do not pull another dealer.`);
    }
    if (snap.unowned > 12) {
      gaps.push(
        `${snap.unowned} names are still shared. Place a name when the floor needs a direction. Until then every telecaller here can see them.`,
      );
    } else if (snap.unowned > 0) {
      gaps.push(`${names(snap.unowned, "name is", "names are")} still shared. Place only when the floor needs a direction.`);
    }
    if (snap.teles === 0) {
      gaps.push("No telecaller is active on this branch. The floor cannot move.");
    }
    plan.push({ text: "Open The floor. Late and the shared book are the two numbers to move today.", href: "/w/desk" });
    if (snap.unowned > 0) {
      plan.push({ text: "Place a shared name onto a telecaller who has room.", href: "/w/desk" });
    }
  } else if (role === "owner" || role === "ops" || role === "adv" || role === "admin") {
    if (snap.late === 0) {
      holding.push("No late telecalling clock at this dealer on this read.");
    }
    if (snap.today_connects > 0) {
      holding.push(`${names(snap.today_connects, "scoring connect", "scoring connects")} recorded at this dealer today.`);
    }
    if (delivered > 0) {
      holding.push(`${names(delivered, "enquiry is", "enquiries are")} delivered on the book.`);
    }
    if (snap.late > 0) {
      gaps.push(`${names(snap.late, "enquiry is", "enquiries are")} late at this dealer. The digital desk owns the floor; you own this number.`);
    }
    if (snap.unowned > 0) {
      gaps.push(`${names(snap.unowned, "new name is", "new names are")} still unreached. That is first-response risk.`);
    }
    if (snap.teles === 0) {
      gaps.push("No telecaller is active. Ask Advito or the desk to seat the floor.");
    }
    const idle = snap.team.filter((t) => t.connects_today === 0 && t.late > 0);
    if (idle.length > 0) {
      gaps.push(
        `${idle.map((t) => t.full_name).join(", ")} ${idle.length === 1 ? "has" : "have"} late names and no scoring connect today.`,
      );
    }
    plan.push({
      text: role === "ops"
        ? "Stay on this dealer only. Leave before opening another."
        : "Hold the digital desk to late and shared. Other departments are not on this screen yet.",
      href: role === "ops" ? undefined : "/w/prin",
    });
    plan.push({ text: "Open the book if you need a name. Use Search, not a dump of twenty lakh rows.", href: "/w/search" });
  }

  if (holding.length === 0) {
    holding.push("No strength is visible on this read yet. The gaps below are the work.");
  }
  if (gaps.length === 0) {
    gaps.push("No gap is visible on this read. Keep the clocks inside the working day.");
  }
  if (plan.length === 0) {
    plan.push({ text: "Open your landing screen and work the list in front of you." });
  }

  return { snapshot: snap, holding, gaps, plan };
}

export async function loadPerformance(tx: Tx): Promise<PerformanceView> {
  const snapshot = await performanceSnapshot(tx);
  return analysePerformance(snapshot);
}

export function stageMix(snap: PerformanceSnapshot) {
  return Object.entries(STAGE_LABEL)
    .map(([key, label]) => ({ key, label, n: n(snap.stages[key]) }))
    .filter((row) => row.n > 0);
}
