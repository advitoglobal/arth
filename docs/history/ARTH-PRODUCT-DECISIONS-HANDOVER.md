# ARTH — PRODUCT DECISIONS HANDOVER

**From:** Prem Kumar, Founder — Advito Global
**To:** IT Director, Arth
**Date:** 4 August 2026
**Status:** Product decisions, settled. To be read alongside `docs/ARTH-MASTER-BUILD-SPECIFICATION.md` and `docs/decisions/WORK-ORDER-03-phase2.md`. Where this document conflicts with earlier product assumptions, this document wins. Where it conflicts with your engineering standards, raise it — do not guess.

---

## 0. HOW TO READ THIS

This is not a feature list. It is a set of decisions, most of which constrain architecture rather than describe screens.

Sections **1–5 are foundational** and affect work already in flight. Read these first; several touch Phase 2 and Phase 4 directly.

Sections **6–16** are module and commercial scope, phased.

Section **17** lists what we deliberately will not build. This is a gate, not a backlog.

Section **18** lists open items requiring your assessment before they are settled.

Marks used:
- **[DECIDED]** — settled, build to this
- **[DECIDED — AFFECTS WORK IN FLIGHT]** — settled, and it touches Phase 2 or Phase 4; needs your response this week
- **[OPEN]** — needs your engineering assessment before it is settled

---

## 1. WHAT ARTH IS

### 1.1 Positioning [DECIDED]

Arth is not a CRM. A CRM reports what happened. Arth runs the dealership's operating discipline and connects every rupee of marketing spend to every car delivered.

**Internal one-liner:**
> Arth doesn't report on your team. It runs your team. Every enquiry has an owner and a clock. Every promise is recorded. Every result is scored the same way for everyone, from the telecaller to the RTO clerk. At the end of the month nobody argues, because the system already knows.

**External positioning:**
> The enquiry accountability system for dealer groups. Every other dealer CRM tells you how many enquiries you received. Arth tells you what each one cost, where it died, and which branch is losing you money this month.

### 1.2 The two things only we can do [DECIDED]

1. **Ad-spend to booking attribution.** We are the dealer's media buyer. No software vendor is. This is a category boundary, not a feature.
2. **Cost per booking, not cost per lead.** Every competitor reports cost per lead. Dealer principals know it is a vanity number.

Every roadmap decision should be tested against: *does this strengthen one of these two, or does it make the dealer trust us enough to keep them plugged in?* If neither, it goes to the backlog.

### 1.3 The structural constraint [DECIDED]

**In India the dealer does not own their system of record — the OEM does.** Maruti has mandated a DMS since 2006. Warranty claims, allocation and OEM incentive payouts run through it.

Consequences, all non-negotiable:
- **We never build a DMS.** We never pitch replacement.
- **We do not wait for an OEM API.** We reconcile against DMS exports and capture at source.
- **Arth is a system of engagement on a system of record we do not control.** Design accordingly.

**Update since the last spec:** several large groups (Indus Motors in Kerala, Mandovi in Karnataka, others) have begun building **in-house DMS platforms**. This changes the integration picture — at those groups a real API conversation is possible with an IT head who controls both ends. It does **not** remove the OEM rail, which still runs alongside.

**Instruction:** a documented **inbound API and webhook surface** moves from a late-phase item to an early one. "We integrate with whatever you have built" is now a sales requirement. The reconciliation importer remains, because it covers every dealer without an in-house team — which is most of the market.

---

## 2. FOUNDATIONAL ARCHITECTURE RULES — NON-NEGOTIABLE

These four rules override convenience at every point in the build. Each is cheap to honour now and a rewrite to retrofit.

### 2.1 One shared core. No module gets its own copy. [DECIDED]

The model we are following is Tekion's: sales, service, parts and accounting write to the same data core, which is why their AI has full operational context and every federated competitor's does not.

**Five foundation entities, created once, shared by everything:**

| Entity | Owned by |
|---|---|
| **Customer** | Nobody. The dealership. |
| **Vehicle** | Linked to customer and household |
| **Household** | Groups people and vehicles |
| **Employee** | One record per person, all departments |
| **Organisation** | Group → brand → branch → department → team |

**The rule, verbatim, for the standing rules list:**

> Every module adds its own activity records. No module ever adds its own Customer, Vehicle or Employee. If a new module needs a field on Customer, it goes on the one Customer.

**Where this will be attacked:** when Service is added in V2, and again when Insurance is added in V3, there will be pressure to give each department its own customer table because it ships faster. **That is the moment the entire product advantage is thrown away.** Please treat any such proposal as a schema change requiring review.

### 2.2 Ownership attaches to activities, never to the customer [DECIDED]

Worked example, which is the acceptance test for this rule:

> Ramesh buys a car from Suresh (sales). A telecaller books his first service and assigns it to Ravi (service advisor). For his second service Ramesh walks in and is attended by Govind, a different advisor. Govind records that Ramesh wants to exchange and upgrade.

Correct behaviour:

| Activity | Owner |
|---|---|
| Original sales enquiry | Suresh |
| Service Visit 1 | Ravi |
| Service Visit 2 | Govind |
| Exchange/upgrade enquiry | New sales consultant, assigned |
| **Ramesh** | **Nobody. He belongs to the dealership.** |

Ravi loses nothing, because he never owned Ramesh — he owned Visit 1. Both visits sit under the same customer, in order, with full history.

**Two lines for the standing rules:**

> Ownership attaches to activities (enquiry, service visit, renewal, case), never to the customer.
>
> Any department can create a new activity on an existing customer without transferring or duplicating that customer.

**What this unlocks and must be preserved:**
- Correct incentive attribution per advisor, with no month-end argument
- Exchange enquiry carries its true source ("service customer, 2nd visit, 2-year-old vehicle") rather than "walk-in"
- Exchange valuation pre-filled from real service history
- **Lifetime value per campaign** — the Meta campaign that produced the 2024 sale gets credited with two services and an upgrade enquiry two years later. No competitor in India can compute this.

### 2.3 The enquiry record must be permanent, not editable [DECIDED — AFFECTS WORK IN FLIGHT]

**This is the single most important line in this document.**

