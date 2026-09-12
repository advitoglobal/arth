/** Quick links and the WhatsApp reply loop. SPEC telecaller view 06. */

export const MESSAGE_REPLY_MINUTES = 30;
export const QUOTE_VALID_DAYS = 7;

export const QUICK_LINKS = [
  { key: "brochure", label: "Send brochure", purpose: "sales_enquiry", pointsKind: null, category: "utility" },
  { key: "price", label: "Send price", purpose: "sales_enquiry", pointsKind: null, category: "utility" },
  { key: "quotation", label: "Send quotation", purpose: "sales_enquiry", pointsKind: "quotation_issued", category: "utility" },
  { key: "alternative", label: "Send the alternative", purpose: "sales_enquiry", pointsKind: null, category: "utility" },
  { key: "offer", label: "Send live offer", purpose: "offers", pointsKind: null, category: "marketing" },
  { key: "location", label: "Send location and timings", purpose: "sales_enquiry", pointsKind: null, category: "utility" },
  { key: "testdrive", label: "Send test drive confirmation", purpose: "sales_enquiry", pointsKind: null, category: "utility" },
] as const;

export type QuickLinkKey = (typeof QUICK_LINKS)[number]["key"];

export const WHATSAPP_KIND_LABEL: Record<string, string> = {
  brochure: "Brochure",
  price: "Price",
  quotation: "Quotation",
  alternative: "Alternative",
  offer: "Live offer",
  location: "Location and timings",
  testdrive: "Test drive confirmation",
  service_reminder: "Service reminder",
  insurance_quote: "Insurance quote",
};

export const MEDIA_KIND_LABEL: Record<string, string> = {
  photo_car: "Photo of the car",
  rc: "RC book",
  licence: "Licence",
};

export function quickLinkOf(key: string) {
  return QUICK_LINKS.find((l) => l.key === key) ?? null;
}

export function whatsappPurpose(kind: string, department?: string | null) {
  if (kind === "offer") return "offers";
  if (kind === "service_reminder" || department === "service") {
    if (kind === "service_reminder") return "service_reminders";
  }
  if (kind === "insurance_quote" || department === "insurance") {
    if (kind === "insurance_quote") return "insurance_renewal";
  }
  const link = quickLinkOf(kind);
  return link?.purpose ?? "sales_enquiry";
}

export function pointsKindForWhatsApp(kind: string) {
  return quickLinkOf(kind)?.pointsKind ?? null;
}

export function consentRefusalCopy(purpose: string) {
  if (purpose === "offers") {
    return "This customer has not agreed to offers, or they have withdrawn. The button refuses rather than sending.";
  }
  if (purpose === "service_reminders") {
    return "This customer has not agreed to service reminders, or they have withdrawn. The button refuses rather than sending.";
  }
  if (purpose === "insurance_renewal") {
    return "This customer has not agreed to insurance renewal messages, or they have withdrawn. The button refuses rather than sending.";
  }
  return "This customer has not agreed to a sales enquiry message, or they have withdrawn. The button refuses rather than sending.";
}

export function autoReplyText(replyAtLabel: string) {
  return `We have your message and will reply at ${replyAtLabel}.`;
}

export function receiptLine(sentAt: string, deliveredAt?: string | null, readAt?: string | null) {
  const parts = [`Sent ${sentAt}`];
  if (deliveredAt) parts.push(`delivered ${deliveredAt}`);
  if (readAt) parts.push(`read ${readAt}`);
  return parts.join(" · ");
}

export function rendererKeys() {
  return {
    links: QUICK_LINKS.map((l) => l.key),
    labels: Object.keys(WHATSAPP_KIND_LABEL),
    media: Object.keys(MEDIA_KIND_LABEL),
  };
}
