# Arth architecture

Arth is the **enquiry accountability platform for automobile dealer groups** (THE ARTH BRAND SYSTEM v2.9).

A CRM reports what happened. Arth holds people to account for it.

## Shells (Part 5.2)

| Shell | Route | Who |
| --- | --- | --- |
| C — The Exception Cockpit | `/workspace` | Dealer principal |
| A — Work queue | `/workspace/queue` | Telecaller |
| Spend | `/workspace/spend` | Cost per booking |

Shell B (single enquiry record) is the next gated slice.

## Invariants

- Every enquiry has `tenantId`
- Vocabulary: enquiry, branch, owner, telecaller, settled, overdue, The Exception Cockpit
- Brass is not an accent token for buttons
- Tokens live in `src/styles/arth-tokens.css` from Part 9.1
- Dark theme is refused

## Stack

Next.js App Router, TypeScript, Tailwind, shadcn primitives restyled to Ink/Brass, demo data in `src/lib/arth-data.ts`.
