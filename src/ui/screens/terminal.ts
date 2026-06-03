import { Key, matchesKey } from "@earendil-works/pi-tui";

import type { ColorLevel } from "../../colors.js";
import {
  COLOR_LEVEL_CONFIRM_HINT,
  COLOR_LEVEL_CONFIRM_WARNING,
  colorLevelConfirmAction,
  colorLevelConfirmValueLabel,
} from "../color-level-confirm.js";
import { hasCustomAnsiColors, resetCustomAnsiColors } from "../color-options.js";
import { wrap } from "../helpers.js";
import type { ScreenContext } from "../screen-context.js";
import type { ScreenRender } from "../screen-render.js";
import {
  nextTerminalColorLevel,
  nextTerminalWidthMode,
  TERMINAL_MENU_ACTIONS,
  TERMINAL_MENU_HINT,
  terminalMenuAction,
  terminalMenuFields,
} from "../terminal-menu.js";
import { Controller } from "./controller.js";

export class TerminalState {
  pendingColorLevel: ColorLevel | undefined;
}

export class TerminalScreen extends Controller {
  private selected = 0;

  constructor(
    ctx: ScreenContext,
    render: ScreenRender,
    private readonly terminalState: TerminalState,
  ) {
    super(ctx, render);
  }

  renderScreen(width: number): string[] {
    const fields = terminalMenuFields(this.ctx.state.store.settings);
    return [
      this.render.line(
        this.render.menuTitle(
          "Terminal Options",
          "Configure terminal width behavior and color level",
        ),
        width,
      ),
      this.render.line(this.ctx.theme.dim(TERMINAL_MENU_HINT), width),
      ...fields.map((field, index) => this.render.menuLine(index === this.selected, field, width)),
    ];
  }

  handleInput(data: string): void {
    if (matchesKey(data, Key.up))
      this.selected = wrap(this.selected - 1, TERMINAL_MENU_ACTIONS.length);
    else if (matchesKey(data, Key.down))
      this.selected = wrap(this.selected + 1, TERMINAL_MENU_ACTIONS.length);
    else if (matchesKey(data, Key.left)) this.adjust(-1);
    else if (matchesKey(data, Key.right) || matchesKey(data, Key.enter)) this.adjust(1);
  }

  private adjust(delta: number): void {
    if (terminalMenuAction(this.selected) === "width-mode") {
      this.ctx.state.store.settings.terminal.widthMode = nextTerminalWidthMode(
        this.ctx.state.store.settings,
        delta,
      );
      this.ctx.emitChange();
      return;
    }
    const settings = this.ctx.state.store.settings;
    const next = nextTerminalColorLevel(settings, delta);
    if (next !== settings.terminal.colorLevel && hasCustomAnsiColors(this.ctx.state.store.lines)) {
      this.terminalState.pendingColorLevel = next;
      this.ctx.show("confirm-color-level");
      return;
    }
    settings.terminal.colorLevel = next;
    this.ctx.emitChange();
  }
}

export class ColorLevelConfirmScreen extends Controller {
  constructor(
    ctx: ScreenContext,
    render: ScreenRender,
    private readonly terminalState: TerminalState,
  ) {
    super(ctx, render);
  }

  renderScreen(width: number): string[] {
    return [
      this.render.line(this.ctx.theme.warning(COLOR_LEVEL_CONFIRM_WARNING), width),
      this.render.line(colorLevelConfirmValueLabel(this.terminalState.pendingColorLevel), width),
      this.render.line(this.ctx.theme.dim(COLOR_LEVEL_CONFIRM_HINT), width),
    ];
  }

  handleInput(data: string): void {
    const action = colorLevelConfirmAction(
      data,
      matchesKey(data, Key.escape),
      matchesKey(data, Key.enter),
    );
    if (action === "cancel") {
      this.terminalState.pendingColorLevel = undefined;
      this.ctx.show("terminal");
      return;
    }
    if (action === "confirm") {
      if (this.terminalState.pendingColorLevel)
        this.ctx.state.store.settings.terminal.colorLevel = this.terminalState.pendingColorLevel;
      resetCustomAnsiColors(this.ctx.state.store.lines);
      this.terminalState.pendingColorLevel = undefined;
      this.ctx.show("terminal");
      this.ctx.emitChange();
    }
  }
}
