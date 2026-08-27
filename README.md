# Arth

Enquiry accountability for Indian car dealerships. Not a CRM.

This repository is the **telecalling floor**. Telecalling qualifies an enquiry and hands it to sales. Sales converts. An enquiry has a clock, a call outcome, points, and an append-only ledger.

Governed by `00-START-HERE.md`, `docs/books/VISIBILITY-WALLS.md`, `docs/books/SCOPE-BRIEF-TELECALLING.md`, `docs/ARTH-ARCHITECTURE.md`, and THE ARTH BRAND SYSTEM v2.9.

## Run

```bash
cp .env.example .env.local
npm install
npm run db:migrate
npm run prove
npm run dev              # 127.0.0.1:43127
```

Open [http://127.0.0.1:43127](http://127.0.0.1:43127) then Open the product. Sign in on `/w/login` with a username and password.

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
| fernandes | Coastal digital desk manager |
| kamath | Coastal dealer principal |
| advito | Advito admin |
| support | Advito support |

## How the floor works

- **Shared new book.** New names are on Today for every telecaller at the branch. The name stays there until someone **reaches** the customer (a connected call of 20 seconds or more). Then it belongs only to that telecaller. Search and Filter follow the same wall.
- **Buckets.** Telecaller: own book plus unowned new names at the branch. Digital desk: that branch team. Dealer principal: that dealer only. Advito admin lists dealers and onboards. Advito support enters one dealer at a time. Postgres forced RLS enforces this. Missing `app.user_id` sees nothing. Another dealer never appears.
- **Qualify, then hand to sales.** Telecalling qualifies. **Hand to sales** moves ownership to the branch sales consultant. Conversion is their job.
- **Auto caller.** On Today, **Start next call** loads the highest-priority name. After you record the outcome, the next one loads until the list is finished.
- **Dial and duration.** Dial on this device or the desk phone. The on-screen timer is the duration Arth stores. There is no recording file until a telephone provider is connected.
- **WhatsApp.** On a call, send brochure, quotation, or both. The message uses the model and variant, plus what was said. It opens WhatsApp with a prepared text and writes a row on the enquiry history. Attach the PDF from the phone. A WhatsApp Business API is not connected.
- **Points.** Outcome base × difficulty (hot 1.0, warm 1.5, cold 2.5, very cold 3.5). A connected call under 20 seconds scores nothing. Totals are on My profile.

## Floor

| Screen | Route | Job |
|---|---|---|
| Today | `/w/dayb` | Late first, shared new names, Start next call |
| Log a call | `/w/tele` | Dial, WhatsApp, outcome, stage, hand to sales |
| My enquiries | `/w/pipe` | Nine stages. Sales sees handed-over names |
| Enquiry record | `/w/rec?id=` | Full ledger |
| Search | `/w/search` | One search box, then Filter |
| File enquiry | `/w/new` | When Search finds nothing |
| Notifications | `/w/notif` | Each row says why it arrived |
| The floor | `/w/desk` | Digital desk: team load, shared book, place a name |
| This dealer | `/w/prin` | Dealer principal: this dealer only |
| Dealers | `/a/dealers` | Advito: list, enter one, onboard (admin) |

`npm run prove` prints isolation, clock, assign, access, scope, search, ledger, disposition, queue, points, walls, desk, and platform.
