import type { Theme } from "@earendil-works/pi-coding-agent";
import { sliceByColumn, truncateToWidth, visibleWidth } from "@earendil-works/pi-tui";
import { basename } from "node:path";

import { applyColors, stripAnsi } from "./colors.js";
import type { GetExtensionStatuses } from "./extension-statuses.js";
import { separatorText } from "./separators.js";
import type { StatuslineData, StatuslineSettings } from "./types.js";
import { contextForDependencies } from "./widgets/context.js";
import { registry } from "./widgets/registry.js";
import type { WidgetStore } from "./widgets/store.js";
import type { BaseWidgetContext, Widget } from "./widgets/types.js";

export interface RenderStatuslineOptions {
  getExtensionStatuses?: GetExtensionStatuses;
  theme?: Theme;
  requestRender?: () => void;
}

export function renderStatuslines(
  store: WidgetStore,
  data: StatuslineData,
  width: number,
  options: RenderStatuslineOptions = {},
): string[] {
  const settings = store.settings;
  if (!settings.enabled || width <= 0) return [];

  const baseCtx: BaseWidgetContext = {
    iconMode: settings.iconMode,
    minimalist: settings.minimalist,
    colorLevel: settings.terminal.colorLevel,
    ...(options.theme ? { theme: options.theme } : {}),
    ...(options.requestRender ? { requestRender: options.requestRender } : {}),
  };
  const lineWidth = effectiveWidth(settings, width);
  return store.lines
    .map((line) => renderLine(line, settings, lineWidth, { baseCtx, data, options }))
    .filter((line) => line.trim().length > 0);
}

const ANSI_RESET = "\x1b[0m";
const MIN_FLEX_GAP = 4;
const COMPACT_CWD_WIDTH = 36;
const COMPACT_BRANCH_WIDTH = 40;

function truncateWithStyledEllipsis(text: string, maxWidth: number): string {
  if (visibleWidth(text) <= maxWidth) return text;
  if (maxWidth <= 1) return truncateToWidth(text, maxWidth, "…");

  // pi-tui intentionally resets styles before its ellipsis. Remove only that final reset
  // so the ellipsis inherits the style active at the truncation point, then close it again.
  const prefix = truncateToWidth(text, maxWidth - 1, "");
  const styledPrefix = prefix.endsWith(ANSI_RESET) ? prefix.slice(0, -ANSI_RESET.length) : prefix;
  return `${styledPrefix}…${ANSI_RESET}`;
}

function truncateMiddleWithStyledEllipsis(text: string, maxWidth: number): string {
  const textWidth = visibleWidth(text);
  if (textWidth <= maxWidth) return text;
  if (maxWidth <= 1) return truncateToWidth(text, maxWidth, "…");

  const contentWidth = maxWidth - 1;
  let headWidth = Math.ceil(contentWidth / 2);
  const tailWidth = Math.floor(contentWidth / 2);
  let tailStart = textWidth - tailWidth;

  // Prefer whole hyphen-delimited tokens around the cut. Falling back to the exact column
  // budgets keeps this generic for paths and labels that do not use kebab-case names.
  const initialHead = stripAnsi(sliceByColumn(text, 0, headWidth, true));
  const nextCharacter = stripAnsi(sliceByColumn(text, headWidth, 1, true));
  if (initialHead.endsWith("-")) {
    headWidth -= 1;
  } else if (nextCharacter !== "-") {
    const boundary = initialHead.lastIndexOf("-");
    if (boundary > 0) headWidth = visibleWidth(initialHead.slice(0, boundary));
  }

  const previousCharacter = stripAnsi(sliceByColumn(text, Math.max(0, tailStart - 1), 1, true));
  const initialTail = stripAnsi(sliceByColumn(text, tailStart, tailWidth, true));
  if (initialTail.startsWith("-")) {
    tailStart += 1;
  } else if (previousCharacter !== "-") {
    const boundary = initialTail.indexOf("-");
    if (boundary >= 0 && boundary < initialTail.length - 1) {
      tailStart += visibleWidth(initialTail.slice(0, boundary + 1));
    }
  }

  const head = sliceByColumn(text, 0, headWidth, true);
  const tail = sliceByColumn(text, tailStart, textWidth - tailStart, true);
  return `${head}…${tail}`;
}

