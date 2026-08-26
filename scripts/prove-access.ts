import { canOpen } from "../src/lib/access";

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}

assert(canOpen("tele", "dayb"), "telecaller opens Today");
assert(!canOpen("sales", "dayb"), "sales consultant is 403 on Today");
assert(!canOpen("sales", "tele"), "sales consultant is 403 on Log a call");
assert(!canOpen("sales", "profile"), "sales consultant is 403 on profile");
assert(canOpen("sales", "pipe"), "sales consultant opens My enquiries");
assert(canOpen("sales", "search"), "sales consultant opens Search");
assert(canOpen("tele", "search"), "telecaller opens Search this cycle");
assert(canOpen("tele", "new"), "telecaller files an enquiry");
assert(!canOpen("sales", "new"), "sales consultant is 403 on file enquiry");
assert(canOpen("owner", "search"), "dealer principal opens Search");
assert(canOpen("mgr", "search"), "branch manager opens Search");
assert(canOpen("lead", "search"), "team leader opens Search");
assert(canOpen("owner", "pipe"), "dealer principal opens My enquiries");
assert(!canOpen("owner", "dayb"), "dealer principal is 403 on Today");

console.log("ACCESS_OK sales is 403 on Today; Search is open to tele this cycle");
