import type { StatuslineConfig, StatuslineSettings } from "../types.js";
import { registry } from "./registry.js";
import type { Widget } from "./types.js";

export class WidgetStore {
  constructor(
    public settings: StatuslineSettings,
    public lines: Widget[][],
  ) {}

  static fromConfig(config: StatuslineConfig): WidgetStore {
    return new WidgetStore(
      cloneSettings(config),
      config.lines.map((line) => line.map((entry) => registry.hydrateWidget(entry))),
    );
  }

  toConfig(): StatuslineConfig {
    return {
      ...cloneSettings(this.settings),
      lines: this.lines.map((line) => line.map((widget) => widget.toEntry())),
    };
  }
}

function cloneSettings(settings: StatuslineSettings): StatuslineSettings {
  const { lines: _lines, ...settingsOnly } = settings as StatuslineSettings & {
    lines?: unknown;
  };

  return {
    ...settingsOnly,
    terminal: { ...settings.terminal },
    extensionStatusRow: {
      hiddenKeys: [...settings.extensionStatusRow.hiddenKeys],
      knownKeys: [...settings.extensionStatusRow.knownKeys],
    },
  };
}
