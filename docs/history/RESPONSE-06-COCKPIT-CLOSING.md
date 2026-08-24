# RESPONSE 06 — CLOSING

**From:** Director, Product Engineering
**To:** IT Director, Arth · cc Prem Kumar · 16 August 2026
**Re:** your Response 05
**Returning:** both findings accepted, one addition to each, and nothing else

---

## §1 §3.1 — ACCEPTED. FAST PATH AND GUARANTEE

You are right and I had it backwards. **An enqueue is a message and messages are lost.** If the admin's transaction commits and the enqueue does not, the acknowledgement outlives its scope with nothing scheduled to notice — which is a worse version of the window I set out to close, because a bounded window at least ends.

**The nightly sweep stays as the guarantee. The enqueue is only the fast path.** And your warning is the important half: it must not be removed later on the grounds that the enqueue makes it redundant. That reasoning will look sound to somebody who was not here.

### The addition

**When the nightly sweep finds an orphan the enqueue should have caught, it reports it.**

Otherwise the guarantee silently masks the fast path failing. An enqueue that has been broken for three weeks looks exactly like an enqueue that is working, because the nightly run cleans up behind it either way. Same discipline as the sampled lead reconciliation: **the mechanism that catches the failure must also say that it caught one.**

---

## §2 §3.2 — ACCEPTED, AND THE COUNT IS WORTH MORE THAN A CEILING

On the scale instrument beside `leads` and the rate-limit counters, in the migrate job. Accepted without qualification, and *"fine for years is the same sentence we said about leads at 1,548 rows"* is the argument.

### The addition

**This table's growth rate is a product signal, not only a scale signal, and it is the only direct measure of whether the Cockpit is nagging.**

Nine types across a handful of scopes should produce a small number of events a month at a healthy dealership. **If a tenant is generating two hundred, one of two things is true** — the dealership is genuinely in trouble, which the principal already knows, or **the thresholds are too tight and the screen has become the long list it exists to prevent.**

Nothing else in the product can tell us that. Adoption tells us whether people open it; this tells us whether it was worth opening. **So the threshold in the scale check is worth setting at the point where the screen has probably become noise rather than at the point where the table is large** — a much lower number, and a more useful alarm.

Your call on the figure. I would rather it fired early and taught us something than late and told us about disk.

---

## §3 §2 — NOTHING TO ADD

Nulls are indexed, the index shape is right, `IS NULL` written deliberately in any raw SQL, and one `DISTINCT ON` ordered to match rather than nine round trips. All of that is yours and I would not have known the first part.

---

## §4 WHAT IS LEFT

| With | What |
|---|---|
| **Prem** | The ownership model. Response 03 §5, in his language, one answer |
| **Prem** | The DDL, under Rule 1, in his own words |
| **Me** | Screen B for telecalling, then the nine Cockpit types drawn to specification grade |

**One expectation to set about the drawings.** They will arrive with the data-dependency block on every screen, and I expect that block to be the useful part rather than the pictures. Screen B is the safest case because telecalling is fully built; **the Cockpit drawings will almost certainly show that some card I think is straightforward needs something nobody records.** That is the point of drawing them now, and finding it is your half.

---

## §5 CLOSING

Five rounds, and what changed: a record became a ledger, two unwritable columns became five database-level constraints, one return trigger became four, an unbounded dial became a bounded and logged one, and a closure that a human could have written became one that only the mechanism can.

**Your last line is the accurate one and I will not improve on it.** A shape that survives five rounds is not one that was nearly right. What I would add is only the division: I brought the man at nine in the morning, you brought the schema, and every finding in this exchange came from one of us being in territory the other could not see into. **Neither instrument alone would have produced this table.**

---

*Response 06. The exchange closes here. To be filed in `docs/decisions/`.*
