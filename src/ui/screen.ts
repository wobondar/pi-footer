import { Key, matchesKey } from "@earendil-works/pi-tui";

import { cloneConfig } from "../config.js";
import type { GetExtensionStatuses } from "../extension-statuses.js";
import type { StatuslineConfig, StatuslineData } from "../types.js";
import { WidgetStore } from "../widgets/store.js";
import type { Widget } from "../widgets/types.js";
import { ConfigLifecycle, type ConfigUiResult } from "./config-lifecycle.js";
import { escapeTarget } from "./helpers.js";
import { activeLineCount, visibleRowCount } from "./layout.js";
import { CONFIG_UI_HEIGHT_RATIO, type ScreenView } from "./model.js";
import { OverlayRender } from "./overlay-render.js";
import type { ScreenContext } from "./screen-context.js";
import { ScreenController } from "./screen-controller.js";
import { ScreenRender } from "./screen-render.js";
import { createScreenState, type ScreenState } from "./screen-state.js";
import { AddWidgetScreen } from "./screens/add-widget.js";
import { ConfirmExitScreen } from "./screens/confirm-exit.js";
import { EditColorsScreen } from "./screens/edit-colors.js";
import { EditWidgetScreen } from "./screens/edit-widget.js";
import { ExtensionStatusRowScreen } from "./screens/extension-status-row.js";
import { GlobalScreen } from "./screens/global.js";
import { LineListScreen } from "./screens/line-list.js";
import { MainScreen } from "./screens/main.js";
import { ColorLevelConfirmScreen, TerminalScreen, TerminalState } from "./screens/terminal.js";
import { WidgetListScreen } from "./screens/widget-list.js";
import { createUiTheme, type ThemeProvider, type UiTheme } from "./theme.js";
import { RETRO_FRAME_INTERVAL_MS } from "./title-bar.js";

export class StatuslineConfigScreen {
  private readonly state: ScreenState;
  private readonly lifecycle: ConfigLifecycle;
  private readonly theme: UiTheme;
  private readonly screenRender: ScreenRender;
  private readonly overlayRender: OverlayRender;
  private readonly screenContext: ScreenContext;
  private readonly screenController: ScreenController;
  private saving = false;
  private readonly animationTimer: ReturnType<typeof setInterval>;

  constructor(
    config: StatuslineConfig,
    private readonly previewData: StatuslineData,
    private readonly getExtensionStatuses: GetExtensionStatuses,
    private readonly requestRender: () => void,
    private readonly getTerminalRows: () => number,
    private readonly props: {
      onChange(config: StatuslineConfig): void;
      onSave(config: StatuslineConfig): Promise<void>;
      onClose(result: ConfigUiResult): void;
      getTheme: ThemeProvider;
    },
  ) {
    this.state = createScreenState(WidgetStore.fromConfig(cloneConfig(config)));
    this.lifecycle = new ConfigLifecycle(config);
    this.theme = createUiTheme(props.getTheme);
    this.screenRender = new ScreenRender(this.theme);
    this.overlayRender = new OverlayRender(this.theme, this.screenRender);
    this.screenContext = this.createScreenContext();
    this.screenController = new ScreenController(this.screenContext);
    this.registerScreens();
    this.animationTimer = setInterval(this.requestRender, RETRO_FRAME_INTERVAL_MS);
  }

  render(width: number): string[] {
    return this.overlayRender.render({
      width,
      terminalRows: this.getTerminalRows(),
      activeLineCount: this.getActiveLineCount(),
      visibleRowCount: this.getVisibleRowCount(),
      store: this.state.store,
      previewData: this.previewData,
      getExtensionStatuses: this.getExtensionStatuses,
      theme: this.props.getTheme(),
      requestRender: this.requestRender,
      configStateText: this.lifecycle.label
        ? this.theme.configStateLabel(this.lifecycle.state, this.lifecycle.label)
        : "",
      body: this.screenController.renderScreen(width),
    });
  }

  invalidate(): void {}

  dispose(): void {
    clearInterval(this.animationTimer);
  }

  handleInput(data: string): void {
    if (matchesKey(data, Key.ctrl("s"))) {
      void this.saveConfig(false);
      return;
    }

    if (this.state.view === "confirm-color-level" || this.state.view === "confirm-exit") {
      this.screenController.handleInput(data);
      return;
    }

    if (matchesKey(data, Key.escape)) {
      const target = escapeTarget(this.state.view);
      if (target === "close") this.requestExit();
      else this.show(target);
      return;
    }

    this.screenController.handleInput(data);
  }

