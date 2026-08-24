# RESPONSE — THE EXCEPTION COCKPIT

**From:** Director, Product Engineering
**To:** IT Director, Arth · cc Prem Kumar
**Re:** `EXCEPTION-COCKPIT-WORKING-DOCUMENT.md`, 16 August 2026
**Returning:** §4 rulings with figures, §6 answered per row, and one problem that has to be solved before either is built

---

## 0. POSITION

**§1 is correct and I should have made that separation myself.** Screen A and Screen B are different products with different users, different frequencies and different emotional registers. The prototype conflated them: what it calls the cockpit is Screen A, and the role home screens in it are work queues rather than the greeting-and-close-of-day shape Prem described. Screen B has not been designed. It should not be scoped as part of this.

**§2 is better than a formula and I am adopting it as written.** Three kinds of value, and no bare number.

**§3 I accept without change.** It is an access rule, not a screen rule.

**§6 is the right question and it removes nine rows on its own.** My answer to it is in §2 below, as a principle, before the row-by-row.

**§5 contains a decision that will break the screen.** That is §3 of this response and it is the most important thing in it.

---

## 1. THE RULE THAT DECIDES EVERY ROW

You asked what happens at nine in the morning. Here is the general answer, and then the rows fall out of it.

**A dealer principal can do exactly five things.** Telephone a named person. Approve or refuse something. Move money or people. Change a rule for the whole group. Decide to do nothing.

Anything on the Cockpit must map to one of the first four. If the honest answer is the fifth, it is a report.

**Which produces a second rule the document does not yet state, and it removes more rows than §6 does:**

> **A card must be actionable by the person looking at it, not by somebody else.**

Most of §4 is real, urgent and correctly identified. It is simply addressed to the wrong person. A dealer principal cannot chase an individual quotation. A branch manager can, and should, and it is his whole job.

So the ruling on most rows is not *keep* or *drop*. It is **whose screen**. The Cockpit is one screen with role-scoped content, per §5. A row can be a principal card, a manager card, both at different resolutions, or neither.

**The resolution rule that follows:**

| Level | Sees |
|---|---|
| Executive | Nothing. This screen is not for them. Their day is Screen B. |
| Manager | Individual items, named, actionable by him today |
| Principal | **Aggregates and exceptions to the aggregate.** Never an individual enquiry unless its own value clears a threshold he sets |

*"11 enquiries at Whitefield have had no contact"* is a principal card. *"Ramesh Kumar has had no contact"* is not, and putting it there is how the screen becomes a list of forty things and dies.

---

## 2. THE PROBLEM THAT HAS TO BE SOLVED FIRST

§5 records a decision that I think will kill the screen if it goes in as written.

> *"Today means month-to-date, consolidated: everything that went wrong in the last 24 hours and everything still unresolved however old."*

**Prem's reasoning is sound and I agree with the intent.** Nobody wants an old problem quietly hidden. But taken literally, this screen only grows. A booking blocked at the RTO for nineteen days appears on day one and on every day after. By the third week the principal opens a screen with forty cards on it, most of which he has already seen and already acted on, and he stops opening it. That is the exact failure the Book's *silence when nothing is wrong* rule exists to prevent, arriving by a different door.

**The fix is not to hide old items. It is to distinguish between unresolved and unowned.**

An item leaves the Cockpit when **somebody has taken it**, not when it is fixed. Three exits:

| Exit | What it means | What happens |
|---|---|---|
| **Actioned** | He escalated, approved, reassigned or called | Leaves his screen. Appears on the screen of whoever now owns it, with his name and the time attached |
| **Acknowledged with a date** | *"I know. The RTO office is on strike. Show me on the 20th."* | Leaves until that date, then returns with **"you deferred this on the 4th"** on it |
| **Delegated** | Handed to a named person with a deadline | Leaves. Returns to him, escalated, if that person does nothing |

**What can never happen: dismissed with no reason.** If it could, the screen becomes a thing to be cleared rather than read, which is worse than a backlog.

