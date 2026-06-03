import { COLOR_LEVEL_VALUES, type ColorLevel } from "../colors.js";
import { TERMINAL_WIDTH_MODE_VALUES, type StatuslineSettings } from "../types.js";
import { cycle } from "./helpers.js";
import { COLOR_LEVEL_LABELS, WIDTH_MODE_LABELS } from "./model.js";

export const TERMINAL_MENU_ACTIONS = ["width-mode", "color-level"] as const;

type TerminalMenuAction = (typeof TERMINAL_MENU_ACTIONS)[number];

export const TERMINAL_MENU_HINT = "↑/↓ option • ←/→ change • esc back";

export function terminalMenuFields(config: StatuslineSettings): string[] {
  return [
    `Terminal Width: ${WIDTH_MODE_LABELS[config.terminal.widthMode]}`,
    `Color Level: ${COLOR_LEVEL_LABELS[config.terminal.colorLevel]}`,
  ];
}

export function terminalMenuAction(index: number): TerminalMenuAction {
  return TERMINAL_MENU_ACTIONS[index] ?? "color-level";
}

export function nextTerminalWidthMode(
  config: StatuslineSettings,
  delta: number,
): StatuslineSettings["terminal"]["widthMode"] {
  return cycle(TERMINAL_WIDTH_MODE_VALUES, config.terminal.widthMode, delta);
}

export function nextTerminalColorLevel(config: StatuslineSettings, delta: number): ColorLevel {
  return cycle(COLOR_LEVEL_VALUES, config.terminal.colorLevel, delta);
}
