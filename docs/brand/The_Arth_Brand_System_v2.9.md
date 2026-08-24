# THE ARTH BRAND SYSTEM

**Version 2.9 · August 2026 · Advito Global · Internal**

Identity, interface, language and governance. One book.
The enquiry accountability platform for automobile dealer groups.

Supersedes Brand Guide Vol 1 (v1.1), Vol 2 (v1.0) and this book at v2.0 through v2.8.

Companion file: `brand/arth-palette.json` v1.2.0 — the machine-readable source of truth
for every colour value. This document's colour tables are generated from it.

---

## Contents

| Part | | |
|---|---|---|
| **0** | How to use this book | Who reads what · decision rights |
| **1** | Foundation | The name · vision · five principles |
| **2** | Brand architecture | Master brand · descriptors · tiers · endorsement |
| **3** | Identity | Mark · colour · type · fonts · the rule · icons |
| **4** | Language | Voice · vocabulary · operator screens · AI governance |
| **5** | Interface | Shells · cards · day panel · data · accessibility |
| **6** | Tenancy and partners | Tenant limits · white-label · co-branding |
| **7** | Communications | Social · email · print · video · photography · sales |
| **8** | Legal and intellectual property | Trademark · copyright · consent · claims · incidents |
| **9** | Operations | Tokens · assets · rejected decisions · audit |
| — | Appendix | Measured contrast — every pairing, computed |

*Nobody reads this cover to cover except Brand. Part 0 has a reading path for each team:
Engineering / IT · Social media · Creative · Production · Sales.*

---

## PART 0 — How to use this book

This is the single source of truth for the Arth brand. It replaces Brand Guide Volume 1 and Volume 2, which are withdrawn on publication of this document.

## What this book is

Arth is the enquiry accountability platform for automobile dealer groups. This book governs how it looks, how it speaks, how it is built and how it is sold. If a decision about appearance, wording or naming is contested, the answer is here. If it is not here, it goes to Brand before it ships.

Every rule in this book exists because of a decision that was already made. Nothing is aspirational. Where a rule does not yet exist, it appears in the Deferred Register in Part 9 with the reason and the trigger for writing it — so that an absence is visibly a decision rather than an oversight.

## Who reads what

Nobody reads this cover to cover except Brand. Find your row.

| Team                                 | Read in full                                                                                | Reference when needed                                                                                                                                     |
|--------------------------------------|---------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------|
| **Engineering / IT**                 | Part 3 Identity · Part 5 Interface · Part 6 Tenancy · Part 9 Operations                     | Part 4 for all UI copy and AI output rules. Part 2 for naming anything in code. Tokens in 9.1 are the only permitted source of colour and spacing values. |
| **Social media**                     | Part 4 Language · Part 7.1 Social · Part 7.5 Photography                                    | Part 3 for the mark, colour and type. Part 8 for what may and may not be claimed, and for client naming rules.                                            |
| **Creative / design**                | Part 3 Identity · Part 5 Interface · Part 7 Communications                                  | Part 1 for why the system is shaped this way. Part 2 before naming or lockup work. Part 6 for partner and tenant lockups.                                 |
| **Production (print, video, photo)** | Part 7.3 Print · Part 7.4 Video · Part 7.5 Photography · Part 9.2 Assets                    | Part 3.2 for colour, including CMYK and Pantone conversions. Part 8 for consent and usage rights.                                                         |
| **Sales**                            | Part 1 Foundation · Part 4.1 Voice · Part 7.6 Sales collateral                              | Part 2 for tier names. Part 8 for claims and boilerplate.                                                                                                 |
| **Everyone**                         | Part 1.4 The five principles. They decide arguments. Read them once and remember the order. |                                                                                                                                                           |

## Decision rights

| Area                                                                 | Owner                                                  | Escalation      |
|----------------------------------------------------------------------|--------------------------------------------------------|-----------------|
| Identity, voice, naming, brand architecture, external communications | Brand                                                  | CEO             |
| Interface application, tokens in code, component behaviour           | Product Engineering, governed by this book             | Brand, then CEO |
| Tenant configuration limits                                          | Brand sets the fence · Engineering enforces it in code | CEO             |
| Legal wording, trademark, consent copy                               | Brand + external counsel                               | CEO             |

A visual change that contradicts this book requires the same written sign-off as a database schema change. That is not a metaphor — it is the process.


#### Relationship to `VISUAL-DIRECTION.md`

This book governs appearance, wording and naming. `docs/design/VISUAL-DIRECTION.md` is subordinate to it and is reduced to the product-specific rules this book does not cover. **Where the two disagree, this book wins.** Adopted by Decision Memo 10, 10 August 2026.


## A test for every rule in this book


#### A safeguard whose safe path does not exist is not a safeguard. It is a pressure.

Before a rule forbids something, check that the permitted alternative it points to actually exists. A rule that says *do not do X, do Y instead* where Y has not been built does not prevent X — it makes X the only available action while declaring it wrong, which trains people to work around the book.


This was found in this book rather than reasoned about in advance. 4.4 forbids Arth from generating a reason a customer did not buy *unless a human recorded it*, and no field existed for a human to record one. The rule was not protecting anything; it was creating pressure to infer what it forbade inferring. See 4.3.

**Applies to every rule written from here.** When a rule names an alternative, the alternative is either shipped, or the dependency is recorded beside the rule as 4.3 now records its own.

**The test asks two things, not one.** Does the alternative exist — and can the person bound by the rule reach it? A rule pointing at an artefact that exists but has not been delivered fails in the same way as one pointing at an artefact never built. The reader cannot act either way, and the difference is invisible from where they sit. **Existence is the author's answer; reachability is the reader's, and the reader's is the one that governs.**


**The test caught its author on first use.** The triggered review written into 4.3 in the same revision as this test points at a query that does not exist — nothing counts recurring text or raises anything. Brand had replaced a review nobody performs with a review nothing raises, which is the quieter failure and therefore the worse one. The dependency is now recorded at 4.3. Noted here because a test that only ever catches other people is not being applied.


## Proposing a change

Open a pull request against the brand repository. State the rule being changed, the reason, and which of the five principles supports it. Token changes are reviewed like schema changes. Reviewed quarterly alongside the external requirements review: colour and type do not change; applications and examples are added as the product grows.

## When to stop revising

This book was revised nine times in two days. Every revision closed something real, and the sequence still had to be stopped — because the returns had moved into the book's own machinery, and because a book that runs far ahead of the product starts documenting decisions about things nobody has built. **That is the aspirational writing Part 0 forbids, arriving by a route nobody watches.**

**The rule: a revision should arise from something built, not from something written.** A screen rendered, a rule meeting the person it governs, an instrument catching something in production. A revision whose only source is the previous revision is a signal to stop.

Reviewed quarterly regardless, per the cadence below.

## Version

THE ARTH BRAND SYSTEM · VERSION 2.9 · AUGUST 2026 · ADVITO GLOBAL · INTERNAL
Supersedes Brand Guide Vol 1 (v1.1), Vol 2 (v1.0) and this book at v2.0 through v2.8. Three contrast corrections previously carried as errata are absorbed into the body. Change history is in Part 9.4; decisions considered and rejected are in Part 9.6.


## PART 1 — Foundation

### 1.1  The name is the strategy


अर्थ — artha

One of the four Puruṣārthas of Sanātana Dharma. The pillar concerned with material prosperity and the means of livelihood, earned by legitimate means.


The word carries two senses at once: **meaning**, and **wealth**. A dealership's enquiry data has always had both and delivered neither — thousands of records that mean nothing and produce no traceable money.

This is not decoration on top of a software product. It is the product's thesis, and it governs every design decision in this book. Arth exists to give a dealer's numbers meaning, and to trace them to wealth.

#### What follows from the name

| Principle                 | Consequence                                                                                            |
|---------------------------|--------------------------------------------------------------------------------------------------------|
| **Legitimacy matters**    | Artha is wealth earned properly. Arth records who did the work, honestly, and will not flatter anyone. |
| **Purpose over activity** | Forty calls is activity. One delivered car is artha.                                                   |
| **Permanence**            | A record that can be quietly rewritten has no meaning. Nothing in Arth is silently edited.             |

### 1.2  Vision, mission, position

|              |                                                                                                                                                                |
|--------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **Vision**   | An Indian automobile retail industry where no rupee of marketing spend is untraceable, no enquiry is unowned, and no promise made to a customer is unrecorded. |
| **Mission**  | To connect the money leaving a dealer's bank account to the car leaving his showroom — and to name who was responsible at every step in between.               |
| **Position** | The enquiry accountability system for dealer groups. Not a CRM. A CRM reports what happened; Arth holds people to account for it.                              |

### 1.3  The line


Other systems tell you your telecaller made forty calls. Arth tells you those forty calls cost ₹9,200 and produced one delivered car.


The single line that should survive every rewrite of our marketing. If a piece of communication does not eventually arrive at this idea, it is off-brand.

### 1.4  Five design principles

These decide arguments. When a design choice is contested, **the principle higher on this list wins.**

#### 1. Evidence, not assertion

Every claim carries its number, its source and its date. We do not use superlatives we cannot substantiate. Visually this means data is never decorated — no gradients on charts, no 3D, no glow.

#### 2. Silence when nothing is wrong

A screen covered in coloured alerts trains people to ignore alerts. Arth shows what needs a decision and stays quiet otherwise. Colour is a scarce resource, spent only where money is at stake.

#### 3. Permanence over polish

The interface should feel like a bound ledger, not a dashboard. Rules and edges rather than shadows and float. Nothing should look like it could be swiped away.

#### 4. Built here, for here

Indian scripts are first-class, never an afterthought bolted onto a Latin design. Rupees, lakhs and crores are native units. The vernacular of the showroom floor is our vocabulary.

#### 5. Respect the operator

A telecaller looks at this for nine hours. A dealer principal looks at it for ninety seconds. Both deserve a screen built for their actual day — high legibility, low fatigue, no cleverness.


#### The tiebreaker

When two principles conflict, ask which choice a sceptical dealer principal would call honest. Arth's whole commercial position rests on being the vendor that does not flatter. Losing that costs more than any feature gains.


## PART 2 — Brand architecture

How Arth behaves as it grows across verticals, tiers and modules. Read this before naming anything.

### 2.1  The master brand rule

There is one brand: **Arth**. It is always lowercase in the mark, always with the rule. **It never takes a vertical suffix, a product suffix or a tier suffix as part of the mark.**

Arth is monolithic. Every vertical, module and tier rides one name, one trademark and one visual system. A prefix would create sub-brands, and sub-brands fragment spend.

### 2.2  Vertical descriptors

The market a deployment serves is expressed as a descriptor line, never as part of the name.


arth   for auto retail

arth   for real estate

arth   for healthcare


| Attribute | Specification                                                                                 |
|-----------|-----------------------------------------------------------------------------------------------|
| Typeface  | IBM Plex Sans 400, sentence case                                                              |
| Colour    | Slate on light. Brass Lift on Ink.                                                            |
| Size      | 0.5× the wordmark cap height                                                                  |
| Position  | Right of the mark on the baseline, outside the clear space — or beneath it in stacked lockups |
| The rule  | **Never extends over the descriptor.** The rule belongs to the word *arth* alone.             |

The descriptor is marketing copy. It is not trademarked and can change without touching the identity, the filing or the domain.

### 2.3  Modules and workspaces

Modules, workspaces and departments take plain descriptive names — Sales, Service, Insurance, Used Cars, Delivery. They are not products. They receive no marks, no logos and no capitalisation mid-sentence.

|                                                                                                |                                                                                       |
|------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------|
| `WRITE`the insurance workspace · the service queue · the delivery stage | `NEVER`Arth Insurance™ · ArthService · the Arth Delivery Module |

#### Named features

Exactly one exception is permitted. A feature may carry a proper name only if a dealer principal would say it aloud unprompted. Currently there is one:


**The Exception Cockpit** — the management screen that ranks, by rupee value, everything in the group that needs a decision today. Shell C in Part 5.2. It is capitalised, it is never abbreviated, and it is never called a dashboard.


A second named feature requires written sign-off from Brand and the CEO. Products die of nomenclature bloat.

### 2.4  Tier nomenclature

| Tier     | Written as            | Never                                          |
|----------|-----------------------|------------------------------------------------|
| Entry    | **Arth Essential**    | Arth Lite, Arth Starter, Arth Basic, Arth Free |
| Standard | **Arth Professional** | Arth Pro Max, Arth Plus, Arth Advanced         |
| Top      | **Arth Enterprise**   | Arth Ultimate, Arth Premium, Arth Unlimited    |

Tier names are set in IBM Plex Sans, never in Anek at display size, never coloured Brass, and never appear in or near the mark. In the interface a tier is a label, not a badge.

### 2.5  The Advito endorsement

Arth is the customer-facing brand. Advito Global appears only as an endorsement line:


An Advito Global product


| Rule       | Detail                                                                                              |
|------------|-----------------------------------------------------------------------------------------------------|
| Setting    | IBM Plex Sans 400, 10pt maximum, N60                                                                |
| Placement  | Footer only — website footer, deck closing slide, brochure back page                                |
| Never      | Login screen · app chrome · business card face · any lockup adjacent to the mark · any social asset |
| Retirement | Removed at 20 reference customers                                                                   |

#### Addresses and domains

Customer-facing addresses are `@arthcrm.com`. Advito addresses are used for Advito business only. One person may hold both; **they are not interchangeable on a given artefact.** An Arth business card carries an Arth address.

### 2.6  What is never sub-branded

- Modules, workspaces, departments, stages, queues
- Reports, exports, or any document the product generates
- Integrations — "the DMS integration", not "ArthConnect"
- Internal tools, environments or repositories
- Anything a customer will not see


## PART 3 — Identity

### 3.1  The mark

In Devanagari every letter hangs from a horizontal line — the **shirorekha**. It is the script's defining feature: the line comes first, and the letters are suspended from it. In accounting, a total is ruled. A single line under a figure means it is summed; a double rule means it is final and closed.

