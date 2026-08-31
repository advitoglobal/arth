#!/usr/bin/env python3
"""Build CODE-ATLAS.md and ARTH-DIRECTOR-REVIEW.html from the live repo + screenshots."""
from __future__ import annotations

from datetime import datetime, timezone
from html import escape
from pathlib import Path

ROOT = Path("/workspace")
PACK = ROOT / "docs" / "directors-review"
SRC_ROOTS = [
    ROOT / "src",
    ROOT / "scripts",
    ROOT / "package.json",
    ROOT / "package-lock.json",
    ROOT / "tsconfig.json",
    ROOT / "next.config.ts",
    ROOT / "eslint.config.mjs",
    ROOT / "postcss.config.mjs",
    ROOT / "components.json",
    ROOT / "README.md",
    ROOT / "00-START-HERE.md",
    ROOT / "AGENTS.md",
    ROOT / "docs" / "directors-review" / "capture-screens.mjs",
    ROOT / "docs" / "STATUS.md",
    ROOT / "docs" / "BRAND.md",
    ROOT / "docs" / "CAPACITY.md",
    ROOT / "docs" / "books",
    ROOT / "docs" / "brand",
]
SKIP_DIR = {".next", "node_modules", ".git", "screens"}
TEXT_EXT = {".ts", ".tsx", ".css", ".sql", ".json", ".mjs", ".md", ".html"}


def iter_files() -> list[Path]:
    out: list[Path] = []
    for start in SRC_ROOTS:
        if start.is_file():
            out.append(start)
            continue
        if not start.exists():
            continue
        for p in sorted(start.rglob("*")):
            if not p.is_file():
                continue
            if any(part in SKIP_DIR for part in p.parts):
                continue
            if p.suffix.lower() in TEXT_EXT or p.name in {
                "package.json",
                "package-lock.json",
                "tsconfig.json",
            }:
                out.append(p)
    # unique, stable
    seen = set()
    uniq = []
    for p in out:
        if p in seen:
            continue
        seen.add(p)
        uniq.append(p)
    return uniq


def read_text(p: Path) -> str:
    try:
        return p.read_text(encoding="utf-8")
    except UnicodeDecodeError:
        return p.read_text(encoding="utf-8", errors="replace")


def build_atlas(files: list[Path]) -> str:
    parts = [
        "# Arth source atlas",
        "",
        "This file is the complete application source that the director review pack describes.",
        "Generated so Product and IT can review the code without opening the repository separately.",
        "",
        f"Generated: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')}",
        f"Files: {len(files)}",
        "",
    ]
    for p in files:
        rel = p.relative_to(ROOT)
        body = read_text(p)
        parts.append(f"\n\n{'=' * 72}\nFILE: {rel}\nBYTES: {p.stat().st_size}\n{'=' * 72}\n")
        parts.append("```")
        parts.append(body.rstrip() + "\n```")
    return "\n".join(parts) + "\n"


def build_manifest(files: list[Path]) -> str:
    lines = [
        "# File manifest",
        "",
        "Every application file copied into `CODE-ATLAS.md`. Screenshots live in `screens/`.",
        "",
        "| Path | Bytes |",
        "|---|---:|",
    ]
    total = 0
    for p in files:
        n = p.stat().st_size
        total += n
        lines.append(f"| `{p.relative_to(ROOT)}` | {n} |")
    lines.append(f"| **Total** | **{total}** |")
    lines.append("")
    return "\n".join(lines)


def excerpt(rel: str, max_lines: int = 120) -> str:
    p = ROOT / rel
    text = read_text(p)
    lines = text.splitlines()
    clipped = "\n".join(lines[:max_lines])
    if len(lines) > max_lines:
        clipped += f"\n\n/* … {len(lines) - max_lines} more lines in CODE-ATLAS.md under {rel} … */"
    return clipped


