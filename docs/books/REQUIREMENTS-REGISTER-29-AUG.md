# REQUIREMENTS REGISTER · 29 AUGUST 2026

**Source:** Prem Kumar's product notes
**Status:** every item captured. Nothing dropped.
**Companion:** these are reflected in `ARTH-PRODUCT-TREE.html` and belong in the Product Book at its next edition.

---

## HOW TO READ THIS

| Mark | Meaning |
|---|---|
| **ACCEPTED** | Goes in as stated. No conflict |
| **ACCEPTED, SCOPED** | Goes in, but the shape changes for a stated reason |
| **COLLISION** | Contradicts a ruling already made. **Your decision, and I have given you the argument on both sides** |
| **NEEDS A SOURCE** | The feature is right; the data to make it true does not exist yet |
| **CHANGES THE PLAN** | Accepting this moves the release schedule. Read before agreeing |

**Four items are collisions and one changes the whole release plan.** Those are §2 and §3. Everything else is additive.

---

# §1 THE STRUCTURAL CHANGE

### R1 · Telecalling is the front door for every department **ACCEPTED**

> *All the leads are attended by digital marketing or telecalling. Digital/Telecalling → sales/service/insurance as per department. Telecallers → sales executive/service advisor as per department.*

**This is the most important sentence in your notes and it changes the tree.** Telecalling is not a department beside sales and service. **It is the entrance to all of them.**

Consequences, all accepted:

- **A telecaller's job ends at assignment.** Qualify, capture, route. The receiving executive owns it from there.
- Every department therefore has **two intakes**: pushed from telecalling, and uploaded by its own manager. **Both must be labelled** so a service telecaller can tell a digital-marketing lead from an uploaded service-due record. (R22)
- Telecalling seats are **department-scoped**: a sales telecaller and a service telecaller are different seats with different dispositions.

### R2 · Monitoring tiers **ACCEPTED**

Executive → team leader → manager → GM/VP → dealer principal. **Analytics depth increases at each tier** (R24). The dealer principal is the owner and sees everything.

---

# §2 THE FOUR COLLISIONS

## C1 · Insurance ranked by margin, with margin hidden **COLLISION**

> *Top 3 should be selected which has the best margin and shown as top 3 recommended... they should not see the margin percentage.*

**This contradicts a ruling made earlier, and I think the earlier ruling is right. But it is your call and here is the honest argument.**

**The earlier ruling:** ranked recommendation with **reasons**, never by margin. The stated reason: *a margin-driven ranking always puts the priciest policy first, and the executive loses the customer's trust within a month.*

**Why hiding the margin does not solve it.** The telecaller cannot see the number, but the customer can see the premium. If the top recommendation is consistently the most expensive one, **the customer works it out in three calls, not three months** — and the person who pays for that is the telecaller, who has no idea why his recommendations keep getting refused.

**What I would build instead, which gets you most of what you want:**

Rank on a **blend**: claim settlement ratio, cashless garage coverage at your own workshop, renewal price stability, **and margin as one input among four.** The telecaller sees the reasons. A high-margin product that is also genuinely good rises to the top honestly, and one that is only high-margin does not.

**If you overrule this, do it in writing** and I will build it as stated. It is a legitimate commercial decision and I am not blocking it. But **record the reason**, because in eighteen months somebody will ask why insurance conversion is falling and this will be the first place to look.

## C2 · Negative scoring **COLLISION, and I would scope it hard**

> *If there are any mistakes there should be negative scoring too.*

**Penalties change behaviour, but not always in the direction you want.** A telecaller penalised for a bad outcome hides the outcome. That is exactly how *"not interested"* reached 31% of all closures with no reason recorded.

**What I would accept:**

| Penalise | Because |
|---|---|
| Not logging an outcome at all | Hiding work is the one thing that must cost |
| Letting a first response window lapse with no attempt | The core promise of the product |
| A commitment made and then missed with no note | A broken promise to a customer |

**What I would not penalise:**

| Not this | Because |
|---|---|
| A lost lead | Losses are mostly outside his control, and penalising them produces fake dispositions |
| A short call | A wrong number is not a failure. **Under 20 seconds already earns no points and no penalty** |
| A low conversion rate | That is a target, and targets and points are never merged |

**The rule underneath: penalise concealment, never outcomes.** And every penalty needs a **safe path** — a way to do the right thing and avoid it. A penalty with no safe path is a pressure, and a pressure produces the behaviour it was meant to stop.

## C3 · HR and Accounts as departments **COLLISION**

Your notes list HR and Accounts. **Both were previously recorded as never built**, with reasons: they are regulated systems with statutory filings, and Arth computes what is payable and exports it rather than paying anybody.

**What I think you actually want, and what I have added:**

