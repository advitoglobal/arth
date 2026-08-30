# UI evidence — telecalling floor

**For:** Product Director  
**Date:** 26 August 2026  
**Method:** extraction from `src/` plus one live pass at `http://127.0.0.1:43127` (Chrome headless, viewport 1100×900, cookies `arth_seat=iyer` / `arth_tenant=whitefield`, and once `arth_seat=rao` for refusal).  
**This file does not compare the build to the prototype.**

Code left unchanged while this was written.

---

## 1 · Design tokens actually in use

### 1.1 CSS custom properties, as declared

From `src/styles/arth-tokens.css`:

```css
:root {
  --arth-ink: #0f2a33;
  --arth-ink-deep: #08191f;
  --arth-slate: #2e5c68;
  --arth-brass: #b07f2c;
  --arth-brass-deep: #8f6620;
  --arth-brass-lift: #d0a155;
  --arth-brass-wash: #f3e7ce;
  --arth-brass-pill: #7a5716;

  --arth-n00: #ffffff;
  --arth-n05: #f1f4f4;
  --arth-n10: #e3e9e9;
  --arth-n20: #c9d3d4;
  --arth-n40: #9fadb0;
  --arth-n50: #748689;
  --arth-n60: #5a6c71;
  --arth-n80: #47585d;
  --arth-n90: #263d45;

  --arth-overdue: #b23b2e;
  --arth-overdue-wash: #f6e3e0;
  --arth-settled: #27735a;
  --arth-settled-wash: #deede7;

  --arth-display: var(--font-anek), "Anek Latin", sans-serif;
  --arth-body: var(--font-plex), "IBM Plex Sans", system-ui, sans-serif;
  --arth-data: var(--font-plex-mono), "IBM Plex Mono", ui-monospace, monospace;

  --arth-rule: 2px;
  --arth-r-sm: 3px;
  --arth-r-md: 5px;
  --arth-border: 1px solid var(--arth-n10);

  --arth-s1: 4px;
  --arth-s2: 8px;
  --arth-s3: 12px;
  --arth-s4: 16px;
  --arth-s5: 24px;
  --arth-s6: 32px;
  --arth-s7: 48px;
  --arth-s8: 64px;
}
```

From `src/app/globals.css` `@theme inline`:

```css
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --font-sans: var(--arth-body);
  --font-mono: var(--arth-data);
  --font-display: var(--arth-display);
  --font-heading: var(--arth-display);
  --color-sidebar-ring: var(--arth-brass-lift);
  --color-sidebar-border: var(--arth-n90);
  --color-sidebar-accent-foreground: var(--arth-n00);
  --color-sidebar-accent: var(--arth-n90);
  --color-sidebar-primary-foreground: var(--arth-n00);
  --color-sidebar-primary: var(--arth-n00);
  --color-sidebar-foreground: var(--arth-n00);
  --color-sidebar: var(--arth-ink);
  --color-chart-5: var(--arth-n80);
  --color-chart-4: var(--arth-n50);
  --color-chart-3: var(--arth-slate);
  --color-chart-2: var(--arth-settled);
  --color-chart-1: var(--arth-ink);
  --color-ring: var(--arth-brass);
  --color-input: var(--arth-n50);
  --color-border: var(--arth-n10);
  --color-destructive: var(--arth-overdue);
  --color-accent-foreground: var(--arth-ink);
  --color-accent: var(--arth-n10);
  --color-muted-foreground: var(--arth-n60);
  --color-muted: var(--arth-n05);
  --color-secondary-foreground: var(--arth-ink);
  --color-secondary: var(--arth-n10);
  --color-primary-foreground: var(--arth-n00);
  --color-primary: var(--arth-ink);
  --color-popover-foreground: var(--arth-ink);
  --color-popover: var(--arth-n00);
  --color-card-foreground: var(--arth-ink);
  --color-card: var(--arth-n00);
  --radius-sm: 3px;
  --radius-md: 5px;
  --radius-lg: 5px;
  --radius-xl: 5px;
  --radius-2xl: 5px;
  --radius-3xl: 5px;
  --radius-4xl: 5px;
```

From `src/app/globals.css` `:root`:

```css
:root {
  --background: var(--arth-n05);
  --foreground: var(--arth-ink);
  --card: var(--arth-n00);
  --card-foreground: var(--arth-ink);
  --popover: var(--arth-n00);
  --popover-foreground: var(--arth-ink);
  --primary: var(--arth-ink);
  --primary-foreground: var(--arth-n00);
  --secondary: var(--arth-n10);
  --secondary-foreground: var(--arth-ink);
  --muted: var(--arth-n10);
  --muted-foreground: var(--arth-n60);
  --accent: var(--arth-n10);
  --accent-foreground: var(--arth-ink);
  --destructive: var(--arth-overdue);
  --border: var(--arth-n10);
  --input: var(--arth-n50);
  --ring: var(--arth-brass);
  --radius: 5px;
  --sidebar: var(--arth-ink);
  --sidebar-foreground: var(--arth-n00);
  --sidebar-primary: var(--arth-n00);
  --sidebar-primary-foreground: var(--arth-ink);
  --sidebar-accent: var(--arth-n90);
  --sidebar-accent-foreground: var(--arth-n00);
  --sidebar-border: var(--arth-n90);
  --sidebar-ring: var(--arth-brass-lift);
}
```

Next font CSS variables (set in `src/app/layout.tsx`, values supplied at runtime by `next/font`): `--font-anek`, `--font-plex`, `--font-plex-mono`.

### 1.2 Colour literals outside those token declarations

**How checked:** recursive walk of `src/` for `#` hex, `rgb(`, `rgba(`, `hsl(`, `hsla(` in `.ts`, `.tsx`, `.css`. Token hex lines in `arth-tokens.css` (the declarations above) excluded.

**Hex / rgb / hsl in `src/` outside the token block:** none.

**Tailwind palette colour classes (`black`, `white`, and named palettes) in `src/`:**

| File | Line | Literal |
|---|---|---|
| `src/components/ui/dialog.tsx` | 34 | `bg-black/10` |
| `src/components/ui/sheet.tsx` | 31 | `bg-black/10` |

Neither `dialog.tsx` nor `sheet.tsx` is imported by `/w/*` floor screens. Floor screens import `Button` from `src/components/ui/button.tsx`.

**Other Tailwind colour utilities that appear (semantic / theme names, not `#rrggbb`):**

- `src/app/globals.css` 85: `@apply border-border outline-ring/50;`
- `src/app/globals.css` 91: `@apply bg-background text-foreground;`
- `src/components/ui/button.tsx` 7: `border-transparent`, `focus-visible:border-ring`, `focus-visible:ring-ring/50`, `aria-invalid:border-destructive`, `aria-invalid:ring-destructive/20`, `dark:aria-invalid:border-destructive/50`, `dark:aria-invalid:ring-destructive/40`
- `src/components/ui/button.tsx` 14: `bg-transparent`
- `src/components/ui/button.tsx` 21: `text-primary`
- `src/components/leave-floor.tsx` 28–29: `bg-transparent`

