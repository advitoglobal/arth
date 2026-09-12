/**
 * 403 copy keeps the Pass 2 sentence exact and names who can grant access.
 */
import { ACCESS_SCREENS } from "../src/lib/access";
import { screenFromPath } from "../src/lib/seats";
import { FORBIDDEN_LINE, REFUSAL_NEXT, refusalNext } from "../src/domain/refusal";

function main() {
  if (FORBIDDEN_LINE !== "This screen is for another seat.") {
    throw new Error("Pass 2 §4.3 forbids rewriting the 403 sentence");
  }
  if (FORBIDDEN_LINE.includes("—")) {
    throw new Error("Product copy must not use an em dash");
  }

  const screens = Object.keys(ACCESS_SCREENS);
  for (const key of screens) {
    if (!REFUSAL_NEXT[key]) throw new Error(`Access screen ${key} has no refusal next line`);
  }
  for (const key of Object.keys(REFUSAL_NEXT)) {
    if (!ACCESS_SCREENS[key]) throw new Error(`Refusal next ${key} has no access screen`);
    if (REFUSAL_NEXT[key].includes("—")) throw new Error(`Em dash in refusal next for ${key}`);
  }

  const dayb = refusalNext("dayb");
  if (!dayb.toLowerCase().includes("telecaller")) throw new Error("Today 403 must name telecallers");
  if (!dayb.toLowerCase().includes("digital desk")) throw new Error("Today 403 must name the digital desk");

  if (screenFromPath("/w/loop") !== "loop") throw new Error("loop must map from /w/loop");
  if (screenFromPath("/w/msg") !== "msg") throw new Error("msg must map from /w/msg");
  if (screenFromPath("/w/dayb") !== "dayb") throw new Error("dayb must map from /w/dayb");
  if (screenFromPath("/a/dealers/111") !== "adealers") throw new Error("dealer id path must map to adealers");

  console.log("REFUSAL_OK required sentence, grantor copy, loop and msg in the path map");
}

main();
