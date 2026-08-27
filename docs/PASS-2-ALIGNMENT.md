# Pass 2 alignment (director note vs this repo)

**Date:** 27 August 2026  
**Director file:** `docs/books/BUILD-ORDER-PASS-2.md` (26 August 2026)  
**This is a reading, not a rebuild.** Advito has said the note is incomplete and that per-role / per-screen changes will be instructed after discussion with the director.

Claims: **VERIFIED** = read or ran in this repo. **SPEC** = the pass-2 file says so.

---

## How to read the two instructions

Pass 2 is a **correction pass on the telecalling floor only**. Hard stop: do not build manager, dealer principal, or Advito screens.

Advito later asked for digital desk, dealer principal, Advito admin, and Advito support. That work is in the repo (`/w/desk`, `/w/prin`, `/a/*`). **SPEC** of pass 2 and **VERIFIED** later instruction disagree. Until you and the director settle it, those control seats stay. They are not a telecalling-floor defect; they are extra surface.

---

## Floor items in pass 2, against the code

| Item | Pass 2 | In the repo | Verdict |
|---|---|---|---|
| 1.1 Outcome select empty, save disabled, no extra fields until chosen | Required | `disposition-panel.tsx`: `Select an outcome`, `type="date"`, save disabled until valid | Aligned **VERIFIED** |
| 1.2 Offline copy, no sync claim | Required | "Working offline. Work cannot be saved until you are connected." | Aligned **VERIFIED** |
| 1.3 Revisit is a date | Required | `type="date"` | Aligned **VERIFIED** |
| 2.1 Seed events, not empty ledgers past Contacted | Required | `LEDGER_OK` in `npm run prove` | Aligned **VERIFIED** |
| 2.2 Volume 30–40 per telecaller; keep Ramesh, Anita, Fazal, Rao | Required | Isolation counts ~71 / ~31 leads; named cases still used in proofs | Aligned in spirit **VERIFIED** |
| 3.1 Nine columns at `lg` | Required | Name, phone, enquiry, stamp, vehicle, source, stage, last activity, next | Aligned **VERIFIED** |
| 3.2 Count on Late heading, decreases when a call is logged | Required | Late block title is only "Late". Queue decrement is proven (`QUEUE_OK`) but the heading has no `N remaining` | **Not aligned** **VERIFIED** |
| 3.3 Parked as stamp | Required | `StatusStamp state="parked"` | Aligned **VERIFIED** |
| 3.4 Sign-in without floor chrome | Required (redirect or wordmark only) | `/w/login` has no floor nav. A leftover cookie no longer skips the form | Aligned **VERIFIED** |
| 3.5 Notifications: row is the only target | Required | Row is the click target. No separate Open button. Mark all read remains | Aligned **VERIFIED** |
| 4.1 Enquiry number comment artifact | Remove | Template is ``Enquiry ${number}`` | Aligned **VERIFIED** |
| 4.2 Headline, mark is `arth`, ₹9,200 is cost per booking | Required | Homepage uses arth and "source costing ₹9,200 a booking" | Aligned **VERIFIED** |
| 4.3 Five copy lines left alone | Do not rewrite | Those strings are still in the product | Aligned **VERIFIED** |
| 5 Ledger + queue proofs | Required | `LEDGER_OK` `QUEUE_OK`; full `PROVE_OK` still includes them | Aligned **VERIFIED** |
| §7 Leave RLS, undo, 403 at same URL, three-block Today, tokens | Do not touch | Still in place | Aligned **VERIFIED** |

---

## Where this repo went further than pass 2

Pass 2 **SPEC** hard-stops these. They are in the product because of later Advito instructions, not because pass 2 asked for them:

- Points on My profile, with an on-screen call timer (`POINTS_OK`). Pass 2: no score screen, no duration capture, no telephony of any kind.
- WhatsApp templates and auto caller (Start next call).
- Digital desk `/w/desk`, dealer principal `/w/prin`, Advito `/a/dealers` `/a/onboard`.
- Sales handoff after Qualified.

Foundation pass 2 said to keep **is** kept: forced RLS, append-only `lead_events`, working hours, paise, nine stages as rows, undo as a correction.

---

## Defects inside the pass-2 note (for your discussion)

1. **§0 says seven screens, then lists nine** (Sign in through My profile, including File an enquiry). **SPEC** contradiction in the note itself.
2. **Batch discipline** (finish and report each batch, do not combine commits) was not how this repo was built. The floor corrections above were already in when pass 2 was compared. There is no `docs/PASS-2-STATUS.md` per batch.
3. **Manager / principal / Advito** are forbidden in pass 2 and requested by you afterwards. That is the item to settle with the director before per-role screen work.

---

## What I will not do until you instruct

- Remove desk, principal, or Advito seats to match pass 2 §0.
- Start the per-role / per-screen redesign you will agree with the director.
- Treat pass 2 as the only source of truth where it conflicts with a later instruction from you.

The one pass-2 floor gap still open is **3.2: `N remaining` on the Late heading**. Say if you want that done now, or held with the rest of the discussion.
