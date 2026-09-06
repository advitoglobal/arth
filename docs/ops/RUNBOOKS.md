# Operations runbooks

These are the four runbooks a compliance officer will ask for. Restore is tested by replaying `scripts/migrate.ts` against a copy of `arth`, then `npm run prove`.

## Incident

1. Freeze writes: set the floor to read-only by taking the app process down. Database stays.
2. Capture `audit_logs` and `lead_events` for the window. They are append-only.
3. Restore from the last known good dump if data is wrong. See Restore.
4. Tell the dealer principal what was frozen, and when the floor can record again.

## Data correction

Nothing in `lead_events`, `delivery_promises`, `point_movements`, or `audit_logs` is updated. A correction is a new row (Undo on the call desk, or a manager note). If a merge was wrong, file a new enquiry. Do not join two households in SQL.

## Offboarding

Dealer admin or principal: Dealer setup, Export this dealer. The CSV is the contractual file. The export writes `offboarding_exports` and an audit row.

## Full onboarding

Advito onboarding seat: `/a/onboard`. One rooftop, sales and telecalling first. Working hours must exist before clocks are trusted. Price master and bank rates need confirmation dates. SMS and telephony stay unset until Prem plugs them.

## Data residency

Login copy may say Mumbai. This database is wherever `DATABASE_URL` points. Until that host is India, say so on Trust. Do not claim Mumbai residency in product copy.

## Demonstration password

`arth-demo` is for this demonstration environment only. Remove it from any environment that will hold real customer data. Item 1 of the master build (SMS vendor) is Prem's, last.