`PROJECT_HANDOFF.md` §16b records that `LeadStage` and three models are PROVISIONAL, with the Phase 4 exit criterion being tenant-configurable stages and no stage enum.

**That rebuild is the decision point.** When enquiry stages are rebuilt in Phase 4, the enquiry must become an **append-only history of events**, not a row that gets updated.

Every action becomes an immutable event: created, assigned, call attempted, call connected, commitment made, stage advanced, test drive completed, quote issued, booking confirmed, delivery promised, delivery completed, lost. Current state is a projection. Nothing is ever silently overwritten.

**Four reasons this is not optional:**

1. **Our positioning is accountability.** An editable row cannot support that claim. In a payout or disciplinary dispute it is not evidence.
2. **Attribution requires replay.** Answering "what did this booking cost" six months later needs the state of the world at click time, not now.
3. **The data law requires provenance.** When a customer exercises their rights we must prove what we held, why, and that we deleted it.
4. **Fraud detection becomes a query instead of forensics.** Disposition gaming, follow-up-date pushing and lead hoarding are all patterns over an event log.

**Getting this right at the Phase 4 rebuild is close to free. Retrofitting it later is a rewrite.** Please confirm your assessment of effort and any objection before Phase 4 design is locked.

### 2.4 Configuration over code, always [DECIDED]

Already in your standing rules (WO-03 Part F). Restating because this document adds several places it will be tested: scheme masters, road tax by state, points weights by role, business-type templates, permission grids, escalation windows.

**The test:** adding a second brand, a second state, a second business type or a new department must be configuration and seed data. If it requires a deploy, the design is wrong.

---

## 3. THE DATA MODEL — WHAT HANGS OFF WHAT

```
ORGANISATION
  Dealer Group
    └── Brand              (Maruti Arena / Nexa / Kia / Hyundai / CV / 2W / EV)
          └── Branch       (showroom / workshop / used-car outlet)
                └── Department → Team → Employee

CUSTOMER  (one record, shared by every module)
  ├── Household → other people, other vehicles
  ├── Sales Enquiry      → owner, stage history, source, attribution IDs
  ├── Vehicle            → one record, full lifecycle
  │     ├── Service Visit / Job Card    → owner: service advisor
  │     ├── Policy / Renewal            → owner: insurance executive
  │     ├── Delivery Chain              → per-step owners
  │     └── Case / Complaint            → owner, escalation
  └── Consent Records    → purpose, channel, timestamp, source, withdrawal

EMPLOYEE  (one record, shared)
  ├── Org placement, reporting line, permissions
  ├── Attendance / availability
  ├── Activity attribution (owner of enquiries, visits, renewals, chain steps)
  └── Performance score, targets, incentives
```

**Note on HR/employee modules:** attendance, performance and incentives hang off the same Employee record as everything else. Same foundation, second family of modules. This is what makes cost-per-outcome-including-people-cost possible, which is a number no competitor offers.

---

## 4. LEAD ROUTING & CROSS-DEPARTMENT HANDOVER

### 4.1 Assignment and visibility [DECIDED]

- Unassigned leads sit in a common pool
- On assignment, the lead leaves other executives' working lists
- Team leader sees the team; branch head sees the branch; principal sees everything

**Default visibility mode: "visible, not workable."** Peers can see that a lead exists and who owns it, but cannot work it. Rationale: if assigned leads are fully hidden from peers, the rot is hidden too — and visible non-action is the accountability we are selling.

**Make the mode dealer-configurable** with three options: *locked* / *visible not workable* (default) / *open pool*.

### 4.2 Cross-department routing [DECIDED]

When a service advisor flags an upgrade or exchange interest, a **new sales enquiry** is created under the same customer, tagged with its true source.

**Routing rule, verbatim:**

> Cross-department lead routing targets the holder of the *assign* permission for the receiving department at the relevant branch, resolved from the dealer's own org tree. Escalation follows the org tree upward on timeout. Assignment right is a separate, independently grantable permission — not implied by hierarchy level.

Practically: at a large branch this is a Team Leader; at a small one it is the Sales Manager; at a single-outlet dealer the Branch Head; at some groups a dedicated BDC coordinator. **The dealer's org chart decides, not our code.**

**The prior owner is surfaced as a one-click suggestion, not auto-assigned.** Two years may have passed; they may have left, moved branch, or be overloaded.

**Timeout is mandatory.** If unactioned within a configurable window (default 2 hours), auto-assign to the next available executive. The failure mode we are guarding against is not wrong assignment — it is *no* assignment.

**Customer request always overrides** — if the customer asks for a specific person, they get them.

### 4.3 Attribution on a cross-department lead [DECIDED]

Three separate attributions tracked on the same enquiry:

| Role | Credit |
|---|---|
| Spotter (the service advisor who flagged it) | Source credit + spotter incentive |
| Closer (the sales consultant) | Sales credit |
| Historical owner (original seller) | Context only, no credit |

**The spotter incentive is not optional.** A small fixed amount per upgrade enquiry that converts. If service advisors get nothing, they stop flagging within a month and we lose the highest-converting lead source in the dealership.

---

## 5. PERMISSIONS & VISIBILITY OF MONEY

### 5.1 Two different kinds of money [DECIDED — AFFECTS WORK IN FLIGHT]

**Money 1 — what the dealer pays Advito.** Plan, invoice, credit balance, overage, AI credits. **Dealer Admin only.** Not the branch manager, not the GM. Already correctly specified in WO-03 Part C with a blocking test.

**Money 2 — the dealer's own business money.** This is *not* one switch and is not yet scoped. Default tight, dealer-configurable:

| Number | Default visibility |
|---|---|
| Cost per booking, ad spend by campaign | Principal, GM, marketing head |
| Branch P&L, opex allocation | Principal; that branch's head only |
| Salary and employee cost | Principal and HR — **never the floor** |
| Insurance / VAS margin per product | Insurance department **including the executive** — he needs it to sell the right policy |
| Discount given on a deal | Sales manager and above |
| Lead cost by source | Managers and above |

**Engineering instruction:** build "who may see which financial figure" as **one reusable rule**, applied first to Advito billing in Phase 2 and reused for dealer business figures later. If it is hardcoded as a billing special case, it gets rebuilt in Phase 5+.

