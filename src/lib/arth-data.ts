export type Semantic = "overdue" | "settled" | "review" | "draft";

export type Enquiry = {
  id: string;
  tenantId: string;
  name: string;
  vehicle: string;
  branch: string;
  owner: string;
  stage: string;
  hoursOpen: number;
  dueIn?: string;
  amount: number;
  semantic?: "overdue" | "settled";
  note: string;
};

export type CockpitCard = {
  id: string;
  title: string;
  amount: number;
  body: string;
  reason?: string;
  reserved?: boolean;
  href: string;
};

export const TENANT = {
  id: "tenant_whitefield",
  name: "Whitefield Motors",
  group: "Whitefield Motors group",
  branches: ["Whitefield", "Indiranagar", "Electronic City"],
  workspace: "Sales",
} as const;

export const cockpitCards: CockpitCard[] = [
  {
    id: "c1",
    title: "No contact past 48 hours",
    amount: 128400,
    body: "11 enquiries at Whitefield have had no contact for over 48 hours.",
    href: "/workspace/queue?role=principal",
  },
  {
    id: "c2",
    title: "Campaign with no bookings",
    amount: 38000,
    body: "Festive Offer — C3 has spent ₹38,000 and produced no bookings in 21 days.",
    href: "/workspace/spend?role=principal",
  },
  {
    id: "c3",
    title: "Delivery promises broken",
    amount: 18400,
    body: "3 delivery promises broken · oldest 19 days.",
    reason: "Shown because a delivery promise has been broken for 19 days.",
    reserved: true,
    href: "/workspace/queue?filter=delivery&role=principal",
  },
  {
    id: "c4",
    title: "Enquiries with no owner",
    amount: 24600,
    body: "4 enquiries have no owner. Oldest 11 hours.",
    reason: "Shown because enquiries have no owner.",
    reserved: true,
    href: "/workspace/queue?filter=unassigned&role=principal",
  },
  {
    id: "c5",
    title: "Grand Vitara — Search",
    amount: 184000,
    body: "₹1,84,000 spent. 20 bookings. Cost per booking ₹9,200.",
    href: "/workspace/spend?role=principal",
  },
  {
    id: "c6",
    title: "Brezza — Meta lead form",
    amount: 96200,
    body: "₹96,200 spent. 13 bookings. Cost per booking ₹7,400.",
    href: "/workspace/spend?role=principal",
  },
];

export const enquiries: Enquiry[] = [
  {
    id: "ENQ-1842",
    tenantId: TENANT.id,
    name: "Ramesh Kumar",
    vehicle: "Grand Vitara",
    branch: "Whitefield",
    owner: "R. Kumar",
    stage: "Follow-up",
    hoursOpen: 61,
    amount: 11200,
    semantic: "overdue",
    note: "No contact for 61 hours",
  },
  {
    id: "ENQ-1849",
    tenantId: TENANT.id,
    name: "S. Nayak",
    vehicle: "Brezza",
    branch: "Whitefield",
    owner: "A. Iyer",
    stage: "Test drive",
    hoursOpen: 6,
    dueIn: "in 2h",
    amount: 8400,
    note: "Callback promised for 17:00",
  },
  {
    id: "ENQ-1851",
    tenantId: TENANT.id,
    name: "Meera Joshi",
    vehicle: "Fronx",
    branch: "Indiranagar",
    owner: "A. Iyer",
    stage: "Finance",
    hoursOpen: 28,
    dueIn: "in 4h",
    amount: 9100,
    note: "Disbursement pending",
  },
  {
    id: "ENQ-1820",
    tenantId: TENANT.id,
    name: "Lakshmi Rao",
    vehicle: "Fronx",
    branch: "Electronic City",
    owner: "R. Kumar",
    stage: "Delivered",
    hoursOpen: 0,
    amount: 8100,
    semantic: "settled",
    note: "Delivered 02 Aug · promise met",
  },
];

export const spendRows = [
  {
    campaign: "Grand Vitara — Search",
    spend: 184000,
    bookings: 20,
    cost: 9200,
  },
  {
    campaign: "Brezza — Meta lead form",
    spend: 96200,
    bookings: 13,
    cost: 7400,
  },
  {
    campaign: "Festive Offer — C3",
    spend: 38000,
    bookings: 0,
    cost: 38000,
  },
];

export const dayPanel = {
  person: "A. Iyer",
  date: "Monday 24 August",
  due: 16,
  closed: 14,
  carry: 2,
  oldestDays: 3,
};

export const auditLog = [
  {
    id: "aud-01",
    at: "24 Aug 13:42 IST",
    actor: "A. Iyer",
    action: "Logged call",
    object: "ENQ-1849",
  },
  {
    id: "aud-02",
    at: "24 Aug 11:08 IST",
    actor: "system",
    action: "Tenant isolation check",
    object: "passed",
  },
  {
    id: "aud-03",
    at: "23 Aug 16:21 IST",
    actor: "R. Kumar",
    action: "Marked delivered",
    object: "ENQ-1820",
  },
];
