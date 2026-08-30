# Status

**Date:** 30 Aug 2026
**What you get this cycle:** conversion ops across sales, service, and insurance. Enquiries are the business. Role walls stay in force. Points stay live and require Dial for connected scores. Escalation notifies; it does not steal. Arthbot reports this dealer only. Not a live telephone exchange.

**Governing pack:** 00-START-HERE, VISIBILITY-WALLS, ARTH-ARCHITECTURE, Brand System v2.9, `docs/books/REQUIREMENTS-REGISTER-29-AUG.md`.

## What is built (this cycle)

- Every department's enquiries on one product. Two intakes: digital desk / platforms, and manager Excel upload. Principal and GM see all departments. Service is often the larger revenue.
- Role-based access: tele, service tele, insurance tele, sales, sales manager, service advisor, service manager, insurance executive, test drive coordinator, GM, principal, admin, accounts.
- Service ladder: appointment through ready. No test drive on a service seat. Coordinator owns demo-car cleanliness.
- Insurance: full catalogue. Top three suggested by dealer benefit that still holds up for the customer. Margin hidden from the floor, visible to principal, admin, GM.
- Add enquiry on Today. Duplicate check while the number is typed.
- Escalation clocks: unclaimed or overdue work moves TL → managers → GM → principal. Reassign is a superior's act.
- After meeting (sales): test drive slot, stock book, discount request, delivery. Only a sales manager releases a booked car.
- Cost per booking this month by source.
- Login: username and password, or mobile OTP (demonstration code on screen; no SMS vendor).
- Purpose-based WhatsApp consent: sales enquiry, service reminders, insurance renewal, offers.
- Inbound DID mapped per department. Ringing queue until a telephony vendor is connected.
- Arthbot for principal, GM, dealer admin. Allowlisted reports, CSV and PDF. Anthropic only picks the report kind. Fail closed. Telecalling cannot open it.
- Connected points require Dial in the last 15 minutes. Timer theatre does not score.

## How to run

```bash
cp .env.example .env.local
npm install
npx tsx scripts/migrate.ts 0031
npx tsx scripts/migrate.ts 0033
npm run prove
npm run dev
```

Open http://127.0.0.1:43127 then Open the product. Sign in on `/w/login`. Demonstration password: `arth-demo`. Iyer mobile for OTP: `9845011111`.

## Named, not built this cycle

**Live PSTN, recording, AI score from transcripts.** Vendor at launch. Inbound routing is modelled.

**Native mobile app.** Next phase.

**Exception Cockpit, full HR / payroll, used-car evaluator, workshop bays.** Later.
