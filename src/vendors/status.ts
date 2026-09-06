/** SMS, telephony, WhatsApp, payments, vehicle lookup. Prem connects one vendor at a time. */

export type VendorKey = "sms" | "telephony" | "whatsapp" | "payments" | "vehicle_lookup";

export function vendorStatus(): Record<VendorKey, "stub"> {
  return {
    sms: "stub",
    telephony: "stub",
    whatsapp: "stub",
    payments: "stub",
    vehicle_lookup: "stub",
  };
}

export function telephonyLive() {
  return process.env.ARTH_TELEPHONY_VENDOR?.trim() ? true : false;
}

export function smsLive() {
  return process.env.ARTH_SMS_VENDOR?.trim() ? true : false;
}

export function pointsAreOfficial() {
  return telephonyLive();
}

export function unofficialScoresCopy() {
  return "Scores become official when call recording starts.";
}
