import type { Theme, ThemeColor } from "@earendil-works/pi-coding-agent";
import chalk from "chalk";

// Force color level to ensure consistent output in non-TTY environments (e.g. tests)
chalk.level = 2;

export const COLOR_LEVEL_VALUES = ["truecolor", "ansi256", "ansi16", "none"] as const;

export type ColorLevel = (typeof COLOR_LEVEL_VALUES)[number];
export type ColorName =
  | "default"
  | "black"
  | "red"
  | "green"
  | "yellow"
  | "blue"
  | "magenta"
  | "cyan"
  | "white"
  | "brightBlack"
  | "brightRed"
  | "brightGreen"
  | "brightYellow"
  | "brightBlue"
  | "brightMagenta"
  | "brightCyan"
  | "brightWhite"
  | `ansi256:${number}`
  | `pi:${ThemeColor}`;

interface ColorChoice {
  label: string;
  value: ColorName;
}

export const STANDARD_COLORS: ColorChoice[] = [
  { label: "Default", value: "default" },
  { label: "Black", value: "black" },
  { label: "Red", value: "red" },
  { label: "Green", value: "green" },
  { label: "Yellow", value: "yellow" },
  { label: "Blue", value: "blue" },
  { label: "Magenta", value: "magenta" },
  { label: "Cyan", value: "cyan" },
  { label: "White", value: "white" },
  { label: "Bright Black", value: "brightBlack" },
  { label: "Bright Red", value: "brightRed" },
  { label: "Bright Green", value: "brightGreen" },
  { label: "Bright Yellow", value: "brightYellow" },
  { label: "Bright Blue", value: "brightBlue" },
  { label: "Bright Magenta", value: "brightMagenta" },
  { label: "Bright Cyan", value: "brightCyan" },
  { label: "Bright White", value: "brightWhite" },
];

const PI_THEME_COLORS: ThemeColor[] = [
  "accent",
  "border",
  "borderAccent",
  "borderMuted",
  "success",
  "error",
  "warning",
  "muted",
  "dim",
  "text",
  "thinkingText",
  "userMessageText",
  "customMessageText",
  "customMessageLabel",
  "toolTitle",
  "toolOutput",
  "toolDiffAdded",
  "toolDiffRemoved",
  "toolDiffContext",
  "syntaxType",
  "thinkingOff",
  "thinkingMinimal",
  "thinkingLow",
  "thinkingMedium",
  "thinkingHigh",
  "thinkingXhigh",
  "bashMode",
];

const PI_FOREGROUND_COLORS: ColorChoice[] = PI_THEME_COLORS.map((color) => ({
  label: `Pi ${themeColorDisplayName(color)}`,
  value: `pi:${color}`,
}));

export const FOREGROUND_COLORS: ColorChoice[] = [...STANDARD_COLORS, ...PI_FOREGROUND_COLORS];

const ANSI16_FG: Record<
  Exclude<ColorName, `ansi256:${number}` | `pi:${ThemeColor}`>,
  [number, number]
> = {
  default: [39, 49],
  black: [30, 40],
  red: [31, 41],
  green: [32, 42],
  yellow: [33, 43],
  blue: [34, 44],
  magenta: [35, 45],
  cyan: [36, 46],
  white: [37, 47],
  brightBlack: [90, 100],
  brightRed: [91, 101],
  brightGreen: [92, 102],
  brightYellow: [93, 103],
  brightBlue: [94, 104],
  brightMagenta: [95, 105],
  brightCyan: [96, 106],
  brightWhite: [97, 107],
};

export function normalizeColor(value: unknown): ColorName | undefined {
  if (typeof value !== "string") return undefined;
  if (STANDARD_COLORS.some((color) => color.value === value)) return value as ColorName;
  if (PI_FOREGROUND_COLORS.some((color) => color.value === value)) return value as ColorName;
  const match = /^ansi256:([0-9]{1,3})$/.exec(value);
  if (!match) return undefined;
  const code = Number(match[1]);
  return Number.isInteger(code) && code >= 0 && code <= 255
    ? (`ansi256:${code}` as ColorName)
    : undefined;
}

