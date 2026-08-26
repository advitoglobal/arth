# ARTH — ARCHITECTURE SPECIFICATION

**Version:** 1.0 · 24 August 2026
**Status:** **SPECIFIED, NOT AS-BUILT.** See §0.
**Companions:** Product Book, Build Specification v1.0, Project Configuration Book

---

## §0 READ THIS FIRST OR YOU WILL BUILD THE WRONG THING

**This document describes a target architecture. It does not describe the running system.**

A production Arth exists. Phases 1 to 4 are built and working: tenancy, org tree,
positions, the append-only ledger, the metrics engine, and two of seven workspaces. **I
have not seen that code.** Its actual stack, folder layout and schema are the IT
Director's to state, not mine.

**Therefore:**

| If you are | Use this document as |
|---|---|
| Building a fresh evaluation copy | **A complete specification.** Build to it |
| Working on the production repository | **A reference for intent only.** The code is the truth. Never refactor working code to match this |

**Every structural claim here is `SPECIFIED`** — it is a design position, not an
observation. Where this document and a running system disagree, **raise it. Do not
silently pick one.**

---

## §1 WHAT THE ARCHITECTURE HAS TO SURVIVE

Four properties. Everything else follows from them.

**1 · One dealer must never see another's data**, and the guarantee cannot depend on
application code being correct. A forgotten `WHERE` clause is inevitable; a leak is not
survivable.

**2 · History must be provable.** Arth is used as evidence in payout disputes and
disciplinary matters. An editable record is worth nothing in either.

**3 · Departments share one customer**, or the product's central claim collapses. Service,
sales, insurance and used car all read and write the same person.

**4 · A dealer's configuration must not require a deployment.** Stages, dispositions,
chain steps, plans and thresholds are rows. If adding a third brand needs a migration, the
third brand never gets onboarded.

---

## §2 STACK

**Proposed for a fresh build. The production stack is the IT Director's to state.**

| Layer | Choice | Why this one |
|---|---|---|
| Language | **TypeScript**, strict | One language across the stack, and the type system carries the domain model |
| Runtime | **Node 20 LTS** | |
| API | **Fastify** or **Next.js route handlers** | Either is fine. Pick one and do not mix |
| Front end | **React 18 + Vite**, or Next.js if chosen above | |
| Database | **PostgreSQL 15+** | **Row-level security is the reason.** Not negotiable |
| DB access | **Drizzle ORM** or raw SQL with a query builder | See the warning below |
| Migrations | **Plain SQL files, forward-only, numbered** | Never edited after they run anywhere |
| Auth | Session cookie, server-side session store | |
| Jobs | **pg-boss** or equivalent, Postgres-backed | One fewer piece of infrastructure |
| Styling | Design tokens as CSS custom properties | Palette file is the single source. Zero raw hexes |

### The one warning that matters

**Do not choose an ORM that fights row-level security.** RLS needs every query to run on a
connection carrying a session variable (`app.tenant_id`), set inside the same transaction.
An ORM with an opaque connection pool that hands you an arbitrary connection per query
will silently break this.

**Whatever you choose, prove this first, before any feature work:**

> Open two sessions as two different tenants. Run the same unfiltered `SELECT` in both.
> **Confirm each sees only its own rows.** If this test does not pass on day one, nothing
> built afterwards can be trusted.

---

## §3 SHAPE

```
  Browser  ──►  API  ──►  withTenant(txn)  ──►  Postgres
                 │             │                    │
                 │             │                    ├─ RLS policies, FORCED
                 │             │                    ├─ UPDATE/DELETE revoked on ledgers
                 │             │                    └─ money as BIGINT paise
                 │             │
                 │             └─ sets app.tenant_id, app.user_id
                 │                for the life of the transaction
                 │
                 └─ resolves session ──► seat ──► workspaceKey + permissions + scope
```

**Every request goes through `withTenant`.** There is no other path to the database.
It is the single choke point where isolation is established, and **it must be impossible
to obtain a connection that has bypassed it.**

### Suggested layout

```
/src
  /domain          entities, state machines, pure functions. No I/O
  /db
    /migrations    numbered SQL. Forward-only. Never edited
    /schema        table definitions
    withTenant.ts  THE ONLY WAY TO REACH THE DATABASE
  /api             route handlers. Thin: validate, call domain, return
  /services        orchestration that spans entities
  /jobs            reconciliation, sweeps, scheduled work
  /web             React application
    /components    the design system
    /screens       one folder per screen in Build Spec Appendix B
  /config          seed catalogues: stages, dispositions, chain steps
/docs
  /books           Product Book, Build Spec, Configuration Book, prototype
```

