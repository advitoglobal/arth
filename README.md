# Arth

Enquiry accountability for Indian car dealerships. Not a CRM.

Governed by the documents in `docs/books/` and THE ARTH BRAND SYSTEM v2.9.

This cycle is the **telecalling floor**.

## Run

```bash
# Postgres 16, role arth_app, database arth
cp .env.example .env.local   # set DATABASE_URL locally. Never commit it.
npm install
npm run db:migrate
npm run db:seed
npm run db:isolate    # must print ISOLATION_OK
npm run dev
```

Open [http://127.0.0.1:43127](http://127.0.0.1:43127) then Open the product.

Two demo tenants: Whitefield Motors and Coastal Cars. Same unfiltered query. Each sees only its own rows.

## API for later mobile

`GET /api/v1/queue` · `POST /api/v1/dispositions`

Same `withTenant` path. No second database for a phone app.
