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
npm run db:isolate    # must print ISOLATION_OK
npm run db:clock      # must print CLOCK_OK
npm run db:assign     # must print ASSIGN_OK
npm run db:scope      # must print SCOPE_OK
npm run dev
```

Open [http://127.0.0.1:43127](http://127.0.0.1:43127) then Open the product.

Demo seats on `/w/login`:

- Whitefield Motors · A. Iyer and K. Nair (telecallers, own books)
- Coastal Cars · M. Pinto (other tenant)
- Whitefield Motors · S. Rao (sales consultant, 403 on Today)

## API for later mobile

`GET /api/v1/queue` · `GET /api/v1/pipeline` · `GET /api/v1/search` · `GET /api/v1/leads/:id` · `GET /api/v1/notifications` · `POST /api/v1/assign` · `POST /api/v1/dispositions` · `POST /api/v1/undo` · `POST /api/v1/stage`

Same `withTenant` path. No second database for a phone app.
