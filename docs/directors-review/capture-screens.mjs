/**
 * Capture live Arth screens for the director review pack.
 * Requires the app at http://127.0.0.1:43127 and google-chrome.
 */
import { chromium } from "playwright-core";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = dirname(fileURLToPath(import.meta.url));
const OUT = join(ROOT, "screens");
const BASE = process.env.ARTH_SHOT_URL ?? "http://127.0.0.1:43127";
const WF = "11111111-1111-1111-1111-111111111111";
const CT = "22222222-2222-2222-2222-222222222222";

mkdirSync(OUT, { recursive: true });

const seats = {
  iyer: { seat: "iyer", role: "tele", kind: "dealer", tenant: WF },
  rao: { seat: "rao", role: "sales", kind: "dealer", tenant: WF },
  gupta: { seat: "gupta", role: "mgr", kind: "dealer", tenant: WF },
  shah: { seat: "shah", role: "owner", kind: "dealer", tenant: WF },
  kumar: { seat: "kumar", role: "gm", kind: "dealer", tenant: WF },
  lal: { seat: "lal", role: "salesmgr", kind: "dealer", tenant: WF },
  irfan: { seat: "irfan", role: "svc", kind: "dealer", tenant: WF },
  nanda: { seat: "nanda", role: "ins", kind: "dealer", tenant: WF },
  ravi: { seat: "ravi", role: "tdcoord", kind: "dealer", tenant: WF },
  padma: { seat: "padma", role: "admin", kind: "dealer", tenant: WF },
  books: { seat: "books", role: "acct", kind: "dealer", tenant: WF },
  pinto: { seat: "pinto", role: "tele", kind: "dealer", tenant: CT },
  advito: { seat: "advito", role: "adv_admin", kind: "platform", tenant: "" },
  onboard: { seat: "onboard", role: "adv_onboard", kind: "platform", tenant: "" },
};

async function asSeat(context, key) {
  const s = seats[key];
  await context.clearCookies();
  const cookies = [
    { name: "arth_seat", value: s.seat, url: BASE, httpOnly: true, sameSite: "Lax" },
    { name: "arth_role", value: s.role, url: BASE, httpOnly: true, sameSite: "Lax" },
    { name: "arth_kind", value: s.kind, url: BASE, httpOnly: true, sameSite: "Lax" },
    { name: "arth_tenant", value: s.tenant, url: BASE, httpOnly: true, sameSite: "Lax" },
  ];
  await context.addCookies(cookies);
}

async function shot(page, name, { fullPage = false } = {}) {
  await page.waitForTimeout(450);
  const path = join(OUT, `${name}.png`);
  await page.screenshot({ path, fullPage, type: "png" });
  console.log("wrote", name);
}

const shots = [
  { pub: true, path: "/", file: "00-home", w: 1440, h: 900 },
  { pub: true, path: "/w/login", file: "01-login", w: 1440, h: 900, fullPage: true },
  { pub: true, path: "/w/login", file: "01-login-mobile", w: 390, h: 844, fullPage: true },
  { pub: true, path: "/trust", file: "02-trust", w: 1440, h: 900, fullPage: true },
  { pub: true, path: "/enter", file: "03-enter", w: 1440, h: 900 },
  { seat: "iyer", path: "/w/dayb", file: "10-iyer-today", w: 1440, h: 900, fullPage: true },
  { seat: "iyer", path: "/w/dayb", file: "10-iyer-today-mobile", w: 390, h: 844 },
  { seat: "iyer", path: "/w/tele", file: "11-iyer-log-call", w: 1440, h: 900, fullPage: true },
  { seat: "iyer", path: "/w/pipe", file: "12-iyer-my-enquiries", w: 1440, h: 900, fullPage: true },
  { seat: "iyer", path: "/w/search", file: "13-iyer-search", w: 1440, h: 900 },
  { seat: "iyer", path: "/w/new", file: "14-iyer-add-enquiry", w: 1440, h: 900, fullPage: true },
  { seat: "iyer", path: "/w/notif", file: "15-iyer-notifications", w: 1440, h: 900 },
  { seat: "iyer", path: "/w/perf", file: "16-iyer-performance", w: 1440, h: 900, fullPage: true },
  { seat: "iyer", path: "/w/profile", file: "17-iyer-profile", w: 1440, h: 900 },
  { seat: "iyer", path: "/w/bot", file: "18-iyer-arthbot-denied", w: 1440, h: 900 },
  { seat: "rao", path: "/w/pipe", file: "20-rao-sales-pipeline", w: 1440, h: 900, fullPage: true },
  { seat: "rao", path: "/w/dayb", file: "21-rao-today-refused", w: 1440, h: 900 },
  { seat: "rao", path: "/w/stock", file: "22-rao-stock", w: 1440, h: 900 },
  { seat: "gupta", path: "/w/desk", file: "30-gupta-digital-desk", w: 1440, h: 900, fullPage: true },
  { seat: "shah", path: "/w/prin", file: "40-shah-principal", w: 1440, h: 900, fullPage: true },
  { seat: "shah", path: "/w/bot", file: "41-shah-arthbot", w: 1440, h: 900, fullPage: true },
  { seat: "shah", path: "/w/gm", file: "42-shah-all-departments", w: 1440, h: 900, fullPage: true },
  { seat: "kumar", path: "/w/gm", file: "50-kumar-gm", w: 1440, h: 900, fullPage: true },
  { seat: "lal", path: "/w/stock", file: "60-lal-stock-release", w: 1440, h: 900, fullPage: true },
  { seat: "lal", path: "/w/pipe", file: "61-lal-sales-manager", w: 1440, h: 900 },
  { seat: "irfan", path: "/w/svc", file: "70-irfan-service", w: 1440, h: 900, fullPage: true },
  { seat: "nanda", path: "/w/ins", file: "80-nanda-insurance", w: 1440, h: 900, fullPage: true },
  { seat: "ravi", path: "/w/drive", file: "90-ravi-test-drives", w: 1440, h: 900, fullPage: true },
  { seat: "padma", path: "/w/admin", file: "a0-padma-dealer-setup", w: 1440, h: 900, fullPage: true },
  { seat: "books", path: "/w/books", file: "a1-books-accounts", w: 1440, h: 900, fullPage: true },
  { seat: "pinto", path: "/w/dayb", file: "b0-pinto-coastal-today", w: 1440, h: 900, fullPage: true },
  { seat: "advito", path: "/a/dealers", file: "c0-advito-dealers", w: 1440, h: 900, fullPage: true },
  { seat: "onboard", path: "/a/onboard", file: "c1-onboard-provision", w: 1440, h: 900, fullPage: true },
];

const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH ?? "/usr/local/bin/google-chrome",
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});
const context = await browser.newContext({ deviceScaleFactor: 1 });
const page = await context.newPage();

for (const item of shots) {
  await page.setViewportSize({ width: item.w, height: item.h });
  if (item.pub) {
    await context.clearCookies();
  } else {
    await asSeat(context, item.seat);
  }
  const res = await page.goto(`${BASE}${item.path}`, { waitUntil: "networkidle", timeout: 60000 });
  const status = res?.status() ?? 0;
  if (status >= 500) {
    console.error("FAIL", item.file, status);
  }
  await shot(page, item.file, { fullPage: Boolean(item.fullPage) });
}

await browser.close();
console.log("CAPTURE_OK");