  private registerScreens(): void {
    const terminalState = new TerminalState();
    this.screenController.register("main", new MainScreen(this.screenContext, this.screenRender));
    this.screenController.register(
      "line-list",
      new LineListScreen(this.screenContext, this.screenRender, "Edit lines", "widget-list"),
    );
    this.screenController.register(
      "color-line-list",
      new LineListScreen(this.screenContext, this.screenRender, "Edit colors", "color-widget-list"),
    );
    this.screenController.register(
      "widget-list",
      new WidgetListScreen(this.screenContext, this.screenRender, false),
    );
    this.screenController.register(
      "color-widget-list",
      new WidgetListScreen(this.screenContext, this.screenRender, true),
    );
    this.screenController.register(
      "add-widget",
      new AddWidgetScreen(this.screenContext, this.screenRender),
    );
    this.screenController.register(
      "edit-widget",
      new EditWidgetScreen(this.screenContext, this.screenRender),
    );
    this.screenController.register(
      "edit-colors",
      new EditColorsScreen(this.screenContext, this.screenRender),
    );
    this.screenController.register(
      "terminal",
      new TerminalScreen(this.screenContext, this.screenRender, terminalState),
    );
    this.screenController.register(
      "confirm-color-level",
      new ColorLevelConfirmScreen(this.screenContext, this.screenRender, terminalState),
    );
    this.screenController.register(
      "confirm-exit",
      new ConfirmExitScreen(this.screenContext, this.screenRender),
    );
    this.screenController.register(
      "global",
      new GlobalScreen(this.screenContext, this.screenRender),
    );
    this.screenController.register(
      "extension-status-row",
      new ExtensionStatusRowScreen(this.screenContext, this.screenRender),
    );
  }

  private createScreenContext(): ScreenContext {
    return {
      state: this.state,
      theme: this.theme,
      getExtensionStatuses: this.getExtensionStatuses,
      currentLine: () => this.currentLine(),
      currentWidget: () => this.currentWidget(),
      visibleRowCount: () => this.getVisibleRowCount(),
      show: (view) => this.show(view),
      emitChange: () => this.emitChange(),
      save: (exitAfterSave) => void this.saveConfig(exitAfterSave),
      exitWithoutSaving: () => this.exitWithoutSaving(),
    };
  }

  private show(view: ScreenView): void {
    this.state.view = view;
  }

  private currentLine(): Widget[] {
    return this.state.store.lines[this.state.selectedLine] ?? this.state.store.lines[0] ?? [];
  }

  private currentWidget(): Widget | undefined {
    return this.currentLine()[this.state.selectedWidget];
  }

  private getVisibleRowCount(): number {
    return visibleRowCount(
      this.getTerminalRows(),
      CONFIG_UI_HEIGHT_RATIO,
      this.getActiveLineCount(),
    );
  }

  private getActiveLineCount(): number {
    return activeLineCount(this.state.store.lines);
  }

  private requestExit(): void {
    if (!this.lifecycle.dirty) {
      this.closeWithResult(this.lifecycle.closeResult(false));
      return;
    }
    this.state.viewBeforeConfirmExit = this.state.view;
    this.show("confirm-exit");
  }

  private exitWithoutSaving(): void {
    this.closeWithResult(this.lifecycle.closeResult(false));
  }

  private async saveConfig(exitAfterSave: boolean): Promise<void> {
    if (this.saving) return;
    this.saving = true;
    this.lifecycle.beginSave();
    this.requestRender();
    try {
      const config = cloneConfig(this.state.store.toConfig());
      await this.props.onSave(config);
      this.lifecycle.markSaved(config);
      if (exitAfterSave) this.closeWithResult(this.lifecycle.closeResult(true));
    } catch {
      this.lifecycle.markSaveFailed();
      // Error notification is handled by the save callback.
    } finally {
      this.saving = false;
      this.requestRender();
    }
  }

  private closeWithResult(result: ConfigUiResult): void {
    this.props.onChange(result.config);
    this.props.onClose(result);
  }

  private emitChange(): void {
    this.lifecycle.markChanged();
    this.props.onChange(cloneConfig(this.state.store.toConfig()));
  }
}
