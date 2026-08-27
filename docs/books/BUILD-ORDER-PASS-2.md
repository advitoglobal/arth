# BUILD ORDER · TELECALLING FLOOR, PASS 2

**For:** the Arth clean-room build
**Date:** 26 August 2026
**Source of truth:** this file, then `docs/books/`
**Scope:** the telecalling floor only. Seven screens. Nothing else.

---

## §0 READ THIS BEFORE ANYTHING ELSE

**This is a correction pass on a floor that already works.** Pass 1 built it and it was reviewed. Most of it was right. This file lists what to change and what to leave alone.

**Do not rebuild anything.** The foundation is correct: forced row-level security, append-only ledgers by privilege, working hours gating the clock, money in paise, nine stages as rows, undo as a correcting entry. **All of that stays exactly as it is.**

### Hard stops

**Build only these seven screens:**
`Sign in` · `Today` · `Log a call` · `My enquiries` · `Enquiry record` · `Search` · `File an enquiry` · `Notifications` · `My profile`

**Do not build, do not scaffold, do not stub:**

| Not this cycle | Why |
|---|---|
| **Any score or points screen** | Points need call duration to enforce a 20-second connect floor. Duration needs telephony. No provider is chosen. **Shipping a score before its anti-gaming control exists teaches a floor to game it** |
| **Any manager screen** | Floor today, Assignment, Team scores, Why we lose, Response times. Designed, not in scope |
| **Any dealer principal screen** | Decisions, What bookings cost, Compare branches |
| **Any Advito screen** | Admin or support |
| **Telephony of any kind** | No dialler, no recording, no duration capture |
| **Sales, service, delivery, insurance, used car** | Descoped by the client |

**If you think one of the above is needed to make something else work, stop and ask.** Do not build it and explain afterwards.

---

## §1 THE ORDER OF WORK

Five batches. **Finish and report each batch before starting the next.** Do not combine them into one commit.

| Batch | What | Why this order |
|---|---|---|
| **1** | The two defects that block a demonstration | Nothing can be shown until these are fixed |
| **2** | Seed data | Everything visible depends on it |
| **3** | Layout corrections | Safe, visible, easy to review |
| **4** | Copy corrections | Cosmetic, fast |
| **5** | Proofs | Confirms 1 to 4 actually hold |

---

## §2 BATCH 1 · THE TWO DEFECTS

### 1.1 · The disposition panel must not open with an outcome chosen

**Where:** Log a call, the disposition panel.

**Now:** `initial` is `dispositions[0].key`, so the panel opens showing `Connected, callback` with its revisit field. `Record outcome` is never disabled and validation happens only after the request is sent.

**Why this is the most serious defect on the floor:** a telecaller can press save without ever choosing an outcome, and what gets written is a connection. Forty times a morning. **Nothing errors. The ledger simply says the floor performed better than it did**, which is the exact failure the product exists to end.

**Change:**

1. The outcome select opens with **no selection**, showing `Select an outcome`.
2. **No conditional field renders until an outcome is chosen.** Revisit date must not be on screen before an outcome that requires it is picked.
3. `Record outcome` is **disabled** until an outcome is chosen and every field that outcome requires is filled. Validate on the client, not only on the server.
4. Changing the outcome after fields are filled **clears the fields that no longer apply.**

**Requirements by outcome, unchanged from pass 1:**

| Outcome | Requires |
|---|---|
| Connected, callback | Revisit date. Plus a reason if more than 14 days out |
| Postponed | Revisit date. Same 14-day rule |
| Lost | Lost reason, then the specific fact that reason demands |
| Not connected · busy / switched off / no answer | Nothing beyond an optional note |

### 1.2 · The offline banner must not promise sync

**Where:** the offline banner, all screens.

**Now:** it says calls will sync. **There is no offline write queue.**

**Change:** remove the sync claim. State that the connection is lost and work cannot be saved right now.

**Do not build an offline queue in this pass.** Fixing the sentence is the whole task.

### 1.3 · Revisit is a date, not a date and time

**Now:** `datetime-local`.

**Change:** date only. **A telecaller does not know the hour, and a fabricated hour in a ledger is worse than no hour.**

---

## §3 BATCH 2 · SEED DATA

### 2.1 · Seed events, not stages

**Now:** leads are seeded directly at a stage. The result is Meera Joshi at `Negotiation` (7 of 9) and Priya Menon at `Test drive` (5 of 9), both showing **"No activity recorded."**

**Why this cannot ship:** the product's central claim is that every enquiry carries a ledger. **The first card a reviewer sees says the ledger is empty on a lead six stages deep.** They do not know it is seed data.

**Change:** every seeded lead must be walked up the ladder by inserting `lead_events`, with its stage following from that history. **A lead's stage must be reachable from its own events.**

Each event needs a plausible actor, timestamp inside working hours, and where relevant a disposition and note.

### 2.2 · More volume

**Now:** roughly eight enquiries per telecaller.

**Change:** **30 to 40 per telecaller**, with a realistic age spread.

**Why:** a floor with eight enquiries cannot demonstrate a queue that empties, and a dealer principal judges believability by the shape of the book. It should look like a Tuesday, not a fixture file.

Keep the four named walk-through cases exactly as they are: **Ramesh Kumar, Anita Desai, Fazal Ahmed and the S. Rao refusal.**

---

## §4 BATCH 3 · LAYOUT

