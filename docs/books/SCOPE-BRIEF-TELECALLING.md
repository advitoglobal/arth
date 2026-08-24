# SCOPE BRIEF — TELECALLING ONLY

**From:** Director, Product Engineering
**To:** IT Director, Arth · cc Prem Kumar
**Date:** 23 August 2026
**Re:** Client has confirmed telecalling only. This is the input for your work order.

---

## §0 WHAT CHANGED, AND WHAT IT IS WORTH

**The client wants the telecalling floor and nothing else.** Not sales, not service, not
delivery. One department, working end to end, back end and front end, ready for their
people to test.

**This is a better position than it sounds.** Telecalling is the most complete workspace
on the programme, it is the one with the heaviest daily users, and it is the one where the
product's central claim is easiest to prove: *an enquiry has an owner and a clock.*

**But "telecalling works" is not the same as "the telecalling screens are built."** A
telecalling floor depends on three things that live outside it, and if any is missing the
floor will not trust the product in week one. Those are §2.

---

## §1 THE ONE QUESTION THAT SHOULD BE ANSWERED FIRST

**How does an enquiry reach a telecaller?**

I recorded earlier, and stand by it, that **auto-assignment does not exist.** If that is
still true, then on the morning of the test either a manager assigns leads by hand, or
nobody does and the queue is empty.

**This is the first thing your work order has to settle**, because it determines whether
this is a one-seat build or a two-seat build:

| Option | What it needs | Consequence |
|---|---|---|
| **A · Round-robin auto-assign** | An assignment rule and the working-hours table | One seat. No manager screen needed for the test |
| **B · Manager assigns** | A supervisor screen with a bulk assign action | Two seats. More build, but closer to how a real floor runs |
| **C · Both** | A rule, with manual override | The eventual answer, and more than a first test needs |

**My recommendation: A for the test, B in the next cycle.** A round-robin that respects
working hours and current load is a day or two of work and removes a person from the
critical path on test morning. **But it is your call and it is the largest single
variable in the estimate below.**

---

## §2 THE THREE DEPENDENCIES OUTSIDE TELECALLING

Every one of these is a Build Specification §6 item. None can be skipped, and two cannot
be retrofitted cheaply.

### 2.1 Working hours and shifts per branch — **irreversible, build first**

**Every clock in telecalling runs through this.** First response targets, breach
detection, the day panel, escalation timing, the queue itself.

Without it, a lead arriving at 21:40 starts a clock immediately, the telecaller is
penalised for being asleep, and **the floor stops trusting the screen in its first week.**
That is not a cosmetic problem; it is the failure mode that kills adoption.

It is a small table. It is the cheapest unblocking on the programme.

### 2.2 Lost reason, controlled list — **irreversible**

Every closure demands a specific fact. Free text here means *why we lose* can never be
computed, and **it cannot be reconstructed afterwards** because nobody wrote the reason
down at the time.

Seven reasons, controlled, each demanding its own fact. Seed data, not code.

### 2.3 The disposition set — **seed data, but it defines the console**

The full matrix: connected outcomes, not-connected outcomes, closure outcomes. Rules that
travel with it:

- **`POSTPONED` requires a revisit date.** The lead stays open and reads Parked.
- **`LOST` requires a reason from 2.2.**
- **A callback beyond 14 days requires a reason.**
- **Every outcome writes a `lead_event`. Nothing is edited.**

---

## §3 WHAT IS IN SCOPE — SEVEN SCREENS

The telecaller seat. Routes and access lists are in Build Specification Appendix B.

| | Screen | What it is | Note |
|---|---|---|---|
| 1 | `dayb` | **Today.** The day panel: the queue, what is breaching, what was promised | The screen the floor lives in |
| 2 | `tele` | **On a call.** The console: customer, history, disposition panel | The screen that does the work |
| 3 | `pipe` | **My enquiries.** The full book, nine stages | Not the queue. A different job |
| 4 | `rec` | **Enquiry record.** Opens from a row, not a menu | The activity ledger, visible |
| 5 | `search` | **Search.** Phone number first, four-digit partial match | Every inbound call starts here |
| 6 | `notif` | **Notifications.** Every one says why you got it | |
| 7 | `profile` | **My profile.** | |

### The rules that govern all seven

- **The queue is their day.** Due today plus breaching. **It decrements as calls are
  logged.** Everything else callable lives in `pipe`.
- **Nine stages.** `New · Assigned · Contacted · Qualified · Test drive · Quotation ·
  Negotiation · Booked · Delivered`
