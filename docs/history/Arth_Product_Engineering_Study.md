# ARTH — PRODUCT ENGINEERING STUDY, GAP ANALYSIS & BUILD PLAN

**From:** Product Engineering Director, Arth
**To:** Prem Kumar, Founder — Advito Global
**Re:** Response to the Branding & Marketing competitive teardown (4 Aug 2026)
**Date:** 4 August 2026
**Status:** Internal working document. Section 9 cost figures are a mix of published rates and modelled estimates — marked accordingly.

---

## 0. HOW TO READ THIS

I have kept the marketing teardown's confidence notation so the two documents stack:

| Mark | Meaning |
|---|---|
| **[V]** | Verified from primary/vendor source or official documentation |
| **[R]** | Reported by third party — directionally right, not gospel |
| **[A]** | My assessment as engineering lead — argue with it |
| **[?]** | Unverified. Do not put in a deck or a budget without confirming |

Marketing's document answered *who we are fighting*. This one answers *what we must build, in what order, and what it will cost to run*. Development cost is excluded per your instruction. Everything here is **run-rate**: licences, per-transaction fees, compliance, and maintenance.

**Where I agree with Marketing:**
- Call analysis is not the moat. Correct.
- Attribution is the only defensible position. Correct, and I will show you architecturally *why* it is defensible.
- Groweon is not a serious technical competitor. Correct.
- Salesforce Automotive Cloud's household model is worth copying. Correct and cheap.

**Where I disagree with Marketing:**
1. **"No DMS / OEM portal integration — Critical — Non-negotiable for Maruti dealers."** This framing will cost us a year. You are not going to get an API key from Maruti Suzuki. Neither did AUTOSherpa in the way people assume — their own material says leads arrive "via API **or manual upload**." The correct engineering answer is not integration. It is **reconciliation**. Section 7.2.
2. **"Keep call analysis as table stakes."** Half right. Drop it as a *speech-analytics* product — we lose that fight. Rebuild it as **conversation-to-money compliance**, which TransMon structurally cannot do because they do not own the pipeline or the spend. Section 7.6.
3. **AUTOSherpa's divided focus is our biggest tactical advantage.** It isn't. Our biggest tactical advantage is that **we are the only vendor in this market who sees the invoice from Meta and the delivery challan from the dealer in the same database.** Everything else is a feature race we can lose.
4. **The teardown treats the market as CRM-shaped.** It isn't. In India the dealer's system of record is OEM-owned and non-negotiable. That single fact should determine our entire architecture. Section 2.

---

# PART I — THE MARKET, PROPERLY MAPPED

## 1. THE FIVE LAYERS

The mistake in almost every "Top 10 Automobile CRM in India" listicle — and, respectfully, in parts of the marketing teardown — is treating this as one market. It is five stacked layers with different buyers, different budgets and different switching costs.

| Layer | What it does | Who chooses it | Who pays | Switching cost |
|---|---|---|---|---|
| **L1 — OEM system** | Enquiry, allocation, dispatch, warranty, claims, SSI/CSI. The manufacturer's rail | The OEM. Mandated | OEM / dealer levy | Impossible |
| **L2 — DMS** | Inventory, accounting, workshop, parts, GL, invoicing | Dealer principal + OEM influence | Dealer | Brutal (3–5 yr contracts) |
| **L3 — CRM / engagement** | Enquiry follow-up, telecalling, service booking, retention | Dealer principal / GM | Dealer | Moderate |
| **L4 — Point solutions** | Telephony, WhatsApp, merchandising, valuation, DMS-adjacent analytics | Department head | Dealer | Low |
| **L5 — Media & agency** | Ad spend, creative, portals, lead generation | Dealer principal / marketing head | Dealer | Low |

**Arth's spec sits in L3 and reaches into L5. That reach is the whole business.** No competitor in the world occupies both. CDK, Reynolds, Tekion, Excellon and AUTOSherpa are all L2/L3 vendors who are structurally forbidden from touching L5 — they are not media buyers and never will be. That is why "ad-spend to booking attribution" is not a feature; it is a *category boundary* we can cross and they cannot.

---

## 2. THE STRUCTURAL FACT NOBODY WROTE DOWN

**In India, the dealer does not own their system of record. The OEM does.**

Maruti Suzuki introduced a mandated Dealer Management System across its network in 2006 [V — Rajesh Uppal, then CIO MSIL, on record]. Suzuki globally operates SDMS with the explicit objectives of *standardising the dealer system, integrating it between Suzuki and dealers, and maximising accurate reporting* [V]. Every major OEM in India runs an equivalent rail: enquiry capture, booking, allocation, dispatch, warranty, SSI/CSI surveys.

**The consequences for Arth are total:**

1. **We can never be the DMS.** Even if we build one, a Maruti dealer cannot switch off the OEM system. Their allocation, warranty claims and OEM incentive payouts run through it. Any pitch that implies replacement is dead on arrival.
2. **We will not get an API.** OEM systems are closed, and the OEM has no commercial interest in letting a third party read the network's enquiry data. Waiting for one is not a strategy.
3. **Therefore Arth must be a system of *engagement* sitting on a system of *record* it does not control.** This is a well-understood architecture pattern and it is actually the easier problem — but only if you design for it from the start instead of bolting it on.
4. **The dealer already lives with double entry.** Every Indian dealer executive today enters the same enquiry twice — once in the OEM DMS because they must, once in whatever CRM the dealer principal bought. **Whoever kills the second entry wins the account.** Not with an API. With capture-at-source. Section 7.2.

This single insight reframes the "Critical gap" in the marketing teardown from a two-year blocker into a 90-day engineering problem.

---

## 3. THE GLOBAL INCUMBENTS — WHAT THEY TEACH US

We are not competing with these. We are learning from their scar tissue.

### 3.1 CDK Global

**What it is.** The US DMS incumbent, 50+ years old, now the "Dealership Xperience Platform" sold as six modular suites — Foundations (enterprise/multi-store), Fundamentals (single-point/independent), Vehicle Inventory, plus CRM, F&I and Fixed Ops layers [V, vendor]. SOC 2 compliant. R&D spend reported at $150–200M annually, contracts typically 3–5 years [R].

**What went wrong, and why it matters to us:**

- **The data-access tax.** Dealers on public record describe being quoted **$2,000 per location setup plus $175/month per location** simply to expose their *own* data to a third-party CRM via API [R, DealerRefresh forum]. For a four-rooftop group that is $8,000 upfront and $700/month to read data they generated. Dealers on that thread call it an "extortion racket."
- **The antitrust reckoning.** CDK and Reynolds faced allegations of conspiring to inflate DMS and data-integration prices. Reynolds settled for **$29.5M in 2019**; CDK settled a dealership class action for **$100M in August 2024** and a separate vendor data-access case for **$630M in January 2025** — roughly **$760M combined**, with no admission of wrongdoing [R, VendorMotive Apr 2026].
- **The outage.** The June 2024 cyberattack shut down operations across roughly **15,000 dealerships for three weeks** [R]. Capterra reviewers describe significant revenue loss and note that migration difficulty is precisely what keeps them locked in.

**Engineering lessons for Arth:**

| Lesson | Design decision |
|---|---|
| Data lock-in is the incumbent's moat and their liability | **Ship a free, documented, rate-limited export API from v1.** Contractually guarantee the dealer owns their data. This is worth more in a sales meeting than any feature. |
| Single-tenant outages are existential | Multi-tenant with per-tenant blast-radius isolation, tested restore, published RTO/RPO |
| "Rip and replace" is the fear that kills deals | Arth must run *alongside* the OEM DMS from day one and prove value without touching it |

### 3.2 Reynolds & Reynolds

The other half of the US duopoly. Notoriously closed — historically the most aggressive on restricting third-party access to dealer data, which is what put them in the same litigation as CDK. Philosophically the opposite of open. **Relevance to us: none commercially, high strategically.** Reynolds is the cautionary tale that "closed" is a business model until a regulator prices it.

### 3.3 Tekion — the one to actually study

**What it is.** Automotive Retail Cloud (ARC) — DMS, CRM, service lane, parts, F&I, accounting, payments, payroll and analytics on a single cloud-native platform. Their explicit pitch: *"Traditional DMS platforms were built decades ago on on-premise architecture with features bolted on over time. ARC was built AI-native from day one on a single cloud platform — every module shares one data core, one login, and one intelligent system. No integrations, no duplicate data, no disconnected workflows."* [V, tekion.com]

They also run **Automotive Partner Cloud (APC)** — a partner API programme explicitly positioned on *data ownership, security and responsible AI*, with self-serve API discovery and testing tooling [V]. That is a direct commercial attack on the CDK data-access tax. It works.

**Engineering lessons for Arth — these are the important ones:**

