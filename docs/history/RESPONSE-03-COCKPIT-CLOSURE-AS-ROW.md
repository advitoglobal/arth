# RESPONSE 03 — CLOSURE AS A ROW, AND WHAT I AM DRAWING

**From:** Director, Product Engineering
**To:** IT Director, Arth · cc Prem Kumar · 16 August 2026
**Re:** your Response 02 and Conclusion of 16 August
**Returning:** §3.1 settled, the four remaining findings ruled, and the front-end sequence I am starting on

---

## §1 §3.1 — YOU ARE RIGHT, AND I ASKED FOR TWO INCOMPATIBLE THINGS

I asked for append-only and then put two mutable columns on the table. `closedAt` and `closedCause` are not a tension with the claim, they are unwritable under `REVOKE UPDATE, DELETE`, and no process could ever have set them. That is a straightforward design error and your first option is the right way out.

**Taking it further than option 1, because the table should not have been a record in the first place.** Once closure is a row, there is no remaining reason for this to be an acknowledgement table with a lifecycle. **It is a ledger, and it should be named and shaped like the ones this codebase already has.**

```
ExceptionEvent                        -- ledger, not a record
  id
  tenantId
  userId              who acted. Never a role, always a person
  exceptionType       config key, valid set asserted in the suite
  scopeType           GROUP | BRAND | BRANCH | DEPARTMENT | POSITION
  scopeId
  event               ACTIONED | ACKNOWLEDGED | DELEGATED | CLOSED
  reason              required on every row. No exit without one
  occurredAt
  deferUntil          set only on ACKNOWLEDGED
  magnitudeMinor      integer paise at the moment of the event
  magnitudeCount      member count at that moment
  delegatedToPositionId / delegateDueAt    set only on DELEGATED
  cause               set only on CLOSED:
                      CONDITION_CLEARED | RETURNED_ON_MAGNITUDE |
                      RETURNED_ON_DATE | SCOPE_REMOVED | SCOPE_MERGED
  supersedesId        the row this closes, where applicable
```

**Current state of an exception is the latest row for `(tenantId, userId, exceptionType, scopeType, scopeId)`.** Exactly how `PointEntry` and `CreditTransaction` already work, which is the point: no new pattern, no new mental model, and the privilege revocation applies unchanged.

### Two consequences worth stating, because one of them is a genuine improvement

**The magnitude baseline re-sets on every deferral, and it must.** He defers at 11 and ₹1.01 lakh. It returns at 19 and ₹1.9 lakh, closed with `RETURNED_ON_MAGNITUDE`. If he defers again, the new `ACKNOWLEDGED` row carries 19 and ₹1.9 lakh as its baseline. Without this, trigger 1 fires again on the next cycle and the second deferral is worthless — the same failure your original question identified, arriving from a different direction.

**Repeated deferral on one identity is now queryable for free.** *"This is the third time Whitefield has been deferred on this, and each time it was larger."* I asked for that behaviour in Response 02 §1.3 and would have had to build something extra to get it. The ledger shape gives it away, which is usually the sign that the shape is right.

---

## §2 THE OTHER FOUR, RULED

### §3.2 — Integer paise

Accepted without qualification. `magnitudeMinor`, integer, paise. Rendered as rupees at the surface per the Book's own numeric rules. **My error, and it is the second time in this exchange I have written a figure without checking how this system stores figures.**

### §3.3 — The polymorphic scope, and the rule you asked me to name

Naming it, and the general principle first because it decides all three cases:

> **An acknowledgement suppresses a card. So on any doubt about whether it still applies, close it and let the card return. Fail toward visibility, never toward suppression.**

This is the inverse of the fail-closed rule on permissions, and deliberately so: an access check that fails closed protects the dealer, and a suppression that fails closed hides money from him.

| Event | Behaviour |
|---|---|
| **Scope deleted** — a branch closes | Close with `SCOPE_REMOVED`. The card cannot render anyway |
| **Scope merged** — two branches become one | Close with `SCOPE_MERGED`. **Do not carry the deferral across.** A deferral about Kengeri's problem is not a deferral about the merged entity's problem: membership and magnitude both change materially, and the man who deferred was told a different number |
| **Scope renamed** | Acknowledgement survives, because identity is the id and never the name. When the card returns it shows the current name. If the deferral was made under the old name, say so on the returning card, or he will not recognise his own decision |

**One addition, since `scopeId` cannot carry a foreign key.** The nightly reconciliation should include orphaned `ExceptionEvent` rows — a `scopeId` pointing at nothing — and close them with `SCOPE_REMOVED`, reporting rather than deleting. That is the same discipline as the sampled lead reconciliation: the database cannot enforce it, so something has to look.

### §3.4 — `exceptionType` as configuration

Accepted, and your mitigation is better than my ask. One extension: **the assertion should be bidirectional.** Every key in configuration has a renderer, and every renderer has a key in configuration. An orphan in either direction fails the build.

One-directional assertion catches the typo that creates a card nobody renders. It does not catch the renderer left behind when a card is retired, which then sits in the codebase looking live. The palette completeness check you cited works in both directions for the same reason.

### §3.5 — Free text here, controlled list there

Recording the asymmetry as you asked, and generalising it so the next reviewer has a rule rather than an exception to be tidied away:

> **Free text when the reader is the writer and the audience is one person, once.**
> **Controlled list when the field will be counted.**

| Field | Form | Why |
|---|---|---|
| Deferral reason | Free text | Read once, by the man who wrote it, when the card returns. Never counted. A dropdown produces five useless categories and destroys the only thing that makes the return useful |
| Lost reason | Controlled list | Counted across hundreds of enquiries to answer *why do we lose*. Free text makes that question permanently unanswerable |
| Defect description | Controlled list | Counted across branches. Free text makes row 20 unbuildable at any price |
| Discount justification | Free text | Read by one manager, once, to make one decision. What is counted is the *outcome*, not the words |
| Penalty waiver reason | Free text | Same. What is counted is the number of waivers per manager, not their prose |

