import { describe, expect, it } from "vitest";

import { DEFAULT_CONFIG } from "../src/config.ts";
import { createScreenState } from "../src/ui/screen-state.ts";
import { WidgetStore } from "../src/widgets/store.ts";

describe("ScreenState", () => {
  it("contains only shared screen state", () => {
    const store = WidgetStore.fromConfig(DEFAULT_CONFIG);
    const state = createScreenState(store);

    expect(state).toMatchObject({
      view: "main",
      viewBeforeConfirmExit: "main",
      selectedLine: 0,
      selectedWidget: 0,
    });
    expect(state.store).toBe(store);
    expect(state.store.toConfig()).toEqual(DEFAULT_CONFIG);
    expect("config" in state).toBe(false);
    expect("selectedMain" in state).toBe(false);
    expect("filter" in state).toBe(false);
  });
});