1. **"One data core" is the actual product.** Tekion's advantage is not AI. It is that sales, service, parts and accounting write to the same schema, so the AI has full operational context. Every India competitor — including AUTOSherpa with its module-per-department heritage — has federated data. **If Arth's twelve-stage pipeline, service workspace, used-car workspace and attribution ledger do not share one canonical customer/vehicle/enquiry model, we will end up rebuilding it in year two.** This is the single most expensive mistake available to us.
2. **Open partner APIs are a wedge, not a risk.** Tekion turned "we let others integrate" into a differentiator against a duopoly that charged for it. We should copy this posture wholesale, because in India the incumbents are quietly just as closed.
3. **AI as agents, not features.** Tekion's 2026 direction is agentic — T1, Accounting AI, CRM AI, Service AI. The market's expectation of what "AI in a dealer CRM" means has already moved past lead scoring. Our roadmap must reflect that.

### 3.4 Keyloop, Cox Automotive (Dealertrack/VinSolutions/Xtime), DriveCentric, Matador

Contextual, not competitive. Two data points worth carrying:

- **Fragmentation is the universal complaint.** Most dealerships run **3–7 systems that don't talk to each other, with 15% running more than 10**; **40% of dealership employees cite duplicate leads in the CRM as a top pain point**; 33% of sales managers, 36% of F&I managers and 28% of BDC managers say poor system integration damages both workflow and customer experience [R, CDK 2025 study via AutoAlert].
- **Bolt-on AI doesn't fix a broken CRM.** Reviewers of Matador — 1,000+ dealerships, deep integrations with Elead, VinSolutions, DealerSocket, Reynolds, CDK, Dealertrack — note bluntly: *"Matador bolts onto your existing CRM. If your CRM is the problem, Matador doesn't solve it."* [R] That is the sentence we should be able to say about ourselves in reverse.

---

## 4. THE INDIA LANDSCAPE — FULL MAP

Marketing covered AUTOSherpa, Groweon and Salesforce. Here is the rest of the board.

### 4.1 Excellon Software — the one Marketing missed

The most consequential India-specific omission from the teardown.

- Nagpur-headquartered, **25+ years**, cloud-native "Excellon 5" DMS unifying CRM, sales, purchase, inventory, service, warranty, financials and distribution networks [V, vendor].
- **Frost & Sullivan 2020 Indian Company of the Year** for automotive DMS, described as *the largest Indian provider of SaaS software to manage a dealership or service network* [V].
- Claims handling **~900,000+ transactions/day** and presence in **80+ countries** [V, vendor].
- Also a **GST Suvidha Provider (GSP)** — they do e-invoicing and e-way bills [V]. That is a moat we should not attack.

**Assessment [A]:** Excellon sells *to the OEM*, not to the dealer. Their buyer is a manufacturer standardising a network. That is a different sales motion, a different sales cycle and a different price point — and it means they are not in our deals today. But they are the most credible India-built platform in the market, and if an OEM ever mandates a CRM layer, Excellon is the likeliest recipient. **This is the answer to Item 5 in the marketing teardown's unknowns list, and it should worry us more than AUTOSherpa does.**

### 4.2 LeadSquared — the competitor Marketing under-weighted

- Bengaluru-based. Automotive CRM published at **₹1,250/user/month entry** [V, vendor].
- Reference customer described as a *"global automotive leader with 6,000+ dealerships in India"* managing **10 lakh+ enquiries** [V]. Also Cars24, Bikes24, DSR Leasing.
- **ISO 27001:2022 certified, DPDP-ready, audited by CERT-In empanelled auditors, AES-256 encryption, RBAC, audit trails** [V, vendor].
- Third-party assessment: strong at scale — automation, geo-fencing for field teams, campaign attribution — but *"pricing is significantly higher than most India-focused dealership CRMs, making it better suited to larger dealer group operations than single-outlet dealerships"* [R].

**Assessment [A]:** This is the competitor that beats us in a large dealer-group RFP, not AUTOSherpa. They have the compliance stack, the scale references, and — critically — **campaign attribution**, which the marketing teardown assumed was uniquely ours. Their attribution is generic marketing-automation attribution, not media-spend-to-booking, and they are not the dealer's media buyer. But in a procurement checklist, "campaign attribution: yes" beats a nuanced explanation. **We must be able to draw the distinction in one sentence on a slide.**

### 4.3 The rest of the India board

| Vendor | Position | Threat level [A] |
|---|---|---|
| **AUTOSherpa (WyzMindz)** | Incumbent. 730+ dealers, OEM-native, regional-language WhatsApp, insurance renewal, per-user billing with 30-day notice [V/R] | **High.** The fight |
| **Excellon** | OEM-sold DMS, GSP, 80+ countries | **Medium-high, latent.** Dangerous if an OEM mandates |
| **LeadSquared** | Horizontal CRM, deep automotive vertical, ₹1,250/user/mo, ISO+DPDP | **High in large groups** |
| **Groweon** | Horizontal SMB CRM with an automotive landing page. ~4 connectors, no DMS/IVR/portal [R] | **Low.** Beat on depth |
| **TeleCRM** | WhatsApp-heavy telecalling CRM, very cheap | **Low but noisy** at single-rooftop |
| **Spyne (Gurugram)** | AI merchandising + RetailAI + ConnectAI. 1,500+ dealerships across 47 countries, Toyota/BMW/Cars24 [R] | **Medium.** Used-car and visual merchandising. Will collide with our Used Cars workspace |
| **Salesforce Automotive Cloud** | ₹28k–60k/user/mo, $25k+ implementation | **None.** Data-model textbook |
| **Legacy on-prem (AutoBooom/Star Technologies, Iterate AutoControl)** | Windows-based DMS, 1,500+ dealer installs across Maruti/Hyundai/Tata/Honda [R] | **None directly — but they are the incumbent data source we must reconcile against at many dealers** |
| **Zoho / Kylas** | Price floor. Zoho ~₹800/user | **Pricing pressure only.** Never compete here |

### 4.4 The pricing corridor, restated with engineering implications

The India automotive CRM corridor runs **₹800 – ₹5,000 per user per month**. Salesforce sits an order of magnitude above and is irrelevant.

**The engineering point Marketing didn't make:** our *costs* are not per-user. They are per-message, per-minute, per-transcription-hour and per-API-call — that is, per **enquiry volume**, not per headcount. A dealer who adds twenty festive-season telecallers barely increases our infrastructure cost, but a dealer who doubles enquiry volume doubles our WhatsApp, telephony and STT bill.

**Therefore per-user pricing is not just commercially wrong for the dealer — it is misaligned with our own cost structure.** Flat-per-rooftop with metered communications pass-through is the only model that survives. Section 10.

---

# PART II — THE DEALER, FROM SCRATCH

You asked me to understand the dealer's pain from lead generation through telecalling to delivery, and separately the management's pain. I have walked the funnel stage by stage. Each stage: what actually happens, what breaks, and whether anyone solves it today.

## 5. THE OPERATOR FUNNEL — NINE STAGES

### Stage 0 — Media & spend

**What happens.** Dealer principal approves a monthly budget. Some goes to the agency (us), some to OEM co-op programmes, some to portals — CarDekho, CarWale, JustDial, sometimes Cars24/Spinny for exchange. Creative goes out. Money leaves the account.

**What breaks.**
- Spend is reconciled against *leads*, not *bookings*. Cost per lead is the industry's vanity metric and every dealer principal privately knows it.
- Portal leads and Meta leads arrive in different places with different quality and are never compared on the same basis.
- Nobody can answer "which creative produced a delivered car" — not because it is technically hard, but because the click ID is thrown away at the form.

**Who solves it today.** Nobody in this market. Salesforce can via Marketing Cloud at extra cost. LeadSquared partially. **This is the opening.**

---

### Stage 1 — Lead capture

**What happens.** Enquiries arrive from: Meta lead forms, Google search/PMax, the dealer website, OEM website handoffs, portals, inbound calls, missed calls, WhatsApp, walk-ins, referrals, exchange enquiries, and — the forgotten one — *the executive's personal phone*.

**What breaks.**
- **Duplicates.** The same customer enquires on Meta, then calls, then walks in. Three records. **40% of dealership staff globally cite duplicate leads as a top CRM pain point** [R, CDK 2025].
- **Missed calls are the largest silent leak.** *"1 in 3 service calls still go unanswered at the average dealer"* [R]. A missed call is a lost booking with no record that it ever existed.
- **After-hours.** *"The larger portion of buyer enquiries occurs after working hours. In the absence of coverage, such leads become dead"* [R].
- **Personal-phone capture.** The executive gives the customer their own number. That enquiry now exists only on WhatsApp on a phone the dealer does not own. When the executive resigns, so does the pipeline.
- **Double entry.** OEM DMS *and* CRM. Executives resent it, so one of them gets filled with garbage — usually ours.

**Who solves it.** AUTOSherpa does multi-source capture and IVR well. Nobody solves personal-phone leakage. Nobody solves double entry.

---

### Stage 2 — Allocation & speed-to-lead

**What happens.** Lead is assigned to a CRE or sales executive by round-robin, model, branch, or manager judgement.

