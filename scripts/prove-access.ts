import { canOpen } from "../src/lib/access";

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}

assert(canOpen("tele", "dayb"), "telecaller opens Today");
assert(!canOpen("sales", "dayb"), "sales consultant is 403 on Today");
assert(!canOpen("mgr", "dayb"), "digital desk is 403 on Today");
assert(canOpen("mgr", "desk"), "digital desk opens The floor");
assert(!canOpen("tele", "desk"), "telecaller is 403 on The floor");
assert(canOpen("owner", "prin"), "dealer principal opens This dealer");
assert(!canOpen("mgr", "prin"), "digital desk is 403 on This dealer");
assert(!canOpen("owner", "dayb"), "dealer principal is 403 on Today");
assert(canOpen("adv_admin", "adealers"), "Advito admin opens dealers");
assert(canOpen("adv_admin", "aonboard"), "Advito admin onboards");
assert(canOpen("adv_support", "adealers"), "Advito support opens dealers");
assert(!canOpen("adv_support", "aonboard"), "Advito support cannot onboard");
assert(!canOpen("owner", "adealers"), "dealer principal cannot open Advito control");
assert(canOpen("sales", "pipe"), "sales consultant opens My enquiries");
assert(canOpen("tele", "search"), "telecaller opens Search this cycle");
assert(canOpen("tele", "perf"), "telecaller opens Performance");
assert(canOpen("sales", "perf"), "sales opens Performance");
assert(!canOpen("adv_admin", "perf"), "Advito admin does not open floor Performance");
assert(canOpen("svctele", "dayb"), "service telecaller opens Today");
assert(canOpen("admin", "admin"), "dealer admin opens Dealer setup");
assert(canOpen("acct", "books"), "accounts opens Accounts");
assert(!canOpen("acct", "rec"), "accounts cannot open an enquiry record");
assert(!canOpen("acct", "search"), "accounts cannot search the book");
assert(canOpen("adv_onboard", "aonboard"), "Advito onboarding can provision");
assert(canOpen("instele", "dayb"), "insurance telecaller opens Today");
assert(canOpen("gm", "gm"), "GM opens all departments");
assert(canOpen("owner", "gm"), "principal opens all departments");
assert(canOpen("svc", "svc"), "service advisor opens Service");
assert(!canOpen("svc", "dayb"), "service advisor is 403 on Today");
assert(!canOpen("svc", "drive"), "service advisor is 403 on test drives");
assert(canOpen("ins", "ins"), "insurance executive opens Insurance");
assert(canOpen("owner", "bot"), "principal opens Arthbot");
assert(!canOpen("tele", "bot"), "telecaller is 403 on Arthbot");
assert(canOpen("salesmgr", "stock"), "sales manager opens stock");
assert(canOpen("tdcoord", "drive"), "coordinator opens test drives");
assert(canOpen("tele", "msg"), "telecaller opens Messages");
assert(canOpen("tele", "loop"), "telecaller opens This week");
assert(canOpen("lead", "loop"), "team leader opens the coaching list");
assert(canOpen("mgr", "loop"), "digital desk opens the floor pattern");
assert(!canOpen("owner", "loop"), "principal is 403 on individual coaching notes");
assert(!canOpen("sales", "loop"), "sales consultant is 403 on the weekly loop");
assert(!canOpen("acct", "msg"), "accounts is 403 on Messages");
assert(!canOpen("svctele", "ins"), "service telecaller is 403 on Insurance");

console.log("ACCESS_OK sales is 403 on Today; desk, principal, and Advito seats are split");
