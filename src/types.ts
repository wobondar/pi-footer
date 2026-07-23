import type { ColorLevel, ColorName } from "./colors.js";
import type { ExtensionStatusRowConfig } from "./extension-statuses.js";
import type { Preset } from "./presets.js";
import type { SeparatorStyle } from "./separators.js";
import type { WidgetType } from "./widgets/registry.js";

export interface WidgetEntry {
  id: string;
  type: WidgetType;
  enabled: boolean;
  options: WidgetOptions;
}

type WidgetOptionValue = string | number | boolean | undefined;

// Shared style options. These are renderer-level options, not widget-specific metadata.
export interface WidgetStyle {
  fg?: ColorName;
  bg?: ColorName;
  bold?: boolean;
}

export interface WidgetOptions extends WidgetStyle {
  [key: string]: WidgetOptionValue;

  // Shared/base options. New widget-specific fields must be declared through widget metadata.
  icon?: string;
  raw?: boolean;
  hideWhenEmpty?: boolean;
  hideWhenZero?: boolean;
  text?: string;
}

export const TERMINAL_WIDTH_MODE_VALUES = ["full", "full-minus-40"] as const;
export type TerminalWidthMode = (typeof TERMINAL_WIDTH_MODE_VALUES)[number];

export interface TerminalOptions {
  widthMode: TerminalWidthMode;
  colorLevel: ColorLevel;
}

export interface StatuslineSettings {
  version: 1;
  enabled: boolean;
  preset: Preset;
  separator: SeparatorStyle;
  separatorFg: ColorName;
  separatorBg: ColorName;
  iconMode: IconMode;
  minimalist: boolean;
  terminal: TerminalOptions;
  extensionStatusRow: ExtensionStatusRowConfig;
}

export interface StatuslineConfig extends StatuslineSettings {
  lines: WidgetEntry[][];
}

export const ICON_MODE_VALUES = ["emoji", "nerd", "text"] as const;

export type IconMode = (typeof ICON_MODE_VALUES)[number];

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export interface SessionMetrics {
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheWriteTokens: number;
  totalTokens: number;
  costUsd: number;
  userMessages: number;
  assistantMessages: number;
  toolResults: number;
  firstTimestampMs: number | undefined;
  lastTimestampMs: number | undefined;
  compactions: number;
}

export interface TurnMetrics {
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheWriteTokens: number;
  totalTokens: number;
  costUsd: number;
}

export interface GitInfo {
  branch: string | null;
  sha: string | null;
  root: string | null;
  staged: number;
  unstaged: number;
  untracked: number;
  insertions: number;
  deletions: number;
  ahead: number;
  behind: number;
  remote: string | null;
  isRepo: boolean;
}

export interface StatuslineData {
  model: string | undefined;
  provider: string | undefined;
  sessionName: string | undefined;
  sessionId: string | undefined;
  thinkingLevel: string | undefined;
  textVerbosity: string | undefined;
  git: GitInfo;
  cwd: string;
  activeToolCount: number;
  usingSubscription: boolean;
  contextTokens: number | undefined;
  contextMaxTokens: number | undefined;
  metrics: SessionMetrics;
  turnMetrics: TurnMetrics;
  eventWidgets: ReadonlyMap<string, string>;
}
