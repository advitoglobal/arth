# Status

**Date:** 24 Aug 2026
**Governing pack:** 00-START-HERE, ARTH-ARCHITECTURE, SCOPE-BRIEF-TELECALLING, Brand System v2.9, .cursorrules

## What is built (this cycle)

- Step 0 isolation: Postgres 16, forced RLS, `withTenant`. `npm run db:isolate` prints `ISOLATION_OK`.
- Working hours Mon-Sat 09:30-18:30 IST, Sunday closed. `npm run db:clock` prints `CLOCK_OK`. Sunday 21:40 IST starts Monday 09:30 IST. First response due Monday 10:00 IST.
- Round-robin assignment (option A) by current open-book load. After-hours delay is a `clock_deferred` event charged to the **branch**. `npm run db:assign` prints `ASSIGN_OK`. Anita Desai lands on K. Nair, not A. Iyer.
- Lost reasons and dispositions seeded. Postponed needs a revisit. Lost needs a reason and that reason's fact (price needs the quoted amount). A callback more than 14 days away needs a reason.
- Seven telecalling screens at `/w/dayb` `/w/tele` `/w/pipe` `/w/rec` `/w/search` `/w/notif` `/w/profile`. Queue is due today plus breaching. Parked is derived. My enquiries filters the nine stages. Enquiry record is the ledger. First-response breach writes a notification that names why it arrived.
- Demo seats: A. Iyer, K. Nair (same tenant, own books), M. Pinto (Coastal), S. Rao (sales). Opening Today as S. Rao keeps `/w/dayb` and shows *You cannot open this screen* (not a silent return to My enquiries). Queue API remains HTTP 403.
- Search: phone, name, source, stage, overdue, parked, vehicle. `GET /api/v1/search` carries the same filters. Iyer's book now has all nine stages plus a derived Parked row (Joseph Abel).
- Profile shows branch working hours from `working_hours`. Notifications mark read on open. Leave this floor is on the nav.

## Contradiction raised (SPEC)

Build Spec Appendix B lists Search as `adv`/`sales`. SCOPE-BRIEF-TELECALLING includes Search as a telecaller screen. This cycle grants `tele` access so the floor can be tested. Brand should reconcile Appendix B.

## Out of scope this cycle (SPEC)

Exception Cockpit, other workspaces, points, telephony, manager screens.
