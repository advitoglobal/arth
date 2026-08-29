# Status

**Date:** 29 Aug 2026
**What you get this cycle:** the telecalling front door plus receiving sales, dealer admin, accounts export, and Advito onboarding. Four visibility walls stay in force. Not a live telephone exchange, not a recording file, not the Exception Cockpit, not full HR or payroll.

**Governing pack:** 00-START-HERE, VISIBILITY-WALLS, ARTH-ARCHITECTURE, Brand System v2.9, `docs/books/REQUIREMENTS-REGISTER-29-AUG.md`, `docs/books/ARTH-PRODUCT-TREE.html`.

## What is built (this cycle)

- Step 0 isolation: Postgres 16, forced RLS, `withTenant`. Four walls. `npm run prove` must print `PROVE_OK` including `WALLS_OK`, `ISOLATION_OK`, and `REGISTER_OK`.
- Nine stages: New · Assigned · Contacted · **Meeting** · Test drive · Quotation · Negotiation · Booked · Delivered. The ladder is on the list and the record.
- Add enquiry: four-field capture first, then qualify on the same screen. The enquiry exists and has an owner from the first save.
- Telecalling is the front door. Sales telecaller and service telecaller are different seats. Intake is labelled **Pushed from telecalling** or **Uploaded by manager**.
- Assignment: Direct (telecaller names the executive) or Pool (first to claim owns it). Reassign always needs a reason on the ledger.
- WhatsApp brochure / quotation is consent-gated. A withdrawn customer refuses the button.
- Price master and bank rates are dated dealer tables. EMI is calculated from those rates. A model does not invent a rate. A quotation freezes the versions it used.
- Score wallet shows each movement, never a jumping total. Penalties are concealment only: lapsed first response, missed commitment, no outcome. Lost, short call, and conversion are not penalised.
- Daily welcome on Today, once a day, dismissible, not a popup. It does not invent a good day.
- Dealer admin (`padma`): assignment mode, service upload, price master, audit log.
- Accounts (`books`): incentive export only. Zero enquiry and customer rows.
- Advito onboarding (`onboard`): provisions a dealer. Cannot enter a dealer book.
- Forgot password tells the manager. They never hold a live password.
- Working hours, shared new book, auto caller, points on disposition with a 20-second floor, Performance charts, 20 lakh Capacity dealer: unchanged and still in force.

## How to run

```bash
cp .env.example .env.local
npm install
npx tsx scripts/migrate.ts 0027
npx tsx scripts/migrate.ts 0028
npx tsx scripts/migrate.ts 0029
npx tsx scripts/migrate.ts 0030
npm run prove
npm run dev
```

Open http://127.0.0.1:43127 then Open the product. Sign in on `/w/login`. Demonstration password: `arth-demo`.

## Named, not built this cycle

**Live autodialer, recording, downstream listen (R9).** No provider. The product is honest: this is not a live telephone exchange.

**AI lead score (R23).** Needs transcription after telephony. A number with no reasons will never ship.

**Full delivery chain, workshop bays, insurance ranking, used-car evaluator, Exception Cockpit, native app, DMS, payroll.** Out of this cycle.

**Full HR.** Employment and handover stay later. Accounts does not pay from Arth.
