import type { ColorName } from "./colors.js";
import type { SeparatorStyle, WidgetSeparatorStyle } from "./separators.js";
import type { IconMode, TerminalOptions, TerminalWidthMode, WidgetOptions } from "./types.js";
import type { WidgetType } from "./widgets/registry.js";

export interface PresetWidget {
  type: WidgetType;
  options?: WidgetOptions;
}

export interface PresetDefinition {
  separator?: SeparatorStyle;
  iconMode?: IconMode;
  terminal?: Partial<TerminalOptions>;
  lines: PresetWidget[][];
}

interface PowerlineSegment extends PresetWidget {
  options: WidgetOptions & { fg: ColorName; bg: ColorName };
}

interface PowerlineTransitionContext {
  left: PowerlineSegment;
  right: PowerlineSegment;
  index: number;
}

interface PowerlineCapOptions {
  separator?: WidgetSeparatorStyle;
  fg?: ColorName;
  bg?: ColorName;
}

interface PowerlineLineOptions {
  separator?: WidgetSeparatorStyle;
  start?: boolean | PowerlineCapOptions;
  end?: boolean | PowerlineCapOptions;
  transition?: (
    context: PowerlineTransitionContext,
  ) => Partial<WidgetOptions> & { separator?: WidgetSeparatorStyle };
}

const FULL_WIDTH: Partial<TerminalOptions> = { widthMode: "full" satisfies TerminalWidthMode };

function widget(type: WidgetType, options: WidgetOptions = {}): PresetWidget {
  return { type, options };
}

function powerSegment(
  type: WidgetType,
  options: WidgetOptions & { fg: ColorName; bg: ColorName },
): PowerlineSegment {
  return { type, options };
}

function powerlineLine(
  segments: readonly PowerlineSegment[],
  options: PowerlineLineOptions = {},
): PresetWidget[] {
  if (segments.length === 0) return [];

  const separator = options.separator ?? "powerline-right-spaced";
  const line: PresetWidget[] = [];
  const first = segments[0];
  if (!first) return [];

  if (options.start) line.push(capWidget(first.options.bg, options.start, "powerline-start"));

  for (let index = 0; index < segments.length; index += 1) {
    const current = segments[index];
    if (!current) continue;
    line.push(current);

    const next = segments[index + 1];
    if (!next) continue;
    const transition = options.transition?.({ left: current, right: next, index }) ?? {};
    line.push({
      type: "separator",
      options: {
        separator: transition.separator ?? separator,
        fg: current.options.bg,
        bg: next.options.bg,
        ...transition,
      },
    });
  }

  const last = segments.at(-1);
  if (last && options.end) line.push(capWidget(last.options.bg, options.end, "powerline-end"));

  return line;
}

function capWidget(
  color: ColorName,
  cap: true | PowerlineCapOptions,
  defaultSeparator: WidgetSeparatorStyle,
): PresetWidget {
  const options = cap === true ? {} : cap;
  return {
    type: "separator",
    options: {
      separator: options.separator ?? defaultSeparator,
      fg: options.fg ?? color,
      bg: options.bg ?? "default",
    },
  };
}

function demoLabelLine(preset: keyof typeof BASE_PRESET_DEFINITIONS): PresetWidget[] {
  return [widget("custom-text", { raw: true, fg: "pi:success", text: `Preset '${preset}':` })];
}

function demoEmptyLine(): PresetWidget[] {
  return [widget("custom-text", { raw: true, fg: "pi:success", text: "" })];
}

