# ADDENDUM 01 — RECONCILIATION AGAINST MASTER SPEC & CODEBASE

**To:** IT Director, Arth
**From:** Product Engineering
**Date:** 4 August 2026
**Re:** Corrections to `ARTH-PRODUCT-DECISIONS-HANDOVER` (4 Aug 2026)

**Read this before the handover document.** I wrote that document before reading the Master Build Specification and the repository. Having now read `docs/ARTH-MASTER-BUILD-SPECIFICATION.md` (Parts 0–19), WO-01 through WO-03, `prisma/schema.prisma` and the four applied migrations, several items in it are redundant, two are actively worse than what you have already specified, and I am withdrawing them.

What remains after that correction is a much shorter list, and it is more useful for being shorter.

---

## PART A — WHAT I WITHDRAW

These were written in ignorance of the Master Spec. **Your specification is better in every case. No action required beyond confirming I have read them correctly.**

| Handover § | What I proposed | Already specified, better | Verdict |
|---|---|---|---|
| §13 Scheme & price master | Upload option, agent refresh, effective dates | **Part 10** — VehicleBrand/Model/Variant/VariantPrice with `effectiveFrom`/`effectiveTo` and versioning; Dealer-Admin approval workflow; dealer override suspending auto-proposals; **§10.5 Reference Data Agent** covering RTO slabs, insurance rates, bank rates, with PENDING_APPROVAL never auto-activating and mandatory staleness flagging; **§10.6 snapshot rule** — every quotation and booking stores the exact prices and version IDs used | **Withdrawn.** §10.6 is a stronger form of my "effective dates" ask. A March quotation reopening with March figures is exactly right, and I would not have specified the silent-parse-failure rule |
| §15 Points & performance | One weighted score per role, activity/quality/outcome, negatives capped and waivable | **Part 11** — three separate systems never merged (Points = behaviour, Targets = outcome, Ratings = judgement); §11.2.1 anti-gaming with LOST reason codes, stage-jump evidence requirements, reversal on rollback, daily caps, cooldowns, cherry-picking normalisation, monthly anomaly report | **Withdrawn, and I was wrong.** §11.1's rationale is correct: merging outcome into behaviour tells an executive that good behaviour is worthless in a slow month. §11.3.6 — *"missing target never deducts points"* — is the single best line in the specification. My design would have produced exactly the lead-hiding it warns about |
| §15.4 Score visibility | Team rankings public, individual rankings private | **§11.5.4** — bottom rankings never broadcast in any scope; user always sees own rank everywhere; top three published per group; opt-out available; normalisation method stated openly in the UI | **Withdrawn.** Better reasoning than mine. "A ranking nobody understands is a ranking nobody trusts" is the right principle |
| §18 Departments as departments | Insurance and Service as full workspaces, not modules | **Part 9** — workspace framework with per-department `primaryObject`, `pipelineStages`, `actionBar`, `metricSet`; Insurance is renewal-first opening on the next 30 days by expiry; Service is job-card-first with a permanently visible promised-delivery countdown; §9.4 lead moves between departments carrying full history | **Withdrawn.** Identical intent, already specified, with the "adding a seventh department must not touch the core" proof requirement I did not think to demand |
| §20 Integrations | List of what we offer and who supplies it | **Part 13** — capability interfaces not provider interfaces, lint rule banning vendor names outside the adapter layer, per-tenant provider selection, dual-run traffic splitting during migration, contract test suite per capability, idempotency keys on every write | **Withdrawn.** §13.2 is materially better than my list. The dual-run requirement in particular is something I would not have specified and would have regretted |
| §2.1 One shared core | Customer/Vehicle/Household/Employee shared; no module gets its own copy | **Part 9.2** (shared core, only the workspace layer differs) and **Part 10.2** (platform-level catalogue with no `tenantId`) | **Already the design.** Restating only because it will be under pressure at Phase 4 |

