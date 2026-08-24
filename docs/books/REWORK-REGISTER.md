# REWORK REGISTER

## What this file is, and what it is NOT

**IT IS:** a record of *designs* already proposed and turned down, with the reason,
so the same wrong idea is not built twice.

**IT IS NOT:** a list of forbidden areas, and it never blocks a fix.

> **If something here is broken, fix it. A defect is not rework, it is the work.**
> The register governs *proposals*, not *repairs*. Finding a bug in a screen listed
> below is a reason to fix the screen, never a reason to leave it broken.

Every entry has a **Revisit if** condition. That is the legitimate exit. If the
condition is met, the entry can be overturned by appending a superseding entry to
`DECISIONS.md` with the date and the reason. **Nothing here is permanent except
Part B, and Part B says plainly why.**

**A rejected design is not a rejected problem.** If an entry below rejects a
solution, the problem it was solving is still real and a better answer is welcome.

---

## PART A: rejected designs, all reversible

| Rejected | Why | Instead | Revisit if |
|---|---|---|---|
| Green action button `#1F6650` | Contradicts the Book's five variants. Turns a semantic colour into a control colour | Ink fill, 15.01:1 | Brand adds an approved control green to the palette |
| `--brass-text #6B4C14` | The approved token already existed and this overwrote it | `--arth-brass-pill #7A5716` | The palette drops or changes brass-pill |
| Twelve pipeline stages | Duplicated the delivery chain inside the sales pipeline | Nine stages | The delivery chain stops being a separate object |
| Count-up animation on figures | Showed 6,625 for ~2s when the true value was 9,642 | Render the final figure | It can animate without ever displaying a wrong number |
| Toast confirmation after a disposition | Invisible at forty times a morning, and dismissible | In-place panel confirmation | A screen where the action happens only once or twice a session |
| Postponement as a lost reason | It is not a loss. The lead stays open | Its own outcome, requiring a revisit date | Never expected to change, but it is a product decision not a law |
| Per-seat pricing | Stops a dealer giving the RTO clerk a login, which is where promises break | Priced on enquiries | Founder changes the pricing model |
| Building our own telephony or STT | Licensed businesses with their own regulators | Integrate | No provider serves the market, or integration cost exceeds building |
| A native mobile app this cycle | Store review on every release, two codebases | Responsive web | Push notifications or camera become essential |
| Household + service line built now | Needs Household and Service, neither of which exists | Weak version from data already held | Phase 6 lands |

## PART B: hard constraints, not design choices

**These are the only entries that cannot be overturned by a work order.** Changing
one needs Prem in writing, and in two cases it needs a lawyer rather than a designer.

| Constraint | Why it is not a preference |
|---|---|
| Margin never visible below dealer admin. Salary never below the principal | A margin-driven ranking loses the customer's trust. Salary visibility is an employment matter |
| Chain state, exception state and Parked are derived, never stored | An append-only table cannot repair a bad snapshot. A wrong stored value is wrong permanently |
| One consent row per purpose, never one tick | Legal. Four permissions are four permissions |
| Money is integer paise. Never floating point | Rounding errors in money are not recoverable |
| Ledgers are append-only by privilege | The evidentiary value of the ledger is the product |
| Tenant isolation forced at the database | A missing WHERE clause must not be able to leak one dealer to another |
| No em dashes in product copy | Brand voice. Cosmetic, but settled, and 231 were removed once already |

---

## How to overturn an entry

1. Say which entry, and which **Revisit if** condition has been met.
2. Append the new ruling to `DECISIONS.md` with the date and the reason.
3. Move the entry here to *Superseded* below, with a pointer to the new ruling.
4. **Do not delete it.** The record of a reversal is as useful as the record of a rejection.

## Superseded

_(none yet)_