**Domain has no imports from db or api.** If a state machine needs a database call to
decide a transition, the transition is modelled wrong.

---

## §4 THE SCHEMA

**Core tables only.** The full object list is Build Specification §1. Types and constraints
here are binding even if you lay the tables out differently.

### 4.1 Every table follows these rules

```sql
-- Money is integer paise. Never NUMERIC, never float.
-- Aggregates are BIGINT: a group's exposure clears INT at Rs 2.1 crore.
amount_minor      BIGINT NOT NULL

-- Every tenant-scoped table carries this, and it is the RLS key.
tenant_id         UUID NOT NULL REFERENCES tenants(id)

-- Timestamps are UTC, always with time zone.
created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
```

### 4.2 Tenancy and structure

```sql
CREATE TABLE tenants (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  plan_key      TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE brands (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id),
  name          TEXT NOT NULL
);

CREATE TABLE branches (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id),
  brand_id      UUID NOT NULL REFERENCES brands(id),
  name          TEXT NOT NULL,
  timezone      TEXT NOT NULL DEFAULT 'Asia/Kolkata'
);

-- Step owners and escalation targets are POSITIONS, never users.
-- A person leaves; the post remains.
CREATE TABLE positions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id),
  branch_id     UUID REFERENCES branches(id),
  title         TEXT NOT NULL,
  reports_to    UUID REFERENCES positions(id)
);

CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id),
  position_id   UUID REFERENCES positions(id),
  full_name     TEXT NOT NULL,
  phone         TEXT NOT NULL,
  role_key      TEXT NOT NULL,          -- one of the 22 seats
  workspace_key TEXT NOT NULL,          -- exactly one landing. Never a list
  is_active     BOOLEAN NOT NULL DEFAULT true,
  UNIQUE (tenant_id, phone)
);
```

### 4.3 Working hours — build this first

**Every clock in the product runs through this table.** It is small and it is item 1 in
the build order for a reason.

```sql
CREATE TABLE working_hours (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id),
  branch_id     UUID NOT NULL REFERENCES branches(id),
  day_of_week   SMALLINT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  opens_at      TIME,                   -- NULL means closed that day
  closes_at     TIME,
  UNIQUE (branch_id, day_of_week),
  CHECK (opens_at IS NULL OR closes_at IS NULL OR closes_at > opens_at)
);
```

**The rule this table exists to enforce:** a lead arriving at 21:40 starts its
first-response clock at the next working open, and the delay is recorded **against the
branch, not the executive.** Penalising a person for being asleep is how a floor learns to
distrust the product in its first week.

### 4.4 The customer side, shared by every department

```sql
CREATE TABLE customers (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id),
  full_name     TEXT NOT NULL,
  phone         TEXT NOT NULL,
  alt_phone     TEXT,
  email         TEXT,
  household_id  UUID,                   -- Phase 6. Nullable until then
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, phone)
);
CREATE INDEX ON customers (tenant_id, phone);   -- search is phone-first

CREATE TABLE vehicles (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id),
  customer_id   UUID REFERENCES customers(id),
  registration  TEXT,
  chassis       TEXT,
  model         TEXT,
  variant       TEXT
);

-- ONE ROW PER PURPOSE. Never one tick for everything.
CREATE TABLE consents (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id),
  customer_id   UUID NOT NULL REFERENCES customers(id),
  purpose       TEXT NOT NULL,     -- sales_enquiry | service | insurance | offers
  channel       TEXT NOT NULL,     -- call | whatsapp | sms | email
  granted       BOOLEAN NOT NULL,
  captured_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  source        TEXT NOT NULL,
  UNIQUE (customer_id, purpose, channel)
);
```

### 4.5 The lead, and its ledger

```sql
CREATE TABLE leads (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           UUID NOT NULL REFERENCES tenants(id),
  branch_id           UUID NOT NULL REFERENCES branches(id),
  customer_id         UUID NOT NULL REFERENCES customers(id),
  source_key          TEXT NOT NULL,
  model_interest      TEXT,
  stage_key           TEXT NOT NULL DEFAULT 'new',   -- one of nine
  owner_user_id       UUID REFERENCES users(id),
  assigned_at         TIMESTAMPTZ,

  -- Computed at assignment and FROZEN. Never manager-set. Hidden from executives.
  difficulty_band     TEXT CHECK (difficulty_band IN ('hot','warm','cold','very_cold')),
  difficulty_locked_at TIMESTAMPTZ,

  first_response_due  TIMESTAMPTZ,       -- computed through working_hours
  first_responded_at  TIMESTAMPTZ,
  next_action_at      TIMESTAMPTZ,       -- what puts it in today's queue
  lost_reason_key     TEXT,              -- controlled list. NEVER free text
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON leads (tenant_id, owner_user_id, next_action_at);
CREATE INDEX ON leads (tenant_id, branch_id, stage_key);
```