The salary row is the one that causes real trouble — if cost-per-booking-including-salary is visible to a team leader, he now knows what colleagues earn.

---

## 6. MODULE SCOPE BY VERSION

Each version must be **configuration on the same foundation**, never a rewrite of the previous one.

| Version | Departments / capability |
|---|---|
| **V1** | Sales — enquiry capture, telecalling, walk-in, test drive, quotation, booking. Org tree, permissions, metrics. Attribution field capture. Consent capture. |
| **V2** | **Delivery chain**, **Service department**, **Complaints/Cases**, full attribution reporting, OEM MIS report generation |
| **V3** | **Insurance & renewals department**, extended warranty, RSA, AMC. Multi-brand layer. Scheme & price master. |
| **V4** | Used car / exchange, accessories, performance & points engine, attendance |
| **V5** | Corporate/fleet sales, advanced analytics, partner API, incentive automation |

**Note on the brand layer:** see §12. It must exist before the scheme master and before Insurance, which means it lands earlier than V3 in build order even though the customer-facing multi-brand capability ships at V3.

---

## 7. THE COMMUNICATION LAYER

Nothing exists today. This needs designing before V2 so that per-executive numbers and inbound calls plug in without redesign.

### 7.1 WhatsApp [DECIDED]

**Hard constraint, non-negotiable:** personal WhatsApp and the WhatsApp Business app **cannot** be legally connected to a CRM. Tools claiming otherwise work by impersonating the handset and get numbers banned. **We will never build on that.** A ban loses a dealer their customer conversations permanently.

**Only route: WhatsApp Business API (Cloud API) direct from Meta.**

Consequence to communicate to dealers up front: **once a number is on the API it stops working in the WhatsApp app on the handset.** The executive chats from inside Arth. That is the point — it is how the dealership stops losing the thread when an executive resigns.

**Recommendation — go direct on Cloud API, not via a BSP.** BSPs add roughly 10–30% per-message markup plus a platform fee for a UI we will not use. Keep one BSP relationship as failover only.

**Number allocation — do not give everyone a number:**

| Who | Setup |
|---|---|
| Senior sales consultants | Own dedicated number |
| Telecalling floor | One shared number, shared team inbox, conversations assigned by lead ownership |
| Service / Insurance / Campaigns | One number each, department-level |

A 45-person group needs ~8–12 numbers, not 45. Each number needs a SIM or virtual number for verification (~₹150–500/month). **Meta charges per message, not per number.** Each number carries its own quality rating, so one careless telecaller damages only their own number.

**Features to build:** instant auto-reply on new enquiry · delivery tracking updates · service and renewal reminders · payment links and document delivery · two-way inbox inside Arth · consent-checked campaign broadcasts.

**Cost discipline to engineer in:** route via click-to-WhatsApp ads where possible (72-hour free window) and prefer **utility** templates over **marketing** templates — utility is roughly 7× cheaper. A delivery status update is a utility message. This is worth lakhs at scale.

### 7.2 Inbound calls [DECIDED — NOT PREVIOUSLY SCOPED]

Currently missing entirely. Required:

- IVR routing — sales or service — to a free executive
- **Screen-pop: full customer history opens before the executive says hello** — past enquiries, vehicle, last service, open complaints, insurance expiry
- Recording attached automatically to the correct enquiry or job card
- **Missed call → automatic WhatsApp within 60 seconds + callback task.** Roughly one in three service calls goes unanswered at a typical dealer; this alone recovers meaningful revenue
- After-hours → auto-response and callback booked for the morning
- **Campaign-specific display numbers**, so a phone call becomes a trackable lead. This closes the last hole in attribution — calls are currently invisible

### 7.3 Telephony sourcing [DECIDED]

**Two options offered to the dealer:**

- **Option A (default):** dealer keeps their existing provider. We integrate. Their phone bill stays theirs.
- **Option B:** we supply it, one invoice, **at cost + 15%, metered.**

**Never bundled into a flat price.** Telephony runs ₹8,000–20,000 per showroom per month and spikes unpredictably in festive season and at launches. A flat inclusion means that spike comes out of our margin with no ability to reprice mid-contract. This is the single most common way Indian SaaS destroys its own gross margin.

**Vendor shortlist to quote at 50 / 200 / 500 seats** — Ozonetel, Exotel, MyOperator. Specify: inbound, outbound, recording, autodialer, API access, and **recording storage and retention terms**. Autodialer is a vendor dependency; we trigger it via API and never own the dialling engine.

**Watch the recording clause** — several vendors bill recording separately and cap retention. We want short retention on their side and API pull into our own storage, which costs us almost nothing.

### 7.4 SMS [DECIDED]

OTP and fallback only. DLT registration per dealer. Declining channel — do not over-invest.

---

## 8. ATTRIBUTION — THE MEDIA-TO-METAL SPINE

### 8.1 Technical chain [DECIDED — ONE ITEM URGENT]

1. **Capture click identity on every landing page and lead form** — `gclid`, `gbraid`, `wbraid` (Google), `fbclid` / `fbc` / `fbp` (Meta), plus UTMs. **Stored as first-class fields on the lead record, never a text blob.**

   **⚠ This is two fields and it costs nothing today. Without them attribution is impossible and every lead captured before they exist is permanently unattributable. Please add these in the current phase, not later.**

2. **Persist through the funnel.** The click ID must survive web form → call → walk-in → test drive → booking → delivery. Dedupe must merge on hashed phone so a walk-in re-links to its originating click.

3. **Push conversions back.**
   - **Google:** offline conversion import and enhanced conversions for leads **migrated to the Data Manager API on 15 June 2026 and are blocked in the Google Ads API.** Any spec naming the Google Ads API for this is already wrong. Build against Data Manager API.
   - **Meta:** Conversions API with `fbc`/`fbp` and hashed identifiers, uploading at booking and at delivery.

4. **Ingest spend daily** from Meta Marketing API and Google Ads reporting at campaign / adset / ad level. We are the media buyer — we already have this access.

**Second-order benefit worth stating in sales:** pushing real booking conversions back improves the platforms' bidding. We are not only measuring the spend, we are making it perform better.

### 8.2 Non-digital sources — the Source Investment Ledger [DECIDED]

Every lead source carries a cost. Some exact, some estimated. Be explicit about which.

