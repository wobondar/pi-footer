import type { WidgetStore } from "../widgets/store.js";
import type { ScreenView } from "./model.js";

export interface ScreenState {
  store: WidgetStore;
  view: ScreenView;
  viewBeforeConfirmExit: ScreenView;
  selectedLine: number;
  selectedWidget: number;
}

export function createScreenState(store: WidgetStore): ScreenState {
  return {
    store,
    view: "main",
    viewBeforeConfirmExit: "main",
    selectedLine: 0,
    selectedWidget: 0,
  };
}