Arth's mark applies the shirorekha to Latin letters. The word *arth* is set in lowercase and hangs from a solid rule. It reads simultaneously as a Devanagari construction, a ledger total, and the beam of a weighing scale.


arth


It is deliberately not a symbol. A dealer principal has been shown a hundred abstract swooshes. A ruled word looks like a document, which is exactly what Arth is.

#### Construction

| Element       | Specification                                                                                                           |
|---------------|-------------------------------------------------------------------------------------------------------------------------|
| Typeface      | Anek Latin SemiBold, width axis 90                                                                                      |
| Rule weight   | 7% of cap height                                                                                                        |
| Rule position | 0.22 × cap height above the x-height line                                                                               |
| Rule width    | Full advance width of the word — never wider, never narrower                                                            |
| Case          | Always lowercase                                                                                                        |
| Clear space   | The height of the letter **a** on all four sides. Nothing enters it — no tagline, no rule, no photograph edge.          |
| Minimum size  | Wordmark 22px on screen, 16mm in print. Below that the rule breaks up — use the square monogram. Monogram minimum 16px. |

PRODUCTION NOTE — the master is currently set type. Before trademark filing it must be redrawn and outlined so the mark is artwork rather than a font rendering. Until then, do not scale below 22px and do not send to a printer without Brand review.

#### Correct and incorrect use


`CORRECT` Ink on light · white on Ink · Ink on Brass
Rule always Brass on light and dark grounds; Ink when the field is Brass
Always lowercase, always with the rule
**The rule is not optional — it is the mark**
`NEVER` Never capitals, never another typeface, never italic
Never a gradient, shadow, outline, bevel or glow
Never on a photograph without a solid Ink panel behind it
Never stretched, rotated, or with the rule's weight or width altered


### 3.2  Colour

Two brand colours, one neutral ramp, two semantic states. Deliberately small — a palette this restricted is what makes a single Brass mark on a screen mean something.

#### Core


**Ink**
`#0F2A33`
The primary. Ledger ink — a deep petrol that is neither corporate navy nor harsh black. All headings, all body text, all primary surfaces. **If in doubt, use Ink.**


**Brass**
`#B07F2C`
The accent. The brass of a shop weighing scale and a temple vessel — prosperity, measurement, artha. Means one thing only: **money is at stake here, look.**


**Slate**
`#2E5C68`
Structural secondary. Eyebrows, labels, secondary rules, chart series two. Never large fills — a supporting voice, not a brand colour.


**Brass Deep**
`#8F6620`
The only brass permitted as text. 5.14:1 on white. Used where brass must carry a word.


**Brass Lift**
`#D0A155`
Brass on dark grounds. 6.37:1 on Ink.


**Ink Deep**
`#08191F`
Code blocks and the deepest panels only.


#### Neutrals — desaturated Ink, never pure grey

|                                                       |                                           |                                                                                                                                                                                                                             |                                           |                                                       |                                           |                                                       |                                           |
|-------------------------------------------------------|-------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------|-------------------------------------------------------|-------------------------------------------|-------------------------------------------------------|-------------------------------------------|
|  | **N00** `#FFFFFF` |                                                                                                                                                                        | **N05** `#F1F4F4` |  | **N10** `#E3E9E9` |  | **N20** `#C9D3D4` |
|  | **N40** `#9FADB0` |                                                                                                                                                                        | **N50** `#748689` |  | **N60** `#5A6C71` |  | **N80** `#47585D` |
|  | **N90** `#263D45` | Every neutral is Ink with saturation removed, so the whole system shares one hue family. **Pure or warm greys are off-brand** — they make Brass look dirty. N50 is the control-border value; N60 is the caption-text value. |                                           |                                                       |                                           |                                                       |                                           |

#### Semantic — only two states


**Overdue**
`#B23B2E`
A commitment has been broken — an SLA breached, a delivery date missed, a lead untouched past its window. Deep lac red, not emergency red. Used rarely enough that it still startles. Wash `#F6E3E0`


**Settled**
`#27735A`
Confirmed, delivered, closed, paid. Deep verdant, never a bright SaaS green. Confirmation should feel like a stamp, not a celebration. Wash `#DEEDE7`


#### Usage rules

| Rule                                | Detail                                                                                                                                                 |
|-------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------|
| **Brass is never body text**        | 3.55:1 on white — below the 4.5:1 floor. Brass is for rules, fills, icons, single figures and the mark. Where brass must carry a word, use Brass Deep. |
| **The 90/8/2 split**                | Roughly 90% neutral, 8% Ink, 2% Brass on any screen. If Brass occupies more than a fiftieth of a layout, something is wrong.                           |
| **Semantic colour never decorates** | Overdue and Settled appear only where they state a fact about a record. Never for visual interest, category coding or charts.                          |
| **No gradients, anywhere**          | Not in the UI, not in charts, not in marketing. A ledger does not have gradients.                                                                      |
| **Contrast floor**                  | 4.5:1 for text, 3:1 for interface elements and chart strokes. Every pairing is measured in the Appendix.                                               |


#### Why there is no amber warning state

Most operational software uses a red / amber / green traffic light. Within weeks every screen is half amber and the signal is worthless — the exact failure the Exception Cockpit was designed to avoid. Arth expresses urgency through **position and weight**, not through a third colour.

**"Position and weight" is specified, not left to interpretation.** A queue that must convey "due soon" uses all four of the following together, and none of them alone:

| Instrument             | Specification                                                                                                                                           |
|------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------|
| The interval, in words | "in 2h", "in 4 days" — set in Mono, right-aligned. The number is the signal.                                                                            |
| Order                  | The queue sorts by deadline. Nearest to the top. This is the primary instrument.                                                                        |
| Typographic weight     | The record name escalates 400 → 500 → 600 as the interval closes. Weight is legible at scanning distance and does not compete with the semantic states. |
| Breach                 | On passing the deadline the row becomes **Overdue** — the existing semantic state. Nothing new is introduced.                                           |

Where a "needs attention" signal is genuinely required outside a queue it is Brass, which unifies accent and warning under one honest meaning: there is money here.


### 3.3  Typography

Three faces, three jobs. All open source, all free to embed, all with genuine Indic support.


Face
Job
Note


**Anek Latin**
Display
Headings, the mark, large figures
Ek Type, Mumbai. A ten-script superfamily where Devanagari, Kannada and Latin were designed simultaneously rather than matching Indic to a pre-made Latin. Width axis 90 for headings, 100 for everything else.


**IBM Plex Sans**
Interface
Body, labels, buttons, tables
Engineered rather than friendly, with excellent tabular figures and long-session legibility. Weights 400 / 500 / 600 only — never 300, never 800.


**IBM Plex Mono**
Data
Chassis numbers, enquiry IDs, timestamps, audit entries, dense amounts
The ledger voice. **Anything a person might read aloud to verify a record is set in Mono.**


#### Type scale

| Role    | Size / weight    | Use                                        |
|---------|------------------|--------------------------------------------|
| Display | 44 / 600 / w90   | Page title                                 |
| H2      | 28 / 600         | Section heading                            |
| H3      | 20 / 600         | Card heading                               |
| Body    | 16 / 400         | Default reading size for prose             |
| UI      | 14 / 400–600     | Interface default — tables, forms, buttons |
| Caption | 12.5 / 400       | Secondary detail and helper text           |
| Eyebrow | 11 / 600 / .16em | Category label, uppercase                  |
| Data    | Mono 12.5        | IDs, timestamps, audit entries             |

#### Rules


`ALWAYS` Tabular lining figures on every number — `font-variant-numeric: tabular-nums`
Indian digit grouping — ₹12,00,000, never ₹1,200,000
Sentence case for headings and buttons
`NEVER` Never all-caps beyond a three-word eyebrow
Never a fourth typeface. Never Inter, Poppins, Montserrat or Roboto
Never letter-spacing on body text; never negative tracking below 20px
Never italic in the interface — italics are for prose only


#### Multi-script

Kannada ships first, then Hindi. Because all three scripts share one skeleton, a screen switched to Kannada keeps its typographic voice instead of looking like a translation.

ENGINEERING — verify Indic conjunct shaping on a real screen at 44px before any Kannada or Hindi screen ships. Broken conjuncts are the most common failure mode in multi-script products and would contradict Principle 4 directly.

#### Delivery — ruled 10 August 2026

The three families are self-hosted, not taken from a system stack. Anek is load-bearing for Principle 4: a system stack supplies whatever Kannada font the device happens to carry, which will not share a skeleton with the Latin, and will make every Kannada screen read as a translation. **This was weighed against bandwidth on a slow dealership connection and the typeface won,** with the following mandatory savings:

| Constraint           | Specification                                                                                                                                              |
|----------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Script subsetting    | **Latin and Kannada only.** Devanagari is not shipped until Hindi ships. Roughly halves the payload.                                                       |
| Width axis           | **Static instances at width 90 and 100 only** — not the variable axis.                                                                                     |
| Character subsetting | Subset to the characters actually used, per build.                                                                                                         |
| Loading              | WOFF2, self-hosted, `font-display: swap`, with the previous system stack declared as the fallback so first paint is never blocked. |
| The mark             | SVG, per 9.2 — it renders before any font loads. Swap is therefore safe for the wordmark.                                                                  |
| Budget               | Measured byte cost reported at the Phase 4 close gate. **If it breaches, we subset harder. We do not abandon the typeface.**                               |

### 3.4  The rule — our structural device

The same stroke that sits above the wordmark organises every layout. **A 2px Brass rule sits above a heading, never below it.**

Almost every brand underlines. Arth overlines, because that is what Devanagari does and what a ledger does before a total is entered. It is a small inversion, and it makes a page recognisable at a glance from across a room.

| Variant                 | Use                                                        |
|-------------------------|------------------------------------------------------------|
| **72px section marker** | Above section and card headings                            |
| **Full-width rule**     | Above major divisions and dark panels — 100% of the column |
| **Ink rule**            | Where Brass would be too loud, and above table headers     |

**Always 2px.** Brass on light surfaces, Brass on Ink, Ink on Brass. Two lengths only — 72px or full column. Never any other length, never diagonal, never dotted, never a gradient.

### 3.5  Elements and patterns

| Element              | Specification                                                                                                                                                                  |
|----------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **The Ink panel**    | The brand's strongest device after the rule. For a single idea that must land — a quote, a warning, a principle. **One per screen or page.** Two competes; three is wallpaper. |
| **The number block** | Figure in Anek 600, label beneath in 12px N60. Never the reverse order, never a large label above a small number.                                                              |
| **The stamp**        | For closed, settled and delivered records on printed and PDF output only — never in the interface. A slight rotation is permitted here and nowhere else in the system.         |
| **The ledger field** | A ruled field, 22px pitch, N10 lines. Background on covers, dividers and the back of printed pieces. Never behind live text.                                                   |

### 3.6  Icons

| Attribute | Specification                                                                               |
|-----------|---------------------------------------------------------------------------------------------|
| Grid      | 24 × 24, live area 20 × 20 with a 2px margin. Drawn on whole and half pixels only.          |
| Stroke    | 1.5px, square caps, mitre joins. No fills, no two-tone, no rounded caps.                    |
| Colour    | Ink by default, N60 when inactive, Brass only when the icon marks something needing action. |
| Balance   | Optically balanced within the 20px live area, not mathematically centred.                   |
| Export    | SVG with `currentColor` so a single file serves every state.        |

#### The set

Enquiry · Call · Test drive route · Job card · Delivery/key · Vehicle · Policy · Ledger · Accountability · Service bay · Owner · SLA clock · Escalate · Attribution link · Consent · Amount

Drawn from the dealership's own objects — a job card, a key, a challan, a bay, a scale — rather than generic software abstractions. **One idea, one icon:** if two screens mean the same thing they use the same icon, always. New icons go through review.

|                                                                                                    |                                                                                                                                                                                                                                |
|----------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `DO`Pair with a label wherever space allows. An unlabelled icon is a guess. | `NEVER`Never mix a filled icon into the set for emphasis — use colour. Never a steering wheel, speedometer, chequered flag or chrome badge. Never an AI sparkle. Never an emoji standing in for an icon. |

### 3.7  What Arth never looks like

Every competitor in this market has made the same visual choices. Making them too would waste the only cheap differentiation available to us.

| Not                   | Meaning                                                                                                                                                                                                                                                                                              |
|-----------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Not generic SaaS      | No cobalt-blue gradients, no floating 3D cards, no isometric illustrations of people pointing at charts, no purple.                                                                                                                                                                                  |
| Not automotive cliché | No speedometers, chequered flags, speed lines, chrome, car silhouettes or steering wheels.                                                                                                                                                                                                           |
| Not devotional        | The name is rooted in Sanātana Dharma; the identity is not religious. No saffron, no diyas, no mandalas, no om. **The philosophy shows in the discipline, not the decoration.**                                                                                                                      |
| Not startup-cute      | No mascots, no emoji, no rounded bubble type, no confetti on success, no "we're on a mission to disrupt".                                                                                                                                                                                            |
| Not stock photography | No handshakes, no diverse teams laughing at laptops, no gleaming showrooms shot in California.                                                                                                                                                                                                       |
| Not Amazon            | The dark-plus-warm-metal pairing is close to Amazon's at a glance. Our separation comes from proportion and from the mark, so both are protected: **the rule is never curved, never given a terminal or arrowhead, and never placed below the word.** Brass never exceeds the 90/8/2 ratio. See 9.6. |
| Not AI-branded        | No sparkle icons, no glowing orbs, no neural-network motifs. Arth uses AI where it pays; it does not sell AI.                                                                                                                                                                                        |


## PART 4 — Language

### 4.1  Voice

Arth speaks the way a good auditor speaks: precise, unhurried, unimpressed, and never unkind.

| Quality        | Meaning                                                                                          |
|----------------|--------------------------------------------------------------------------------------------------|
| **Plain**      | Short sentences. Ordinary words. If a dealer principal would not use the word, we do not use it. |
| **Specific**   | "₹4.2 lakh at risk across 7 bookings" — never "several issues detected".                         |
| **Direct**     | We say what is wrong and who owns it. We do not soften a number to protect anyone.               |
| **Never smug** | Arth reports failures without commentary. No congratulation, no scolding, no exclamation marks.  |


