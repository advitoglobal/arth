# Arth telecalling floor — built pack for review

**To:** IT Director · Product Director  
**From:** Build (this cycle)  
**Date:** 26 August 2026  
**Purpose:** One document of what is in the repository today, so you can walk the floor, mark corrections, and send a list back. This is not a sales deck.

**Claims in this file**

- **VERIFIED** — read from code, migrations, or `npm run prove` on this branch.
- **SPEC** — required by the governing pack; noted when the build matches or diverges.
- **OPEN** — known gap, contradiction, or next-cycle item. Not hidden.

**Governing pack (SPEC):** `00-START-HERE.md`, `docs/ARTH-ARCHITECTURE.md`, `docs/books/SCOPE-BRIEF-TELECALLING.md`, `docs/books/ARTH-BUILD-SPECIFICATION.md` §8 and Appendix B, `docs/books/DECISIONS.md`, Brand System v2.9, `.cursorrules`.

**Branch:** `main`. Preview: `http://127.0.0.1:43127`.

---

## 1. What this cycle is

**Arth is enquiry accountability for Indian auto dealer groups. It is not a CRM.** The line the homepage uses: forty calls cost ₹9,200 and produced one delivered car. **VERIFIED** (`src/app/page.tsx`).

**This cycle is telecalling only.** One department, back end and front end, so a live client can test. **SPEC** (SCOPE-BRIEF). Sales, service, delivery, The Exception Cockpit, points, and telephony are not in this build. **VERIFIED** (no those workspaces; login copy states scores and call recording are not in this release).

**The claim the floor must prove:** every enquiry has an owner, a working-hours clock, a recorded outcome, and an append-only ledger. **SPEC**.

**Assignment ruling used:** Option A, round-robin by current open-book load. Option B (manager assign screen) is next cycle. **SPEC** recommendation; **VERIFIED** in `src/services/assignment.ts`.

---

## 2. How to open it

```bash
cp .env.example .env.local   # DATABASE_URL. Never commit it.
npm install
npm run db:migrate
npm run prove
npm run dev                  # 127.0.0.1:43127
```

Then Open the product → `/w/login`. Demo seats are a cookie, not production SSO. **VERIFIED**.

| Seat | Tenant | Role | Lands on | What to look at |
|---|---|---|---|---|
| A. Iyer | Whitefield Motors | telecaller | Today | Ramesh Kumar late; own book; Log a call |
| K. Nair | Whitefield Motors | telecaller | Today | Own book. Anita Desai (after-hours assign), not Ramesh |
| M. Pinto | Coastal Cars | telecaller | Today | Fazal Ahmed. Must not see Whitefield |
| S. Rao | Whitefield Motors | sales consultant | My enquiries (`/w/pipe`) | Today is refused. Queue API 403 |

**VERIFIED** (`src/lib/seats.ts`, `src/app/w/login/page.tsx`, `scripts/prove-access.ts`, `scripts/prove-isolation.ts`).

---

## 3. Screens built (telecalling)

SCOPE-BRIEF §3 lists seven screens. File enquiry is the eighth surface, required when Search finds no match.

| # | Screen | Route | Who may open it **VERIFIED** | Job on the floor |
|---|---|---|---|---|
| 1 | Today | `/w/dayb` | `tele` only | Late first (names in the summary), then due later today. Assigns unowned enquiries on open. |
| 2 | Log a call | `/w/tele` | `tele` (`mgr`/`svctele` in matrix; those seats are not demoed) | Desk phone first. Then record disposition. Enquiry number and “call by”. After save, in-place confirm ~1.5s, then next Today row. |
| 3 | My enquiries | `/w/pipe` | `tele`, `lead`, `mgr`, `sales` | Full book, nine stage chips on a grid. Not the day queue. Add enquiry for tele. |
| 4 | Enquiry record | `/w/rec?id=` | `tele`, `lead`, `mgr`, `sales` | Opens from tapping the **whole card**. Append-only ledger. Enquiry number. |
| 5 | Search | `/w/search` | `tele`, `sales`, `adv` | One search box (phone, name, enquiry number, model). Separate Filter (source, stage, overdue, parked, arrived vs follow-up dates). |
| 6 | File enquiry | `/w/new` | `tele` | When Search misses. Duplicate phone returns the existing enquiry. |
| 7 | Notifications | `/w/notif` | `tele`, `sales`, `svc` | Every row says why. Tap the row to open and mark read. Mark all read. |
| 8 | My profile | `/w/profile` | `tele` | Seat, tenant, branch hours. |

**Nav:** boxed tiles. Log out top right. Mobile two-column grid. **VERIFIED** (`src/components/floor-nav.tsx`).