**And the count that makes it honest:** a permanent line at the foot reading *"14 items you have already actioned are still unresolved."* One click opens them. **The unresolved work stays visible; it stops competing with today for his attention.** That satisfies what Prem actually wants without the list growing forever.

**This needs Prem's confirmation before either screen is designed.** It changes the data model — every card needs an ownership state and a defer date, which is not in the candidate list anywhere.

---

## 3. §4 ANSWERED

Marked **P** for the principal's Cockpit, **M** for a manager's, **B** for Screen B, and **drop** for anything that is a report.

### Deal value at risk

| # | Row | Ruling | Figure shown | What he does at nine in the morning |
|---|---|---|---|---|
| 1 | No contact past the promised window | **P aggregate, M individual** | Sum of average deal value for the models involved. *"₹1,01,200 — 11 enquiries, Whitefield, average Fronx margin, none contacted in 48 hours"* | **Telephones the branch manager.** For the manager it is a reassign |
| 2 | Assigned to nobody | **M only** | Count and value | Nothing, because auto-assign fires at two hours. **If this ever reaches the principal it means auto-assign is broken**, and that is a different card: *"auto-assign has failed 6 times this week"* |
| 3 | Hot or qualified gone quiet | **M only** | Deal value | Manager calls the executive. Principal cannot act on it |
| 4 | Quotation sent, no response, past follow-up | **M only** | Deal value | Manager reassigns or calls the customer himself |
| 5 | Test drive booked, never conducted | **M only** | Deal value | Manager asks why. **Highest-intent event in the funnel and it was wasted** |
| 6 | Booking past its promised delivery date | **P, keep** | Total delivery value at risk, with the blocking step named | **Escalates to the head of the blocking department.** The flagship card |
| 7 | Finance disbursement pending | **Merge into 6** | — | Never its own card. It is a *reason* on row 6. Two cards for one blocked car makes him count the same money twice |
| 8 | RTO pending | **Merge into 6** | — | As above |
| 9 | Closed as lost with no reason | **Drop** | — | **This card should be impossible.** Closure without a reason is blocked in the disposition matrix. If it appears, it is a defect, not an exception |

### Money spent that is not returning

| # | Row | Ruling | Figure | Action |
|---|---|---|---|---|
| 10 | Campaign spent, no bookings | **P, keep** | Spend, days, and the portfolio average for comparison | **Pauses it.** One click, and the spend stops in fifteen minutes |
| 11 | Cost per booking above threshold | **P, merge with 10** | Cost per booking against the portfolio average | Same decision, same card family. *"Campaigns not returning"* covers both zero and expensive |
| 12 | High volume, low conversion source | **Drop from daily → monthly review** | — | **He does nothing about this on a Tuesday.** It is a budget decision made once a month with the media buyer, which is us |
| 13 | Duplicate enquiries from paid sources | **P, monthly** | Spend wasted on people we already had | Interesting case: **the action is on Advito, not on him.** Worth showing so he knows we are watching it. Not a daily card |

### Brand value

| # | Row | Ruling | Figure | Action |
|---|---|---|---|---|
| 14 | Delivery promise moved more than once | **P, keep** | Deal value, plus who promised what and when | **He telephones the customer himself, or authorises a goodwill gesture.** One of the few cards where the principal is the right person to act personally |
| 15 | Service job open past promised time | **P aggregate, M individual** | Count today, and promise accuracy for the month | Principal calls the workshop manager if the count is abnormal. Manager handles the individual job |
| 16 | Complaint unresolved past a period | **P, keep** | What is at stake, and **days to the manufacturer's survey** | **Intervenes personally when it is inside the survey window.** The survey link is what makes this a principal card rather than a service one |
| 17 | Repeat visit for the same issue | **M individual, P only as a pattern** | Cost of rework | Manager investigates one car. **Principal acts only when the same defect appears across many cars**, because that is a training or parts problem and only he can fix it |

### Cost and time