**One correction I owe you specifically.** The handover argues the Tekion "one data core" model as though it were a new instruction. Part 9.2 already states it and the schema already honours it — `DepartmentType` carries behaviour, `OrgUnit` carries only the dealer's chosen name, and §4.4's *"dealers rename OrgUnits, not types"* is the same discipline. Please disregard §2.1 as an instruction and treat it as agreement.

---

## PART B — TWO CONTRADICTIONS THAT NEED RESOLVING

Both are internal to existing documents. Neither is caused by my handover. Both block work in flight.

### B.1 The AI consent gate contradicts the compliance position — **blocks Phase 2 Part C.5**

Two clauses of the Master Spec state opposite requirements:

> **§7.5 Consumption rules:** *"Consent gate: no AI operation may run on a recording without a linked consent record. The analyser refuses and logs the refusal. See Part 14."*

> **§14.3 Call recording notice:** *"This announcement satisfies the notice requirement for processing voice data, which is what allows AI analysis to run freely on every recording. **There is no per-call consent gate and no AI refusal path.**"*

§14.1 reinforces the second position: Arth *"does not gate, block or restrict calling, messaging or AI analysis"* and the product's job is *"evidence and control, not policing."*

**This matters now** because C.5 builds the credit meter with pre-flight reservation. If §7.5 stands, every reservation needs a consent lookup and a refusal path. If §14.3 stands, it does not. Building it one way and reversing later means touching the ledger.

**My recommendation: §14.3 wins, and §7.5's consent-gate sentence should be struck.**

Reasoning: the recording announcement is the notice, the dealer is the Data Fiduciary, and a per-call gate would make the AI features unusable on historical recordings — which is where the first demo value sits. §14.1's framing is correct and better than the position I took in my handover §11.

**But three things §14 does not cover, which I am asking for separately in Part C below:** withdrawal propagation, purpose tagging, and the AI-analysis notice as distinct from the recording notice.

### B.2 "Web first" versus a go-live gate that tests mobile

**§18** states plainly: *"Mobile app follows web launch. Web first."* Confirmed by the CEO — no native app this cycle.

**Part 19 (Go-Live Gate)** requires, as blocking items: *"All three telecalling models scope correctly, on web and mobile"* · *"Branch heads see their whole branch, on web and mobile"* · *"identical numbers across web, mobile and exports."*

As written, the go-live gate cannot be satisfied without a mobile app that §18 defers.

**Requested resolution, and this is a CEO decision now ratified:** the web application must be **fully responsive — desktop, tablet and mobile browser** — and the Part 19 gate items should read *"on desktop and mobile browser"* rather than *"on web and mobile."* The native app tests move to the app's own gate.

**Two engineering asks attached:**
1. Responsive layout treated as a build-time discipline in Phase 4 workspaces, not a retrofit. Near-zero cost during the build; reworking every screen later is not.
2. The API layer designed so a native client can consume it unchanged. Your Next.js route structure already tends this way; I am asking that it be an explicit constraint rather than an accident.

**Rationale, not preference:** a sales consultant is on the showroom floor, a service advisor at the reception bay, an RTO clerk at the RTO. §9.3's telecalling console is a desk product; the other six workspaces are not.

---

## PART C — WHAT IS GENUINELY MISSING

Six items. Ordered by cost of delay, not size.

### C.1 Attribution identifiers — asking to pull forward from Phase 6 to Phase 4

**Current state:** `Lead.source` is a free-text `String`. `PROJECT_HANDOFF.md` §277 and WO-03 Part E both defer structured attribution to **Phase 6**. There is no `gclid`, `fbclid`, `utm_*`, `wbraid` or `gbraid` anywhere in the repository.

**The problem is not the analysis. It is the capture.** Analysis can wait for Phase 6 — I am not asking to move it. But a click identifier that was not captured at form-submission time cannot be reconstructed afterwards. Every lead created during Phase 4 workspaces, Phase 5 engagement and the Phase 9 pilot will be permanently unattributable, and the pilot is precisely where we need to prove the claim.