**The test that settles any future case: will anybody ever put this field in a GROUP BY.** If yes, it is a list. If no, free text, and standardising it takes value out rather than adding consistency.

---

## §3 ON YOUR §2 — YOU CORRECTED ME UPWARD, AND THAT IS STILL AN ERROR

You found that commitments are built rather than specified — `LEAD_EVENT_TYPES.COMMITMENT`, the `record-commitment` route, ledger tests — and that I marked my own amendment lower than it deserved.

I would rather not accept the compliment that erring in that direction is the right way to be wrong. It is safer, but it is the same failure: **I asserted the status of shipped code without looking.** In §0 of Response 02 the cost was a control that did not exist. Here the cost was nearly proposing to build something already in the repository, and the only reason it was harmless is that you check.

So the labelling rule needs a fourth mark, and it is the honest one for most of what I write:

**SCHEMA · WORK ORDER · PROTOTYPE SPEC ONLY · NOT VERIFIED**

Anything I have not personally opened is **NOT VERIFIED**, whichever direction my guess points. That is a smaller claim than the other three and it is the accurate one.

---

## §4 WHAT I AM DRAWING, AND IN WHAT ORDER

Taking your clearance in the Conclusion. Two pieces, in this sequence, for a specific reason.

### First — Screen B, telecalling

**Because it is the only screen that can be honest today.** Telecalling is the one fully built workspace. Everything it needs is either in the schema or in Phase 4, which has closed. It can be drawn, specified and built without waiting for anything.

Building to Brand v2.5 §5.3 as you have relayed it: **one live, non-dismissible day panel on the landing screen**, serving both the morning reading and the closing one, **no modal, no time-of-day greeting.** And §4.5's two tests on every line: does it carry its evidence, and is the subject the work rather than the person. **No named-colleague ranking on a person's own screen** — which also settles something in the prototype, where I had a floor rank on the telecaller's own view. That comes out.

### Second — the Cockpit's nine types and three exits

Drawn to specification grade and **marked throughout as awaiting Phase 5 data**, not built. Including the reserved-places pattern from Brand v2.6 — aggregates carrying the age of their oldest instance, *"3 delivery promises broken · oldest 19 days"*, never a named record. **Brand amended its own rule to agree with the resolution rule rather than the reverse, which I note and do not take for granted.**

No truncation line, per your §2. Nine is the ceiling by construction and a rule that never fires should not be drawn.

### The discipline I am adopting from your §5

Your question is the right one and it changes how I draw rather than what I draw. **Every screen from here carries a data-dependency block:**

```
WHAT THIS SCREEN NEEDS RECORDED
  <the event or field>          <where it lives>          <status>
  first-response timestamp      Lead, Phase 4             SCHEMA
  promised delivery date        nowhere                   NOT RECORDED
  defect category               nowhere                   NOT RECORDED
```

A screen with a `NOT RECORDED` line is a specification for Phase 5, not a thing to be built. **That turns the prototype from a picture into an input**, which is what you said the scoping was for, and it stops me proposing screens that quietly assume somebody is capturing something.

---

## §5 FOR PREM — THE ONE THING STILL WAITING ON YOU

Everything else is settled. This is the ownership model, in plain terms, and it needs a yes or a change.

**When you look at the Cockpit at nine in the morning and see something, you have three ways to clear it from the screen and no fourth.**

1. **You act.** You telephone the branch head, approve something, or pause a campaign. The item leaves your screen and is recorded as your action, with who you told and by when you expect it. If that date passes and nothing has changed, it comes back to you.
2. **You acknowledge it with a date.** *"I know. The RTO office is on strike. Show me on the 20th."* It leaves until then. It comes back **early** if the money at risk grows past half again, or if one new item inside it is large enough to matter on its own — and when it comes back, your own reason comes back with it so you can see whether what you assumed held.
3. **You hand it to somebody by name, with a deadline.** It leaves. It returns to you, escalated, if that person does nothing.

**You cannot dismiss something without giving a reason.** If you could, the screen becomes a thing to be cleared rather than read, which is worse than a long list.

**And a line at the foot always shows what is still unresolved** — *"14 items you have already acted on are still not fixed"* — one click to open them. Your instruction that nothing old should be hidden is met by that line rather than by keeping everything on the main screen, which would grow until you stopped opening it.

**What we need from you: yes, or tell us which of the three is wrong.**

---

## §6 STATUS

| Item | State |
|---|---|
| Aggregate identity, type × scope, both triggers | Settled |
| `ExceptionEvent` as a ledger, closure as a row | Settled here; DDL yours to draft under Rule 1 |
| Integer paise, scope rule, bidirectional assertion, free-text asymmetry | Settled |
| Escalate as a commitment on the principal's own record | Approved by you, using shipped machinery |
| Row 10, click identifiers | **Met.** Phase 4 |
| Row 14, promise history | **Not recorded.** Phase 5 requirement, your phrasing |
| Lost reason, defect taxonomy | Phase 5 work order, as requirements |
| Ownership model | **With Prem.** §5 above |
| Screen B and the Cockpit drawings | **Starting today.** Nothing blocked |

---

*On your closing note: the division is accurate and the labelling rule is the cheapest fix, which is why the fourth mark in §3 above is the one I actually needed. You have twice found that I described the repository from memory. The correct response is not to be more careful about which way I guess — it is to stop guessing and say so when I have not looked.*

---

*Response 03 to the Exception Cockpit exchange, 16 August 2026. To be filed in `docs/decisions/`.*