`WE WRITE` "11 enquiries at Whitefield have had no contact for over 48 hours."

"This campaign has spent ₹38,000 and produced no bookings in 21 days."

"Delivery moved to 22 August. Finance disbursement is pending."

"You cannot reduce this plan below the tenant's current usage."
`WE NEVER WRITE` "Oops! Something went wrong 😕"

"Supercharge your dealership with AI-powered insights!"

"Great job team — you're crushing it this month!"

"Leverage our robust, end-to-end, next-generation platform."


### 4.2  Controlled vocabulary

One word per idea, product-wide. This table is binding on the interface, the marketing site, the sales deck and the documentation.


#### Scope — this binds what the product says, not what the code is called

**Changes:** visible copy, labels, headings, prompts, empty states, error text, notifications, exported reports, marketing and sales material.

**Does not change:** database models, schema, ledgers, function names, directory names, routes, lint rules or tests. A repository-wide rename on the strength of this table is **refused** — it would touch append-only ledgers and the projections rebuilt from them.


| Use                       | Never                          | Definition                                                                                                                                                         |
|---------------------------|--------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **Enquiry**               | lead, prospect, query          | A person who has expressed interest in a vehicle. The unit Arth is built around. "Lead" is permitted only in the phrase "lead source" and in advertising contexts. |
| **Dealer principal**      | owner, DP, boss                | The person who owns the dealership business. Our primary buyer.                                                                                                    |
| **Branch**                | rooftop, outlet, location      | One physical showroom or workshop. "Rooftop" is US usage and never appears in customer-facing copy.                                                                |
| **Group**                 | chain, network                 | A dealer principal's set of branches under one tenant.                                                                                                             |
| **Workspace**             | module, portal, section        | A department's configured view of the product — Sales, Service, Insurance, Used Cars, Delivery.                                                                    |
| **Stage**                 | status, phase, step            | Where an enquiry sits in the pipeline. An enquiry has one stage at a time.                                                                                         |
| **Settled**               | completed, done, success       | Confirmed, delivered, closed or paid. The positive semantic state.                                                                                                 |
| **Overdue**               | late, breached, alert, warning | A commitment has been broken. The negative semantic state.                                                                                                         |
| **Owner**                 | assignee, agent, rep           | The named person accountable for an enquiry right now.                                                                                                             |
| **Telecaller**            | CRE, agent, executive          | The role that works the queue. Used because it is what dealerships say.                                                                                            |
| **Cost per booking**      | CPA, CPL, cost per acquisition | Our headline metric. Never abbreviated.                                                                                                                            |
| **The Exception Cockpit** | dashboard, home, overview      | The only proper-named feature. See 2.3.                                                                                                                            |

### 4.3  Errors and empty states

An error says what happened and what to do — it does not apologise, and it never blames the user. An empty screen is an instruction, not a mood.

#### The error pattern — what happened · what it means · what to do

| Instead of             | Write                                                                                 |
|------------------------|---------------------------------------------------------------------------------------|
| "Invalid input"        | "Enter a 10-digit mobile number without the country code."                            |
| "Required field"       | "A lost reason is needed before this enquiry can be closed." **†**                    |
| "Error 403"            | "You can view this branch but not reassign its leads."                                |
| "Save failed"          | "Not saved — you are offline. This will send when you reconnect."                     |
| "Nothing to see here!" | "No enquiries are unassigned. New ones will appear here within a minute of arriving." |

### 4.5  The voice on a person's own screen

Ruled 16 August 2026. Part 4.1 governs what the product says *about work*. This section governs what it says *to the person doing it* — the screen a telecaller opens at nine and lives in for nine hours.


#### The voice extends here. It does not change.

Part 4.1 forbids *"Great job team — you're crushing it this month!"* That sentence fails because it claims something and shows nothing — Principle 1 — not because it is warm. The voice is described in 4.1 as **"never unkind"**, and **unimpressed is not the same as cold**. A screen a person works in all day may greet them and may tell them how their day went.


#### Two tests. A sentence must pass both.

| Test            | Question                                                                                                                                                                                                                                                               |
|-----------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **1. Evidence** | Does the sentence carry its number? If it makes a claim it cannot show, it is not written. This is Principle 1, unchanged.                                                                                                                                             |
| **2. Subject**  | **Is the claim about the work, or about the person?** Arth states facts about work. It never assesses a person. "You closed 14 of 16" is a fact and is permitted. "You're doing well" is an assessment and is not, even though both are kind and one carries a number. |

The second test is the one that will be failed by accident. A number does not make a sentence safe: `"Your conversion is below the branch average"` carries a figure and is still a judgement of a person wearing a statistic. Address the person as "you"; make the work the subject of the claim.

#### Examples

| Never — asserted, or about the person  | Write — evidenced, about the work                                  |
|----------------------------------------|--------------------------------------------------------------------|
| "Great work today!"                    | "14 of 16 follow-ups closed. Your two oldest are three days out."  |
| "You're doing brilliantly this month." | "Every follow-up due today was made."                              |
| "Don't worry, tomorrow is a new day."  | "6 of 14 closed. 8 carry into tomorrow, the oldest four days old." |
| "You're 7th of 12 on the floor."       | *Never on a person's own screen. See below.*                       |
| "Try to be faster tomorrow."           | "3 enquiries have been open longer than four days."                |

#### On a good day, and on a bad one

The satisfaction the product owner asked for arrives from the figure, not from being told. `"16 of 16 follow-ups closed. Nothing carries into tomorrow."` needs no congratulation attached to it; a person who did that work knows what the line means.

And on a bad day, **hope arrives as the next action being visible and finite** — not as consolation. `"4 of 14 closed. 10 carry into tomorrow, the oldest six days old."` is not unkind. It is the only sentence that lets someone start.


#### Never rank a person against named colleagues on their own screen

A telecalling floor of forty will be asked for a leaderboard. On a **management** screen, comparative performance is a management fact and belongs there. On a **person's own screen**, it is not accountability — it is a shaming instrument, and it converts a system built to find where money leaks into one that finds someone to blame. Principle 5 governs here: respect the operator.


#### What Arth will not do, even when asked

- **Tell a person how to be better.** The product owner asked for "clarity on what I can do better tomorrow". Arth answers that by showing what is outstanding and which item is oldest. It does not grade anyone, and it does not coach.
- **Predict an individual's performance.** Already forbidden under 4.4, and it applies here with force.
- **Soften a number.** 4 of 14 is 4 of 14. Rounding up to protect a feeling is the one thing this brand cannot do and remain worth anything.
- **Use an exclamation mark, an emoji, or a congratulation.** Unchanged from 4.1.


#### † The lost reason — a book rule ahead of its field, recorded 16 August 2026

The example above documents an error message for a control that does not exist. **The schema records `lostAt` and nothing records why.** Every enquiry closed as lost today is closed with no recorded reason. Part 0 states that nothing in this book is aspirational, so the dependency is recorded here rather than left to be discovered.

**Brand's position is that this is not a missing field but a missing answer.** Arth's whole position is enquiry accountability, and `lostAt` without a reason records that money left without recording where it went — at the single moment a dealer principal most wants to know. *Why we lose* is the question the product exists to answer.

It also silently undercuts 4.4. That section forbids Arth from generating a reason a customer did not buy *unless a human recorded it*. With no field for a human to record one, the rule is either moot or, worse, creates pressure to infer what it forbids inferring.

**Brand requirements when the field is built:**


Requirement
Specification


A closed list
Not free text. A reason that cannot be aggregated cannot answer the question, and forty telecallers typing prose produces nothing a principal can read. **Brand supplies the vocabulary under 4.2.**


**The block is absolute**
An enquiry cannot be closed as lost without a reason. A soft block is bypassed, and a field that aggregates nothing is worse than no field — it looks like data. **The objection is real and the answer is not to weaken the rule.** A telecaller closing forty enquiries wants two clicks, not three; the response is to make the third click cheap. A list of six to eight options is one tap. Engineer the cost down; do not concede the record.


**The list must include the honest unknown**
"No contact was ever made" and "Reason not known" are legitimate recorded reasons and must be on the list. **A forced choice with no honest escape produces false data, which is worse than absence** — someone picks the nearest wrong reason to get past the block, and the aggregate then reads as signal while being noise. This is Principle 1: a number we cannot stand behind is not evidence.


An "other" with required text
So the list can grow from what actually happens rather than from what Brand guessed.


**The review is triggered, not scheduled**
"Reviewed monthly" has no owner and does not happen; an unreviewed "other" quietly becomes the free-text field the rule exists to prevent. Trigger: any "other" text recurring **three or more times in a rolling month** raises a review to promote it to the list. The data raises the review; nobody has to remember.

**‡ The trigger is code, not policy.** Nothing currently counts recurring text or raises anything. Recorded under the Part 0 test in the same revision that introduced it — the rule is right and its mechanism does not exist. **It ships with the field or the rule is decoration.** Phase 5 work order.


**Owner**
**Brand owns this review outright.** An earlier draft read "Brand, with the Sales workspace owner", and that role has no named holder — a joint owner who is not a person is a vacancy, and Part 0's test applies to owners as much as to alternatives. Brand carries it alone until the CEO names a second, so there is never a gap rather than a gap that looks filled.


**The unknown rate is itself a measure**
"Reason not known" will be the fastest honest option on the screen, and a fast honest option becomes the default. Trading a field of wrong answers for a field of "don't know" leaves the question unanswered — visibly rather than invisibly, which is an improvement but not the goal. **The unknown rate is reported as a finding about the process, never about customers**: a third of lost enquiries closing as unknown is a telecalling and coaching finding, and one a dealer principal would want. A threshold that raises a review is to be set from the first month's actual figure — **it is not guessed in advance**, for the reason recorded against the amber threshold in 9.6.


**Never publish the breakdown without the unknown rate beside it**
This is 5.7 applied, not a new rule: *if a figure is incomplete, say so beside it. Never render an incomplete number as though it were final.* A lost-reason distribution drawn from a set that is 40% unknown is a biased sample, and `"our top loss reason is price"` stated from it is assertion, not evidence. **The unknown rate travels with every lost-reason figure, in every report, always.**


Raised as a Phase 5 requirement. Note that this is a **workflow change as well as a field** — blocking closure alters the disposition flow, and that is the half that will meet resistance.


### 4.4  AI output governance

Arth's first principle is evidence, not assertion. AI asserts. Every rule below follows from resolving that.


#### The governing rule

No AI-derived statement appears in Arth without its basis visible. If the basis cannot be shown, the statement is not shown.


#### Visual treatment

AI-derived content carries a 2px Slate left border and a Mono label reading `DERIVED`, followed by the input it was derived from. **It never receives Brass.** Brass means money is at stake and the figure is real — an inference may not borrow that authority.

#### Confidence

Confidence is expressed in words, never as a percentage. A percentage on an inference is false precision, and false precision is the opposite of this brand.

| Instead of                  | Write                                                                            |
|-----------------------------|----------------------------------------------------------------------------------|
| "Lead score: 87%"           | "High intent — test drive booked, finance enquiry made, two callbacks requested" |
| "94% confidence"            | *Delete. Show the evidence instead.*                                             |
| "AI recommends reassigning" | "This lead has had no contact for 61 hours. The branch average is 4 hours."      |

#### Where AI must stay silent

- A figure that will be read as fact without a computed source
- A reason a customer did not buy, unless a human recorded it
- A prediction about an individual employee's performance
- Any content in an audit trail, consent record or legal notice

#### When the model cannot determine something


"No reason was recorded when this enquiry was closed. Ask R. Kumar."


Never "Unable to determine at this time", never a blank, never a guess.

#### Accountability

Every AI-derived output carries the model version and timestamp in Mono, retrievable from the record. If a dealer principal acts on a wrong finding it must be possible to establish exactly what the system said, when, and on what basis. **This is not a compliance feature. It is the brand.**


#### This is a data requirement, not a design one

If the model version and timestamp are not **persisted alongside the derived output**, no interface treatment can retrieve them. This must be in the AI capability interface contract from the outset — not added when the first provider is chosen.


#### Marketing rule

Arth uses AI where it pays and does not sell AI. No sparkle icons. No "AI-powered" in any headline. **The word "AI" does not appear on the homepage.**


## PART 5 — Interface

For engineering and design. Every value here is a token in Part 9.1 — never a raw hex or pixel value in a component.

### 5.1  Foundations

#### Space — 4px base

--s1 4px  ·  --s2 8px  ·  --s3 12px  ·  --s4 16px  ·  --s5 24px  ·  --s6 32px  ·  --s7 48px  ·  --s8 64px

**Nothing between these values.** If a layout needs 18px, the layout is wrong.

#### Radius and edge

Two radii only. **3px** on anything a person clicks. **5px** on anything that contains other things. Zero radius reads as a spreadsheet; 12px reads as a consumer app. Arth is neither.

#### Elevation — borders, not shadows

| Level   | Specification                                                                                                                     |
|---------|-----------------------------------------------------------------------------------------------------------------------------------|
| Level 0 | Flat on the background                                                                                                            |
| Level 1 | 1px N10 border                                                                                                                    |
| Level 2 | Reserved for layers that genuinely float — modal, menu, date picker. Adds `0 8px 24px rgba(15,42,51,.14)` |
| Level 3 | **Does not exist.**                                                                                                               |

A ledger does not have depth. Cards that float make an operational screen feel provisional, and Arth's whole claim is that its record is permanent.

#### Breakpoints, z-index, limits


Breakpoints
Z-index
Limits


sm 480
md 768
lg 1024
xl 1280
xxl 1600
base 0
sticky 100
drawer 200
modal 300
toast 400
**Line length** — prose caps at 68 characters. Table cells never wrap to a third line; truncate with a tooltip.

**Touch targets** — 44 × 44px minimum on any surface reachable by a finger, including the responsive web build. Desktop-only controls may go to 32px.


### 5.2  Grid and page shells

Three shells cover every screen in the product. **A fourth means the information architecture has gone wrong.**


Shell
Layout
Use


**A — Work queue**
nav 240 | filter bar
        | rows
