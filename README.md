# Arth

Enquiry accountability for Indian car dealerships. Not a CRM.

Every department's enquiries are the business: sales, service, insurance. Two intakes: digital desk and platforms, and manager Excel upload. Telecalling qualifies and hands on inside the same department. The dealer principal and GM see the whole dealer because service is often the larger revenue.

Governed by `00-START-HERE.md`, `docs/books/VISIBILITY-WALLS.md`, and THE ARTH BRAND SYSTEM v2.9.

## Run

```bash
cp .env.example .env.local
npm install
npx tsx scripts/migrate.ts 0031
npx tsx scripts/migrate.ts 0033
npm run prove
npm run dev              # 127.0.0.1:43127
```

Open [http://127.0.0.1:43127](http://127.0.0.1:43127) then Open the product. Sign in on `/w/login`.

Demonstration password for every seat: `arth-demo`. Or use mobile OTP (Iyer: `9845011111`). Optional `ANTHROPIC_API_KEY` lets Arthbot pick the report kind. It still cannot leave this dealer.

| Username | Seat |
|---|---|
| iyer | Whitefield telecaller |
| nair | Whitefield telecaller |
| rao | Whitefield sales |
| lal | Whitefield sales manager |
| kumar | Whitefield GM |
| shah | Whitefield dealer principal |
| padma | Whitefield dealer admin |
| books | Whitefield accounts (export only) |
| devi | Whitefield service telecaller |
| irfan | Whitefield service advisor |
| mehta | Whitefield service manager |
| iqbal | Whitefield insurance telecaller |
| nanda | Whitefield insurance executive |
| ravi | Whitefield test drive coordinator |
| gupta | Whitefield digital desk |
| pinto / fernandes / kamath | Coastal seats |
| advito / support / onboard | Advito platform |
| captele | Capacity Motors telecaller (20 lakh book) |

## How the floor works

- **Shared new book** per department until a connected Dial of 20 seconds or more.
- **Department ladders.** Sales still uses Meeting. Service uses Appointment. Insurance uses Quoted. Service never books a test drive.
- **Escalation notifies.** Reassign is a superior's decision.
- **Stock.** Sales books a VIN. Only a sales manager releases it.
- **Insurance.** All products listed. Top three suggested. Nothing hidden on the call.
- **Consent** is per purpose, not one box.
- **Arthbot** for principal, GM, dealer admin. CSV and PDF. Fail closed.
- **Inbound DID** per department. Not a live exchange yet.

## Floor

| Screen | Route | Job |
|---|---|---|
| Today | `/w/dayb` | Late first, Add enquiry, inbound ring |
| Log a call | `/w/tele` | Dial, consent, outcome, department stage, hand on |
| My enquiries | `/w/pipe` | Department ladder |
| Service | `/w/svc` | Workshop book, no test drive |
| Insurance | `/w/ins` | Full catalogue, top three suggested |
| Stock | `/w/stock` | Booked units |
| Test drives | `/w/drive` | Coordinator slots |
| All departments | `/w/gm` | GM: cost per booking, escalations |
| This dealer | `/w/prin` | Principal: all departments plus people |
| Arthbot | `/w/bot` | Allowlisted reports, CSV / PDF |

`npm run prove` must print `PROVE_OK`. A twenty lakh book is Capacity Motors. See `docs/CAPACITY.md`.
