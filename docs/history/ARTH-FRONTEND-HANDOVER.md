# FRONT END HANDOVER — ARTH

**From:** Director, Product Engineering
**To:** IT Director, Arth · the development team · cc Prem Kumar
**Date:** 18 August 2026
**Accompanies:** `Arth-Platform.html` — 80 screens, 22 roles, one file, opens in any browser with no server

---

## §0 READ THIS FIRST — WHAT THIS IS, AND WHAT IT IS NOT

Three categories. Treat them differently, because conflating them is the main way a handover like this goes wrong.

**1. BINDING — product decisions, not design suggestions**

The structure, the access rules, the workflow. §2 and §3 below. If any of it is technically wrong or expensive in a way I cannot see from a screen, raise it as a conversation. **Do not silently redesign it.**

**2. ILLUSTRATIVE — expect it to change**

Every name, number and record in the file is invented to make the screens legible. Column choices, filter chips, row ordering, copy, pixel-level layout. A strong starting point, not a specification. A telecaller will find the disposition panel two taps too slow within a week of real use, and that feedback should win.

**3. NOT COSTED — do not assume these are in scope**

Any screen carrying a `NOT RECORDED` line depends on data nobody captures today. **Those screens are Phase 5 requirements, not things to build now.** Building the screen before the data means it opens to an empty page.

> **The single most useful thing in the file is not the screens. It is the data-dependency block on each one.** It names what must be recorded and whether anyone records it. That is what turns a prototype into an input for Phase 5.

**What this handover does not contain:** API contracts, per-field validation rules, state machines for every flow, or error-code taxonomies. Those follow from the schema and are yours.

---

## §1 HOW TO OPEN IT

Open `Arth-Platform.html` in any browser. Fonts are embedded; it works offline.

- **Click "Signed in as"** in the left sidebar to move between all 22 roles. Each role's menu changes, and that menu *is* the specification for what that role may reach.
- **Click "Platform index"** at the foot of the sidebar for the complete map of all 80 screens grouped by area.
- On **Today (telecaller)**, the three times in the top bar (09:02 / 13:30 / 18:40) are a prototype control, not a product feature. They exist so you can see one panel's three readings without waiting a day.

---

## §2 BINDING — THE STRUCTURAL DECISIONS

These are expensive to change later. They are decided.

| | Decision |
|---|---|
| **One shared record** | One Customer, one Vehicle, one Household, one Employee. No module keeps its own copy. Every cross-sell screen in the product exists only because of this |
| **Ownership** | Attaches to **activities, never to the customer**. A customer is not owned by a salesperson |
| **Org tree** | Brand sits between dealer group and branch. Customer, Household and Employee stay shared across brands |
| **Append-only** | The enquiry record is a ledger. A correction is a new entry; the original stays visible. Same for `ExceptionEvent`, points, and audit |
| **Step owners** | Owners are a **Position, never a user**. When the RTO clerk resigns, no chain breaks and nothing needs reassigning |
| **Promise as event** | The promised delivery date is **computed and stored as an event each time it changes**, never a mutable field. See §5 |
| **Price versioning** | Quotations and bookings store the price and scheme versions live at the moment they were made. Next month's upload never rewrites last month's figures |
| **Three scoring systems** | Points measure behaviour. Targets measure outcome. Ratings are a manager's judgement. **They never merge.** Missing a target never removes a point |
| **Difficulty** | System-computed, never manager-set, and **locked at assignment** so it cannot be revised once the outcome is known |
| **Department scoping** | **No role opens another department's workspace.** If a service advisor needs one fact from sales, sales sends him that fact. He is never given the sales screen |
| **Information flows out of service, never in** | An advisor flags an exchange interest; sales, used car and central telecalling see a potential lead. He never sees the pipeline, the model, the value or who is handling it |
| **Margin visibility** | Commission and margin figures are **dealer-admin only**. Executives get a ranked recommendation with reasons |
| **Export** | An individual executive cannot export. The dealer's right to their own data is exercised by the dealer admin, and it is free and unrestricted |
| **Never build** | DMS, accounting, payroll, spare-parts stock, body shop, telematics, our own telephony or speech-to-text |

**Three rules that decide a hundred small questions:**

1. **Green as a solid fill means an action. Green as a wash, border or pill means a settled state.** The same colour never gets the same treatment twice.
2. **Every date carries the event that produced it.** *"Call, no answer · 03 Aug"*, never a bare *"03 Aug"*.
3. **Free text when the reader is the writer and the audience is one person, once. A controlled list when the field will be counted.** The test: *will anybody ever put this field in a `GROUP BY`?*

---