Additional semantic colour classes exist in unused shadcn files (`card`, `input`, `tabs`, `badge`, `table`, `progress`, `dropdown-menu`, `dialog`, `sheet`). Floor TSX does not import those components except `button`.

### 1.3 Fonts loaded and where applied

Loaded in `src/app/layout.tsx`:

```ts
const anek = Anek_Latin({
  variable: "--font-anek",
  subsets: ["latin"],
  weight: ["600"],
  display: "swap",
});

const plex = IBM_Plex_Sans({
  variable: "--font-plex",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});
```

Applied:

| Role | Family | Applied via |
|---|---|---|
| Display | Anek Latin 600 (`--arth-display`) | `.font-display` in `globals.css`; `RuleHeading`; customer names on Log a call and Enquiry record (`text-[28px]`); section titles `text-[20px]`; SVG wordmark `fontFamily="Anek Latin, sans-serif"` in `logo.tsx` |
| Body | IBM Plex Sans 400/500/600 (`--arth-body`) | `html { @apply font-sans }`; `body` `font-sans`; default UI copy |
| Monospace / data | IBM Plex Mono 400/500 (`--arth-data`) | `.font-data`; phone numbers; enquiry numbers; timestamps; profile hours list |

### 1.4 Type scale in use

Tailwind v4 defaults from `node_modules/tailwindcss/theme.css` (not overridden in this repo): `--text-xs: 0.75rem`; `--text-sm: 0.875rem`; `--text-base: 1rem`. Arbitrary sizes are as written in class names.

| Size | Mechanism | Applied to |
|---|---|---|
| 44px | `text-[44px]` | `RuleHeading` as `h1` (screen titles) |
| 28px | `text-[28px]` | `RuleHeading` as `h2`; customer name on Log a call and Enquiry record; Forbidden heading |
| 26 | SVG `fontSize="26"` | Wordmark text `arth` |
| 20px | `text-[20px]` | `RuleHeading` as `h3`; Late / Due later today / History / Activity ledger / marketing cards |
| 16px | `text-base` (1rem) and default body | Homepage lead paragraph; `body` has no explicit size (browser 16px) |
| 14px | `text-sm` (0.875rem) | Captions, form labels, buttons default, most helper copy |
| 12.5px | `text-[12.5px]` | Phone, enquiry number, figure source, sidebar identity, compact Log out |
| 11px | `text-[11px]` | Eyebrows, column headers, stamps, `Parked` |
| 10pt | `text-[10pt]` | Marketing footer `An Advito Global product` |
| 0.8rem | `text-[0.8rem]` | `Button` `size="sm"` (Call, Add enquiry, Open, and other `ActionButton`s) |
| 0.75rem | `text-xs` | Defined on unused `Button` size `xs`; not used on floor screens |

---

## 2 · Every string a user reads

Dynamic values (names, dates, counts, enquiry numbers, API `recorded` / `error` payloads) are listed as templates. Seeded and static strings are exact.

### Shared floor chrome

- Wordmark aria-label: `arth`
- Nav labels: `Today` · `Log a call` · `My enquiries` · `Search` · `Notifications` · `My profile`
- Notifications with unread: `Notifications · {n}`
- Role eyebrow: `Telecalling` or `Sales`
- Tenant name from seat (examples): `Whitefield Motors` · `Coastal Cars`
- Identity: `{seat.name} · {seat.roleLabel}` examples `A. Iyer · telecaller` · `S. Rao · sales consultant`
- `Log out`
- Offline: `Working offline. Calls you log will sync when you reconnect.`
- Stamps: `Overdue` · `Settled` (`Review` and `Draft` exist in `StatusStamp` and are not passed from floor screens)
- `Parked`
- `Call`
- Figure source: `Source: {source}. Period: {period}.`
- Row fallbacks: `No activity recorded` · `Not recorded` · `No next action` · `Follow-up due · {d}` · `{event} · {d}` · `Enquiry {last8}`
- Row headers at `lg+`: `Customer` · `Vehicle` · `Source` · `Stage` · `Last activity` · `Next action` · `Value` (only if `showValue`) · `Actions`
- Field labels below `lg`: `Vehicle` · `Source` · `Stage` · `Last activity` · `Next`
- Link aria-label: `Open {customer_name}`
- Forbidden: `You cannot open this screen` / `This screen is for another seat. Open a screen on your access list, or leave this floor.` / `Open your landing screen`
- Floor loading: `Opening this screen` / `Your last saved work stays in the ledger. This list will appear here.`
- Floor error: `This screen did not load` / `The last saved work on this screen is still in the ledger. Retry, or open Today.` / `Retry` / `Open Today`
- Floor not-found: `That screen is not on this floor` / `The route is not in telecalling. Open Today, or leave this floor.` / `Open Today` / `Sign in again`
- HTTP JSON 403 (not a page): `You cannot open this screen`

Ledger line template: `{istDateTime} · {Seat|System} · {actor_name?} · {eventLabel} · {facts}`  
Event labels: `Assigned` · `Clock deferred` · `Disposition` · `Correction` · `Stage moved` · `Call attempt` · `Filed`  
Fact prefixes: `Fact: ` · `Callback reason: ` · `Delay charged to ` · `{n} minutes deferred`

### Sign in (`/w/login`)

- `Sign in to the telecalling floor`
- `This build is one department, ready to test. An enquiry has an owner, a clock, a call outcome, and a ledger that cannot be quietly edited. Scores and call recording are not in this release.`
- `A. Iyer: Today, call Ramesh Kumar, log the outcome, open a name for the record.`
- `K. Nair: own book. Anita Desai, not Ramesh Kumar.`
- `M. Pinto: Coastal only. Fazal Ahmed. Cannot see Whitefield.`
- `S. Rao: sales. My enquiries. Today is refused.`
- `Seat`
- `Whitefield Motors · A. Iyer · telecaller`
- `Whitefield Motors · K. Nair · telecaller`
- `Coastal Cars · M. Pinto · telecaller`
- `Whitefield Motors · S. Rao · sales consultant`
- `Open landing screen`

### Today (`/w/dayb`)

- Heading: `Today`
- `Your list for today: late calls first, then what you still promised to do today. The rest of your book is in My enquiries.`
- Figure: `Source: your queue. Period: today in India Standard Time, late first.`
- Date eyebrow: `toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", weekday: "long", day: "numeric", month: "long" })`
- Brief templates:
  - `{names} is late. Call this one first.` / `{names} are late. Call these first.`
  - `Nothing is late.`
  - `{names} still needs a call later today.` / `{names} still need a call later today.`
  - `Nothing else is due today.`
  - `{n} new enquiry was just assigned to you.` / `{n} new enquiries were just assigned to you.`
