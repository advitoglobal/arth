# Status

**Date:** 24 Aug 2026
**Governing pack:** 00-START-HERE, ARTH-ARCHITECTURE, SCOPE-BRIEF-TELECALLING, Brand System v2.9, .cursorrules

## What is built (this cycle)

- Step 0 isolation: Postgres 16, forced RLS, `withTenant`. Test output: `ISOLATION_OK`. Whitefield sees 4 enquiries. Coastal sees 1. Cross-tenant SELECT returns 0.
- Step 1 working hours seeded Mon-Sat 09:30-18:30, Sunday closed. Clocks go through `src/domain/clock.ts`.
- Telecalling seven screens at `/w/dayb` `/w/tele` `/w/pipe` `/w/rec` `/w/search` `/w/notif` `/w/profile`
- Round-robin assignment is in seed (option A). Points and telephony deferred per brief.
- `/api/v1/queue` and `/api/v1/dispositions` for a future mobile client

## Contradiction raised (SPEC)

Build Spec Appendix B lists Search as `adv`, `sales`. SCOPE-BRIEF-TELECALLING includes Search as a telecaller screen. This cycle grants `tele` access so the floor can be tested. Brand should reconcile Appendix B.

## Out of scope this cycle (SPEC)

Exception Cockpit, other workspaces, points, telephony, manager screens.
