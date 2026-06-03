import type { Theme } from "@earendil-works/pi-coding-agent";

import type { GetExtensionStatuses } from "../extension-statuses.js";
import { renderStatuslines } from "../render.js";
import type { StatuslineData } from "../types.js";
import type { WidgetStore } from "../widgets/store.js";
import type { ScreenRender } from "./screen-render.js";
import type { UiTheme } from "./theme.js";
import { configTitleBarParts, previewTitleParts } from "./title-bar.js";

interface OverlayRenderOptions {
  width: number;
  terminalRows: number;
  activeLineCount: number;
  visibleRowCount: number;
  store: WidgetStore;
  previewData: StatuslineData;
  getExtensionStatuses: GetExtensionStatuses;
  theme: Theme;
  requestRender?: () => void;
  configStateText: string;
  body: string[];
}

interface OverlayLayout {
  innerWidth: number;
}

export class OverlayRender {
  constructor(
    private readonly theme: UiTheme,
    private readonly screenRender: ScreenRender,
  ) {}

  render(options: OverlayRenderOptions): string[] {
    const layout = this.layout(options);
    const lines = [
      this.previewTitleLine(layout),
      ...this.previewLines(options),
      this.previewBottomLine(layout),
      this.blankSeparator(options.width),
      this.configTitleLine(options, layout),
      ...options.body,
    ];

    this.fillToTerminal(lines, options);
    lines.push(this.bottomBorder(layout));
    return lines;
  }

  private layout(options: OverlayRenderOptions): OverlayLayout {
    return { innerWidth: Math.max(1, options.width - 2) };
  }

  private previewTitleLine(layout: OverlayLayout): string {
    const previewTitle = previewTitleParts(layout.innerWidth);
    return (
      this.theme.border("─") +
      this.theme.previewTitle(previewTitle.title) +
      this.theme.border(`${"─".repeat(previewTitle.rightPad)}─`)
    );
  }

  private previewLines(options: OverlayRenderOptions): string[] {
    return renderStatuslines(options.store, options.previewData, Math.max(20, options.width), {
      getExtensionStatuses: options.getExtensionStatuses,
      theme: options.theme,
      ...(options.requestRender ? { requestRender: options.requestRender } : {}),
    }).map((line) => this.screenRender.lineW(line, options.width));
  }

  private previewBottomLine(layout: OverlayLayout): string {
    return this.theme.border(`─${"─".repeat(layout.innerWidth)}─`);
  }

  private blankSeparator(width: number): string {
    return " " + this.screenRender.padLine(width, "", "") + " ";
  }

  private configTitleLine(options: OverlayRenderOptions, layout: OverlayLayout): string {
    const title = configTitleBarParts(
      layout.innerWidth,
      (text) => this.theme.dim(text),
      Date.now(),
      options.configStateText,
      (text) => this.theme.border(text),
    );
    return (
      this.theme.border("╭─") + title.title + this.theme.border(`${"─".repeat(title.rightPad)}╮`)
    );
  }

  private fillToTerminal(lines: string[], options: OverlayRenderOptions): void {
    const neededToFillScreen = options.terminalRows - lines.length - 1;
    if (neededToFillScreen > 0) {
      lines.push(...Array(neededToFillScreen).fill(this.screenRender.line("", options.width)));
    }
  }

  private bottomBorder(layout: OverlayLayout): string {
    return this.theme.border(`╰${"─".repeat(layout.innerWidth)}╯`);
  }
}
