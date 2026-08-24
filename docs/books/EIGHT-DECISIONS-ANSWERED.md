> **Archived memo, 21 August 2026.** Retained for the reasoning. The rulings here
> are settled and reflected in `DECISIONS.md`, which is authoritative. The prototype
> copy referred to in Q2 has since been updated: it reads nine stages throughout.

# THE EIGHT DECISIONS — ANSWERED

**From:** Director, Product Engineering
**To:** Development team, Advito Global · cc IT Director · Prem Kumar
**Date:** 21 August 2026
**Re:** `ARTH-BUILD-STATE-for-product-director.html`

You asked for a paragraph each. That is what this is. Three block the demonstration and they are answered first.

**Before the eight, one correction in your favour and one thing that is Prem's.**

**Compare has a counterpart.** Your table records *"no counterpart — built this week"* for `/w/…/compare`. It is **Compare branches** in the prototype, and it carries a design position worth having before you go further: compare on **process**, not outcome. First response, contacted-in-24h, test drive rate, promise accuracy — because a comparison on cars sold turns every review into an argument about market conditions, and a comparison on response time cannot be argued with. Check it before building more of that screen.

**Prem: run the seed.** One person can sign in, eighteen accounts have no password, and the data ages a day every day. The access model is the thing that distinguishes Arth from a shared spreadsheet and it cannot currently be shown at all. The operation is built and rehearsed. It needs you.

---

## Q1 · The queue is their day. Not everything callable.

**Their day.** A count that does not move while you work is worse than no count, and 162 is not a morning — it is a filing cabinet.

**Definition: every enquiry whose next action falls on or before today, plus anything currently breaching its first-response window.** Nothing else. An enquiry with a callback set for Monday is not in Tuesday's queue and must not be counted in it.

**And it decrements.** Log a call, the number falls. That is most of the value of the figure. Everything else callable lives in *My enquiries*, which is a different screen with a different job — the queue is a morning with an end, the pipeline is the whole book.

One consequence to build in from the start: when the queue empties, it says so and offers the next-best work rather than showing zero and stopping. A telecaller at 15:00 with an empty queue is the one moment the product can hand him revival leads.

---

## Q2 · Nine stages, and the twelve was my error

I over-specified. Twelve folded the delivery chain into the sales pipeline, and that was defensible before the chain became its own object with its own steps and owners. **It is now duplication: Allocated, Invoiced and Registered are chain steps, not sales stages, and modelling them twice means two places to disagree about where a car is.**

**The nine, in order:**

`New · Assigned · Contacted · Qualified · Test drive · Quotation · Negotiation · Booked · Delivered`

**A stage answers *how far along is this*, and only for work the salesperson controls.** After Booked, progress is the delivery chain's to report, and the lead simply reads Booked until a car is handed over.

**Two things that are not stages:** *Lost* is a terminal state with a required reason. *Parked* is derived — see Q7. Neither belongs in the ladder.

Your seven is closer to right than my twelve was. The two I would add back are **Assigned**, because unassigned is a real condition a manager acts on, and **Quotation**, because a quotation issued is the strongest pre-booking signal in the funnel and currently disappears inside Negotiation.

**The prototype copy is mine to change — every row reading *3 of 12* becomes *3 of 9*.** That cost is on my side, not yours.

---

## Q3 · The panel confirms in place. Not a toast.

You are right that a prototype rarely shows the moment after, and mine does not. It uses a toast, and **a toast is wrong at this frequency** — forty times a morning it becomes chrome and stops being read, and it is dismissible, so it can be missed entirely.

**On save, the disposition panel itself becomes the confirmation, in place, for about a second and a half.** It states three things: what was recorded, what it earned, and what happens next — *"Postponed. Revisit 20 August. +3 points, cold lead."* Then the next call loads beneath it.

**The confirmation lives inside the thing that changed.** That is what makes it trustworthy without being read.

**And add undo inside that window.** A mis-tap forty times a morning is certain. The ledger is append-only so undo is a correcting entry, never a deletion — the original disposition stays visible, which is the point of the ledger.

---

## Q4 · Expected value — the formula, and it must not be invented

```
expected value  =  (unit gross + attached gross)  ×  stage probability
```