**What breaks.**
- **Response time.** Industry benchmarking shows AI-assisted dealers respond in ~2 minutes where typical human teams take 2 hours or more [R]. In India, the gap is wider — Meta leads at 10pm get called at 11am.
- **Unowned leads.** *"When multiple salespeople assume someone else is handling a lead, no one actually does"* [R]. Ownership without a timestamp is not ownership.
- **Cherry-picking.** Executives claim high-intent leads and let the rest rot. Round-robin without an integrity layer just distributes the rot evenly.
- **The variance is staggering.** Analysis of 8 million sales opportunities found **close rates ranging from 7% to 41% for walk-ins at the same dealership** — process gaps, not product or price, drive the variance [R, Foureyes].

**Who solves it.** Everyone claims intelligent distribution. Almost nobody measures the *consequence* of distribution against revenue.

---

### Stage 3 — Telecalling — the machine that actually runs Indian auto retail

This stage is where India differs most from the US market that CDK/Tekion were built for, and it is where AUTOSherpa's BPO heritage genuinely earns its position.

**What happens.** A telecalling floor of 5–40 CREs works a daily dialling list: fresh leads, follow-ups due, cold revivals, service due, insurance renewal, PSF (post-service follow-up), missed-call callbacks. Each call ends in a disposition code and a next-action date.

**What breaks — and this is a long list because it is the least-solved stage:**

- **Disposition fraud.** "Not interested," "wrong number," "ringing no response" are the three great lies of Indian telecalling. A CRE facing 80 dials a day will dispose of hard calls to hit a count. Without call-recording-to-disposition validation, the CRM's data is fiction.
- **Follow-up dates get pushed forever.** A lead is never lost; it is perpetually "call tomorrow." Pipelines look healthy and are dead.
- **No TAT enforcement.** First-call TAT, callback TAT, escalation TAT — mostly unmeasured. When measured, measured weekly in Excel, which means never acted on.
- **Talk time vs. productive time.** AUTOSherpa's productive-vs-non-productive telecaller scorecard is a real product feature and it exists for a real reason. Dials are not conversations.
- **No conversation quality signal.** Did the CRE mention the offer? Quote the correct price? Attempt a test-drive close? Handle the finance objection? Today: a manager listens to four calls a week out of eight thousand.
- **Language.** In Karnataka the customer speaks Kannada, the CRM is in English, the script is in Hindi, and the recording is transcribed by nothing.
- **The telecaller is measured on activity; the dealership is paid on delivery.** Nobody connects the two.

**Who solves it.** AUTOSherpa via TransMon speech analytics — genuinely their home ground, and Marketing is right that we should not attack it head-on. Everyone else: essentially nobody.

---

### Stage 4 — Walk-in, test drive, evaluation

**What happens.** Customer visits. Sales consultant does need analysis, demo, test drive, exchange evaluation, quotation.

**What breaks.**
- **Walk-ins are the worst-captured, highest-intent lead source.** Often a paper register. A walk-in that came from a Meta ad is recorded as "walk-in" and the attribution chain snaps permanently.
- **Test drive is the highest-signal event in the funnel and is barely instrumented** — no geo-verification, no duration, no vehicle-condition log, no automatic post-TD follow-up.
- **Exchange evaluation is done by feel** and undervalues systematically, which kills deals the dealer never learns about.
- **Time on lot destroys satisfaction.** *"Every additional hour a buyer spends on the lot costs roughly 13 NPS points. Deals closed in under an hour average NPS +54; deals taking over four hours drop to NPS −3"* [R, 2026 friction-points research].

---

### Stage 5 — Quotation, finance, insurance, accessories (F&I)

**What happens.** Price quote, discount approval, finance file to 2–5 financiers, insurance quote, accessory package, exchange offer.

**What breaks.**
- **Discount leakage.** Approvals happen on WhatsApp and phone calls. The dealership discovers its actual per-unit discount at month end.
- **Finance file ping-pong.** Documents collected on WhatsApp, forwarded to a financier's executive, status unknown for days. The customer chases the sales exec, who chases the financier.
- **F&I is now load-bearing.** FADA's own 2026 F&I Summit framed F&I income as *"no longer just the icing"* but *"a load-bearing wall of dealership viability,"* and urged dealers to adopt monthly reconciliation of all payouts and commissions [V, FADA F&I Summit 2026 coverage]. Dealers also flagged the need for smoother reconciliation processes.
- **Insurance and accessory margins are invisible at the deal level** until accounts closes the month.

**Who solves it.** Almost nobody at the CRM layer. **This is the highest-margin unclaimed territory in the funnel.**

---

### Stage 6 — Booking → delivery: the black hole

If I could build only one thing beyond attribution, it would be this.

**What happens between a booking and a delivery:** advance payment → model/variant/colour confirmation → allocation from OEM → finance sanction → finance disbursement → insurance issuance → invoice → temporary registration/RTO/HSRP → accessory fitment → PDI → delivery slot booking → delivery ceremony.

**Twelve to fifteen dependent steps, four or five departments, an external financier, an external insurer and a government office.**

**What breaks.**
- **Nobody owns the chain.** Sales says it's with RTO. RTO desk says finance hasn't disbursed. Finance says documents are pending. The customer calls the sales exec, who has moved on to next month's target.
- **The delivery date is a promise made by one person with no system behind it.** This is the single largest source of customer anger in Indian auto retail and it is entirely a workflow problem.
- **The customer has zero visibility.** They can track a ₹400 food order in real time and cannot find out where their ₹12,00,000 car is.
- **Cancellations at this stage are catastrophic** — the dealer has already paid interest on floor-plan finance and burned a delivery slot.

**Who solves it.** *Nobody.* Not AUTOSherpa, not Groweon, not LeadSquared, not Excellon at the dealer-experience layer. The OEM DMS tracks the *transaction*; nothing tracks the *promise*.

---

### Stage 7 — Delivery and immediate post-delivery

**What breaks.**
- **Service appointment is not booked at delivery.** Globally: **80% of new-vehicle buyers say they'd return for service, but only 30% have an appointment scheduled at delivery — a 50-point gap** [R, 2026 fixed-ops research]. India is worse.
- **OEM SSI/CSI surveys arrive before the dealer knows there is a problem.** By the time the score lands, the money is gone.
- **The document handover is chaotic** — RC, insurance, invoice, warranty booklet, service booklet, accessory bills — and generates support calls for months.

---

### Stage 8 — Service, retention and the renewal stack

**This is where the money actually is, and it is the most under-built part of every Indian dealer CRM.**

**The economics, plainly:**
- Indian dealers earn roughly **4–5% margin on vehicle cost and 15–20% on spare parts** [R]; FADA has argued publicly for years that 4–5% is unsustainably low [R].
- *"Dealerships generally don't make money selling cars… The profit is in the workshop"* — and per a senior industry figure quoted mid-2026, *"right now, some dealers' profit is almost 50-50 from new cars and the workshop"* [V, Forbes India, Jul 2026].
- Global benchmark: service and parts are ~10–15% of revenue but **~50% of gross profit**, with some dealerships at up to 65% of total profit [R].
- Retention compounds: customers who return for service are **30 percentage points more likely to repurchase**, and **88% say service experience affects their next purchase** [R].

**What breaks.**
- **Service-due prediction is calendar-based, not usage-based.** Everyone sends a 6-month reminder. Nobody segments by kilometres, model, past behaviour or geography.
- **Bay capacity is invisible.** Appointments get booked into a workshop that is already full on Saturday and empty on Tuesday. AUTOSherpa's workshop load optimisation exists precisely because this is real money.
- **The renewal stack is fragmented.** Insurance renewal, extended warranty, RSA, AMC, VAS — four different reminder systems, four different owners, no single pipeline, no margin visibility. AUTOSherpa sells insurance renewal as a standalone product because it is that valuable.
- **PSF (post-service follow-up) is a compliance ritual**, not a retention tool.
- **Defection is invisible.** Globally, **the average dealership defection rate hit 20% in 2025 and 74% of dealers aren't confident they can tell when a lead has defected** [R, Urban Science 2025].
- **EVs are coming for the workshop.** In Europe at 28% EV share, dealers report service revenue declines of up to a third [R]. India is early, but the direction is set — which makes *renewal and VAS revenue* structurally more important every year, not less.

---

## 6. THE MANAGEMENT PAIN MAP

You asked for this separately, and rightly. Managers are not users of the same product; they are users of a different product that happens to share a database.

### 6.1 Dealer Principal / Owner

| Question they actually ask | Can any system answer it today? |
|---|---|
| Which branch is losing me money this month, and why? | Partially — revenue yes, cause no |
| What did a booking cost me in marketing spend? | **No. Nobody.** |
| Am I being cheated — on discounts, on ad spend, on parts, on payouts? | **No** |
| If my best sales manager resigns tomorrow, what do I lose? | **No** |
| Are my telecallers actually working? | Partially (AUTOSherpa) |
| Is my workshop full on the right days? | Partially |

**The real pain:** the dealer principal is drowning in dashboards and starving for decisions. Every vendor ships "real-time dashboards." Nobody ships *"here are the eleven things that need your decision today, each with a rupee value attached."*

