# RESPONSE 04 — THE LAST THREE, AND ONE RULE THAT MAKES §2.3 HOLD

**From:** Director, Product Engineering
**To:** IT Director, Arth · cc Prem Kumar · 16 August 2026
**Re:** your Response 03
**Returning:** §2.1 and §2.2 settled so you can draft the DDL, and §2.3 answered with two triggers rather than one

---

## §1 §2.1 — ACCEPTED. THE CONSTRAINT WAS UNSATISFIABLE AGAIN

Same error as `closedAt`, one document later: a rule the writing process cannot obey. Four of my five causes have no human, and a job inventing a reason would poison the one field whose entire worth is that a person wrote it.

**Ruled:** `reason` required on `ACTIONED`, `ACKNOWLEDGED`, `DELEGATED`. Never written on `CLOSED`.

**And it is now checkable rather than a convention** — a check constraint on the event type will enforce it, which the previous version could not have had at any strength.

---

## §2 §2.2 — ACCEPTED, AND IT REACHES FURTHER THAN THE COLUMN

You are right that one column cannot be both, that the precedent is already in `AuditLog` and the lead ledger, and that the state query would have broken silently — a job-written closure keyed on the job would never clear the card for the man who deferred it. That is a defect I would not have found from a screen.

**Ruled:**

- `actorType` / `actorId` — who wrote the row. `SYSTEM` on every job-written closure.
- `subjectUserId` — **whose screen this governs. The state query keys on this and never on the actor.**

### One consequence that becomes a constraint

**Where does the job get `subjectUserId` for a closure it writes?** From the row it is closing. Which makes `supersedesId` **required on every `CLOSED` row**, not optional — you cannot close what was never opened, and the closure has no other way to know whose screen it belongs to.

**And it must also be set on an `ACKNOWLEDGED` row that continues a chain**, or §3 below has nothing to walk:

```
ACK₁  (supersedes: null)          he defers, 11 · ₹1.01 L
 └─ CLOSED  cause RETURNED_ON_MAGNITUDE   supersedes ACK₁, actor SYSTEM
     └─ ACK₂  supersedes the CLOSED row   he defers again, 19 · ₹1.9 L
```

**The chain breaks on one cause only: `CONDITION_CLEARED`.** The problem genuinely went away, so the next acknowledgement starts a fresh chain at count 1. The old chain stays visible as history — *the third time Whitefield has done this* is a different fact from *deferred three times running*, and both are worth having.

---

## §3 §2.3 — YOU ARE RIGHT, AND ONE TRIGGER IS NOT ENOUGH TO FIX IT

I checked your arithmetic rather than taking it: 11 → 16.5 → 24.75 → 37.1. Compounding 1.5× never fires against a moving baseline, and trigger 2 watches individual members while the aggregate walks. **The problem triples and the screen never once insists.**

Your reading of *why* is the part I want to keep: **the man is not gaming anything.** Each deferral is reasonable in isolation. That is precisely how the original long-list failure worked, and it is why insistence has to be in the ledger rather than trusted to somebody's memory across five weeks.

**Your instrument — make repeated deferral a card — is right. But a count alone leaves the mirror-image gap open.**

A problem stuck at 11 enquiries for six weeks grows not at all, so no magnitude trigger will ever fire. It is still eleven customers nobody has telephoned. **Growth and staleness are two different failures and each needs its own trigger.**

### Trigger 3 — cumulative, against the origin of the chain

The magnitude test re-runs against **the first magnitude in the unbroken chain**, not the latest.

| Deferral | Magnitude | vs latest, 1.5× | vs origin, 2× |
|---|---|---|---|
| 1st | 11 · ₹1.01 L | — | baseline |
| 2nd | 16 · ₹1.46 L | no | no |
| 3rd | 23 · ₹2.1 L | no | **fires** |

Default 2× on the origin. **It catches the walk-up on the third step regardless of how many small steps were used to get there**, which is the property your table exposes and mine lacked.

### Trigger 4 — count, for the problem that is not growing

Third consecutive `ACKNOWLEDGED` on one identity surfaces regardless of magnitude. Your number, and I would not improve on it: two deferrals is often legitimate — an RTO strike lasts a fortnight — and four is too late to be useful.

### The card itself

Framed as you framed it. The trajectory, not a reprimand, because none of his individual decisions could show it to him:

> **Whitefield · no contact past window**
> Deferred three times since 4 August. 11 → 33 enquiries. ₹1.01 lakh → ₹3.0 lakh.
> *4 Aug: "branch head is hiring a replacement." 12 Aug: "candidate joins Monday." 19 Aug: "he has joined, give it a week."*

**His own three reasons, in sequence.** That is the whole argument and nobody has to make it in prose.

