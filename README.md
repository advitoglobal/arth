# Arth

Arth (अर्थ — meaning, value, result) is the **client results operating system**.

Global programme sponsors see outcomes, own decisions, and inspect proof in a tenant-scoped workspace. Delivery does not hide behind slides.

This repository is the first production-shaped slice: a branded marketing surface, a demo client workspace for Meridian Holdings, and a director status view for Product Engineering and IT.

## Run locally

```bash
npm install
npm run dev
```

Open [http://127.0.0.1:43127](http://127.0.0.1:43127).

- Client path: **Enter workspace → Continue as client**
- Director path: **Enter workspace → Continue as director**

There are no credentials in this slice. Demo data is local and not persisted.

## What this slice includes

- Landing and trust pages
- Role entry (client / director)
- Overview, outcomes, workstreams, decision queue, director status + audit
- Security headers (CSP, frame deny, nosniff, permissions policy)
- Health endpoint at `/api/health`

## What is not in this slice

- Real SSO / identity provider
- Database or multi-tenant persistence
- Production region pinning

Those are the next gated engineering slices. See `docs/ARTH-ARCHITECTURE.md` and `docs/STATUS.md`.

## Brand

Provisional tokens live in `src/app/globals.css` and `docs/BRAND.md`. The attached brand book (`The_Arth_Brand_System_v2.9`) was not available in this environment; tokens will be aligned when that file is ingested.
