export type WhatsAppKind =
  | "brochure"
  | "price"
  | "quotation"
  | "alternative"
  | "offer"
  | "location"
  | "testdrive"
  | "service_reminder"
  | "insurance_quote";

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
  dealer: string;
  sender: string;
  altModel?: string | null;
  priceLine?: string | null;
  hoursLine?: string | null;
  slotLine?: string | null;
  quoteUntil?: string | null;
}) {
  const vehicle = vehicleLine(input.model, input.variant);
  const name = input.customerName.split(" ")[0] || input.customerName;
  const sign = `${input.dealer}, ${input.sender}`;
  if (input.kind === "brochure") {
    return `Namaste ${name}. Sharing the brochure for ${vehicle}. Reply here if you want a quotation or a visit. ${sign}`;
  }
  if (input.kind === "price") {
    const price = input.priceLine?.trim() || "On-road is on the dealer price master for this variant.";
    return `Namaste ${name}. On-road for ${vehicle}: ${price} Reply here with any change you want explained. ${sign}`;
  }
  if (input.kind === "quotation") {
    const until = input.quoteUntil ? ` Valid until ${input.quoteUntil}.` : "";
    const price = input.priceLine?.trim() ? ` ${input.priceLine.trim()}` : "";
    return `Namaste ${name}. Sharing a frozen quotation for ${vehicle}.${price}${until} This quotation will not reprice itself later. Reply here with any change you want on the numbers. ${sign}`;
  }
  if (input.kind === "alternative") {
    const other = vehicleLine(input.altModel, null);
    return `Namaste ${name}. Sharing the brochure and on-road for the other choice, ${other}, on the same thread as ${vehicle}. ${sign}`;
  }
  if (input.kind === "location") {
    const hours = input.hoursLine?.trim() || "Working hours are on the branch board.";
    return `Namaste ${name}. ${input.dealer} ${hours} Search the branch name on Maps for the pin. ${sign}`;
  }
  if (input.kind === "testdrive") {
    const slot = input.slotLine?.trim() || "the slot we booked";
    return `Namaste ${name}. Test drive confirmed for ${vehicle} at ${slot}. Bring a valid driving licence. ${sign}`;
  }
  if (input.kind === "service_reminder") {
    return `Namaste ${name}. Reminder from ${input.dealer} service: your ${vehicle} is due. Reply here to book a slot. ${sign}`;
  }
  if (input.kind === "insurance_quote") {
    return `Namaste ${name}. Sharing insurance options for ${vehicle}. All products stay on the list. Reply here with what you want explained. ${sign}`;
  }
  return `Namaste ${name}. A current offer from ${input.dealer} on ${vehicle}. The scheme expiry is on this message. Reply STOP if you do not want offers. ${sign}`;
}

export function whatsappKindLabel(kind: WhatsAppKind | string) {
  const map: Record<string, string> = {
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
  return map[kind] ?? kind;
}