### 6.2 General Manager / Branch Head

- Manages by walking the floor and by WhatsApp groups. The CRM is a reporting obligation, not a tool.
- Has no way to compare his branch's *process* to another branch's — only outcomes. So every review meeting is an argument about market conditions.
- Cannot see the enquiry-to-booking funnel by *source × model × executive* without asking someone to build an Excel.

### 6.3 Sales Manager

- Spends the first two hours of every day reconstructing what happened yesterday.
- Reviews the pipeline by shouting across a floor.
- Discovers a lost deal at the review meeting, three weeks after the customer bought elsewhere.
- Has no exception queue — everything is equally urgent, so nothing is.

### 6.4 CRE / Telecalling Manager

- Manages 5–40 people on activity metrics (dials, talk time) with no line of sight to money.
- Listens to a statistically meaningless sample of calls.
- Cannot prove to the dealer principal that the floor is productive, so the floor is the first thing cut in a bad quarter.

### 6.5 Service Manager

- Load-balancing by intuition. Saturdays overflow, Tuesdays idle.
- Technician productivity and bay yield tracked, if at all, in a whiteboard and a spreadsheet.
- Parts availability discovered when the car is already on the lift.
- PSF calls made by someone who cannot see the job card.

### 6.6 Finance / Accounts

- Reconciles OEM payouts, financier payouts, insurance commissions and scheme claims manually. FADA is explicitly telling dealers to adopt **monthly reconciliation of all payouts and commissions** as a survival habit [V].
- Discovers discount leakage after the month closes.
- Cannot tie a marketing invoice to any revenue outcome.

### 6.7 HR / Operations

- Executive attrition in Indian auto retail is high, and every exit takes an unrecorded book of relationships with it.
- Onboarding a new executive means handing them a login and hoping.
- No handover protocol that transfers *context*, only records.

**Summary of the management gap [A]:** every competitor builds for *visibility*. The unmet need is *accountability* — a system that says who was responsible, what they committed to, what happened, and what it cost. That is a different data model, not a different dashboard.

---

# PART III — WHAT WE BUILD

## 7. THE TWELVE ADDITIONS THAT MAKE ARTH STRONG

I have ordered these by defensibility, not by ease. P0 items are non-negotiable for a credible v1. P1 items are what make us win competitive deals. P2 items are the moat.

---

### 7.1 [P0] The Enquiry Ledger — event-sourced, immutable, append-only

**This is the foundation, and it is an architecture decision, not a feature.**

Every enquiry in Arth is an append-only stream of immutable events: `enquiry.created`, `enquiry.assigned`, `call.attempted`, `call.connected`, `commitment.made`, `stage.advanced`, `testdrive.completed`, `quote.issued`, `booking.confirmed`, `delivery.promised`, `delivery.completed`, `enquiry.lost`. Current state is a projection. Nothing is ever silently edited.

**Why this and not a normal CRM table:**

1. **Accountability requires history that cannot be rewritten.** Our positioning is "the enquiry accountability system." An editable row cannot support that claim. An event stream can, and it is legally defensible in a payout dispute.
2. **Attribution requires replay.** To answer "what did this booking cost" six months later, you need the state of the world at click time, not now.
3. **DPDP requires provenance.** When a customer withdraws consent, you must prove what you had, why, and that you deleted it. Section 7.5.
4. **It makes fraud detection trivial.** Disposition gaming, follow-up date pushing, lead hoarding — all become pattern queries over an event log instead of forensic Excel work.
5. **It is cheap now and impossible later.** Retrofitting event sourcing onto a CRUD CRM is a rewrite. This is the decision that kills or saves us in year two.

**Non-negotiable:** one canonical model for Customer, Household, Vehicle, Enquiry, Deal, Job Card, Renewal — shared across every workspace. Tekion's entire advantage is that these share a data core. Ours must too.

---

### 7.2 [P0] DMS Reconciliation, not DMS Integration — kills the "critical gap"

Marketing lists "No DMS / OEM portal integration — Critical." I am reframing it.

**We will not get an OEM API. We do not need one.** Here is the ladder, cheapest first:

| Tier | Mechanism | Effort | Coverage |
|---|---|---|---|
| **T1 — Reconciliation import** | The dealer already downloads daily enquiry/booking/job-card extracts from the OEM DMS. Ingest them: watched folder, email-to-ingest, or a 90-second upload. Fuzzy-match on phone + chassis + name. Produce a **daily variance report**: what's in the DMS and not in Arth, and vice versa. | Days | ~90% of the value |
| **T2 — Capture at source (browser extension)** | A signed extension that reads the DMS screen the executive already fills and mirrors it into Arth. **Kills double entry — the single biggest adoption blocker in Indian dealer CRM.** | Weeks | Adoption unlock |
| **T3 — Portal ingestion** | CarDekho / CarWale / JustDial partner feeds where available; email-parser fallback where not. Portals *want* dealer integrations — this is far more gettable than an OEM API. | Weeks | Real |
| **T4 — RPA / headless agent** | Scheduled scripted extraction where nothing else exists. Fragile. Last resort. | Ongoing | Patchy |
| **T5 — Official OEM API** | If it ever comes. Design for it; do not wait for it. | — | — |

**The commercial line this unlocks:** *"Arth works with your existing OEM DMS from day one. We do not ask the manufacturer for permission, and we do not ask you to enter anything twice."*

**And the killer artefact:** the **variance report**. On day one at a new dealer we can show the principal *"you have 312 enquiries in your OEM DMS that never got a single follow-up call, worth an estimated ₹X in lost bookings."* That is not a feature. That is a signed contract.

---

### 7.3 [P0] The Media-to-Metal Attribution Spine

The only defensible position we have. It must be engineered properly, not approximated.

**The chain, end to end:**

1. **Capture identity at the ad click.** `gclid`, `gbraid`, `wbraid` (Google), `fbclid` / `fbc` / `fbp` (Meta), plus UTMs, on every landing page and lead form. Store on the lead record as first-class fields, never as a text blob.
2. **Persist through the funnel.** The click ID must survive from web form → CRE call → walk-in → test drive → booking → delivery. This is where every other system breaks: the walk-in re-entry snaps the chain. Our dedupe must merge on hashed phone/email so a walk-in re-links to its originating click.
3. **Push conversions back.**
   - **Google:** offline conversion import + enhanced conversions for leads. **Critical build note [V]:** *"Starting June 15, 2026, offline conversions import and enhanced conversions for leads uploads will be migrated to the Data Manager API and blocked in the Google Ads API"* (Google Ads Help). **That date has already passed. Build against the Data Manager API. Any spec written before mid-2026 that names the Google Ads API for this is already wrong.**
   - **Meta:** Conversions API with `fbc`/`fbp`, hashed phone/email, and offline event sets uploaded at booking and at delivery.
4. **Ingest spend.** Meta Marketing API and Google Ads API reporting endpoints, daily, at campaign/adset/ad granularity. We are the media buyer — we already have the access nobody else does.
5. **Compute the metrics nobody else can:**
   - **Cost per booking** and **cost per delivery**, by campaign / ad set / creative / model / variant / branch / executive
   - **Contribution margin per campaign** (booking value × dealer margin − spend)
   - **Blended CAC by source**, with portal and OEM co-op spend included
   - **Lead-source decay curves** — how long a source's leads take to convert, so budget isn't cut on a source with a 45-day cycle

**Why this is defensible and not copyable [A]:** steps 4 and 5 require *being the media buyer*. AUTOSherpa, Groweon and Excellon have no relationship with the dealer's ad account. LeadSquared can technically read ad platforms but has no reason to be trusted with spend, and cannot close the loop on media strategy. **Being the agency is the moat. The software is the delivery mechanism.**

**And the second-order benefit that matters commercially:** pushing real booking conversions back into Meta and Google *improves the algorithms' bidding*. We are not just measuring the spend, we are making it perform better. That is a demonstrable ROI number in a renewal conversation, and it makes Arth's price a rounding error against the media budget it improves.

---

### 7.4 [P0] The Delivery Promise Engine

The largest unaddressed pain in Indian auto retail. Nobody builds it. It is not technically hard. It is a customer-visible miracle.

**Model the booking-to-delivery chain as a dependency graph, not a status field:**

```
Booking confirmed
  ├── Finance: file → sanction → disbursement        [owner: F&I, SLA: 5d]
  ├── Insurance: quote → issuance                     [owner: F&I, SLA: 2d]
  ├── Allocation: OEM allocation → dispatch → receipt  [owner: Sales Admin]
  ├── Registration: temp reg → RTO → HSRP             [owner: RTO desk, SLA: 7d]
  ├── Accessories: order → receipt → fitment          [owner: Accessories]
  └── PDI → Delivery slot → Delivery ceremony         [owner: Sales]
```

Each node: **owner, SLA, current state, blocking reason, escalation ladder.** The delivery date is *computed from the critical path*, not promised by a person.

**Ship three things off this graph:**