export function colorDisplayName(color: ColorName | undefined): string {
  if (!color || color === "default") return "Default";
  if (color.startsWith("ansi256:")) return `ANSI256 ${color.slice("ansi256:".length)}`;
  if (color.startsWith("pi:"))
    return PI_FOREGROUND_COLORS.find((entry) => entry.value === color)?.label ?? color;
  return STANDARD_COLORS.find((entry) => entry.value === color)?.label ?? color;
}

export function ansi256Digits(color: ColorName | undefined): string {
  return color?.startsWith("ansi256:") ? String(Number(color.slice("ansi256:".length))) : "0";
}

export function appendAnsi256Digit(color: ColorName | undefined, digit: string): ColorName {
  const digits = ansi256Digits(color);
  const next = Number(`${digits}${digit}`);
  return `ansi256:${Math.min(255, next)}`;
}

export function deleteAnsi256Digit(color: ColorName | undefined): ColorName {
  const digits = ansi256Digits(color) || "0";
  const next = digits.slice(0, -1);
  return `ansi256:${next === "" ? 0 : Number(next)}`;
}

export function applyColors(
  text: string,
  foreground: ColorName | undefined,
  background: ColorName | undefined,
  bold: boolean | undefined,
  level: ColorLevel,
  theme?: Theme,
): string {
  if (level === "none") return text;

  let output = text;
  if (foreground && foreground !== "default")
    output = applyOne(output, foreground, false, level, theme);
  if (background && background !== "default") output = applyOne(output, background, true, level);
  if (bold) output = chalk.bold(output);
  return output;
}

// The styleable color bag shared by widget options and the context conditional-color helper.
// fg/bg are validated ColorName (color picker); the warning/danger quartet is raw text input
// (kind: "text" properties) normalized via normalizeColor() at read time.
export interface ConditionalColorFields {
  fg?: ColorName;
  bg?: ColorName;
  warningFg?: string;
  warningBg?: string;
  dangerFg?: string;
  dangerBg?: string;
}

export function resetAnsi256Colors<T extends ConditionalColorFields>(options: T): T {
  const next = { ...options };
  if (next.fg?.startsWith("ansi256:")) next.fg = "default";
  if (next.bg?.startsWith("ansi256:")) next.bg = "default";
  if (next.warningFg?.startsWith("ansi256:")) next.warningFg = "default";
  if (next.warningBg?.startsWith("ansi256:")) next.warningBg = "default";
  if (next.dangerFg?.startsWith("ansi256:")) next.dangerFg = "default";
  if (next.dangerBg?.startsWith("ansi256:")) next.dangerBg = "default";
  return next;
}

function themeColorDisplayName(color: ThemeColor): string {
  return color.replace(/([A-Z])/g, " $1").replace(/^./, (char) => char.toUpperCase());
}

function applyOne(
  text: string,
  color: ColorName,
  background: boolean,
  level: ColorLevel,
  theme?: Theme,
): string {
  if (color.startsWith("pi:")) {
    if (background || !theme) return text;
    return theme.fg(color.slice("pi:".length) as ThemeColor, text);
  }
  if (color.startsWith("ansi256:")) {
    const code = Number(color.slice("ansi256:".length));
    if (level === "ansi256" || level === "truecolor") {
      return background ? chalk.bgAnsi256(code)(text) : chalk.ansi256(code)(text);
    }
    return text;
  }

  const codes = ANSI16_FG[color as Exclude<ColorName, `ansi256:${number}` | `pi:${ThemeColor}`>];
  if (!codes || color === "default") return text;
  return `\x1b[${background ? codes[1] : codes[0]}m${text}\x1b[${background ? 49 : 39}m`;
}

// Keep the escape byte out of a regex literal so oxlint's no-control-regex rule does not
// flag the intentional ANSI matcher. RegExp still receives the ESC sequence at runtime.
const ANSI_ESCAPE_PATTERN = new RegExp(String.raw`\x1B\[[0-?]*[ -/]*[@-~]`, "g");

export function stripAnsi(text: string): string {
  return text.replace(ANSI_ESCAPE_PATTERN, "");
}
