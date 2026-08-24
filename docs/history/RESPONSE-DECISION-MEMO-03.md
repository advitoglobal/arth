# RESPONSE TO DECISION MEMO 03

**From:** Director, Product Engineering
**To:** IT Director · cc CEO
**Re:** `DECISION-MEMO-03.md` — response to Addendum 01
**Date:** 4 August 2026

---

## 0. POSITION

All rulings accepted. Your rejection in §4 is correct and I am withdrawing full event sourcing.

You asked directly whether I think the drift risk is underweighted. **At the transaction level, no. At the code-path level, yes — and the fix is your own pattern, not mine.** Three refinements in §2 below.

One genuine problem in the schedule table: **C.3 is placed in Phase 4 and its customer-facing half is placed in Phase 7.** §3.

Governance proposal accepted with one addition. §5.

---

## 1. ON §4 — YOU ARE RIGHT AND I AM WITHDRAWING

Your three reasons are each sufficient on their own.

The second is the one that settles it. Event sourcing does not punish a team at build time; it punishes them six months later when a projection has drifted and nobody can reconstruct why. **A team of one plus AI tooling has no margin for a debugging class it has never operated.** I was reasoning from what the architecture should ideally be, not from who has to maintain it at 11pm during a festive-season incident. That was the wrong frame and you were right to name it.

The first is also correct and I had not weighted it properly. The metrics engine's invariants are the thing standing between this product and the predecessor's production defects. Re-proving them concurrently with porting seven workspaces is two hard things at once, and the second one is not optional.

Your escape-hatch argument is the deciding one for me: **from a position where every event is already captured, moving to full projections later is a small step. The reverse is not true.** That asymmetry means the ledger at Phase 4 gets us the option without paying for it now, which is exactly the right trade.

`LeadEvent` alongside `Lead`, same transaction, append-only at the privilege level — **approved and better than what I asked for.**

---

## 2. THREE REFINEMENTS TO THE LEDGER

The one thing given up is drift-proofing, as you say. Your CI reconciliation test is necessary but it is not sufficient, for a specific reason.

### 2.1 The CI test proves the fixture, not the code paths

Rebuilding `Lead` from `LeadEvent` for every lead in the fixture proves that the events *present* reconcile. It cannot prove that **every write path emitted one.** A new route added in Phase 5 that updates `Lead.stage` directly and forgets the event will pass that test, because the fixture predates the route.

That is the actual drift mechanism, and it is a code-path problem, not a data problem.

**Ask: a lint rule forbidding any write to `Lead` outside a single `recordLeadEvent()` function** — the same shape as `forTenant()` for tenancy, `can()` for entitlements, and the aggregation rule for metrics. `eslint.config.mjs` already carries three rules of exactly this class, and this is the fourth.

With that rule, drift is not detected after the fact. It is unrepresentable. That closes the gap you correctly identified as the real cost of the compromise, and it costs an afternoon.

### 2.2 Reconciliation should also run in production, not only CI

CI runs against a fixture. Production runs against real dealer data, real concurrency, real partial failures.

**Ask: a nightly sampled reconciliation** — take N leads per tenant, rebuild from `LeadEvent`, compare to the stored row, report mismatches to Sentry with the lead ID and the diverging field. Report only, never auto-correct; a silent auto-correction would destroy the evidentiary value that is the entire point of the ledger.

Same discipline as §13.7's vendor tier monitor: find the problem before a client does.

### 2.3 `LeadEvent` needs a per-lead sequence number

Your field list — actor, position, timestamp, payload — is right but incomplete for replay.

**Timestamps are not a reliable ordering key.** Bulk import, bulk reassignment on a resignation handover, and any batched write will produce multiple events sharing a timestamp. Replay ordering is then ambiguous, and ambiguous replay is a ledger that cannot answer the question it exists to answer.

**Ask: a monotonic `sequenceNumber` per lead**, assigned in the same transaction. Trivial now. Not recoverable later, because the ordering information will already have been lost in the rows.

---

## 3. A DEPENDENCY ERROR IN THE SCHEDULE TABLE

§5 places **C.3 delivery chain in Phase 4** and **C.4 messaging `senderId` in Phase 7.**

The delivery chain has two halves:

| Half | What it needs | Placed in |
|---|---|---|
| Internal exception queue — slipped bookings, blocking node, owner | Workspace framework only | Phase 4 ✓ |
| **Customer-facing tracking link on WhatsApp** | **`MessagingProvider`** | **Phase 7** ✗ |

**As scheduled, Phase 4 ships the delivery chain without the half that customers see.**

That matters commercially more than it looks. The internal queue is what the sales manager values; the tracking link is what generates referrals, and it is the single most demonstrable thing in the product — a dealer principal who can show a customer their car's status on WhatsApp tells other dealer principals. Shipping the graph without the link means we have built the hard part and withheld the visible part.

**Two ways to resolve, and I do not have a strong preference:**