Telecalling, service, insurance, delivery. Dense rows 44px high, filter bar sticky.


**B — Record**
nav 240 | record | context 320
One customer, one enquiry, one job card. The right rail always shows the shared core: household, vehicle, history.


**C — Cockpit**
nav 240 | period selector
        | decision cards
Management. Generous spacing, one decision per card, ranked by rupee value, maximum 15 cards. Which fifteen is specified below.


#### Which fifteen cards — ruled 16 August 2026

On a bad Monday at a five-branch group there will be sixty candidates for fifteen places. The cap was specified; the selection was not. It is specified here.

**Ranking is by rupee value, with up to three reserved places.** A pure value ranking was considered and rejected, on the book's own words: the vision in 1.2 states that *no promise made to a customer is unrecorded*. If a promise broken on a small enquiry is structurally invisible for as long as it persists, that sentence is false in a way a sceptical dealer principal could catch us on — and the tiebreaker in 1.4 decides it. **Brand damage does not scale with the invoice.**


Rule
Specification


Twelve places
Ranked strictly by rupee value at risk. Highest first.


Up to three reserved
One card per kind below, **stated as an aggregate carrying the age of its oldest instance**, regardless of value. `"3 delivery promises broken · oldest 19 days"` — never a named individual.


Qualifying kinds
**1.** Promises made directly to a customer and broken — a committed delivery date passed, a callback promised and not made. **2.** Enquiries with no owner. **3.** Unresolved complaints.


Unowned enquiries
This kind is **self-limiting by design**. If automatic assignment is built, unowned enquiries are rare and short-lived and the place seldom fires. If it is not built, they are a real and persistent failure and the card plainly belongs. **Either way the reserved place is correct, and it is never padded** — so it costs nothing on the days it has nothing to say.


Never padded
If fewer than three qualify, the unused places return to the value ranking. **Reserved places are not quotas to be filled.** Principle 2 — the screen stays silent about what is not wrong.


**Never an individual enquiry**
Revised 16 August 2026. A reserved card is an aggregate of its kind, exactly like every other card on this screen. `"11 enquiries at Whitefield have had no contact"` is a principal card; `"Ramesh Kumar has had no contact"` is not, and putting it here is how the screen becomes a list of forty things and dies. **The age of the oldest instance is what makes persistence visible — not the identity of one record.** An aggregate of one is still an aggregate.


Reserved cards say why
A card holding a reserved place carries its reason in the same line as its figure: `"Shown because a delivery promise has been broken for 19 days."` Without it, a ₹8,000 card above a ₹4,00,000 card reads as a broken ranking, and an unexplained order is assertion — Principle 1.


The remainder is stated
The screen names what it is not showing, with a route to the full queue. **A cap that hides is dishonest; a cap that prioritises and says so is not.** Two conditions, both learned from the queue truncation line, which was corrected twice under review:

**1. The number must mean what the reader thinks it means.** It counts *candidates below the threshold*, not everything in the group. The queue line originally counted every enquiry in the workspace and read `"showing 100 of 3,412"` when sixty-three items actually needed attention. Say what the number is: `"45 more below this threshold"`, never a bare total.

**2. It appears only when something is genuinely hidden.** A line that fires on every screen stops being read by the second week — Principle 2, in a different costume. Where the card count cannot exceed the cap, the line never fires, and that is correct rather than a bug.


Adding a fourth reserved kind requires written sign-off from Brand. Reserved places are scarce for the same reason Brass is: a signal that appears everywhere signals nothing.


#### Stated without arithmetic, so it survives the count changing

The rule is: **cards are aggregates by kind, ordered by rupee value at risk, of which three kinds hold their place regardless of value, and none is padded.** The fifteen-card cap governs any screen where the kinds outnumber it.

On the dealer principal's screen the aggregate kinds are currently fewer than fifteen, so the cap does not bind and the value ranking never truncates. **That is a fact about the current screen, not a change to the rule**, and it is deliberately not written into this book as a number — a count baked into a brand rule goes stale the first time a workspace is added. Whether to build ranking and truncation machinery for a screen that cannot currently exercise it is an engineering scoping decision and belongs to Engineering. The rule is stated so that it is correct either way, and so the manager's screen inherits it without a second exercise.


#### Column grid

12 columns, 24px gutters, 32px page margin. Content maximum 1440px — beyond that the sidebar holds and the content column centres. **Never full-bleed:** a table 2400px wide is unreadable.

#### Two densities, chosen by shell

| Density                   | Specification                                   |
|---------------------------|-------------------------------------------------|
| **Operational** (A and B) | 14px text, 44px rows, 12px cell padding         |
| **Management** (C)        | 16px text, generous padding, 24px between cards |

**One global density setting for both is the most common mistake in dealer software.**

### 5.3  Components

Every control in the product. If a screen needs something not here, it goes through design review before it is built.

#### Buttons

| Variant                   | Use                                                                             |
|---------------------------|---------------------------------------------------------------------------------|
| **Primary** — Ink fill    | One per screen region. The main action.                                         |
| **Ghost** — Ink border    | The paired secondary.                                                           |
| **Quiet** — no border     | Tertiary actions inside a row.                                                  |
| **Danger** — Overdue fill | Only for actions that destroy or close a record. **Never for "delete filter".** |
| **Disabled** — N20 fill   | Never removed from the layout; state is visible, not hidden.                    |

**Labels are verbs and they never change.** The button that says "Assign" produces a toast that says "Assigned".

#### Inputs

- Labels sit above, always visible — **never a placeholder as a label**
- Help text explains why the field exists, not what to type
- Border N50 at rest (3.81:1), Overdue and thickened on error
- Placeholders are examples only

#### Status pills

`OVERDUE`   `REVIEW`   `SETTLED`   DRAFT

Square corners, 2px radius — **a pill is a stamp, not a bubble.** Uppercase is permitted here because it is never more than one word.

#### Rows — the workhorse

State lives in a **3px left border**. A row is never filled with a semantic colour — twenty filled rows is a colour field, not a signal.


**Ramesh Kumar — Grand Vitara**
No contact for 61 hours · R. Kumar   `OVERDUE` `₹11,200`

**Lakshmi Rao — Fronx**
Delivered 02 Aug · promise met   `SETTLED` `₹8,100`


#### Tabs

The active tab is marked by a **Brass rule beneath it** — the shirorekha inverted, deliberately, because a tab hangs from the content rather than the content from it. This is the only permitted inversion of the rule in the entire system.

#### The day panel

The component that carries the voice in 4.5. It sits **on** the person's landing screen, not in front of it.


#### Not a modal, and not two separate moments

**A welcome modal is refused.** The rule in this section already forbids it — a modal is for a decision that cannot be undone, never for information. But the practical objection is the stronger one: a telecaller logs in each morning and again after every break, so a panel that must be dismissed is a click paid every day, forever, and its contents are visible for two seconds and then gone. *Clarity on what I am going to do today* is exactly the thing a person wants available all day. **The modal form defeats the goal that motivates it.**

**One panel, not a morning event and an evening event.** It is live, not fired. In the morning it states what is ahead; in the evening the same panel states what happened, because it reads the same data at whatever hour it is looked at. This dissolves the question of when a day ends — a telecaller's day ends when their shift does, not at six.


| Rule         | Specification                                                                                                                                                                                                          |
|--------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Placement    | Top of the landing screen, above the queue. Never an overlay, never dismissible, never re-shown.                                                                                                                       |
| The greeting | The person's name and the date. **No time-of-day greeting** — "Good morning" is wrong at 3pm after a break, and a shift worker's morning is not nine o'clock. `"Ramesh Kumar · Monday 17 August"` |
| Content      | What is due, what carried over and how old the oldest is, and what is promised. Figures in Mono, tabular. Nothing that is not a number or the plain statement of one.                                                  |
| Colour       | Neutral. It carries **no semantic colour** unless something in it is genuinely Overdue. Principle 2 governs alerting and colour; it does not forbid a screen from stating its own state.                               |
| Naming       | Lowercase and descriptive — "the day panel". It takes no proper name. See 2.3: there is one named feature in this product and a second requires written sign-off.                                                      |

**The Exception Cockpit is untouched by any of this.** It stays as written in 5.2 — cold, ranked by rupee value, silent when nothing is wrong, no greeting of any kind. The dealer principal's ninety seconds are not the telecaller's nine hours, and 1.4 Principle 5 requires both screens to be built for the day the person actually has.

#### Time chips — "due soon"

No colour. The interval in Mono ("in 2h"), the queue sorted by deadline, and the record name escalating 400 → 500 → 600 as the interval closes. On breach the row becomes Overdue. See 3.2.

#### Stage badges

**The stage ramp interpolates across neutrals only** — background N05 → N20, text N60 → Ink. It never interpolates toward Brass; doing so tints every late-stage badge and breaches 90/8/2 on any screen showing a pipeline. Terminal outcomes are semantic: won and delivered → Settled, lost → neutral, breached → Overdue. No stage *name* maps to a colour.

ENGINEERING — where ramp endpoints must exist as literals in a component, they are generated from the token file at build time or asserted equal to it in CI. A palette that lives in two files will disagree in two files.

#### Overlays

| Component  | Specification                                                                                                                          |
|------------|----------------------------------------------------------------------------------------------------------------------------------------|
| **Modal**  | Only for a decision that cannot be undone. 480px, Ink header rule, primary action right. **Never for information** — that is a drawer. |
| **Drawer** | Right side, 420px, for context supporting the current screen without leaving it. Closes on Escape. Never nested.                       |
| **Toast**  | Bottom left, 4 seconds, one line, past tense. **Never for errors** — an error needs somewhere to stay.                                 |

### 5.4  States

Most software is designed for the screen that is full of data. Arth's users will meet these screens on their first day, and on their worst day.

| State             | Specification                                                                                                                                                                                                                         |
|-------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **Loading**       | Skeletons in the shape of the content that is coming, never a spinner. Over 3 seconds, add a line saying what is being fetched.                                                                                                       |
| **Empty**         | States a fact and says what happens next. "No enquiries are unassigned. New enquiries appear here within a minute of arriving." Never an illustration.                                                                                |
| **Error**         | Says what happened, what it means, and what survived. "This enquiry was reassigned while you were editing. It now belongs to S. Nayak. Your notes are saved as a draft." No apology, no blame, no error code unless support needs it. |
| **No permission** | "Branch performance is visible to branch heads and above. Ask your manager to change your access." Never a bare 403.                                                                                                                  |
| **Offline**       | A persistent Ink bar: "Working offline. 3 calls logged will sync when you reconnect." **Work is never blocked.**                                                                                                                      |
| **No results**    | Repeat the query back and offer the widest filter to drop. "No leads match 'Whitefield · Fronx · this week'."                                                                                                                         |
| **Partial data**  | If a figure is incomplete, say so beside it in Mono. **Never render an incomplete number as though it were final.**                                                                                                                   |

### 5.5  Navigation

The sidebar is Ink, always 240px, white type. It is the one persistently dark surface in the product — it frames the work the way a ledger's binding frames its pages, and it makes the light content area feel like paper.

#### Navigation is by question, not by object

`"My queue" · "Unassigned" · "Follow-ups due" · "Overdue"` — not "Leads", "Contacts", "Reports". A telecaller does not think in database tables. Counts sit right-aligned in Mono so the eye can scan them as a column.

#### Workspace switcher, not a menu tree

A person switches between departments and branches, and the whole navigation changes with them. **Depth is capped at two levels everywhere.** If something needs a third level, it belongs in a filter.

### 5.6  Forms and validation

- Label above, always visible. Placeholders are examples, never labels.
- **Mark optional fields, not required ones** — most fields are required.
- Validate on blur, never on keystroke. Nobody wants to be corrected mid-word.
- Errors appear beneath the field, and the field border thickens as well as changes colour, so the state does not depend on colour alone.
- One column. Two-column forms cause skipped fields.
- **Never clear a form on error. Ever.**

### 5.7  Data display and charts

Arth is a numbers product. How a figure is set matters more here than in almost any other brand decision.


| Campaign                | Spend         | Bookings | Cost / booking |
|-------------------------|---------------|----------|----------------|
| Grand Vitara — Search   | ₹1,84,000     | 20       | ₹9,200         |
| Brezza — Meta lead form | ₹96,200       | 13       | ₹7,400         |
| Festive Offer — C3      | ₹38,000       | 0        | ₹38,000        |
| **Total**               | **₹3,18,200** | **33**   | **₹9,642**     |

1 Jul – 31 Jul 2026 · Meta Ads API, Google Ads API · pulled 04 Aug 11:42


#### Number rules

- Tabular figures everywhere — `font-variant-numeric: tabular-nums`
- Indian grouping — ₹12,00,000, never ₹1,200,000
- Right-aligned in tables, left-aligned in cards
- Totals in 700 weight, above the row, never below in a separate box
- **Source and period beneath every table and chart, in Mono.** This is a brand rule, not a nicety — it is what "evidence, not assertion" looks like.
- **A distribution drawn from an incomplete set carries the incompleteness beside it.** The worked case is the lost-reason breakdown, which travels with its unknown rate always — see 4.3. The general rule is the partial-data rule in 5.4: a share of a set is only as honest as the share of that set we actually know.
- Semantic colour on the one figure that is wrong. Never on a whole column.

#### Chart rules

- Ink is series one. Slate is series two. **Brass is only the series being argued about.**
- Label bars directly. **A legend is an admission that the chart failed.**
- **Zero baseline always.** A truncated axis is dishonest, and honesty is the entire brand.
- No gridlines unless the reader must compare across a gap. No axis lines heavier than 1px N20.
- Never a pie, donut, gauge, radar or 3D anything.
- Always state the period and the source beneath the chart, in Mono.

### 5.8  Motion

Arth moves as little as possible. Motion in an operational product is a cost paid by someone doing the same task four hundred times a day.


Durations
Easing
Scope


instant 0ms
quick 120ms
base 180ms
enter 240ms
**never > 300ms**
out (.2,.7,.2,1)
in-out (.4,0,.2,1)

