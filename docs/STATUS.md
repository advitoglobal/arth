# Status

**Date:** 25 Aug 2026
**What you get this cycle:** a testable telecalling floor. Seven screens plus file-enquiry. An enquiry has an owner, a working-hours clock, a recorded outcome, and an append-only ledger. Not sales, not the Exception Cockpit, not points, not telephony.

**Governing pack:** 00-START-HERE, ARTH-ARCHITECTURE, SCOPE-BRIEF-TELECALLING, Brand System v2.9, .cursorrules

## What is built (this cycle)

- Step 0 isolation: Postgres 16, forced RLS, `withTenant`. `npm run prove` must print `PROVE_OK`.
- Working hours Mon-Sat 09:30-18:30 IST, Sunday closed. Sunday 21:40 IST starts Monday 09:30 IST. First response due Monday 10:00 IST.
- Round-robin assignment (option A) by current open-book load. After-hours delay is a `clock_deferred` event charged to the **branch**. Anita Desai lands on K. Nair, not A. Iyer.
- Lost reasons and dispositions seeded. Postponed needs a revisit. Lost needs a reason and that reason's fact. A callback more than 14 days away needs a reason.
- Seven telecalling screens at `/w/dayb` `/w/tele` `/w/pipe` `/w/rec` `/w/search` `/w/notif` `/w/profile`. File enquiry at `/w/new` when Search finds no match.
- Queue is due today plus breaching. Parked is derived. Difficulty band is stored and hidden from the telecaller row.
- Demo seats: A. Iyer, K. Nair, M. Pinto, S. Rao. Opening Today as S. Rao keeps `/w/dayb` and shows *You cannot open this screen*.
- Search: one box for phone, name, enquiry number, or model. A separate Filter panel for source, stage, overdue, parked, and arrived or follow-up dates. Enquiry numbers show on the tile and the record.

## Contradiction raised (SPEC)

Build Spec Appendix B lists Search as `adv`/`sales`. SCOPE-BRIEF-TELECALLING includes Search as a telecaller screen. This cycle grants `tele` access so the floor can be tested. Brand should reconcile Appendix B.

## Out of scope this cycle (SPEC)

Exception Cockpit, other workspaces, points, telephony, manager screens.
