import { Key, matchesKey } from "@earendil-works/pi-tui";

import { registry } from "../../widgets/registry.js";
import type { Widget } from "../../widgets/types.js";
import { formatWidgetColorOptions, formatWidgetOptions } from "../fields.js";
import { wrap } from "../helpers.js";
import { pageSelection, scrollWindow } from "../navigation.js";
import type { ScreenContext } from "../screen-context.js";
import type { ScreenRender } from "../screen-render.js";
import {
  cloneSelectedWidget,
  deleteSelectedWidget,
  moveWidget,
  toggleWidgetEnabled,
  toggleWidgetRaw,
} from "../widget-actions.js";
import { Controller } from "./controller.js";

const HINT =
  "↑/↓ select • enter options • a add • c clone • w/s move • d delete • space toggle • r raw • esc back";
const COLOR_HINT = "↑/↓ select • pgup/pgdn jump • enter colors • esc back";

export class WidgetListScreen extends Controller {
  constructor(
    ctx: ScreenContext,
    render: ScreenRender,
    private readonly colors: boolean,
  ) {
    super(ctx, render);
  }

  renderScreen(width: number): string[] {
    const line = this.ctx.currentLine();
    const visibleCount = this.ctx.visibleRowCount();
    const { start, end } = scrollWindow(line.length, this.ctx.state.selectedWidget, visibleCount);
    const visible = line.slice(start, end);
    const lines = [
      this.render.line(
        this.render.menuTitle(
          `${this.colors ? "Edit widget colors" : "Edit widgets"} / Line ${this.ctx.state.selectedLine + 1}`,
          this.colors
            ? "Select a widget to edit its colors"
            : "Select a widget to edit its options, or add/remove/reorder widgets",
        ),
        width,
      ),
      this.render.line(this.ctx.theme.dim(this.colors ? COLOR_HINT : HINT), width),
      this.render.line(this.ctx.theme.dim(this.countLabel(line.length, start, end)), width),
    ];
    if (line.length === 0)
      lines.push(
        this.render.line(this.ctx.theme.warning("Empty line. Press a to add a widget."), width),
      );
    visible.forEach((widget, offset) => {
      const index = start + offset;
      const text = this.colors ? this.colorItemLabel(index, widget) : this.itemLabel(index, widget);
      lines.push(this.render.menuLine(index === this.ctx.state.selectedWidget, text, width));
    });
    return lines;
  }

  handleInput(data: string): void {
    const line = this.ctx.currentLine();
    if (matchesKey(data, Key.up))
      this.ctx.state.selectedWidget = wrap(
        this.ctx.state.selectedWidget - 1,
        Math.max(1, line.length),
      );
    else if (matchesKey(data, Key.down))
      this.ctx.state.selectedWidget = wrap(
        this.ctx.state.selectedWidget + 1,
        Math.max(1, line.length),
      );
    else if (matchesKey(data, Key.pageUp)) this.page(line.length, -1);
    else if (matchesKey(data, Key.pageDown)) this.page(line.length, 1);
    else if (this.colors && matchesKey(data, Key.enter)) this.ctx.show("edit-colors");
    else if (!this.colors) this.handleEditListInput(data);
  }

  private countLabel(total: number, start: number, end: number): string {
    const range = total === 0 ? "0-0" : `${start + 1}-${end}`;
    return `${total} widget(s), showing ${range}`;
  }

  private itemLabel(index: number, widget: Widget): string {
    const enabled = widget.enabled ? this.ctx.theme.success("on ") : this.ctx.theme.dim("off");
    const indexPad = index < 9 ? " " : "";
    const options = this.ctx.theme.dim(formatWidgetOptions(widget));
    return `${enabled} ${index + 1}.${indexPad} ${registry.spec(widget.type).label} ${options}`;
  }

  private colorItemLabel(index: number, widget: Widget): string {
    const enabled = widget.enabled ? this.ctx.theme.success("on ") : this.ctx.theme.dim("off");
    const indexPad = index < 9 ? " " : "";
    const options = this.ctx.theme.dim(formatWidgetColorOptions(widget));
    return `${enabled} ${index + 1}.${indexPad} ${registry.spec(widget.type).label} ${options}`;
  }

  private handleEditListInput(data: string): void {
    if (data === "a") this.ctx.show("add-widget");
    else if (matchesKey(data, Key.enter) || data === "e") this.ctx.show("edit-widget");
    else if (data === "c") this.cloneCurrentWidget();
    else if (data === "w") this.moveWidget(-1);
    else if (data === "s") this.moveWidget(1);
    else if (data === "d") this.deleteCurrentWidget();
    else if (matchesKey(data, Key.space)) this.toggleCurrentWidget();
    else if (data === "r") this.toggleCurrentWidgetRaw();
  }

  private page(length: number, delta: -1 | 1): void {
    this.ctx.state.selectedWidget = pageSelection(
      this.ctx.state.selectedWidget,
      length,
      this.ctx.visibleRowCount(),
      delta,
    );
  }

  private moveWidget(delta: number): void {
    const next = moveWidget(this.ctx.currentLine(), this.ctx.state.selectedWidget, delta);
    if (next === this.ctx.state.selectedWidget) return;
    this.ctx.state.selectedWidget = next;
    this.ctx.emitChange();
  }

  private cloneCurrentWidget(): void {
    const next = cloneSelectedWidget(
      this.ctx.currentLine(),
      this.ctx.state.selectedWidget,
      (widget) => registry.cloneWidget(widget),
    );
    if (next === this.ctx.state.selectedWidget) return;
    this.ctx.state.selectedWidget = next;
    this.ctx.emitChange();
  }

  private deleteCurrentWidget(): void {
    const line = this.ctx.currentLine();
    const previousLength = line.length;
    this.ctx.state.selectedWidget = deleteSelectedWidget(line, this.ctx.state.selectedWidget);
    if (line.length === previousLength) return;
    this.ctx.emitChange();
  }

  private toggleCurrentWidget(): void {
    if (!toggleWidgetEnabled(this.ctx.currentWidget())) return;
    this.ctx.emitChange();
  }

  private toggleCurrentWidgetRaw(): void {
    if (!toggleWidgetRaw(this.ctx.currentWidget())) return;
    this.ctx.emitChange();
  }
}
