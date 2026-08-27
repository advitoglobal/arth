# Capacity: twenty lakh enquiries per dealer

**Target:** every dealer wall must stay usable at a minimum of **20 lakh (2,000,000) enquiries**. A dealer may dump an old book in one go, or grow to that size while the floor keeps working. Enquiry volume must not slow Search, Today, Log a call, My enquiries, the digital desk, or the dealer principal screen.

**What this is not:** a claim that one Next.js process on this machine serves 1,000 simultaneous signed-in seats. One Node process and one Postgres with a pool of 48 cannot honestly do that. 1,000 concurrent logins is an operations shape: several app workers, a pooler (PgBouncer in transaction mode), and Postgres sized for the connection count behind the pooler. The product work here is that **each action stays a bounded, indexed query**, so adding workers actually helps instead of each request scanning the whole book.

## What was wrong

- Search loaded the newest 80 visible rows, then filtered phone and name in JavaScript. An old dump would not appear.
- My enquiries and the digital desk loaded the **entire** visible book into memory and counted in JavaScript.
- Today pulled every owned and shared name, then filtered parked and “due today” in JavaScript.
- Opening Today armed clocks on **every** unowned name in a loop.
- RLS called `arth_lead_visible(id)`, which looked the lead up again for every row.

## What we changed

- Search, Today, My enquiries, and desk/principal counts run in SQL with `LIMIT` after the match. Stage counts are `GROUP BY`. Desk late and shared lists are capped; the figure is a `COUNT`.
- Indexes: trigram on customer phone and name, enquiry-number tail, `(tenant, created_at)`, `(tenant, owner, next_action)`, unowned partial, notifications by user.
- Visibility uses the lead row (`arth_lead_row_visible`) plus session `app.role_key` / `app.branch_id` set in `withTenant`. Missing session still fails closed.
- `last_disposition_key` on the enquiry so parked does not scan the ledger.
- Pool 48. `statement_timeout` 8 seconds per request.
- Clock arming only for unowned names that still lack a clock, at most 80 per open.
- A separate **Capacity Motors** dealer holds the 20 lakh book. Whitefield and Coastal stay small for walk-throughs.

## How to measure

```bash
npm run db:migrate
npm run db:load-capacity    # 20 lakh on Capacity Motors; skip if already loaded
npm run db:capacity         # timings; prints CAPACITY_OK
```

`ARTH_CAPACITY_N` overrides the book size (use a smaller N only on a laptop). `npm run prove` stays the functional wall checks and does not wait on 20 lakh.

Sign in as `captele` (same demonstration password) to use the large book. `iyer` is still the Whitefield walk-through.

## Budgets (single action, 20 lakh book, this pod)

| Action | Budget |
|---|---|
| Search by phone or name | 800 ms |
| Today | 800 ms |
| Open one enquiry | 400 ms |
| My enquiries counts plus 80 rows | 800 ms |
| Digital desk / principal snapshot | 1,500 ms |
| 24 searches at once | 4,000 ms |

If a budget fails, that is a defect. Do not “fix” it by loading fewer rows in the UI without a `COUNT` for the real figure.

## 1,000 logins at once

Keep doing:

- Bounded lists (80 search, 200 Today, 80 pipeline, 40 late on the desk).
- Indexed tenant-first predicates. Never `SELECT * FROM leads` for a screen.
- One dealer per request. Advito support still enters one dealer at a time.

Add when you actually have a thousand seats online:

- More than one Node instance behind the same Postgres.
- PgBouncer, so 1,000 browser sessions are not 1,000 Postgres backends.
- Postgres `shared_buffers` and disks sized for the hot indexes, not the default 128 MB lab setting.

The 24-way search burst on this pod is a **contention check**, not a 1,000-user load test. The invariant that scales is: no screen’s cost grows with the dealer’s whole book.
