import type { Theme } from "@earendil-works/pi-coding-agent";
import { truncateToWidth, visibleWidth } from "@earendil-works/pi-tui";

import { applyColors } from "./colors.js";
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

function padRight(left: string, right: string, width: number): string {
  const spaces = Math.max(1, width - visibleWidth(left) - visibleWidth(right));
  return truncateToWidth(`${left}${" ".repeat(spaces)}${right}`, width, "…");
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

  const left = joinSegments(rendered.slice(0, flexIndex), settings);
  const right = joinSegments(rendered.slice(flexIndex + 1), settings);
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