No bounce.
No spring.
No overshoot.
**May animate:** drawer and modal entry, row removal after an action, toast in and out, skeleton shimmer, the wordmark rule once on first load.

**Never animates:** numbers counting up, charts drawing themselves, page transitions, anything on hover other than a colour change, anything decorative.


`prefers-reduced-motion` is honoured everywhere, with no exceptions and no "reduced" fallback animation. When it is set, transitions become instant.

### 5.9  Accessibility

Target is **WCAG 2.2 AA**. Measured, not assumed — the full computed table is in the Appendix.


Requirement
Specification


**Never colour alone**
Every status carries a word as well as a colour. A pill reads "Overdue"; the left border is a reinforcement, not the signal. Roughly 1 in 12 Indian men has a colour vision deficiency, and this product is used by telecalling floors of forty.


**Focus is visible and Brass**
2px Brass outline, 2px offset, on **every** focusable element — not form inputs only. Never removed. The whole product is keyboard-operable, because a fast telecaller does not use a mouse.

**Reinforcement, mandatory:** Brass on light grounds, **Brass Lift on Ink grounds**, plus a 1px Ink inner edge on light so the ring never depends on its contrast ratio alone. Brass on the app background measures 3.21 — the thinnest margin in the system, on the one element that may never be removed.


**Language and script**
Every page declares `lang`. Kannada and Hindi content is marked so screen readers switch voice. Numbers stay in Latin digits in all three languages — that is what dealers actually read.


**Contrast floors**
4.5:1 text · 3:1 interface elements and chart strokes


### 5.10  Responsive and mobile web

There is no native app in this cycle. The web build must therefore work properly on a phone, because a sales consultant is on the showroom floor and an RTO clerk is at the RTO.

| Aspect               | Specification                                                                                                                                                                                                                    |
|----------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Below 768px          | Sidebar collapses to a bottom bar with four destinations. Right rail moves below the record. **Tables become stacked cards — never a horizontal scroll on a phone.**                                                             |
| Must work one-handed | Log a call · change a stage · add a note · book a test drive · mark a delivery step complete. **These five are the phone product;** everything else may require a desktop.                                                       |
| Field conditions     | Designed for a 2019 Android phone on 4G in a basement showroom: 44px targets, no hover dependency, tolerant of a dropped connection, readable in direct sunlight — which is why the interface is dark-on-light, not the reverse. |


#### On dark mode

Arth does not ship a dark theme. The Ink sidebar is the dark surface; the content area is paper. A ledger is dark ink on light paper, and inverting it would break the metaphor the whole identity rests on. Revisit only if operators ask, and never before the product is complete.


## PART 6 — Tenancy and partners

Arth is multi-tenant. Dealer groups will ask to brand it, and partners will ask to appear beside it. The answer is yes, within a fence, and the fence is here.

### 6.1  What a tenant may change

| Element                   | Permitted                         | Constraint                                                                                                                   |
|---------------------------|-----------------------------------|------------------------------------------------------------------------------------------------------------------------------|
| Tenant logo               | `YES` | Login screen and sidebar header only. Maximum height 32px in the sidebar. Supplied as SVG or 3× PNG on a transparent ground. |
| Tenant name in page title | `YES` | Plain text                                                                                                                   |
| Accent colour             | **Restricted**                    | One value only, and it must pass the validator in 6.3                                                                        |
| Custom subdomain          | `YES` | `\.arthcrm.com`. A fully custom domain is Arth Enterprise only.                             |
| Login background          | `YES` | Solid colour or an approved documentary photograph. No gradients, no stock imagery.                                          |
| Email sender name         | `YES` | The dealership's name. Arth is the rail, not the sender — see 7.2.                                                           |
| Report header logo        | `YES` | Exported PDFs and printed reports carry the tenant's mark in the header, Arth's in the footer.                               |

### 6.2  What a tenant may never change


**Semantic colours.** Overdue and Settled are fixed system-wide. A tenant cannot recolour the state that says a promise was broken. This is non-negotiable, and it is a trust argument rather than an aesthetic one — the moment the meaning of red is configurable, the record stops being evidence.


- Typography — Anek and Plex only
- Spacing scale, radii, elevation model
- Chart rules — zero baseline, no pie charts, source and period line
- The rule as structural device
- Layout, shells, navigation structure
- Any copy in an audit trail, consent notice or error state
- Anything in Part 4.4 governing AI output

### 6.3  The accent colour validator

A tenant supplies one hex value. The system verifies it programmatically before it is accepted. This is **code, not documentation** — engineering implements it as a real check.

```
ACCEPT tenant accent IF:
  contrast(accent, #FFFFFF)  >= 4.5      // legible as text on card
  contrast(accent, #F1F4F4)  >= 3.0      // visible as UI on app background
  deltaE(accent, #B23B2E)    >  25       // not confusable with Overdue
  deltaE(accent, #27735A)    >  25       // not confusable with Settled

ELSE reject and offer the nearest passing value.
```

A tenant accent that could be mistaken for a semantic state is rejected automatically. **Brass remains the system accent for anything money-related regardless of tenant theming** — a tenant accent replaces Slate's structural role, never Brass's meaning.

### 6.4  Full white-label

Removing the Arth mark entirely is available only under an Arth Enterprise white-label agreement with a separate commercial term. Under it the mark is replaced, **but every rule in 6.2 and 6.3 still binds**, and the footer retains a single line:


Platform by Arth


This is a contract term as much as a design rule, and it is deliberately expensive. White-labelling erodes the brand equity we are paying to build; it should be priced so that it is worth the loss.

### 6.5  Co-branding lockups

When the Arth mark appears beside a partner mark — OEM, DMS provider, Meta or Google partner badge, or a client mark in a case study:

| Rule       | Detail                                                                                                       |
|------------|--------------------------------------------------------------------------------------------------------------|
| Scaling    | Marks are scaled to equal **optical** weight, not equal height                                               |
| Divider    | 1px N20 vertical rule at 1.5 × the Arth mark's cap height, with full clear space either side                 |
| Order      | Arth sits left in materials Arth publishes; right in materials the partner publishes                         |
| The rule   | **Never extended across both marks.** It belongs to Arth alone.                                              |
| In-product | **No partner mark ever appears inside the product interface** — only in marketing material and documentation |

### 6.6  Integration naming

Integrations are described, never branded. See 2.6.

|                                                                                                     |                                                                                                  |
|-----------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------|
| `WRITE`the DMS integration · the Meta Ads connection · WhatsApp Business API | `NEVER`ArthConnect · Arth Bridge · Arth Sync · any coined integration name |

Partner names are used factually and without possessive framing. We integrate *with* a partner; we are not *powered by* one.


## PART 7 — Communications

### 7.1  Social media

Arth's buyer is a dealer principal who is sceptical of software marketing. Our social presence should look like published evidence, not like advertising.

| Channel                   | Role                                                                                                                                                               |
|---------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **LinkedIn** — primary    | Where dealer principals, GMs and OEM people are. Benchmarks, findings, plain-language explainers. Two posts a week. No hiring posts dressed as thought leadership. |
| **Instagram** — secondary | Recruitment and industry visibility, not selling. Documentary photography of real dealerships, a number, a caption. No reels of the product UI.                    |
| **YouTube** — later       | Short screen-recorded walkthroughs with a real voice, no music, no motion graphics. Only once the product is in a dealership.                                      |

#### The three post templates. There is no fourth.


Template
Specification


**A — The number**
One finding, one figure, one source line. Our most-used format.
`"Of 1,000 enquiries at a typical Bengaluru showroom, 33 became a delivered car." — ARTH · DEALER FUNNEL STUDY 2026`


**B — The statement**
One opinion we will defend, in plain words. **Never more than 30 words.**
`"Cost per lead is a vanity metric. The cheapest leads are usually the worst ones. A lead is not a car. Only one of those can be banked."`


**C — The photograph**
Real dealership, honest caption. Never stock, never a customer's face without written consent.
`"Service reception, 8:10am. The busiest ninety minutes of a dealership's week."`


#### Formats and sizes

| Placement          | Pixels      | Safe area                      |
|--------------------|-------------|--------------------------------|
| Square post        | 1080 × 1080 | 96px all sides                 |
| Portrait post      | 1080 × 1350 | 96px sides, 130 top/bottom     |
| LinkedIn landscape | 1200 × 627  | 72px all sides                 |
| Story / vertical   | 1080 × 1920 | 250px top, 320px bottom        |
| LinkedIn banner    | 1584 × 396  | Mark left, clear of the avatar |
| Profile mark       | 400 × 400   | Square monogram, Ink field     |

#### Rules

- **The rule sits top-left on every asset.** It is how a post is recognised at thumbnail size.
- **Every claim carries its source and period, in Mono, at the foot. No exceptions — this is the brand.**
- Never name a client. `"A 5-rooftop Maruti group in Bengaluru"` is the correct form. Client naming requires written permission — see 8.5.
- No hashtag stacks, no engagement bait, no emoji, no rocket.
- Captions under 60 words. If it needs more, it is an article.
- **Never post a product screenshot containing real customer data** — use the seeded demo tenant.

### 7.2  Email and WhatsApp

Most people will meet Arth's voice in a notification, not in the product. These are read on a phone, in a corridor, in ten seconds.

#### Transactional email — 600px


**7 bookings are past their promised delivery date**

Five are waiting on the RTO desk and two on finance disbursement. Together they represent ₹4,20,000 of delivery value. The oldest has been open for 19 days.

**Open the queue**

Sent because you are the dealer principal for Nagarbhavi Group. Change what you receive in Settings.


- **Subject lines are the finding, not a label.** "7 bookings past promised delivery" — not "Your daily Arth summary".
- One idea, one action, one button. Never two competing links.
- Always say why the person received it and how to change it.
- Plain-text fallback for every send. Many dealer inboxes strip images.
- Never a marketing email from a product address.

#### WhatsApp templates

Meta requires approved templates, which suits the voice — short, factual, no ornament. **Use utility templates for status;** they are also roughly seven times cheaper than marketing templates, which is a design constraint worth honouring.


Your Grand Vitara is at the RTO for registration.

Finance approved · Insurance issued · Registration in progress

Expected delivery: 18 August.
Track: arth.link/d/8K2M


No emoji, no exclamation marks, no "Dear valued customer". **The dealership's name appears, not ours — Arth is the rail, not the sender.**

### 7.3  Print and physical

Dealer principals still sign things on paper. Printed material is often the first Arth artefact in a showroom, and it should feel like a document worth keeping.

#### Colour for print

| Colour  | Hex      | CMYK        | Pantone (nearest) |
|---------|----------|-------------|-------------------|
| Ink     | #0F2A33 | 88 62 50 55 | 5463 C            |
| Brass   | #B07F2C | 26 47 96 6  | 7557 C            |
| Slate   | #2E5C68 | 83 51 41 15 | 5473 C            |
| Overdue | #B23B2E | 21 88 90 10 | 7620 C            |
| Settled | #27735A | 83 30 68 13 | 7726 C            |

PRODUCTION — CMYK values are conversions and must be proofed on the actual stock before a first run. Pantone references are nearest matches for one- and two-colour work, not exact.

#### Stock and finish

| Item                       | Specification                                                                                                                                               |
|----------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **Business card**          | 88 × 55mm, 400gsm uncoated, Ink flood one side, mark in brass foil. No spot UV, no rounded corners, no gloss.                                               |
| **Letterhead**             | A4, 100gsm uncoated, mark top-left, full-width Brass rule at 22mm, footer in 8pt Mono.                                                                      |
| **Folder and brochure**    | 250gsm uncoated, matt laminate only if it must survive a workshop.                                                                                          |
| **Invoices and contracts** | Letterhead grid, all figures in Mono with tabular numerals, totals in 700 weight. The stamp element is permitted on paid invoices.                          |
| **ID and lanyard**         | Ink card, monogram top-left, name in Anek 600, role in 10pt. Photograph optional. Plain woven lanyard, no print.                                            |
| **Signage**                | Brushed brass or powder-coated Ink letters, no backlighting, no acrylic box. Minimum 90mm cap height. **The rule is a separate machined bar, not printed.** |
| **Exhibition**             | One Ink wall, one number, one line. No product screenshots on a backdrop — nobody reads a UI from four metres.                                              |

**Never** gloss, metallic card, embossed plastic or a gradient on any printed surface. Uncoated stock is the whole point — Arth is a document, not a brochure. Brass foil on Ink is the one permitted indulgence and it appears on the business card alone.

#### Business card content


**Prem Kumar**
Founder

prem@arthcrm.com
+91 98450 00000
arthcrm.com


An Arth card carries an Arth address. See 2.5.

### 7.4  Video

For the production team. Video is the format most likely to drift off-brand, because every convention in commercial video — music beds, motion graphics, drone openers — is a convention Arth rejects.

| Element                   | Specification                                                                                                                                                                                              |
|---------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **Opening**               | Ink card, wordmark centred, the rule draws once left to right over 240ms, then holds. No other animation. Maximum 1.5 seconds.                                                                             |
| **Lower thirds**          | Ink panel at 90% opacity, left-aligned, 64px from the left edge. Name in Anek 600 at 32px, role in Plex 400 at 20px N40. 2px Brass rule above the panel. Enters at 180ms, holds 4 seconds, exits at 120ms. |
| **Titles and statements** | Full Ink frame, one line, Anek 600, Brass rule above. Held long enough to read twice. Never over footage.                                                                                                  |
| **Subtitles**             | **Mandatory on every video.** Plex Sans 400, white, 2px Ink outline, bottom-centred within the safe area. Burned in for social, plus a separate SRT for YouTube.                                           |
| **Figures on screen**     | Anek 600, label beneath in Plex N40. Source and period in Mono beneath the label. **Numbers never count up.**                                                                                              |
| **End screen**            | Ink frame, wordmark, one line, `arthcrm.com`. No social icons, no subscribe animation.                                                                                             |
| **Music**                 | **None.** Room tone or silence. If a bed is unavoidable for a social cut, it is unaccented and mixed below −24 LUFS.                                                                                       |
| **Transitions**           | Hard cut only. No wipes, dissolves, zooms, whips or speed ramps.                                                                                                                                           |
| **Grade**                 | Matches photography — available light, slightly desaturated, never HDR, never a LUT with a colour cast.                                                                                                    |

