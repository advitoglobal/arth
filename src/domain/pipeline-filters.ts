import { SOURCE_LABEL } from "@/lib/labels";

/** Sources the My enquiries filter can name. Each key has a label. */
export const PIPE_SOURCE_KEYS = ["google", "meta", "walk_in", "inbound_call"] as const;

export const PIPE_OVERDUE = [
  { key: "yes", label: "Overdue" },
  { key: "no", label: "Not overdue" },
] as const;

export const PIPE_PARKED = [
  { key: "yes", label: "Parked" },
  { key: "no", label: "Not parked" },
] as const;

export function rendererKeys() {
  return {
    sources: [...PIPE_SOURCE_KEYS],
    overdue: PIPE_OVERDUE.map((r) => r.key),
    parked: PIPE_PARKED.map((r) => r.key),
  };
}

export function sourceFilterLabel(key: string) {
  return SOURCE_LABEL[key] ?? key;
}

export function presentFilter(value?: string | null) {
  const v = value?.trim() ?? "";
  return v.length ? v : "";
}
