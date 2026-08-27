# DECISION LOG

Append only. Never edit a past entry; supersede it with a new one.
Read this before designing anything.

---

## 2026-08-27 · Telecalling control seats, then other departments
Digital desk manager runs the telecalling team at a branch. Dealer principal sees this dealer only. Advito admin onboards dealers. Advito support enters one dealer at a time to fix a floor problem, logged. Support cannot onboard. No dealer sees another dealer. Other department managers wait. Law: `docs/books/CONTROL-SEATS.md`.

## 2026-08-26 · Four visibility walls, every department
Dealer, then branch, then team, then owner. After a telecaller reaches the customer, Search and Filter hide that enquiry from other telecallers. Team leader sees the team. Branch manager sees the branch. Dealer principal sees this dealer only. Forced RLS plus `arth_lead_visible`. Fail closed without `app.user_id`. Law: `docs/books/VISIBILITY-WALLS.md`. Sales, service, and every later department inherit this. A bypass is a defect.

## 2026-08-26 · Shared book until reach, then exclusive
New names are visible to every telecaller at the branch until a connected call of 20 seconds or more. Then the owner is the telecaller who reached the customer. Not-connected outcomes do not claim.

## 2026-08-26 · Telecalling qualifies, sales converts
Hand to sales is allowed from Qualified. Conversion is the sales consultant's job. Today stays a telecalling screen.

---

## 2026-08-21 · Nine stages, not twelve
`New · Assigned · Contacted · Qualified · Test drive · Quotation · Negotiation · Booked · Delivered`
Twelve folded delivery-chain steps into the sales pipeline. Allocated, Invoiced and Registered are chain steps. Modelling them twice means two places to disagree about where a car is. After Booked, progress is the chain's to report.

## 2026-08-21 · The telecaller queue is their day
Enquiries due today plus anything breaching. Not everything callable. **It decrements as calls are logged.** Everything else lives in My enquiries.

## 2026-08-21 · In-place confirmation, not a toast
At forty times a morning a toast becomes chrome. The disposition panel becomes the confirmation for ~1.5s: what was recorded, what it earned, what happens next. Undo inside that window, as a correcting entry.

## 2026-08-21 · Expected value formula
`(unit gross + attached gross) x stage probability`. Attached at its own attach rate, average case. Seeded defaults at launch, replaced by the dealer's own after month one, marked provisional until then. A ranking device before a reported figure.

## 2026-08-21 · Parked is derived
Latest disposition is POSTPONED and revisit date is future. Never stored.

## 2026-08-21 · A seat carries workspaceKey
Exactly one landing workspace, never a chooser. Landing is not permission.

## 2026-08-21 · Call duration gates the points engine
Not needed for the demo. The 20-second connect floor cannot be enforced without it. Do not ship points first.

## 2026-08-21 · Household + service line is Phase 6
Ship the weak version now from data already held. Same slot, stronger line later.

## 2026-08-18 · Green action button withdrawn
The Book gives five variants and none is green. Settled is semantic and never decorates. Ink fill measures 15.01:1 against the green's 6.83:1, so the Book's own primary also solves the contrast failure that prompted it.

## 2026-08-18 · Text on brass-wash is --arth-brass-pill #7A5716
It already existed, added in palette v2.2 for this exact pairing. brass-deep measures 4.19:1 there and fails.

## 2026-08-18 · Three metric names, never interchangeable
Bookings = leads reaching a booking. Deals closed = leads with at least one car delivered. Cars delivered = vehicles. Conversion uses the lead numerator. One lead can deliver several cars.

## 2026-08-17 · The delivery promise is an event, never a field
Every movement writes a new row. Without it: cannot count how often a promise moved, cannot measure accuracy against the original, cannot answer who told the customer the 12th.

## 2026-08-17 · Difficulty is computed at assignment and frozen
System-computed, never manager-set. Hidden from the executive. Bands x1.0 / x1.5 / x2.5 / x3.5.

## 2026-08-17 · Compare branches on process, not outcome
First response, contact rate, test drive rate, promise accuracy. A comparison on cars sold turns every review into an argument about market conditions.

## 2026-08-17 · Margin is dealer-admin only. Salary never below the principal
Not configurable. An insurance executive gets a ranked recommendation with reasons and no margin figure.

## Standing · A threshold about human behaviour is set from real behaviour
First pilot month. Never invented in advance.

## Standing · Report, never silently correct
Reconciliation reports disagreements. A silent auto-correction destroys the evidentiary value of a ledger.
