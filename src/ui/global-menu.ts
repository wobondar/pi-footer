import type { ColorName } from "../colors.js";
import {
  ansi256Digits,
  appendAnsi256Digit,
  colorDisplayName,
  deleteAnsi256Digit,
  STANDARD_COLORS,
} from "../colors.js";
import { cloneConfig, configWithPreset, DEFAULT_CONFIG } from "../config.js";
import { PRESET_DEFINITIONS, type Preset } from "../presets.js";
import { SEPARATOR_VALUES } from "../separators.js";
import type { StatuslineConfig, StatuslineSettings } from "../types.js";
import { ICON_MODE_VALUES } from "../types.js";
import { adjustAnsi, cycle } from "./helpers.js";
import { ICON_MODE_LABELS } from "./model.js";

export const GLOBAL_MENU_ACTIONS = [
  "toggle-enabled",
  "preset",
  "separator",
  "separator-fg",
  "separator-bg",
  "separator-fg-ansi",
  "separator-bg-ansi",
  "icon-mode",
  "minimalist",
  "reset",
] as const;

type GlobalMenuAction = (typeof GLOBAL_MENU_ACTIONS)[number];

export const GLOBAL_MENU_HINT =
  "↑/↓ option • ←/→ or enter change • type digits for ANSI256 • backspace delete • esc back";

export function globalMenuFields(config: StatuslineSettings): string[] {
  return [
    `Enabled: ${config.enabled ? "on" : "off"}`,
    `Preset: ${config.preset}`,
    `Separator: ${config.separator}`,
    `Separator foreground: ${colorDisplayName(config.separatorFg)}`,
    `Separator background: ${colorDisplayName(config.separatorBg)}`,
    `Custom ANSI256 separator foreground: ${ansi256Digits(config.separatorFg)}`,
    `Custom ANSI256 separator background: ${ansi256Digits(config.separatorBg)}`,
    `Icons: ${ICON_MODE_LABELS[config.iconMode]}`,
    `Minimalist mode: ${config.minimalist ? "on" : "off"}`,
    "Reset to defaults",
  ];
}

export function globalMenuAction(index: number): GlobalMenuAction {
  return GLOBAL_MENU_ACTIONS[index] ?? "reset";
}

export function applyGlobalMenuAction(
  config: StatuslineConfig,
  action: GlobalMenuAction,
  delta: number,
): StatuslineConfig {
  if (action === "preset")
    return configWithPreset(
      config,
      cycle(Object.keys(PRESET_DEFINITIONS) as Preset[], config.preset, delta),
    );
  if (action === "reset") return cloneConfig(DEFAULT_CONFIG);

  const next = { ...config };
  applyGlobalSettingsAction(next, action, delta);
  return next;
}

export function applyGlobalSettingsAction(
  settings: StatuslineSettings,
  action: GlobalMenuAction,
  delta: number,
): boolean {
  if (action === "toggle-enabled") settings.enabled = !settings.enabled;
  else if (action === "separator")
    settings.separator = cycle(SEPARATOR_VALUES, settings.separator, delta);
  else if (action === "separator-fg")
    settings.separatorFg = cycleStandardColor(settings.separatorFg, delta);
  else if (action === "separator-bg")
    settings.separatorBg = cycleStandardColor(settings.separatorBg, delta);
  else if (action === "separator-fg-ansi")
    settings.separatorFg = adjustAnsi(settings.separatorFg, delta);
  else if (action === "separator-bg-ansi")
    settings.separatorBg = adjustAnsi(settings.separatorBg, delta);
  else if (action === "icon-mode")
    settings.iconMode = cycle(ICON_MODE_VALUES, settings.iconMode, delta);
  else if (action === "minimalist") settings.minimalist = !settings.minimalist;
  else return false;
  return true;
}

export function applyGlobalSettingsTextInput(
  settings: StatuslineSettings,
  action: GlobalMenuAction,
  data: string,
): boolean {
  if (!/^\d$/.test(data)) return false;
  if (action === "separator-fg-ansi")
    settings.separatorFg = appendAnsi256Digit(settings.separatorFg, data);
  else if (action === "separator-bg-ansi")
    settings.separatorBg = appendAnsi256Digit(settings.separatorBg, data);
  else return false;
  return true;
}

export function applyGlobalSettingsBackspace(
  settings: StatuslineSettings,
  action: GlobalMenuAction,
): boolean {
  if (action === "separator-fg-ansi")
    settings.separatorFg = deleteAnsi256Digit(settings.separatorFg);
  else if (action === "separator-bg-ansi")
    settings.separatorBg = deleteAnsi256Digit(settings.separatorBg);
  else return false;
  return true;
}

function cycleStandardColor(current: ColorName, delta: number): ColorName {
  return cycle(
    STANDARD_COLORS.map((color) => color.value),
    current,
    delta,
  );
}