#### Delivery

| Use                 | Format                        | Note                                                               |
|---------------------|-------------------------------|--------------------------------------------------------------------|
| LinkedIn / YouTube  | 1920 × 1080, H.264, 25fps     | Subtitles burned in for LinkedIn, SRT for YouTube                  |
| Vertical / story    | 1080 × 1920                   | Safe area 250 top, 320 bottom                                      |
| Product walkthrough | Screen recording, 1920 × 1080 | Seeded demo tenant only. Real voice, no music, no motion graphics. |

### 7.5  Photography

#### What we photograph

- The service reception at 8am, when it is genuinely busy
- A telecalling floor mid-shift — headsets, screens, a whiteboard
- Hands: a job card, a set of keys, a challan, a keyboard
- A delivery, with the family, with written consent
- **The RTO desk and its paperwork.** Nobody photographs this, and it is where the product's best story lives.

#### How

- Available light. Slightly desaturated. Never HDR, never a filter, never flare.
- Documentary distance — we observe, we do not stage.
- Faces only with written consent, and **never a customer's face without it**.
- No handshakes, no laughing teams around a laptop, no gleaming empty showroom.
- **If no honest photograph exists, use an Ink panel and a number.** That is always better than stock.

STATUS — photography direction is written but unshot. Until a real dealership is photographed, use Ink panels and numbers.

### 7.6  Sales collateral

The artefacts that actually close deals. Each is a fixed template; variants require Brand sign-off.


Artefact
Specification


**Case study**
2 pages, A4
Our highest-value asset. Structure: the situation in one paragraph · what was measured before · what changed · the numbers, in a table with source and period · one quote, attributed by role not name unless permission is written. **Never a case study without real figures.**


**One-pager**
1 page, A4
For a dealer principal in ninety seconds. The line from 1.3 at the top, three findings, one table, one next step. No feature list.


**Proposal and quote**
Letterhead grid. Scope, tier, per-branch and per-user counts, total in Mono with tabular figures, total in 700 weight. Boilerplate from 8.3.


**Battlecard**
Internal only
One competitor per card. What they do well, where they are thin, the one question that ends the comparison. **Never shown to a customer, never quoted publicly.**


**Email signature**
Plain text. Name · role · `@arthcrm.com` · phone · arthcrm.com. No logo image, no quote, no legal disclaimer block, no "sent from my iPhone".


### 7.7  Presentations

| Rule                   | Detail                                                                                                                                                        |
|------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **Structure**          | Ink for openers, section breaks and closers. Light for everything else. A dark slide signals "a new argument starts here" and loses that meaning if overused. |
| **One idea per slide** | The heading is the claim, and the slide is its evidence. If the heading is a noun ("Architecture") rather than a claim, the slide is not finished.            |
| **Never**              | No bullet lists longer than six. No clip art, no stock photography, no slide transitions, no logos of clients.                                                |
| **Fallback fonts**     | Anek and Plex may not be installed on a client machine. **Decks that leave the building are exported to PDF, always.**                                        |


## PART 8 — Legal and intellectual property

Written with counsel, binding on every team. Where this book and a lawyer disagree, the lawyer wins — then this book is updated.

### 8.1  Trademark status


**Arth is not yet a registered trademark.** Until registration is granted, no ® may be used anywhere, by anyone, in any material. Using ® on an unregistered mark is a misrepresentation.


| Item             | Status and action                                                                                                                                                                                                                                                            |
|------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Classes to file  | **Class 9** (software) and **Class 42** (SaaS, software services)                                                                                                                                                                                                            |
| Mark type        | **Composite** — wordmark plus device. A plain word mark will face a distinctiveness objection, since "arth" is a common Sanskrit and Hindi word.                                                                                                                             |
| Known collisions | ARTH is an established Indian fintech, plus a DeFi token and a Singapore fintech. All sit in **Class 36 (financial services)**, so 9 and 42 are likely available — but the formal search must be completed before filing and before this identity goes onto a showroom wall. |
| Artwork          | The mark must be redrawn and outlined before filing, so it is artwork rather than a font rendering. See 3.1.                                                                                                                                                                 |
| Descriptors      | Vertical descriptors ("for auto retail") are **not** filed. They are non-distinctive marketing copy by design. See 2.2.                                                                                                                                                      |

### 8.2  Symbol usage

| Symbol      | When                                                                                                            | Placement                                                                                                                                      |
|-------------|-----------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------|
| **™**       | Now, until registration                                                                                         | First and most prominent mention on a page or document only. Superscript, 60% of the adjacent cap height. **Never inside the UI** — see below. |
| **®**       | Only after registration is granted                                                                              | Same placement rule. Replaces ™ everywhere on grant.                                                                                           |
| **Neither** | Interface strings, body copy after first mention, social captions, email subject lines, the mark artwork itself | A symbol in a product string is clutter and reads as insecurity. The mark artwork never carries a symbol baked in.                             |

### 8.3  Copyright and boilerplate

#### Copyright line


© 2026 Advito Global Pvt Ltd. All rights reserved.


8pt Plex Sans or Mono, N60, footer position. The year is the year of publication and is updated annually across the site, decks and templates in a single pass each January.

#### Standard footer — website and documents


Arth is a product of Advito Global Pvt Ltd, Nagarbhavi, Bengaluru 560072.
GSTIN 29XXXXXXXXXXXZX · arthcrm.com
© 2026 Advito Global Pvt Ltd. All rights reserved.


#### Proposal and contract boilerplate


This proposal is valid for 30 days from the date of issue. Figures quoted are exclusive of GST. Arth is provided as a hosted service; data is stored in India. Service levels, data processing terms and the tenant's rights on termination are set out in the Master Services Agreement, which governs in the event of any conflict with this document.


### 8.4  Data protection and consent

Under the DPDP Act, how consent is asked for is a trust signal, not only a legal requirement. Consent copy follows the voice in Part 4 — plain, specific, never buried.

| Rule               | Detail                                                                                                                       |
|--------------------|------------------------------------------------------------------------------------------------------------------------------|
| Plain language     | State what is collected, why, and for how long. No nested clauses, no legalese in the primary notice.                        |
| Never pre-ticked   | Consent is an affirmative action. Defaults are off.                                                                          |
| Withdrawal         | Every consent notice states how to withdraw, in the same size type as the request.                                           |
| Never AI-generated | Consent copy, privacy notices and audit entries are never machine-written. See 4.4.                                          |
| Record             | Every consent is recorded with timestamp and version of the notice shown. This is a product requirement, not a page of text. |

### 8.5  Client naming and confidentiality


**Never name a client without written permission.** Not in a deck, not on social, not in a case study, not verbally in a sales meeting. The correct form is descriptive: `"a 5-rooftop Maruti group in Bengaluru"`.


- Client logos require a signed usage permission, held on file, with the permitted contexts listed
- Screenshots use the seeded demo tenant. **Never real customer data, ever, in any external material**
- Figures from a client's data may be published only with written permission and only as ranges or rounded values unless exact figures are approved
- Photographs of a dealership require the dealer principal's written consent; faces require individual consent

### 8.6  Claims we may and may not make


`MAY CLAIM` Anything with a computed number, a named source and a date

Capabilities that exist in the shipped product today

Comparisons drawn from a competitor's own published material, quoted accurately and dated
`MAY NOT CLAIM` "India's No. 1", "the leading", "the best" — unsubstantiated superlatives

Roadmap features described in the present tense

Customer results without that customer's written permission

Certifications not yet held. ISO 27001 and 27701 are **not** currently held and must not appear in any material


### 8.7  Security incident communications

Pre-authorised so that nobody drafts under pressure. Any incident communication is approved by the CEO before it is sent.

#### Customer notification — structure


**Subject: \[What happened\], and what it means for your data**

What happened, in one paragraph, in plain words.
What data was and was not affected, stated specifically.
What we have done since, with times.
What you should do, if anything.
Who to contact, with a named person and a direct address.
When the next update will come, with a time.


- **No apology as the opening line.** State the facts first; an apology before information reads as deflection.
- Never "may have been affected" if it can be determined. Determine it, then say it.
- Never blame a vendor, an employee or a customer.
- Plain text, from a named person, not from a no-reply address.
- The same facts go to every affected tenant. No tiering of the truth by account size.


## PART 9 — Operations

### 9.1  Tokens for the build

Hand this to engineering. **Colours are defined once, here, and referenced by name — never as a raw hex in a component.** This file is the only permitted source of colour values anywhere in the codebase, including internal and control-plane surfaces.


#### There is no single "accent" token, and Brass must never become one

Arth has **two** colours doing two different jobs. Ink is the primary — buttons, structure, text, surfaces. Brass is the accent and means **exactly one thing**: money is at stake here, look. It is governed by 90/8/2.

**Mapping a generic `--accent` token to Brass puts Brass on every primary button, every selected row, every focus ring and the end of every stage ramp — and destroys its meaning on first render.** The role is split, not the value swapped:


| Role                                    | Token      | Value                                              |
|-----------------------------------------|------------|----------------------------------------------------|
| Primary button, current nav item, links | --action   | Ink `#0F2A33`             |
| Focus outline                           | --focus    | Brass on light grounds · Brass Lift on Ink grounds |
| Selected row inset and background       | --selected | N20 / N05                                          |
| Stage ramp                              | —          | Neutrals only. See 5.3.                            |
| Money-at-stake figures, rules, the mark | --brass    | Brass — **and nowhere else**                       |

```css
:root {
  /* Core */
  --arth-ink:         #0F2A33;  /* primary surface, all text */
  --arth-ink-deep:    #08191F;  /* code blocks, deepest panels */
  --arth-slate:       #2E5C68;  /* labels, eyebrows, series 2 */
  --arth-brass:       #B07F2C;  /* accent - money at stake */
  --arth-brass-deep:  #8F6620;  /* the only brass permitted as text */
  --arth-brass-lift:  #D0A155;  /* brass on dark backgrounds */
  --arth-brass-wash:  #F3E7CE;  /* brass pill background */
  --arth-brass-pill:  #7A5716;  /* the ONLY text colour on brass-wash - 5.35:1 */

  /* Neutrals - desaturated Ink */
  --arth-n00: #FFFFFF;   --arth-n05: #F1F4F4;
  --arth-n10: #E3E9E9;   --arth-n20: #C9D3D4;
  --arth-n40: #9FADB0;   --arth-n50: #748689;  /* control borders - 3.81:1 */
  --arth-n60: #5A6C71;   /* caption text - 4.97:1 */
  --arth-n80: #47585D;   --arth-n90: #263D45;

  /* Semantic - two states only */
  --arth-overdue: #B23B2E;   --arth-overdue-wash: #F6E3E0;
  --arth-settled: #27735A;   --arth-settled-wash: #DEEDE7;

  /* Type */
  --arth-display: "Anek Latin", "Anek Devanagari", "Anek Kannada", sans-serif;
  --arth-body:    "IBM Plex Sans", system-ui, sans-serif;
  --arth-data:    "IBM Plex Mono", ui-monospace, monospace;

  /* Structure */
  --arth-rule:   2px;              /* the shirorekha rule - never varies */
  --arth-r-sm:   3px;              /* controls */
  --arth-r-md:   5px;              /* containers */
  --arth-border: 1px solid var(--arth-n10);

  /* Space - 4px base */
  --arth-s1: 4px;   --arth-s2: 8px;   --arth-s3: 12px;  --arth-s4: 16px;
  --arth-s5: 24px;  --arth-s6: 32px;  --arth-s7: 48px;  --arth-s8: 64px;
}

/* Mandatory on every numeric cell in the product */
.arth-num { font-variant-numeric: tabular-nums; text-align: right; }
```

#### Brass Deep is not the pill text. Use `--arth-brass-pill`.

`--arth-brass-deep` is commented "the only brass permitted as text", which is true **on white and on the app background**. It is **not** permitted on `--arth-brass-wash`: that pairing measures **4.19** and fails the 4.5 text floor.

Each brass value is tied to the ground it sits on, and they are not interchangeable:


| Token             | Permitted ground              | Ratio       | Never                            |
|-------------------|-------------------------------|-------------|----------------------------------|
| --arth-brass-deep | white · app background        | 5.14 · 4.64 | Never on brass-wash              |
| --arth-brass-pill | brass-wash only               | 5.35        | Never on white or app background |
| --arth-brass-lift | Ink · Ink Deep                | 6.37 · 7.62 | Never on a light ground          |
| --arth-brass      | fills, rules, icons, the mark | —           | **Never as text, on any ground** |

#### The palette file is the source of truth

The values in the block above are **generated from** `brand/arth-palette.json`, which lives in the brand repository beside this book and is versioned with it. That file is the single source for every colour in the system. This book's colour tables and the Appendix are generated from it; the product reads its tokens from it. **Neither the book nor the product may define a colour that does not appear there.**

| Question              | Answer                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
|-----------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Who owns the file     | **Brand.** It sits in the brand repository, not the product repository. A change is a pull request reviewed by Brand, exactly as any token change under this section.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| What it holds         | Every colour with its token, name and role; the ground each text colour is permitted and forbidden on; every measured pairing with its floor; every forbidden pairing, retained so it stays measured; and the checks themselves.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| What it does not hold | Contrast ratios. Ratios are **computed at build time** from the hex values, never stored. A stored ratio can drift from the colour it describes — which is precisely the defect that produced the 3.81 / 3.44 error in v2.0.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| Scope                 | Colour only, for now. Type scale, spacing, radii and motion durations remain in this book until the same class of defect appears in one of them.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| **The book pointer**  | The palette carries `colour_system_last_changed_in_book` — **the book revision in which the colour system last changed, not the current book revision.** Renamed from `book_version` in palette 1.2.0, because the old name invited the reading that it tracked the book. **‡ Palette 1.2.0 is written and has not reached the product team.** The sentence above describes it in the present tense, which Part 0 forbids until it does. Recorded rather than reworded, because the defect is in the delivery and not in the wording — and because this is the instance that showed the test needed its second half. It does not. A book revision that changes voice, layout or governance does not move it and does not require a palette release. **Pinning it to the book's current number would force a palette version bump, a test update and a pull request every time this book revised for a non-colour reason** — manufacturing routine false failures, which is how a pinned assertion becomes a string people edit without reading. Recorded here as well as in the file so the semantics survive a copy of the file going astray. |