1. **Internal:** an exception queue — every booking whose critical path has slipped, sorted by delivery date, with the blocking node and its owner. This is the sales manager's morning, solved.
2. **Customer-facing:** a WhatsApp-native tracking link. "Your Grand Vitara: finance approved ✅, RTO in progress, expected delivery 18 Aug." Reduces inbound status calls dramatically and is the single most demo-able thing we will own.
3. **Management:** delivery-promise accuracy as a branch KPI. Promised vs. actual, by branch, by month.

**[A] This is the feature that gets us referrals.** Attribution wins the dealer principal. The delivery tracker wins the customer, and the customer tells the dealer principal.

---

### 7.5 [P0] The DPDP Consent & Retention Ledger — ship before November 2026

This is now a hard, dated regulatory requirement and it is a **weapon**, not a cost.

**The timeline [V, DPDP Rules 2025 notified 13 Nov 2025 via G.S.R. 846(E)]:**

| Date | What happens |
|---|---|
| 13 Nov 2025 | Rules notified. Data Protection Board established. Penalty framework active |
| **13–14 Nov 2026** | **Rule 4 — Consent Manager registration framework comes into force** |
| **13 May 2027** | **Full substantive compliance.** Notice, consent, security safeguards, breach reporting, data principal rights, retention/erasure, children's data |
| Penalties | Up to **₹250 crore per violation**. No indicated grace period beyond May 2027 |

Commentary is consistent that 2026 is the "build and test" year and 2027 is enforcement [R, multiple].

**What Arth must ship:**
- **Purpose-bound consent capture** at every touchpoint — web form, IVR, WhatsApp opt-in, walk-in tablet, telecall verbal consent with recording reference
- **Per-channel, per-purpose granularity.** Consent to be called about a service due ≠ consent to be marketed a new model
- **Withdrawal propagation.** One withdrawal must suppress WhatsApp, SMS, calls and ad audience uploads within minutes — including removing the record from custom audiences pushed to Meta
- **Retention schedules and automated erasure** when purpose is fulfilled
- **Notices in English and Indian scheduled languages** (Kannada first for us)
- **Breach detection and notification runbook** with role assignment and timelines
- **Consent Manager interoperability** — architect the API surface now; the framework opens Nov 2026
- **Processor obligations flow-down** — every one of our sub-processors (BSP, telephony, STT, cloud) needs a DPA

**Why this is a weapon [A]:** the marketing teardown lists AUTOSherpa's DPDP posture as **[?]** — unknown. Groweon's as **[?]**. LeadSquared already claims DPDP-readiness and CERT-In audits, which is exactly why they win large-group RFPs. **If we are the only India automotive CRM that can hand a dealer group's legal counsel a consent architecture document before May 2027, we win procurement on a checkbox that costs the incumbents a rewrite.**

Ship the consent ledger inside the enquiry ledger. Same event stream. Same immutability guarantee.

---

### 7.6 [P1] Conversation Compliance — call analysis, repositioned

Marketing is right that we lose a head-to-head speech-analytics comparison against a fifteen-year-old BFSI-grade engine. So do not have that comparison.

**Reframe from "speech analytics" to "did the executive do the things that make money, and what did it cost when they didn't."**

| TransMon / AUTOSherpa does | Arth does |
|---|---|
| Sentiment, keyword spotting, QA scoring | **Commitment extraction** — "I'll call you Tuesday", "I'll check and revert", "delivery by the 15th" → creates a tracked obligation in the ledger |
| Agent quality scores | **Disposition validation** — transcript says the customer asked for a test drive; disposition says "not interested." Flag it |
| Call monitoring | **Script/offer compliance tied to revenue** — did they mention the running offer, quote the correct price, attempt the finance close? On enquiries where they did vs. didn't, what was the conversion delta in rupees? |
| Compliance for BFSI regulators | **Consent capture on call** — verbal consent recorded, timestamped, tied to DPDP purpose |

**Cost control [A]:** do not transcribe 100% of calls at launch. Transcribe (a) all lost enquiries above a deal-value threshold, (b) all escalations and complaints, (c) a stratified 15–20% random sample per executive per week, (d) all calls where the disposition is one of the three suspicious codes. This gets ~90% of the management value at ~25% of the STT bill. Section 9.3.

**Use Indic-first models.** Sarvam's Saaras handles code-mixed Hinglish/Kannada natively and prices in rupees. Western ASR on a Kannada-English Bengaluru telecall is not fit for purpose.

---

### 7.7 [P1] The Renewal & VAS Revenue Engine

The highest-ROI thing we can build for the dealer's P&L, given that the workshop is ~50% of dealer profit and EVs are coming for it.

**One pipeline, not four.** Insurance renewal, extended warranty, RSA, AMC and paint/ceramic VAS all become a single `Renewal` object on the vehicle, with:
- **Due-date engine** driven by RC/policy data, not a spreadsheet
- **Margin visibility per renewal** — what the dealer earns on each product, so the floor sells the right one
- **Multi-touch cadence** across WhatsApp/SMS/call, with a compliance-safe opt-out
- **Quote comparison** across insurers where the dealer has multiple tie-ups
- **Lapse detection** — RC/VAHAN lookup surfaces policies that lapsed elsewhere, i.e. customers who defected and can be won back

**Why this matters strategically [A]:** AUTOSherpa sells insurance renewal as a *standalone product*. If we bundle a better version into the platform, we don't just close a gap — we compress their revenue.

---

### 7.8 [P1] The Executive Integrity & Continuity Layer

Deeply unglamorous. Every dealer principal has been burned by this.

- **Per-executive WhatsApp numbers** (already in your spec — keep it, it is a genuine differentiator). The dealership owns the number and the thread. When the executive leaves, the conversation history stays.
- **Resignation handover protocol** — a structured transfer of open enquiries with context, commitments, and a customer-facing "your new point of contact" message. Not a bulk reassign.
- **Pipeline-hoarding detection** — executives sitting on leads they aren't working, detectable as a pattern over the event log
- **Personal-number leakage detection** — customer replies arriving on a channel we don't control, inferable from call/message gaps
- **Escalation ladders** with real teeth: unattended → team lead → branch manager → dealer principal, with the money value attached at each rung

---

### 7.9 [P1] The Exception Cockpit — not another dashboard

Every competitor ships real-time dashboards. Dashboards are where information goes to be admired.

**Ship a decision queue.** The dealer principal opens Arth at 9am and sees, at most, fifteen cards:

> **₹4.2L at risk** — 7 bookings past promised delivery. Blocking: RTO desk (5), finance disbursement (2). → *Assign / Escalate*
>
> **₹1.8L wasted** — "Creative C3 — Festive Offer" has spent ₹38,000 and produced 0 bookings in 21 days, against a portfolio average of 1 booking per ₹9,400. → *Pause / Review*
>
> **11 enquiries, 0 contact** — Whitefield branch, all assigned to R. Kumar, all >48h old. → *Reassign / Call R. Kumar*
>
> **Service Saturday overbooked by 14 jobs; Tuesday at 41% capacity.** → *Rebalance*

Each card: a number in rupees, a cause, an owner, an action. Silence when nothing is wrong.

**[A] This is the demo moment that closes dealer principals**, because every one of them has been shown a dashboard by four vendors and none by someone who told them what to do about it.

---

### 7.10 [P1] Household & Vehicle Relationship Graph

Agree entirely with Marketing. Implement the concept, not Salesforce's complexity.

`Household` → many `People` → many `Vehicles`, with roles: registered owner, primary driver, service decision-maker, payer, influencer.

**Why it matters more in India than the US [A]:** the car is a household purchase; the registered owner is frequently not the person who books the service; the person who chooses the workshop is often the spouse or the son. A service reminder sent to the wrong household member is a wasted ₹0.88 and a missed job card. It also unlocks the second-car and upgrade conversation, which is where a dealer's most profitable enquiries come from.

Cheap to build. Impossible for AUTOSherpa or Groweon to retrofit without a data-model change. Excellent demo.

---

### 7.11 [P1] Service Bay Yield & Capacity

Service is where dealer profit lives. Do not ship "appointment scheduling" — everyone has that.

- **Bay/technician capacity model** with skill-based routing (running repair vs. periodic maintenance vs. body shop drop)
- **Load-balancing engine** — appointment slots offered to the customer are constrained by real capacity, with incentives to shift to low-utilisation days
- **Revenue per bay-hour** as the headline metric, not appointment count
- **Predictive service-due** on kilometres and behaviour, not the calendar
- **Parts pre-check** at appointment booking — flag jobs likely to stall on parts before the car arrives *(read-only against DMS parts data; we are not building parts inventory)*

---

### 7.12 [P2] AI Agents — where they actually pay

Not "AI lead scoring." Specific, bounded agents with measurable outcomes:

