import { cloneSettings } from "../config.ts";
import type { StatuslineConfig, StatuslineSettings } from "../types.ts";
import { registry } from "./registry.ts";
import type { Widget } from "./types.ts";

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