#### A colour pair is read with its role, never without

The same two colours can be approved for one job and forbidden for another, and this is not a contradiction. **Brass on white measures 3.55.** As text that is below the 4.5 floor and forbidden. As a focus ring it is above the 3.0 interface floor and approved — and the focus ring is an element 5.9 says may never be removed.

The palette file therefore carries such a pair in both lists, distinguished by role: `floor` in the approved list, `forbidden_as` in the forbidden list. **A reader who takes either list without its role will reach the wrong conclusion** — either stripping a shipped focus ring, or setting brass type that cannot be read.

| Field             | Status        | Meaning                                                                                                                                  |
|-------------------|---------------|------------------------------------------------------------------------------------------------------------------------------------------|
| grounds_forbidden | **Normative** | An exhaustive deny-list, governing **text rendering only**. Enforced. Each entry is a decision.                                          |
| grounds_permitted | Illustrative  | The grounds a colour is typically used on. **Not a whitelist.** Anything not forbidden is permitted if it clears the floor for its role. |

An allow-list was considered and rejected. Neutrals legitimately appear on many surfaces — Ink sits on white, on the app background, on N20 at the top of the stage ramp, and on all three pill washes. A whitelist would need extending every time a surface is designed, and an omission would produce a false failure that blocks work rather than catching a defect. A deny-list is short, deliberate, and each line earns its place.

ENGINEERING — consume the file directly. Do not transcribe it into a second file, and do not derive the list from this PDF. Deriving it from the document was accepted as an interim before the file existed; that interim is now closed.

#### Every published colour must have a token

A colour that appears anywhere in this book but not in the block above is an **orphan**, and an orphan is a defect. An engineer reading 9.1 — declared above as the only permitted source of colour values — cannot reach it, and will correctly substitute the nearest token. That is how a failing pair enters a product built by people following the rules. `--arth-brass-pill` was such an orphan until v2.2.

The automated check asserts five things, all declared in the palette file itself:

| Check     | Assertion                                                                                                                                                                                                       |
|-----------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| floors    | Every pairing meets or exceeds its floor                                                                                                                                                                        |
| orphans   | Every colour published in this book exists in the palette file                                                                                                                                                  |
| strays    | No colour literal appears in product source outside the generated token file                                                                                                                                    |
| grounds   | No text colour is rendered on a ground listed as forbidden for it                                                                                                                                               |
| forbidden | Every forbidden pairing remains measured and remains failing **for the role named against it**. One that silently starts passing requires Brand review — it means a colour moved.                               |
| coverage  | Every combination of a text colour and a ground it is approved on has a corresponding measured pairing. **Added v2.4** — this is the check that closes the class of gap found by inspection in the v1.0 review. |

The sixth check is the substantive addition. Four gaps were found in the v1.0 palette by a careful human reading it line by line. That is not a repeatable instrument. The coverage check finds the same class of gap by computation, every build, and it found a fifth the review had missed.

Fonts are SIL Open Font Licence 1.1 and self-hostable — **no CDN dependency and no licence fee at any scale.** Anek is by Ek Type, Mumbai; IBM Plex by IBM.

### 9.2  Asset management

#### Naming

```
arth_[type]_[variant]_[colour]_[size].[ext]

arth_logo_wordmark_ink_full.svg
arth_logo_wordmark_white_full.svg
arth_logo_monogram_ink_512.png
arth_icon_jobcard_24.svg
arth_social_number_1080x1080_v2.png
arth_print_card_88x55_cmyk.pdf
arth_video_lowerthird_1920x1080.mov
```

Lowercase, underscores, no spaces, **no dates in filenames** — versions live in `\_v2`, history lives in git.

#### Formats

| Use                                 | Format                                                  |
|-------------------------------------|---------------------------------------------------------|
| Mark and all icons                  | SVG. **The master is always SVG.**                      |
| Raster, where a platform demands it | PNG at 1× / 2× / 3× only                                |
| Anything going to a printer         | PDF/X-1a with fonts embedded                            |
| Fonts                               | WOFF2, self-hosted                                      |
| Never                               | No JPEG for anything with type in it. **No GIF, ever.** |

#### Where it lives

The brand repository sits beside the product repository, versioned the same way. A change to a token is a pull request, reviewed like a schema change. **Design files are the source of truth for layout; this book is the source of truth for rules.**

### 9.3  Deferred register

Recorded so that an absence is visibly a decision rather than an oversight.

| Item                                    | Reason deferred                                                                | Revisit when                                         |
|-----------------------------------------|--------------------------------------------------------------------------------|------------------------------------------------------|
| Sonic branding / audio mnemonic         | No keynote or branded video series exists                                      | First branded video series                           |
| In-app audio cues                       | Operational software used on a showroom floor should be silent                 | Never, unless operators ask                          |
| Office interior standards               | Own-office decision still open                                                 | Office lease signed                                  |
| Exhibition booth blueprints             | No exhibition planned; 7.3 covers the minimum                                  | First Auto Expo or FADA stand                        |
| Merchandise specifications              | No merchandise                                                                 | 25 employees or first dealer conference              |
| Billboard and transit layouts           | No OOH spend planned or advisable at this stage                                | OOH budget approved                                  |
| RTL mirrored layouts                    | No Arabic or Hebrew market                                                     | Gulf market entry                                    |
| European text-expansion rules           | No European market                                                             | European market entry                                |
| Dark theme                              | Explicitly refused — the ledger metaphor is dark ink on light paper. See 5.10. | Only if operators ask, never before feature-complete |
| Embedded widget branding (Teams, Slack) | No such integrations exist or are planned                                      | Integration committed                                |
| Acquisition integration guide           | Nothing is being acquired                                                      | First acquisition                                    |
| Figma-to-code token sync convention     | Single designer; tokens already named and versioned in code                    | Second designer joins                                |
| Dark-site crisis layouts                | No production traffic yet; 8.7 covers written communications                   | First paying tenant live                             |

### 9.4  Change history

| Version | Date     | Change                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
|---------|----------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| 2.9     | Aug 2026 | **Added:** the second half of the Part 0 test — an alternative must be reachable by the person bound by the rule, not merely existent, since a built artefact that has not been delivered is indistinguishable from one never built from where the reader sits; the dependency at 9.1 that palette 1.2.0 is written but has not reached the product team, recorded rather than reworded because the defect is in delivery; the note at 9.5 that the trademark search has not moved since 3 August and is the programme's single unhedged risk. **Closes the revision sequence opened on 15 August.** The next revision should arise from something built rather than something written. Arising from a Response to Brand, IT Director, 16 August 2026.                                                                                                                                                                                                                                                   |
| 2.8     | Aug 2026 | **Added:** the record at Part 0 that its own new test caught its own new rule on first use; the dependency at 4.3 that the triggered review's counting query does not exist and ships with the field or the rule is decoration; sole Brand ownership of that review, replacing a joint owner whose second role had no named holder; the requirement that the unknown rate be measured as a process finding with its threshold set from real data rather than guessed; the rule that a lost-reason breakdown never publishes without its unknown rate beside it, and the general form of that in 5.7; the palette book-pointer semantics recorded at 9.1 so they survive a copy of the file going astray. Arising from a Response to Brand, IT Director, 16 August 2026.                                                                                                                                                                                                                                  |
| 2.7     | Aug 2026 | **Added:** a test for every rule in this book at Part 0 — a safeguard whose safe path does not exist is a pressure, not a safeguard — generalised from the 4.3 finding and binding on every rule written from here; the lost-reason requirements at 4.3 expanded with an absolute close block, the requirement that the list carry an honest unknown so a forced choice cannot manufacture false data, and a triggered rather than scheduled review with a named owner; the two conditions on the remainder line at 5.2, carried from the queue truncation line corrected twice under review; the selection rule restated without arithmetic so it survives the aggregate count changing. Arising from a Response to Brand, IT Director, 16 August 2026.                                                                                                                                                                                                                                                 |
| 2.6     | Aug 2026 | **Revised:** the three reserved Cockpit places in 5.2 are now aggregates carrying the age of their oldest instance, never named individual enquiries — resolving a collision with the Product Director's aggregation rule by amending this book rather than excepting his. **Added:** the note in 5.2 that the unowned-enquiry kind is self-limiting whether or not automatic assignment is built; the recorded dependency at 4.3 that the lost-reason error message documents a control the schema does not have, with Brand's requirements for the field and the observation that its absence undercuts 4.4. Arising from a Response to Brand, IT Director, 16 August 2026.                                                                                                                                                                                                                                                                                                                            |
| 2.5     | Aug 2026 | **Added:** the selection rule for the fifteen Cockpit cards in 5.2 — twelve places by rupee value, up to three reserved for the oldest broken customer promise, unowned enquiry and unresolved complaint, never padded, each reserved card stating its reason and the screen stating what it is not showing; a new 4.5 governing the voice on a person's own screen, with the two tests (evidence, and work-not-person as the subject of the claim), worked examples, and the prohibition on ranking a person against named colleagues on their own screen; the day panel in 5.3, replacing a proposed welcome modal with a live non-dismissible panel on the landing screen that serves both the morning and the closing reading. The Exception Cockpit is unchanged. Arising from a Note to Brand, IT Director, 16 August 2026.                                                                                                                                                                        |
| 2.4     | Aug 2026 | **Added:** role semantics for colour pairings in 9.1 — the same pair may be forbidden as text and approved as an interface element, and each list is now read with its role; the declaration that `grounds_forbidden` is a normative deny-list governing text only while `grounds_permitted` is illustrative rather than a whitelist, with the reasoning for choosing a deny-list; a sixth automated check, `coverage`, asserting that every approved colour-and-ground combination carries a measured pairing. **Palette raised to v1.1:** nine pairings added, including the Brass focus ring on cards, the Ink inner edge of the focus ring as an interface reading, secondary text on cards, and Ink on all three pill washes; N20 added to Ink's grounds for the stage ramp; N50 as text recorded as a fourth forbidden pairing. Arising from an IT Director review of palette v1.0 carrying four findings, 15 August 2026. |
| 2.3     | Aug 2026 | **Corrected:** the amber reopening condition in 9.6, which required a measured increase against a baseline that does not exist and could never have fired. Replaced with an absolute threshold, a fourteen-day settling period and mandatory reporting, plus two Brand qualifications — the threshold is provisional pending the first pilot's figure, and a breach opens a review rather than reinstating amber automatically. **Added:** `brand/arth-palette.json` as the machine-readable source of truth for all colour, owned by Brand, with this book's colour tables generated from it and the product reading tokens from it; the five automated checks now declared in the file itself (9.1). Arising from an email from the CEO carrying two items from the IT Director, 15 August 2026.                                                                                                                                                                               |
| 2.2     | Aug 2026 | **Corrected:** `#7A5716`, the brass pill text colour, was published in the Appendix from v2.0 but never tokenised — the only orphan in the system. Now `--arth-brass-pill` (9.1). **Added:** a table binding each brass value to the ground it is permitted on; the rule that every published colour must have a token, with the corresponding lint assertion; the Brass-Deep-on-brass-wash pairing recorded in the Appendix as forbidden at 4.19 so it remains measured. Arising from a Note to Brand, IT Director, 15 August 2026.                                                                                                                                                                                                                                                                                                                                                                                                                    |
| 2.1     | Aug 2026 | **Corrected:** the control-border contrast row, which stated the ratio against white while naming the app background. No token changed. **Added:** seven pairings the product needs; the urgency instrument (3.2); the font delivery ruling with mandatory subsetting (3.3); vocabulary scope (4.2); AI persistence as a data contract (4.4); time chips and the stage-badge ramp (5.3); focus-ring reinforcement (5.9); the prohibition on mapping Brass to a generic accent token (9.1); subordination of `VISUAL-DIRECTION.md` (Part 0). Arising from Decision Memo 10, IT Director, 10 August 2026.                                                                                                                                                                                                                                                                                                                                                                          |
| 2.0     | Aug 2026 | Volumes 1 and 2 consolidated into a single book. Errata dissolved into the body. Added Part 0 (how to use, decision rights), Part 2 (brand architecture), Part 4.2 (controlled vocabulary), Part 4.4 (AI output governance), Part 6 (tenancy and partners), Part 7.4 (video), Part 7.6 (sales collateral), Part 8 (legal and IP), Part 9.3 (deferred register). Brand ownership moved from Product Engineering to Brand.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| 1.1     | Aug 2026 | Volume 1 contrast corrections: N60 caption text #6B7C80 → #5A6C71 (3.94 → 4.97). N50 control border #748689 introduced (N20 failed the 3:1 floor at 1.53). Brass Deep #8F6620 introduced for the rare case where brass must carry a word (Brass at 3.55:1 cannot legally be text).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| 1.0     | Aug 2026 | Volume 1 (Core) and Volume 2 (Application) published.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |

### 9.6  Decisions considered and rejected

Recorded so that a settled question is not reopened. Reversing any entry here requires the same sign-off as any other change to this book.


Decision
Outcome
Reasoning


**Shifting the Brass family toward gold**
`Aug 2026`
`REJECTED`
Brass `#B07F2C` sits at hue 38°, two degrees from Amazon Orange `#FF9900` (hue 36°). A full alternative family was solved at hue 45° — Brass `#A18530`, Brass Deep `#836B1B`, Brass Lift `#CEAF4B`, Brass Wash `#F3EACE`, pill text `#705B15` — preserving or improving every measured contrast ratio.

**Rejected by the CEO. The palette in Part 3.2 is final.**

The resemblance is confined to low-fidelity, small-format contexts — favicon, app icon, compressed thumbnail, single-colour print, embroidery — where chroma and value flatten and only the pairing reads. The darks are not close: Ink `#0F2A33` is hue 195° and 55% saturated against Amazon’s hue 213° and 17%. The marks are not close either: Amazon is a wordmark with a curved arrow beneath; Arth is a wordmark with a straight rule above. There is no trademark exposure — different classes, different marks, different category.