- **Dealer admin** — already exists and is now expanded (R33). This is the configuration owner.
- **Accounts, read only** — sees incentive computations and export files. **Does not pay from Arth.**
- **HR surface, minimal** — employment state, joining, leaving, and the **structured handover of a leaver's open work.** That last one is genuinely needed and is already specified.

**Full HR and full accounting stay out.** If you want them, that is a separate product conversation with a separate cost, not a department in this tree.

## C4 · Stage names **COLLISION, easily settled**

You proposed: *enquiry, meeting, test drive, booking, retail, delivery.*

**The nine in force are:** New · Assigned · Contacted · Qualified · Test drive · Quotation · Negotiation · Booked · Delivered.

**Your list is better in one place and thinner in two.**

- **"Meeting" is better than "Qualified"**, and it is what a floor actually says. **I would take it.**
- **"Retail"** is the dealer word for invoiced. It is a **delivery chain step, not a sales stage** — and modelling chain steps as stages is the error that produced twelve stages before. It belongs in the chain.
- **Quotation and Negotiation** should stay. A quotation issued is the strongest pre-booking signal in the funnel and disappears if merged.

**Proposed, and this is a change I would make:**

`New · Assigned · Contacted · Meeting · Test drive · Quotation · Negotiation · Booked · Delivered`

Still nine. One word changed. **Stages are rows, so this is a seed change, not a code change.**

---

# §3 THE ITEM THAT CHANGES THE RELEASE PLAN

### R9 · Autodialer, call recording, and recordings audible downstream **CHANGES THE PLAN**

> *Autodialer or any call recording should be saved and accessible in the history section... and when the enquiry passes to sales or service, they should also be able to listen.*

**This is right, and it is the single most valuable thing in your notes.** A sales executive who can hear what the customer actually said is a materially better sales executive, and no competitor does this.

**But understand what accepting it does.**

| | Before | After |
|---|---|---|
| Telephony | Deferred. No provider needed | **Blocking. A provider must be chosen and contracted** |
| Points engine | Blocked, because the 20-second floor needs duration | **Unblocked.** Duration arrives with the calls |
| Storage and cost | None | Recording storage, transcription at ~20% sampling, per-minute charges |
| Consent | Simple | **Call recording notice is a legal requirement.** Both parties |
| Timeline | Telecalling testable in 4 to 5 weeks | **Add 2 to 3 weeks** |

**My recommendation: accept it, and sequence it.**

1. **Ship the telecalling floor without telephony**, as planned. Test it on a real floor.
2. **Choose the provider now**, in parallel. It has been open for weeks and it now blocks two features rather than one.
3. **Add dialler, recording and duration as the next release**, and points immediately after, in that order.

**Do not ship points before duration.** That order teaches a floor to game a score before the control exists.

---

# §4 ACCEPTED · THE CATALOGUE AND PRICING

### R3 · Full model, variant and price master **NEEDS A SOURCE**

> *List of all cars and variants, on-road price, insurance, all price breakups, loaded and automatically updating.*

**The feature is right. The word to look at is "automatically".**

**There is no open feed of Indian on-road prices.** On-road price is ex-showroom + RTO + insurance + accessories + logistics, and **RTO and insurance vary by state, by city and by buyer.** A number that is automatically wrong is worse than a number a dealer entered.

**What I would build:**

| Layer | How it stays current |
|---|---|
| Model and variant catalogue, per OEM | Loaded at provisioning from a maintained source |
| Ex-showroom price | **Dealer's own price master.** He has it, and it is the only authoritative version |
| RTO, insurance, accessories, logistics | Rules per state, maintained by Advito |
| Refresh | **Monthly, proposed by an agent, approved by a human.** Never applied silently |

**Every quoted price carries the date its components were last confirmed.** A quotation freezes its price and scheme versions at the moment it is issued (already specified) so it cannot reprice itself later.

### R4 · OEM brand chosen at setup, catalogue follows **ACCEPTED**

Two-wheeler, four-wheeler and commercial supported. Vehicle type drives the **delivery chain variant** already specified: EV adds two steps, commercial adds three, two-wheeler removes one.

### R12 · Car availability and delivery estimate **NEEDS A SOURCE**

Telecaller sees **approximate days if booked today**. Sales sees the exact allocation and chain detail.

**The source is the manufacturer's DMS, and the read strategy is undecided.** Until it is: **allocation status entered by the sales admin**, and the estimate marked as an estimate. **Never show a precise date derived from a guess.**

### R13 · Bay availability and service waiting period **ACCEPTED, SCOPED**

Telecaller sees **an approximate window, and it says approximate.** Only the service advisor confirms an appointment, because only he knows the work involved. Your reasoning here was exactly right and I have taken it as written.

---

# §5 ACCEPTED · THE ENQUIRY

