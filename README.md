# Arth

Enquiry accountability for Indian car dealerships. Not a CRM.

This repository is the **telecalling floor**, complete for this cycle: one department, working end to end. An enquiry has an owner, a working-hours clock, a recorded call outcome, and an append-only ledger. Scores, telephony, other workspaces, and the Exception Cockpit are not in this cycle.

Governed by `00-START-HERE.md`, `docs/books/SCOPE-BRIEF-TELECALLING.md`, `docs/ARTH-ARCHITECTURE.md`, and THE ARTH BRAND SYSTEM v2.9.

Director review of this cycle: `docs/REVIEW-TELECALLING-BUILT.md`.

## Run

```bash
# Postgres 16, role arth_app, database arth
cp .env.example .env.local   # set DATABASE_URL locally. Never commit it.
npm install
npm run db:migrate
npm run prove            # isolation, clock, assignment, access, scope, search
npm run dev              # 127.0.0.1:43127
```

Open [http://127.0.0.1:43127](http://127.0.0.1:43127) then Open the product. Sign in on `/w/login`.

Demo seats:

- Whitefield Motors · A. Iyer and K. Nair (telecallers, own books)
- Coastal Cars · M. Pinto (other tenant)
- Whitefield Motors · S. Rao (sales consultant; Today is refused)

## Floor

| Screen | Route | Job |
|---|---|---|
| Today | `/w/dayb` | Late calls first, then due later today |
| Log a call | `/w/tele` | Dial on the desk phone, record the outcome |
| My enquiries | `/w/pipe` | Nine stages, add enquiry |
| Enquiry record | `/w/rec?id=` | Opens from tapping the card |
| Search | `/w/search` | One search box, then Filter with dates |
| File enquiry | `/w/new` | When Search finds nothing |
| Notifications | `/w/notif` | Each row says why it arrived. Tap the row to open. |
| My profile | `/w/profile` | Seat and branch hours |

## API for later mobile

`GET /api/v1/queue` · `GET /api/v1/pipeline` · `GET /api/v1/search` · `GET /api/v1/leads/:id` · `POST /api/v1/leads` · `GET /api/v1/notifications` · `GET /api/v1/hours` · `POST /api/v1/notifications/read` · `POST /api/v1/assign` · `POST /api/v1/dispositions` · `POST /api/v1/undo` · `POST /api/v1/stage`

Same `withTenant` path. No second database for a phone app.
