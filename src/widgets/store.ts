import { cloneSettings } from "../config.js";
import type { StatuslineConfig, StatuslineSettings } from "../types.js";
import { registry } from "./registry.js";
import type { Widget } from "./types.js";

export class WidgetStore {
  constructor(
    public settings: StatuslineSettings,
    public lines: Widget[][],
  ) {}

  static fromConfig(config: StatuslineConfig): WidgetStore {
    const { lines, ...settings } = config;
    return new WidgetStore(
      cloneSettings(settings),
      lines.map((line) => line.map((entry) => registry.hydrateWidget(entry))),
    );
  }

  toConfig(): StatuslineConfig {
    return {
      ...cloneSettings(this.settings),
      lines: this.lines.map((line) => line.map((widget) => widget.toEntry())),
    };
  }
}