- `Late` / `First call missed, or a follow-up already late. Start here.`
- `Due later today` / `You still owe a call today. It is not late yet.`
- `Also due` / `On today without a timed follow-up.`
- `None in this list.`
- `No enquiries are due. New ones appear here when they are assigned.`

### Log a call (`/w/tele`)

- Heading: `Log a call`
- `No enquiries are due. New ones appear here when they are assigned.`
- `This enquiry is not in your tenant.`
- `Dial on the desk phone, then record what happened here. This is not a live phone line.`
- `Enquiry {no}`
- `{model} · {stage}`
- `Owner {name|unassigned} · call by {istDateTime}`
- `Still in Today`
- `{n} after this one. The queue decrements when you record an outcome.`
- `Next: {customer_name}`
- `History`
- `No activity recorded yet. The first call writes the first row.`
- `You do not own this enquiry. {owner|Another seat} logs outcomes. Search can still open the record.`
- Stage panel: `This enquiry is at the last stage. Nothing further to move.`
- `Stage`
- `Next is {label}. One step only. The move writes a ledger row.`
- `Move to {label}`
- After stage save: `{data.recorded}` which is `Stage is now {label}`
- `Undo writes a correcting entry. The original row stays. The enquiry returns to the previous stage.`
- `Undo`
- Errors from API: `Not saved.` · `Undo failed.` · `You do not own this enquiry. Only the owner can log an outcome.` · `A revisit date is required for postponed.` · `A lost reason is needed before this enquiry can be closed.` · `Record the {fact} before closing as lost.` · `A reason is required when the callback is more than 14 days away.` · `Unknown disposition` · `Nothing to undo.` · `Unknown stage.` · `Stage moves one step forward. It is not edited.` · `This enquiry is not in your tenant.`

### My enquiries (`/w/pipe`)

- Heading: `My enquiries`
- `Your full book, in nine stages. Today is only what is due now. Open a name for the history. Call when you are dialling.`
- Figure: `Source: your full book. Period: all nine stages, current.`
- `Add enquiry`
- `All · {n}`
- Stage chips: `New · {n}` · `Assigned · {n}` · `Contacted · {n}` · `Qualified · {n}` · `Test drive · {n}` · `Quotation · {n}` · `Negotiation · {n}` · `Booked · {n}` · `Delivered · {n}`
- `No enquiries in {stage}. They appear here when the stage moves.`
- `No enquiries are assigned to you.`
- `Open Today` / `Open Search`

### Enquiry record (`/w/rec`)

- Heading: `Enquiry record`
- `Open a name from Today, My enquiries, or Search.`
- `This enquiry is not in your tenant.`
- `Full enquiry: customer, owner, clock, and every action taken. Nothing here is edited. A correction writes a new row.`
- Figure: `Source: this enquiry. Period: full activity ledger.`
- `Enquiry {no}`
- dt labels: `Vehicle` · `Source` · `Stage` · `Owner` · `Arrived` · `Call by` · `First call logged` · `Next action` · `Expected value` (only `mgr`/`owner`/`adv`) · `Assigned` · `Lost reason`
- `Unassigned` · `Open` (lost reason when none)
- `Log a call`
- `Activity ledger`
- `No rows yet. The first call writes the first row. Rows are never edited.`
- Date empty: `Not recorded`

### Search (`/w/search`)

- Heading: `Search`
- `Type a mobile number, a name, an enquiry number, or a model. Use Filter underneath to narrow the list by source, stage, date, and the rest.`
- Figure: `Source: enquiries in this tenant. Period: current book.`
- Panel eyebrow: `Search`
- `Number, name, enquiry number, or model`
- placeholder: `Example: 0001, Priya, FFFFFFF1, or Brezza`
- Button: `Search`
- Panel eyebrow: `Filter`
- `Source, stage, overdue, parked, and date. Date applies to arrived or to follow-up due.`
- `Source` options: `Any` · `Google` · `Meta` · `Walk-in` · `Inbound call`
- `Stage` options: `Any` plus the nine stage labels
- `Overdue` / `Any` / `Overdue` / `Not overdue`
- `Parked` / `Any` / `Parked` / `Not parked`
- `Date applies to` / `Arrived` / `Follow-up due`
- `From` · `To`
- `Apply filters` · `Clear`
- `Enter a search or apply a filter. New inbound calls start here.`
- `No enquiry matches that number. File it if this is a new inbound call.`
- `No enquiries match. Widen the filters or try another search.`
- `File this enquiry`
- `{n} in this tenant. Source: enquiries in this tenant. Period: current book.`

### File an enquiry (`/w/new`)

- Heading: `File an enquiry`
- `Use this when Search finds no match. You become the owner. The first call is due after the branch next opens, not while it is closed.`
- `Unsaved changes. File the enquiry or they stay on this screen.`
- `Customer name` · `Mobile` placeholder `10 digits` · `Model` · `Variant` · `Source` · `Source detail`
- Source options: `Inbound call` · `Walk-in` · `Google` · `Meta`
- placeholder: `Example: missed call on showroom line`
- `File enquiry`
- `Open the existing record`
- After save: `{name} is on your book.` (API `recorded`)
- `Opening Log a call. The clock started from the next working hour.`
- Errors: `Not saved.` · `Use a ten-digit Indian mobile number.` · `A customer name is required.` · `This number is already on the book. Open the existing record.` · `This seat has no branch. The enquiry cannot be filed.`

### Notifications (`/w/notif`)

- Heading: `Notifications`
- `Every row says why you got it. Opening it, or tapping the row, marks it read.`
- Figure: `Source: your notifications. Period: unread and read, newest first.`
- `No notifications. New ones appear when an enquiry you own needs you.`
- `Mark all read`
- `Read` · `Unread`
- `Open`
- aria-label: `Open {title}`
- Raised copy (`src/services/telecalling.ts`): title `{customer_name} still needs a first call` ; why `You own this enquiry and the first call is late. The clock only runs while the branch is open.`
- Assignment copy (`src/services/assignment.ts`): title `An enquiry was assigned to you` ; why `Round robin by current load. Delay before open hours is charged to the branch, not to you.`
- Seeded example: title `Ramesh Kumar still needs a first call` ; same why as raise

### My profile (`/w/profile`)

- Heading: `My profile`
- `Name ` · `Seat ` · `Opens on ` (`Today` / `My enquiries` / `Log a call`) · `Tenant ` · `Branch `
- `Demo session. Production uses a server session and SSO.`
- `Log out`
- `When this branch is open`
- `Source: branch hours for {branch}. A call due after close waits until the next open.`
- Day names: `Sunday` · `Monday` · `Tuesday` · `Wednesday` · `Thursday` · `Friday` · `Saturday`
- Open: `{HH:MM} to {HH:MM}` · closed: `Closed`
- `Hours are not on file for this branch. Clocks cannot be trusted until they are.`

### Marketing (not the floor)