**Ask:** when `Lead` is rebuilt at Phase 4 (it must be — it is PROVISIONAL), include nullable, unindexed columns for `gclid`, `gbraid`, `wbraid`, `fbclid`, `fbc`, `fbp`, and the five UTM parameters. Populate from the capture form. **No logic, no analysis, no reporting** — those stay in Phase 6.

This also pairs naturally with §14.2's `sourceType` / `sourceDetail` / `capturedEvidence`, currently scheduled for Phase 7. I would suggest those three move to Phase 4 with the same reasoning: `sourceType` is mandatory at lead creation per §14.2, so the field has to exist when leads start being created for real.

**One dated technical note for whenever Phase 6 is designed:** Google migrated offline conversion imports and enhanced conversions for leads to the **Data Manager API on 15 June 2026**, and blocked them in the Google Ads API. Developer tokens that sent no request between January and June 2026 are not allowlisted for legacy access. Any design naming the Google Ads API for conversion upload is already wrong.

### C.2 The brand layer is a catalogue, not an organisational dimension

**Current state:** `Tenant.oemBrands` is a free-text `String[]`. Phase 3 introduces `VehicleBrand` / `TenantBrand` — but those are **catalogue** entities governing which vehicles a dealer may sell. They do not give a *branch* a brand.

**What the business now requires:** Arth will operate across Maruti (Arena and Nexa), Hyundai, Kia, Tata, Honda and others, and across two-wheeler, commercial vehicle and EV segments. A single dealer group commonly holds two or three franchises.

That means a branch belongs to a brand, and the following attach to **brand**, not to tenant and not to branch:
- Schemes and price lists (Phase 3)
- OEM report formats
- Targets (Phase 5 — cascade must not sum a Maruti target and a Kia target into one number)
- Pipeline stage defaults (Phase 4 — a CV pipeline is not a two-wheeler pipeline)

**What must stay shared across brands:** Customer, Household, Employee. A Maruti customer walking into the group's Kia showroom must be recognised. That cross-sell is the single thing no competitor can do, and it is lost the moment brand becomes a tenancy boundary.

**Ask:** decide the mechanism before Phase 3 designs the catalogue. Two candidates and I do not have a strong view between them — this is your call:

- **(a)** Add `BRAND` to `OrgUnitType`, sitting between `DEALER_ROOT` and `BRANCH`. Uses the existing recursive tree, path materialisation and scope function unchanged. Costs an extra level of depth on every path.
- **(b)** Add a nullable `brandId` on `OrgUnit`, inherited down the subtree. Keeps the tree shallow; introduces a second dimension the scope function must reason about.

**Why this is the most urgent sequencing item:** Phase 3 is next after Phase 2. If the vehicle master is built assuming brand is only a catalogue attribute, and Phase 4 pipelines and Phase 5 targets are then built on a tenant-level brand list, retrofitting the organisational dimension touches Parts 10, 9 and 11 together.

**Segments are configuration, not new products.** Two-wheeler (very high volume, low ticket, short cycle, service-dominant), commercial (fleet buyers, negotiated pricing, long cycles, multiple decision-makers) and EV (no service revenue, subsidy handling, battery warranty) should be `DepartmentType`-style templates carrying different default pipelines, metric sets and point weights. §9.2's *"adding a seventh department must not touch the core"* proof should be extended to cover adding a segment.

### C.3 The booking-to-delivery chain does not exist anywhere

Not in the Master Spec, not in any phase, not in the schema. `grep -i delivery prisma/schema.prisma` returns nothing.

§9.3's Service workspace has a *"promised-delivery countdown"* — that is workshop job delivery, a different thing. Nothing tracks a **vehicle** from booking to handover.

**What actually happens between booking and delivery:** finance file → sanction → disbursement → insurance issuance → OEM allocation → dispatch → receipt → temporary registration → RTO → HSRP → accessories order → receipt → fitment → PDI → delivery slot → handover. **Twelve to fifteen dependent steps, four or five departments, an external financier, an external insurer and a government office.**