const BASE_PRESET_DEFINITIONS = {
  default: {
    separator: "dot",
    terminal: FULL_WIDTH,
    lines: [
      [
        widget("model-provider"),
        widget("thinking-level"),
        widget("text-verbosity"),
        widget("context-length"),
        widget("git-branch"),
        widget("git-diff", { gitDiffMode: "compact" }),
        widget("cost"),
        widget("total-time"),
      ],
    ],
  },
  powerline: {
    separator: "none",
    iconMode: "nerd",
    terminal: FULL_WIDTH,
    lines: [
      powerlineLine([
        powerSegment("model-provider", { fg: "brightWhite", bg: "ansi256:33", bold: true }),
        powerSegment("git-branch", { fg: "brightWhite", bg: "ansi256:61", bold: true }),
        powerSegment("tokens", { fg: "brightWhite", bg: "ansi256:64" }),
        powerSegment("context-bar", {
          fg: "ansi256:234",
          bg: "ansi256:136",
          contextBarMode: "medium",
        }),
        powerSegment("output-speed", { fg: "black", bg: "ansi256:37" }),
        powerSegment("total-time", { fg: "brightWhite", bg: "ansi256:236" }),
      ]),
    ],
  },
  "powerline-bright": {
    separator: "none",
    iconMode: "nerd",
    terminal: FULL_WIDTH,
    lines: [
      powerlineLine(
        [
          powerSegment("model", { fg: "brightWhite", bg: "ansi256:131", icon: "Model: " }),
          powerSegment("context-length", { fg: "black", bg: "ansi256:220", icon: "Ctx: " }),
          powerSegment("git-branch", { fg: "brightWhite", bg: "ansi256:68" }),
          powerSegment("git-diff", {
            fg: "black",
            bg: "ansi256:108",
            raw: true,
            gitDiffMode: "compact",
          }),
          powerSegment("total-time", { fg: "black", bg: "ansi256:176", raw: true }),
        ],
        { start: true, end: true },
      ),
      powerlineLine(
        [
          powerSegment("cwd", { fg: "brightWhite", bg: "ansi256:131", segments: 3, icon: "cwd: " }),
          powerSegment("cost", { fg: "black", bg: "ansi256:220", icon: "Cost: " }),
        ],
        { start: true, end: true },
      ),
    ],
  },
  "powerline-blocks": {
    separator: "none",
    iconMode: "nerd",
    terminal: FULL_WIDTH,
    lines: [
      powerlineLine(
        [
          powerSegment("model", { fg: "brightWhite", bg: "ansi256:131", icon: "Model: " }),
          powerSegment("context-length", { fg: "black", bg: "ansi256:222", icon: "Ctx: " }),
          powerSegment("git-branch", { fg: "brightWhite", bg: "ansi256:67" }),
          powerSegment("git-diff", {
            fg: "black",
            bg: "ansi256:151",
            raw: true,
            gitDiffMode: "compact",
          }),
        ],
        { start: true, end: true },
      ),
      powerlineLine(
        [
          powerSegment("input-tokens", { fg: "brightWhite", bg: "ansi256:131", icon: "In: " }),
          powerSegment("output-tokens", { fg: "black", bg: "ansi256:222", icon: "Out: " }),
          powerSegment("cache-read", { fg: "brightWhite", bg: "ansi256:67", icon: "Cached: " }),
          powerSegment("total-tokens", { fg: "black", bg: "ansi256:151", icon: "Total: " }),
        ],
        { start: true, end: true },
      ),
      powerlineLine(
        [
          powerSegment("context-bar", {
            fg: "brightWhite",
            bg: "ansi256:131",
            icon: "Ctx ",
            contextBarMode: "medium",
          }),
          powerSegment("total-time", { fg: "brightWhite", bg: "ansi256:131", raw: true }),
        ],
        {
          start: true,
          end: true,
          transition: () => ({ separator: "powerline-soft-right" }),
        },
      ),
    ],
  },
  "powerline-mono": {
    separator: "none",
    iconMode: "nerd",
    terminal: FULL_WIDTH,
    lines: [
      powerlineLine(
        [
          powerSegment("model", { fg: "brightWhite", bg: "ansi256:240", icon: "Model: " }),
          powerSegment("context-length", { fg: "black", bg: "ansi256:252", icon: "Ctx: " }),
          powerSegment("git-branch", { fg: "brightWhite", bg: "ansi256:233" }),
          powerSegment("git-diff", {
            fg: "black",
            bg: "ansi256:250",
            raw: true,
            gitDiffMode: "compact",
          }),
          powerSegment("cwd-basename", { fg: "brightWhite", bg: "ansi256:236" }),
        ],
        { start: true, end: true },
      ),
      powerlineLine(
        [
          powerSegment("output-tokens", { fg: "brightWhite", bg: "ansi256:240", icon: "👾 Out: " }),
          powerSegment("cache-read", { fg: "black", bg: "ansi256:252", icon: "💰 Cached: " }),
          powerSegment("total-tokens", { fg: "brightWhite", bg: "ansi256:233", icon: "Total: " }),
          powerSegment("context-length", { fg: "black", bg: "ansi256:250", icon: "Ctx: " }),
        ],
        { start: true, end: true },
      ),
    ],
  },
  "git-heavy": {
    separator: "dot",
    iconMode: "nerd",
    terminal: FULL_WIDTH,
    lines: [
      [
        widget("model-provider"),
        widget("cwd-basename"),
        widget("git-branch"),
        widget("git-sha"),
        widget("git-status"),
        widget("git-diff", { gitDiffMode: "compact" }),
        widget("git-ahead-behind"),
      ],
    ],
  },
  compact: {
    separator: "space",
    terminal: { widthMode: "full-minus-40" },
    lines: [
      [
        widget("model"),
        widget("thinking-level"),
        widget("text-verbosity"),
        widget("git-branch"),
        widget("context"),
        widget("cost"),
      ],
    ],
  },
  "pi-footer": {
    separator: "none",
    iconMode: "text",
    terminal: FULL_WIDTH,
    lines: [
      [
        widget("cwd", { raw: true, fg: "pi:dim", cwdDisplayStyle: "full-home" }),
        widget("git-branch", {
          icon: " ",
          fg: "pi:dim",
          hideWhenEmpty: true,
          gitBranchDisplayStyle: "round-brackets",
        }),
        widget("session-name", { icon: " • ", fg: "pi:dim", hideWhenEmpty: true }),
      ],
      [
        widget("tokens", { raw: true, fg: "pi:dim", tokenFormatStyle: "compact" }),
        widget("cache-read", {
          icon: " R",
          fg: "pi:dim",
          tokenFormatStyle: "compact",
          hideWhenZero: true,
        }),
        widget("cache-write", {
          icon: " W",
          fg: "pi:dim",
          tokenFormatStyle: "compact",
          hideWhenZero: true,
        }),
        widget("cache-hit-rate", {
          icon: " CH",
          fg: "pi:dim",
          hideWhenZero: true,
          cacheHitSource: "turn",
        }),
        widget("cost", {
          icon: " ",
          fg: "pi:dim",
          costFormatStyle: "compact",
          showSubscription: true,
        }),
        widget("context", {
          icon: " ",
          fg: "pi:dim",
          contextConditionalColors: true,
          warningFg: "pi:warning",
          dangerFg: "pi:error",
        }),
        widget("context-window", {
          icon: "/",
          fg: "pi:dim",
          contextConditionalColors: true,
          warningFg: "pi:warning",
          dangerFg: "pi:error",
          tokenFormatStyle: "compact",
        }),
        widget("flex-separator"),
        widget("model", { raw: true, fg: "pi:dim" }),
        widget("thinking-level", { icon: " • ", fg: "pi:dim", hideWhenEmpty: true }),
      ],
    ],
  },
} satisfies Record<string, PresetDefinition>;

function demoLines(...presets: Array<keyof typeof BASE_PRESET_DEFINITIONS>): PresetWidget[][] {
  return presets.flatMap((preset, index) => [
    demoLabelLine(preset),
    ...BASE_PRESET_DEFINITIONS[preset].lines,
    ...(index === presets.length - 1 ? [] : [demoEmptyLine()]),
  ]);
}

export const PRESET_DEFINITIONS = {
  ...BASE_PRESET_DEFINITIONS,
  demo: {
    separator: "none",
    iconMode: "nerd",
    terminal: FULL_WIDTH,
    lines: demoLines(
      "pi-footer",
      "powerline",
      "powerline-bright",
      "powerline-blocks",
      "powerline-mono",
    ),
  },
  "demo-standard": {
    separator: "dot",
    terminal: FULL_WIDTH,
    lines: demoLines("default", "compact", "git-heavy"),
  },
} satisfies Record<string, PresetDefinition>;

export type Preset = keyof typeof PRESET_DEFINITIONS;