- **(a)** Pull `MessagingProvider` with `senderId` forward to Phase 4 alongside the delivery workspace. Phase 7 is already marked *"may run parallel from Phase 4"*, so this is within the plan as written rather than a change to it.
- **(b)** Keep it in Phase 7 and state explicitly that the delivery chain is internal-only until Phase 7, so nobody demos a tracking link that does not exist.

**(a) is my preference** because the customer-facing half is the differentiator, but the messaging adapter is your build and the sequencing call is yours.

**One related note, no action needed:** the same reading tells me there is no customer-facing messaging at all before Phase 7. That is consistent and I am not arguing with it — but it means C.6's withdrawal propagation has nothing to propagate to until Phase 7 either, which makes its Phase 7 placement correct rather than late. I had assumed it was late. It is not.

---

## 4. TWO ACKNOWLEDGEMENTS

**On C.2.** Your reason 3 — that under mechanism (a) a Maruti target and a Kia target are siblings under the root and cannot be summed by accident, whereas under (b) nothing structurally prevents it — is an argument I did not make and should have. §11.3.2's cascade reconciliation silently summing across franchises would have produced a wrong number that looked right, which is the worst category of defect this product can have. The Arena/Nexa point is also correct: they are separately targeted, separately reported and separately staffed everywhere I have seen, and modelling them as one unit would have been my error, not a workaround for yours.

**On §0.** You did not have to write that paragraph about §7.5 surviving four work orders. That you did is the reason this process is working, and it is worth more to the build than the correction itself.

---

## 5. GOVERNANCE — ACCEPTED, WITH ONE ADDITION

Your division is right and I accept it as written. Product Engineering owns what and why; IT Director owns how, the gates and merge sign-off; the CEO owns scope, schedule and commercial; nothing reaches the team except through a work order.

**The one addition — a rule for facts that change under us.**

Several things in Addendum 01 were not opinions. Google moved offline conversions to the Data Manager API on 15 June 2026 and blocked the old endpoint. WhatsApp numbers stop working on the handset once they move to the Cloud API. The DPDP consent-manager framework opens in November 2026. Provider rates move quarterly.

**These will change again, and neither of us owns "checking."**

**Proposal: a standing quarterly requirements review** — Product Engineering re-verifies external facts the build depends on (platform APIs, provider rates, regulatory dates, competitor capability) and issues a short delta memo. Nothing in it is a build instruction; it goes to you for ratification like Addendum 01 did.

Rationale: §7.3 already tells us to re-check credit costs quarterly. This is the same discipline applied to everything else the product assumes about the outside world. The failure mode without it is not dramatic — it is a specification that is quietly six months out of date on the day a dealer tries to use it.

**On the C.2 pattern.** You are right that requirement-from-me, mechanism-from-you worked and should be the norm. I will write that way by default: state what must be true and why, name the candidates where I can see them, and ask for the decision rather than making it.

---

## 6. FOR THE CEO — MY VIEW ON THE SCHEDULE

Not my decision, but I owe a view since I caused most of the addition.

**I support accepting the three weeks**, and I want to be specific about which part I would defend hardest and which I would give up.

**The 1.5 weeks for C.3 is the one to protect.** Your own framing settles it: the product promises enquiry to delivery, and without the chain it delivers enquiry to booking. That is not a missing feature — it is a promise we cannot keep. It is also the only item in Addendum 01 that no competitor has, which means it is the only one that is still an advantage in eighteen months.

**If the CEO cannot accept three weeks, here is what I would cut, in order:**

| Cut | Saves | Cost of cutting |
|---|---|---|
| C.5 cases | 4 days | Real but deferrable — needed before the tracking link is customer-facing, not before Phase 4 |
| C.4 inbound telephony | 3 days | Recoverable revenue leak stays open a while longer |
| C.6 withdrawal and purpose tagging | 2 days | Deferrable **only until the DPDP compliance deadline**, and not past it |

**Do not cut C.1 attribution capture (half a day), the C.2 brand layer (3 days), or the E ledger (3–4 days).** All three are cheap now and rewrites later, which makes cutting them a false saving — the exact category of decision the phase-gate discipline exists to prevent.

That is roughly nine days recoverable against three weeks. The remainder is C.3, and I would rather ship in December with it than in November without it.

---

## 7. WHAT I AM ASKING FOR

| # | Item | Ref |
|---|---|---|
| 1 | Lint rule forbidding writes to `Lead` outside `recordLeadEvent()` | 2.1 |
| 2 | Nightly sampled production reconciliation, report-only, never auto-correct | 2.2 |
| 3 | Monotonic `sequenceNumber` per lead on `LeadEvent` | 2.3 |
| 4 | Resolve the C.3 / C.4 phase dependency — (a) pull messaging to Phase 4, or (b) state the delivery chain is internal-only until Phase 7 | 3 |
| 5 | Quarterly external-requirements review, to CEO for confirmation | 5 |

Everything else in Memo 03 is accepted as issued, and WO-04 can carry it as written.

---

*Response to Decision Memo 03. To be filed in `docs/decisions/`.*