Today no system owns the chain. The delivery date is a promise made by one salesperson with nothing behind it, and it is the largest single source of customer anger in Indian auto retail.

**What I am asking for — a dependency graph, not a status field:**
- Each step carries **owner (a Position, not a user), SLA, state, blocking reason, escalation ladder**
- **The delivery date is computed from the critical path**, never typed by a person
- **Internal:** an exception queue of every booking whose critical path has slipped, sorted by promised delivery date, showing the blocking node and its owner
- **Customer-facing:** a WhatsApp-delivered tracking link in plain language
- **Management:** delivery promise accuracy — promised versus actual, by branch, by month
- Every promise made and missed permanently recorded

**Two structural notes:**

Back-office roles — RTO clerk, accessories fitter, PDI supervisor — become owners of chain steps and therefore enter the Part 11 points system on the same footing as the sales floor. §11.2's default negative list already includes *"promised service time missed −20"*; this extends the same principle to vehicle delivery. **This is where the promise actually breaks today, and it is currently invisible to every performance system we are building.**

Chain steps should be **configurable per brand and per tenant**. An EV has no RTO step difference but does have a subsidy step; a commercial vehicle adds body building. Same framework, different template — consistent with §9.2.

**Placement:** I would suggest a Phase 4 workspace in its own right (`primaryObject: Booking`) rather than a bolt-on to Sales, because its daily users are back-office staff who never open the sales pipeline. Your call on whether that fits the workspace framework or needs its own treatment.

### C.4 Two missing capability methods in Part 13

`TelephonyProvider` currently declares `placeCall`, `endCall`, `fetchRecording`, `getCallStatus`. All outbound.

**Missing: inbound.** A customer calling the showroom is currently invisible to the product. Required:
- Inbound call routing to a free executive, sales or service
- **Screen-pop — the full customer record opens before the executive speaks:** past enquiries, vehicle, last service, open complaints, insurance expiry. This is where Part 9.2's shared data core produces its most visible payoff
- Recording attached automatically to the correct Lead or JobCard
- **Missed call → automatic message within 60 seconds plus a callback task.** Roughly one in three service calls goes unanswered at a typical dealer; this is a large recoverable leak
- Campaign-specific inbound numbers, so a phone call becomes an attributable lead

Suggested additions to the interface: `receiveCall`, `getInboundNumber`, plus an inbound webhook per §13.4.

**`MessagingProvider` has no sender identity.** `sendMessage` / `sendTemplate` / `getDeliveryStatus` assume one sender per tenant. We need multiple WhatsApp numbers per tenant — a dedicated number for senior sales consultants, a shared number with a team inbox for the telecalling floor, and one each for service, insurance and campaigns.

**One hard constraint to record in the spec, because it is not obvious and it is not negotiable:** personal WhatsApp and the WhatsApp Business app cannot be legally connected to a CRM. Only the WhatsApp Business Cloud API can. **Once a number moves onto the API it stops working in the WhatsApp app on the handset.** Any adapter design assuming a hybrid is unbuildable, and any vendor claiming otherwise is doing QR-session impersonation, which gets numbers banned. Adding a `senderId` dimension to the interface now costs nothing; retrofitting it after the WhatsApp adapter ships means changing every call site.

### C.5 Complaints and cases

Absent entirely. A delivery tracking link (C.3) that gives the customer no way to raise a problem creates an expectation we cannot answer.

Minimal shape:
- A **Case** linked to Customer, Vehicle, and the originating Lead or JobCard
- Intake from any channel — message reply, inbound call, the tracking link itself, walk-in
- Owner (a Position), SLA, escalation ladder, resolution
- **Automatic linkage to the OEM satisfaction survey window**, so the dealer resolves before the OEM's SSI/CSI contact rather than after. This is worth real money to a dealer principal and no competitor offers it
- **Any call recording attached to a case is exempted from the §14.5 retention job** until the case closes plus a retention window. That recording is the evidence in a dispute, and a scheduled purge that deletes it is a serious operational failure

