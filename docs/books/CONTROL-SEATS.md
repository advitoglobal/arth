# CONTROL SEATS — TELECALLING SET

**Ruled 27 August 2026.** This is the first control set. Other department managers
are not these seats.

## Dealer seats in this set

| Seat | Username (demo) | Role key | Lands on | Bucket |
|---|---|---|---|---|
| Digital desk manager | gupta / fernandes | `mgr` | The floor `/w/desk` | This branch, telecalling team only |
| Dealer principal | shah / kamath | `owner` | This dealer `/w/prin` | This dealer only |
| Team leader | menon | `lead` | My enquiries | The team (already on the floor) |

The digital desk places a name onto a telecaller when the floor needs a direction.
Until then the shared book until reach still holds. The desk does not run sales,
service, or any other department.

The dealer principal sees telecalling health at this dealer. Not the Exception
Cockpit. Not another dealer.

Every dealer seat in this set has **Performance analysis** (`/w/perf`, and on the
landing screen). It reads the live book for that seat only: what is holding, what
is late or still shared, and what to execute next. It is not a target-entry form.
Targets still come from the superior. Advito reads dealer walls on Dealers, then
one dealer at a time for floor figures.

## Advito seats

Advito operators are **not** dealer users. They live on `platform_users`. A missing
platform session cannot read a dealer row.

| Seat | Username (demo) | Can onboard | Can enter a dealer |
|---|---|---|---|
| Advito admin | advito | Yes | One dealer at a time |
| Advito support | support | No | One dealer at a time, logged |

Support exists in this set so a client problem can be fixed without mixing dealers.
Support does not see Advito commercial terms (none are shown on this seat). Entering
a dealer uses a per-dealer `ops` shadow. Enquiry RLS is still that dealer only.

Admin onboards: dealer wall, branch hours, stages, dispositions, principal, digital
desk, one telecaller.

## What is not this set

Branch managers of other departments. Sales managers. Workshop. Exception Cockpit.
Master pricing. Engineering health. Those wait until this telecalling control set
is signed off.
