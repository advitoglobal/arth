# RESPONSE 02 — AGGREGATE IDENTITY, AND THE DATA CONTRACT

**From:** Director, Product Engineering
**To:** IT Director, Arth · cc Prem Kumar · 16 August 2026
**Re:** your response of 16 August
**Returning:** §2 settled, §3 accepted with one amendment, and the correction I owe you first

---

## §0 THE CORRECTION, BEFORE ANYTHING ELSE

You went to the code. I did not, and two of my rulings rested on behaviour that does not exist.

I wrote that **auto-assign fires at two hours.** It does not exist anywhere in the repository. I wrote that **closure without a reason is blocked in the disposition matrix.** There is no lost-reason field, and the disposition matrix is a specification I wrote in the prototype, not shipped code.

Both were stated as fact. Neither was checked. That is worse than being wrong, because a ruling that cites a control which does not exist propagates: you nearly filed row 9 as solved on my word, and the Book already documents an error message for a control nobody built.

Your §5 heading is the accurate one. **Row 9 is not impossible. It is currently guaranteed.**

A process change I am imposing on myself, and you should hold me to it: **when I assert that a control exists, I will mark where it lives — SCHEMA, WORK ORDER, or PROTOTYPE SPEC ONLY.** Anything marked prototype-spec-only is a proposal whatever tone it is written in. Most of what I sent you last week is in that third category, and I did not label it.

---

## §1 YOUR §2 ANSWERED — WHAT AN AGGREGATE CARD ACTUALLY IS

You are right that the three exits assume a stable identity and that aggregates do not obviously have one. Your two branches are both correct about their own consequences, which is why neither is choosable. The way out is that the question contains a false premise.

### The premise to reject

Neither of us should ask whether it is *"the same card"*. It is the wrong unit.

When the principal defers that card he is not deferring eleven enquiries. He does not know which eleven and would not care if you told him. He is deferring **a condition at a place**: *Whitefield has an untouched-lead problem, I know, I have spoken to the branch head, give me until the 20th.*

The member set is **evidence for** the condition. It is not the thing being acknowledged.

### The ruling

> **An exception is identified by TYPE × SCOPE, never by membership.**
>
> `(no contact past window) × (Whitefield branch)` is one identity, stable across time. Membership churns hourly underneath it and the identity does not move.

Which answers your Tuesday question directly: four contacted, six new, **still the same card, still deferred.** Nothing about the acknowledgement was ever about those eleven records.

It also disposes of the second branch cleanly. The deferral is not worthless, because it was never scoped to a member set that could evaporate.

### The guard you correctly wanted

Your instinct that a worsening problem must not hide behind a deferral is right, and identity-by-type-and-scope does not by itself provide it. So the acknowledgement stores its magnitude and returns early on two triggers:

**Trigger 1 — magnitude.** The value at risk exceeds the acknowledged value by a configurable multiple. Default 1.5×. Returns with the comparison on it:

> *"You deferred this on the 4th when it was 11 enquiries and ₹1.01 lakh, because the branch head was hiring a replacement. It is now 19 and ₹1.9 lakh."*

The reason he gave comes back with it. **That is the whole point of requiring one:** it is not for the audit trail, it is so that when the card returns he can see whether his own assumption held.

**Trigger 2 — a single member breaches on its own.** If one new member exceeds the principal's individual-item threshold, it surfaces as its own card regardless of the deferral on the aggregate. A ₹40 lakh commercial vehicle enquiry does not wait until the 20th because ten small ones were deferred.

Without this clause, deferring an aggregate becomes a way to hide a large item inside a small average, which is the exact behaviour the screen exists to prevent.

### Four consequences, stated so they are not discovered later

1. **Acknowledgement is per type per scope, never across types.** Deferring the no-contact card at Whitefield does not defer the delivery-slipping card at Whitefield. They are different identities that happen to share a place.

2. **Acknowledgement applies at the scope it was made.** He sees group-first with the concentration named, per your adoption of that point, so the identity he acts on is the group card. A branch does not inherit a deferral it was never shown.

3. **When the condition clears entirely, the acknowledgement closes itself.** If the condition recurs in October it is a fresh card, with the August deferral visible in its history. He should be able to see that this is the third time Whitefield has done this, because that is a different problem from the first time.

4. **Acknowledgement is per user.** Two principals in a group is unusual but a principal and a general manager is not, and one man's deferral must not silence another man's screen.

---

## §2 THE SCHEMA SHAPE — for Rule 1, since it is a schema change

Stated as a shape rather than a migration. Yours to review and correct.

```
ExceptionAcknowledgement
  id
  tenantId
  userId                 who acknowledged. Never a role, always a person
  exceptionType          config key, not an enum. New types are seed data
  scopeType              GROUP | BRAND | BRANCH | DEPARTMENT | POSITION
  scopeId
  state                  ACTIONED | ACKNOWLEDGED | DELEGATED
  reason                 required, free text. No exit without one
  acknowledgedAt
  deferUntil             null unless ACKNOWLEDGED
  magnitudeValue         rupees at the moment of acknowledgement
  magnitudeCount         member count at that moment
  delegatedToPositionId  null unless DELEGATED
  delegateDueAt          null unless DELEGATED
  closedAt
  closedCause            CONDITION_CLEARED | RETURNED_ON_MAGNITUDE |
                         RETURNED_ON_DATE | SUPERSEDED
```

Two properties I would ask you to hold:

**Append only.** A change of mind is a new row, never an edit. Consistent with `AuditLog`, `PointEntry`, `CreditTransaction` and `TargetProgress`, and for the same reason: this table is the evidence that a principal knew and chose to wait. If it can be edited it is worth nothing in a dispute.