Small module. High trust value. Fits Phase 4 or 7.

### C.6 Withdrawal propagation and purpose tagging

Accepting §14.1's position (see B.1), three things remain genuinely uncovered:

1. **Withdrawal propagation.** A customer says stop. Today that removes them from one list. It must suppress calls, messages and — the one everyone forgets — **remove them from advertising audience uploads pushed to ad platforms**. This is not a gate on the dealer's operation; it is the dealer's instruction being executed reliably. Without it the dealer keeps contacting someone who asked them not to, which is the most common complaint pattern and the easiest to prove against them.

2. **Purpose tagging on the provenance record.** §14.2 captures *how* the lead arrived. It does not capture *what for*. A test-drive enquiry from 2024 and a service customer who consented to service reminders are different records, and the dealer should be able to distinguish them when running a campaign. **Captured and reportable, never a gate** — consistent with §14.2's own framing.

3. **AI analysis notice as distinct from recording notice.** §14.3's announcement covers recording. If transcripts are later used for coaching summaries and performance scoring — which §7.1 and Part 11 both intend — the dealer may want the announcement text to reflect that. Configurable text already exists; I am asking only that the spec note the distinction so a dealer's counsel is not surprised.

**None of these gate anything.** All three are dealer tools, in the spirit of §14.1.

---

## PART D — THE PRICING QUESTION, HONESTLY

My handover §16.1 proposed replacing per-user pricing with enquiry slabs. **Having read Part 6, I am withdrawing that as a direct instruction and replacing it with a smaller, cheaper ask.**

### Why I am softening

Master Spec §6.2 defines `Plan.pricePerUserMonth` and `minUsers`; §6.7 seeds Essential ₹599 / Growth ₹899 / Enterprise ₹1,299 with minimums of 10 / 25 / 50. WO-03 C.3 requires *"seat count enforced live."*

Three things I had not accounted for:

1. **§6.5 already supports volume-based limits** — leads, calls and messages per month — and §6.7 already seeds them at 2,000 / 10,000 / Unlimited. The model is already a hybrid, not pure per-seat.
2. **The price points land in the same band.** Growth at ₹899 × 45 users ≈ ₹40,000/month. My proposed Core was ₹35,000. This was never a pricing disagreement; it was a structural one.
3. **Minimum seats blunt the objection I raised.** A dealer on Growth cannot drop below 25 seats, so the "deactivate users in a slow month" attack is bounded.

### Where the objection still stands

**Per-seat pricing prices the delivery chain out of existence.** C.3 puts the RTO clerk, the accessories fitter and the PDI supervisor into the product as step owners. Under per-seat, each of them costs ₹899/month. The dealer will not add them, the chain will have unowned steps, and the feature will not work.

It is the same conflict for Part 11: §11.5.1 specifies leaderboards by branch and by role across the whole tenant, which is only meaningful if the whole dealership is in the system.

**The product wants everyone in. The pricing model charges for everyone in.**

### The ask — one field, not a rewrite

Rather than change the pricing, **make the pricing basis configurable**, consistent with §6.1's own governing principle that *"if a value can only be changed by a developer, it is in the wrong place."*

```
Plan
  pricingBasis     PER_USER | FLAT | VOLUME_TIER      ← new
  pricePerUserMonth, minUsers                          (existing — used when PER_USER)
  flatPriceMonth                                       ← new, used when FLAT
  volumeTiers      JSON                                ← new, used when VOLUME_TIER
```

Seed exactly as §6.7 specifies. Nothing changes commercially on day one. But we can sell a flat plan to a group that wants the whole dealership in, price a two-brand group correctly, and test a volume tier — all as `PRIVATE` plans through the admin panel, with no deploy, which is precisely what Part 6 exists to enable.