| Source | Cost method |
|---|---|
| Meta / Google | Exact, automatic from ad account |
| Portals (CarDekho, CarWale, JustDial) | Exact — subscription ÷ leads |
| Events, exhibitions, activations | Manual entry — total cost ÷ leads captured |
| Referrals | Exact — payout per case |
| Repeat / loyalty | Near-zero acquisition; retention spend attributed |
| **Walk-ins** | See below |

**Walk-ins are an arrival method, not a source.** A large share saw a digital ad days earlier. Two recovery mechanisms, both required:
- **Phone-number matching** — merge the walk-in with the existing ad lead so the ad gets credit
- **"How did you hear about us?" as a required field with fixed options, not free text**

Genuine passing-trade walk-ins are costed against showroom rent, signage and brand spend.

**Build one screen:** the Source Investment Ledger. Digital fills itself; everything else is ten minutes of monthly entry by the marketing person. Then cost-per-booking works across all sources on the same basis — which today no dealer can do at all.

### 8.3 Two cost numbers, never merged [DECIDED]

**Number 1 — Marketing Cost per Booking.** Ad spend + portals + events ÷ bookings. Precise and unarguable. **This is our headline metric.**

**Number 2 — Total Cost per Booking.** Adds salaries, rent, opex. Directional.

**They must remain separate.** The moment rent and salaries are allocated, everyone argues about the allocation instead of the result — and that argument would destroy the credibility of Number 1, which was rock solid.

Provide a simple allocation screen: monthly opex per department, split by a dealer-chosen rule (per booking / per enquiry / per headcount). Changing the rule changes Number 2 and never touches Number 1.

**Per-department units:**
- Sales → cost per car delivered
- Service → cost per job card, and revenue per bay-hour
- Insurance/VAS → cost per renewal closed vs commission earned
- Used car → cost per unit retailed vs gross per unit

No Indian dealer currently knows what it costs to close one insurance renewal. He knows only the commission.

---

## 9. THE DELIVERY PROMISE ENGINE

Does not exist today. **This is our strongest commercially demonstrable feature and it is workflow depth, not clever technology** — which is exactly why competitors have not built it and why it is defensible for two years.

### 9.1 Model the chain as a dependency graph, not a status field [DECIDED]

```
Booking confirmed
  ├── Finance: file → sanction → disbursement    [owner: F&I]
  ├── Insurance: quote → issuance                [owner: F&I]
  ├── Allocation: OEM allocation → dispatch → receipt  [owner: Sales Admin]
  ├── Registration: temp reg → RTO → HSRP        [owner: RTO desk]
  ├── Accessories: order → receipt → fitment     [owner: Accessories]
  └── PDI → Delivery slot → Delivery ceremony    [owner: Sales]
```

Each node carries **owner, SLA, current state, blocking reason, escalation ladder.**

**The delivery date is computed from the critical path, not promised by a person.**

### 9.2 Three outputs from the same graph [DECIDED]

1. **Internal exception queue** — every booking whose critical path has slipped, sorted by delivery date, showing the blocking node and its owner. This solves the sales manager's morning.
2. **Customer-facing WhatsApp tracking link** — plain language: *"Finance approved ✅ · RTO in progress · Expected 18 Aug."* Consent is captured on this link before any data is shown.
3. **Management KPI** — delivery promise accuracy, promised vs actual, by branch, by month.

Every promise made and missed is permanently recorded, so "who told the customer the 12th?" has an answer.

**Back-office roles are inside the accountability system.** RTO clerk, accessories fitter and PDI supervisor own chain steps and are scored on them (§13). This is where the promise actually breaks today.

---

## 10. COMPLAINTS & CASES

Not previously scoped. **Required alongside the delivery tracker** — a tracking link without a complaint channel creates expectations we cannot answer.

**Build:**
- A **Case** record linked to customer, vehicle, and the enquiry or job card
- Intake from any channel — WhatsApp reply, call, the tracking page, walk-in
- Owner, deadline, escalation ladder, resolution note
- **Automatic link to the OEM satisfaction survey window**, so the dealer fixes the problem *before* the OEM's SSI/CSI call rather than after
- **Any call attached to a complaint has its recording locked from deletion** — this is the evidence in a dispute

Small module, high trust value. **V2.**

---

## 11. CONSENT & DATA PROTECTION

### 11.1 Why this exists, stated correctly [DECIDED]

The customer gave his number voluntarily — that is not in dispute. The law asks three harder questions:

1. **Consent for what purpose?** A test-drive form is consent to be contacted about buying that car. It is not automatically consent for service offers three years later or a festive broadcast.
2. **Can you prove it?** *"He walked in and gave us his number"* is not evidence. We must produce: this person, this date, this form, this purpose. **The burden of proof sits with the dealer.**
3. **What happens on withdrawal?** He replies STOP. Is he removed from SMS, calls, *and* the Meta audience file uploaded last week? Today at every dealership: no. That is the most common violation.

Plus two obligations independent of how the number was obtained: **deletion when purpose is exhausted**, and **the customer's right to see everything held on him**.

### 11.2 What we build [DECIDED]

Not a permission-asking system — a **proof and hygiene system**:

- Every contact record carries **how it arrived and what for**, auto-tagged, no extra work for the executive
- **One tick box** on the web form and the walk-in form, with purposes listed
- **Consent gate on the delivery tracking link** — captured before any status is shown *(this covers post-booking customers cleanly)*
- **STOP handled once, everywhere, automatically** — including removal from ad audience uploads
- **Retention schedules and automated purge**, with an event written to the ledger proving deletion
- Notices in English and Kannada at minimum

### 11.3 Timeline and commercial value [DECIDED]

| Date | Obligation |
|---|---|
| 13 Nov 2025 | Rules notified; Board operational; penalty framework active |
| **13–14 Nov 2026** | Consent Manager registration framework in force |
| **13 May 2027** | Full substantive compliance. Penalties to **₹250 crore** |

**Every dealer in India is currently non-compliant and does not know it.** When their auditor or OEM raises it in 2027 they will ask their CRM vendor whether the system handles it. AUTOSherpa's and Groweon's readiness is unknown; LeadSquared already advertises theirs, which is part of why they win large groups.

