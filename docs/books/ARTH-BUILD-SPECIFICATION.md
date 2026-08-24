# ARTH — BUILD SPECIFICATION

**From:** Director, Product Engineering
**To:** Development team, Advito Global · IT Director · cc Prem Kumar
**Date:** 21 August 2026
**Version:** 1.0 — supersedes the front-end handover of 18 August for anything the two disagree on
**Companion:** `Arth-Platform.html` — 80 screens, 22 seats, opens in any browser

---

## §0 WHAT THIS DOCUMENT DOES AND DOES NOT DO

**It does:** name every object, every state and every transition; give each of the 80 screens a route, a landing seat, an access list, its outbound navigation and its actions; state what happens after each action; and give a build order in dependency sequence.

**It does not make the build error-free, and no document can.** A specification that claims to is dangerous, because people stop asking questions. **What this removes is guessing.** Where something here is wrong or expensive, raise it — that is a conversation, not a deviation.

**Three categories, unchanged from the handover.** Binding: §1 to §4. Illustrative: every name, number and pixel in the prototype. Not costed: anything whose data does not exist, listed in §7.

**One standing rule.** Where this document and the prototype disagree, **this document wins.** Where this document is silent, the prototype is the reference. Where both are silent, ask rather than choose.

---

## §1 THE OBJECT MODEL

Fifteen objects. Everything else is derived.

### Identity and structure

| Object | Holds | Notes |
|---|---|---|
| `Tenant` | A dealer group | Isolation enforced by row-level security, not application code |
| `Brand` | Arena, Nexa, a second manufacturer | Sits **between** group and branch |
| `Branch` | A rooftop | Working hours live here |
| `Position` | A named post in the org tree | **Step owners and escalation targets are Positions, never Users** |
| `User` | A person, and their seat | Carries `workspaceKey` — the one screen they land on |

### The customer side

| Object | Holds | Notes |
|---|---|---|
| `Customer` | One person | **Shared across every department.** Never duplicated per module |
| `Household` | A group of customers at one address | Phase 6. Slot exists earlier, weak line inside it |
| `Vehicle` | One car, by registration and chassis | Shared. Service, sales and insurance all write to it |
| `Consent` | Purpose, channel, captured-at, source | **One row per purpose.** Never one tick for everything |

### The work

| Object | Holds | Notes |
|---|---|---|
| `Lead` | One enquiry | Current state only. History lives in the ledger |
| `LeadEvent` | Append-only ledger of everything that happened | Same transaction as the `Lead` write |
| `Quotation` | A priced offer | **Freezes the price and scheme versions live at that moment** |
| `Booking` | A committed sale | Carries value in paise. **Carries no delivery date** — see below |
| `DeliveryPromise` | Append-only ledger of promised dates | **New. The current promise is the latest row** |
| `DeliveryChain` / `ChainStep` | The steps, their owners, their SLAs | Steps are **rows, not code** |
| `JobCard` | A service visit | Phase 5 |
| `Policy` | Insurance, warranty, RSA, AMC | Phase 5 |
| `Case` | A complaint | Phase 5 |
| `ExceptionEvent` | Append-only ledger of cockpit decisions | DDL issued. Deferred by ruling |

### Derived, never stored

Storing any of these creates a value that can drift from the thing it describes.

| Derived | From |
|---|---|
| Current delivery promise | Latest `DeliveryPromise` row |
| Chain state, chain age | Walk of `ChainStep` states |
| Exception state | Latest `ExceptionEvent` for the identity |
| **Parked** | Latest disposition is `POSTPONED` **and** revisit date is in the future |
| Lead difficulty band | Computed at assignment, then **frozen** — the one exception, and it is frozen because it must not move |
| Expected value | §5 |

---

## §2 STATE MACHINES

### 2.1 Lead — nine stages

```
New → Assigned → Contacted → Qualified → Test drive
    → Quotation → Negotiation → Booked → Delivered
```

