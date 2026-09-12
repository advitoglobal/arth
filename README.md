# Arth

Enquiry accountability for Indian car dealerships. Not a CRM.

Every department's enquiries are the business: sales, service, insurance. Two intakes: digital desk and platforms, and manager Excel upload. Telecalling qualifies and hands on inside the same department. The dealer principal and GM see the whole dealer because service is often the larger revenue.

Governed by `00-START-HERE.md`, `docs/books/VISIBILITY-WALLS.md`, and THE ARTH BRAND SYSTEM v2.9.

## Run

Node 22. Copy `.env.example` to `.env.local`. Do not commit `.env.local`.

### Windows (Docker Desktop)

Both Windows machines use this path. `scripts/migrate.ts` calls `sudo` and will not run on Windows.

```powershell
copy .env.example .env.local
npm ci
npm run db:migrate-docker
npm run prove
npm run dev
```

`db:migrate-docker` starts `postgres:16` as container `arth-pg` on port 5432, creates role `arth_app`, and applies every file in `src/db/migrations`. If port 5432 is already taken, stop that Postgres first so both laptops stay on the same database.

### Linux

```bash
cp .env.example .env.local
npm ci
npx tsx scripts/migrate.ts
npm run prove
npm run dev              # 0.0.0.0:43127
```

Linux can also use `npm run db:migrate-docker` if Docker is easier than a local `postgres` user.

On this machine, open [http://127.0.0.1:43127/w/login](http://127.0.0.1:43127/w/login). Cursor Desktop Preview of `127.0.0.1` opens on your laptop, not this host, so it cannot reach the app. Use the public tunnel URL from the agent when you are not on the same machine.

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
- **Escalation notifies.** Recent unclaimed names (last seven days) auto-assign after the first-response window. Older demonstration names stay shared until someone reaches the customer.
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
| Delivery | `/w/delivery` | Twelve-step chain and promise ledger |
| Customer track | `/t/[token]` | No login. Expires 30 days after delivery |
| All departments | `/w/gm` | GM: cost per booking, escalations |
| This dealer | `/w/prin` | Principal: all departments plus people |
| Arthbot | `/w/bot` | Allowlisted reports, CSV / PDF |

`npm run prove` must print `PROVE_OK`. A twenty lakh book is Capacity Motors. See `docs/CAPACITY.md`.

## Director review pack

Share `docs/directors-review/` with Product and IT. Open `ARTH-DIRECTOR-REVIEW.html` for screenshots and the built record. Open `CODE-ATLAS.md` for the full source in one file.

## Team test on Vercel

The cloud agent can publish a claimable Vercel preview for floor testing. That preview talks to a Neon Postgres copy of Whitefield Motors and Coastal Cars only (not the 20 lakh Capacity book).

1. Open the preview URL the agent gives you. Sign in on `/w/login` with password `arth-demo`.
2. Claim the Vercel project so it stays on Advito's account.
3. Claim the Neon database within 72 hours, or the book disappears.

Arthbot reports need `ANTHROPIC_API_KEY` on the Vercel project after you claim it. Dial and inbound are still desk simulation, not a live exchange.
