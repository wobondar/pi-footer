import { Key, matchesKey } from "@earendil-works/pi-tui";

import {
  extensionStatusRowCount,
  extensionStatusRowLines,
  toggleExtensionStatusRowSelection,
} from "../extension-statuses.js";
import { wrap } from "../helpers.js";
import { pageSelection } from "../navigation.js";
import { Controller } from "./controller.js";

export class ExtensionStatusRowScreen extends Controller {
  private selected = 0;

  renderScreen(width: number): string[] {
    return extensionStatusRowLines(
      this.ctx.state.store.settings,
      this.ctx.getExtensionStatuses,
      this.selected,
      width,
      (title, subtitle) => this.render.menuTitle(title, subtitle),
      (content, lineWidth) => this.render.line(content, lineWidth),
      (selected, content, lineWidth) => this.render.menuLine(selected, content, lineWidth),
      (value) => this.ctx.theme.dim(value),
      (value) => this.ctx.theme.success(value),
      (value) => this.ctx.theme.warning(value),
    );
  }

  handleInput(data: string): void {
    const count = extensionStatusRowCount(
      this.ctx.state.store.settings,
      this.ctx.getExtensionStatuses,
    );
    if (matchesKey(data, Key.up)) this.selected = wrap(this.selected - 1, Math.max(1, count));
    else if (matchesKey(data, Key.down))
      this.selected = wrap(this.selected + 1, Math.max(1, count));
    else if (matchesKey(data, Key.pageUp)) this.page(count, -1);
    else if (matchesKey(data, Key.pageDown)) this.page(count, 1);
    else if (
      matchesKey(data, Key.space) ||
      matchesKey(data, Key.left) ||
      matchesKey(data, Key.right) ||
      matchesKey(data, Key.enter)
    ) {
      if (
        toggleExtensionStatusRowSelection(
          this.ctx.state.store.settings,
          this.ctx.getExtensionStatuses,
          this.selected,
        )
      ) {
        this.ctx.emitChange();
      }
    }
  }

  private page(count: number, delta: -1 | 1): void {
    this.selected = pageSelection(this.selected, count, this.ctx.visibleRowCount(), delta);
  }
}