**Unsigned `/w/*`:** redirected to `/w/login` except the login page itself. **VERIFIED** (`src/middleware.ts` pattern via seats check in floor layout).

**Marketing (not the floor):** `/` homepage, `/trust` how records are kept, `/enter` into login.

### Screen walk, for the review session

1. Sign in as **A. Iyer**. Today should name who is late. Open a card → record. Call button → Log a call (does not steal the card tap).
2. Log a connected callback, a postponed (must pick revisit), a lost (reason + required fact). Watch in-place confirm and Undo. Confirm the ledger gained a row, not an edit.
3. Move stage; Undo should restore previous stage via a correction event.
4. Search `9876500001`, `Ramesh`, `FFFFFFF1`, `Brezza`. Use Filter without wiping the search box.
5. Search a new 10-digit number → File this enquiry → lands on Log a call.
6. Notifications: first-response breach copy; tap row; Mark all read.
7. Profile: hours Mon–Sat 09:30–18:30 IST, Sunday closed.
8. Sign in as **K. Nair**: Anita Desai, not Ramesh.
9. Sign in as **M. Pinto**: Fazal only.
10. Sign in as **S. Rao**: Today shows *You cannot open this screen*. My enquiries still opens.

---

## 4. Domain behaviour (what IT and Product should hold us to)

### Owner and assignment — VERIFIED

- Unowned open enquiries assign to the **least-loaded active telecaller on that branch** (open book = not lost, not delivered), then name. **Option A.**
- After-hours arrival writes `clock_deferred`, charged to the **branch**, then assigns. Seed case: Anita Desai arrived Sunday 21:40 IST → clock starts Monday 09:30; first call due Monday 10:00; owner **K. Nair** (Iyer already has load). **VERIFIED** (`0003_assign_and_after_hours.sql`, `scripts/prove-assign.ts`, `scripts/prove-clock.ts`).

### Working hours — VERIFIED

- Table `working_hours` per branch, day 0–6. Seed: Sunday closed (`opens_at`/`closes_at` null). Mon–Sat 09:30–18:30. Timezone `Asia/Kolkata`.
- First-response threshold seeded: **30 minutes** (`config_thresholds.first_response_minutes`).
- **Every clock in this cycle goes through `src/domain/clock.ts`.** Sunday 21:40 does not start a penalty overnight.

### Nine stages — VERIFIED (rows, not code)

`new → assigned → contacted → qualified → test_drive → quotation → negotiation → booked → delivered`  
Labels in `config_stages`. Delivered is terminal.

### Dispositions — VERIFIED (seed)

| Key | Label | Connected | Extra rule |
|---|---|---|---|
| `connected_callback` | Connected, callback | yes | Callback more than 14 days needs a reason |
| `postponed` | Postponed | yes | Revisit date required. Enquiry stays open; **Parked is derived** |
| `lost` | Lost | yes | Lost reason + that reason’s fact |
| `busy` | Not connected, busy | no | |
| `switched_off` | Not connected, switched off | no | |
| `no_answer` | Not connected, no answer | no | |

### Lost reasons — VERIFIED (seed)

| Key | Label | Fact demanded |
|---|---|---|
| `no_contact` | No contact was ever made | attempt count |
| `price` | Price | quoted amount |
| `finance` | Finance rejected | financier name |
| `bought_elsewhere` | Bought elsewhere | competitor if known |
| `not_in_market` | Not in market | stated timeline |
| `product` | Product mismatch | model asked for |
| `unknown` | Reason not known | none |

### Ledger — VERIFIED

- `lead_events` is **append-only by privilege**: `arth_app` has SELECT and INSERT only. No UPDATE/DELETE. **VERIFIED** (`0001_core.sql`).
- Undo is a **correction** row, not a delete. Stage undo restores `previous_stage_key` from payload.
- Actor is `USER` or `SYSTEM`. System rows have no `actor_id`.

### Parked, difficulty, money — VERIFIED

- **Parked is derived** (postponed with a future revisit), never a stored flag on `leads`.
- **Difficulty band** is stored and frozen at assignment. **Hidden** from telecaller and sales rows.
- **Expected value** is integer **paise** (`expected_value_paise`). **Hidden** from `tele` and `sales`. Visible only to `mgr` / `owner` / `adv`. Those manager seats are not on the demo floor.

### Enquiry number — VERIFIED

Last eight hex of the UUID, uppercase. Ramesh seed id ends `FFFFFFF1`. Shown on tile, record, Log a call, Search.

### Notifications — VERIFIED