| Agent | Job | Value |
|---|---|---|
| **After-hours responder** | WhatsApp + missed-call response outside working hours, qualifies, books a callback slot | Directly attacks the largest documented leak: after-hours leads going dead |
| **Missed-call recovery** | Auto-callback + WhatsApp within 60 seconds of an unanswered inbound | 1 in 3 service calls go unanswered [R] |
| **Call QA agent** | Scores every sampled call against a rubric, extracts commitments | Replaces a manager listening to 4 of 8,000 calls |
| **Next-best-action** | Ranks each executive's day by expected rupee value, not by date order | Turns a to-do list into a revenue plan |
| **Daily brief generator** | The exception cockpit, written in prose, delivered on WhatsApp to the dealer principal at 8:45am | Adoption. He reads it on the way to the showroom |

**Guardrails [A]:** every AI-generated customer message is templated and approved (WhatsApp requires templates anyway); every AI action is written to the event ledger with an `actor: agent` flag; nothing auto-sends on a lead where consent is absent or withdrawn.

---

## 8. WHAT NOT TO BUILD — HOLD THIS LINE

Your own spec gate says no to some of these. Hold it. This is the discipline that killed the predecessor codebase and it will kill this one.

| Do not build | Why |
|---|---|
| **A DMS** | The OEM owns it. You cannot displace it. You will spend three years and lose |
| **Accounting / GL / payroll** | Zero differentiation, infinite compliance surface, unwinnable against Tally and the DMS |
| **Spare parts inventory** | Excellon and the OEM DMS own this. Read from it, never write |
| **Body shop estimating** | Insurer-integration hell. Different buyer, different product |
| **Telematics / connected vehicle** | Marketing is right. Irrelevant to an Indian dealer in 2026 |
| **Your own telephony carrier** | Licensing, DoT compliance, capex. Partner. Always partner |
| **Your own ASR/STT model** | Sarvam charges ₹30/hour. You cannot beat that on Indian languages at any scale you will reach |
| **Feature parity with Salesforce** | Bankrupts the roadmap |
| **Competing on price with Zoho** | ₹800 will always be cheaper. Compete on outcome per rupee |
| **A generic "AI chatbot"** | Commodity. Every vendor has one. Ours must be bounded and outcome-tied or not shipped |

---

## 9. THIRD-PARTY, INTEGRATION & MAINTENANCE COST MODEL

Development cost excluded per your instruction. This is **run-rate**: what it costs to operate the best version of this product.

### 9.0 The modelling assumption

I have costed against a **reference dealer group**, because per-user modelling is misleading for our cost structure:

> **Reference Group:** 5 rooftops (3 sales showrooms, 2 workshops) · 3,000 enquiries/month · 45 Arth users · 400 bookings/month · 6,000 service ROs/month · ~9,000 outbound calls/month

Two scenarios are shown throughout: **Scenario A** = 10 rooftops total on the platform (early). **Scenario B** = 100 rooftops (scale).

---

### 9.1 Cloud infrastructure

Recommend **AWS Mumbai (ap-south-1)** for India data residency — a stated requirement for Indian OEM/dealer procurement and a DPDP comfort factor.

| Component | Scenario A (10 rooftops) | Scenario B (100 rooftops) | Note |
|---|---|---|---|
| Compute (containers/app tier, auto-scaled) | ₹25,000–45,000/mo | ₹1,80,000–3,20,000/mo | [A] |
| Managed Postgres, multi-AZ + read replica | ₹22,000–40,000/mo | ₹1,50,000–2,80,000/mo | [A] |
| Redis / queue | ₹5,000–9,000/mo | ₹25,000–45,000/mo | [A] |
| Object storage (call recordings, documents) | ₹4,000–8,000/mo | ₹45,000–90,000/mo | Grows monotonically — see retention note |
| Load balancer, NAT, egress, CDN | ₹12,000–22,000/mo | ₹70,000–1,40,000/mo | **NAT gateway + egress is the classic surprise line** [A] |
| Backups, snapshots, cross-region DR copy | ₹6,000–12,000/mo | ₹50,000–90,000/mo | [A] |
| Non-prod (dev + staging) | ~30% of prod | ~20% of prod | [A] |
| **Infra subtotal** | **₹95,000–1,75,000/mo** | **₹6,00,000–11,00,000/mo** | **[A] modelled** |

**Call recording storage is a trap.** 9,000 calls/month × ~3.5 min × 5 rooftop-groups compounds. At a 36-month retention policy you are storing years of audio forever. **Decision required:** tiered lifecycle (hot 90 days → infrequent access → archive), and a contractual retention policy that DPDP will require you to have anyway. Done right this is a ₹90,000/month line at 100 rooftops. Done wrong it is ₹4L.

---

### 9.2 Communications — the biggest variable cost

#### WhatsApp

**Meta's India rates [V, effective 1 Jan 2026]:** Marketing **₹0.8631/message** (raised ~10% from ₹0.7846); Utility and Authentication **~₹0.115–0.145/message**. Service conversations free. Messages free for 72 hours when the user arrives from a Facebook/Instagram click-to-WhatsApp ad. 18% GST applies. Most Indian BSPs add **10–30% markup** [V/R].

**Recommendation [A]: go direct on the WhatsApp Cloud API, not through a BSP.** You are already building per-executive numbers and template management. A BSP adds ₹0.10–0.25/message markup plus a platform fee for a UI you will not use. Direct saves 20–30% of the largest variable line and removes a dependency from the critical path. Keep one BSP relationship as a failover.

| Line | Reference Group / month | Note |
|---|---|---|
| Utility (booking status, service reminders, delivery tracking) ~15,000 msgs @ ₹0.115 | ₹1,725 | [V rate] |
| Marketing (offers, campaigns) ~10,000 msgs @ ₹0.8631 | ₹8,631 | [V rate] |
| GST @18% | ₹1,864 | |
| BSP platform fee *(if used — avoid)* | ₹0–8,000 | ₹999–2,399/mo typical entry tiers [R] |
| **WhatsApp per reference group** | **~₹12,000–20,000/mo** | |
| **Scenario A (10 rooftops ≈ 2 groups)** | ₹24,000–40,000/mo | |
| **Scenario B (100 rooftops ≈ 20 groups)** | ₹2,40,000–4,00,000/mo | **Must be pass-through. Do not absorb** |

**Cost lever worth engineering:** route as much as possible through **click-to-WhatsApp ads** (72-hour free window) and **utility templates** rather than marketing templates. Utility is ~7.5× cheaper than marketing. A delivery-status update is a utility message. Discipline here is worth lakhs at scale.

#### SMS (DLT)

| Line | Cost | Note |
|---|---|---|
| Transactional SMS | ₹0.12–0.20/SMS | [R]; Exotel quotes from ₹0.18 at 100K tier [R] |
| DLT entity registration (one-time, per dealer) | ₹5,900 approx | [?] verify current TRAI/operator fee |
| Header + template registration | ₹0–1,500 one-time | [?] |
| **Reference group** | ₹2,000–4,000/mo | Declining as WhatsApp takes over. Keep as OTP + fallback only |

#### Cloud telephony — **the single largest third-party line**

Published India market shape [R, Ozonetel/itforsme/Capterra, 2026]:
- Entry tier (TeleCMI, Servetel, Knowlarity, MyOperator): **₹500–1,500/user/month** — IVR, recording, routing, CRM integration
- Mid tier (FreJun, Exotel, Ozonetel): **₹1,500–3,000/user/month** — AI, advanced analytics, omnichannel
- Enterprise contact centre (Ozonetel, Exotel, TTBS, Airtel IQ): **₹2,000–5,000+/user/month**
- MyOperator bundles: **₹2,500/mo for 3 users, ₹5,000 for 10** [V, vendor]
- Exotel: prepaid credit model, from **₹9,999**, 1 credit = ₹1, shared across voice/SMS/WhatsApp [R]

**Reference Group (45 users, ~9,000 calls/month): ₹35,000–1,00,000/month.**

**Recommendation [A]: telephony is pass-through or dealer-owned, never absorbed into the Arth licence.** Two supported models:
1. **BYO-telephony** — the dealer keeps their Exotel/Ozonetel/Knowlarity account; Arth integrates via API and click-to-call. Zero cost to us, faster sales cycle, no margin risk.
2. **Arth-brokered** — we resell at a small margin for dealers who want one invoice.

Marketing's teardown says "No IVR / cloud telephony — High — Partner, don't build." **Correct, and I will go further: partner *and* do not resell at fixed price.** This is the line that has bankrupted more Indian SaaS gross margins than any other.

#### Transactional email

₹1,000–4,000/month at our scale (SES/Postmark/Resend tier). Trivial. [A]

---

### 9.3 AI, speech and language

| Service | Published rate | Reference group / month |
|---|---|---|
| **Speech-to-text (Sarvam Saaras)** | **₹30/hour** standard; STT+translate ₹45/hour; ₹1.5/min on some published plans — **[?] reconcile the two published figures with their sales team before budgeting** [V, sarvam.ai] | 9,000 calls × 3.5 min = 525 hrs. **100% coverage: ₹15,750.** Sampled at 20% + all lost/escalated: **₹3,500–5,000** |
| **LLM (call QA, summarisation, next-best-action, daily brief)** | Model-dependent | ₹0.30–0.90 per call analysed [A] → **₹1,500–4,000/mo** at sampled coverage |
| **Text-to-speech (voice agents, IVR prompts)** | ₹15–30 per 10K characters [V, Sarvam] | ₹500–2,000/mo |
| **Translation (Kannada/Hindi UI + notices)** | ₹20 per 10K characters [V, Sarvam] | One-time-ish, ₹5,000–20,000 total |
| **AI subtotal (sampled strategy)** | | **₹6,000–12,000/mo per reference group** |
| **AI subtotal (100% transcription)** | | **₹20,000–30,000/mo per reference group** |

