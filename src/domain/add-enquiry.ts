/** Add enquiry: four-field capture, then qualify as chips. SPEC telecaller view 05. */

export const CAPTURE_FIELDS = [
  { key: "phone", label: "Mobile" },
  { key: "name", label: "Customer name" },
  { key: "model", label: "Model interest" },
  { key: "source", label: "Source" },
] as const;

export const CHIP_GROUPS = [
  { key: "vehicle", label: "Vehicle", advise: "price" },
  { key: "buyer", label: "Buyer type", advise: null },
  { key: "exchange", label: "Exchange", advise: "valuation" },
  { key: "finance", label: "Finance", advise: "emi" },
  { key: "meeting", label: "Meeting", advise: "testdrive" },
  { key: "testdrive", label: "Test drive", advise: "testdrive" },
  { key: "timing", label: "Timing", advise: "delivery" },
  { key: "decision", label: "Decision", advise: null },
  { key: "consent", label: "Consent", advise: null },
] as const;

export type ChipGroupKey = (typeof CHIP_GROUPS)[number]["key"];

export const BUYER_TYPE_LABEL: Record<string, string> = {
  first_time: "First time",
  additional: "Additional",
  replacement: "Replacement",
  exchange: "Exchange",
  fleet: "Fleet",
};

export const WHO_DECIDES_LABEL: Record<string, string> = {
  self: "Self",
  spouse: "Spouse",
  parent: "Parent",
  partner: "Partner",
};

export const SEEN_VEHICLE_LABEL: Record<string, string> = {
  yes: "Has seen it",
  no: "Has not seen it",
};

export const FINANCE_PATH_LABEL: Record<string, string> = {
  finance: "Finance",
  cash: "Cash",
};

export const MEETING_KIND_LABEL: Record<string, string> = {
  showroom: "Showroom visit",
  home: "Home visit",
};

export const EXCHANGE_PLACE_LABEL: Record<string, string> = {
  showroom: "At showroom",
  customer: "At customer place",
};

export const TESTDRIVE_NEED_LABEL: Record<string, string> = {
  yes: "Needed",
  no: "Not needed",
};

export const EXCHANGE_YEAR_KEYS = ["2018", "2019", "2020", "2021", "2022", "2023", "2024", "2025"] as const;

const IST = "Asia/Kolkata";

export function chipGroupLabel(key: string) {
  return CHIP_GROUPS.find((g) => g.key === key)?.label ?? key;
}

export function chipGroupAdvise(key: string) {
  return CHIP_GROUPS.find((g) => g.key === key)?.advise ?? null;
}

export function buyerTypeLabel(key: string | null | undefined) {
  if (!key) return "";
  return BUYER_TYPE_LABEL[key] ?? key.replaceAll("_", " ");
}

export function whoDecidesLabel(key: string | null | undefined) {
  if (!key) return "";
  return WHO_DECIDES_LABEL[key] ?? key.replaceAll("_", " ");
}

export function exchangeVisible(buyerType: string | null | undefined) {
  return buyerType === "exchange" || buyerType === "replacement";
}

export function captureReady(input: {
  phone: string;
  name: string;
  model: string;
  source: string;
}) {
  const digits = input.phone.replace(/\D/g, "");
  return digits.length === 10 && input.name.trim().length >= 2 && Boolean(input.model) && Boolean(input.source);
}

export function captureFilledCount(input: {
  phone: string;
  name: string;
  model: string;
  source: string;
}) {
  const digits = input.phone.replace(/\D/g, "");
  return [
    digits.length >= 10,
    input.name.trim().length >= 2,
    Boolean(input.model),
    Boolean(input.source),
  ].filter(Boolean).length;
}

export type QualifyState = {
  variant?: string;
  colour?: string;
  altModel?: string;
  buyerType?: string;
  exchangeVehicle?: string;
  exchangePlace?: string;
  financePath?: string;
  financeBankKey?: string;
  meetingKind?: string;
  meetingAt?: string;
  testdriveNeeded?: boolean | null;
  testdrivePrefDate?: string;
  expectedBookingDate?: string;
  expectedDeliveryDate?: string;
  whoElseDecides?: string;
  seenVehicle?: boolean | null;
  consentTouched?: boolean;
};

export function qualifyGroupsForDepartment(department: string) {
  if (department !== "sales") return CHIP_GROUPS.filter((g) => g.key === "consent");
  return CHIP_GROUPS;
}

export function groupFilled(key: ChipGroupKey, state: QualifyState) {
  if (key === "vehicle") return Boolean(state.variant || state.colour || state.altModel);
  if (key === "buyer") return Boolean(state.buyerType);
  if (key === "exchange") {
    if (!exchangeVisible(state.buyerType)) return true;
    return Boolean(state.exchangeVehicle || state.exchangePlace);
  }
  if (key === "finance") return Boolean(state.financePath);
  if (key === "meeting") return Boolean(state.meetingKind || state.meetingAt);
  if (key === "testdrive") return state.testdriveNeeded !== null && state.testdriveNeeded !== undefined;
  if (key === "timing") return Boolean(state.expectedBookingDate || state.expectedDeliveryDate);
  if (key === "decision") {
    return Boolean(state.whoElseDecides) || state.seenVehicle === true || state.seenVehicle === false;
  }
  if (key === "consent") return Boolean(state.consentTouched);
  return false;
}

export function enquiryProgress(input: {
  captured: boolean;
  capture: { phone: string; name: string; model: string; source: string };
  qualify: QualifyState;
  department: string;
}) {
  const captureMax = CAPTURE_FIELDS.length;
  const captureNow = input.captured ? captureMax : captureFilledCount(input.capture);
  const groups = qualifyGroupsForDepartment(input.department);
  const qualifyMax = groups.length;
  const qualifyNow = input.captured ? groups.filter((g) => groupFilled(g.key, input.qualify)).length : 0;
  const requiredDone = input.captured;
  return {
    captureNow,
    captureMax,
    qualifyNow,
    qualifyMax,
    filled: captureNow + qualifyNow,
    total: captureMax + qualifyMax,
    requiredDone,
    percent: Math.round(((captureNow + qualifyNow) / (captureMax + qualifyMax)) * 100),
  };
}

export function bookingMonthChips(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: IST,
    year: "numeric",
    month: "2-digit",
  }).formatToParts(now);
  const year = Number(parts.find((p) => p.type === "year")?.value ?? "2026");
  const month = Number(parts.find((p) => p.type === "month")?.value ?? "9");
  const out: { key: string; label: string }[] = [];
  for (let i = 0; i < 6; i += 1) {
    const d = new Date(Date.UTC(year, month - 1 + i, 1));
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, "0");
    const key = `${y}-${m}-01`;
    const label = d.toLocaleString("en-IN", { month: "short", year: "numeric", timeZone: "UTC" });
    out.push({ key, label });
  }
  return out;
}

export function rendererKeys() {
  return {
    capture: CAPTURE_FIELDS.map((f) => f.key),
    groups: CHIP_GROUPS.map((g) => g.key),
    buyer: Object.keys(BUYER_TYPE_LABEL),
    who: Object.keys(WHO_DECIDES_LABEL),
    seen: Object.keys(SEEN_VEHICLE_LABEL),
    finance: Object.keys(FINANCE_PATH_LABEL),
    meeting: Object.keys(MEETING_KIND_LABEL),
    exchangePlace: Object.keys(EXCHANGE_PLACE_LABEL),
    testdrive: Object.keys(TESTDRIVE_NEED_LABEL),
  };
}