Raised when first response is late for an owned enquiry. Copy avoids “working hours” jargon. Unread count on nav. Whole-card open marks read.

---

## 5. Isolation and access (IT)

### Tenancy — VERIFIED

- Postgres 16. Database `arth`. App role `arth_app`.
- `withTenant` sets `app.tenant_id` (and `app.user_id`) inside a transaction, then runs the work.
- **FORCE ROW LEVEL SECURITY** on tenant-scoped tables. Policy: `tenant_id = current_setting('app.tenant_id')`.
- Two seeded tenants: Whitefield Motors (`1111…`), Coastal Cars (`2222…`). Pinto cannot read Whitefield rows.

### Access matrix in code — VERIFIED (`src/lib/access.ts`)

This is the **implemented** matrix for screens that exist, not the full 80-screen Appendix B.

| Screen | Roles that can open |
|---|---|
| Today `dayb` | tele |
| Log a call `tele` | tele, mgr, svctele |
| My enquiries `pipe` | tele, lead, mgr, sales |
| Record `rec` | tele, lead, mgr, sales |
| Search `search` | tele, sales, adv |
| File enquiry `new` | tele |
| Notifications `notif` | tele, sales, svc |
| Profile `profile` | tele |

Sales opening Today: **same URL**, denial copy *You cannot open this screen* (not a silent redirect that hides the test). Queue write/read APIs return **403** for sales.

**Scope this cycle:** a telecaller sees **own book**. Manager team scope is not built (no manager floor). **VERIFIED** against SCOPE-BRIEF (one-seat test).

### Proofs — VERIFIED command

`npm run prove` must print `PROVE_OK`. It runs:

| Script | Token | What it proves |
|---|---|---|
| `db:isolate` | `ISOLATION_OK` | Two tenants, unfiltered SELECT, no cross-read |
| `db:clock` | `CLOCK_OK` | After-hours → next open; first response 30 min into the working day |
| `db:assign` | `ASSIGN_OK` | Round-robin load; Anita → Nair |
| `db:access` | `ACCESS_OK` | Sales cannot open Today / queue |
| `db:scope` | `SCOPE_OK` | Own-book vs other telecaller |
| `db:search` | `SEARCH_OK` | Phone / partial / enquiry no / tenant boundary |

---

## 6. HTTP API (same tenant path; for a later phone app)

Cookie session of the demo seat. All go through `withTenant`. **VERIFIED**.

| Method | Path | Screen gate | Job |
|---|---|---|---|
| GET | `/api/health` | none | Process up |
| GET | `/api/v1/queue` | dayb | Today queue |
| GET | `/api/v1/pipeline` | pipe | Full book |
| GET | `/api/v1/search` | search | Search + filters |
| GET | `/api/v1/leads/:id` | rec | Record + events |
| POST | `/api/v1/leads` | new | File enquiry |
| GET | `/api/v1/notifications` | notif | List |
| POST | `/api/v1/notifications/read` | notif | One or all |
| GET | `/api/v1/hours` | profile | Branch hours |
| POST | `/api/v1/assign` | dayb | Assign unowned (also runs when Today opens) |
| POST | `/api/v1/dispositions` | tele | Record outcome |
| POST | `/api/v1/undo` | tele | Correction + restore |
| POST | `/api/v1/stage` | tele | Stage move |

No second database for mobile. Mobile UI (`mob`) is **out of scope**. **SPEC**.

---

## 7. Stack (IT)

| Layer | Choice **VERIFIED** |
|---|---|
| App | Next.js 16 App Router, React 19, TypeScript |
| UI | Tailwind v4, shadcn primitives restyled to Arth tokens |
| DB | Postgres 16, `postgres.js` |
| Auth this cycle | Demo cookie `arth_seat` / `arth_tenant`. Not production identity. |
| Dev bind | `127.0.0.1:43127` |

**Brand rules applied:** token colours (logo fills use CSS variables, not raw hex in `logo.tsx`). Five button variants, none green. No em dashes in product UI copy (title, trust, floor). No AI on the homepage. **VERIFIED** at last completeness pass.

**Migrations:** `src/db/migrations/0001` core + RLS · `0002` seed two tenants · `0003` Nair + Anita after-hours · `0004` sales seat Rao · `0005` restore overdue · `0006` full nine-stage book + parked example · `0007` notification copy.

---

## 8. Seed book (so reviewers know who should appear)

**Whitefield · A. Iyer** (examples; dates are relative to migrate time)

