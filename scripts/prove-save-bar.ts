/**
 * Every form ends in a save bar. The unsaved bar appears on first edit and
 * clears on save or discard.
 */
import { SAVE_BAR, rendererKeys, saveBarLabel } from "../src/domain/save-bar";

function main() {
  const keys = rendererKeys();
  for (const row of SAVE_BAR) {
    if (!keys.includes(row.key)) throw new Error(`Save bar ${row.key} has no renderer`);
    if (saveBarLabel(row.key) !== row.label) throw new Error(`Label drift for ${row.key}`);
  }
  if (saveBarLabel("unsaved") !== "You have unsaved changes on this screen.") {
    throw new Error("Unsaved copy must match the platform wording");
  }
  if (saveBarLabel("unsaved").includes("—")) {
    throw new Error("Product copy must not use an em dash");
  }
  console.log("SAVE_BAR_OK renderer, unsaved copy, no em dash");
}

main();
