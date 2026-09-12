/** Pass 2 §4.3: keep this sentence exact. The second line names the grantor. */
export const FORBIDDEN_LINE = "This screen is for another seat.";

/**
 * What happens next, and who can grant access. Seat names, not people.
 * SPEC: 00-START-HERE DoD 7, CONTROL-SEATS, VISIBILITY-WALLS.
 */
export const REFUSAL_NEXT: Record<string, string> = {
  dayb: "This is the telecaller Today board. Ask a telecaller or the digital desk to open it, or return to your own queue.",
  tele: "This shared book is for telecallers until a name is reached. Ask the digital desk if you need it opened.",
  pipe: "Ask the digital desk who can grant access to this book, or return to a screen your seat can open.",
  rec: "This enquiry is outside your four walls. Ask the digital desk if you need a seat that can see it.",
  delivery: "Delivery is for sales and the seats above them. Ask the digital desk if you need it opened.",
  search: "Search is not on this seat. Ask the digital desk who can grant access.",
  new: "Only a telecaller can add an enquiry here. Ask the digital desk if you need that seat.",
  msg: "This WhatsApp inbox is for telecallers and the seats that coach them. Ask the digital desk if you need it opened.",
  notif: "Ask the digital desk who can grant access to notices.",
  profile: "Ask the digital desk who can grant access to this profile.",
  perf: "Ask the digital desk who can grant access to Performance.",
  desk: "This is the digital desk. Ask a digital desk manager or the dealer principal.",
  prin: "This dealer view is for the dealer principal. Ask the principal or Advito support.",
  gm: "This is the general manager floor. Ask the dealer principal if you need it opened.",
  admin: "Dealer setup is for the dealer admin and the principal. Ask one of them.",
  books: "Accounts is for the accounts seat, dealer admin, general manager, and principal.",
  upload: "Ask the digital desk or a sales manager who can grant access to uploads.",
  svc: "This is the service floor. Ask a service advisor or the digital desk.",
  ins: "This is the insurance floor. Ask an insurance executive or the digital desk.",
  stock: "Stock is for sales and the seats above them. Ask the digital desk if you need it opened.",
  drive: "Test drives are for the coordinator and sales. Ask the digital desk if you need it opened.",
  bot: "Arthbot is for the dealer principal, general manager, and dealer admin.",
  loop: "This weekly review is for telecallers and the seats that coach them. Ask the digital desk if you need it opened.",
  adealers: "Advito control is for Advito admin and support. A dealer seat cannot open it.",
  aonboard: "Onboarding is for Advito admin. Ask Advito admin to grant that seat.",
};

export const FLOOR_ERROR_NEXT =
  "The last saved work on this screen is still in the ledger. Retry. If this stays closed, ask the digital desk who can grant access.";

export function refusalNext(screen: string | null): string {
  if (screen && REFUSAL_NEXT[screen]) return REFUSAL_NEXT[screen];
  return "Ask the digital desk who can grant access, or return to a screen your seat can open.";
}
