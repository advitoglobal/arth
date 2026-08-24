# RESPONSE — FRONT-END HANDOVER REVIEW

**From:** Director, Product Engineering
**To:** IT Director, Arth · cc Prem Kumar · Brand · 18 August 2026
**Re:** `REVIEW-FRONTEND-HANDOVER.md`
**Returning:** §3 withdrawn outright, §2 done rather than proposed, §4 corrected. Amended file attached.

---

## §1 THE GREEN BUTTON — WITHDRAWN, AND IT DOES NOT NEED BRAND

You offered to take it to Brand as a legitimate question. **I am declining that, because it is not a legitimate question and I should not have made it one.**

Your three arguments are each sufficient on their own:

- The Book gives five button variants and none is green.
- **Semantic colour never decorates.** A button is not a fact about a record. The moment a green button exists, green on a row stops reading as *settled* and starts reading as *clickable*, which destroys one of only two semantic colours the product has.
- `#1F6650` is not even Settled. It is a third green nobody approved, sitting beside a semantic one it would be confused with.

**And then I measured it, which I should have done before writing the rule:**

| | White text on it |
|---|---|
| Brass `#B07F2C` — the original failure | **3.55:1** |
| Green `#1F6650` — my invention | 6.83:1 |
| **Ink `#0F2A33` — the Book's own primary** | **15.01:1** |

**The Book's existing answer is more than twice as good as the thing I invented to replace it.** The contrast failure that started this was real; the solution was already in §5.3 and I walked past it.

**Done in the file:** `.btn.go` is Ink fill with Ink-pressed on hover. The component reference now carries the withdrawal and the reason, so nobody re-proposes it in six months.

**One thing Prem should hear directly**, because this reverses a choice he made. He picked option 4 from the call-button study and he picked it on the evidence he was shown. **The error was mine** — I put a green fill in that study without checking it against §5.3 first, so he was choosing from a set that should never have contained it. The light dialer panel he also chose is kept; it was the good half and it is what makes an Ink button read as primary.

---

## §2 THE COLOURS — CONSOLIDATED, NOT PROPOSED

You counted seventeen. I counted **sixteen against the declared tokens**, and the difference is itself worth flagging: my `:root` declares `--ink-2 #16333D` and `--ink-3 #1B3D48`, which **may not be in `arth-palette.json` either.** If they are not, they are two more and they are mine. Please check against the file rather than against my stylesheet.

**The shape matters more than the count. Sixteen values were doing six jobs.**

| Job | Raw values used | Resolution |
|---|---|---|
| Text on Ink | `#DCE7EA` `#B9CCD1` `#9FB6BD` `#8FA8AE` `#7FA0A9` `#6E8B93` | **Three tokens** |
| Divider and pressed state on Ink | `#2A4D57` `#3A5C66` `#10222A` | **Two tokens** |
| Text on brass-wash | `#6B4C14` `#7A5716` | **One token** |
| Border on brass-wash | `#E5D3AE` | Collapsed to `--brass-lift` |
| Border on over-wash | `#E39B90` `#F2D5D1` | One token, one collapsed |
| The green button | `#1F6650` `#185040` | **Deleted** |

**The real finding underneath it: the palette has no on-dark scale.** The Book was written for light surfaces, and the Cockpit, the day panel, the login split and every annotation block are dark. Six near-neighbours appeared because there was no token to reach for. **That is a gap in the palette, not sixteen acts of carelessness — but it produced sixteen, which is your point and it stands.**

**Proposed additions, all measured, no new hue:**

| Token | Value | On Ink | Role |
|---|---|---|---|
| `--on-ink` | `#DCE7EA` | **11.91:1** | Body text on Ink |
| `--on-ink-mut` | `#9FB6BD` | **7.08:1** | Muted text on Ink |
| `--on-ink-dim` | `#7FA0A9` | **5.36:1** | Labels and eyebrows on Ink |
| `--ink-line` | `#2A4D57` | non-text | Divider on Ink |
| `--ink-press` | `#10222A` | non-text | Pressed Ink |
| `--brass-text` | `#6B4C14` | **6.42:1 on brass-wash** | See below |
| `--over-line` | `#E39B90` | non-text | Border on over-wash |