**Recommendation [A]: launch on the sampled strategy.** Offer 100% transcription as a paid add-on. This turns our single most elastic cost into a revenue line, and it is honest — most dealers do not need every call transcribed, they need the *right* calls transcribed.

**Sarvam over Western ASR is not a cost decision, it is a quality decision.** Code-mixed Kannada-English telecalls are their training distribution. Also: India-hosted, INR-billed, which helps the DPDP story.

---

### 9.4 Data & verification APIs

| API | Published rate | Reference group / month |
|---|---|---|
| **Vehicle RC / VAHAN lookup** | **From ₹3.00 per verification** excl. GST [V, Eko EPS]; Surepass, Attestr, Signzy comparable | ~1,500 lookups = **₹4,500** |
| **PAN verification** | ₹2–5 per check [R] | ₹1,000–2,000 |
| **Aadhaar eSign / e-stamping** (booking forms, delivery acknowledgement, consent) | ₹10–30 per signature [R] — Digio, Leegality, NSDL/Protean | 400 bookings = **₹4,000–12,000** |
| **Maps / geocoding** (branch routing, field geo-verification, test drive) | Google Maps Platform per-SKU with a monthly free allowance; **MapmyIndia/Mappls materially cheaper for India** — **[?] verify current tiers before committing** | ₹2,000–10,000 |
| **Used-car valuation** (OBV/Droom, CarDekho, CarWale APIs) | **[?] Not published. Get quotes** | Est. ₹5,000–20,000 [A] |
| **Credit-bureau / finance pre-qual** *(optional, P2)* | **[?] Regulated. Requires NBFC/partner relationship** | Defer |
| **Data APIs subtotal** | | **₹15,000–45,000/mo per reference group** |

**Note on RC/VAHAN:** at ₹3/lookup this is one of the highest ROI lines in the whole model. It powers insurance-lapse detection, exchange valuation, service-due prediction and household mapping. Do not economise here.

---

### 9.5 Integration & platform access

| Integration | Cost | Note |
|---|---|---|
| **Meta Marketing API + Conversions API** | **Free** | Ours already. Requires Business Verification + App Review [V] |
| **Google Ads API + Data Manager API** | **Free**, requires developer token approval | **⚠ [V] Offline conversions migrated to Data Manager API from 15 June 2026 and blocked in Google Ads API. Tokens not used Jan–Jun 2026 are not allowlisted for legacy access. Build against Data Manager API** |
| **WhatsApp Cloud API** | Free API, pay per message | Business verification + display name approval, 2–4 weeks [A] |
| **Portal feeds (CarDekho / CarWale / JustDial)** | **[?] Partner-dependent — likely free-to-low, they want dealer integrations** | Get this answered. It is in Marketing's unknowns list too |
| **OEM DMS** | **No API. Reconciliation + capture-at-source per §7.2** | ₹0 licence, engineering effort only |
| **Payment gateway** (booking advances, service payments) | ~2% + GST per transaction, pass-through to dealer | Razorpay/Cashfree/PayU standard [R] |
| **Accounting export** (Tally/Zoho Books) | File-based. Free | Read/export only. Do not build accounting |

**The strategic note [A]:** publish our own partner API **free** and make "no data-access fees, ever" a contractual commitment. It costs us nothing, it is the exact opposite of the CDK/Reynolds behaviour that produced $760M in settlements, and Tekion has proven it works as a wedge.

---

### 9.6 Security, compliance & certification

This is the section Marketing correctly flagged as a procurement blocker. Here are real numbers.

