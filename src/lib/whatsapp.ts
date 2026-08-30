export type WhatsAppKind = "brochure" | "quotation" | "both" | "service_reminder" | "insurance_quote" | "offer";

export function waDigits(phone: string) {
  const d = phone.replace(/\D/g, "");
  if (d.length === 10) return `91${d}`;
  if (d.length === 12 && d.startsWith("91")) return d;
  return d;
}

export function vehicleLine(model: string | null | undefined, variant: string | null | undefined) {
  const modelText = model?.trim() || "the model you asked about";
  const variantText = variant?.trim();
  return variantText ? `Maruti Suzuki ${modelText} ${variantText}` : `Maruti Suzuki ${modelText}`;
}

export function whatsappMessage(input: {
  kind: WhatsAppKind;
  customerName: string;
  model: string | null;
  variant: string | null;
  conversation: string;
  dealer: string;
  sender: string;
}) {
  const vehicle = vehicleLine(input.model, input.variant);
  const name = input.customerName.split(" ")[0] || input.customerName;
  const talked = input.conversation.trim()
    ? ` As discussed: ${input.conversation.trim()}`
    : "";
  const sign = `${input.dealer}, ${input.sender}`;
  if (input.kind === "brochure") {
    return `Namaste ${name}. Sharing the brochure for ${vehicle}.${talked} Please reply here if you want a quotation or a visit. ${sign}`;
  }
  if (input.kind === "quotation") {
    return `Namaste ${name}. Sharing a quotation for ${vehicle}.${talked} Reply here with any change you want on the numbers. ${sign}`;
  }
  if (input.kind === "service_reminder") {
    return `Namaste ${name}. Reminder from ${input.dealer} service: your ${vehicle} is due. Reply here to book a slot. ${sign}`;
  }
  if (input.kind === "insurance_quote") {
    return `Namaste ${name}. Sharing insurance options for ${vehicle}.${talked} All products stay on the list. Reply here with what you want explained. ${sign}`;
  }
  if (input.kind === "offer") {
    return `Namaste ${name}. A current offer from ${input.dealer} on ${vehicle}.${talked} Reply STOP if you do not want offers. ${sign}`;
  }
  return `Namaste ${name}. Sharing the brochure and a quotation for ${vehicle}.${talked} Open the files on this chat and tell me if you want a test drive. ${sign}`;
}

export function waMeUrl(phone: string, text: string) {
  return `https://wa.me/${waDigits(phone)}?text=${encodeURIComponent(text)}`;
}

export function whatsappKindLabel(kind: WhatsAppKind) {
  if (kind === "brochure") return "Brochure";
  if (kind === "quotation") return "Quotation";
  if (kind === "service_reminder") return "Service reminder";
  if (kind === "insurance_quote") return "Insurance quote";
  if (kind === "offer") return "Offer";
  return "Brochure and quotation";
}
