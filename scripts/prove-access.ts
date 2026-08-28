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

console.log("ACCESS_OK sales is 403 on Today; desk, principal, and Advito seats are split");