| Item | Year 1 | Recurring | Source |
|---|---|---|---|
| **ISO/IEC 27001:2022** — consulting + certification body | **₹2,00,000–4,00,000** (startups ₹1–2L consulting + ₹0.8–1.2L cert body); 12–16 weeks | Surveillance audit **₹1,00,000–1,50,000/yr** | [V/R, TCSA & Neumetric India rates] |
| **ISO/IEC 27701** (privacy extension — Groweon has this, we don't) | **₹1,00,000–2,00,000** incremental | Folded into surveillance | [A] |
| **VAPT** — CERT-In empanelled auditor, application + infra | **₹1,50,000–4,00,000** per round | **2 rounds/yr = ₹3,00,000–8,00,000** | [R] |
| **DPDP compliance programme** — data mapping, consent architecture review, DPA templates, privacy counsel | **₹3,00,000–5,00,000** | ₹1,00,000–2,00,000/yr | [R, TCSA] |
| **DPO / privacy officer** (part-time or fractional to start) | — | ₹3,00,000–8,00,000/yr | [A] |
| **Compliance automation platform** (Sprinto/Vanta-class) — *optional, compresses timeline* | ₹2,00,000–5,00,000/yr | same | [R] |
| **Cyber liability insurance** (₹1–5 Cr cover) | **₹75,000–2,50,000/yr** | same | **[?] get quotes** |
| **SOC 2** — *only if a large group or OEM demands it* | ₹5,00,000–10,00,000 market total | — | [R] — **defer** |
| **Compliance total** | **Year 1: ₹9,00,000–18,00,000** | **Recurring: ₹8,00,000–20,00,000/yr** | |

**[A] Start ISO 27001 now, not after the first enterprise RFP.** 12–16 weeks best case, 3–6 months realistic. Marketing said 6–9 months; the India market data says 12–16 weeks is achievable with a focused scope. **Scope it narrowly to the Arth production environment and the engineering team** — do not certify the whole agency, it triples the cost and the surface.

Note the sequencing: **ISO 27001 → ISO 27701 → DPDP programme.** 27701 is a privacy extension of 27001 and gets you most of the DPDP evidence base for free. Groweon's 27001+27701 pairing is not accidental.

---

### 9.7 Engineering operations & tooling

| Category | Recommended | Scenario A | Scenario B |
|---|---|---|---|
| Error tracking / APM | Sentry | ₹3,000–8,000/mo | ₹20,000–45,000/mo |
| Metrics, logs, dashboards | Grafana Cloud / BetterStack | ₹4,000–12,000/mo | ₹35,000–90,000/mo |
| Uptime + status page | BetterStack / Instatus | ₹1,500–4,000/mo | same |
| On-call / paging | Opsgenie-class | ₹2,000–6,000/mo | ₹12,000–25,000/mo |
| Source control + CI/CD | GitHub Team/Enterprise | ₹3,000–10,000/mo | ₹25,000–60,000/mo |
| Secrets management | AWS Secrets Manager / Doppler | ₹1,500–5,000/mo | ₹8,000–20,000/mo |
| WAF, DDoS, CDN | Cloudflare Pro/Business | ₹2,000–20,000/mo | ₹20,000–50,000/mo |
| Product analytics + session replay | PostHog | ₹0–8,000/mo | ₹20,000–50,000/mo |
| Feature flags | PostHog / OpenFeature | included | ₹5,000–15,000/mo |
| Backup verification & DR drills | tooling + time | ₹3,000/mo | ₹15,000/mo |
| **Eng ops subtotal** | | **₹20,000–75,000/mo** | **₹1,60,000–3,70,000/mo** |

**[A] Do not buy Datadog.** It is the single easiest way to spend ₹5L/month on observability for a product with 100 rooftops. Grafana Cloud + Sentry + BetterStack covers 95% of the need at 10% of the price. Revisit at 500 rooftops.

---

### 9.8 Business operations SaaS

| Tool | Purpose | Cost |
|---|---|---|
| Support desk + knowledge base | Freshdesk/Zoho Desk | ₹8,000–30,000/mo |
| Internal CRM for Arth's own sales | Zoho/HubSpot starter | ₹3,000–15,000/mo |
| Documentation / help centre | GitBook/Docusaurus | ₹0–8,000/mo |
| E-sign for our own contracts | Zoho Sign/Digio | ₹2,000–6,000/mo |
| Design + collaboration | Figma, Notion/Linear | ₹10,000–30,000/mo |
| Training/LMS for dealer onboarding | Video hosting + LMS | ₹5,000–20,000/mo |
| **Subtotal** | | **₹28,000–1,10,000/mo** |

---

### 9.9 Maintenance & hidden run-rate — the line everyone forgets

| Item | Annual | Note |
|---|---|---|
| **Third-party version drift** — Meta Graph API versions deprecate ~quarterly; Google Ads/Data Manager API annual breaking changes; WhatsApp template policy changes | ~0.5 FTE of engineering time continuously | **[A] This is not optional. Meta will break you on their schedule, not yours** |
| **Portal feed format changes** | ongoing | Each portal, unannounced |
| **RPA/extension breakage** when an OEM DMS updates its UI | ongoing | The known cost of the T2/T4 strategy in §7.2 |
| **Certificate renewals, domain, DNS** | ₹15,000–40,000/yr | trivial but forgettable |
| **Annual penetration test remediation** | ₹1,00,000–3,00,000/yr | separate from the test itself |
| **Data migration per new dealer onboarded** | ₹15,000–50,000 per dealer, one-time | Historical enquiry/customer/vehicle import. **Price this into onboarding, do not give it away** |
| **Support cost per rooftop** | ₹3,000–8,000/rooftop/mo at maturity [A] | The real number is people, and it scales with rooftops not users |

---

### 9.10 CONSOLIDATED COST-TO-SERVE

**Per rooftop per month, steady state** — the number that determines your pricing floor.

| Cost line | Absorbed model (₹/rooftop/mo) | Pass-through model (₹/rooftop/mo) |
|---|---|---|
| Cloud infrastructure (allocated) | 3,500 – 7,000 | 3,500 – 7,000 |
| WhatsApp messaging | 2,500 – 4,500 | **pass-through** |
| Cloud telephony | 8,000 – 20,000 | **pass-through** |
| SMS | 400 – 800 | **pass-through** |
| AI / STT / LLM (sampled) | 1,200 – 2,500 | 1,200 – 2,500 |
| Data & verification APIs | 3,000 – 9,000 | 1,500 – 4,000 *(RC lookups absorbed, eSign passed)* |
| Eng ops tooling (allocated) | 1,500 – 3,500 | 1,500 – 3,500 |
| Compliance (amortised) | 1,000 – 2,500 | 1,000 – 2,500 |
| Business SaaS (allocated) | 800 – 2,000 | 800 – 2,000 |
| Support & CS (people) | 3,000 – 8,000 | 3,000 – 8,000 |
| **TOTAL COST TO SERVE** | **₹24,900 – ₹59,800** | **₹12,500 – ₹29,500** |

**Year-1 fixed, non-per-rooftop outlay (compliance + setup):**

| Item | Cost |
|---|---|
| ISO 27001 + 27701 | ₹3,00,000 – 6,00,000 |
| VAPT (2 rounds) | ₹3,00,000 – 8,00,000 |
| DPDP programme + counsel | ₹3,00,000 – 5,00,000 |
| Cyber insurance | ₹75,000 – 2,50,000 |
| Business verification, DLT, domain, misc setup | ₹50,000 – 1,50,000 |
| **Year-1 fixed total** | **₹10,25,000 – ₹23,00,000** |

---

## 10. WHAT THIS MEANS FOR PRICING

Three conclusions fall directly out of §9, and they are engineering conclusions, not commercial ones.

**1. Flat per rooftop, never per user.** Our costs scale with enquiry volume, message volume and call minutes — not headcount. Per-user pricing punishes the dealer for festive hiring (Marketing is right about this) *and* misaligns our revenue from our cost curve. AUTOSherpa's CAPTURE module and Kylas both already use flat-rate-per-rooftop and dealers love it. Match the model.

**2. Communications are metered pass-through, with a generous included allowance.** Include, say, 3,000 utility messages and 1,000 marketing messages per rooftop per month; meter above that at cost + 15%. Telephony is BYO or brokered. **Absorbing telephony into a flat fee will destroy gross margin the first time a dealer runs a festive campaign.** This is the mistake that kills Indian SaaS companies.

**3. The margin structure this implies.** At a pass-through cost-to-serve of **₹12,500–29,500/rooftop/month**, a flat price in the **₹35,000–60,000/rooftop/month** band delivers **~55–70% gross margin** — the number you need to fund support, compliance and continued build. For context: at 25 users per rooftop, ₹45,000 flat is ₹1,800/user/month, which sits squarely inside the observed India corridor (₹800–5,000) and below LeadSquared's ₹1,250 entry once you account for the fact that they charge per user and would bill ₹31,250 for those same 25 seats *before* telephony, WhatsApp and attribution.

**4. Charge separately for what genuinely costs more:** 100% call transcription, historical data migration, additional per-executive WhatsApp numbers beyond an included count, and API access above a rate limit *(but never charge for basic data export — that is the anti-CDK position and it is worth more as a promise than as revenue)*.

---

## 11. SEQUENCED BUILD PLAN

| Phase | Duration | Ship | Why now |
|---|---|---|---|
| **P0 — Foundation** | 0–90 days | Enquiry Ledger (event-sourced) · canonical Customer/Household/Vehicle model · DMS reconciliation import + variance report · attribution spine (click ID capture → Data Manager API + Meta CAPI) · consent ledger skeleton · WhatsApp Cloud API direct · Kannada UI | Every one of these is impossible to retrofit. The variance report alone closes the first three dealers |
| **P1 — The wedge** | 90–180 days | Delivery Promise Engine + customer WhatsApp tracker · Exception Cockpit · telecalling TAT + escalation ladders · executive integrity & handover · per-executive WhatsApp numbers · portal ingestion | This is the demo that wins deals and generates referrals |
| **P2 — Compliance & revenue depth** | 180–330 days | **DPDP consent manager readiness (hard deadline 13 Nov 2026)** · ISO 27001 certified · Renewal & VAS engine · service bay yield · conversation compliance (sampled) | Nov 2026 is not negotiable. ISO is a procurement gate |
| **P3 — Moat** | 330 days+ | AI agents (after-hours, missed-call recovery, next-best-action, daily brief) · household graph depth · open partner API · multi-vertical configuration proof | Only after the core is stable. Agentic AI on an unreliable ledger is a liability |

**Critical path warning [A]:** the DPDP Consent Manager deadline of **13 November 2026** is 101 days away. Full substantive compliance is **13 May 2027**. If the consent ledger is not in P0 skeleton form and P2 complete form, we will be selling a compliance liability to dealer groups whose own legal counsel is being briefed on ₹250 crore penalties right now. **This is the schedule risk I am most worried about.**

---

## 12. WHAT I NEED FROM YOU

Seven decisions. Ranked by how much they cost if we get them wrong.

1. **Event-sourced ledger — yes or no.** This is a two-week decision that becomes a two-year rewrite. I need it settled this week. *My recommendation: yes.*
2. **Confirm we are not building a DMS, ever.** I want this written into the spec gate alongside "no spare parts, no payroll, no accounting."
3. **Telephony: BYO or brokered?** Determines gross margin more than any other single choice. *My recommendation: BYO primary, brokered optional.*
4. **Approve the ISO 27001 spend now** (₹2–4L + ₹1–2L for 27701). 12–16 weeks. If we start in September we are certified before the January selling season.
5. **Answer Marketing's Item 5** — does Maruti mandate or recommend a CRM to its dealer network? I would add: **does Excellon hold any OEM-level mandate in Karnataka?** That is the answer that changes our go-to-market, not AUTOSherpa's pricing.
6. **Get portal feed terms from CarDekho, CarWale and JustDial.** Marked [?] in both documents. It is a phone call, and it is a P0 dependency.
7. **Mandovi and Kataria as design partners, formally.** Marketing lists "no customer references — Critical." I need something more specific: **two dealers who will let us read their OEM DMS exports and their ad accounts in the same week.** That combination is the entire product thesis, and until we have proven it on real data at a real dealer, everything in this document is a hypothesis.

---

## 13. THE ONE-PARAGRAPH SUMMARY

Arth cannot win as a better CRM — that market is occupied, commoditised and defended by a company with better speech analytics and 730 dealers. Arth wins as **the only system in India that connects the money leaving the dealer's bank account to the car leaving the dealer's showroom**, because we are the only vendor who sees both sides. Everything we build should either strengthen that connection or make the dealer trust us enough to keep it plugged in. The three things that make the connection real are an immutable enquiry ledger, a reconciliation strategy that does not require OEM permission, and a delivery promise engine that makes the customer — not just the dealer principal — feel the difference. The three things that make it durable are DPDP compliance shipped before the deadline, ISO certification before the first enterprise RFP, and a pricing model that passes through communications cost instead of absorbing it. Everything else on the roadmap is negotiable.

---

*Prepared by Claude as Product Engineering Director, Arth · Advito Global*
*Sources: Tekion, CDK Global, Reynolds & Reynolds, Excellon Software, LeadSquared, AUTOSherpa, Groweon, Spyne (vendor materials); Google Ads Developer Documentation; Meta WhatsApp Business Platform pricing; Sarvam AI published API pricing; DPDP Rules 2025 (G.S.R. 846(E)) and analysis; FADA statements and 2026 F&I Summit coverage; Forbes India; CDK 2025/2026 dealer studies via AutoAlert; Urban Science 2025; Foureyes; DealerRefresh; VendorMotive; Capterra, G2, SoftwareAdvice; TCSA, Neumetric and Indian certification-body published rate guidance. Vendor-authored comparison content treated as marketing throughout. All modelled figures marked [A] are estimates for planning, not quotes.*
