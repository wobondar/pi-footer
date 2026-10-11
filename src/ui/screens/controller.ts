import type { ScreenContext } from "../screen-context.ts";
import type { ScreenRender } from "../screen-render.ts";

export abstract class Controller {
  constructor(
    protected ctx: ScreenContext,
    protected readonly render: ScreenRender,
  ) {}

  abstract renderScreen(width: number): string[];
  abstract handleInput(data: string): void;
}