- **In-place confirmation, not a toast.** ~1.5 seconds, in the panel, stating what was
  recorded and what happens next. Undo inside that window as a correcting entry.
- **The standard row.** Nine columns. **Every date carries the event that produced it.**
- **Parked is derived**, never stored.
- Definition of done per screen: Build Specification §8, all nine points.

---

## §4 WHAT IS OUT OF SCOPE, AND WHY EACH ONE

**This section matters as much as §3.** Every item here will be asked for.

| Deferred | Reason |
|---|---|
| **The points engine and the score screen** | The 20-second connect floor cannot be enforced without call duration, and duration needs telephony. **Shipping points first teaches a floor to game a score before the control exists.** This was ruled and I would hold to it |
| **Telephony integration** | No provider selected. See §5 |
| **WhatsApp messaging (`inbox`)** | Optional. Genuinely useful on a telecalling floor, but it is additional scope and the floor can be tested without it. **Your call** |
| **The mobile view (`mob`)** | A telecalling floor sits at desks |
| Sales, Service, Insurance, Used car, Delivery workspaces | Client has descoped them |
| Manager and analytics screens | Unless you choose option B in §1 |
| The Exception Cockpit | Awaiting authorisation, Phase 7 |
| Attribution and cost per booking | Phase 6 |

---

## §5 THE TELEPHONY DECISION

**A telecalling floor can be tested without telephony integration.** The telecaller dials
on the desk phone or mobile as they do today, and logs the outcome in Arth. **Every
accountability claim the product makes still holds**: the enquiry has an owner, a clock, a
disposition and a ledger entry.

| Without telephony | With telephony |
|---|---|
| Telecaller dials manually, logs the outcome | Click to call, screen pop, recording, duration |
| **Available now** | **Needs a provider selected, contracted and integrated** |
| Points cannot ship | Points can ship |
| Testable end to end | Testable end to end, and better |

**Recommendation: ship the test without it.** It removes an open item from the critical
path, and the provider decision has been open for weeks. **Add it in the cycle after,
together with points, in that order.**

---

## §6 WHAT I CANNOT ESTIMATE, AND WHO CAN

**I have not seen the code.** `BUILD-STATE` records the telecalling workspace as built and
six screens as openable, which are two different numbers, and only your team can say which
is closer to the truth.

**Three questions for them, and the estimate follows from the answers:**

1. Of the seven screens in §3, how many exist today in a state a person could use?
2. Does the working-hours table exist in any form?
3. How do leads currently reach a telecaller, if at all?

### My estimate, marked as an estimate

Assuming the telecalling screens are substantially built and the gaps are the shared
dependencies plus assignment:

| Piece | Working days |
|---|---|
| Working hours and shifts | 2 to 3 |
| Lost reasons and the disposition set, seeded | 2 |
| Queue definition, nine stages, in-place confirmation | 3 to 4 |
| Search by phone | 2 |
| Enquiry record with its activity ledger | 3 |
| Assignment mechanism, option A | 2 to 3 |
| Notifications and profile | 2 |
| **Integration, real-data testing, fixing what the floor finds** | **5 or more** |
| **Total** | **21 to 24 working days** |

**Which is four to five weeks at the current pace, one person.** Add two to three weeks if
telephony is included. **Subtract meaningfully if more of §3 is already built than I know.**

**Treat this as a starting point for your team's own estimate, not as a commitment.** They
have the code; I have a prototype and a specification.

---

## §7 WHAT I WOULD PUT IN THE WORK ORDER

Suggested shape, yours to issue:

**In this cycle**
- The three dependencies of §2, working hours first
- The seven screens of §3
- The assignment mechanism, per your §1 ruling
- Definition of done, Build Specification §8, on every screen

**Explicitly deferred, so it is not re-argued**
- Points, score screen, telephony
- Every other workspace
- Manager and analytics screens, unless §1 option B

**Not to be touched**
- Anything already built and working in Phases 1 to 4

---

## §8 ONE THING FOR THE CLIENT CONVERSATION

**Prem:** when you confirm this back to them, be specific about what they are testing, or
they will expect the product and receive a department.

> "Your telecalling floor, working end to end. Every enquiry has an owner and a clock,
> every call has a recorded outcome, and nothing can be edited afterwards. **Scores and
> call recording come in the following release** — we are shipping the accountability
> first and the measurement second, deliberately, so the scoring cannot be gamed before
> the controls exist."

**That last sentence turns a missing feature into a reason to trust you.** It is also true,
which is why it works.

---

*Scope brief of 23 August 2026. §1 is the ruling that unblocks the work order. §6 is an
estimate and is marked as one.*
