# Pass 2 status

**Date:** 27 August 2026  
**Note:** `docs/books/BUILD-ORDER-PASS-2.md`  
**This file** is the report the note asked for after the five batches. Most floor items were already in the repo. This pass closed the remaining visual gaps so Advito can print and compare.

---

## Batch 1 · Two defects

| Item | Result |
|---|---|
| 1.1 Outcome select empty, save disabled, fields only after a choice | **Already correct.** `src/components/disposition-panel.tsx`. Record outcome stays disabled until the panel is valid. Changing outcome clears revisit, lost reason, and fact. **This pass:** connected callback now requires a revisit day in config (`0015_callback_needs_revisit.sql`) and in `canSave`. |
| 1.2 Offline banner must not promise sync | **Already correct.** `src/components/offline-bar.tsx`: *Working offline. Work cannot be saved until you are connected.* No queue built. |
| 1.3 Revisit is a date | **Already correct.** `type="date"`. |

**Did not change:** server still requires *what was said* on a connected call. Pass 2 called the note optional for not-connected only. A connected call without a sentence is a ledger that cannot be used in a dispute, so the note stays required. **Disagreed, kept the stricter rule.**

---

## Batch 2 · Seed data

| Item | Result |
|---|---|
| 2.1 Seed events, not empty ledgers past Contacted | **Already correct.** `LEDGER_OK`. |
| 2.2 Volume 30–40 per telecaller; keep Ramesh, Anita, Fazal, Rao | **Already correct.** Named walk-throughs still used in proofs. Whitefield book is tens of enquiries, not eight. |

**Did not change:** seed files. Regenerating volume would move clocks and break walk-throughs you are about to print.

---

## Batch 3 · Layout

| Item | Result |
|---|---|
| 3.1 Nine columns at `lg` | **Already correct.** `src/components/enquiry-row.tsx`. Cards below `lg`. |
| 3.2 Remaining count on Late | **Changed this pass.** `src/app/w/dayb/page.tsx` Block heading shows `N remaining` on the right, including Due later and Also due, so the whole day visibly falls. |
| 3.3 Parked as stamp | **Changed this pass.** Parked uses `--arth-brass-wash` on `--arth-brass-pill`, same stamp shape as Overdue. `src/components/brand/type.tsx`. |
| 3.4 Sign-in without floor chrome | **Changed this pass.** Unsigned `/w/login` and `/w/denied` use an ink band with the wordmark only. No nav tiles. `src/app/w/layout.tsx`. |
| 3.5 Notifications: one target | **Already correct.** The row is the click target. No Open button. |

---

## Batch 4 · Copy

| Item | Result |
|---|---|
| 4.1 Enquiry number comment | **Already correct.** ``Enquiry ${number}``. |
| 4.2 Homepage arth and ₹9,200 as cost per booking | **Already correct.** `src/app/page.tsx`. Headline sizes with the container (`text-[28px]` then `sm:text-[44px]`). |
| 4.3 Protected lines | **Left exactly.** Notifications lead is now *Every one says why you got it.* |

---

## Batch 5 · Proofs

Existing proofs were not rewritten except where connected callback now requires a revisit day (`prove-assign`, `prove-points`). That matches batch 1. `npm run prove` must still print `PROVE_OK`.

Control seats (digital desk, dealer principal, Advito) stay in the product so you can print them against the director note. Pass 2 hard-stopped those screens. Advito asked for them afterwards. They are extra, not a floor rebuild.

---

## Nine routes a reviewer will see

| Route | What you will see |
|---|---|
| `/w/login` | Ink band, wordmark, sign-in form. No floor tiles. Password `arth-demo`. |
| `/w/dayb` | Today. Late has `N remaining` on the right. Start next call. |
| `/w/tele` | Log a call. Outcome starts empty. Record outcome disabled until the panel is valid. |
| `/w/pipe` | My enquiries, nine stages. |
| `/w/rec?id=` | Enquiry record, append-only ledger. |
| `/w/search` | One search box, then Filter. File enquiry when nothing matches. |
| `/w/new` | File an enquiry. |
| `/w/notif` | Rows that say why they arrived. The row is the target. |
| `/w/profile` | Seat, hours, points with the 20-second floor. |

Also for comparison prints: `/w/desk` (digital desk), `/w/prin` (dealer principal), `/a/dealers` (Advito).

---

## Screenshots

Taken at 1440px after this pass, saved under `docs/prints/`:

- `today.png`
- `log-a-call-empty-outcome.png`
- `log-a-call-after-save.png`
- `enquiry-record.png`