**This is a sales weapon disguised as a compliance feature.** Roughly three weeks of engineering if built into the foundation, a rewrite if bolted on.

### 11.4 Advito staff access to dealer data [DECIDED]

Our own support staff opening dealer customer data is regulated processing. See §16.2 for the controls.

---

## 12. MULTI-BRAND & MULTI-SEGMENT

### 12.1 Decision [DECIDED — AFFECTS BUILD ORDER]

Arth will operate across **Maruti (Arena and Nexa), Hyundai, Kia, Tata, Honda and others**, and across **two-wheeler, commercial vehicle and EV** segments.

**A Brand layer sits between dealer group and branch:**

```
Dealer Group
  ├── Maruti Arena  → own schemes, models, MIS format, targets
  ├── Kia           → own schemes, models, MIS format, targets
  └── Commercial    → own schemes, different sales cycle entirely
```

**Attaches to Brand:** schemes, price lists, model masters, OEM report formats, targets, pipeline stage defaults.

**Stays shared across brands:** **Customer, Household, Employee.** This is the point — a Maruti customer walking into the Kia showroom must be recognised. That cross-sell is something no competitor can do.

### 12.2 Segments are configurable templates, not separate products [DECIDED]

| Segment | Differences to configure |
|---|---|
| Two-wheeler | Very high volume, low ticket, short cycle, finance-heavy, service is the business |
| Commercial | Fleet buyers, negotiated pricing, long cycles, body building, multiple decision-makers |
| EV | No service revenue, subsidy handling, charging objections, battery warranty |

Different default pipeline stages, metrics and scoring weights. **Configuration, not code.**

### 12.3 Build-order instruction [DECIDED — URGENT]

**The brand layer must exist before the scheme master and before the Insurance and Service departments are built**, because all three attach to it. If the scheme master is built assuming a single brand, it gets rebuilt.

**This is the most important sequencing item in this document.**

---

## 13. SCHEME & PRICE MASTER

### 13.1 Scope [DECIDED]

- **Upload option** for offers, schemes and discounts, by Manager or Dealer Admin — role configurable
- **Agent-driven monthly refresh** of price lists, new model names, discontinued models, on-road price and tax calculation. Frequency configurable.
- **Road tax as a configurable table per state and vehicle category**, never a formula in code — we will operate across states, and rates change with state budgets

### 13.2 Effective dates — mandatory [DECIDED]

**Every scheme and price carries a validity period, not just a current value.**

A customer books on 28 July at July pricing and takes delivery on 5 August. Without dates, the August upload overwrites July and the deal shows the wrong figure. With dates, **every booking permanently carries the price and scheme live at the moment it was made** — which is also what makes discount leakage measurable.

Cheap now. Impossible later, because history not stored cannot be recovered.

---

## 14. DEMO & TEST-DRIVE FLEET — LIGHT VERSION ONLY

**Justification:** test drive is a scored, points-earning event (§15). If the system cannot verify a test drive happened, it is self-reported — and self-reported events get inflated. That is the only reason this module exists.

**Build:**
- Demo car list — model, variant, registration number
- Test drive booking selects a car and a time slot
- Prevents double-booking the same car at the same hour
- **Auto-flags insurance and fitness expiry** — a demo car on lapsed insurance is a serious liability, and this alone earns dealer goodwill

**Do not build:** kilometre logs, damage records, fuel tracking, condition reports. That is fleet management and no dealer will maintain it.

Approximately one week of work. **V2.**

---

## 15. PERFORMANCE, POINTS & DISCIPLINE

### 15.1 Intent [DECIDED]

One generic framework for every employee, configured per role. Telecaller, sales consultant, service advisor, insurance executive, RTO clerk — **same engine, different targets and weights.** Not four separate performance systems.

The aim: the software drives genuine, disciplined, performance-oriented working. That is achievable *only* if the rules below are honoured — every points system in sales gets gamed within about six weeks if they are not.

### 15.2 Scoring structure [DECIDED]

| Layer | Content |
|---|---|
| Activity | Connected calls, walk-ins attended, test drives, job cards |
| Quality | TAT met, commitments kept, disposition accuracy |
| Outcome | Bookings, deliveries, renewals closed, revenue |
| Score | Weighted combination, per role, **weights set by the dealer** |

### 15.3 Earning and losing points [DECIDED]

**Positive points only on successful, system-observed action.**

- A call that does not connect = **neutral**, not positive
- A connected call earns only **above a duration floor (default 20–30 seconds, configurable)** — otherwise two-second connects become the new gaming
- Action after the call earns points **only if system-observed** — a test drive booked with a date and slot counts; a follow-up date pushed forward does not. Pushing the date is the most common fake action on any Indian telecalling floor.

**Negative points for duty and SLA failures:**

| Role | Penalised for |
|---|---|
| Telecaller | TAT breach, lead untouched beyond window, disposition contradicted by the call recording, repeated postponement of the same lead |
| Sales consultant | Test drive not followed up, quotation not issued after commitment, cancellation caused by his delivery-date slip |
| Service advisor | PSF not done, promised delivery time missed, complaint raised on his job card |
| Insurance executive | Policy lapsed without contact attempts, quote not sent within TAT |
| RTO / back office | Delivery chain step overdue past SLA |

**Guards on negatives — all required:**
- **Capped per period.** Unlimited downside makes people hide leads rather than work them.
- **Waivable by the team leader with a recorded reason.** Waivers are visible and counted against the leader.
- **Availability-aware.** No penalty during approved leave, outside branch working hours, or for a lead assigned at 9pm. **This is why the attendance module matters — the points engine needs to know who was actually working.**

### 15.4 Visibility of scores [DECIDED]

| Do | Not | Why |
|---|---|---|
| Individual sees own score **live during the day** | Score revealed at month end | A number learned on the 3rd changes nothing |
| **Team** rankings public | **Individual** rankings public | Public individual ranks cause lead hoarding, poaching, refusal to help colleagues |
| Manager sees individual ranks | Everyone sees everyone | The manager needs it; the floor does not |
| **Manager's own SLA performance measured too** | Only the floor measured | If only juniors are scored it is a stick, and sticks get gamed |

### 15.5 Keeping the system alive [DECIDED]

Every performance module in every CRM dies the same way — the owner stops acting on it. Two countermeasures, both required:

