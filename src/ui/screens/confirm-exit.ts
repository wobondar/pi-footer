import { Key, matchesKey } from "@earendil-works/pi-tui";

import { wrap } from "../helpers.js";
import { Controller } from "./controller.js";

const ITEMS = ["Save & Exit", "Exit without saving", "Return to config UI"] as const;
const HINT = "↑/↓ select • enter confirm • s save • x discard • esc/r back";

export class ConfirmExitScreen extends Controller {
  private selected = 0;

  renderScreen(width: number): string[] {
    return [
      this.render.line(
        this.render.menuTitle("Unsaved changes", "Choose how to close configuration"),
        width,
      ),
      this.render.line(this.ctx.theme.dim(HINT), width),
      this.render.line(
        this.ctx.theme.warning("You have unsaved pi-footer configuration changes."),
        width,
      ),
      ...ITEMS.map((item, index) => this.render.menuLine(index === this.selected, item, width)),
    ];
  }

  handleInput(data: string): void {
    if (matchesKey(data, Key.escape)) this.returnToConfigUi();
    else if (matchesKey(data, Key.up) || matchesKey(data, Key.left))
      this.selected = wrap(this.selected - 1, ITEMS.length);
    else if (matchesKey(data, Key.down) || matchesKey(data, Key.right))
      this.selected = wrap(this.selected + 1, ITEMS.length);
    else if (matchesKey(data, Key.enter)) this.selectedAction();
    else this.shortcutAction(data);
  }

  private selectedAction(): void {
    if (this.selected === 0) return this.ctx.save(true);
    if (this.selected === 1) return this.ctx.exitWithoutSaving();
    return this.returnToConfigUi();
  }

  private shortcutAction(data: string): void {
    if (data === "s") return this.ctx.save(true);
    if (data === "x") return this.ctx.exitWithoutSaving();
    if (data === "r") return this.returnToConfigUi();
  }

  private returnToConfigUi(): void {
    this.ctx.show(this.ctx.state.viewBeforeConfirmExit);
  }
}