**Rules:**

- Stages are **tenant configuration**. The nine are the default, not a constant.
- **Forward by any amount. Backward only by a manager, with a reason, and it writes a `LeadEvent`.**
- After `Booked`, progress is the delivery chain's to report. The lead reads `Booked` until a car is handed over. **Do not mirror chain steps as stages.**
- `Lost` is terminal and requires a reason from the controlled list. **Never free text.**
- `Parked` is not a stage. It is derived.
- A lead may carry a delivered car and still read open — a second vehicle on the same enquiry.

### 2.2 Disposition — what a contact produces

Every call ends in exactly one outcome. **No outcome, no save.** Full table in the prototype's `disp` screen; the rules that govern all of them:

| Rule | |
|---|---|
| Connection under 20 seconds | Counts as not connected. **No points, no penalty** |
| Points | `base × difficulty multiplier`. Multiplier hidden from the executive |
| Promise typed after a call | Becomes a tracked commitment with a deadline |
| `POSTPONED` | **Requires a revisit date.** Lead stays open, reads Parked |
| `LOST` | Requires a reason, and each reason demands a specific fact |
| Callback beyond 14 days | Requires a reason |
| Every outcome | Writes a `LeadEvent`. Nothing is edited |

### 2.3 Delivery chain

Three lanes in parallel: **finance and insurance · vehicle and registration · preparation**. Twelve steps by default; EV adds two, commercial vehicle adds three, two-wheeler removes one. **All of it seed data.**

- The promised date is the **longest path**, recomputed on every step change, and **written as a new `DeliveryPromise` row each time it moves.**
- A step is `PENDING · IN_PROGRESS · BLOCKED · COMPLETE`.
- `BLOCKED` carries a reason **and a kind: internal or external.**
- **External blocks are excluded from promise accuracy, and the exclusion is itself reported.** A branch marking everything external must be visible.
- A salesperson may override a computed date. The override is recorded with a reason. **A date typed with nothing behind it must not be possible.**

### 2.4 Exception — deferred by ruling

`ExceptionEvent` is append-only. Four events, five constraints, four return triggers, one hard restriction: **a walk-up card cannot be acknowledged again.** DDL is issued and awaiting Prem. **Not in this cycle.**

---

## §3 ACCESS — THE THREE LAYERS

They are separate and they are commonly confused.

| Layer | Question | Where it lives |
|---|---|---|
| **Landing** | Where does this person start? | `User.workspaceKey`. Exactly one, never a list |
| **Permission** | What may this person open? | Role grants, per screen |
| **Scope** | Which records within it? | Own / team / branch / brand / group |

**A branch manager lands on his decisions screen and can still reach telecalling. Landing is not permission.**

### 3.1 The two rules that govern every seat

1. **No seat opens another department's workspace.** If a service advisor needs one fact from sales, sales sends him that fact. He is never given the sales screen.
2. **Information flows out of service, never in.** An advisor flags an exchange interest; sales, used car and central telecalling see a potential lead. He never sees the pipeline, the model, the value, or who is handling it.

### 3.2 Figures, by seat

| Figure | Executive | Team leader | Branch head | Principal | Dealer admin |
|---|---|---|---|---|---|
| Own records | Yes | Yes | Yes | Yes | Yes |
| Colleagues' records | See only | Team | Branch | All | All |
| Lead cost by source | No | Yes | Yes | Yes | Yes |
| **Lead difficulty band** | **No** | Yes | Yes | Yes | Yes |
| Discount given | Own | Team | Branch | All | All |
| **Insurance / product margin** | **No** | **No** | **No** | **No** | **Yes** |
| Branch P&L | No | No | Own | All | No |
| Salary and employee cost | No | No | No | Yes | No |
| **What the dealer pays Advito** | No | No | No | Yes | **Yes** |
| Export | **No** | No | Yes | Yes | Yes |