1. **Manager accountability layer** — escalations actioned within SLA, penalties waived and for whom, leads left unassigned. Measured up to the dealer principal.
2. **Weekly review artefact** — a one-page output the principal uses in his Monday meeting: top and bottom performers, biggest SLA failures by department, points waived, leads lost with rupee value. **If the software produces the meeting agenda, the meeting happens, and the system stays alive.**

3. **Incentives calculated automatically from the score.** Removing the month-end argument is the real value.
4. **Score triggers a coaching task, not just a rank.** Scoring without coaching leaves low performers low, and then they leave.

### 15.6 Adoption warning [DECIDED]

This positioning sells to the owner and threatens the middle management doing the daily data entry. **Build so that a team leader's life is easier on day one** — fewer WhatsApp groups, no morning reconstruction of yesterday, automatic incentive calculation — or the discipline layer never gets used long enough to work.

---

## 16. THE COMMERCIAL LAYER & ADVITO PANELS

### 16.1 Pricing model [DECIDED — AFFECTS WORK IN FLIGHT]

**Platform fee per brand + shared enquiry slab. Unlimited users. Unlimited rooftops. Unlimited departments.**

| Tier | Platform fee/month | Additional brand | Enquiries included (group-wide) | Overage |
|---|---|---|---|---|
| **Core** | ₹35,000 | +₹18,000 | 3,000 | ₹9/enquiry |
| **Growth** | ₹75,000 | +₹35,000 | 8,000 | ₹8/enquiry |
| **Scale** | ₹1,40,000 | +₹60,000 | 20,000 | ₹6/enquiry |
| **Enterprise** | Negotiated | Negotiated | 20,000+ | ₹4–5/enquiry |

**Why not per user:** our cost is driven by enquiries and messages, not headcount. Per-user pricing lets a dealer cut our revenue 35% in a slow month while our costs stay flat — and it actively fights our own product, because the dealer then refuses to add the RTO clerk and accessories fitter to the delivery chain, which is where our best feature lives.

**Why not per rooftop:** gameable. One showroom, forty people.

**Why enquiry slabs work:** unlimited users is a genuine sales advantage against per-user competitors; enquiry volume is what actually drives our cost; the dealer's bill grows only as his business grows, which he accepts; and he cannot fake having fewer enquiries without starving his own funnel.

**Slab set on a rolling 3-month average**, not a single month, so festive season does not bounce a dealer into a higher tier for one month. Reviewed quarterly, upgrade automatic, downgrade on request.

**Add-ons priced separately:**

| Add-on | Price |
|---|---|
| Renewal & Insurance module | ₹15,000/month |
| 100% call transcription (default is sampled) | ₹12,000/month |
| Telephony, if we supply it | at cost + 15%, metered |
| WhatsApp above allowance | at cost + 15% |
| Onboarding + data migration | ₹1,50,000–3,00,000 one-time per group |

**Three engineering requirements this places on Phase 2:**

1. **The billing unit is the enquiry slab, with brand count as a multiplier. Not the user seat.** Please confirm the commercial layer is being built to this.
2. **Metered pass-through must be supported** — telephony and WhatsApp overage tracked above an allowance and billed at cost + margin.
3. **AI credits: "1 credit = 1 minute of audio" is already correct in WO-03.** Default must be **sampled** transcription (~20% stratified + all lost, escalated and suspicious-disposition calls); 100% is the paid upgrade. Sampling gets ~90% of the management value at ~25% of the cost.

### 16.2 Advito-side panels [DECIDED]

**Three roles, three separate surfaces. The support panel is not the master panel with fewer buttons.**

| Role | Can | Cannot |
|---|---|---|
| **Advito Master** (Founder/CEO) | Everything — plans, slabs, overage rates, add-on prices, dealer-specific negotiated rates, coupons with approval gate above threshold, version pinning and grandfathering, preview-before-publish, **margin per dealer live**, staff access control | — |
| **Advito Support** | Open a dealer account, view setup and data, reset users, fix configuration, log tickets, extend credits within a cap | **See any pricing, plan, invoice or margin** |
| **Advito Tech** | Health, errors, performance, logs, diagnostics, replay failed jobs | See customer personal data in the clear; see pricing |

**Master panel requirements — all prices are data, never code.** WO-03 already states *"everything commercial = seed data, zero deploys to change"* — this confirms it. Changing a price must never require a developer or a deployment.

**Add to the master panel, not currently in WO-03:** **cost-to-serve versus revenue per dealer, live.** Without it we are blind on which dealers are profitable.

**Price changes must be logged** — who changed what, when. Not for distrust, but because staff will eventually hold backend access.

**Support access controls — required, and this is a legal exposure not a nicety:**

- Entry by **impersonation only**, never a shared login. Every action recorded as *"Support user X acting as dealer Y."* (Impersonation already exists in the control-plane layer — this adds the role split and controls on top.)
- **Time-limited** — session expires in an hour
- **Reason required** — ticket number before entry
- **The dealer sees a log of every Advito access to their account.** This is a trust feature, not just a control
- **Phone numbers and personal data masked by default**, unmasked only on second approval — most support work needs the workflow, not the contact details
- **Destructive actions blocked entirely for support** — no deletion, no plan changes, no bulk edits

**Additional support surface:** a **dealer health view requiring no data access at all** — enquiry volume trend, error rate, last login by role, adoption percentage, open tickets. Most support questions resolve here without anyone opening customer records. Faster and safer.

---

## 17. WHAT WE DO NOT BUILD — THIS IS A GATE

