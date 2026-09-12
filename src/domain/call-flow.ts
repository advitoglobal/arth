import { nextWorkingOpen, type DayHours } from "@/domain/clock";

export const WRAP_UP_SECONDS = 90;

export type CallPhase = "idle" | "dialling" | "ringing" | "connected" | "ended";

export function callPhaseLabel(phase: CallPhase, seconds: number) {
  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");
  if (phase === "idle") return "Ready";
  if (phase === "dialling") return "Dialling";
  if (phase === "ringing") return "Ringing";
  if (phase === "connected") return `Connected ${mm}:${ss}`;
  return `Ended ${mm}:${ss}`;
}

export function isInsideWorkingHours(now: Date, hours: DayHours[], timeZone: string) {
  return nextWorkingOpen(now, hours, timeZone).getTime() <= now.getTime();
}

export function consentPurposeForDepartment(department: string | null | undefined) {
  if (department === "service") return "service_reminders";
  if (department === "insurance") return "insurance_renewal";
  return "sales_enquiry";
}