**Two rows are not configurable:** salary is never visible below the principal, and margin is dealer-admin only. Everything else the dealer may adjust.

### 3.3 Advito-side

Three surfaces, not one panel. **Recorded as unscoped — it needs its own work order and is not in this cycle.** When it comes: Master sees pricing and margin; Support can fix configuration, sees masked phone numbers, no pricing, and **every entry is logged and shown to the dealer**; Engineering sees health and errors and no customer data in the clear.

---

## §4 CROSS-CUTTING RULES

These apply to every screen and are the ones most often lost.

**The standard row.** Nine columns, one grid, every department. Columns 1, 5, 6, 8, 9 never change. **Every date carries the event that produced it** — *"Call, no answer · 03 Aug"*, never a bare date.

**After an action.** The panel becomes the confirmation **in place**, for about 1.5 seconds: what was recorded, what it earned, what happens next. **Not a toast** — at forty times a morning a toast is chrome. **Undo inside that window**, implemented as a correcting entry, never a deletion.

**Save.** Every form ends in a save bar. A persistent unsaved-changes bar appears on first edit and clears on save or navigate.

**Empty, error, offline.** States a fact and says what happens next. Names the person who can grant access when refused. Work is never blocked offline; the queue syncs.

**Partial data.** An incomplete figure says so beside itself. **An incomplete number rendered as final is the fastest way to lose a dealer.**

**Colour.** Every value resolves to a token. Zero raw hexes. Five button variants and **no green button.** Semantic colour never decorates.

**Free text or controlled list.** *Will anybody ever put this field in a `GROUP BY`?* Yes → list. No → free text.

**Working hours gate every clock.** Nothing outside a branch's hours creates a penalty. A lead arriving at 21:40 starts its clock next working morning, and the delay is recorded against the branch.

---

## §5 THE FORMULAS

**Expected value**

```
expected value = (unit gross + attached gross) × stage probability
```

`unit gross` from the price master. `attached gross` = exchange + finance + insurance + accessories, **each at its own attach rate for that model at that dealership**, average case not best case. `stage probability` = historical conversion from that stage to a delivered car, cut by source.

**At launch there is no history.** Start from a seeded default table, replace with the dealer's own numbers after month one, and **mark the figure provisional until then.**

**Points**

```
points = base(outcome) × difficulty multiplier(band)
```

Bands ×1.0 / ×1.5 / ×2.5 / ×3.5, dealer-configurable. **System-computed at assignment, then frozen.** Hidden from the executive.

**Cost per booking** — marketing spend ÷ bookings, per source, **exact where an API reports it and manually entered where it does not.** Never merged with total cost per booking, which adds salaries and rent and is directional only.

**Promise accuracy** — delivered on or before the promise ÷ all deliveries, **excluding externally blocked chains**, with the exclusion count reported alongside.

---

## §6 BUILD SEQUENCE

**Items 1 and 2 are irreversible. Everything from 3 can be rebuilt if wrong.**

| | Build | Unblocks |
|---|---|---|
| **1** | **Working hours and shifts per branch** | Every SLA in the product, the day panel, attendance. **One small table, and it is the cheapest unblocking on this list** |
| **2** | **`DeliveryPromise` append-only ledger** | Delivery, promise accuracy, promise-moved-twice, the customer tracker |
| **3** | **Lost reason, controlled list** | Why we lose, competitive and pricing reports |
| **4** | **Shared defect taxonomy** | Recurring-failure detection, rework analysis |
| 5 | Queue definition, nine stages, in-place confirmation | The three demonstration blockers |
| 6 | Search by phone, then the six working filters | Every screen |
| 7 | Chain step master + state transitions | Delivery, back office queues, accessories |
| 8 | Delivery coordinator's queue | The first screen worth demonstrating |
| 9 | Consent by purpose, then the tracking link | The referral engine |
| 10 | Service workspace | The profit centre |
| 11 | Insurance, Used car, Accessories, Driving school | Phase 5 remainder |
| 12 | Points engine — **requires call duration** | Scores, incentives |
| 13 | Attribution + cost per booking | The commercial argument |
| 14 | Exception Cockpit | Deferred by ruling |