## §3 THE 22 ROLES, AND WHAT EACH ONE GETS

Access level, not seniority. Open the **Role inventory** screen in the file for the full 23-role treatment including the ones deliberately not built.

**Full workspace — their own screens, their own day**

Telecaller · Sales consultant · Receptionist · Sales team leader · F&I executive · Delivery coordinator · Service advisor · Service telecaller · Workshop manager · Insurance executive · Used car evaluator · Used car sales · Corporate and fleet · Driving school · Branch manager · Dealer principal · Dealer admin

**Task queue — one list, large rows, one button**

Registration desk (RTO) · Accessories · Sales admin (allocation) · Pre-delivery check

> **A task queue is not a lesser product, it is the right one.** An RTO clerk does one thing forty times a day. Give him eleven menu items and he will never open the system.

**Read only**

Parts coordinator · Marketing head · Accounts

**Not this cycle**

Technician (works from a printed job card; a tablet app is a later decision) · HR

**Advito side — three separate surfaces, not one admin panel**

Master (founder only: plans, negotiated rates, margin per dealer) · Support (can fix a dealer's setup, cannot see a rupee of pricing, every entry logged and visible to the dealer) · Engineering (health and errors, no customer data in the clear)

---

## §4 THE 80 SCREENS

| Area | Count | Screens |
|---|---|---|
| Sales and telecalling | 14 | Today (day panel), Front desk, Team leader, Discount request, F&I desk, Call queue, Enquiry pipeline, Enquiry record, Walk-in capture, Quotation, Corporate and fleet, Driving school, Test drives, Messages |
| Delivery | 5 | How the chain works (spec), Delivery chains, Accessories, Customer tracking page, Concerns and complaints |
| Service | 8 | Service calls, Workshop, Parts, What I passed on, Renewals in my bays, Job cards, Job card detail, Bay capacity |
| Insurance and renewals | 2 | Renewals pipeline, Policy detail |
| Used car | 3 | Valuations, Used car sales, Used car stock |
| Analytics | 7 | Group dashboard, Sales, Telecalling, Service, Renewals, Used car, Marketing |
| Records and tools | 9 | Customer 360, Vehicle record, Documents, Search, Notifications, Approvals, Source investment, Why we lose, Manufacturer reports |
| Management | 4 | Today's decisions, What bookings cost, Compare branches, Points and targets |
| Running the dealership | 12 | Administration, Back office queue, Targets, Incentives, Attendance, Models and variants, Setup, Consent and privacy, Audit log, People and access, Prices and schemes, How we run |
| Advito side | 5 | Master, Onboarding, Tickets, Support, Engineering |
| Mobile | 3 | Telecaller, Service and principal, Sales/insurance/delivery |
| Specifications | 5 | Role inventory, Disposition matrix, The standard row, Lead difficulty, Profile and settings |
| System and reference | 3 | Sign in, System states, Component reference |

**Five screens to read before writing any code**, because everything else follows from them:

1. **Disposition matrix** — every outcome of every contact, what it demands, what it earns, where the lead moves, what happens next. The screens are generated from this table, not the reverse.
2. **The standard row** — one nine-column grid used by every department. Columns 1, 5, 6, 8 and 9 never change between departments.
3. **Role inventory** — access level per role, and the two rules that govern all of them.
4. **How the chain works** — the delivery chain specification. This is what Phase 5 is building first.
5. **Component reference** — every control with its rule. Anything not in there goes through review.

---

## §5 THE DATA CONTRACT — CONSOLIDATED

Every item below must be captured **at the moment it happens.** None can be reconstructed afterwards. This is the consolidated list from the dependency blocks across all 80 screens.

### Already met

| Item | Where |
|---|---|
| Lead assignment, with time | Lead ledger, Phase 4 |
| Call attempted and connected, with duration | Lead ledger, Phase 4 |
| Commitments made and met | `LEAD_EVENT_TYPES.COMMITMENT` — **built** |
| Enquiry arrival time, including after hours | Lead ledger, Phase 4 |
| Source, campaign, and click identifiers | `gclid`, `fbclid`, `utmSource`, `utmMedium` — **captured and asserted in tests** |
| Booking, and its value in paise | `Booking.valueMinor` |
| Position tree | Phase 1 |

### Not recorded — required for Phase 5

| Item | Blocks | Note |
|---|---|---|
| **Branch working hours and shifts** | Every SLA in the product, the telecaller day panel, the attendance screen | **The cheapest unblocking on this list.** One small table |
| **Promised delivery date, as append-only events** | Delivery chains, promise accuracy, the promise-moved-twice card, the customer tracker | **If it ships as a mutable field, three features die permanently** |
| **Lost reason, as a controlled list** | Why we lose, competitive report, pricing decisions | Free text makes the question permanently unanswerable in aggregate |
| **Shared defect taxonomy across branches** | Recurring-failure card, workshop rework analysis | If each branch types free text, the card is unbuildable at any price |
| Chain step master, states, transitions | Delivery, back office queues, accessories | Steps, owners, SLAs and dependencies are **rows, not code** |
| Blocking reason, internal vs external | Delivery, promise accuracy | External blocks are excluded from accuracy, **and the exclusion is itself reported** |
| Financier turnaround averages | F&I desk, computed delivery dates | Real averages, never the bank's claim |
| Segment step variants (EV, CV, two-wheeler) | Model catalogue, delivery chain | Seed data. If adding CV steps needs code, the third brand is never onboarded |
| First-response target per source | Day panel, SLA breaches | |
| Points engine, and what each point came from | Day panel, scores, incentives | Part 11 |
| Lead difficulty band | Weighted scoring, manager views | Part 11. Computed at assignment, then locked |
| Policy expiry on the vehicle | Renewals, service cross-sell, document vault | Phase 5 |
| Job card, promised time, completion event | Service, workshop, bay capacity | Phase 5 |
| Used car stock intake date and floor-plan rate | Ageing, gross erosion | Phase 5 |
| Employment state and handover event | Leaver's pipeline card, attendance | Phase 5 |
| Case object, and the OEM survey schedule | Complaints, survey-window ranking | Without the survey link this is a service card, not a principal card |
| Discount request linked to the deal outcome | Approvals, discount leakage | Cheap if built with the request, expensive after |
| Consent by purpose, and on the tracking link | Privacy centre, campaigns, tracker | DPDP |

---

## §6 BUILD ORDER

**The irreversible work is items 1 and 2. Everything from 3 onward can be rebuilt if it is wrong.**

| | What | Why here |
|---|---|---|
| **1** | **Working hours and shifts per branch** | One small table. Unblocks every clock in the product. Without it the system penalises a telecaller for a lead that arrived at 21:40, and the floor stops trusting the screen in week one |
| **2** | **`DeliveryPromise` as an append-only ledger** | Cheap now, impossible later. Three features die without it |
| **3** | **Lost reason as a controlled list** | Cheap now, impossible to retrofit. The most-asked question a dealer principal has |
| **4** | **Shared defect taxonomy** | Same reasoning, service side |
| **5** | Chain step master as seed data, plus state transitions | The engine is small once the steps are rows |
| **6** | The delivery coordinator's queue | The screen somebody uses all day, and the first thing worth demonstrating |
| **7** | Customer tracking link | Needs consent capture first. The referral engine, worth waiting to get right |
| **8** | Service workspace, then Insurance, Used car, Accessories, Driving school | Phase 5 remainder |

**Buildable today with no new data:** the telecalling screens, Screen B (the day panel), the enquiry pipeline and record, walk-in capture, search, notifications, profile and settings, and the branch first-response comparison. Those depend on nothing that does not already exist.

---

## §7 WHAT IS STILL OPEN, AND WITH WHOM

| With | What |
|---|---|
| **Prem** | The two authorisation lines. The ownership model, and the `ExceptionEvent` table under Rule 1 |
| **Prem** | **The trademark search on "Arth", classes 9 and 42.** The only open risk with nothing holding it. Today an unavailable mark costs the book, the palette and a domain. After Phase 5 it costs seven workspaces, the prototype, and the name on the signage |
| **IT Director** | The `ExceptionEvent` DDL, drafted and reviewed, awaiting Prem |
| **Deferred, not dropped** | The manager Cockpit — ten of the twenty-three exception rows land there, and it is out of this cycle |
| **Not designed** | Screen B for roles other than telecalling. Telecalling is the only fully built workspace, so it is the only one that could be drawn honestly |

---

## §8 A NOTE ON HOW TO USE THE PROTOTYPE

**Screens change once real people use them.** A telecaller will find something wrong in week one that no amount of review catches, and a service advisor will want something on the job card nobody anticipated. That is normal and healthy. A first version surviving contact with a real floor unchanged would be suspicious.

**What must not change is what sits underneath** — the shared customer record, ownership on activities, the append-only ledger, the position-based step owners. Those are expensive to alter later. The screens on top are cheap to move.

**So the standing question for every screen, and it is the IT Director's own framing:** not *does this read well*, but **what does this screen require somebody to have recorded, and is anyone recording it today.**

---

*Handover for the Arth front end, 18 August 2026. To be filed in `docs/decisions/`. Amendments in writing.*