### R27 · "File an enquiry" renamed, and made much deeper **ACCEPTED, SCOPED**

**Renamed to `Add enquiry`.** You are right that "File" is wrong.

**On depth: you are right that more detail converts better, and there is a trap.** A twenty-field form on a live call means the telecaller stops typing and starts talking, and fills it in afterwards from memory. **The data then looks complete and is partly invented.**

**So: two stages, one screen.**

**Stage 1 · Capture, four fields, saves immediately**
Phone (duplicate check) · Name · Model interest · Source
**The enquiry exists and has an owner from this point.** Nothing can be lost.

**Stage 2 · Qualify, on the same screen, saved as it is filled**

| Group | Fields |
|---|---|
| Vehicle | Variant · colour · alternative choice (R5) |
| Intent | Expected booking date · expected delivery date |
| Buyer type | First time · additional · replacement · **exchange** |
| Exchange | Car to exchange · evaluation needed · evaluation date · **at showroom or at customer's place** |
| Meeting | Showroom visit or home visit · date and time |
| Test drive | Needed · preferred date |
| Finance | Needed · bank preference · **EMI calculated inline** (R11) |

**Every one of these is a controlled list or a date, not free text**, because each will end up in a `GROUP BY`.

**Progress is visible and the enquiry is usable at any point.** A half-qualified enquiry is worth far more than a lost one.

### R31 · The stage ladder visible on list and record **ACCEPTED**

A horizontal ladder with the current stage lit, on the row and at the top of the record. Nine stages, per C4.

### R32, R33 · Permanent enquiry number, searchable **ALREADY BUILT**

### R5 · Quick actions on a lead **ACCEPTED**

WhatsApp the brochure · send the price · send a quotation · **add an alternative choice and send that too.**

**One rule attached:** each of these is a **consent-checked** action. A customer who agreed to a sales enquiry has agreed to receive these; one who has withdrawn has not, and the button refuses with the reason.

### R11 · EMI calculator with live bank rates **ACCEPTED, WITH ONE HARD LIMIT**

> *All the rates should be automatically updated by the AI.*

**No. Not by a model.**

An interest rate quoted to a customer is a commitment a dealership can be held to. **A model that infers a rate will eventually infer a wrong one, and the dealer finds out when a customer arrives holding a printout.**

**What I will build:**

- A **maintained rate table**: bank, product, tenure band, rate, processing fee, **and the date it was confirmed.**
- **The date is shown next to the rate, always.** *"HDFC 9.15%, confirmed 24 August."*
- Monthly refresh **proposed** by an agent from published sources, **approved by a human** before it goes live. Same pattern as the price master.
- The EMI calculator sits **inside the enquiry form and inside the console**, so it never requires leaving the call.

**A rate with a date on it is worth having. A rate a model guessed is a liability.**

---

# §6 ACCEPTED · ASSIGNMENT AND ROUTING

### R19 · Two assignment modes **ACCEPTED**

Chosen by the **digital marketing / telecalling manager**, per source or per branch.

| Mode | How it works |
|---|---|
| **Direct** | Telecaller picks the receiving executive. Default |
| **Pool** | Telecaller assigns to a **branch or location**. Everyone on that team is notified. **First to claim owns it** |

**Reassignment** by team leader, manager, GM/VP or dealer principal, **always with a reason**, always a ledger row.

**One thing to build with the pool mode:** an unclaimed pool lead must **escalate on a clock**, or a lead everyone can take becomes a lead nobody takes. Unclaimed after the first-response window, it auto-assigns by the rule and the team leader is told.

### R22 · Manager lead upload, department scoped **ACCEPTED**

A service manager uploads service-due data; it lands only in service. **Every lead carries a visible label: `Pushed from telecalling` or `Uploaded by manager`, with the batch name and date.** A service telecaller must be able to tell them apart at a glance, because they are different conversations.

### R20 · Meta, Google and other platforms drop straight in **ALREADY SPECIFIED**

### R15 · No cross-visibility once assigned **ALREADY RULED**

---

# §7 ACCEPTED · SCORING AND MOTIVATION

### R16 · The score wallet, with movement **ACCEPTED**

Points animate into a visible wallet. Positive in `--arth-settled`, negative in `--arth-overdue`. A monthly list of every point earned and lost, **each naming the action that caused it.**

**One rule: the wallet shows the movement, never a running total that jumps.** A figure that changes without an explanation next to it is the count-up defect in a different form.

### R23 · AI lead score from calls and messages **ACCEPTED, SCOPED, AND WATCH IT**

> *AI converts audio to text, understands the update, tracks the messages, analyses until conversion, final score recorded.*

**Genuinely valuable, and the single easiest feature on this list to lose trust with.**

**Two rules, both non-negotiable:**