**Buildable today, no new data:** telecalling console, day panel, enquiry pipeline and record, walk-in capture, search, notifications, profile, branch comparison.

---

## §7 WHAT IS NOT COSTED

Any screen depending on these is a Phase 5 requirement, not a build item. **None can be reconstructed after the fact.**

Working hours · promised date as events · lost reason · defect taxonomy · chain steps and states · blocking reason and kind · financier turnaround averages · segment step variants · first-response target per source · points engine · difficulty band · **call duration** · policy expiry · job card and promised time · used-car intake date and floor-plan rate · employment state and handover · `Case` and the OEM survey schedule · discount request linked to outcome · consent by purpose.

---

## §8 DEFINITION OF DONE, PER SCREEN

A screen is not done until all nine are true.

1. Every seat in its access list can open it; **every seat outside receives 403, verified**.
2. Scope is correct — an executive sees own, a manager sees team, verified with two accounts.
3. Lists use the standard row with column headings.
4. Every figure carries its source and period; incomplete figures say so.
5. Every form has a save bar; the unsaved bar appears and clears.
6. Every action produces an in-place confirmation and, where destructive, an undo.
7. Empty, error, no-permission and offline states exist and name what happens next.
8. Every colour resolves to a token. **Zero raw hexes.**
9. No horizontal scroll at 1100px. No clipped cell text.

---

## §9 WHAT IS STILL OPEN

| With | What |
|---|---|
| **Prem** | Run the production seed. One login and ageing data means the access model cannot be demonstrated at all |
| **Prem** | **The trademark search, classes 9 and 42.** The only open risk with nothing holding it, and its cost rises weekly |
| **Prem** | Authorise `ExceptionEvent`, and the ownership model |
| **Brand** | Eight tokens, and the gap under them: **the palette has no on-dark scale** |
| **IT Director** | The work order naming which screens are in this cycle |
| **Unscoped** | The Advito three-surface split |

---

*Build specification v1.0, 21 August 2026. Appendices A and B follow, derived from the prototype rather than written from memory. Amendments in writing.*

---

## APPENDIX A — THE 22 SEATS

Each seat lands on exactly one workspace. **Landing is where the person starts; permission is what they may open.** A seat not listed against a screen in Appendix B must receive 403.

| Seat | Role key | Lands on | Screens reachable |
|---|---|---|---|
| Telecaller | `tele` | `dayb` | 8 |
| Sales consultant | `sales` | `pipe` | 11 |
| Service advisor | `svc` | `svc` | 11 |
| Receptionist | `recep` | `recep` | 3 |
| Sales team leader | `lead` | `lead` | 10 |
| F&I executive | `fni` | `fni` | 5 |
| Registration desk | `back` | `back` | 2 |
| Used car evaluator | `eval` | `eval` | 5 |
| Dealer admin | `admin` | `admin` | 13 |
| Service telecaller | `svctele` | `svctele` | 4 |
| Used car sales | `ucsales` | `ucsales` | 4 |
| Workshop manager | `wsmgr` | `wsmgr` | 8 |
| Parts coordinator | `parts` | `parts` | 2 |
| Accessories | `acc` | `acc` | 2 |
| Corporate sales | `fleet` | `fleet` | 4 |
| Driving school | `school` | `school` | 2 |
| Marketing head | `mktg` | `an-mktg` | 6 |
| Insurance executive | `ins` | `ins` | 6 |
| Delivery coordinator | `deliv` | `deliv` | 6 |
| Branch manager | `mgr` | `cock` | 19 |
| Dealer principal | `owner` | `cock` | 21 |
| Advito staff | `adv` | `adv-master` | 16 |

---

## APPENDIX B — EVERY SCREEN

