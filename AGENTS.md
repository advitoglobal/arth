# Arth

Enquiry accountability for automobile dealer groups. Follow THE ARTH BRAND SYSTEM v2.9 and `.cursorrules`.

Read `00-START-HERE.md`, then `docs/books/VISIBILITY-WALLS.md`, then `docs/ARTH-ARCHITECTURE.md`.

## Visibility (platform law)

Every department inherits four walls: dealer, then branch, then team, then owner. Advito operators enter one dealer at a time. Search and Filter included. Postgres forced RLS plus `arth_lead_visible` / `arth_lead_row_visible`. `withTenant` must bind an active user to that dealer. A bypass is a defect. Control seats: `docs/books/CONTROL-SEATS.md`.