### The rule without which none of this works

**A walk-up card cannot be acknowledged. `ACTIONED` or `DELEGATED` only.**

If it could be deferred, the fourth deferral re-baselines the chain and the entire mechanism becomes circular — an insistence you can dismiss is not an insistence. **This is the one hard exit restriction on the whole screen**, and it needs to be in the ledger's own rules rather than in a renderer, because a renderer can be changed by somebody who does not know why.

### Two columns, and the cost is yours to rule on

Trigger 3 and trigger 4 both need chain state. `supersedesId` makes it walkable, but a recursive walk per card on a screen that must load in ninety seconds is a cost I cannot judge from here.

**So I would carry them on the row and let you overrule it:**

```
chainOriginMinor      the first magnitude in this unbroken chain
chainDeferralCount    1 on a fresh chain, incrementing on each continuation
```

Denormalised, and **append-only survives intact** because each row carries its own snapshot and nothing is ever updated. If the recursive walk is cheap enough at the volumes you have benchmarked, drop both columns and derive them. **That is a query-cost decision and it is yours.**

---

## §4 THE SHAPE, CONSOLIDATED FOR THE DDL

```
ExceptionEvent                          -- ledger. REVOKE UPDATE, DELETE
  id
  tenantId
  actorType             USER | SYSTEM
  actorId               who wrote the row
  subjectUserId         whose screen this governs. State query keys here
  exceptionType         config key. Valid set asserted bidirectionally
  scopeType             GROUP | BRAND | BRANCH | DEPARTMENT | POSITION
  scopeId               polymorphic, no FK. Orphan sweep closes strays
  event                 ACTIONED | ACKNOWLEDGED | DELEGATED | CLOSED
  reason                required on the three human events. Never on CLOSED
  occurredAt
  deferUntil            ACKNOWLEDGED only
  magnitudeMinor        integer paise at this event
  magnitudeCount
  chainOriginMinor      } your call: carried, or derived from lineage
  chainDeferralCount    }
  delegatedToPositionId / delegateDueAt     DELEGATED only
  cause                 CLOSED only: CONDITION_CLEARED |
                        RETURNED_ON_MAGNITUDE | RETURNED_ON_COUNT |
                        RETURNED_ON_DATE | SCOPE_REMOVED | SCOPE_MERGED
  supersedesId          required on CLOSED. Required on ACKNOWLEDGED
                        continuing a chain. Null on a fresh chain
```

`RETURNED_ON_COUNT` is new since Response 03 and is trigger 4's cause.

**State of an exception:** the latest row for `(tenantId, subjectUserId, exceptionType, scopeType, scopeId)`.

**Four return triggers, in the order they should be evaluated:**

| | Fires when |
|---|---|
| 1 | Magnitude exceeds **this deferral's** baseline by 1.5× |
| 2 | A single new member breaches the individual-item threshold |
| 3 | Magnitude exceeds the **chain origin** by 2× |
| 4 | Third consecutive acknowledgement on one identity |

**All four multiples and counts configurable per tenant.** A five-rooftop Maruti group and a two-brand group with a commercial vehicle franchise will not want the same numbers, and hardcoding them guarantees a request to change them.

---

## §5 ACCEPTED WITHOUT CHANGE

**§4, the fourth label binding both ways.** The right outcome, and I note you took it rather than only agreeing to it.

**§6.** Not sending Prem a second version of the same question. Agreed, and it is the more useful discipline — two documents asking one thing is how a decision stops being made.

---

## §6 STATUS

| Item | State |
|---|---|
| `reason` conditional on event | Settled |
| `actorType` / `actorId` / `subjectUserId` | Settled |
| `supersedesId` required on CLOSED and on chain continuation | Settled |
| Chain breaks only on `CONDITION_CLEARED` | Settled |
| Triggers 3 and 4, with `RETURNED_ON_COUNT` | Settled |
| **Walk-up card cannot be acknowledged** | Settled. Ledger rule, not a renderer rule |
| `chainOriginMinor` / `chainDeferralCount` carried or derived | **Yours.** Query cost |
| DDL | Yours to draft, then Prem under Rule 1 |
| Ownership model | **With Prem.** Response 03 §5, unchanged |
| Screen B and the Cockpit drawings | In progress |

---

*Three documents ago I proposed a table with two unwritable columns, a constraint no process could satisfy, a rupee decimal, and an identity that would have broken the state query on every system-written row. None of that was visible from a screen and all of it was visible from the schema. The exits and the triggers are worth something because you kept finding what the drawing could not show.*

---

*Response 04 to the Exception Cockpit exchange, 16 August 2026. To be filed in `docs/decisions/`.*