**Derived from the prototype, not written from memory.** `Reached by` is the definitive access list. `Navigates to` is the outbound link map — build these and no screen is a dead end.


### Sales and telecalling


**`dayb` · Today  the day panel** — *Screen B. One panel, three readings*  
Route `/w/dayb` · Reached by: `tele`  
Navigates to: `tele`  

**`recep` · Front desk** — *Receptionist, arrivals and calls*  
Route `/w/recep` · Reached by: `recep`  
Navigates to: `walkin`  
Primary actions: Log a walk in · Answer

**`lead` · Team leader** — *Approvals, unassigned, coaching*  
Route `/w/lead` · Reached by: `lead`  
Navigates to: `discount`, `targets`  
Primary actions: Weekly review

**`discount` · Discount request** — *Written justification on the record*  
Route `/w/discount` · Reached by: `lead`  
Navigates to: `quote`  
Primary actions: Send for approval · Save draft · Cancel

**`fni` · Finance and insurance desk** — *Files, financier performance*  
Route `/w/fni` · Reached by: `fni`  
Primary actions: New file

**`tele` · Call queue** — *The floor, with anti-gaming rules*  
Route `/w/tele` · Reached by: `mgr`, `svctele`, `tele`  
Primary actions: Take a break

**`pipe` · Enquiry pipeline** — *9 stages, sorted by expected value*  
Route `/w/pipe` · Reached by: `lead`, `mgr`, `sales`, `tele`  
Navigates to: `rec`, `inbox`, `deliv`  
Primary actions: Add enquiry

**`rec` · Enquiry record** — *One customer, all history*  
Route `/w/rec` · Reached by: `— opens from a row, not a menu`  
Navigates to: `pipe`, `inbox`  
Primary actions: Full audit trail · Message · Call now

**`walkin` · Walk-in capture** — *Reception tablet, attribution rescue*  
Route `/w/walkin` · Reached by: `recep`, `sales`  
Primary actions: Save walk-in

**`quote` · Quotation** — *Prices frozen at the moment quoted*  
Route `/w/quote` · Reached by: `fleet`, `sales`  
Navigates to: `rec`  
Primary actions: Send on WhatsApp · Save quotation · Request approval

**`fleet` · Corporate and fleet** — *Tenders, bands, batch delivery*  
Route `/w/fleet` · Reached by: `fleet`  
Navigates to: `quote`, `approvals`  
Primary actions: New account

**`school` · Driving school** — *The cheapest first-time buyer list a dealer has*  
Route `/w/school` · Reached by: `school`  
Navigates to: `tele`  
Primary actions: Enrol

**`td` · Test drives** — *Demo fleet, expiry blocks*  
Route `/w/td` · Reached by: `sales`  
Primary actions: Book a test drive

**`inbox` · Messages** — *One thread per customer, every channel*  
Route `/w/inbox` · Reached by: `deliv`, `ins`, `sales`, `tele`  
Navigates to: `quote`  
Primary actions: Send · Attach quotation

### Delivery


**`delivspec` · How the chain works** — *Specification for Phase 5, being built now*  
Route `/w/delivspec` · Reached by: `adv`, `deliv`  

**`deliv` · Delivery chains** — *Three lanes, computed date*  
Route `/w/deliv` · Reached by: `deliv`, `mgr`, `owner`, `sales`  
Primary actions: Chase all blocked

**`acc` · Accessories** — *Orders and fitment, a chain step*  
Route `/w/acc` · Reached by: `acc`  
Primary actions: New order

**`track` · Customer tracking page** — *Public link, no login*  
Route `/w/track` · Reached by: `deliv`  
Navigates to: `cases`  
Primary actions: Raise a concern

**`cases` · Concerns and complaints** — *Ranked by survey risk*  
Route `/w/cases` · Reached by: `deliv`, `mgr`, `svc`, `wsmgr`  
Primary actions: Log a concern

### Service