**`--brass-text` is the one I would defend hardest.** Text on brass-wash currently has no compliant answer: **`--brass-deep` measures 4.19:1 on `#F3E7CE` and fails.** Every warning block in the product uses that combination. This is not a convenience token, it is a live contrast failure with no approved fix.

**File status: zero colours outside the token set.** Twenty-seven values, twenty-seven tokens, every raw hex replaced with `var()`. It will pass the raw-colour lint today. **The seven additions still need Brand's sign-off** — I have consolidated them so the question is seven measured tokens rather than sixteen strays, but the ruling is Brand's and I am not pre-empting it.

---

## §3 THE METRIC NAMES — CORRECTED

You are right that a screen labelled *Delivered* wired to the old definition is the two-authors problem coming back through the front door.

**Corrected across the analytics and management screens:**

- **Deals closed** — leads with at least one delivered chain. **51.**
- **Cars delivered** — vehicles handed over. **56.**
- **Conversion** — enquiry to deal closed, on the lead numerator. **3.0%, not 3.3%.**
- The funnel now says **Booked, leads** and **Deals closed, leads**, with a line stating that every step counts leads.

**And the gap card is built, as you asked.** It sits on Sales analytics:

| Figure | Counts | July |
|---|---|---|
| Bookings | Leads that reached a booking | 62 |
| Deals closed | Leads with at least one car delivered | 51 |
| Cars delivered | Vehicles handed over | 56 |
| **The delivery pipeline** | **Booked, no car delivered yet** | **11** |

**The eleven are the point.** Eleven customers have paid a booking amount and have no car. That is money committed and a promise made, and no dealer principal has ever been shown it as one figure. It is not a conversion problem and does not belong in the funnel — it is the delivery chain, and it says how much of last month's selling is still owed to somebody.

The note on the card carries the reason cars exceed deals: **a twelve-vehicle fleet order is one deal closed and twelve cars delivered, and any screen treating them as one number reports a fleet month as a retail collapse.**

---

## §4 THE ADVITO SPLIT — AGREED, RECORDED, NOT NOW

Correctly caught. Three surfaces is a substantial control-plane change and the shipped control plane is one admin surface. **It is a design position, not a screen, and it needs its own work order when its turn comes.** Recorded as such. Nothing about it is in this cycle.

---

## §5 ON YOUR §6 — THE PROPORTION POINT IS THE RIGHT ONE

> *Eighty screens against a team that has shipped two workspaces. Both statements are correct and both will be forgotten by the second week unless the work order says which screens are in this cycle.*

**That is a better instrument than my §0.** A category written in a covering document is a good intention; a work order naming eight screens is a constraint. **The work order is yours and I will build to whatever it names rather than to the eighty.**

If it helps in writing it: the screens buildable today with no new data are the telecalling set, Screen B, the enquiry pipeline and record, walk-in capture, search, notifications, profile, and the branch first-response comparison. Everything else waits on §5 of the handover.

---

## §6 STATUS

| Item | State |
|---|---|
| Green action button | **Withdrawn.** Ink fill. Component reference carries the reason |
| Sixteen raw colours | **Consolidated to seven proposed tokens.** Zero strays in the file |
| `--ink-2` and `--ink-3` | **Flagged** — may not be in `arth-palette.json` either. Yours to check |
| `--brass-text` | Live contrast failure with no approved fix. Needs Brand |
| Metric names | **Corrected.** Three names, three numbers |
| Delivery pipeline gap card | **Built** |
| Advito split | Recorded, unscoped, not this cycle |
| Which screens are in this cycle | **Yours.** I build to the work order |

---

*You have now twice found that I asserted something without measuring it — a control that did not exist, and a colour rule that contradicted the Book. Both times the measurement took under a minute. The fourth label was the right correction and the habit behind it is still the thing to fix.*

---

*Response to the front-end handover review, 18 August 2026. To be filed in `docs/decisions/`.*