| Customer | Phone | Stage | Notes |
|---|---|---|---|
| Ramesh Kumar | 9876500001 | Contacted | Late follow-up. Enquiry no **FFFFFFF1**. Google / Grand Vitara |
| S. Nayak | 9876500002 | Qualified | Due later. Meta / Brezza |
| Meera Joshi | 9876500003 | Negotiation | Walk-in / Fronx |
| Lakshmi Rao | 9876500004 | (seeded) | Own book |
| Priya Menon | 9876500007 | Test drive | |
| Vikram Shah | 9876500008 | Quotation | |
| Farah Khan | 9876500009 | Booked | |
| Joseph Abel | 9876500010 | Contacted | Postponed / Parked until revisit |

**Whitefield · K. Nair:** Anita Desai 9876500006, after-hours Google form, Brezza.

**Coastal · M. Pinto:** Fazal Ahmed 9876500099.

Sources used in UI labels: Google, Meta, Walk-in, Inbound call.

---

## 9. Definition of done vs this build (Build Spec §8)

Nine points per screen. Honest status for directors.

| # | Spec point | This cycle |
|---|---|---|
| 1 | Access list can open; others 403 | **Met** for demoed seats (tele vs sales). Other Appendix B roles not seated. |
| 2 | Scope own vs team | **Met** for own-book tele. Team (manager) **not in cycle**. |
| 3 | Standard nine-column row | **Diverged.** Floor uses labelled cards (mobile-first). Whole card → record. Call is a separate control. Product may accept or send back to nine columns. |
| 4 | Every figure has source and period | **Met** on Today / pipe / search with human source lines (not SQL names). |
| 5 | Save bar; unsaved bar | **Met** on File enquiry. Disposition / stage confirm in-panel. Not a global dirty chrome on every list. |
| 6 | In-place confirm + undo | **Met** for disposition and stage move. Undo writes correction. |
| 7 | Empty, error, no-permission, offline | Empty copy on lists. Floor `loading` / `not-found` / `error` (boxed Open Today). Forbidden copy. Offline **banner** exists. **OPEN:** banner says calls will sync; there is **no offline write queue**. Do not claim sync. |
| 8 | Colour tokens, zero raw hex | **Met** on logo and floor chrome at last pass. |
| 9 | No horizontal scroll at 1100px | **Intended.** Cards wrap; record ledger is the wide surface. Please check on a 1100px window in review. |

---

## 10. Contradictions raised (do not quietly pick a side)

**SPEC vs SPEC — Search access**

- Build Spec Appendix B: Search reached by `adv`, `sales`.
- SCOPE-BRIEF-TELECALLING: Search is a telecaller screen (inbound call starts here).

**This cycle grants `tele` Search** so the floor can be tested. Brand / spec owners should reconcile Appendix B in writing.

**SPEC vs product copy**

- Appendix B names the console “On a call”. Floor label is **Log a call** because there is no telephony: the person dials the desk phone, then logs the outcome. **SPEC** SCOPE-BRIEF §5 supports testing without telephony.

**SPEC vs row**

- Standard nine-column row vs labelled cards. Cards were chosen so a phone-width floor still names fields. If directors want the nine-column row at desktop, that is a correction list item, not already done.

---

## 11. Explicitly not built (do not re-argue in this review)

From SCOPE-BRIEF §4. **SPEC.**

| Deferred | Why |
|---|---|
| Points engine and score screen | 20-second connect floor needs call duration; duration needs telephony. Shipping points first teaches gaming. |
| Telephony | No provider. Desk phone + log is the test. |
| WhatsApp `inbox` | Optional; floor tests without it. |
| Mobile `mob` | Floor sits at desks. APIs exist for later. |
| Sales, service, insurance, used car, delivery workspaces | Client descoped. |
| Manager assign (Option B), analytics | Next cycle unless you change the ruling. |
| The Exception Cockpit | Awaiting authorisation. |
| Attribution / cost per booking | Later phase. |

Also not production: real login, audit of demo cookies, multi-branch manager view, click-to-call, recordings.

---

## 12. What we want back from this review

A single correction list is enough. Please mark each item as **defect** (wrong vs spec or vs floor trust) or **taste** (copy, layout, density).

Useful prompts:

1. Accept labelled cards, or require the nine-column row at 1100px?
2. Confirm telecaller Search (Appendix B vs brief).
3. Confirm Log a call naming until telephony exists.
4. Anything on Today copy (names of late people vs counts only).
5. Anything hidden that a telecaller **must** see (value is hidden on purpose).
6. Seed book: enough ages and stages, or add production-like volume?
7. Offline: keep the honest banner, or remove the sync sentence until a queue exists?

Walk the ten steps in §3, then send the list. The next cycle of this floor is that list, not a new department.