**`svctele` · Service calls** — *Service due, post service, win-back*  
Route `/w/svctele` · Reached by: `svctele`  
Navigates to: `tele`  
Primary actions: Start calling

**`wsmgr` · Workshop** — *Bay load, technician load, rework*  
Route `/w/wsmgr` · Reached by: `wsmgr`  
Navigates to: `an-svc`, `svc`, `bays`, `parts`  
Primary actions: Analytics

**`parts` · Parts** — *Which jobs are waiting on which part*  
Route `/w/parts` · Reached by: `parts`, `wsmgr`  

**`flags` · What I passed on** — *Service advisor flags, no sales pipeline*  
Route `/w/flags` · Reached by: `svc`  
Primary actions: Send the flag · Clear

**`svcren` · Renewals in my bays** — *Scoped to cars in the workshop now*  
Route `/w/svcren` · Reached by: `svc`  

**`svc` · Job cards** — *Today, by promised time*  
Route `/w/svc` · Reached by: `mgr`, `owner`, `svc`, `wsmgr`  
Navigates to: `job`, `svcren`  
Primary actions: Book a slot

**`job` · Job card detail** — *Countdown, cross-sell*  
Route `/w/job` · Reached by: `svc`  
Navigates to: `svc`, `svcren`, `flags`  
Primary actions: Tell the customer · Complete job · Start renewal · Send the flag · What I passed on

**`bays` · Bay capacity** — *Real limits, not appointments*  
Route `/w/bays` · Reached by: `svc`, `wsmgr`  
Primary actions: Offer to rebalance

### Insurance and renewals


**`ins` · Renewals pipeline** — *Insurance, warranty, RSA, AMC*  
Route `/w/ins` · Reached by: `ins`, `mgr`, `owner`  
Navigates to: `policy`  
Primary actions: Get quotes

**`policy` · Policy detail** — *Ranked recommendation, no margin shown*  
Route `/w/policy` · Reached by: `fni`, `ins`  
Navigates to: `ins`  
Primary actions: Send payment link

### Used car


**`eval` · Valuations** — *The gap that loses new car deals*  
Route `/w/eval` · Reached by: `eval`, `ucsales`  
Primary actions: New valuation

**`ucsales` · Used car sales** — *Stock, ageing, enquiries*  
Route `/w/ucsales` · Reached by: `ucsales`  
Navigates to: `an-used`, `approvals`, `tele`  
Primary actions: Analytics · List a unit

**`used` · Used car** — *Valuation gap, ageing stock*  
Route `/w/used` · Reached by: `eval`, `mgr`, `owner`  
Navigates to: `eval`  
Primary actions: New evaluation

### Analytics


**`an-group` · Group dashboard** — *Reference, never the start of a day*  
Route `/w/an-group` · Reached by: `owner`  

**`an-sales` · Sales** — *The funnel, and where 440 enquiries died*  
Route `/w/an-sales` · Reached by: `lead`, `mgr`, `mktg`, `owner`  
Primary actions: Month · Quarter · Year

**`an-tele` · Telecalling** — *Disposition mix, weighted seats*  
Route `/w/an-tele` · Reached by: `lead`  

**`an-svc` · Service** — *Bay utilisation, and the retention cliff*  
Route `/w/an-svc` · Reached by: `mgr`, `owner`, `wsmgr`  

**`an-ins` · Renewals** — *Conversion by where the customer was reached*  
Route `/w/an-ins` · Reached by: `mgr`  

**`an-used` · Used car** — *Gross erodes with every week in stock*  
Route `/w/an-used` · Reached by: `mgr`, `ucsales`  

**`an-mktg` · Marketing** — *Cost per booking by creative*  
Route `/w/an-mktg` · Reached by: `mktg`, `owner`  
Navigates to: `sources`, `report`  
Primary actions: Source investment · Cost per booking

### Records and tools