**Document title default:** `arth, for auto retail` · template `%s · arth`  
**Description:** `Other systems tell you your telecaller made forty calls. Arth tells you those forty calls cost ₹9,200 and produced one delivered car.`

**`/`**

- `arth for auto retail`
- `Other systems tell you your telecaller made forty calls. Arth tells you those forty calls cost ₹9,200 and produced one delivered car.`
- `This preview is the telecalling floor for Indian dealer groups. Not the full 80-screen product. You can hold a person to an enquiry: owner, clock, disposition, ledger. Walk it, then send what should change.`
- `Open the product` · `How records are kept`
- `Forty calls is activity. One delivered car is artha.`
- `Meaning, and wealth. Enquiry data in a dealership has always had both and delivered neither. Arth records who did the work, and will not flatter anyone.`
- `Evidence, not assertion` / `Every claim carries its number, its source and its date.`
- `Silence when nothing is wrong` / `Colour is spent only where money is at stake.`
- `A bound ledger` / `Rules and edges. Nothing that looks like it could be swiped away.`
- `An Advito Global product`
- Header: `arth home` · `How records are kept` · `Open the product`

**`/trust`**

- Title: `How records are kept`
- `How records are kept`
- `Arth exists to connect the money leaving a dealer's bank account to the car leaving the showroom, and to name who was responsible at every step.` (source uses `&apos;` for the apostrophe)
- `Nothing is silently edited` / `A record that can be quietly rewritten has no meaning. Changes are visible.`
- `Tenant isolation` / `Every enquiry carries a tenant. Whitefield Motors cannot read another group.`
- `Overdue and Settled are not configurable` / `A tenant cannot recolour a broken promise. The moment red is a preference, the record stops being evidence.`
- `Rupees, lakhs, branches` / `Indian digit grouping. Branch, not rooftop. Enquiry, not lead, except in the phrase lead source.`
- `Open the product`
- `An Advito Global product`

**`/enter`**

- Title: `Enter`
- `The telecalling floor`
- `What you are testing: one telecalling department. Today, Log a call, My enquiries, the enquiry record, Search, Notifications, My profile. Every enquiry has an owner and a clock. Telephony and scores are the next release.`
- `Telecaller`
- `Two tenants. Switch to prove one dealer cannot see the other.`
- `Open Today`

**Root not-found / error (outside `/w`)**

- `That page is not in Arth` / `The route does not exist. Return to the product or the public site.` / `Open a floor` / `Public site`
- `This screen did not load` / `The last saved work on this screen is still on the device. Retry.` / `Retry`

---

## 3 · Structure of the two things that repeat

Today and My enquiries both render `EnquiryRow` / `EnquiryList` from `src/components/enquiry-row.tsx`. At viewport 1100px, Tailwind `lg` (64rem / 1024px) is on, so field labels with `lg:hidden` are not painted; `RowHead` is.

### 3.1 Live markup — Today, first `article` (Meera Joshi, 26 Aug 2026)

```html
<article class="relative cursor-pointer border border-[var(--arth-n10)] bg-[var(--arth-n00)] p-4 transition-colors hover:bg-[var(--arth-n05)] lg:border-x-0 lg:border-t-0 lg:px-3 lg:py-3 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,0.9fr)_minmax(0,0.9fr)_minmax(0,1.2fr)_minmax(0,1.2fr)_6.5rem] lg:grid lg:items-start lg:gap-2">
  <a class="absolute inset-0 z-0" aria-label="Open Meera Joshi" href="/w/rec?id=ffffffff-ffff-ffff-ffff-fffffffffff3"></a>
  <div class="flex items-start justify-between gap-3 lg:block">
    <div class="min-w-0">
      <p class="truncate font-semibold" title="Meera Joshi">Meera Joshi</p>
      <p class="font-data truncate text-[12.5px] text-[var(--arth-n60)]">98765 00003</p>
      <p class="font-data truncate text-[12.5px] text-[var(--arth-n60)]">Enquiry <!-- -->FFFFFFF3</p>
    </div>
    <div class="flex shrink-0 flex-wrap justify-end gap-1">
      <span class="inline-flex rounded-[2px] px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide bg-[var(--arth-overdue-wash)] text-[var(--arth-overdue)]">Overdue</span>
    </div>
  </div>
  <div class="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 lg:mt-0 lg:contents">
    <div class="min-w-0">
      <p class="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--arth-slate)] lg:hidden">Vehicle</p>
      <p class="mt-1 truncate text-sm lg:mt-0 " title="Fronx">Fronx</p>
      <p class="truncate text-[12.5px] text-[var(--arth-n60)]" title="Alpha">Alpha</p>
    </div>
    <div class="min-w-0">
      <p class="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--arth-slate)] lg:hidden">Source</p>
      <p class="mt-1 truncate text-sm lg:mt-0 " title="Walk-in">Walk-in</p>
      <p class="truncate text-[12.5px] text-[var(--arth-n60)]" title="Indiranagar">Indiranagar</p>
    </div>
    <div class="min-w-0">
      <p class="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--arth-slate)] lg:hidden">Stage</p>
      <p class="mt-1 truncate text-sm lg:mt-0 " title="Negotiation">Negotiation</p>
      <p class="truncate text-[12.5px] text-[var(--arth-n60)]" title="7 of 9">7 of 9</p>
    </div>
    <div class="min-w-0">
      <p class="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--arth-slate)] lg:hidden">Last activity</p>
      <p class="mt-1 truncate text-sm lg:mt-0 " title="No activity recorded">No activity recorded</p>
    </div>
    <div class="min-w-0">
      <p class="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--arth-slate)] lg:hidden">Next</p>
      <p class="mt-1 truncate text-sm lg:mt-0 font-semibold text-[var(--arth-overdue)]" title="Follow-up due · 25 Aug">Follow-up due · 25 Aug</p>
    </div>
  </div>
  <div class="mt-4 lg:mt-0">
    <a role="button" tabindex="0" data-slot="button" class="group/button inline-flex shrink-0 items-center justify-center border border-transparent bg-clip-padding font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&amp;_svg]:pointer-events-none [&amp;_svg]:shrink-0 bg-[var(--arth-ink)] text-[var(--arth-n00)] hover:bg-[var(--arth-n90)] gap-1 text-[0.8rem] in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&amp;_svg:not([class*='size-'])]:size-3.5 relative z-10 h-9 rounded-[3px] px-3 w-full lg:w-auto" href="/w/tele?id=ffffffff-ffff-ffff-ffff-fffffffffff3">Call</a>
  </div>
</article>
```

`RowHead` (sibling, `hidden` until `lg`): `Customer` · `Vehicle` · `Source` · `Stage` · `Last activity` · `Next action` · `Actions`

Fields in DOM order, with the label that exists in markup (visible below `lg` only, except Customer which has no field label):

