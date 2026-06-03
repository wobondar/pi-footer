import { Key, matchesKey } from "@earendil-works/pi-tui";

import { registry } from "../../widgets/registry.js";
import { wrap } from "../helpers.js";
import { LINE_LIST_HINT, lineListCountLabel, lineListItemLabel } from "../line-list.js";
import type { ScreenView } from "../model.js";
import { pageSelection, scrollWindow } from "../navigation.js";
import type { ScreenContext } from "../screen-context.js";
import type { ScreenRender } from "../screen-render.js";
import { addLineAfter, cloneLineAfter, deleteLine, moveLine } from "../widget-actions.js";
import { Controller } from "./controller.js";

export class LineListScreen extends Controller {
  constructor(
    ctx: ScreenContext,
    render: ScreenRender,
    private readonly title: string,
    private readonly nextView: ScreenView,
  ) {
    super(ctx, render);
  }

  renderScreen(width: number): string[] {
    const visibleCount = this.ctx.visibleRowCount();
    const { start, end } = scrollWindow(
      this.ctx.state.store.lines.length,
      this.ctx.state.selectedLine,
      visibleCount,
    );
    const visible = this.ctx.state.store.lines.slice(start, end);
    const lines = [
      this.render.line(
        this.render.menuTitle(this.title, "Choose which status line to configure"),
        width,
      ),
      this.render.line(this.ctx.theme.dim(LINE_LIST_HINT), width),
      this.render.line(
        this.ctx.theme.dim(lineListCountLabel(this.ctx.state.store.lines.length, start, end)),
        width,
      ),
    ];
    visible.forEach((line, offset) => {
      const index = start + offset;
      const text = lineListItemLabel(index, line.length, (value) => this.ctx.theme.dim(value));
      lines.push(this.render.menuLine(index === this.ctx.state.selectedLine, text, width));
    });
    return lines;
  }

  handleInput(data: string): void {
    if (matchesKey(data, Key.up))
      this.ctx.state.selectedLine = wrap(
        this.ctx.state.selectedLine - 1,
        this.ctx.state.store.lines.length,
      );
    else if (matchesKey(data, Key.down))
      this.ctx.state.selectedLine = wrap(
        this.ctx.state.selectedLine + 1,
        this.ctx.state.store.lines.length,
      );
    else if (matchesKey(data, Key.pageUp)) this.page(-1);
    else if (matchesKey(data, Key.pageDown)) this.page(1);
    else if (matchesKey(data, Key.enter)) {
      this.ctx.state.selectedWidget = 0;
      this.ctx.show(this.nextView);
    } else if (data === "a") {
      this.ctx.state.selectedLine = addLineAfter(
        this.ctx.state.store.lines,
        this.ctx.state.selectedLine,
      );
      this.ctx.emitChange();
    } else if (data === "c") {
      this.ctx.state.selectedLine = cloneLineAfter(
        this.ctx.state.store.lines,
        this.ctx.state.selectedLine,
        (widget) => registry.cloneWidget(widget),
      );
      this.ctx.emitChange();
    } else if (data === "w") this.move(-1);
    else if (data === "s") this.move(1);
    else if (data === "d") this.delete();
  }

  private page(delta: -1 | 1): void {
    this.ctx.state.selectedLine = pageSelection(
      this.ctx.state.selectedLine,
      this.ctx.state.store.lines.length,
      this.ctx.visibleRowCount(),
      delta,
    );
  }

  private move(delta: number): void {
    const next = moveLine(this.ctx.state.store.lines, this.ctx.state.selectedLine, delta);
    if (next === this.ctx.state.selectedLine) return;
    this.ctx.state.selectedLine = next;
    this.ctx.emitChange();
  }

  private delete(): void {
    const previousLength = this.ctx.state.store.lines.length;
    this.ctx.state.selectedLine = deleteLine(
      this.ctx.state.store.lines,
      this.ctx.state.selectedLine,
    );
    if (this.ctx.state.store.lines.length !== previousLength) this.ctx.emitChange();
  }
}
