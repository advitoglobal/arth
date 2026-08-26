# Status

**Date:** 26 Aug 2026
**What you get this cycle:** the telecalling floor is complete and testable. Seven screens plus file-enquiry. An enquiry has an owner, a working-hours clock, a recorded outcome, and an append-only ledger. Not sales, not the Exception Cockpit, not points, not telephony.

**Governing pack:** 00-START-HERE, ARTH-ARCHITECTURE, SCOPE-BRIEF-TELECALLING, Brand System v2.9, .cursorrules

## What is built (this cycle)

- Step 0 isolation: Postgres 16, forced RLS, `withTenant`. `npm run prove` must print `PROVE_OK`.
- Working hours Mon-Sat 09:30-18:30 IST, Sunday closed. Sunday 21:40 IST starts Monday 09:30 IST. First call due Monday 10:00 IST.
- Round-robin assignment (option A) by current open-book load. After-hours delay is a `clock_deferred` event charged to the **branch**. Anita Desai lands on K. Nair, not A. Iyer.
- Lost reasons and dispositions seeded. Postponed needs a revisit. Lost needs a reason and that reason's fact. A callback more than 14 days away needs a reason.
- Seven telecalling screens at `/w/dayb` `/w/tele` `/w/pipe` `/w/rec` `/w/search` `/w/notif` `/w/profile`. File enquiry at `/w/new` when Search finds no match.
- Queue is due today plus late. Parked is derived. Difficulty band is stored and hidden from the telecaller row. Expected value is hidden from tele and sales.
- In-place confirmation after a disposition or a stage move. Undo inside that window writes a correction and restores the previous stage.
- Enquiry numbers (last eight of the id) on the tile, the record, Log a call, and Search.
- Demo seats: A. Iyer, K. Nair, M. Pinto, S. Rao. Opening Today as S. Rao keeps `/w/dayb` and shows *You cannot open this screen*.
- Search: one box for phone, name, enquiry number, or model. A separate Filter panel for source, stage, overdue, parked, and arrived or follow-up dates.

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

Build Spec Appendix B lists Search as `adv`/`sales`. SCOPE-BRIEF-TELECALLING includes Search as a telecaller screen. This cycle grants `tele` access so the floor can be tested. Brand should reconcile Appendix B.

## Out of scope this cycle (SPEC)

Exception Cockpit, other workspaces, points, telephony, manager screens (assignment option B).