**Unit gross** — from the price master: ex-showroom less dealer cost, per variant. Where a dealer will not load cost, a per-model default set by the dealer admin.

**Attached gross** — exchange margin, finance payout, insurance commission and accessories, **each multiplied by its own attach rate for that model at that dealership.** Not the best case. The average case.

**Stage probability** — historical conversion from that stage to a delivered car, cut by source. Meta at Qualified converts differently from a walk-in at Qualified and the number should say so.

**Two rules, and the second matters more.**

**It is a ranking device before it is a reported figure.** Its job is to order the queue. Precision to the rupee is not required; being right about which call to make first is.

**It is computed from the dealer's own history, and at launch there is none.** So it starts from a seeded default probability table and is **replaced by the dealer's own numbers after the first month.** Same standing pattern as every other threshold on this programme: a number about behaviour is set from real behaviour. Until then the screen says the figure is provisional, because a confident number derived from nothing is worse than an honest one.

---

## Q5 · Duration is not a demonstration requirement. It is a points requirement.

**Not needed for the demonstration.** Attempt count, disposition and the recording being *available* carry it. Nobody watching a demonstration will ask how long the call was.

**But the points engine cannot ship without it.** The anti-gaming rule is that a connection under twenty seconds earns nothing — that is what stops dialling and hanging up from scoring. Without duration the rule cannot be enforced, and points without it are gameable on day one.

**So: defer telephony past the demonstration, and treat it as a hard dependency of Part 11.** Do not ship points and add duration afterwards. That order gets a floor into the habit of gaming a score before the control exists.

---

## Q6 · Phase 6, and do not fake it in the meantime

*"His wife has serviced a Swift here six times"* needs Household and Service. Neither exists. **It is Phase 6 and I would rather it arrive late and true than early and approximate.**

**But a weaker version is available now and worth having**, because one customer with many enquiries is live as of yesterday: *"This customer has two open enquiries with us"* or *"enquired about a Baleno in March."* Same shape, same purpose — the console reads as a briefing rather than a form — from data you already hold.

Build the slot now with the weak line in it. When Household and Service land, the strong line drops into the same place and no screen changes.

---

## Q7 · Parked is derived. Search is the phone number.

**Parked is not a stage and not a stored flag.** It is derived: **the latest disposition is *postponed* and its revisit date is in the future.** When that date arrives the lead is simply due, and it leaves Parked without anything being written. Same pattern as chain state and exception state — derived, never stored, so it cannot drift from the thing it describes.

That makes the chip honest rather than quietly meaning something else, which was the right instinct not to build it.

**Search: the phone number first, and it is not close.** Every inbound call, every walk-in, every duplicate check starts there. Partial matching from four digits. **Name second** — spelling is unreliable in three scripts. **Enquiry ID third**, and only because it appears on printed paperwork.

**Filters that map onto what you hold today:** Open, Overdue, Won, Lost, plus Model, Source and Stage. **Parked arrives with the postponement outcome.** Ship the six that work rather than five plus a chip that lies.

---

## Q8 · Yes. A seat names its workspace. Confirmed.

You are right that department carries no signal — telecalling is deliberately bound to sales because telecallers work the sales pipeline, so routing on department cannot work.

**A seat should carry a `workspace` field naming where that person lands.** Small structural addition, confirmed as a product decision, and it is the thing that makes the twenty-two-role menu real rather than decorative.

**Two rules with it.** A seat has exactly one landing workspace, never a list — a person who lands on a chooser has been given a decision instead of a day. And **workspace is separate from permission**: a branch manager lands on his decisions screen and can still reach telecalling. Landing is where you start; permission is what you may open.

---

## On section 06

Three failures, all found and disclosed by you: a repair miscounted from a scratch copy, a test that passed on the defect it named, and a delete aimed at scratch that connected to production.

**The third one is the serious one** and it deserves more than a line in a note — a command that reads its connection from a file and ignores the environment will do it again in a different script. It was stopped by a guard written last month for an unrelated reason, which is luck rather than design.

**But disclosing all three unprompted is why section 02's numbers are worth reading**, and that is exactly the right trade. A team that reports its own near-miss is a team whose figures I can build on.

---

*Nothing here needs a reply. Q1 to Q3 are hours each and land in the current two days. Q2 changes prototype copy and that is mine to do.*
