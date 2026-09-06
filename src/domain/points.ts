/** Points for telecalling. A connected call under 20 seconds scores nothing. */

export const CONNECT_FLOOR_SECONDS = 20;

export const DIFFICULTY_MULT = {
  hot: 1,
  warm: 1.5,
  cold: 2.5,
  very_cold: 3.5,
} as const;

export const BASE_POINTS: Record<string, number> = {
  testdrive_booked: 8,
  connected_callback: 2,
  interested_continuing: 2,
  postponed: 1,
  lost: 1,
  not_an_enquiry: 1,
  busy: 0,
  switched_off: 0,
  no_answer: 0,
  whatsapp: 0,
  handoff: 5,
  quotation_issued: 4,
};

export function isScoringConnect(connected: boolean, callSeconds: number | null | undefined) {
  if (!connected) return false;
  return (callSeconds ?? 0) >= CONNECT_FLOOR_SECONDS;
}

export function pointsFor(input: {
  kind: string;
  connected?: boolean;
  callSeconds?: number | null;
  difficulty?: string | null;
}): number {
  const base = BASE_POINTS[input.kind] ?? 0;
  if (base <= 0) return 0;
  if (input.connected) {
    if (!isScoringConnect(true, input.callSeconds)) return 0;
  }
  const band = input.difficulty as keyof typeof DIFFICULTY_MULT | undefined;
  const mult = band && band in DIFFICULTY_MULT ? DIFFICULTY_MULT[band] : 1;
  return Math.round(base * mult);
}

export function pointsLine(points: number, scoringConnect: boolean, connected: boolean) {
  if (connected && !scoringConnect) {
    return "No points. Under 20 seconds is not a connected call for scoring.";
  }
  if (points > 0) return `+${points} points.`;
  return "No points on this action.";
}

export function penaltyNoOutcome() {
  return { amount: -3, note: "A call with no outcome recorded." };
}
export function penaltyFirstResponse() {
  return { amount: -5, note: "First-response window lapsed with no attempt." };
}
export function penaltyMissedCommitment() {
  return { amount: -4, note: "A commitment missed with no note." };
}
