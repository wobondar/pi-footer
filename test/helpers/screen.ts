import { DEFAULT_CONFIG, cloneConfig } from "../../src/config.js";
import type { GetExtensionStatuses } from "../../src/extension-statuses.js";
import type { StatuslineConfig } from "../../src/types.js";
import type { ScreenContext } from "../../src/ui/screen-context.js";
import { ScreenRender } from "../../src/ui/screen-render.js";
import { createScreenState, type ScreenState } from "../../src/ui/screen-state.js";
import { WidgetStore } from "../../src/widgets/store.js";
import type { UiTheme } from "../../src/ui/theme.js";

export const testTheme: UiTheme = {
  accent: (text) => text,
  dim: (text) => `<dim>${text}</dim>`,
  muted: (text) => text,
  success: (text) => `<success>${text}</success>`,
  warning: (text) => `<warning>${text}</warning>`,
  error: (text) => text,
  bold: (text) => text,
  selected: (text) => `<selected>${text}</selected>`,
  border: (text) => text,
  previewTitle: (text) => text,
  configStateLabel: (_status, label) => label,
};

export function createTestScreenState(config: StatuslineConfig = DEFAULT_CONFIG): ScreenState {
  return createScreenState(WidgetStore.fromConfig(cloneConfig(config)));
}

export interface ScreenHarness {
  ctx: ScreenContext;
  render: ScreenRender;
  shown: string[];
  changes: number;
  saves: boolean[];
  exits: number;
}

export function createScreenHarness(
  options: {
    config?: StatuslineConfig;
    getExtensionStatuses?: GetExtensionStatuses;
    visibleRows?: number;
  } = {},
): ScreenHarness {
  const shown: string[] = [];
  const saves: boolean[] = [];
  const state = createTestScreenState(options.config ?? DEFAULT_CONFIG);
  const ctx: ScreenContext = {
    state,
    theme: testTheme,
    getExtensionStatuses: options.getExtensionStatuses ?? (() => new Map()),
    currentLine: () => state.store.lines[state.selectedLine] ?? state.store.lines[0] ?? [],
    currentWidget: () => ctx.currentLine()[state.selectedWidget],
    visibleRowCount: () => options.visibleRows ?? 5,
    show(view) {
      shown.push(view);
      state.view = view;
    },
    emitChange() {
      harness.changes += 1;
    },
    save(exitAfterSave) {
      saves.push(exitAfterSave);
    },
    exitWithoutSaving() {
      harness.exits += 1;
    },
  };
  const harness: ScreenHarness = {
    ctx,
    render: new ScreenRender(testTheme),
    shown,
    changes: 0,
    saves,
    exits: 0,
  };
  return harness;
}