**Note what is absent: no `is_parked` column.** Parked is derived — the latest disposition
is `postponed` and its revisit date is in the future. When that date arrives the lead is
simply due, and nothing has to be written. **Storing it creates a value that drifts from
the thing it describes.**

```sql
-- THE LEDGER. Append-only. This is the product.
CREATE TABLE lead_events (
  id              BIGSERIAL PRIMARY KEY,
  tenant_id       UUID NOT NULL REFERENCES tenants(id),
  lead_id         UUID NOT NULL REFERENCES leads(id),
  event_type      TEXT NOT NULL,     -- assigned | call_attempt | disposition |
                                     -- stage_change | commitment | approval | export
  actor_type      TEXT NOT NULL CHECK (actor_type IN ('USER','SYSTEM')),
  actor_id        UUID,
  disposition_key TEXT,
  call_seconds    INTEGER,           -- required before points can ship
  revisit_at      TIMESTAMPTZ,       -- REQUIRED when disposition = postponed
  note            TEXT,
  payload         JSONB,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- A system event has no user actor; a user event must name one.
  CHECK (actor_type <> 'SYSTEM' OR actor_id IS NULL),
  CHECK (actor_type <> 'USER'   OR actor_id IS NOT NULL),
  -- Postponement without a date is the failure this constraint exists to prevent.
  CHECK (disposition_key <> 'postponed' OR revisit_at IS NOT NULL)
);
CREATE INDEX ON lead_events (tenant_id, lead_id, created_at DESC);
```

### 4.6 The delivery promise — an event, never a field

```sql
CREATE TABLE delivery_promises (
  id            BIGSERIAL PRIMARY KEY,
  tenant_id     UUID NOT NULL REFERENCES tenants(id),
  booking_id    UUID NOT NULL,
  promised_for  DATE NOT NULL,
  set_by        UUID NOT NULL REFERENCES users(id),
  reason        TEXT,                -- required when it moves
  is_override   BOOLEAN NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

**The current promise is the latest row.** Without this table three things are permanently
impossible: counting how often a promise moved, measuring accuracy against what was
promised at booking, and answering the most-asked question in any delivery dispute —
*who told the customer the 12th?*

### 4.7 Configuration, not code

```sql
-- Stages, dispositions, lost reasons and chain steps are ALL rows like this.
-- Copied per tenant at provisioning, never referenced across tenants.
CREATE TABLE config_stages (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id),
  key           TEXT NOT NULL,
  label         TEXT NOT NULL,
  sort_order    SMALLINT NOT NULL,
  is_terminal   BOOLEAN NOT NULL DEFAULT false,
  UNIQUE (tenant_id, key)
);

CREATE TABLE config_lost_reasons (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      UUID NOT NULL REFERENCES tenants(id),
  key            TEXT NOT NULL,
  label          TEXT NOT NULL,
  requires_fact  TEXT NOT NULL,   -- what the closer must supply
  UNIQUE (tenant_id, key)
);
```

**Test for anything you are tempted to make an enum: will there ever be a tenth?** If yes
it is configuration. And assert it **bidirectionally** in the test suite: every config key
has a renderer, **and every renderer has a key.** A one-directional check catches the typo
that creates an orphan and misses the renderer left behind looking live.

---

## §5 ISOLATION AND IMMUTABILITY

### 5.1 Row-level security, forced

```sql
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads FORCE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON leads
  USING (tenant_id = current_setting('app.tenant_id')::uuid);
