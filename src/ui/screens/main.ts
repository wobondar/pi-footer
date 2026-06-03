import { Key, matchesKey } from "@earendil-works/pi-tui";

import { wrap } from "../helpers.js";
import type { ScreenView } from "../model.js";
import { Controller } from "./controller.js";

type MenuAction =
  | { type: "view"; view: ScreenView }
  | { type: "save-exit" }
  | { type: "discard-exit" };

interface MenuItem {
  label: string;
  description: string;
  action: MenuAction;
}

const HINT = "↑/↓ select • enter option • ctrl+s save • esc exit";

const ITEMS: readonly MenuItem[] = [
  {
    label: "Edit lines",
    description: "Manage status lines and line widgets",
    action: { type: "view", view: "line-list" },
  },
  {
    label: "Edit colors",
    description: "Configure per-widget foreground/background/bold",
    action: { type: "view", view: "color-line-list" },
  },
  {
    label: "Terminal Options",
    description: "Terminal width and color level",
    action: { type: "view", view: "terminal" },
  },
  {
    label: "Global Overrides",
    description: "Global presets, separators, icons, minimalist mode",
    action: { type: "view", view: "global" },
  },
  {
    label: "Pi extensions",
    description: "Published statuses and extension status row visibility",
    action: { type: "view", view: "extension-status-row" },
  },
  {
    label: "Save & Exit",
    description: "Persist changes and close the configuration UI",
    action: { type: "save-exit" },
  },
  {
    label: "Exit without saving",
    description: "Discard unsaved changes and close immediately",
    action: { type: "discard-exit" },
  },
];

export class MainScreen extends Controller {
  private selected = 0;

  renderScreen(width: number): string[] {
    return [
      this.render.line(
        this.render.menuTitle(
          "Main Menu",
          "Configure any number of status lines with various widgets",
        ),
        width,
      ),
      this.render.line(this.ctx.theme.dim(HINT), width),
      ...ITEMS.map((item, index) =>
        this.render.menuLine(
          index === this.selected,
          `${item.label} ${this.ctx.theme.dim(item.description)}`,
          width,
        ),
      ),
    ];
  }

  handleInput(data: string): void {
    if (matchesKey(data, Key.up)) this.selected = wrap(this.selected - 1, ITEMS.length);
    else if (matchesKey(data, Key.down)) this.selected = wrap(this.selected + 1, ITEMS.length);
    else if (matchesKey(data, Key.enter)) this.applySelectedAction();
  }

  private menuAction(index: number): MenuAction | undefined {
    return ITEMS[index]?.action;
  }

  private applySelectedAction(): void {
    const action = this.menuAction(this.selected);
    if (!action) return;

    if (action.type === "view") this.ctx.show(action.view);
    else if (action.type === "save-exit") this.ctx.save(true);
    else this.ctx.exitWithoutSaving();
  }
}