**`exceptionType` is configuration, not an enum.** The nine types will become eleven. If adding one needs a migration, adding one will not happen.

---

## §3 YOUR §3 — EXITS WITHOUT A DESTINATION. ACCEPTED, WITH ONE AMENDMENT

Your ruling is right and the failure you describe is real: an actioned card leaving for a screen that does not exist is the one thing my own design forbids, arriving by construction.

Your fix — actioned items stay visible under the footer count until a manager screen exists — I accept. One amendment, because I think it can be better than a holding pattern.

**In this cycle, ESCALATE should not pretend to be an assignment. It should be what it actually is: the principal recording that he acted.**

> He presses Escalate. It asks who he is telling and by when he expects it done. It creates a **commitment on his own record**, in exactly the shape the product already uses for a telecaller's promise to a customer. The card leaves his screen. If the date passes with nothing changed, it returns to him as row 23 — an escalated item with no action.

Three things this buys:

- **It is honest now.** He telephoned the branch head; the product records that he telephoned the branch head. It does not claim to have assigned anything.
- **It uses machinery that exists.** Commitments are already specified for the telecalling flow.
- **It degrades upward rather than being replaced.** When the manager Cockpit arrives, the same commitment gains a recipient screen and becomes a real assignment. No rework, no migration, no second concept.

Row 23 also becomes buildable in this cycle, which it otherwise would not be — you cannot detect a manager taking no action if there is nowhere for him to act. This way the escalation is recorded against a named person and the silence is measurable whether or not he has a screen.

---

## §4 THE DATA CONTRACT — what Phase 5 must capture for this to work later

Your sequencing point is correct and I am not arguing with it. The Cockpit is downstream of Phase 5. Two workspaces exist and it would report on two departments while calling itself a group view.

But you also said the scoping is right to do now because it tells Phase 5 what to capture, and that deserves an actual list rather than agreement. Here it is: for each surviving card, the thing Phase 5 must record or the card cannot exist.

| # | Card | What must be captured |
|---|---|---|
| 1 | No contact past window | First-response timestamp, and the promised window per source. Partly present. **Working hours must gate it** or the branch is blamed for a lead that arrived at 21:40 |
| 6 | Booking past promised delivery | The chain as an object: step, owner as a Position, SLA, blocking reason. The promised date must be **computed and stored as an event each time it changes**, not overwritten |
| 10 | Campaign not returning | Attribution. Phase 6. **The click identifier must be captured at Phase 4** or the card is unbuildable later |
| 14 | Promise moved more than once | Promise history, append only, with who set each one. **If the delivery date is a mutable field this card cannot be written at any price** |
| 15 | Service job past promised time | Promised time on the job card, and the completion event |
| 16 | Complaint inside the survey window | A Case object, plus the OEM survey schedule. You are right that without the survey link this is a service card. **I would rather it be a service card in this cycle than a principal card built on a guess** |
| 20 | Same failure across branches | A **shared defect taxonomy**. This is the one nobody will think of: if each branch types its own free text, the card can never be written. Needs a controlled list from the first job card |
| 22 | Branch response slipped | Computable today from the metrics engine. **The only card on the list with no new dependency** |
| 23 | Escalated with no action | Escalation events and manager action events. Buildable in this cycle under §3 above |
| + | Renewals expiring | Policy expiry on the vehicle. Phase 5 |
| + | Used car ageing | Stock intake date and floor-plan rate |
| + | Leaver's pipeline | Employment state and a handover event |
| + | Discount approved, not closed | Discount request linked to the deal outcome. Cheap if built with the request, expensive after |
| + | Lost reason | Your §5 finding. **A controlled list, not free text**, or "why we lose" is unanswerable in aggregate |

**The pattern worth naming:** almost every item is an event that must be captured at the moment it happens. **None can be reconstructed afterwards.** That is the whole argument for scoping the Cockpit before its workspaces rather than after, and it is a better argument than the one I made.

---

## §5 ADOPTED FROM YOURS WITHOUT CHANGE

**Your §5.** Row 9 stays dropped from the Cockpit and becomes a Phase 5 requirement. Your framing is the right one and I will not soften it: I was right about where it belongs and wrong about it being solved. The commercial point is the sharper one — *why we lose* is the question a dealer principal asks most often, and Arth cannot currently answer it.

**Your §4.** All four data dependencies accepted. Cockpit downstream of Phase 5 accepted.

**Your §6.** Agreed, and it is the better kind of outcome. Nine types is the ceiling by construction and the fifteen-card cap never binds. The question returns only for the manager screen, which is out of cycle.

**Your §7.3.** Screen B starts with telecalling, absorbs the welcome rather than putting a modal in front of it. Agreed.

---

## §6 WHAT IS NEEDED BACK

**From you.** The `ExceptionAcknowledgement` shape in §2, reviewed. Particularly whether `exceptionType` as configuration rather than an enum survives contact with the lint rules, since it is the difference between adding a tenth card in an afternoon and adding it in a release.

**From Prem.** The ownership model, now that aggregate identity is settled: type × scope, magnitude stored, two return triggers, reason required on every exit.

**Recorded for Phase 5.** The thirteen items in §4, of which **the lost reason** and **the shared defect taxonomy** are the two that are cheap now and impossible to retrofit.

---

*On your closing note. The finding that most of §4 was addressed to the wrong man came from picturing one man at nine in the morning, which is the only thing I did that you had not. You went to the schema, which is the only thing you did that I had not, and it caught two assertions I should never have made. Neither of us would have got here alone.*

---

*Response 02 to the Exception Cockpit exchange, 16 August 2026. To be filed in `docs/decisions/`.*
