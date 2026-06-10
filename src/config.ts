import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

import { getAgentDir } from "@earendil-works/pi-coding-agent";

import type { ColorLevel } from "./colors.js";
import { COLOR_LEVEL_VALUES, normalizeColor } from "./colors.js";
import {
  cloneExtensionStatusRow,
  DEFAULT_EXTENSION_STATUS_ROW,
  normalizeExtensionStatusRow,
} from "./extension-statuses.js";
import {
  PRESET_DEFINITIONS,
  type Preset,
  type PresetDefinition,
  type PresetWidget,
} from "./presets.js";
import { SEPARATOR_VALUES, type SeparatorStyle } from "./separators.js";
import type {
  IconMode,
  StatuslineConfig,
  StatuslineSettings,
  TerminalOptions,
  TerminalWidthMode,
  WidgetEntry,
} from "./types.js";
import { ICON_MODE_VALUES, isRecord, TERMINAL_WIDTH_MODE_VALUES } from "./types.js";
import { registry, type WidgetType } from "./widgets/registry.js";

export const STATUS_KEY = "pi-footer";

const CONFIG_ENV = "PI_FOOTER_CONFIG";
const DEFAULT_CONFIG_PATH = join(getAgentDir(), "extensions", "pi-footer.json");
const SEPARATORS = new Set<SeparatorStyle>(SEPARATOR_VALUES);

const DEFAULT_TERMINAL_OPTIONS: TerminalOptions = {
  widthMode: "full",
  colorLevel: "ansi256",
};

export const DEFAULT_CONFIG: StatuslineConfig = {
  version: 1,
  enabled: true,
  preset: "default",
  lines: linesForPreset("default"),
  separator: "dot",
  separatorFg: "default",
  separatorBg: "default",
  iconMode: "emoji",
  minimalist: false,
  terminal: DEFAULT_TERMINAL_OPTIONS,
  extensionStatusRow: DEFAULT_EXTENSION_STATUS_ROW,
};

export function getConfigPath(): string {
  return process.env[CONFIG_ENV] ?? DEFAULT_CONFIG_PATH;
}

function linesForPreset(preset: Preset): WidgetEntry[][] {
  return PRESET_DEFINITIONS[preset].lines.map((line) => widgetsFromPresetLine(line));
}

export function configWithPreset(config: StatuslineConfig, preset: Preset): StatuslineConfig {
  const definition: PresetDefinition = PRESET_DEFINITIONS[preset];
  return {
    ...config,
    preset,
    lines: linesForPreset(preset),
    separator: definition.separator ?? config.separator,
    iconMode: definition.iconMode ?? config.iconMode,
    terminal: { ...config.terminal, ...definition.terminal },
  };
}

function widgetsFromPresetLine(line: readonly PresetWidget[]): WidgetEntry[] {
  return line.map((widget) => registry.createEntry(widget.type, widget.options));
}

export function normalizeConfig(input: unknown): StatuslineConfig {
  if (!isRecord(input)) return cloneConfig(DEFAULT_CONFIG);

  const preset = isPreset(input.preset) ? input.preset : DEFAULT_CONFIG.preset;
  const lines = normalizeLines(input.lines, preset);

  return {
    version: 1,
    enabled: typeof input.enabled === "boolean" ? input.enabled : DEFAULT_CONFIG.enabled,
    preset,
    lines,
    separator: isSeparatorStyle(input.separator)
      ? input.separator
      : (PRESET_DEFINITIONS[preset].separator ?? DEFAULT_CONFIG.separator),
    separatorFg: normalizeColor(input.separatorFg) ?? DEFAULT_CONFIG.separatorFg,
    separatorBg: normalizeColor(input.separatorBg) ?? DEFAULT_CONFIG.separatorBg,
    iconMode: isIconMode(input.iconMode) ? input.iconMode : DEFAULT_CONFIG.iconMode,
    minimalist:
      typeof input.minimalist === "boolean" ? input.minimalist : DEFAULT_CONFIG.minimalist,
    terminal: normalizeTerminalOptions(input.terminal, PRESET_DEFINITIONS[preset].terminal),
    extensionStatusRow: normalizeExtensionStatusRow(input.extensionStatusRow),
  };
}

export function cloneSettings(settings: StatuslineSettings): StatuslineSettings {
  return {
    ...settings,
    terminal: { ...settings.terminal },
    extensionStatusRow: cloneExtensionStatusRow(settings.extensionStatusRow),
  };
}

export function cloneConfig(config: StatuslineConfig): StatuslineConfig {
  return {
    ...cloneSettings(config),
    lines: config.lines.map((line) =>
      line.map((widget) => ({ ...widget, options: { ...widget.options } })),
    ),
  };
}

export async function loadConfig(path = getConfigPath()): Promise<StatuslineConfig> {
  try {
    const raw = await readFile(path, "utf8");
    return normalizeConfig(JSON.parse(raw));
  } catch (error) {
    if (isNodeError(error) && error.code === "ENOENT") {
      return cloneConfig(DEFAULT_CONFIG);
    }
    throw error;
  }
}

export async function saveConfig(config: StatuslineConfig, path = getConfigPath()): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(normalizeConfig(config), null, 2)}\n`, "utf8");
}

function normalizeLines(linesValue: unknown, preset: Preset): WidgetEntry[][] {
  if (!Array.isArray(linesValue)) return linesForPreset(preset);
  return linesValue.map((line) => normalizeWidgets(line));
}

function normalizeWidgets(value: unknown): WidgetEntry[] {
  if (!Array.isArray(value)) return [];

  const widgets: WidgetEntry[] = [];
  for (const item of value) {
    if (!isRecord(item) || typeof item.type !== "string") continue;
    const spec = registry.maybeSpec(item.type);
    if (!spec) continue;
    widgets.push({
      id:
        typeof item.id === "string" && item.id.length > 0
          ? item.id
          : registry.createEntry(spec.type as WidgetType).id,
      type: spec.type as WidgetType,
      enabled: typeof item.enabled === "boolean" ? item.enabled : true,
      options: registry.normalizeOptions(
        spec.type as WidgetType,
        isRecord(item.options) ? item.options : {},
      ),
    });
  }

  return widgets;
}

function normalizeTerminalOptions(
  value: unknown,
  defaults: Partial<TerminalOptions> = {},
): TerminalOptions {
  const base = { ...DEFAULT_TERMINAL_OPTIONS, ...defaults };
  if (!isRecord(value)) return base;
  return {
    widthMode:
      typeof value.widthMode === "string" &&
      TERMINAL_WIDTH_MODE_VALUES.includes(value.widthMode as TerminalWidthMode)
        ? (value.widthMode as TerminalWidthMode)
        : base.widthMode,
    colorLevel:
      typeof value.colorLevel === "string" &&
      COLOR_LEVEL_VALUES.includes(value.colorLevel as ColorLevel)
        ? (value.colorLevel as ColorLevel)
        : base.colorLevel,
  };
}

export function isPreset(value: unknown): value is Preset {
  return typeof value === "string" && Object.hasOwn(PRESET_DEFINITIONS, value);
}

function isSeparatorStyle(value: unknown): value is SeparatorStyle {
  return typeof value === "string" && SEPARATORS.has(value as SeparatorStyle);
}

function isIconMode(value: unknown): value is IconMode {
  return typeof value === "string" && ICON_MODE_VALUES.includes(value as IconMode);
}

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && "code" in error;
}
