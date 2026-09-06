export const JUNK_REASONS = [
  { key: "wrong_number", label: "Wrong number", closes: true },
  { key: "misclick", label: "Misclick or accidental submission", closes: true },
  { key: "not_a_customer", label: "Not a customer: job seeker, vendor, competitor", closes: true },
  { key: "route_other_dept", label: "Existing customer, different department", closes: false },
  { key: "duplicate", label: "Duplicate of an existing enquiry", closes: false },
] as const;

export type JunkReasonKey = (typeof JUNK_REASONS)[number]["key"];

export function junkReason(key: string) {
  return JUNK_REASONS.find((r) => r.key === key);
}

export function isRealEnquiry(row: { is_not_enquiry?: boolean | null }) {
  return !row.is_not_enquiry;
}

export const REAL_ENQUIRY_SQL = "COALESCE(is_not_enquiry, false) = false";
