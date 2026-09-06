# Director build report · 6 September 2026

Product Engineering Director master v1.0 governs. IT Director pack 31 August F1–F3 is included. Layers that already worked were not rebuilt: forced RLS, append-only ledgers, working hours on clocks, integer paise, sixteen original proofs.

Vendors are last. SMS, telephony, WhatsApp, payments, and vehicle lookup remain stubs in `src/vendors/`. Prem plugs them one by one. Env vars stay unset.

## IT Director F1–F3

| | Status |
|---|---|
| F1 Late section no OVERDUE stamp | VERIFIED in code. Seed mix of due/late is in migration 0034 |
| F2 Seed language | VERIFIED in 0034 updates to `lead_events.note` |
| F3 Last activity and Next wrap | VERIFIED. Ladder is compact so those columns keep width |

## Master items

| Item | Status | Proof |
|---|---|---|
| 1 SMS login | Adapter + persisted lockout. No live vendor. OTP still shown once | `AUTH_OK` |
| 2 Not an enquiry | Five reasons, two attempts, conversion excludes junk | `JUNK_OK` |
| 3 Catalogue | Maruti OEM + computed on-road + confirmation dates | `CATALOGUE_OK` |
| 4 Delivery chain | Twelve steps, promise ledger, public `/t/[token]` | `PROMISE_OK` |
| 5 Adviser tools 1–4 | Price, EMI, delivery estimate, slots. Each tap writes `discussed` | `ADVISE_OK` |
| 6 Prefill + handover card | Propose never default. Card on the enquiry record | `HANDOVER_OK` |
| 7 Points wallet | Top right. Unofficial until telephony | `POINTS_OK` plus copy |
| 8 Analytics | Seat figures with source and period. Exclusions counted | `FIGURES_OK` |
| 9 Telephony | Stub | Prem |
| 10 Ops | Runbooks, offboarding export, residency note | `docs/ops/RUNBOOKS.md` |

## Contradictions raised, not silently resolved

1. Master §1.3 auto-assigns after first-response. Earlier books said notify only. Code auto-assigns **only enquiries created in the last seven days**, so the demonstration shared book (old seed clocks already lapsed) still works. SPEC vs earlier book.
2. Insurance ladder in code (`quoted / recommended / issued / endorsed / renewed`) is not the master table (`Quoted / Documents / Payment / Issued / Active / Renewed`). Left as built. SPEC vs code.
3. Concealment penalties already in `floor-register` use −8 and −5. Master Part 3 says −5, −3, −4. Domain helpers match the master; the live penalty job was not rewritten. ASSUMED: changing live amounts would surprise a floor already seeing −8.
4. Duplicate junk is **not auto-merged**. A human names the other enquiry. Matches master 1.2 and 1.6.

## What did not change

Forced RLS. `lead_events` still insert-only for `arth_app`. Working hours still gate clocks. Money still paise. Dial still required for connected points. `arth-demo` still signs every seat in this environment.

## Vendors for Prem, in order

1. `ARTH_SMS_VENDOR` then implement `src/vendors/sms.ts` send.
2. `ARTH_TELEPHONY_VENDOR` then `src/vendors/telephony.ts`. Points become official.
3. `ARTH_WHATSAPP_VENDOR`.
4. Payments.
5. Vehicle lookup.

Until those exist, the product is ready to use as a demonstration and a pilot floor with honest labels.