```

`FORCE` matters: without it the table owner bypasses the policy, and migrations run as the
owner. **Apply this to every tenant-scoped table. There are no exceptions.**

**As built in this repository:** dealer isolation is not enough. Inside a dealer the four
walls (dealer, branch, team, owner) apply to every department. Enquiry rows go through
`arth_lead_visible`. `withTenant` binds the user to that dealer and fails closed on a
mismatch. Law: `docs/books/VISIBILITY-WALLS.md`. `npm run prove` must print `WALLS_OK`.

### 5.2 Append-only, by privilege

```sql
REVOKE UPDATE, DELETE ON lead_events        FROM arth_app;
REVOKE UPDATE, DELETE ON delivery_promises  FROM arth_app;
REVOKE UPDATE, DELETE ON audit_logs         FROM arth_app;
REVOKE UPDATE, DELETE ON point_entries      FROM arth_app;
```

**Consequence that catches people out: a column that must be written after insert cannot
exist on such a table.** A correction is a new row. This was found the hard way when a
proposed table carried two columns nothing could ever write to.

### 5.3 The connection wrapper

```ts
// The ONLY path to the database.
export async function withTenant<T>(
  ctx: { tenantId: string; userId: string },
  fn: (tx: Transaction) => Promise<T>
): Promise<T> {
  return db.transaction(async (tx) => {
    await tx.execute(sql`SELECT set_config('app.tenant_id', ${ctx.tenantId}, true)`);
    await tx.execute(sql`SELECT set_config('app.user_id',   ${ctx.userId},   true)`);
    return fn(tx);   // third arg `true` = transaction-scoped, resets on commit
  });
}
```

**A pooled connection carrying a leftover `app.tenant_id` is the leak this design exists to
prevent.** Transaction-scoped settings reset on commit. Verify that, do not assume it.

### 5.4 The three access layers, kept separate

They are commonly conflated and they are not the same question.

| Layer | Question | Where it lives |
|---|---|---|
| **Landing** | Where does this person start? | `users.workspace_key`. Exactly one |
| **Permission** | What may they open? | Role grants, per screen |
| **Scope** | Which records within it? | own / team / branch / brand / group |

**A branch manager lands on his decisions screen and can still reach telecalling. Landing
is not permission.**

Two rules that are not configurable: **salary is never visible below the dealer
principal**, and **margin is dealer-admin only.**

---

## §6 THE RULES THAT ARE NOT NEGOTIABLE

Anything below, if broken, is a defect regardless of what a ticket says.

1. **Money is integer paise.** Never float, never `NUMERIC` for currency.
2. **Ledgers are append-only by privilege**, not by convention.
3. **Tenant isolation is forced at the database.** Four walls inside the dealer. `docs/books/VISIBILITY-WALLS.md`.
4. **Derived, never stored:** chain state, exception state, Parked.
5. **Nine stages.** `new · assigned · contacted · qualified · test_drive · quotation · negotiation · booked · delivered`
6. **Stages, dispositions, chain steps, plans and thresholds are rows.**
7. **Working hours gate every clock.**
8. **Every colour resolves to a token.** Zero raw hexes. Five button variants, **none green.**
9. **A connected call under 20 seconds earns no points and no penalty.**
10. **Difficulty is computed at assignment and frozen.** Hidden from executives.
11. **Every date on a row carries the event that produced it.** Never a bare date.
12. **Confirmation is in place, not a toast.** Undo as a correcting entry.
13. **Report, never silently correct.** Reconciliation reports disagreements.
14. **No credential in any commit, document or chat.**

---

## §7 BUILD ORDER

**Items 1 and 2 are irreversible. Everything from 3 can be rebuilt if wrong.**

| | Build | Unblocks |
|---|---|---|
| 0 | `withTenant` + RLS, **proven with the two-tenant test** | Everything. Do not skip |
| **1** | **Working hours and shifts** | Every SLA, the day panel, the queue |
| **2** | **`delivery_promises` ledger** | Delivery, promise accuracy, the tracker |
| 3 | Lost reason controlled list | Why we lose |
| 4 | Shared defect taxonomy | Recurring-failure detection |
| 5 | Queue definition, nine stages, in-place confirmation | The three demo blockers |
| 6 | Search by phone, then the six working filters | Every screen |
| 7 | Chain steps and state transitions | Delivery |
| 8 | Consent by purpose, then the tracking link | The referral engine |
| 9 | Remaining workspaces | Phase 5 |
| 10 | Points engine — **requires call duration** | Scores, incentives |
| 11 | Attribution and cost per booking | The commercial argument |

**Current client scope is telecalling only.** See `SCOPE-BRIEF-TELECALLING.md`: items 0,
1, 3, 5, 6 plus seven screens, and **points deferred deliberately** because the 20-second
floor cannot be enforced without telephony.

---

## §8 DEFINITION OF DONE

A screen is not done until all nine are true.

1. Every seat in its access list can open it. **Every seat outside receives 403, verified.**
2. Scope correct — an executive sees own, a manager sees team. Verified with two accounts.
3. Lists use the standard row with column headings.
4. Every figure carries its source and period. Incomplete figures say so.
5. Every form has a save bar; the unsaved bar appears and clears.
6. Every action gives an in-place confirmation, and an undo where destructive.
7. Empty, error, no-permission and offline states exist and name what happens next.
8. Every colour resolves to a token. **Zero raw hexes.**
9. No horizontal scroll at 1100px. No clipped cell text.

---

*Architecture specification v1.0, 24 August 2026. Everything here is `SPECIFIED`. The
production system's actual architecture is the IT Director's to state, and where the two
differ, the running code is the truth.*