**`cust` · Customer 360** — *The household, and every vehicle in it*  
Route `/w/cust` · Reached by: `sales`  
Navigates to: `pipe`, `inbox`, `veh`, `rec`  
Primary actions: Message · Call

**`veh` · Vehicle record** — *Everything that ever happened to it*  
Route `/w/veh` · Reached by: `eval`, `svc`  
Navigates to: `cust`, `docs`, `eval`, `job`, `policy`  
Primary actions: Documents · Value for exchange

**`docs` · Documents** — *Attached to the vehicle, not the deal*  
Route `/w/docs` · Reached by: `fni`  
Navigates to: `veh`, `policy`  
Primary actions: Send all to customer · Upload

**`search` · Search** — *One box, scoped to your role*  
Route `/w/search` · Reached by: `adv`, `sales`  
Navigates to: `cust`, `veh`, `rec`  
Primary actions: Search · Clear

**`notif` · Notifications** — *Every one says why you got it*  
Route `/w/notif` · Reached by: `sales`, `svc`, `tele`  
Navigates to: `profile`, `rec`, `tele`, `inbox`, `quote`  
Primary actions: What I receive · Mark all read

**`approvals` · Approvals** — *One inbox, not five*  
Route `/w/approvals` · Reached by: `mgr`, `owner`  
Navigates to: `discount`, `targets`, `price`  

**`sources` · Source investment** — *What is not entered looks free*  
Route `/w/sources` · Reached by: `admin`, `mktg`  
Primary actions: Save this month · Save entered costs · Discard

**`lost` · Why we lose** — *Blocked until the reason field ships*  
Route `/w/lost` · Reached by: `mktg`, `owner`  

**`mis` · Manufacturer reports** — *Six hours a month, automated*  
Route `/w/mis` · Reached by: `owner`  
Navigates to: `cases`  
Primary actions: Generate

### Management


**`cock` · Today's decisions** — *Seven cards, then it stops*  
Route `/w/cock` · Reached by: `mgr`, `owner`  
Navigates to: `deliv`, `svc`, `ins`  
Primary actions: Weekly review · Send to branch heads

**`report` · What bookings cost** — *Every source on one basis*  
Route `/w/report` · Reached by: `mgr`, `mktg`, `owner`  
Primary actions: Export · See total cost view

**`branches` · Compare branches** — *Process, not just outcome*  
Route `/w/branches` · Reached by: `mgr`, `owner`  
Primary actions: Weekly review

**`targets` · Points and targets** — *Three systems, never merged*  
Route `/w/targets` · Reached by: `eval`, `fleet`, `fni`, `ins`, `lead`, `mgr`, `svc`, `svctele`, `tele`  

### Running the dealership


**`admin` · Administration home** — *What needs the admin today*  
Route `/w/admin` · Reached by: `admin`  
Navigates to: `price`, `users`, `branches`, `settings`, `diff`  
Primary actions: Open

**`back` · Back office task queue** — *RTO, accessories, PDI, allocation*  
Route `/w/back` · Reached by: `back`  

**`tgtset` · Targets** — *The cascade, and it must add up*  
Route `/w/tgtset` · Reached by: `admin`, `lead`, `owner`  
Primary actions: Publish targets · Publish · Discard draft

**`incent` · Incentives** — *Computed from events, never a claim*  
Route `/w/incent` · Reached by: `admin`, `owner`  
Navigates to: `targets`, `flags`, `diff`  
Primary actions: Export for payroll · Approve the run · Hold

**`attend` · Who is here** — *Feeds the clocks, not an HR system*  
Route `/w/attend` · Reached by: `lead`, `mgr`, `wsmgr`  

**`catalogue` · Models and variants** — *Which chain each model uses*  
Route `/w/catalogue` · Reached by: `admin`  
Navigates to: `delivspec`  
Primary actions: Save changes · Save · Discard

**`setup` · Setup** — *Seven steps before anybody logs in*  
Route `/w/setup` · Reached by: `admin`  
Navigates to: `settings`, `price`  