| Order | Label in markup | This example |
|---|---|---|
| 1 | (none) | Meera Joshi / 98765 00003 / Enquiry FFFFFFF3 / Overdue |
| 2 | Vehicle | Fronx / Alpha |
| 3 | Source | Walk-in / Indiranagar |
| 4 | Stage | Negotiation / 7 of 9 |
| 5 | Last activity | No activity recorded |
| 6 | Next | Follow-up due · 25 Aug |
| 7 | (button, header Actions) | Call |

`Value` is not in this tree (`showValue` false for tele).

### 3.2 Live markup — My enquiries, first `article` (Priya Menon)

```html
<article class="relative cursor-pointer border border-[var(--arth-n10)] bg-[var(--arth-n00)] p-4 transition-colors hover:bg-[var(--arth-n05)] lg:border-x-0 lg:border-t-0 lg:px-3 lg:py-3 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,0.9fr)_minmax(0,0.9fr)_minmax(0,1.2fr)_minmax(0,1.2fr)_6.5rem] lg:grid lg:items-start lg:gap-2">
  <a class="absolute inset-0 z-0" aria-label="Open Priya Menon" href="/w/rec?id=ffffffff-ffff-ffff-ffff-fffffffffff7"></a>
  <div class="flex items-start justify-between gap-3 lg:block">
    <div class="min-w-0">
      <p class="truncate font-semibold" title="Priya Menon">Priya Menon</p>
      <p class="font-data truncate text-[12.5px] text-[var(--arth-n60)]">98765 00007</p>
      <p class="font-data truncate text-[12.5px] text-[var(--arth-n60)]">Enquiry <!-- -->FFFFFFF7</p>
    </div>
    <div class="flex shrink-0 flex-wrap justify-end gap-1">
      <span class="inline-flex rounded-[2px] px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide bg-[var(--arth-overdue-wash)] text-[var(--arth-overdue)]">Overdue</span>
    </div>
  </div>
  <div class="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 lg:mt-0 lg:contents">
    <div class="min-w-0">
      <p class="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--arth-slate)] lg:hidden">Vehicle</p>
      <p class="mt-1 truncate text-sm lg:mt-0 " title="Grand Vitara">Grand Vitara</p>
      <p class="truncate text-[12.5px] text-[var(--arth-n60)]" title="Alpha">Alpha</p>
    </div>
    <div class="min-w-0">
      <p class="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--arth-slate)] lg:hidden">Source</p>
      <p class="mt-1 truncate text-sm lg:mt-0 " title="Walk-in">Walk-in</p>
      <p class="truncate text-[12.5px] text-[var(--arth-n60)]" title="Whitefield showroom">Whitefield showroom</p>
    </div>
    <div class="min-w-0">
      <p class="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--arth-slate)] lg:hidden">Stage</p>
      <p class="mt-1 truncate text-sm lg:mt-0 " title="Test drive">Test drive</p>
      <p class="truncate text-[12.5px] text-[var(--arth-n60)]" title="5 of 9">5 of 9</p>
    </div>
    <div class="min-w-0">
      <p class="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--arth-slate)] lg:hidden">Last activity</p>
      <p class="mt-1 truncate text-sm lg:mt-0 " title="No activity recorded">No activity recorded</p>
    </div>
    <div class="min-w-0">
      <p class="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--arth-slate)] lg:hidden">Next</p>
      <p class="mt-1 truncate text-sm lg:mt-0 font-semibold text-[var(--arth-overdue)]" title="Follow-up due · 25 Aug">Follow-up due · 25 Aug</p>
    </div>
  </div>
  <div class="mt-4 lg:mt-0">
    <a role="button" ... href="/w/tele?id=ffffffff-ffff-ffff-ffff-fffffffffff7">Call</a>
  </div>
</article>
```

Same field order as Today. This example: Priya Menon / 98765 00007 / Enquiry FFFFFFF7 / Overdue / Grand Vitara / Alpha / Walk-in / Whitefield showroom / Test drive / 5 of 9 / No activity recorded / Follow-up due · 25 Aug / Call.

---

## 4 · The disposition panel

Component file: `src/components/disposition-panel.tsx` (full file, 221 lines). Quoted in full:

```tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function DispositionPanel({
  leadId,
  nextLeadId,
  nextName,
  dispositions,
  lostReasons,
}: {
  leadId: string;
  nextLeadId?: string;
  nextName?: string;
  dispositions: {
    key: string;
    label: string;
    requires_revisit: boolean;
    requires_lost_reason: boolean;
    connected: boolean;
  }[];
  lostReasons: { key: string; label: string; requires_fact: string }[];
}) {
  const initial = dispositions[0]?.key ?? "no_answer";
  const router = useRouter();
  const [key, setKey] = useState(initial);
  const [revisit, setRevisit] = useState("");
  const [lost, setLost] = useState("");
  const [note, setNote] = useState("");
  const [callbackReason, setCallbackReason] = useState("");
  const [lostFact, setLostFact] = useState("");
  const [confirm, setConfirm] = useState<string | null>(null);
  const [eventId, setEventId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const farCallback =
    revisit !== "" &&
    new Date(revisit).getTime() - Date.now() > 14 * 24 * 60 * 60 * 1000;
  const dirty =
    note !== "" ||
    revisit !== "" ||
    lost !== "" ||
    callbackReason !== "" ||
    lostFact !== "" ||
    key !== initial;
  const selected = dispositions.find((d) => d.key === key);
  const selectedLost = lostReasons.find((r) => r.key === lost);
  const showLostFact = selected?.requires_lost_reason && selectedLost && selectedLost.requires_fact !== "none";
  const showRevisit = selected?.requires_revisit || selected?.key === "connected_callback";

  useEffect(() => {
    if (!confirm || !eventId) return;
    const t = window.setTimeout(() => {
      setConfirm(null);
      setEventId(null);
      if (nextLeadId) {
        router.push(`/w/tele?id=${nextLeadId}`);
      } else {
        router.refresh();
      }
    }, 1500);
    return () => window.clearTimeout(t);
  }, [confirm, eventId, router, nextLeadId]);

  async function save() {
    setError(null);
    const res = await fetch("/api/v1/dispositions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        leadId,
        dispositionKey: key,
        note,
        revisitAt: revisit || undefined,
        lostReasonKey: lost || undefined,
        callbackReason: callbackReason || undefined,
        lostFact: lostFact || undefined,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Not saved.");
      return;
    }
    setEventId(data.eventId ?? null);
    setConfirm(`${data.recorded}. Next action is on the queue.`);
    setNote("");
    setRevisit("");
    setLost("");
    setCallbackReason("");
    setLostFact("");
  }

  async function undo() {
    if (!eventId) return;
    const res = await fetch("/api/v1/undo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ leadId, eventId }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Undo failed.");
      return;
    }
    setConfirm(null);
    setEventId(null);
    router.refresh();
  }

  if (confirm) {
    return (
      <div className="border border-[var(--arth-n10)] bg-[var(--arth-n00)] p-6">
        <p className="font-medium">{confirm}</p>
        <p className="mt-2 text-sm text-[var(--arth-n60)]">
          Undo writes a correcting entry. The original row stays.
          {nextName
            ? ` After this window the next enquiry is ${nextName}.`
            : " After this window you stay on Today if nothing else is due."}
        </p>
        <Button className="mt-4" variant="outline" onClick={undo}>
          Undo
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4 border border-[var(--arth-n10)] bg-[var(--arth-n00)] p-6">
      {dirty ? (
        <p className="bg-[var(--arth-n05)] px-3 py-2 text-sm">
          Unsaved changes. Record outcome or they stay on this screen.
        </p>
      ) : null}
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--arth-slate)]">
        Disposition
      </p>
      <label className="block text-sm">
        Outcome
          <select
            className="mt-1 block h-11 w-full rounded-[3px] border border-[var(--arth-n50)] bg-[var(--arth-n00)] px-2"
            value={key}
            onChange={(e) => setKey(e.target.value)}
          >
            <optgroup label="Connected">
              {dispositions.filter((d) => d.connected).map((d) => (
                <option key={d.key} value={d.key}>{d.label}</option>
              ))}
            </optgroup>
            <optgroup label="Not connected">
              {dispositions.filter((d) => !d.connected).map((d) => (
                <option key={d.key} value={d.key}>{d.label}</option>
              ))}
            </optgroup>
          </select>
      </label>
      {showRevisit ? (
        <label className="block text-sm">
          Revisit at
          <input
            type="datetime-local"
            className="mt-1 block h-11 w-full rounded-[3px] border border-[var(--arth-n50)] px-2"
            value={revisit}
            onChange={(e) => setRevisit(e.target.value)}
          />
        </label>
      ) : null}
      {farCallback ? (
        <label className="block text-sm">
          Reason the callback is more than 14 days away
          <input
            className="mt-1 block h-11 w-full rounded-[3px] border border-[var(--arth-n50)] px-2"
            value={callbackReason}
            onChange={(e) => setCallbackReason(e.target.value)}
          />
        </label>
      ) : null}
      {selected?.requires_lost_reason ? (
        <label className="block text-sm">
          Lost reason
          <select
            className="mt-1 block h-11 w-full rounded-[3px] border border-[var(--arth-n50)] px-2"
            value={lost}
            onChange={(e) => setLost(e.target.value)}
          >
            <option value="">Select</option>
            {lostReasons.map((r) => (
              <option key={r.key} value={r.key}>
                {r.label}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      {showLostFact ? (
        <label className="block text-sm">
          {selectedLost?.requires_fact}
          <input
            className="mt-1 block h-11 w-full rounded-[3px] border border-[var(--arth-n50)] px-2"
            value={lostFact}
            onChange={(e) => setLostFact(e.target.value)}
          />
        </label>
      ) : null}
      <label className="block text-sm">
        Note
        <textarea
          className="mt-1 block min-h-20 w-full rounded-[3px] border border-[var(--arth-n50)] px-2 py-2"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Example: asked for a Saturday test drive"
        />
      </label>
      {error ? <p className="text-sm text-[var(--arth-overdue)]">{error}</p> : null}
      <div className="flex gap-2">
        <Button onClick={save}>Record outcome</Button>
      </div>
    </div>
  );
}
```

**Before choosing an outcome.** `initial` is `dispositions[0].key`. Seed sort order puts `connected_callback` first (`Connected, callback`). The panel therefore already shows: eyebrow `Disposition`; `Outcome` select with optgroups `Connected` / `Not connected`; `Revisit at` (`showRevisit` is true because `key === "connected_callback"`); `Note`; `Record outcome`. Unsaved bar is off until `key !== initial` or a field is filled.

**When each of the six outcomes is chosen** (seed flags):

| Outcome | Connected group | Extra controls |
|---|---|---|
| Connected, callback | yes | `Revisit at`. If revisit is more than 14 days ahead, also `Reason the callback is more than 14 days away` |
| Postponed | yes | `Revisit at` (`requires_revisit`). Same 14-day reason field if far |
| Lost | yes | `Lost reason` (`Select` plus seven reasons). If the chosen reason’s `requires_fact` is not `none`, an input labelled with that fact string (`attempt count`, `quoted amount`, `financier name`, `competitor if known`, `stated timeline`, `model asked for`) |
| Not connected, busy | no | Note only |
| Not connected, switched off | no | Note only |
| Not connected, no answer | no | Note only |

**What is required before save is possible.** The `Record outcome` button is not disabled. The client posts on click. The server then rejects: postponed without revisit; lost without reason; lost without the required fact; callback more than 14 days without `callbackReason`; non-owner. Those errors render in `--arth-overdue` as `data.error`.

**After save.** The form is replaced by `{disposition label}. Next action is on the queue.` plus `Undo writes a correcting entry. The original row stays.` plus either ` After this window the next enquiry is {nextName}.` or ` After this window you stay on Today if nothing else is due.` and button `Undo`.

**How long it stays.** `window.setTimeout(..., 1500)` then `router.push` to the next Today enquiry if `nextLeadId` exists, else `router.refresh()`. Clearing the timeout on unmount.

**Undo.** `POST /api/v1/undo` with `leadId` and `eventId`. On success, confirm is cleared and the page refreshes. Server inserts a `correction` event with note `Undo of last disposition. Original row stands.`, restores `next_action_at` and `stage_key` from payload, sets `lost_reason_key` to NULL. It does not delete the original disposition row.

---

## 5 · Responsive behaviour

### 5.1 Breakpoints defined

This repo does not declare custom `--breakpoint-*`. Tailwind v4 defaults (`node_modules/tailwindcss/theme.css`):

| Token | Value | CSS px at 16px root |
|---|---|---|
| `--breakpoint-sm` | 40rem | 640px |
| `--breakpoint-md` | 48rem | 768px |
| `--breakpoint-lg` | 64rem | 1024px |
| `--breakpoint-xl` | 80rem | 1280px |
| `--breakpoint-2xl` | 96rem | 1536px |

Floor TSX uses `sm:` and `lg:` (and marketing uses `md:`). `xl` / `2xl` are not used on `/w/*`.

### 5.2 What changes, per screen

**All signed-in `/w/*` (layout + nav)**

- Default: column layout; top ink bar; wordmark; identity under wordmark; Log out top-right; nav `grid-cols-2`; padding `px-4 py-6`.
- `sm` (640px): nav `sm:grid-cols-3`.
- `lg` (1024px): `flex-row`; 240px left aside; top bar `lg:hidden`; main padding `lg:px-8 lg:py-8`; nav links `lg:justify-start`.

**Today / My enquiries / Search results (`EnquiryList`)**

- Default: stacked cards, `space-y-3`, per-field labels, Call `w-full`, 2-column field grid.
- `lg`: `RowHead` visible; cards become one grid row; labels `lg:hidden`; Call `lg:w-auto`; list gets a single border.

