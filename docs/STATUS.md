# Status

**Date:** 26 Aug 2026
**What you get this cycle:** the telecalling floor plus the first control set: digital desk manager, dealer principal, Advito admin (onboard dealers), and Advito support (enter one dealer at a time). Four visibility walls stay in force. Not a live telephone exchange, not a recording file, not the Exception Cockpit, not other departments' managers.

**Governing pack:** 00-START-HERE, VISIBILITY-WALLS, ARTH-ARCHITECTURE, SCOPE-BRIEF-TELECALLING, Brand System v2.9, .cursorrules

**Director review pack:** `docs/REVIEW-TELECALLING-BUILT.md`. Pass 2 note: `docs/books/BUILD-ORDER-PASS-2.md`. Alignment vs this repo: `docs/PASS-2-ALIGNMENT.md`. UI extraction: `docs/UI-EVIDENCE.md`.

## What is built (this cycle)

- Step 0 isolation: Postgres 16, forced RLS, `withTenant` bound to an active seat of that dealer. Four walls (`docs/books/VISIBILITY-WALLS.md`). `npm run prove` must print `PROVE_OK` including `WALLS_OK` and `ISOLATION_OK`.
- Working hours Mon-Sat 09:30-18:30 IST, Sunday closed. Sunday 21:40 IST starts Monday 09:30 IST. First call due Monday 10:00 IST.
- Round-robin on Today open is **withdrawn**. New names stay unowned until a connected call of 20 seconds or more. After-hours delay is still a `clock_deferred` event charged to the **branch**. Anita Desai is in the shared book, then belongs to the telecaller who reaches her.
- Username and password login. Demonstration password is documented on `/w/login`. Production uses SSO.
- Points on disposition, WhatsApp, and handoff. Connected under 20 seconds scores nothing (`POINTS_OK`). Duration is the on-screen timer.
- Auto caller: Start next call lines up late names first until Today is empty.
- WhatsApp brochure / quotation / both from the call screen. Message uses model, variant, and what was said. Ledger row. Opens `wa.me`. No Business API.
- Hand to sales after Qualified. Sales converts on My enquiries. Coastal sales seat: M. Dsouza.
- Lost reasons and dispositions seeded. Postponed needs a revisit. Lost needs a reason and that reason's fact. A callback more than 14 days away needs a reason.
- Seven telecalling screens at `/w/dayb` `/w/tele` `/w/pipe` `/w/rec` `/w/search` `/w/notif` `/w/profile`. File enquiry at `/w/new` when Search finds no match.
- Queue is due today plus late. It decrements when a call is logged (`QUEUE_OK`). Parked is a stamp. Difficulty band is stored and hidden from the telecaller row. Expected value is hidden from tele and sales.
- Outcome select opens empty. Record outcome stays disabled until the panel is valid. Revisit is a date, not a time.
- Desktop row at `lg` splits name, phone, enquiry number and stamp into four columns. Cards below `lg`.
- In-place confirmation after a disposition or a stage move. Undo inside that window writes a correction and restores the previous stage.
- Enquiry numbers (last eight of the id) on the tile, the record, Log a call, and Search.
- Demo seats: A. Iyer, K. Nair, M. Pinto, S. Rao, M. Dsouza. Username and password. Opening Today as S. Rao keeps `/w/dayb` and shows *You cannot open this screen*.
- Search: one box for phone, name, enquiry number, or model. A separate Filter panel for source, stage, overdue, parked, and arrived or follow-up dates. Filters run in SQL. A 20 lakh dump is a separate dealer; see `docs/CAPACITY.md`.
- Performance analysis on each current seat (telecaller, sales, team leader, digital desk, dealer principal, Advito). Holding, gaps, and a plan from the live book. `/w/perf`.

## How to run

```bash
cp .env.example .env.local
npm install
npm run db:migrate
npm run prove
npm run dev
```

Open http://127.0.0.1:43127 then Open the product. Sign in on `/w/login`.

## Contradiction raised (SPEC)

Build Spec Appendix B listed Search as `adv`/`sales`. SCOPE-BRIEF-TELECALLING includes Search as a telecaller screen. **Ruled 26 Aug 2026:** `tele` has Search. Appendix B is amended. Not a build defect.

## Named, not built this cycle

**Consent by purpose.** No `consent` table. A live floor that telephones customers needs one row per purpose, never one tick for everything. **Deferred until a live-client floor is authorised.** Trigger: first real customer record that will be called. Retrofitting onto records already being called is the expensive version.

**`audit_logs`.** Absent. `lead_events` is the enquiry ledger (append-only). Access, permission changes and exports are a separate ledger and are not in this database. **Deferred until production identity.** Trigger: first non-demo session.

**Assignment-on-open.** Withdrawn. New names stay in the shared book. Clocks still arm when Today opens (`armUnownedClocks`). Eventual shape: a scheduled job for clocks, with the screen call remaining as a fast path.

**Palette on-dark scale.** Build uses `n40` / `n20` / `brass-lift` on ink (measured 6.49 / 9.83 / 6.37). Prototype has `--on-ink` and related tokens; build has `--arth-ink-deep` which the prototype does not. **Both versions go to Brand. Do not add tokens here until Brand rules.**

## Out of scope this cycle (SPEC)

Exception Cockpit, other workspaces, live telephony/recording, manager screens (assignment option B), WhatsApp Business API.