### 3.1 · Nine fields, not seven, at desktop

**Now:** `lg:grid-cols-[1.5fr 1fr 0.9fr 0.9fr 1.2fr 1.2fr 6.5rem]`, with name, phone, enquiry number and status stacked together in column one.

**Change:** at `lg` and above, split column one into four separate columns.

**The nine, in order:**

| | Field | Note |
|---|---|---|
| 1 | Customer name | |
| 2 | Phone | Monospace |
| 3 | Enquiry number | Monospace |
| 4 | Status stamp | `OVERDUE` / `PARKED` / blank |
| 5 | Vehicle | Model over variant |
| 6 | Source | Source over location |
| 7 | Stage | Name over `n of 9` |
| 8 | **Last activity** | **The event, then the date.** "Called, no answer · 03 Aug". Never a bare date |
| 9 | Next | What is due and when. Overdue in `--arth-overdue` |

**Below `lg` the current stacked card is correct. Keep it.** Column headings render at `lg` and above only.

### 3.2 · Remaining count on the Late heading

**Add** a count on the right of the Late block heading: `6 remaining`. **It must decrease when a call is logged.**

**Why:** a queue's whole value is that it falls. A number that does not visibly decrease is a list, and a list does not feel finishable.

### 3.3 · Parked as a stamp

**Now:** plain uppercase text. **Change:** a stamp, same treatment as `OVERDUE`, using `--arth-brass-wash` on `--arth-brass-pill`.

### 3.4 · Sign in must not show floor chrome

**Now:** a signed-in visitor to `/w/login` sees the nav tiles and Log out above the sign-in form.

**Change:** either redirect a signed-in visitor to their landing, or render this route with the ink band showing the wordmark only.

### 3.5 · Notifications: one target per row

**Now:** the whole row is clickable **and** there is a separate Open button.

**Change:** remove the button. The row is the target.

---

## §5 BATCH 4 · COPY

### 4.1 · The render artifact in the enquiry number

**Now:** `Enquiry <!-- -->FFFFFFF7` in the markup. **Change:** remove the artifact. The enquiry number goes onto paperwork and into Search; a copy-paste carrying a comment is a support call nobody will diagnose quickly.

### 4.2 · Marketing page defects

| | Now | Change |
|---|---|---|
| **Headline layout** | One word per line, running off the viewport | Size the type for the container it is in |
| **"artha"** | *"One delivered car is artha."* | **The mark is `arth`.** Two spellings in one viewport is a problem a dealer notices before he notices the software |
| **The ₹9,200 line** | *"those forty calls cost ₹9,200 and produced one delivered car"* | **₹9,200 is cost per booking for one campaign. It is not the cost of forty calls.** As written it reads as ₹230 per telephone call, which is not a claim we make. Rewrite it to say what is true, or use a figure that means what the sentence says |

### 4.3 · Copy that must not change

These are correct and better than the specification. **Leave them exactly as written:**

- *"Hours are not on file for this branch. Clocks cannot be trusted until they are."*
- *"No rows yet. The first call writes the first row. Rows are never edited."*
- *"Undo writes a correcting entry. The original row stays."*
- *"This screen is for another seat."*
- *"Every one says why you got it."*

---

## §6 BATCH 5 · PROOFS

Two additions to `npm run prove`. Both must print their token.

### `db:ledger` → `LEDGER_OK`

Assert **no lead beyond the `contacted` stage has zero `lead_events`.** This is what stops 2.1 regressing.

### `db:queue` → `QUEUE_OK`

Take a seat's queue count for today. Log one disposition with a future revisit date. Assert the count **decreased by exactly one** and that the lead now derives as `Parked`.

**Every existing proof must still pass.** If one breaks, stop and report it rather than adjusting the proof.

---

## §7 DO NOT TOUCH

| Leave alone | Reason |
|---|---|
| `withTenant`, RLS policies, `FORCE ROW LEVEL SECURITY` | Correct and expensive to get wrong |
| `REVOKE UPDATE, DELETE` on any ledger | Correct |
| Working hours, the clock, after-hours assignment | Correct, and proven |
| The undo mechanism | Correct. Writes a correction, restores from payload |
| Auto-advance after ~1500ms | Correct. This is the ruling working |
| The 403 refusal at the same URL | Correct. Do not change it to a redirect |
| Today's three-block split | Correct. Late first |
| The token block | 21 tokens. **Do not add a colour without asking** |
| `Log a call` as the screen name | Correct. Better than "On a call" |

---

## §8 HOW TO REPORT BACK

After each batch, write to `docs/PASS-2-STATUS.md` and stop.

**For each item in the batch:**

1. **What changed**, with the file and the line.
2. **What did not change**, and why.
3. **Anything that turned out to be already correct.** Say so; do not pretend to have fixed it.
4. **Anything you disagreed with**, and what you did instead.

**After batch 5, add:**

- The full terminal output of `npm run prove`.
- A list of the nine routes with a one-line note on what a reviewer will see at each.
- **Screenshots of `Today`, `Log a call` with the outcome unselected, `Log a call` after saving, and one enquiry record with its ledger**, at 1440px wide.

**Label every claim** `VERIFIED` if you ran it, `SPEC` if a document says so, `ASSUMED` if you are guessing.

**If anything in this file contradicts something in `docs/books/`, say so rather than choosing.** These documents have been reviewed carefully, so a contradiction is a real defect and worth knowing about.