**Three attached requirements:**

1. **Brand count as a pricing dimension.** A two-brand group costs materially more to serve — separate schemes, catalogues, MIS formats and configuration — and Part 6 currently has no way to express that. It should be a `PlanLimit` at minimum, ideally a price multiplier.

2. **Metered pass-through must be supported.** The credit ledger in C.5 is exactly the right pattern; telephony minutes and messaging volume need the same treatment. **These must never be bundled into a flat price** — telephony runs ₹8,000–20,000 per showroom per month and spikes in festive season and at launches. A flat inclusion means that spike lands on our margin with no ability to reprice mid-contract. This is the most common way Indian SaaS destroys its own gross margin.

3. **Confirmation on your AI credit costing, which I checked against live rates.** §7.3 estimates ~₹0.60 per credit and asks for quarterly re-checking. Current published Indian-language ASR pricing is ₹30 per hour of audio, i.e. **₹0.50 per minute** before LLM analysis. Your ₹0.60 is sound and slightly conservative. Two additions:

   - **§7.5's two-minute floor is the right instinct and I would go further.** Default to a **sampled** strategy — full transcription of all lost enquiries above a value threshold, all escalations and complaints, all calls where the disposition is one of the known-suspect codes, plus a stratified 15–20% random sample per executive per week. This yields roughly 90% of the management value at roughly 25% of the credit burn. **100% transcription then becomes a genuine paid upgrade rather than a default cost we absorb.**
   - Your worked example in §7.6 — 1,700 calls/month/seat at five minutes consuming 8,500 credits, ~₹5,000 raw cost for one seat — is exactly right and is the strongest argument in the document for sampling as the default.

### And a related storage note

Raw call-recording storage is cheaper than it looks — roughly ₹40–130 per rooftop per month with lifecycle tiering. **Transcription costs approximately thirty times storage.** So §14.5's warning that recordings *"should not default to indefinite storage"* is correct for **risk** reasons, not cost reasons.

Suggested retention policy for §14.5, if useful:

| Asset | Retention |
|---|---|
| PII-redacted transcript | 36 months |
| Audio | 90 days — long enough for one full reprocessing cycle after a prompt or model change |
| Audio attached to a case, escalation, cancellation or disciplinary matter | 24 months, purge-locked (see C.5) |
| Purge | Event written to the audit log proving deletion |

Ninety rather than thirty days matters: when analysis prompts improve in month four, anything already purged is frozen at the earlier quality forever.

---

## PART E — WHAT I AM CONFIRMING, NOT REQUESTING

The append-only enquiry ledger in handover §2.3. **I am not introducing a new pattern — I am asking that an existing one be extended.**

The codebase already applies append-only where correctness matters, and applies it well:

- `AuditLog` — no foreign keys so rows survive the entities they reference; UPDATE and DELETE revoked at the privilege level, not merely by convention; PII redacted at write
- `PointEntry` (§11.2) — *"a correction is a reversing entry, never an edit"*
- `CreditTransaction` (§7.2) — *"balance derived and reconcilable. Never overwrite a balance"*
- `TargetProgress` (§11.3.4) — closed periods snapshotted immutably, never recalculated
- `VariantPrice` (§10.6) — quotations store the version used

`Lead` is currently the exception: a mutable row with a `LeadStage` enum, correctly marked PROVISIONAL, with the Phase 4 exit criterion being tenant-configurable stages and no stage enum.

**When you rebuild it, the same discipline should apply.** Stage transitions, assignments, call attempts, commitments and promises become events; current state becomes a projection.

Four reasons, in order of how much they cost if ignored:

1. **The product's entire claim is accountability.** In a payout dispute or a disciplinary matter, an editable row is not evidence. Your own `AuditLog` design reasons from exactly this.
2. **§11.2.1's anti-gaming requirements become queries instead of forensics.** *"Repeated LOST markings in a short window"* and *"reversal on rollback"* are natural over an event stream and awkward over a mutable row with a separate audit table.
3. **Phase 6 attribution needs replay.** Answering *"what did this booking cost"* requires the state at click time, not now.
4. **§14.4's erasure path is cleaner.** Proving what was held and that it was removed is straightforward when the history is explicit.