| Not building | Reason |
|---|---|
| **A DMS** | OEM-mandated. Cannot be displaced. Pitching replacement gets us thrown out |
| **Accounting / GL** | Zero differentiation, infinite compliance surface, unwinnable against Tally and the DMS |
| **Payroll** | PF, ESI, state-wise professional tax, TDS, Form 16, changing statutory filings. A compliance product wearing a software costume — get it wrong and employees do not get paid. **Integrate with greytHR / Keka / Zoho Payroll instead and pull the salary figure in for cost calculation. Never own the statutory risk** |
| **Spare parts inventory** | Not software, inventory. Stock levels, reorder points, OEM catalogues changing monthly, GST per part number — and the DMS already does it because the OEM requires it. **Read from it, never write** |
| **Body shop estimation** | Every job runs through an insurance surveyor. A dozen insurer claim systems, each different. It is a company, not a module |
| **Telematics / connected vehicle** | Hardware, SIMs, field installation, support for physical objects. Almost no Indian dealer will pay for it in 2026 |
| **Our own telephony carrier** | Licensing, DoT compliance, capex. Partner, always |
| **Our own speech-to-text model** | Sarvam charges ₹30/hour on Indian languages. Unbeatable at any scale we will reach |
| **Feature parity with Salesforce** | Bankrupts the roadmap |
| **Competing on price with Zoho** | ₹800 will always be cheaper. Compete on outcome per rupee |
| **Generic AI chatbot** | Commodity. Ours must be bounded and outcome-tied or not shipped |
| **Standalone insurance product** | **Not now.** Insurance is a full department inside Arth (§18.1). Standalone can be considered later |

**Common thread:** each is somebody else's product with a big team behind it, and none makes our core promise stronger. Every month spent there is a month not spent on the only thing we can do.

---

## 18. DEPARTMENTS AS DEPARTMENTS, NOT MODULES

### 18.1 Insurance [DECIDED]

**Decision: no standalone insurance product. Insurance is a complete department inside Arth**, such that the insurance executive can run his entire week without opening anything else.

**Required:**
- Own renewal pipeline, own targets, own daily list — **not** enquiries mixed into the sales floor
- Policy record on every vehicle: insurer, premium, expiry, IDV, NCB, claim history
- Expiry engine with a 60/30/15/7/1-day cadence
- Quote comparison across the dealer's tie-ups
- **Margin per policy visible to the executive** — different insurers pay differently and the floor should know
- Payment link and policy PDF delivered on WhatsApp, stored against the vehicle
- **Lapse detection via vehicle-record lookup** (~₹3 per check) — finds customers who renewed elsewhere, for win-back
- Own performance view — closed, lapsed, pending, commission earned

**Same structure reused for extended warranty, RSA and AMC.** Build once as a `Renewal` object on the vehicle; four revenue streams run through one machine.

**Why this beats the competitor approach:** AUTOSherpa sells insurance renewal as a separate product, which means a second login and data that does not sit next to sales and service. Ours does — so when a customer walks in for service, the advisor sees the policy expiring in three weeks, because it is the same vehicle record.

**Sales line:** *"Everyone else sells you insurance renewal as an add-on. We give you an insurance department."*

### 18.2 Service [DECIDED]

Same treatment. Bay capacity model, job cards, technician allocation, PSF, **revenue per bay-hour** as the headline metric (not appointment count), predictive service-due on kilometres and behaviour rather than the calendar, parts pre-check at booking (read-only against DMS).

### 18.3 The critical clarification [DECIDED]

**"Department, not module" is a permissions and workspace decision, not a data decision.**

Insurance and Service get their own workspaces, targets and reports. **They still read and write the same Customer, Vehicle and Household.** Separate rooms, shared foundation.

This is stated explicitly because "give insurance its own department" is easily misread as "give insurance its own tables" — which would destroy §2.1.

---

## 19. MOBILE & PLATFORM

**[DECIDED]** No native mobile app in this cycle. Web application only, to reach a complete, demoable product faster.

**Two conditions, both cheap now and expensive later:**

1. **The web application must be fully responsive — desktop, tablet and mobile browser.** Same screens, laid out to be usable on a 6-inch screen. This is layout discipline during the build, near-zero cost; retrofitting means reworking every screen.
2. **Design the API layer as if a native app will consume it.** When the app is eventually built it plugs into what exists rather than requiring a rebuild.

Rationale: a sales consultant is on the showroom floor, a service advisor at the reception bay, an RTO clerk at the RTO. If Arth is desktop-only in practice, adoption dies and the discipline layer dies with it.

---

## 20. INTEGRATIONS — WHAT WE OFFER

### 20.1 Included, no dealer decision

| Integration | Purpose | Our cost |
|---|---|---|
| Meta Ads | Lead ingestion + conversion push-back | Free |
| Google Ads (Data Manager API) | Same | Free |
| WhatsApp Cloud API | All customer messaging | Per message |
| Vehicle records (VAHAN) | Auto-fill, lapse detection | ~₹3/lookup |
| Email + SMS | Notifications, OTP | Paise per message |
| Speech-to-text (Sarvam) | Searchable calls | ₹30/hour audio |
| AI analysis | Call QA, summaries, daily brief | ~₹1/call |
| Dealer's DMS | Daily reconciliation import | Free — our code |

### 20.2 Dealer chooses — his or ours

| Integration | His | Ours |
|---|---|---|
| Telephony | Keeps existing provider, we integrate | We supply, cost + 15%, metered |
| E-signature | His vendor | ~₹15–25/signature |
| Payments | His gateway | ~2% per transaction |
| Used-car valuation | Manual | We connect a valuation service |

### 20.3 Optional, priced separately

Lead portals (CarDekho / CarWale / JustDial) — setup fee per portal · Insurance company links — part of Renewal module · Financier links — Enterprise only · Accounting export (Tally / Zoho) — small setup fee.

### 20.4 Unit economics for pricing sanity

**Per 1,000 enquiries/month our marginal cost is roughly ₹9,100–13,700 — about ₹3–4 per enquiry.** Against ₹9 overage, every enquiry above allowance is roughly 60% margin. This is why the slab model aligns price with cost.

**Fixed annually, regardless of volume:** certifications, security testing and legal ₹10–20 lakh · engineering tooling ₹3–6 lakh · support scaling at roughly ₹40–80k per dealer group per year.

**Storage note:** raw call-recording storage is negligible (~₹40–130 per rooftop/month with lifecycle tiering). **Transcription costs roughly 30× storage.** Recording everything is cheap; understanding everything is not — hence sampling as the default.

---

## 21. RETENTION & DELETION POLICY

**[DECIDED]** Transcript-first architecture. Justified on searchability, AI leverage and legal exposure — **not** on cost, which moves the other way.