SHOTS = [
    ("00-home.png", "Public home", "/", "Unsigned. Brand line and entry to the floor."),
    ("01-login.png", "Sign in (desktop)", "/w/login", "Username/password, mobile OTP, forgot password. Seat list for testers."),
    ("01-login-mobile.png", "Sign in (mobile 390px)", "/w/login", "Same login stacked for a phone."),
    ("02-trust.png", "How records are kept", "/trust", "Public explanation of ledgers and isolation, no login."),
    ("03-enter.png", "Open the product", "/enter", "Bridge into login."),
    ("10-iyer-today.png", "Today · Iyer (telecaller)", "/w/dayb", "Late first. Add enquiry. Inbound ring. Shared new book until a connected Dial."),
    ("10-iyer-today-mobile.png", "Today · Iyer on a phone", "/w/dayb", "Ink header and two-column floor links instead of the 240px sidebar."),
    ("11-iyer-log-call.png", "Log a call · Iyer", "/w/tele", "Dial, consent, disposition, department stage, hand on."),
    ("12-iyer-my-enquiries.png", "My enquiries · Iyer", "/w/pipe", "Department ladder for this seat."),
    ("13-iyer-search.png", "Search · Iyer", "/w/search", "Search obeys walls. Another telecaller's owned row does not appear."),
    ("14-iyer-add-enquiry.png", "Add enquiry · Iyer", "/w/new", "Duplicate check while the number is typed."),
    ("15-iyer-notifications.png", "Notifications · Iyer", "/w/notif", "Escalation notifies. It does not steal the enquiry."),
    ("16-iyer-performance.png", "Performance · Iyer", "/w/perf", "Connected scores need Dial in the last 15 minutes."),
    ("17-iyer-profile.png", "My profile · Iyer", "/w/profile", "Seat identity. Leave the floor."),
    ("18-iyer-arthbot-denied.png", "Arthbot refused · Iyer", "/w/bot", "Telecalling cannot open Arthbot. Proxy + page both fail closed."),
    ("20-rao-sales-pipeline.png", "Sales pipeline · Rao", "/w/pipe", "Sales consultant. Today is refused. Conversion after handoff."),
    ("21-rao-today-refused.png", "Today refused · Rao", "/w/dayb", "Copy: You cannot open this screen."),
    ("22-rao-stock.png", "Stock · Rao", "/w/stock", "Sales can book a VIN. Release is a sales manager act."),
    ("30-gupta-digital-desk.png", "The floor · Gupta", "/w/desk", "Digital desk: place enquiries, team at this branch."),
    ("40-shah-principal.png", "This dealer · Shah", "/w/prin", "Every department. Cost per booking. This dealer only."),
    ("41-shah-arthbot.png", "Arthbot · Shah", "/w/bot", "Allowlisted reports. Anthropic only picks the kind. CSV / PDF."),
    ("42-shah-all-departments.png", "All departments · Shah", "/w/gm", "Principal may open the GM operations view."),
    ("50-kumar-gm.png", "All departments · Kumar", "/w/gm", "GM: late work, escalations, cost per booking. Reassign stays a decision."),
    ("60-lal-stock-release.png", "Stock · Lal", "/w/stock", "Sales manager can release a booked unit."),
    ("61-lal-sales-manager.png", "Pipeline · Lal", "/w/pipe", "Sales manager ladder plus discount approval."),
    ("70-irfan-service.png", "Service · Irfan", "/w/svc", "Service advisor. Appointment through ready. No test drive."),
    ("80-nanda-insurance.png", "Insurance · Nanda", "/w/ins", "Full catalogue. Top three suggested. Margin hidden on this seat."),
    ("90-ravi-test-drives.png", "Test drives · Ravi", "/w/drive", "Coordinator slots and demo-car cleanliness."),
    ("a0-padma-dealer-setup.png", "Dealer setup · Padma", "/w/admin", "Price master, assignment mode, audit."),
    ("a1-books-accounts.png", "Accounts · Books", "/w/books", "Incentive export only. No enquiry content."),
    ("b0-pinto-coastal-today.png", "Today · Pinto (Coastal)", "/w/dayb", "Same product, other tenant. Whitefield rows must not appear."),
    ("c0-advito-dealers.png", "Advito dealers · advito", "/a/dealers", "Platform admin. Enter one dealer at a time."),
    ("c1-onboard-provision.png", "Onboard a dealer · onboard", "/a/onboard", "Provisions a dealer. Cannot enter a dealer book."),
]