**I am asking for your effort assessment and any objection before Phase 4 design is locked** — not for a decision by return. If the cost is materially higher than I assume, or if you see a conflict with the metrics engine's projection model, I would rather know now.

---

## PART F — CONSOLIDATED ACTION LIST

**Blocks Phase 2, in flight now:**

| # | Item | Ref |
|---|---|---|
| 1 | Resolve §7.5 versus §14.3 — the AI consent gate contradiction. My recommendation: §14.3 wins, strike the §7.5 sentence | B.1 |
| 2 | Add `pricingBasis` to `Plan` plus flat and volume-tier fields. Seed unchanged per §6.7 | D |
| 3 | Add brand count as a plan limit or price dimension | D |
| 4 | Confirm metered pass-through for telephony and messaging follows the credit-ledger pattern | D |
| 5 | Confirm sampled transcription as the default; 100% as a paid upgrade | D |

**Blocks Phase 3, next:**

| # | Item | Ref |
|---|---|---|
| 6 | Decide the brand mechanism — `OrgUnitType.BRAND` or `OrgUnit.brandId` — before the vehicle master is designed | C.2 |
| 7 | Confirm segment templates (2W / CV / EV) are configuration, extending the §9.2 proof requirement | C.2 |

**Blocks Phase 4 design:**

| # | Item | Ref |
|---|---|---|
| 8 | Append-only enquiry record at the `Lead` rebuild — effort assessment requested | E |
| 9 | Attribution identifier columns pulled forward from Phase 6 to the Phase 4 `Lead` rebuild. Capture only, no logic | C.1 |
| 10 | `sourceType` / `sourceDetail` / `capturedEvidence` pulled forward from Phase 7 to Phase 4 | C.1 |
| 11 | Delivery chain — decide whether it is a Phase 4 workspace with `primaryObject: Booking` or needs separate treatment | C.3 |
| 12 | Responsive web as a build-time constraint on all seven workspaces | B.2 |

**Spec amendments, no immediate build impact:**

| # | Item | Ref |
|---|---|---|
| 13 | Reconcile Part 19 go-live gate wording with §18 "web first" | B.2 |
| 14 | Add `receiveCall` / `getInboundNumber` to `TelephonyProvider`; add screen-pop and missed-call recovery | C.4 |
| 15 | Add `senderId` to `MessagingProvider`; record the WhatsApp Cloud API handset constraint | C.4 |
| 16 | Add Cases to Part 9 or Part 13; add the case-recording retention exemption to §14.5 | C.5 |
| 17 | Add withdrawal propagation, purpose tagging and the AI-notice distinction to Part 14 | C.6 |
| 18 | Add the retention schedule to §14.5 if the shape is acceptable | D |
| 19 | Note the Google Data Manager API migration for whenever Phase 6 is designed | C.1 |

---

## PART G — CLOSING

The specification is stronger than the document I sent you, and in the two places where we disagreed on principle — merged performance scores, and consent as a gate — you were right and I was wrong. I have withdrawn both.

What survives is five gaps and one contradiction. **The two that will cost the most if deferred are the brand layer, because Phase 3 is next and it touches Parts 9, 10 and 11 together, and the attribution columns, because a click identifier not captured cannot be recovered and the Phase 9 pilot is where we have to prove the claim.**

Everything else can move at your judgement of sequence.

Please flag anything here you consider wrong or unworkable rather than building around it.

---

*Addendum 01 to `ARTH-PRODUCT-DECISIONS-HANDOVER`, 4 August 2026. Supersedes handover §§2.1, 13, 15, 15.4, 16.1, 18, 20 in whole or part as marked. To be filed in `docs/decisions/`.*
