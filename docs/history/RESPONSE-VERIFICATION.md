# RESPONSE — VERIFICATION

**From:** Director, Product Engineering
**To:** IT Director, Arth · cc Prem Kumar · Brand · 18 August 2026
**Re:** your verification of 18 August
**Returning:** `--brass-text` withdrawn, the two surfaces named, and one line about the method

---

## §1 `--brass-text` WITHDRAWN

`--arth-brass-pill: #7A5716` exists, it is in the palette, and it was added in v2.2 for exactly this pairing. **I did not merely miss it. I mapped `#7A5716` onto my own token and overwrote the approved answer with an invention.** That is worse than the button, because the button was a colour the Book had never contemplated and this was a colour the Book had already ruled on.

Done in the file: `--brass-pill: #7A5716`, all usages moved, mine removed. Measured 5.35:1 on brass-wash, as recorded.

**And I am not going to argue that 6.42 beats 5.35.** Both clear the floor. The approved one clears it and is approved, and that is the whole of it. *Reaching past an existing answer for a better-measuring invention is how a palette of twenty-one becomes a palette of thirty* — that is the sentence to keep.

## §2 YOUR §3 IS THE CORRECTION THAT MATTERS

> *The Book has answers you have not met yet, and they are not discoverable by measurement.*

That is the accurate diagnosis and it is a different failure from the one I had been fixing. The fourth label solved *asserting without checking*. **This is checking with the wrong instrument** — measuring a pairing, finding it fails, and proposing a token, when the Book had already found the same failure and named the replacement.

**The rule I am adopting: where a measurement says something is missing, read the palette file before proposing anything.** A contrast calculator can tell me a pairing fails. It cannot tell me the failure is already recorded and already answered.

Three findings against me now — a control that did not exist, a colour rule contradicting the Book, and a token that already existed. **All three were things I could have looked up in under a minute and did not.**

## §3 THE TWO SURFACES, NAMED

Both are surfaces, never text, so a contrast floor is the wrong test. Measured against white, which is the only thing that sits on them:

| Token | Value | Serves | White text on it |
|---|---|---|---|
| `--ink-2` | `#16333D` | The **selected navigation row** on the Ink sidebar. The one lift that distinguishes the current screen | **13.33:1** |
| `--ink-3` | `#1B3D48` | The **role-switcher panel** in the sidebar head, and the **hairline** above the sidebar foot | **11.62:1** |

Both are in the file with those notes in the declaration, so whoever reads the stylesheet next sees the intent rather than inferring it.

## §4 FILE STATUS

- **27 distinct values, 27 declared, zero strays** — and every hex in the file now sits inside `:root`. My previous version left one raw value inside a comment, which a lint scanning for hexes would have flagged. Removed.
- One comment claimed 12.4:1 where the measured value is **13.33:1**. Corrected. A wrong figure in a comment is how a wrong figure gets quoted later.
- Clean across 80 screens at four widths.

## §5 TO BRAND — EIGHT TOKENS AND ONE GAP

Three on-dark text values (11.91, 7.08, 5.36), two Ink surfaces (13.33 and 11.62 against white, non-text), two non-text Ink tones for divider and pressed state, and one border on the overdue wash.

**And the gap under all of it: the palette has no on-dark scale.** The Book was written for light surfaces and half this product is dark. Eight near-neighbours appeared because there was nothing to reach for. **That is the question worth answering, and the eight tokens are just what it looks like today.**

---

*Nothing outstanding from me. The work order names eight screens and I build to it.*

---

*Response to the verification, 18 August 2026. To be filed in `docs/decisions/`.*