**Log a call**

- Default: single column (customer, history, then panels).
- `lg`: `lg:grid-cols-[1fr_360px]` — main + disposition/stage column.

**Enquiry record**

- `sm`: definition list `sm:grid-cols-2`.

**Search filter**

- `sm`: `sm:grid-cols-2`
- `lg`: `lg:grid-cols-3`

**My enquiries stage chips**

- Default: `grid-cols-2`
- `sm`: `sm:grid-cols-5`

**File enquiry / Notifications / Profile / Login:** no screen-specific breakpoint classes beyond the shared layout.

**Marketing:** `sm:flex-row` CTAs; `md:grid-cols-2` / `md:grid-cols-3`; `lg:py-24`; header `How records are kept` `hidden … sm:inline-flex`.

### 5.3 At exactly 1100px: horizontal scroll

Chrome headless, viewport width 1100, cookies Iyer. Compared `documentElement.clientWidth`, `scrollWidth`, `body.scrollWidth`, and max `getBoundingClientRect().right`.

| Path | clientWidth | scrollWidth | bodyScrollWidth | maxChildRight | overflows |
|---|---|---|---|---|---|
| `/w/dayb` | 1100 | 1100 | 1100 | 1100 | no |
| `/w/tele` | 1100 | 1100 | 1100 | 1100 | no |
| `/w/pipe` | 1100 | 1100 | 1100 | 1100 | no |
| `/w/rec?id=ffffffff-ffff-ffff-ffff-fffffffffff1` | 1100 | 1100 | 1100 | 1100 | no |
| `/w/search?q=Ramesh` | 1100 | 1100 | 1100 | 1100 | no |
| `/w/new` | 1100 | 1100 | 1100 | 1100 | no |
| `/w/notif` | 1100 | 1100 | 1100 | 1100 | no |
| `/w/profile` | 1100 | 1100 | 1100 | 1100 | no |
| `/w/login` | 1100 | 1100 | 1100 | 1100 | no |

At 1100px the `lg` layout is active (1100 > 1024).

---

## 6 · Navigation and identity

### 6.1 How a user moves between the eight screens

Nav items (Record and File enquiry are not in this list):

```7:14:src/components/floor-nav.tsx
const items = [
  { href: "/w/dayb", screen: "dayb", label: "Today" },
  { href: "/w/tele", screen: "tele", label: "Log a call" },
  { href: "/w/pipe", screen: "pipe", label: "My enquiries" },
  { href: "/w/search", screen: "search", label: "Search" },
  { href: "/w/notif", screen: "notif", label: "Notifications" },
  { href: "/w/profile", screen: "profile", label: "My profile" },
];
```

Full `FloorNav`:

```16:68:src/components/floor-nav.tsx
export function FloorNav({
  seat,
  unread = 0,
}: {
  seat: Seat;
  unread?: number;
}) {
  const visible = items
    .filter((item) => canOpen(seat.roleKey, item.screen))
    .map(({ href, label, screen }) => ({
      href,
      label:
        screen === "notif" && unread > 0 ? `${label} · ${unread}` : label,
    }));
  return (
    <>
      <aside className="hidden w-[240px] shrink-0 bg-[var(--arth-ink)] p-5 text-[var(--arth-n00)] lg:flex lg:flex-col">
        ...
      </aside>
      <div className="border-b border-[var(--arth-n10)] bg-[var(--arth-ink)] px-4 py-3 text-[var(--arth-n00)] lg:hidden">
        ...
      </div>
    </>
  );
}
```

Other routes into the eight:

| From | Control | To |
|---|---|---|
| Any list card | full-card `Link` | `/w/rec?id=` |
| Call | `ActionButton` | `/w/tele?id=` |
| My enquiries | `Add enquiry` | `/w/new` |
| Search miss on phone | `File this enquiry` | `/w/new?phone=` |
| Record (owner + tele) | `Log a call` | `/w/tele?id=` |
| Log a call name | `Link` | `/w/rec?id=` |
| Log a call | `Next: {name}` | `/w/tele?id=` |
| Notifications row / Open | | `href` on the row (`/w/rec?id=` or `/w/tele?id=`) |
| File enquiry after save | timeout 1500ms | `/w/tele?id=` |
| Login | `Open landing screen` | `/w/dayb` or `/w/pipe` by seat |
| Wordmark | | `/` (leaves the floor) |
| Forbidden | `Open your landing screen` | `/w/pipe` default, or `/w/{workspaceKey}` from `/w/denied` |

`FloorLinks` marks the current path with `path === item.href || path.startsWith(\`${item.href}?\`)`. Query strings on `/w/tele` and `/w/rec` therefore do not keep a nav item selected except exact `/w/tele` and `/w/search`.

### 6.2 What identifies the signed-in person, and where

From `DEMO_USERS` via cookie `arth_seat`: `seat.name`, `seat.roleLabel`, `seat.tenantName`, `seat.roleKey`.

- Sidebar foot (`lg+`): `{seat.name} · {seat.roleLabel}` at `text-[12.5px] text-[var(--arth-n40)]` on ink.
- Mobile header: same string under the wordmark.
- Sidebar eyebrow: `Telecalling` or `Sales`; tenant name under it.
- Profile: Name, Seat, Opens on, Tenant, Branch.

Live as Rao on `/w/dayb`: `S. Rao · sales consultant` still in the chrome while the page body is the refusal.

### 6.3 Seat that lacks permission

`src/proxy.ts`: unsigned `/w/*` (except login/denied) redirects to `/w/login`. Known screen + role not in `canOpen` → rewrite to `/w/denied` with HTTP 403. `/w/denied` renders `Forbidden` with `landing={`/w/${seat.workspaceKey}`}`.

Live Rao opening `/w/dayb` body text:

```
You cannot open this screen

This screen is for another seat. Open a screen on your access list, or leave this floor.

Open your landing screen
```

Nav for Rao (no Today, no Log a call, no My profile): `My enquiries` · `Search` · `Notifications`.

Pages also call `if (!canOpen(...)) return <Forbidden />` if middleware is bypassed.

---

## 7 · Empty, loading and error states

`src/app/w/loading.tsx` and `src/app/w/error.tsx` wrap the `/w` segment. They are not per-route files.

**Loading (every `/w` screen that suspends):**  
`Opening this screen`  
`Your last saved work stays in the ledger. This list will appear here.`

**Error (every `/w` screen that throws):**  
`This screen did not load`  
`The last saved work on this screen is still in the ledger. Retry, or open Today.`  
`Retry` · `Open Today`  
(`error.message` is not rendered.)