**Mitigation in force instead of a colour change:** the 90/8/2 ratio in 3.2 is enforced without exception, and the mark rules in 3.7 are binding. Anyone raising this again should be shown this entry first.


**Reserved Cockpit cards as individual enquiries**
`Aug 2026`
`REVISED`
v2.5 specified the three reserved places as the single oldest *individual* item of each kind. That collided with the Product Director's rule, issued the same day, that the dealer principal sees aggregates and exceptions to aggregates and never a named enquiry. **Brand revises its own ruling rather than carving an exception to his.** An exception was offered and declined: the aggregate form satisfies everything the reserved place was for, because **what makes a small persistent failure visible is the age of the oldest instance, not the identity of one record** — and it removes the thin end of a wedge, since one sanctioned individual card is the argument for the next. The reserved places survive in aggregate form. See 5.2.


**A welcome modal at login**
`Aug 2026`
`REJECTED`
Proposed as a short panel shown each time a person logs in, giving clarity on the day ahead. Refused on the rule in 5.3 — a modal is for a decision that cannot be undone, never for information — but the practical objection is the stronger one: a telecaller logs in every morning and again after breaks, so a dismissible panel is a click paid daily forever, and its contents vanish after two seconds. The information wanted is the kind a person needs available all day. **Replaced by the day panel**, which sits on the landing screen, is never dismissed, and serves both the morning and the closing reading from one live component. See 5.3.


**Ranking the Cockpit purely by rupee value**
`Aug 2026`
`REJECTED`
Clean and unGameable, and it would have made a small persistent failure permanently invisible — a broken delivery promise on a ₹8,000 enquiry would never reach the screen however long it festered. Rejected against the vision in 1.2, which states that no promise made to a customer is unrecorded. Replaced by twelve value-ranked places and up to three reserved. See 5.2.


**Darkening Brass Deep to clear the pill wash**
`Aug 2026`
`REJECTED`
Proposed as the minimal fix for the 4.19 failure, on the reasoning that the gap is small. Rejected: `--arth-brass-deep` must simultaneously hold at or above 4.5 on white (5.14) and on the app background (4.64), and it is used in both places. Darkening it enough to clear the wash would change it everywhere it appears, to solve a problem in one component. **The correct instrument is a separate token bound to its ground**, which is what the book always intended and now defines. See 9.1.


**Ink text on the brass pill**
`Aug 2026`
`NOT ADOPTED`
Shipped by Engineering as a safe interim while the gap was open — correct judgment, and it measures 12.24. Not adopted as the standing answer because it breaks the pill family: Overdue sets its own hue on its own wash (4.77) and Settled does the same (4.71). An Ink-texted brass pill would be the only one of the three whose text is not its own colour, and across a row of pills REVIEW would stop reading as a member of the set. Consistency of the family outranks the extra headroom. **Engineering to move to `--arth-brass-pill` at convenience; nothing is urgent, since the interim passes.**


**A system font stack instead of self-hosted families**
`Aug 2026`
`REJECTED`
Proposed on the grounds that a phone on 4G in a basement showroom would download nothing. Rejected because Anek is load-bearing for Principle 4 — a system stack supplies whatever Kannada font the device carries, which will not share a skeleton with the Latin, and every Kannada screen would read as a translation. Measured cost 245 KB once, cached thereafter, against a mitigation package of subsetting and swap. See 3.3. **Confirmed by the CEO, 10 August 2026.**


**Reinstating the amber warning state**
`Aug 2026`
`REJECTED`
Re-raised on a sound objection: "position and weight" works on a ranked cockpit but was under-specified for a telecaller scanning a queue for nine hours. **The objection was correct and the book was at fault** — the instrument is now specified in 3.2. The colour rule stands. To be validated with the pilot telecallers. **Confirmed by the CEO, 10 August 2026.**

**Reopening condition — restated 15 August 2026.** This entry previously read "a measured increase in missed follow-ups". That condition cannot fire: no dealership is live, demo data is generated, and the pilot opens with the deadline queue already running, so no baseline exists or ever will. A condition that cannot be satisfied is a refusal wearing the costume of a test, and Principle 1 does not permit it. It is replaced by an absolute measure:

— A settling period of **fourteen days** from pilot start, during which no measurement counts. Telecallers learning any new queue miss more in week one regardless of its design.
— Thereafter, a missed-follow-up rate above **ten per cent on a seven-day rolling window**.
— The rate is reported into the record at the end of the settling period **whether or not it breaches**. This clause is the most valuable part of the ruling and is not optional: a metric that is only surfaced when it fails is not evidence, it is advocacy.

**Two qualifications from Brand.** First, ten per cent is **provisional and unvalidated** — nobody has measured the normal missed-follow-up rate at an Indian dealership, and the figure is a reasonable guess rather than a finding. The first pilot's reported rate becomes the calibration, and the threshold is revisited against it in the next revision. Second, a rate is not a cause: understaffing, a lead surge or a bad week produce the same number as a bad queue design. **A breach therefore opens a joint Brand and Engineering review, not an automatic reinstatement of amber.** The review examines cause, and its outcome may be amber, a different instrument, or no change. Principle 2 still outranks Principle 5; what has changed is that the question can now actually be asked.


**"Arth Auto" as the brand name**
`Aug 2026`
`REJECTED`
Makes Arth a prefix and creates sub-brands as verticals are added, fragmenting spend across four names. Replaced by the monolithic master brand with vertical descriptors in Part 2.2.


**A dark theme**
`Aug 2026`
`REJECTED`
A ledger is dark ink on light paper. Inverting it breaks the metaphor the identity rests on, and the Ink sidebar already supplies the dark surface. See 5.10.


**An amber warning state**
`Aug 2026`
`REJECTED`
Red/amber/green degrades to a screen half-covered in amber within weeks, which is the exact failure the Exception Cockpit exists to prevent. Urgency is expressed through position and weight. See 3.2.


**"arthbyadvito.com" as the primary domain**
`Aug 2026`
`REJECTED`
Bakes a temporary endorsement into a permanent asset, caps valuation optics, and makes no sense on a second vertical. Advito appears as a footer endorsement only. See 2.5.


### 9.5  Audit record

This system was checked before publication rather than after.

| Check                                                         | Result                             | Detail                                                                                                                                                                                                                                                                                                                            |
|---------------------------------------------------------------|------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Colour contrast, all pairings                                 | `PASS` | WCAG 2.2 relative luminance computed for 18 combinations. 3 failures found and corrected pre-publication. Independently recomputed by Engineering, 10 Aug 2026: 16 of 17 reproduced exactly, one row named the wrong background and is corrected in v2.1. Seven further pairings added. No token changed.                         |
| Token completeness — every published colour has a token       | `PASS` | Every colour value published in this book verified present in the palette file as of v2.3. One orphan found and resolved (`#7A5716`). Now asserted in CI.                                                                                                                                                |
| Palette reconciliation — book figures against computed values | `PASS` | All published contrast figures recomputed from `arth-palette.json` and reconciled against this book: **zero mismatches**.                                                                                                                                                                                 |
| Palette completeness — all six checks, v1.1                   | `PASS` | 34 pairings clear their floors; 4 forbidden pairings confirmed still failing for their stated roles; **zero uncovered** colour-and-ground combinations; zero text colours on forbidden grounds; one dual-role pair (Ink on Brass, large_text and ui) confirmed intentional rather than duplicated.                                |
| Typeface licensing                                            | `PASS` | Anek (Ek Type) and IBM Plex checked against source repositories. Both SIL OFL 1.1, free to embed and self-host at any scale.                                                                                                                                                                                                      |
| Multi-script coverage                                         | `PASS` | Anek covers ten Indian scripts on a shared skeleton                                                                                                                                                                                                                                                                               |
| Font delivery                                                 | `PASS` | Subset and self-hosted as WOFF2. No third-party CDN, no external request, works offline.                                                                                                                                                                                                                                          |
| Semantic colour independence                                  | `PASS` | All states carry a word; colour is reinforcement only                                                                                                                                                                                                                                                                             |
| Reduced motion                                                | `PASS` | All animation gated behind the media query                                                                                                                                                                                                                                                                                        |
| Responsive                                                    | `PASS` | Rendered at 390, 768, 1280 and 1600px. No horizontal scroll, no clipped content.                                                                                                                                                                                                                                                  |
| Competitive distinctiveness                                   | `PASS` | Compared against category incumbents. All use cobalt or teal-blue SaaS palettes with geometric sans. No overlap on colour, type or device.                                                                                                                                                                                        |
| Indic conjunct rendering                                      | `OPEN` | Must be verified on a real screen at 44px before any Kannada or Hindi screen ships. See 3.3.                                                                                                                                                                                                                                      |
| Trademark search                                              | `OPEN` | Classes 9 and 42 not yet formally searched or filed. See 8.1. **Open since 3 August and not moved. This is the single unhedged risk in the programme** — if the mark is unavailable, every artefact governed by this book is renamed, and the cost rises with every week of build. It waits on Brand and the CEO, not on Phase 5. |
| Wordmark artwork                                              | `OPEN` | Currently set type, not drawn letterforms. Must be outlined before filing. See 3.1.                                                                                                                                                                                                                                               |
| Print proofing                                                | `OPEN` | CMYK and Pantone values in 7.3 are conversions and must be proofed on stock before a first run.                                                                                                                                                                                                                                   |


## APPENDIX — Measured contrast

Every pairing in the system, computed against WCAG 2.2. Carried as evidence, not as instruction — the corrected values are already in Part 3.2 and Part 9.1.

| Pairing                                                                         | Foreground | Background | Ratio    | Grade        |
|---------------------------------------------------------------------------------|------------|------------|----------|--------------|
| Body text on app background                                                     | #0F2A33   | #F1F4F4   | 13.57    | AAA          |
| Body text on card                                                               | #0F2A33   | #FFFFFF   | 15.01    | AAA          |
| Secondary text on background                                                    | #47585D   | #F1F4F4   | 6.73     | AA           |
| Caption text on background — corrected                                          | #5A6C71   | #F1F4F4   | 4.97     | AA           |
| Eyebrow label on background                                                     | #2E5C68   | #F1F4F4   | 6.67     | AA           |
| White on Ink panel                                                              | #FFFFFF   | #0F2A33   | 15.01    | AAA          |
| Brass accent text on Ink                                                        | #D0A155   | #0F2A33   | 6.37     | AA           |
| Brass on white — **fill only, not text**                                        | #B07F2C   | #FFFFFF   | 3.55     | UI only      |
| Brass Deep on white — corrected text value                                      | #8F6620   | #FFFFFF   | 5.14     | AA           |
| Brass pill text — token `--arth-brass-pill`             | #7A5716   | #F3E7CE   | 5.35     | AA           |
| **Brass Deep on brass-wash — FORBIDDEN PAIRING**, recorded so it stays measured | #8F6620   | #F3E7CE   | **4.19** | **FAIL**     |
| Ink on Brass fill                                                               | #0F2A33   | #B07F2C   | 4.23     | UI only      |
| Brass rule on Ink                                                               | #B07F2C   | #0F2A33   | 4.23     | UI only      |
| Overdue text on white                                                           | #B23B2E   | #FFFFFF   | 5.90     | AA           |
| Overdue pill text                                                               | #B23B2E   | #F6E3E0   | 4.77     | AA           |
| Settled text on white                                                           | #27735A   | #FFFFFF   | 5.70     | AA           |
| Settled pill text                                                               | #27735A   | #DEEDE7   | 4.71     | AA           |
| Control border on card                                                          | #748689   | #FFFFFF   | 3.81     | AA (UI)      |
| **Control border on app background** — where it actually sits                   | #748689   | #F1F4F4   | 3.44     | AA (UI)      |
| **Added in v2.1 — pairings the product needs that v2.0 did not publish**        |            |            |          |              |
| Brass Deep on app background                                                    | #8F6620   | #F1F4F4   | 4.64     | AA           |
| Caption text on card                                                            | #5A6C71   | #FFFFFF   | 5.50     | AA           |
| Overdue on app background                                                       | #B23B2E   | #F1F4F4   | 5.34     | AA           |
| Settled on app background                                                       | #27735A   | #F1F4F4   | 5.15     | AA           |
| Slate on white                                                                  | #2E5C68   | #FFFFFF   | 7.38     | AA           |
| Brass Lift on Ink Deep                                                          | #D0A155   | #08191F   | 7.62     | AA           |
| **Brass focus ring on app background** — thinnest margin in the system          | #B07F2C   | #F1F4F4   | **3.21** | UI · see 5.9 |

Three original values failed and were corrected before publication: caption text, the control border, and brass as text. The failing values are not retained here as live options — they are recorded in the change history at 9.4.


#### Correction carried in v2.2

The brass pill text colour `#7A5716` was published in this table from v2.0 but was **never given a token in 9.1** — the only orphan in the system. Engineering, reading 9.1 as instructed, substituted `--arth-brass-deep`, which fails on the wash at **4.19**. The token now exists, and the forbidden pairing is recorded above so that it remains under measurement rather than disappearing from the record. Found by the product automated contrast check on its first run, 15 August 2026.


#### Correction carried in v2.1

v2.0 published the control border as **3.81 against #F1F4F4**. That figure is the ratio against **white**; against the app background it is **3.44**. Both now appear above. No token changes — 3.44 clears the 3:1 floor for interface elements. Found by the IT Director on independent recomputation of all seventeen pairings; the other sixteen reproduced exactly.


#### One sentence to remember

Arth should look like the most trustworthy document in the dealership — because being trusted with the truth about a dealer's money is the whole business.

---

*THE ARTH BRAND SYSTEM · VERSION 2.9 · AUGUST 2026 · ADVITO GLOBAL · INTERNAL*

*Markdown rendering of the typeset book. Content is identical; the typeset PDF carries the
design system applied to itself and is the version to circulate outside the team.
Colour values in Part 9.1 and the Appendix are generated from `arth-palette.json` v1.2.0.*
