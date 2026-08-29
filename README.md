# Arth

Enquiry accountability for Indian car dealerships. Not a CRM.

Telecalling is the front door: qualify, capture, route. Sales converts. Service telecalling is a separate seat. An enquiry has a clock, a call outcome, points, and an append-only ledger.

Governed by `00-START-HERE.md`, `docs/books/VISIBILITY-WALLS.md`, `docs/books/REQUIREMENTS-REGISTER-29-AUG.md`, and THE ARTH BRAND SYSTEM v2.9.

## Run

```bash
cp .env.example .env.local
npm install
npx tsx scripts/migrate.ts 0027
npx tsx scripts/migrate.ts 0028
npx tsx scripts/migrate.ts 0029
npx tsx scripts/migrate.ts 0030
npm run prove
npm run dev              # 127.0.0.1:43127
```

Open [http://127.0.0.1:43127](http://127.0.0.1:43127) then Open the product. Sign in on `/w/login`.

Demonstration seats (same demonstration password for every seat: `arth-demo`):

| Username | Seat |
|---|---|
| iyer | Whitefield telecaller |
| nair | Whitefield telecaller |
| pinto | Coastal telecaller |
| rao | Whitefield sales |
| dsouza | Coastal sales |
| menon | Whitefield team leader |
| gupta | Whitefield digital desk manager |
| shah | Whitefield dealer principal |
| padma | Whitefield dealer admin |
| books | Whitefield accounts (export only) |
| devi | Whitefield service telecaller |
| fernandes | Coastal digital desk manager |
| kamath | Coastal dealer principal |
| advito | Advito admin |
| support | Advito support |
| onboard | Advito onboarding (no dealer book) |
| captele | Capacity Motors telecaller (20 lakh book, load checks) |
| capdesk | Capacity Motors digital desk |
| capprin | Capacity Motors dealer principal |

## How the floor works

- **Shared new book.** New names are on Today for every telecaller at the branch, in that department, until someone reaches the customer (a connected call of 20 seconds or more).
- **Meeting, not Qualified.** Nine stages. The ladder is on the list and the record.
- **Direct or pool.** Direct: the telecaller names the receiving executive. Pool: first to claim owns it.
- **Consent.** WhatsApp brochure and quotation refuse if the customer has withdrawn.
- **Prices and EMI.** Dealer price master and a dated bank-rate table. Not inferred by a model. Quotations freeze.
- **Wallet.** Each point movement is named. Penalties are for concealment only.
- **Accounts.** Incentive export. No enquiry content.
- **Dial and duration.** The on-screen timer is the duration Arth stores. This is not a live telephone exchange.

## Floor

| Screen | Route | Job |
|---|---|---|
| Today | `/w/dayb` | Late first, daily welcome, Start next call |
| Log a call | `/w/tele` | Dial, WhatsApp, outcome, stage, hand on |
| My enquiries | `/w/pipe` | Nine stages. Sales also sees the unclaimed pool |
| Enquiry record | `/w/rec?id=` | Full ledger, claim, reassign |
| Search | `/w/search` | One search box, then Filter |
| Add enquiry | `/w/new` | Capture, then qualify |
| Performance | `/w/perf` | Charts, score, ranking, holding, gaps, plan |
| The floor | `/w/desk` | Digital desk: team, assignment mode, why we lose, upload |
| This dealer | `/w/prin` | Dealer principal: this dealer only |
| Dealer setup | `/w/admin` | Price master, rates, audit |
| Accounts | `/w/books` | Incentive export only |
| Dealers | `/a/dealers` | Advito: list, enter one |
| Onboard | `/a/onboard` | Advito admin and onboarding |

`npm run prove` must print `PROVE_OK`. A twenty lakh book is Capacity Motors. See `docs/CAPACITY.md`.