function compactLocationEntries(
  entries: readonly RenderedSegment[],
  data: StatuslineData,
  maxWidth: number,
  settings: StatuslineSettings,
): RenderedSegment[] {
  const cwdIndex = entries.findIndex((entry) => entry.widget.type === "cwd-basename");
  const branchIndex = entries.findIndex((entry) => entry.widget.type === "git-branch");
  if (cwdIndex === -1 || branchIndex === -1) return [...entries];

  const compacted = entries.map((entry) => ({ ...entry }));
  const cwdEntry = compacted[cwdIndex];
  const branchEntry = compacted[branchIndex];
  if (!cwdEntry || !branchEntry) return compacted;

  const cwdName = basename(data.cwd);
  const branch = data.git.branch ?? "";
  const duplicatesCwd = branch === cwdName || branch.endsWith(`/${cwdName}`);

  if (duplicatesCwd) {
    branchEntry.segment = "";
    const previous = compacted[branchIndex - 1];
    if (previous?.widget.type === "separator") previous.segment = "";
    cwdEntry.segment = truncateMiddleWithStyledEllipsis(
      cwdEntry.segment,
      Math.min(COMPACT_CWD_WIDTH, maxWidth),
    );
    return compacted;
  }

  const desiredCwdWidth = Math.min(visibleWidth(cwdEntry.segment), COMPACT_CWD_WIDTH);
  const desiredBranchWidth = Math.min(visibleWidth(branchEntry.segment), COMPACT_BRANCH_WIDTH);
  const withoutLocations = compacted.map((entry, index) =>
    index === cwdIndex || index === branchIndex ? { ...entry, segment: "" } : entry,
  );
  const locationBudget = Math.max(
    2,
    maxWidth - visibleWidth(joinSegments(withoutLocations, settings)),
  );
  const desiredTotal = desiredCwdWidth + desiredBranchWidth;
  const cwdWidth =
    desiredTotal <= locationBudget
      ? desiredCwdWidth
      : Math.max(1, Math.floor((locationBudget * desiredCwdWidth) / desiredTotal));
  const branchWidth = Math.max(1, Math.min(desiredBranchWidth, locationBudget - cwdWidth));

  cwdEntry.segment = truncateMiddleWithStyledEllipsis(cwdEntry.segment, cwdWidth);
  branchEntry.segment = truncateMiddleWithStyledEllipsis(branchEntry.segment, branchWidth);
  return compacted;
}

function padRight(left: string, right: string, width: number): string {
  const rightWidth = visibleWidth(right);
  if (rightWidth >= width) return truncateToWidth(right, width, "…");

  // The right side carries high-priority state such as model and thinking level. Fit the
  // left side into the remaining columns first so a long cwd or branch cannot push that
  // state past the terminal edge. Keep a readable gap between the two groups.
  const fittedLeft = truncateWithStyledEllipsis(left, width - rightWidth - MIN_FLEX_GAP);
  const spaces = width - visibleWidth(fittedLeft) - rightWidth;
  return `${fittedLeft}${" ".repeat(spaces)}${right}`;
}

interface RenderedSegment {
  widget: Widget;
  segment: string;
}

interface RenderLineContext {
  baseCtx: BaseWidgetContext;
  data: StatuslineData;
  options: RenderStatuslineOptions;
}

function renderLine(
  line: readonly Widget[],
  settings: StatuslineSettings,
  width: number,
  ctx: RenderLineContext,
): string {
  const rendered = line
    .filter((widget) => widget.enabled)
    .map((widget) => ({
      widget,
      segment:
        widget.render(
          contextForDependencies(
            ctx.baseCtx,
            registry.spec(widget.type).dependencies,
            ctx.data,
            ctx.options,
          ),
        ) ?? "",
    }));

  const flexIndex = rendered.findIndex((entry) => entry.widget.type === "flex-separator");
  if (flexIndex === -1) {
    return truncateToWidth(joinSegments(rendered, settings), width, "…");
  }

  let leftEntries = rendered.slice(0, flexIndex);
  const right = joinSegments(rendered.slice(flexIndex + 1), settings);
  let left = joinSegments(leftEntries, settings);
  if (right && visibleWidth(left) + MIN_FLEX_GAP + visibleWidth(right) > width) {
    const leftWidth = Math.max(0, width - visibleWidth(right) - MIN_FLEX_GAP);
    leftEntries = compactLocationEntries(leftEntries, ctx.data, leftWidth, settings);
    left = joinSegments(leftEntries, settings);
  }
  return right ? padRight(left, right, width) : truncateToWidth(left, width, "…");
}

function effectiveWidth(settings: StatuslineSettings, width: number): number {
  if (settings.terminal.widthMode === "full-minus-40") return Math.max(1, width - 40);
  return width;
}

function joinSegments(entries: readonly RenderedSegment[], settings: StatuslineSettings): string {
  const segments = entries.filter((entry) => entry.segment.length > 0);
  if (segments.length === 0) return "";

  let output = segments[0]?.segment ?? "";
  for (let index = 1; index < segments.length; index += 1) {
    const previous = segments[index - 1];
    const current = segments[index];
    if (!previous || !current) continue;
    if (previous.widget.type !== "separator" && current.widget.type !== "separator") {
      output += applyColors(
        separatorText(settings.separator),
        settings.separatorFg,
        settings.separatorBg,
        false,
        settings.terminal.colorLevel,
      );
    }
    output += current.segment;
  }
  return output;
}