| Asset | Retention |
|---|---|
| PII-redacted transcript | 36 months |
| Audio | **90 days** (not 30 — allows one full reprocessing cycle after a model or prompt improvement) |
| Audio flagged for escrow — complaint, escalation, cancellation, disciplinary | **24 months, purge-locked** |
| Hard purge | Event written to the ledger proving deletion |

**Additional requirements:**
- **Redact PII at ingestion** — names, phone numbers, addresses, occasionally card or loan details spoken aloud. Store the redacted version as the working copy. Without this, transcript-first changes the file format on the same liability.
- **Store paralinguistic signals at transcription time** — talk ratio, silence, overtalk, speaker turns. Cheap then, unrecoverable later.

---

## 22. WHAT WE ADOPT FROM COMPETITORS

| Source | Adopt | Our improvement |
|---|---|---|
| AUTOSherpa | Productive vs non-productive telecaller scorecard | Tied to bookings and lead cost, not just call quality. *"Ravi made 62 productive calls, producing 4 test drives and 1 booking, on leads that cost ₹9,200 each"* |
| AUTOSherpa | Recognising insurance renewal as real revenue | All four renewal types in one pipeline, margin visible, lapse detection |
| CDK / Reynolds | **Their mistake.** ~$760M in antitrust settlements over charging dealers to access their own data; a 2024 outage affecting ~15,000 dealerships | **Free data export, contractual data ownership, published uptime and recovery commitment.** Costs nothing, removes the biggest objection in every deal, and incumbents cannot match it without admitting their model |
| CDK | Publishing dealer research | Our own anonymised annual Karnataka dealer benchmark report — makes us the people who define the benchmarks |
| Tekion | Open partner API as a competitive weapon | Publish the API **and** our pass-through rates. Radical transparency on metered components, in a market where competitors publish no pricing at all |
| Everyone | Real-time dashboards | **Deliberately not adopted as the lead.** Replaced by the decision list — twelve things needing action today, each with a rupee value and an owner. Build the dashboard eventually because procurement asks for it; never lead with it |

**The pattern: we are not out-featuring anyone. We are taking things they proved dealers want and connecting each one to money.**

---

## 23. CONFIDENTIALITY

**[DECIDED]** **No client name appears anywhere** — not in the software, not in marketing, no logos, no named case studies. Dealers are competitive with one another.

Use anonymised proof: *"a 5-rooftop Maruti group in Bengaluru reduced unattended leads by X%."*

**Internal pilot definition (internal documents only, never external):**

> 8 weeks, one dealer group. Success = 80%+ of enquiries entered in Arth rather than only in the OEM DMS · first-response TAT under 30 minutes on 90% of leads · delivery chain tracked on 100% of bookings · dealer principal opens the weekly review page in 6 of 8 weeks.

---

## 24. OPEN ITEMS REQUIRING YOUR ASSESSMENT

| # | Item | Recommendation |
|---|---|---|
| 1 | **Duplicate-detection rules.** "Match on phone number" is not a specification. Family sharing one number; corporates buying five cars; same person, two numbers | Write the rule explicitly. Cheap now |
| 2 | **Working hours, shifts, holidays per branch.** TAT and negative points are meaningless without it | Required before the points engine goes live |
| 3 | **Notification design.** What reaches whom, on which channel. Get this wrong and everyone mutes it, killing escalation | V1 design item |
| 4 | **Data migration from the dealer's existing CRM.** Five years of history in AUTOSherpa or Excel. Priced but not designed | Before first customer |
| 5 | **Support model.** Who answers at 8pm on a Saturday in festive season? What SLA do we commit to? | Before first customer |
| 6 | **Contract and exit terms.** Notice period, data export on exit, WhatsApp number ownership when a dealer leaves. Our "your data is yours" promise needs contractual language | Before first contract |
| 7 | **Trademark "Arth."** Common Sanskrit word, likely contested in software classes | Check before the brand goes on a showroom wall |
| 8 | **OEM MIS report formats.** Dealers submit fixed-format reports monthly. If Arth generates them we become indispensable — but we need the actual formats | V2, needs dealer-supplied samples |

---

## 25. IMMEDIATE ACTIONS — THIS WEEK

Ordered by cost of delay.

1. **Confirm the commercial layer is being built to enquiry-slab pricing with brand-count multiplier**, unlimited users, metered pass-through for telephony and WhatsApp overage, and sampled transcription as the default. *(§16.1 — Phase 2 is in flight)*

2. **Add the attribution identity fields to the lead record now** — `gclid`, `gbraid`, `wbraid`, `fbclid`, `fbc`, `fbp`, UTMs. Two fields' worth of work. Every lead captured before they exist is permanently unattributable. *(§8.1)*

3. **Confirm the brand layer will be built before the scheme master and before Service and Insurance.** This is the most important sequencing decision in the document. *(§12.3)*

4. **Confirm the Phase 4 enquiry-stage rebuild will produce an append-only event history**, not an editable row. Please give your effort assessment and any objection. *(§2.3)*

5. **Confirm responsive web (desktop / tablet / mobile browser) is in scope from the start**, with the API layer designed for a future native app. *(§19)*

6. **Add the "who may see which financial figure" rule as one reusable mechanism**, applied first to Advito billing in Phase 2 and reused for dealer business figures later. *(§5.1)*

7. **Add the three-role Advito panel split** — Master / Support / Tech — with impersonation controls, PII masking, time limits and a dealer-visible access log. *(§16.2)*

8. **Add cost-to-serve versus revenue per dealer** to the Advito Master panel. Not currently in WO-03. *(§16.2)*

---

## 26. THE ONE-PARAGRAPH SUMMARY

Arth wins as the only system in India that connects the money leaving the dealer's bank account to the car leaving his showroom, because we are the only vendor who sees both sides. Everything we build either strengthens that connection or makes the dealer trust us enough to keep it plugged in. Three things make the connection real: an append-only enquiry ledger, a reconciliation strategy that needs no OEM permission, and a delivery promise engine the customer can feel. Three things make it durable: consent compliance shipped before the deadline, one shared customer-vehicle-employee core that every department writes to, and a pricing model that meters what actually drives our cost. One thing makes it stick: a performance system that scores everyone — including managers — on what the system observed rather than what anyone typed. Everything else on the roadmap is negotiable.

---

*Prepared for the IT Director, Arth · Advito Global · 4 August 2026*