**`privacy` · Consent and privacy** — *Purpose by purpose, DPDP requests*  
Route `/w/privacy` · Reached by: `admin`  

**`auditview` · Audit log** — *Everything, nothing editable*  
Route `/w/auditview` · Reached by: `admin`  
Navigates to: `discount`, `admin`, `users`  
Primary actions: Export

**`users` · People and access** — *Who sees which figure*  
Route `/w/users` · Reached by: `admin`, `owner`  
Primary actions: Invite someone

**`price` · Prices and schemes** — *Agent proposes, human approves*  
Route `/w/price` · Reached by: `admin`, `owner`  
Primary actions: Review changes · Approve all · Review one by one

**`settings` · How we run** — *Hours, SLAs, escalation*  
Route `/w/settings` · Reached by: `admin`, `owner`  
Primary actions: Save settings · Discard changes

### Advito side


**`adv-master` · Master** — *Plans, negotiated rates, margin per dealer*  
Route `/w/adv-master` · Reached by: `adv`  
Primary actions: Edit a plan · Publish

**`adv-onboard` · Onboarding** — *Provisioning, and the churn signal in it*  
Route `/w/adv-onboard` · Reached by: `adv`  
Navigates to: `setup`  
Primary actions: New dealer

**`adv-tickets` · Tickets** — *Counted by real cause, not subject line*  
Route `/w/adv-tickets` · Reached by: `adv`  
Navigates to: `adv-support`, `adv-tech`  

**`adv-support` · Support** — *Impersonation, masking, access log*  
Route `/w/adv-support` · Reached by: `adv`  
Primary actions: Enter account

**`adv-tech` · Engineering** — *Health, errors, third-party watch*  
Route `/w/adv-tech` · Reached by: `adv`  

### Mobile


**`mob` · Telecaller** — *Queue, call, disposition sheet*  
Route `/w/mob` · Reached by: `ins`, `tele`  

**`mob2` · Service and principal** — *At the bay, and in the car*  
Route `/w/mob2` · Reached by: `mgr`, `owner`, `svc`  

**`mob3` · Sales, insurance, delivery** — *Two actions each, nothing more*  
Route `/w/mob3` · Reached by: `adv`, `deliv`, `sales`  

### Specifications


**`roles` · Role inventory** — *All 23 roles, and what each one gets*  
Route `/w/roles` · Reached by: `adv`, `owner`  

**`disp` · Disposition matrix** — *Every outcome, requirement, points, next action*  
Route `/w/disp` · Reached by: `adv`  

**`rowspec` · The standard row** — *One row shape for every department*  
Route `/w/rowspec` · Reached by: `adv`  
Navigates to: `inbox`  

**`diff` · Lead difficulty** — *Hard leads earn more points*  
Route `/w/diff` · Reached by: `admin`, `adv`, `lead`, `mgr`  

**`profile` · Profile and settings** — *Avatar, language, notifications, security*  
Route `/w/profile` · Reached by: `acc`, `admin`, `adv`, `back`, `eval`, `fleet`, `fni`, `ins`, `lead`, `mktg`, `parts`, `recep`, `sales`, `school`, `svc`, `svctele`, `tele`, `ucsales`, `wsmgr`  
Primary actions: Upload a photograph · Save profile · Discard changes · Save notification settings · Change password · Sign out everywhere

### System and reference


**`login` · Sign in** — *Two-step, revocable sessions*  
Route `/w/login` · Reached by: `adv`  
Navigates to: `tele`  

**`states` · System states** — *Loading, empty, error, offline*  
Route `/w/states` · Reached by: `adv`  
Primary actions: Mark lost · Cancel

**`components` · Component reference** — *Every control, with its rules*  
Route `/w/components` · Reached by: `adv`  
Primary actions: Primary · Call · primary action · Secondary · Tertiary · Destructive · Disabled · Save · Discard