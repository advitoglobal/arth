# RESPONSE 05 — CLOSURE IS NEVER A DECISION

**From:** Director, Product Engineering
**To:** IT Director, Arth · cc Prem Kumar · 16 August 2026
**Re:** your Response 04 and the DDL
**Returning:** your §5 answered yes with a mechanism, your §3 ruled, and two confirmations

---

## §1 YOUR §5 — YES. ADD THE CONSTRAINT

```sql
CHECK ("event" <> 'CLOSED' OR "actorType" = 'SYSTEM')
```

**Add it.** You were right to ask rather than assume, and right that `SCOPE_MERGED` is the case that makes it look doubtful. It is not, and the reason is worth stating because it is the rule the constraint encodes:

> **A closure is never a decision. It is an observation that a condition ended.**

Test it against the awkward one. An admin merges two branches. **He decided to merge branches. He did not decide to close anybody's acknowledgement** — he almost certainly does not know one exists, and if you asked him he would say it was not his to close. The closure is a consequence, detected. The actor is the mechanism, never the man.

**And the constraint closes a door that must not be left open.** If a human path can write a `CLOSED` row, a human can clear a card without taking an exit — which is precisely the dismissal-without-a-reason the whole design forbids. Every other guard against it lives in a service or a renderer. This one lives in the database.

### The mechanism, so `SCOPE_MERGED` does not need an inline write

Your instinct that it might be written in the admin's transaction was pointing at something real: if the sweep runs nightly, an acknowledgement outlives its scope for up to a day and suppresses a card at a place that no longer exists. **That violates fail-toward-visibility**, which I set two documents ago.

**So the scope change enqueues the sweep rather than writing the closure.**

- Admin merges or closes a branch. That transaction commits **and enqueues the orphan sweep for the affected scopes.**
- The sweep runs in seconds, not hours, and writes the closures as `SYSTEM` exactly as it always would.
- Same job, same actor, same causes. No second code path, and nothing to keep in step.

**The trade, stated so nobody discovers it:** there is a brief window in which the acknowledgement outlives its scope. It is bounded by the enqueue, and if the sweep cannot resolve a scope it closes the row — **so the worst case is that a card returns, which is the safe direction by the rule.**

### One cheap addition while the admin is standing there

When he confirms a merge or a closure, tell him: *"3 deferred exceptions at these branches will return to the group cockpit."* One line. It costs nothing, it explains a card he will otherwise see tomorrow and not understand, and it is the difference between a system that acts behind him and one that tells him what it is about to do.

---

## §2 YOUR §3 — RULED. BOUNDED AND LOGGED, NOT ADVITO-ONLY

Your finding is correct and it is the sharpest one in this document: four triggers with an unbounded dial in the hands of the man being insisted upon is a control with an off switch, and it is the same defect as the amber condition that could never fire.

**I am taking your second option rather than your first, and tightening it.**

**Why not Advito-only.** Every dealer who wants a different number then becomes a support ticket to us, and we will say yes case by case. **That is the same off switch, reached through a slower door and with no record of who turned it.** An explicit bound is auditable; our goodwill is not.

**Ruled:**

| Setting | Bound | Default |
|---|---|---|
| Magnitude multiple, this deferral | 1.2× – 2.5× | 1.5× |
| Magnitude multiple, chain origin | 1.5× – 3× | 2× |
| Consecutive deferral count | 2 – 3 | 3 |

Bounds asserted in the suite, per your §2.4 pattern. **A value outside them fails rather than saves.**

**Worst case under the loosest permitted setting: three deferrals, magnitude under 3× of origin, then trigger 4 fires.** The mechanism still insists. That is the property the bound has to guarantee and it does.

### The addition that matters more than the bound

**The setting is logged, and it appears on the card.**

> Deferred three times since 4 August. 11 → 33 enquiries. ₹1.01 lakh → ₹3.0 lakh.
> *Deferral threshold set to 3 by S. Rao on 12 August, from 2.*

**Loosening the dial becomes visible on the exact card it was loosened to delay.** Same principle as a penalty waiver being counted against the manager who granted it: the lever is not removed, it is made impossible to pull quietly. A dealer admin who raises the count on his principal's instruction can still do it. He simply cannot do it invisibly.

---

## §3 TWO CONFIRMATIONS

**`scopeId` stays nullable.** Your reasoning is better than the alternative and I would not overrule it. A synthetic value for `GROUP` is a lie the orphan sweep then has to be taught to ignore, and a sweep with an exception in it is a sweep that will eventually get the exception wrong.

**Derive rather than carry — accepted, and your reasoning corrects mine.** I framed it as query cost. You are right that it is not: **the walk-up rule caps a chain at six rows, so derivation is free**, and the real argument is that an immutable table cannot repair a bad snapshot. The palette precedent is exact — a stored ratio drifting from the colour it describes is the same class of defect, and it is the one that produced the 3.81 / 3.44 error I introduced.

`magnitudeMinor` and `magnitudeCount` stay because they are observations at a moment. **Observations freeze. Derivations do not.** That is a rule worth having beyond this table.

---

## §4 ON THE DDL

**Marking this properly: I am confirming semantics, not SQL correctness.** I have not run it, and against migration precedent and the drift guard your judgement stands over mine. What I can say is what the constraints encode:

**The four `CHECK` constraints are the rules from Responses 03 and 04, exactly.** `reason` conditional on event, `deferUntil` on `ACKNOWLEDGED` alone, the delegation pair travelling together, and `CLOSED` unable to exist without both a cause and a lineage. **Nothing I settled is left to a service to remember.** With the fifth constraint from §1 above, the ledger's own rules are all in the ledger.

`BIGINT` on paise is a catch I would have missed. A five-rooftop group's aggregate pipeline clears ₹2.1 crore comfortably, and it would have overflowed in production rather than in a test.

**One thing I cannot judge and am flagging rather than ruling:** the state index carries `scopeId` in the middle and it is nullable. Whether that index serves the `GROUP`-scope lookup as well as the branch-scope one is a question about this planner and these row counts, and it is yours.

---

## §5 STATUS

| Item | State |
|---|---|
| `CHECK (event <> 'CLOSED' OR actorType = 'SYSTEM')` | **Add it** |
| Scope change enqueues the sweep, never writes the closure inline | Settled |
| Admin told what will return when he merges or closes a scope | Settled |
| Trigger settings bounded, defaults set, bounds asserted | Settled |
| **The threshold setting logged and shown on the walk-up card** | Settled |
| `scopeId` nullable | Confirmed, yours |
| Derive the chain state, drop both columns | Confirmed, your reasoning |
| DDL | **Semantics confirmed. Yours to issue** |
| Ownership model | **With Prem.** Response 03 §5, unchanged |
| Screen B and the Cockpit drawings | In progress |

---

## §6 ONE LINE ON THE EXCHANGE

Your correction on the escape from the walk-up rule is the one I will carry longest: **a hard rule with no way out generates pressure for a fourth exit.** He is never trapped, only prevented from deferring silently again. That is the sentence to quote at whoever eventually asks for a dismiss button, and it is a better defence of the rule than the rule.

---

*Response 05 to the Exception Cockpit exchange, 16 August 2026. To be filed in `docs/decisions/`.*
