import { Key, matchesKey } from "@earendil-works/pi-tui";

import { registry, type WidgetDefinition } from "../../widgets/registry.js";
import { clamp, isPrintable, wrap } from "../helpers.js";
import { pageSelection } from "../navigation.js";
import { Controller } from "./controller.js";

export class AddWidgetScreen extends Controller {
  private selected = 0;
  private filter = "";

  renderScreen(width: number): string[] {
    const items = this.filterWidgets();
    const visibleCount = this.ctx.visibleRowCount();
    const start = clamp(
      this.selected - Math.floor(visibleCount / 2),
      0,
      Math.max(0, items.length - visibleCount),
    );
    const visible = items.slice(start, start + visibleCount);
    const lines = [
      this.render.line(
        this.render.menuTitle("Add Widget", "Search or select a widget to add"),
        width,
      ),
      this.render.line(this.ctx.theme.dim(this.hint()), width),
      this.render.line(
        this.ctx.theme.dim(this.countLabel(items.length, start, visible.length)),
        width,
      ),
    ];
    visible.forEach((definition, offset) => {
      const index = start + offset;
      const text = this.itemLabel(definition);
      lines.push(this.render.menuLine(index === this.selected, text, width));
    });
    return lines;
  }

  handleInput(data: string): void {
    const items = this.filterWidgets();
    if (matchesKey(data, Key.up))
      this.selected = wrap(this.selected - 1, Math.max(1, items.length));
    else if (matchesKey(data, Key.down))
      this.selected = wrap(this.selected + 1, Math.max(1, items.length));
    else if (matchesKey(data, Key.pageUp)) this.page(items.length, -1);
    else if (matchesKey(data, Key.pageDown)) this.page(items.length, 1);
    else if (matchesKey(data, Key.backspace)) {
      this.filter = this.filter.slice(0, -1);
      this.selected = 0;
    } else if (matchesKey(data, Key.enter)) {
      const definition = items[this.selected];
      if (!definition) return;
      this.ctx
        .currentLine()
        .splice(this.ctx.state.selectedWidget + 1, 0, registry.createWidget(definition.type));
      this.ctx.state.selectedWidget += 1;
      this.ctx.show("widget-list");
      this.ctx.emitChange();
    } else if (isPrintable(data)) {
      this.filter += data.toLowerCase();
      this.selected = 0;
    }
  }

  private hint(): string {
    return `type to filter • ↑/↓ select • pgup/pgdn jump • enter add • esc back • filter: ${this.filter || "(none)"}`;
  }

  private countLabel(total: number, start: number, visibleLength: number): string {
    const range = total === 0 ? "0-0" : `${start + 1}-${Math.min(total, start + visibleLength)}`;
    return `${total} result(s), showing ${range}`;
  }

  private filterWidgets(): WidgetDefinition[] {
    const filter = this.filter.trim();
    if (!filter) return [...registry.definitions];
    return registry.definitions.filter((definition) =>
      `${definition.category} ${definition.label} ${definition.type}`
        .toLowerCase()
        .includes(filter.toLowerCase()),
    );
  }

  private itemLabel(definition: WidgetDefinition): string {
    return `${definition.category} / ${definition.label} ${this.ctx.theme.dim(definition.description)}`;
  }

  private page(length: number, delta: -1 | 1): void {
    this.selected = pageSelection(this.selected, length, this.ctx.visibleRowCount(), delta);
  }
}
