import type { GetExtensionStatuses } from "../extension-statuses.ts";
import type { Widget } from "../widgets/types.ts";
import type { ScreenView } from "./model.ts";
import type { ScreenState } from "./screen-state.ts";
import type { UiTheme } from "./theme.ts";

export interface ScreenContext {
  state: ScreenState;
  theme: UiTheme;
  getExtensionStatuses: GetExtensionStatuses;
  currentLine(): Widget[];
  currentWidget(): Widget | undefined;
  visibleRowCount(): number;
  show(view: ScreenView): void;
  emitChange(): void;
  save(exitAfterSave: boolean): void;
  exitWithoutSaving(): void;
}