1. **The score must show its reasons.** *"Rising: asked about finance twice, requested a test drive, mentioned a deadline."* **A number with no reasons attached is a number a floor stops believing in a fortnight**, and once they stop believing it they stop believing the rest of the product.
2. **It never overrides a human.** It ranks and it flags. **It does not close a lead, does not reassign, and does not change a difficulty band.**

**It depends on telephony and transcription** (R9), so it arrives after them.

### R18 · The welcome screen at login **ACCEPTED, SCOPED**

> *A pop-up before the actual screen, welcoming me with a positive quote based on my performance and what is there to complete today.*

**The instinct is right and the format needs care.**

**What I would build:** not a pop-up over the screen, but **the first thing on the landing screen**, once per day, dismissible, and it does not block the queue behind it.

**Three parts:**
1. **What is genuinely good** — *"You closed 19 of 24 yesterday. Best on the floor."*
2. **What today holds** — *"6 late, 12 due. Meera Joshi first."*
3. **One line of encouragement.**

**And the honest constraint: it must never invent a positive when there is not one.** A person who had a bad day and gets told they were wonderful learns the product is not telling the truth, and then does not believe the rest of it either. **On a bad day it says something true and forward-looking** — *"Yesterday was hard. Today has 12 due and 4 of them are warm."*

**Silence when nothing is wrong is a standing rule. This is the one exception, and it is once a day.**

---

# §8 ACCEPTED · ACCESS, ANALYTICS AND ACCOUNTS

### R24 · Analytics deepening with seniority **ACCEPTED**

| Tier | Gets |
|---|---|
| Executive | Own numbers only. No money |
| Team leader | Team, process measures, discount approvals |
| Manager | Floor, response times, why we lose, source absorption |
| GM/VP | Department across branches, conversion, cost per booking |
| **Dealer principal** | **Everything, including money, margin and cost** |

### R25 · Money visible only to the principal, grantable downward **ACCEPTED, ONE CORRECTION**

Cost per lead, cost per conversion and margin sit with the principal, **and he can grant any of them to a named role.** Every grant writes a row and is reversible.

**One correction to your note:** **product and insurance margin currently sits with dealer admin, not the principal.** That was deliberate, and if you want the principal to hold it instead, say so and I will change it. **The two roles are often the same person, and when they are not, this matters.**

### R21 · A separate Advito account for dealer setup **ACCEPTED**

**Added: `Advito Onboarding`.** Fourth Advito surface. Provisions a dealer end to end, sees configuration and no customer data, **and every action is visible in that dealer's own audit log.**

**Advito Master stays yours alone**, and holds pricing, margin and cost to serve.

---

# §9 ACCEPTED · INTERFACE

| | Item | Note |
|---|---|---|
| **R26** | Frequently used actions never buried | Standing principle. Every screen has one primary action, reachable without scrolling |
| **R28** | Calendar opens on clicking anywhere in the field | Accepted. Not only the icon |
| **R29** | Profile photo, editable name | Accepted. Role, scope and working hours stay read only, set by the admin |
| **R30** | Two login methods | Mobile + OTP, or username + password |
| **R30b** | Forgot password notifies the manager | Accepted. **The manager sets a temporary credential; the person must change it on first use.** Never a manager knowing a live password |
| **R34** | Push notifications for major actions | Web push, since no native app this cycle. **Only the two that cannot be switched off, plus commitments due** |
| **R35** | WhatsApp number captured, important notices sent there | Accepted. Utility-category messages, and **the person chooses which categories** |

---

# §10 WHAT THIS DOES TO THE PLAN

**Nothing here changes the current cycle.** The telecalling floor ships as scoped: seven screens, no telephony, no points.

**What changes is what comes after it, and the order.**

| | Next | Why here |
|---|---|---|
| **1** | Add enquiry, deep version (R27) | Telecalling's own screen. Highest conversion value per hour of work |
| **2** | Assignment modes (R19) and labels (R22) | Completes the front door. Unblocks every downstream department |
| **3** | **Telephony: dialler, recording, duration** (R9) | Now blocks three features, not one. **Choose the provider this week** |
| **4** | Points, positive and negative (R16, C2) | Immediately after duration. Never before |
| **5** | Price master and EMI (R3, R11) | Needs the rate table maintained first |
| **6** | Sales workspace | The first receiving department |
| **7** | AI lead score (R23) | Needs transcription, so it needs 3 |

**And one thing for you this week, unchanged and now more expensive to delay:** the telephony provider. **It was gating the points engine. It now gates recordings, downstream listening, duration, points and the AI lead score.** Five features behind one decision that has been open for weeks.

---

*Register of 29 August 2026. Every item captured. Four collisions marked for your ruling: insurance ranking, negative scoring, HR and accounts, and the stage names. Nothing has been quietly dropped or quietly accepted.*
