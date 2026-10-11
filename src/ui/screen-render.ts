import { truncateToWidth, visibleWidth } from "@earendil-works/pi-tui";

import type { UiTheme } from "./theme.ts";

export class ScreenRender {
  constructor(private readonly theme: UiTheme) {}

  menuTitle(title: string, description = ""): string {
    if (description.length === 0) return this.theme.accent(title);
    return this.theme.success(`•${title}`) + " " + this.theme.dim(description);
  }

  padLine(width: number, content: string, ellipsis = "…"): string {
    return truncateToWidth(content, Math.max(1, width - 2), ellipsis, true);
  }

  lineW(content: string, width: number): string {
    // NOTE: uncoment below for demo-look preview.
    // const clipped = truncateToWidth(content, Math.max(0, width - 2), "…");
    const clipped = truncateToWidth(content, Math.max(0, width), "…");
    return `${clipped}${" ".repeat(Math.max(0, width - visibleWidth(clipped)))}`;
  }

  line(content: string, width: number): string {
    return this.theme.border("│") + this.padLine(width, content) + this.theme.border("│");
  }

  menuLine(selected: boolean, content: string, width: number): string {
    const text = `${selected ? "›" : " "}  ${content}`;
    return this.line(selected ? this.theme.selected(text) : text, width);
  }
}