| Screen | No data | Loading | Error |
|---|---|---|---|
| Today | `No enquiries are due. New ones appear here when they are assigned.` Block empty: `None in this list.` | shared | shared |
| Log a call | `No enquiries are due. New ones appear here when they are assigned.` Missing id in tenant: `This enquiry is not in your tenant.` History empty: `No activity recorded yet. The first call writes the first row.` | shared | shared + panel `Not saved.` / `Undo failed.` |
| My enquiries | `No enquiries are assigned to you.` or `No enquiries in {stage}. They appear here when the stage moves.` | shared | shared |
| Enquiry record | No `id`: `Open a name from Today, My enquiries, or Search.` Missing: `This enquiry is not in your tenant.` Ledger: `No rows yet. The first call writes the first row. Rows are never edited.` | shared | shared |
| Search | Idle: `Enter a search or apply a filter. New inbound calls start here.` Miss: the two no-match sentences in §2 | shared | shared |
| File enquiry | Form is the empty state (blank fields). Duplicate: API error + `Open the existing record` | shared | shared + form errors in §2 |
| Notifications | `No notifications. New ones appear when an enquiry you own needs you.` | shared | shared |
| My profile | Hours: `Hours are not on file for this branch. Clocks cannot be trusted until they are.` | shared | shared |
| Permission | Forbidden copy in §6 | — | — |
| Unknown `/w` route | `That screen is not on this floor` … | — | — |

---

## 8 · Measured, not described

### 8.1 Contrast of floor chrome text-on-background pairings

Relative luminance per WCAG 2, sRGB. Hex from `arth-tokens.css`. Computed 26 Aug 2026.

| Ratio | Foreground | Background | Pairing used on the floor | Body-text 4.5:1 |
|---|---|---|---|---|
| 13.57 | `#0f2a33` `--arth-ink` | `#f1f4f4` `--arth-n05` | Body / canvas | |
| 15.01 | `#0f2a33` `--arth-ink` | `#ffffff` `--arth-n00` | Card text | |
| 5.50 | `#5a6c71` `--arth-n60` | `#ffffff` `--arth-n00` | Captions on card | |
| 4.97 | `#5a6c71` `--arth-n60` | `#f1f4f4` `--arth-n05` | Captions on canvas | |
| 7.38 | `#2e5c68` `--arth-slate` | `#ffffff` `--arth-n00` | Eyebrows on card | |
| 6.67 | `#2e5c68` `--arth-slate` | `#f1f4f4` `--arth-n05` | Eyebrows on canvas | |
| 5.90 | `#b23b2e` `--arth-overdue` | `#ffffff` `--arth-n00` | Late Next field | |
| 4.77 | `#b23b2e` `--arth-overdue` | `#f6e3e0` `--arth-overdue-wash` | Overdue stamp | |
| 4.71 | `#27735a` `--arth-settled` | `#deede7` `--arth-settled-wash` | Settled stamp | |
| 15.01 | `#ffffff` `--arth-n00` | `#0f2a33` `--arth-ink` | Sidebar text, primary button, Log out | |
| 6.49 | `#9fadb0` `--arth-n40` | `#0f2a33` `--arth-ink` | `{name} · {role}` | |
| 9.83 | `#c9d3d4` `--arth-n20` | `#0f2a33` `--arth-ink` | Unselected nav | |
| 6.37 | `#d0a155` `--arth-brass-lift` | `#0f2a33` `--arth-ink` | `Telecalling` / `Sales` eyebrow | |
| 11.44 | `#ffffff` `--arth-n00` | `#263d45` `--arth-n90` | Selected nav | |
| 12.22 | `#0f2a33` `--arth-ink` | `#e3e9e9` `--arth-n10` | Outline button hover | |
| 9.83 | `#0f2a33` `--arth-ink` | `#c9d3d4` `--arth-n20` | Secondary hover | |
| 5.90 | `#ffffff` `--arth-n00` | `#b23b2e` `--arth-overdue` | Destructive button (defined; unused on these screens) | |

None of the pairings in that table compute below 4.5:1.

Logo brass rule `--arth-brass` `#b07f2c` on ink or on n00 is a fill, not text. Not included as a text pairing.

### 8.2 Em dashes in user-facing copy

Search of `src/**/*.ts,*.tsx,*.css` for U+2014 and U+2013.

**Count in UI strings: 0.**

One em dash exists in a CSS comment, not rendered:

`src/styles/arth-tokens.css:1` `/* THE ARTH BRAND SYSTEM v2.9 — Part 9.1 tokens. Do not add colours here. */`

---

## Found while extracting (code not changed)

- Offline bar copy: `Calls you log will sync when you reconnect.` No offline write queue in `src/`.
- `Record outcome` is never `disabled`; required fields are enforced after POST.
- Default outcome is the first seeded row (`Connected, callback`), so `Revisit at` is on screen before the user changes the select.
- Live enquiry number markup includes a React empty comment: `Enquiry <!-- -->FFFFFFF3`.
- `dialog.tsx` / `sheet.tsx` still contain `bg-black/10`. They are unused by `/w/*`.

---

## Where I knowingly departed from the prototype

| Prototype | This build | Reason recorded at the time |
|---|---|---|
| Console named On a call | Label and heading `Log a call`; helper `This is not a live phone line.` | No telephony. The person dials the desk phone, then logs the outcome. |
| Search reached by `adv`/`sales` in Appendix B | `tele` can open Search | SCOPE-BRIEF lists Search as a telecaller screen (inbound starts there). |
| Expected value on the row | Hidden for `tele` and `sales` (`canSeeValue`) | Floor should not see rupee value. |
| Difficulty on the executive row | Stored, not shown on the tile | Hidden from executives. |
| Nine-column paper row at all widths | Below `lg`: labelled cards; at `lg+`: CSS grid + `RowHead`, field labels `lg:hidden` | Phone-width floor still names fields. |
| Enquiry identity as UUID | Last eight of id, labelled `Enquiry` | Paperwork / Search number. |
| One mixed search chrome | Separate Search box and Filter panel | Product request: type vs filter. |
| Name-only hit target / separate Record control | Whole `article` links to `/w/rec`; `Call` is `z-10` | Product request: tap the card for the record. |
| Underlined text nav | Boxed tiles `h-10` with border | Product request: boxed CTAs. |
| Log out in the foot | Compact `Log out` top-right of ink chrome | Product request: visible logout. |
| Full 22-seat switcher | Four demo seats and a cookie | This cycle is a telecalling test, not the platform. |
| File enquiry not a listed Appendix B screen | `/w/new` from Search miss and My enquiries | SCOPE-BRIEF: inbound with no match must be fileable. |

## Unsure whether this differs

- Today split into `Late` / `Due later today` / `Also due` versus a single queue.
- Stage move living on Log a call beside dispositions versus only on the record.
- `datetime-local` for revisit versus a date-only control.
- `Parked` as uppercase text, not a stamp.
- Notifications: whole-row click and a remaining `Open` button.
- Auto-advance to the next Today enquiry after 1500ms.
- Login copy that explains the test, on the floor sign-in screen.
- Marketing pages sitting in the same app as the floor.