| # | Row | Ruling | Figure | Action |
|---|---|---|---|---|
| 18 | Enquiry reassigned repeatedly | **M only** | Handling cost | Manager stops it. Principal has no lever |
| 19 | High calls, low conversion on one seat | **M only, and it is coaching not exception** | Points, not rupees | **The weighted difficulty score already answers this properly.** Raw volume against conversion is exactly the comparison that difficulty weighting exists to correct. Putting it on an exception screen would undo that work |
| 20 | Same failure recurring across branches | **P, keep** | Cumulative cost or value across branches | **Changes a rule for the whole group.** Nobody else can. One of the strongest cards on the list |

### People and accountability

| # | Row | Ruling | Figure | Action |
|---|---|---|---|---|
| 21 | A seat holding more untouched enquiries than the median | **M only** | Count and value | Manager redistributes |
| 22 | Branch first-response slipped against the group | **P, keep** | Estimated bookings lost, with the cause attached | **Telephones the branch head.** Strong card, and the cause line is what makes it actionable: *"one telecaller resigned on 22 July and was not replaced"* |
| 23 | Escalated item with no action by its manager | **P, keep** | Value of the item, plus how long the manager has sat on it | **This is the manager accountability layer and it must stay.** Without it only the floor is measured, and a system that measures only juniors gets gamed |

### The count

Nine card types reach the principal. Ten stay with managers. Two move to a monthly review. Two are dropped.

**Nine types, appearing as roughly five to eight cards on a normal morning.** That is the right size for a screen somebody reads in ninety seconds.

---

## 4. FOUR ROWS TO ADD

Each passes the test in §1: real money, and the principal is the person who can act.

| Row | Kind | Figure | Action |
|---|---|---|---|
| **Renewals expiring with no contact attempt** | Deal value at risk | Commission at stake across the book | Calls the insurance manager. **Sixty-four policies expiring and twenty-one untouched is money already earned and being dropped** |
| **Used car stock ageing past the threshold** | Cost and time | Floor-plan interest accruing, against gross on the unit | Authorises a price drop. Only he can, and every day of delay costs interest |
| **A leaver's pipeline not handed over** | Deal value and brand | Value of the open enquiries | Orders the handover. **This is the single thing every dealer principal has personally been burned by** |
| **A discount approved that did not close** | Cost and accountability | Margin given away against deals lost | Reviews it. Closes the loop on the written justification, and it is what stops the justification becoming a formality |

---

## 5. TWO SMALLER THINGS

**On §3.** I accept it as written, with one addition: **the setting should be per figure, not one switch.** A branch manager needs cost per booking to run his branch. He does not need branch P&L. One toggle for "managers see rupees" will end up either too open or too closed, and the dealer admin will then ask for exactly this.

**On §5's "whole group first, department-wise."** Agreed. One consequence to record now: **a card must be able to aggregate across branches and still name the worst offender.** *"₹4.2 lakh across the group, ₹2.8 lakh of it at Kengeri."* If the aggregate cannot name where it is concentrated, the principal's next question has no answer on the screen, and he telephones somebody to ask.

---

## 6. WHAT I NEED BACK

1. **Prem's confirmation on §2 of this document.** Actioned, acknowledged-with-a-date, delegated, and a persistent count of what remains unresolved. This is the one item that changes the data model, and it needs settling before either screen is designed.
2. **Confirmation that manager-level rows are in scope.** Ten of the twenty-three land there. If the manager Cockpit is not being built in this cycle, those ten are deferred rather than dropped, and the principal's screen is the whole of it.
3. **A ruling on Screen B.** It has not been designed, the prototype does not contain it, and the role home screens in the prototype should not be mistaken for it. It needs its own pass and its own costing.

Everything in §4 that I have marked **M** or **monthly** is recorded rather than discarded. None of it is wrong. It is simply addressed to somebody other than the man reading the screen.

---

*Response to the Exception Cockpit working document, 16 August 2026. To be filed in `docs/decisions/`.*
