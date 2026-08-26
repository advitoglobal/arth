# ARTH — START HERE

You are building **Arth**, the enquiry accountability system for Indian car dealerships,
**from scratch, in a clean repository.** This folder contains everything you need. Read
this file completely before opening anything else.

---

## 1 · WHAT YOU ARE BUILDING AND WHAT THAT MEANS

**This is a clean-room build.** There is no existing code to inherit, integrate with or
preserve. Everything is built to the documents in this folder.

**The documents are complete and internally consistent.** They were produced over an
extended product-engineering programme, reviewed line by line, and corrected where they
were wrong. Where you find a contradiction, **it is a defect in the documents and you
should raise it** rather than pick a side quietly.

**You are not expected to invent product decisions.** Nearly everything has been settled
and the reasoning is recorded. `DECISIONS.md` holds the rulings; `REWORK-REGISTER.md`
holds the ideas already rejected and why. **Read both before designing anything.** They
exist so the same wrong answer is not reached twice.

---

## 2 · WHAT ARTH IS

A car dealership buys advertising, receives enquiries, works them across several
departments, sells cars, services them and renews their insurance. Each step lives in a
different system or none at all, and nobody in the building can answer the two questions
that matter most: **what happened to that enquiry, and what did that customer cost us.**

Arth answers both, with evidence rather than assertion. **Every enquiry has an owner and a
clock. Every promise has a name against it. Every rupee of advertising can be traced to a
delivered car.**

**It is not a CRM.** Every dealer has one and it changed nothing. A CRM stores contacts;
Arth enforces accountability, which is a different job with a different measure of success.

Full positioning, the eleven principles, what the product deliberately refuses to do, and
the precise vocabulary are in `ARTH-PRODUCT-BOOK.html`. **Read it first.** It is the only
document that explains *why*, and the why determines a great many implementation choices
that otherwise look arbitrary.

---

## 3 · READING ORDER

| | File | What it gives you |
|---|---|---|
| 1 | `ARTH-PRODUCT-BOOK.html` | **What the product is and why.** 18 chapters. Principles, refusals, vocabulary |
| 2 | `ARTH-ARCHITECTURE.md` | **Stack, schema DDL, isolation, immutability, build order.** The technical core |
| 3 | `ARTH-BUILD-SPECIFICATION.md` | Objects, state machines, access matrix, **Appendix B: all 80 screens with routes and access lists** |
| 4 | `Arth-Platform.html` | **The visual reference. Open it in a browser now.** 80 screens, 22 seats, switch roles in the sidebar |
| 5 | `SCOPE-BRIEF-TELECALLING.md` | The first milestone, and why it is that one |
| 6 | `DECISIONS.md` and `docs/books/VISIBILITY-WALLS.md` | Rulings, and the four walls every department inherits |
| 7 | `REWORK-REGISTER.md` | Designs already rejected, with the condition for revisiting each. **Before proposing anything** |
| 8 | `ARTH-PROJECT-CONFIGURATION-BOOK.html` | What is configurable and by whom, integrations, failure modes, runbooks |
| 9 | `EIGHT-DECISIONS-ANSWERED.md` | Eight product rulings with full reasoning |
| 10 | `/brand/` | Colour, typography, components, voice. **When building any UI** |
| 11 | `/history/` | How decisions were reached. Archive, not required reading |

**Open `Arth-Platform.html` in a browser before writing code.** Ten minutes clicking
through it teaches more than an hour of reading. It is the product, visually, and it is
the reference for every screen you will build.

---

## 4 · BUILD ORDER

### Step 0 — The isolation guarantee. Before any feature.

> Open two sessions as two different tenants. Run the same unfiltered `SELECT` in both.
> **Confirm each sees only its own rows.**

**If this does not pass, nothing built afterwards can be trusted.** One dealer seeing
another's leads is the single failure this product cannot survive, and it must be
guaranteed by the database rather than by application code being correct. Architecture §5.

### Step 1 — Working hours

Architecture §4.3. A small table, and **every clock in the product runs through it**:
first-response targets, breach detection, the day panel, escalation timing, the queue.

Without it a lead arriving at 21:40 penalises a telecaller for being asleep, and the floor
stops trusting the product in its first week. **That is the failure mode that kills
adoption**, and it is cheap to prevent and expensive to retrofit.

### Step 2 — The telecalling workspace

`SCOPE-BRIEF-TELECALLING.md`. Seven screens, three shared dependencies.

**Why this workspace first:** it is where the product's central claim is easiest to prove,
it has the heaviest daily users, and it is what a live client has asked to test. It is also
a complete, demonstrable unit rather than a fraction of several things.

**Points and telephony are deliberately excluded** from this milestone. The reason is in
the brief and it is not an oversight: the twenty-second connect floor cannot be enforced
without call duration, and shipping a score before its anti-gaming control exists teaches
a floor to game it.

### Step 3 onward

Architecture §7 has the full order with dependencies. **Items 1 and 2 there are
irreversible; everything from 3 can be rebuilt if it turns out wrong.**

---

## 5 · THE FOURTEEN RULES THAT ARE NOT NEGOTIABLE

Breaking any of these is a defect regardless of what a ticket says. Reasoning in
Architecture §6.

1. **Money is integer paise.** Never float, never `NUMERIC` for currency.
2. **Ledgers are append-only by privilege**, not convention. A correction is a new row.
3. **Tenant isolation is forced at the database.** Inside a dealer, **four walls**: dealer, branch, team, owner. Search and Filter obey them. Law: `docs/books/VISIBILITY-WALLS.md`. Every later department inherits this.
4. **Derived, never stored:** chain state, exception state, Parked.
5. **Nine stages.** `new assigned contacted qualified test_drive quotation negotiation booked delivered`
6. **Stages, dispositions, chain steps, plans and thresholds are rows, not code.**
7. **Working hours gate every clock.**
8. **Every colour resolves to a token.** Zero raw hexes. Five button variants, **none green.**
9. **A connected call under 20 seconds earns no points and no penalty.**
10. **Difficulty is computed at assignment and frozen.** Hidden from executives.
11. **Every date on a row carries the event that produced it.** Never a bare date.
12. **Confirmation is in place, not a toast.** Undo as a correcting entry.
13. **Report, never silently correct.**
14. **No credential in any commit, document or chat.**
15. **No em dashes in product copy** (UI strings, labels, notifications). A brand voice
    rule about what a *user* reads. These specification documents use them freely.
16. **Four visibility walls, every department.** Dealer, then branch, then team, then owner.
    Fail closed if the session has no user. `docs/books/VISIBILITY-WALLS.md`.

---

## 6 · HOW TO WORK

**Label every claim about the system.** `VERIFIED` — you read the code or ran it.
`SPEC` — a document says so. `ASSUMED` — you are guessing. **Never state an assumption as
a fact.** Three findings on this programme were exactly that failure: a control claimed to
exist that did not, a colour rule contradicting the brand book, and a token proposed that
already existed. Each would have taken under a minute to check.

**A defect is not rework, it is the work.** The rework register lists rejected *designs*,
not forbidden areas. If something is broken, fix it.

**A rejected solution is not a rejected problem.** If an entry rejects an approach, the
problem it was solving is still real and a better answer is welcome. Every reversible
entry carries a **Revisit if** condition, which is the legitimate route to overturning it.

**Prefer asking over choosing** when a specification is ambiguous. An ambiguity raised
costs a message; an ambiguity resolved silently costs a rebuild.

**When these rules and the right thing to do conflict, say so.** Every rule here exists
because something went wrong once, and none was written with your situation in front of
it. **A rule you cannot question will eventually be wrong in silence.**
