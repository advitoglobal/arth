# VISIBILITY WALLS — EVERY DEPARTMENT

**Ruled 26 August 2026.** This is platform law, not a telecalling feature.
Sales, service, insurance, used car, delivery, and every later department
inherit these walls. A new screen that bypasses them is a defect.

## The four walls

A row of enquiry, customer, conversation, or vehicle data is visible only
if every wall in order says yes. Fail closed. Missing session, missing
user, or mismatched dealer means **zero rows**, not a fallback seat.

| Wall | Who it stops | Rule |
|---|---|---|
| **1 · Dealer** | Every other dealer in the SaaS | `tenant_id` equals the signed-in dealer. Forced RLS. Never application-only. |
| **2 · Branch** | Staff of another branch in the same dealer | Branch manager sees that branch. A name at another branch does not appear. |
| **3 · Team** | Staff outside the team | Team leader sees people who report to that seat, plus unowned new names at the branch. |
| **4 · Owner** | Other people in the same team | After a telecaller reaches the customer, only that owner (then sales after handoff). Search and Filter obey this. |

Dealer principal and dealer admin see **this dealer only**, all branches of
this dealer, never another dealer.

Advito admin and Advito support are not dealer seats. They list dealers from
outside the wall. To read enquiries they enter **one** dealer. That session
cannot include another dealer's rows.


## Who sees what

| Seat | Bucket |
|---|---|
| Telecaller / service telecaller | Own book, plus unowned names at this branch that nobody has reached |
| Sales consultant | Own book only (handed over to convert) |
| Team leader | Team books, plus unowned new names at the branch |
| Digital desk manager | Telecalling team at this branch, plus unowned names there |
| Dealer principal / dealer admin / advisor / Advito ops-on-dealer | This dealer |

## How it is enforced

1. **Postgres.** `FORCE ROW LEVEL SECURITY` on every tenant table.
   Enquiry rows go through `arth_lead_visible(lead_id)`. A SELECT with
   no `app.user_id` returns nothing. `npm run prove` must print `WALLS_OK`
   and `ISOLATION_OK`.
2. **Session.** `withTenant` sets dealer and user together, then checks
   that the user belongs to that dealer and is active. There is no other
   database path for product code.
3. **Search, Filter, record by id, APIs.** Same function. Knowing a UUID
   does not open another person's enquiry.

## When you add a table or a department

- Give it `tenant_id` and forced RLS before the first INSERT.
- If it is about a customer or an enquiry, visibility is
  `arth_lead_visible` (or a sibling function for that object).
- `USING` is the read wall. `WITH CHECK` on the dealer may allow a handoff
  write that leaves the writer's bucket. Never allow a write onto another
  dealer.
- Do not add a "see all" path for support without a dated decision.
- A proof must exist: two dealers, two branches or two seats, unfiltered
  SELECT, each sees only its bucket.

Breaking a wall is a defect regardless of the ticket.