def html_page() -> str:
    shots = []
    for file, title, route, note in SHOTS:
        shots.append(
            f"""
        <figure class="shot">
          <figcaption>
            <strong>{escape(title)}</strong>
            <span class="route">{escape(route)}</span>
            <p>{escape(note)}</p>
          </figcaption>
          <img src="screens/{escape(file)}" alt="{escape(title)}" />
        </figure>"""
        )

    access = excerpt("src/lib/access.ts", 80)
    tenant = excerpt("src/db/with-tenant.ts", 80)
    proxy = excerpt("src/proxy.ts", 50)
    rls = excerpt("src/db/migrations/0012_visibility_walls.sql", 70)
    conv = excerpt("src/services/conversion.ts", 90)
    bot = excerpt("src/services/arthbot.ts", 80)

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Arth — director review pack · 31 Aug 2026</title>
  <style>
    :root {{
      --ink: #0F2A33;
      --ink-deep: #08191F;
      --brass: #B07F2C;
      --n00: #ffffff;
      --n05: #f1f4f4;
      --n10: #e3e9e9;
      --n60: #5a6c71;
      --overdue: #b23b2e;
      --settled: #27735a;
    }}
    * {{ box-sizing: border-box; }}
    body {{
      margin: 0;
      color: var(--ink);
      background: var(--n05);
      font: 16px/1.5 "IBM Plex Sans", system-ui, sans-serif;
    }}
    header.cover {{
      background: var(--ink);
      color: var(--n00);
      padding: 48px 32px 40px;
    }}
    header.cover .rule {{
      width: 72px; height: 2px; background: var(--brass); margin-bottom: 20px;
    }}
    header.cover h1 {{
      font-family: "Anek Latin", Georgia, serif;
      font-weight: 600;
      font-size: 40px;
      margin: 0 0 12px;
    }}
    header.cover p {{ max-width: 68ch; color: #c9d3d4; }}
    nav.toc {{
      background: var(--n00);
      border-bottom: 1px solid var(--n10);
      padding: 16px 32px;
      position: sticky; top: 0; z-index: 2;
    }}
    nav.toc a {{ color: var(--ink); margin-right: 16px; font-size: 13px; }}
    main {{ max-width: 1100px; margin: 0 auto; padding: 32px 24px 80px; }}
    h2 {{
      font-family: "Anek Latin", Georgia, serif;
      font-size: 28px;
      border-top: 2px solid var(--brass);
      padding-top: 24px;
      margin-top: 48px;
    }}
    h3 {{ font-size: 18px; }}
    table {{ border-collapse: collapse; width: 100%; background: var(--n00); font-size: 14px; }}
    th, td {{ border: 1px solid var(--n10); padding: 8px 10px; vertical-align: top; text-align: left; }}
    th {{ background: var(--ink); color: var(--n00); font-weight: 600; }}
    code, pre {{ font-family: "IBM Plex Mono", ui-monospace, monospace; font-size: 12.5px; }}
    pre {{
      background: var(--ink-deep);
      color: #e3e9e9;
      padding: 16px;
      overflow: auto;
      white-space: pre-wrap;
    }}
    .note {{
      border-left: 3px solid var(--brass);
      padding: 8px 12px;
      background: #f3e7ce;
    }}
    .warn {{
      border-left: 3px solid var(--overdue);
      padding: 8px 12px;
      background: #f6e3e0;
    }}
    .ok {{
      border-left: 3px solid var(--settled);
      padding: 8px 12px;
      background: #deede7;
    }}
    figure.shot {{
      background: var(--n00);
      border: 1px solid var(--n10);
      margin: 24px 0;
      padding: 16px;
    }}
    figure.shot img {{
      width: 100%;
      height: auto;
      border: 1px solid var(--n10);
      display: block;
    }}
    figure.shot .route {{
      display: inline-block;
      margin-left: 8px;
      font-family: "IBM Plex Mono", monospace;
      font-size: 12px;
      color: var(--n60);
    }}
    ul.tight li {{ margin: 4px 0; }}
    .swatch {{ display: inline-block; width: 14px; height: 14px; vertical-align: middle; margin-right: 6px; border: 1px solid var(--n10); }}
  </style>
</head>
<body>
  <header class="cover">
    <div class="rule"></div>
    <p style="letter-spacing:0.16em;text-transform:uppercase;font-size:11px;color:#d0a155;">Advito · Arth · director review pack</p>
    <h1>What is built, how it looks, and the code that enforces it</h1>
    <p>Prepared 31 August 2026 for the Product Director and IT Director. Screenshots are live captures from the running product at 127.0.0.1:43127. Source in this folder is the application as of this date. Nothing in this pack is a mock. Demonstration password is on the login screen; it is not repeated here as a production secret.</p>
  </header>
  <nav class="toc">
    <a href="#product">Product</a>
    <a href="#built">Built</a>
    <a href="#design">Design</a>
    <a href="#screens">Screens</a>
    <a href="#access">Access</a>
    <a href="#stack">Stack</a>
    <a href="#code">Code</a>
    <a href="#prove">Proof</a>
    <a href="#out">Not built</a>
    <a href="#share">How to share</a>
  </nav>
  <main>
    <h2 id="product">1. What Arth is</h2>
    <p><strong>Enquiry accountability for Indian automobile dealer groups. Not a CRM.</strong> A CRM stores contacts. Arth holds a person to an enquiry: owner, clock, disposition, ledger. Every department’s enquiries are the business: sales, service, insurance. Service is often the larger revenue. Two intakes: digital desk and platforms, and manager Excel upload.</p>
    <p>The line the product is built to: other systems tell you your telecaller made forty calls. Arth tells you which of those calls came from a source costing a stated rupee amount per booking.</p>
    <div class="note">Vocabulary in the product: enquiry (not “lead”, except “lead source”), branch, owner, telecaller, Settled, Overdue. No em dashes in what a user reads.</div>

    <h3>Who this pack is for</h3>
    <table>
      <tr><th>Reader</th><th>What to read first</th></tr>
      <tr><td>Product Director</td><td>Sections 1–4 (product, built list, design, screenshots). Then “Not built”.</td></tr>
      <tr><td>IT Director</td><td>Sections 5–8 (access, stack, isolation, APIs, proof suite) and <code>CODE-ATLAS.md</code>.</td></tr>
    </table>

    <h2 id="built">2. Complete record of what is built</h2>
    <p>This is a working Next.js application with Postgres 16, forced row-level security, and a branded floor. Demonstration dealers: Whitefield Motors and Coastal Cars.</p>
    <h3>Floor behaviour that exists</h3>
    <ul class="tight">
      <li>Username/password login and mobile OTP (demonstration code on screen; no SMS vendor).</li>
      <li>Role walls in the proxy (<code>src/proxy.ts</code>) and again on every page.</li>
      <li>Today for telecalling seats: late first, add enquiry, inbound DID ring (modelled, not a live exchange).</li>
      <li>Shared new book until a connected Dial of 20 seconds or more.</li>
      <li>Log a call: Dial, purpose-based WhatsApp consent, disposition, department stage, hand on.</li>
      <li>Department ladders. Sales still uses Meeting. Service uses Appointment. Insurance uses Quoted. Service never books a test drive.</li>
      <li>Duplicate check while the phone number is typed.</li>
      <li>Escalation: TL → managers → GM → principal/admin. Notify only. Reassign is a superior’s decision.</li>
      <li>After sales meeting: test drive slot, stock book, discount, delivery. Only a sales manager (or GM/principal/admin) releases a booked VIN.</li>
      <li>Insurance: full catalogue. Top three suggested by dealer benefit. Margin hidden on the floor; visible to principal, admin, GM.</li>
      <li>GM and principal: all departments, cost per booking this month by source.</li>
      <li>Arthbot for principal, GM, dealer admin. Allowlisted reports. Anthropic only picks the report kind. CSV and PDF. Fail closed. Telecalling cannot open it.</li>
      <li>Accounts: incentive export only. No enquiry content.</li>
      <li>Advito platform: onboard a dealer; support enters one dealer at a time; onboarding never sees a dealer book.</li>
      <li>Points stay live. Connected scores require Dial in the last 15 minutes. Timer theatre does not score.</li>
      <li>Working hours gate clocks. Money is integer paise.</li>
      <li>Tenant isolation forced in Postgres. Four walls inside a dealer: dealer, branch, team, owner.</li>
    </ul>
    <h3>Screens in this build (routes)</h3>
    <table>
      <tr><th>Route</th><th>Job</th><th>Typical seats</th></tr>
      <tr><td><code>/</code></td><td>Public home</td><td>Unsigned</td></tr>
      <tr><td><code>/trust</code></td><td>How records are kept</td><td>Unsigned</td></tr>
      <tr><td><code>/w/login</code></td><td>Sign in</td><td>All</td></tr>
      <tr><td><code>/w/dayb</code></td><td>Today</td><td>tele, svctele, instele</td></tr>
      <tr><td><code>/w/new</code></td><td>Add enquiry</td><td>telecalling seats</td></tr>
      <tr><td><code>/w/tele</code></td><td>Log a call</td><td>telecalling + desk + ops</td></tr>
      <tr><td><code>/w/pipe</code></td><td>My enquiries / department book</td><td>Most dealer seats</td></tr>
      <tr><td><code>/w/svc</code></td><td>Service book</td><td>svc, svcmgr, svctele, owner, gm</td></tr>
      <tr><td><code>/w/ins</code></td><td>Insurance book</td><td>ins, instele, owner, gm</td></tr>
      <tr><td><code>/w/stock</code></td><td>Booked units</td><td>sales, salesmgr, tdcoord, owner, gm, admin</td></tr>
      <tr><td><code>/w/drive</code></td><td>Test drive slots</td><td>tdcoord, sales, salesmgr, owner, gm</td></tr>
      <tr><td><code>/w/search</code></td><td>Search inside walls</td><td>Most dealer seats</td></tr>
      <tr><td><code>/w/notif</code></td><td>Notifications</td><td>Dealer seats except accounts</td></tr>
      <tr><td><code>/w/perf</code></td><td>Performance</td><td>Most dealer seats</td></tr>
      <tr><td><code>/w/desk</code></td><td>Digital desk</td><td>mgr, ops</td></tr>
      <tr><td><code>/w/prin</code></td><td>This dealer</td><td>owner</td></tr>
      <tr><td><code>/w/gm</code></td><td>All departments</td><td>gm, owner</td></tr>
      <tr><td><code>/w/bot</code></td><td>Arthbot</td><td>owner, gm, admin</td></tr>
      <tr><td><code>/w/admin</code></td><td>Dealer setup</td><td>admin, owner</td></tr>
      <tr><td><code>/w/books</code></td><td>Accounts export</td><td>acct, owner, admin, gm</td></tr>
      <tr><td><code>/w/profile</code></td><td>My profile</td><td>Signed-in seats</td></tr>
      <tr><td><code>/w/denied</code></td><td>Forbidden</td><td>Wrong seat</td></tr>
      <tr><td><code>/a/dealers</code></td><td>Advito dealer list</td><td>platform</td></tr>
      <tr><td><code>/a/onboard</code></td><td>Provision a dealer</td><td>adv_admin, adv_onboard</td></tr>
      <tr><td><code>/api/health</code> and <code>/api/v1/*</code></td><td>JSON APIs</td><td>Session</td></tr>
    </table>

    <h3>Demonstration seats (password is on the login screen)</h3>
    <table>
      <tr><th>Username</th><th>Seat</th></tr>
      <tr><td>iyer / nair</td><td>Whitefield telecaller</td></tr>
      <tr><td>rao</td><td>Whitefield sales</td></tr>
      <tr><td>lal</td><td>Whitefield sales manager</td></tr>
      <tr><td>kumar</td><td>Whitefield GM</td></tr>
      <tr><td>shah</td><td>Whitefield dealer principal</td></tr>
      <tr><td>padma</td><td>Whitefield dealer admin</td></tr>
      <tr><td>books</td><td>Whitefield accounts</td></tr>
      <tr><td>devi / irfan / mehta</td><td>Service tele / advisor / manager</td></tr>
      <tr><td>iqbal / nanda</td><td>Insurance tele / executive</td></tr>
      <tr><td>ravi</td><td>Test drive coordinator</td></tr>
      <tr><td>gupta</td><td>Digital desk</td></tr>
      <tr><td>pinto / fernandes / kamath</td><td>Coastal Cars</td></tr>
      <tr><td>advito / support / onboard</td><td>Advito platform</td></tr>
    </table>

    <h2 id="design">3. Front-end design system</h2>
    <p>Canonical brand: THE ARTH BRAND SYSTEM v2.9. Tokens in <code>src/styles/arth-tokens.css</code>. No raw hex in components. Five button variants, none green. Semantic colour is Overdue and Settled only. Brass means money is at stake, never body text.</p>
    <p>
      <span class="swatch" style="background:#0F2A33"></span> Ink #0F2A33
      <span class="swatch" style="background:#B07F2C"></span> Brass #B07F2C
      <span class="swatch" style="background:#2e5c68"></span> Slate
      <span class="swatch" style="background:#b23b2e"></span> Overdue
      <span class="swatch" style="background:#27735a"></span> Settled
      <span class="swatch" style="background:#f1f4f4"></span> Paper
    </p>
    <ul class="tight">
      <li>Mark: lowercase arth hanging from a 2px Brass shirorekha.</li>
      <li>Type: Anek Latin (display), IBM Plex Sans (UI), IBM Plex Mono (ledger).</li>
      <li>Shell: Ink sidebar 240px on large screens; stacked Ink header on small screens.</li>
      <li>Primitives: shadcn/ui restyled to Arth tokens. Radius 3px / 5px.</li>
      <li>Confirmation in place, not a toast. Figures named with source and period.</li>
    </ul>
    <pre>{escape(excerpt("src/styles/arth-tokens.css", 45))}</pre>

    <h2 id="screens">4. Front-end screenshots (live product)</h2>
    <p>Captured 31 August 2026 from Chrome against the local server. Desktop 1440×900 unless noted. Full-page captures are used where the screen is taller than the viewport. These are the real UI, not generated mockups.</p>
    {''.join(shots)}

    <h2 id="access">5. Access law (UI and database)</h2>
    <p>A seat that cannot open a screen is stopped twice: <code>src/proxy.ts</code> (Node.js request proxy) and <code>canOpen</code> on the page. Database RLS still applies even if a page is wrong.</p>
    <h3>src/lib/access.ts</h3>
    <pre>{escape(access)}</pre>
    <h3>src/proxy.ts (start)</h3>
    <pre>{escape(proxy)}</pre>

    <h2 id="stack">6. Stack, isolation, APIs</h2>
    <table>
      <tr><th>Layer</th><th>Choice</th></tr>
      <tr><td>UI</td><td>Next.js 16 App Router, React 19, TypeScript, Tailwind 4, shadcn/ui</td></tr>
      <tr><td>Host</td><td>Node.js on Vercel (anonymous preview used Node proxy, not Edge middleware)</td></tr>
      <tr><td>Data</td><td>Postgres 16. App role has no BYPASSRLS. Session vars set inside a transaction.</td></tr>
      <tr><td>Driver</td><td><code>postgres</code> (postgres.js). SSL on Neon. max 1 connection on Vercel.</td></tr>
      <tr><td>Money</td><td>Integer paise. Never float for currency.</td></tr>
      <tr><td>AI</td><td>Optional Anthropic. Picks an allowlisted Arthbot report kind only. No model-generated SQL.</td></tr>
    </table>
    <h3>Session + tenant wall</h3>
    <pre>{escape(tenant)}</pre>
    <h3>Visibility walls (SQL)</h3>
    <pre>{escape(rls)}</pre>
    <h3>HTTP APIs</h3>
    <table>
      <tr><th>Method</th><th>Path</th><th>Job</th></tr>
      <tr><td>GET</td><td>/api/health</td><td>Process + database</td></tr>
      <tr><td>POST</td><td>/api/v1/auth/otp</td><td>Issue demonstration OTP</td></tr>
      <tr><td>POST</td><td>/api/v1/auth/phone</td><td>Sign in with OTP</td></tr>
      <tr><td>GET/POST</td><td>/api/v1/leads</td><td>Duplicate search / create enquiry</td></tr>
      <tr><td>GET</td><td>/api/v1/leads/[id]</td><td>One enquiry</td></tr>
      <tr><td>POST</td><td>/api/v1/dial</td><td>Connected Dial (anti-game for points)</td></tr>
      <tr><td>POST</td><td>/api/v1/qualify</td><td>Qualify / disposition</td></tr>
      <tr><td>POST</td><td>/api/v1/handoff</td><td>Hand on inside the department</td></tr>
      <tr><td>POST</td><td>/api/v1/claim</td><td>Claim from shared book</td></tr>
      <tr><td>POST</td><td>/api/v1/stage</td><td>Move stage on the department ladder</td></tr>
      <tr><td>POST</td><td>/api/v1/dispositions</td><td>Lost / callback / revisit</td></tr>
      <tr><td>POST</td><td>/api/v1/assign</td><td>Superior reassign</td></tr>
      <tr><td>POST</td><td>/api/v1/undo</td><td>Correcting entry, not delete</td></tr>
      <tr><td>GET</td><td>/api/v1/search</td><td>Search inside walls</td></tr>
      <tr><td>GET</td><td>/api/v1/pipeline</td><td>Pipeline ids</td></tr>
      <tr><td>GET</td><td>/api/v1/queue, /queue/next</td><td>Today / next due</td></tr>
      <tr><td>GET/POST</td><td>/api/v1/notifications</td><td>List / mark read</td></tr>
      <tr><td>GET</td><td>/api/v1/hours</td><td>Working hours</td></tr>
      <tr><td>POST</td><td>/api/v1/floor</td><td>Digital desk / Excel place</td></tr>
      <tr><td>POST</td><td>/api/v1/welcome</td><td>Daily welcome ack</td></tr>
      <tr><td>POST</td><td>/api/v1/whatsapp</td><td>Consented WhatsApp send (modelled)</td></tr>
      <tr><td>POST</td><td>/api/v1/ops</td><td>Stock, discount, delivery, escalation tick</td></tr>
      <tr><td>GET/POST</td><td>/api/v1/bot</td><td>Arthbot report pick / download</td></tr>
    </table>
    <h3>Conversion and escalation (application)</h3>
    <pre>{escape(conv)}</pre>
    <h3>Arthbot (fail closed)</h3>
    <pre>{escape(bot)}</pre>

    <h2 id="code">7. Where the rest of the code lives in this pack</h2>
    <p class="ok">Open <strong>CODE-ATLAS.md</strong> in this folder. It contains every TypeScript, SQL, CSS, and config file from <code>src/</code>, <code>scripts/</code>, and root config, inlined. Directors do not need a separate checkout to read the implementation.</p>
    <p>Also see <strong>FILE-MANIFEST.md</strong> for the path and byte size of each file.</p>
    <h3>Application map</h3>
    <table>
      <tr><th>Path</th><th>Owns</th></tr>
      <tr><td>src/app</td><td>Routes and Route Handlers</td></tr>
      <tr><td>src/components</td><td>Floor UI and shadcn primitives</td></tr>
      <tr><td>src/services</td><td>Telecalling, conversion, assignment, performance, Arthbot, platform</td></tr>
      <tr><td>src/domain</td><td>Ladders, clocks, walls, points</td></tr>
      <tr><td>src/db</td><td>postgres.js, withTenant, 33 migrations</td></tr>
      <tr><td>src/lib</td><td>Seats, access, cookies, format, auth</td></tr>
      <tr><td>src/proxy.ts</td><td>Request gate on Node.js</td></tr>
      <tr><td>scripts/prove*.ts</td><td>Isolation, walls, access, conversion proofs</td></tr>
    </table>
    <h3>Migrations (order)</h3>
    <p>0001 core schema through 0033 visible shared book. Conversion ops are 0031. RLS fallback 0032. Shared-book visibility 0033.</p>

    <h2 id="prove">8. What IT can prove</h2>
    <p><code>npm run prove</code> must print <code>PROVE_OK</code>. Checks: isolation, working hours, assignment, access, scope, search, ledger, disposition, queue, points, walls, desk, platform, performance, 29 Aug register, conversion.</p>
    <pre>{escape(excerpt("scripts/prove.ts", 40))}</pre>
    <div class="note">A twenty lakh book exists locally as Capacity Motors for load proofs. It is not copied to the small hosted database used for team URL testing.</div>

    <h2 id="out">9. Named, not built</h2>
    <ul class="tight">
      <li>Live PSTN, call recording, AI score from transcripts. Vendor at launch. Inbound DID is modelled.</li>
      <li>Native mobile app. Next phase.</li>
      <li>Exception Cockpit, full HR/payroll, used-car evaluator, workshop bays.</li>
      <li>Production SSO. Demonstration uses password <code>arth-demo</code> on every seat (stated on the login screenshot).</li>
    </ul>
    <div class="warn">The 80-screen HTML prototype in the original books is the long-range visual reference. This pack shows the <em>running</em> conversion floor, which is a complete slice, not all 80 screens.</div>

    <h2 id="share">10. How to share this pack</h2>
    <ol>
      <li>Zip the folder <code>docs/directors-review/</code> (HTML + screens + CODE-ATLAS.md + FILE-MANIFEST.md).</li>
      <li>Send the zip. Recipients open <code>ARTH-DIRECTOR-REVIEW.html</code> in a browser. Images load from <code>screens/</code> next to the HTML. Keep that relative folder.</li>
      <li>IT reads <code>CODE-ATLAS.md</code> in any text editor or GitHub.</li>
      <li>Do not put database URLs, Neon passwords, or Vercel tokens in this pack. None are included.</li>
    </ol>
    <p>To regenerate screenshots: run the app on port 43127, then <code>node capture-screens.mjs</code> from this folder with playwright-core and Chrome.</p>
    <p>Governing product law outside this zip still lives in the repo: <code>00-START-HERE.md</code>, <code>docs/books/VISIBILITY-WALLS.md</code>, Brand System v2.9. Those files are also inlined at the top of CODE-ATLAS where they are markdown in the listed roots; the full books folder remains in <code>docs/books/</code> in the repository.</p>
  </main>
</body>
</html>
"""


def main() -> None:
    files = iter_files()
    (PACK / "CODE-ATLAS.md").write_text(build_atlas(files), encoding="utf-8")
    (PACK / "FILE-MANIFEST.md").write_text(build_manifest(files), encoding="utf-8")
    (PACK / "ARTH-DIRECTOR-REVIEW.html").write_text(html_page(), encoding="utf-8")
    print(f"files={len(files)}")
    print(f"atlas={(PACK / 'CODE-ATLAS.md').stat().st_size}")
    print(f"html={(PACK / 'ARTH-DIRECTOR-REVIEW.html').stat().st_size}")


if __name__ == "__main__":
    main()
