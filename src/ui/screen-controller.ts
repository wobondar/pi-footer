import type { ScreenContext } from "./screen-context.ts";
import type { ScreenView } from "./model.ts";
import type { Controller } from "./screens/controller.ts";

export class ScreenController {
  private readonly screens = new Map<ScreenView, Controller>();

  constructor(private readonly ctx: ScreenContext) {}

  register(view: ScreenView, screen: Controller): void {
    this.screens.set(view, screen);
  }

  renderScreen(width: number): string[] {
    return this.currentScreen().renderScreen(width);
  }

  handleInput(data: string): void {
    this.currentScreen().handleInput(data);
  }

  private currentScreen(): Controller {
    const screen = this.screens.get(this.ctx.state.view);
    if (!screen) throw new Error(`No screen registered for view: ${this.ctx.state.view}`);
    return screen;
  }
}
