# Arth architecture

## Purpose

Arth is a **client operating system** for global delivery programmes. The product exists so the client can:

1. See the outcomes they named.
2. Take the decisions that unblock value.
3. Inspect proof and audit without waiting for a pack.

Delivery teams use the same tenant workspace. They do not get a parallel “internal only” truth.

## Shape of the system

```
Browser
  → Next.js App Router (this repo)
      → Tenant-scoped domain data (`src/lib/arth-data.ts`)
      → Role views: client | director
```

Future slices (gated, not scaffolded empty):

- Identity: SSO, httpOnly session, tenant claim in the token
- Store: Postgres with `tenant_id` on every row + row-level security
- Region: tenant data residency (AMER / EMEA / APAC)
- Evidence: signed artefacts attached to outcomes
- Notifications: decision due, exception opened

## Invariants

- Every domain record has `tenantId`. Reads never cross tenants.
- Client role owns the decision queue. Director role owns health and audit.
- Status is a product surface, not a slide.
- Secrets never live in the client. This slice runs with none.
- Security headers are applied at the edge of the app (`next.config.ts`).

## Stack

- TypeScript, Next.js App Router, React 19
- Tailwind v4, shadcn/ui
- Demo data in-module (replace with a repository, not with ad-hoc fetches)

## Security baseline (this slice)

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy` camera/mic/geo off
- Content-Security-Policy defaulting to self
- `poweredByHeader: false`
- `/api/health` returns no tenant data

## Note on source documents

The following files were referenced by Product but were not present in the cloud workspace:

- `.cursorrules` (source pack)
- `00-START-HERE.md`
- `ARTH-ARCHITECTURE.md`
- `CURSOR-SETUP-AND-PROMPT.md`
- `arth-cursor.zip`
- `The_Arth_Brand_System_v2.9`

This architecture is the working contract until those originals are ingested and diffs are applied.
