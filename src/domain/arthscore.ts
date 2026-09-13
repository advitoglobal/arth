/**
 * Arthscore: conversion likelihood from the enquiry record (0–100).
 * Not voice AI. Hidden from executives: difficulty_band stays off this surface.
 */

const STAGE_SCORE: Record<string, number> = {
  new: 18,
  assigned: 28,
  contacted: 42,
  meeting: 58,
  qualified: 58,
  test_drive: 72,
  quotation: 78,
  negotiation: 85,
  booked: 94,
  delivered: 100,
};

export function arthscoreFromLead(lead: {
  stage_key: string;
  lost_at?: Date | string | null;
  lost_reason_key?: string | null;
}): number {
  if (lead.lost_at || lead.lost_reason_key) return 8;
  return STAGE_SCORE[lead.stage_key] ?? 20;
}

export function arthscoreCaption(): string {
  return "From this record. Voice AI is not live.";
}
