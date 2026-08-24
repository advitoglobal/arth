export type Role = "client" | "director";

export type Outcome = {
  id: string;
  tenantId: string;
  name: string;
  owner: string;
  region: string;
  baseline: string;
  current: string;
  target: string;
  deltaPct: number;
  status: "on-track" | "watch" | "at-risk";
  nextProof: string;
};

export type Workstream = {
  id: string;
  tenantId: string;
  name: string;
  phase: string;
  region: string;
  progress: number;
  lead: string;
  nextMilestone: string;
  due: string;
};

export type Decision = {
  id: string;
  tenantId: string;
  title: string;
  summary: string;
  impact: string;
  owner: string;
  due: string;
  riskIfIdle: string;
};

export type AuditEvent = {
  id: string;
  at: string;
  actor: string;
  action: string;
  object: string;
};

export const TENANT = {
  id: "tenant_meridian",
  name: "Meridian Holdings",
  programme: "Global operating system — FY26",
  regions: ["AMER", "EMEA", "APAC"],
  currencies: ["USD", "EUR", "SGD"],
  clientSponsor: "Priya Raman",
  deliveryLead: "Jonah Ellis",
} as const;

export const outcomes: Outcome[] = [
  {
    id: "out-01",
    tenantId: TENANT.id,
    name: "Cycle time to decision",
    owner: "Client operating committee",
    region: "Global",
    baseline: "18 days",
    current: "6.4 days",
    target: "5 days",
    deltaPct: -64,
    status: "on-track",
    nextProof: "Board pack locked 48h before each steering meeting",
  },
  {
    id: "out-02",
    tenantId: TENANT.id,
    name: "Realised programme value",
    owner: "CFO office",
    region: "AMER + EMEA",
    baseline: "$0 booked",
    current: "$4.8m booked",
    target: "$7.2m FY26",
    deltaPct: 67,
    status: "on-track",
    nextProof: "Q3 value ledger signed by finance controllers",
  },
  {
    id: "out-03",
    tenantId: TENANT.id,
    name: "Control exceptions open",
    owner: "Risk & IT",
    region: "APAC",
    baseline: "41",
    current: "9",
    target: "0 material",
    deltaPct: -78,
    status: "watch",
    nextProof: "Two remaining vendor access reviews close Friday",
  },
  {
    id: "out-04",
    tenantId: TENANT.id,
    name: "Client-owned actions completed",
    owner: "Priya Raman",
    region: "Global",
    baseline: "54%",
    current: "91%",
    target: "95%",
    deltaPct: 37,
    status: "on-track",
    nextProof: "Singapore warehouse SLA still waiting on local legal",
  },
];

export const workstreams: Workstream[] = [
  {
    id: "ws-01",
    tenantId: TENANT.id,
    name: "Decision rights & operating cadence",
    phase: "In delivery",
    region: "Global",
    progress: 82,
    lead: "Jonah Ellis",
    nextMilestone: "Steering charter v3 signed",
    due: "28 Aug",
  },
  {
    id: "ws-02",
    tenantId: TENANT.id,
    name: "Value ledger & finance controls",
    phase: "In delivery",
    region: "EMEA",
    progress: 71,
    lead: "Amira Haddad",
    nextMilestone: "Controller dual-control live",
    due: "4 Sep",
  },
  {
    id: "ws-03",
    tenantId: TENANT.id,
    name: "APAC access & vendor hygiene",
    phase: "Stabilise",
    region: "APAC",
    progress: 58,
    lead: "Kenji Mori",
    nextMilestone: "Last two exceptions closed",
    due: "29 Aug",
  },
  {
    id: "ws-04",
    tenantId: TENANT.id,
    name: "Client workspace rollout",
    phase: "Launch",
    region: "AMER",
    progress: 94,
    lead: "Sofia Alves",
    nextMilestone: "Remaining 12 sponsors invited",
    due: "26 Aug",
  },
];

export const decisions: Decision[] = [
  {
    id: "dec-01",
    tenantId: TENANT.id,
    title: "Approve dual-control for value bookings above $250k",
    summary:
      "Finance controllers in London and New York must both attest before a benefit is marked realised. Removes single-person booking risk.",
    impact: "Protects $4.8m already booked and the remaining $2.4m this year.",
    owner: "Priya Raman",
    due: "Today",
    riskIfIdle: "Q3 ledger cannot be signed. Audit will treat bookings as provisional.",
  },
  {
    id: "dec-02",
    tenantId: TENANT.id,
    title: "Close Singapore 3PL privileged access",
    summary:
      "Warehouse vendor still holds standing production credentials. Replacement is a time-boxed, named-user pattern already tested in Sydney.",
    impact: "Clears 2 of 9 remaining control exceptions in APAC.",
    owner: "Kenji Mori + local legal",
    due: "29 Aug",
    riskIfIdle: "APAC remains on watch; board risk paper stays amber.",
  },
  {
    id: "dec-03",
    tenantId: TENANT.id,
    title: "Confirm Friday steering as decision meeting, not status theatre",
    summary:
      "Agenda is three decisions only. Status moves to this workspace. You hold the gavel; delivery brings proof, not slides.",
    impact: "Keeps cycle time on a path from 6.4 days to the 5-day target.",
    owner: "Operating committee",
    due: "28 Aug",
    riskIfIdle: "Cadence slips back to reporting. Value realisation slows.",
  },
];

export const auditLog: AuditEvent[] = [
  {
    id: "aud-01",
    at: "24 Aug 13:42 UTC",
    actor: "Sofia Alves",
    action: "Invited sponsor",
    object: "workspace · AMER cohort",
  },
  {
    id: "aud-02",
    at: "24 Aug 11:08 UTC",
    actor: "Amira Haddad",
    action: "Posted evidence",
    object: "value ledger · EMEA Q3",
  },
  {
    id: "aud-03",
    at: "23 Aug 16:21 UTC",
    actor: "system",
    action: "Tenant isolation check",
    object: "passed · 0 cross-tenant reads",
  },
  {
    id: "aud-04",
    at: "23 Aug 09:04 UTC",
    actor: "Kenji Mori",
    action: "Opened exception",
    object: "APAC vendor access · WS-03",
  },
];

export const directorNotes = [
  {
    title: "What is true this week",
    body: "Meridian is on the value path. Cycle time is 6.4 days. Two APAC exceptions are the only material watch item.",
  },
  {
    title: "What we need from the client",
    body: "Three decisions in the queue. Dual-control is blocking the Q3 ledger. That is the single highest-leverage action.",
  },
  {
    title: "What IT is holding",
    body: "Demo workspace is local-only. No production secrets. Security headers are on. Auth and a real store are the next gated slice.",
  },
];
