import type { RenderStatuslineOptions } from "../render.js";
import type { StatuslineData } from "../types.js";
import type {
  BaseWidgetContext,
  WidgetContext,
  WidgetDependency,
  WidgetDependencyValues,
} from "./types.js";

export function contextForDependencies<const TDeps extends readonly WidgetDependency[]>(
  baseCtx: BaseWidgetContext,
  dependencies: TDeps,
  data: StatuslineData,
  options: RenderStatuslineOptions,
): WidgetContext<TDeps> {
  // getExtensionStatuses is read live from options, never snapshotted into data.
  const source: WidgetDependencyValues = {
    ...data,
    getExtensionStatuses: options.getExtensionStatuses,
  };
  const output: BaseWidgetContext & Partial<WidgetDependencyValues> = { ...baseCtx };
  const writableOutput = output as BaseWidgetContext & Partial<Record<WidgetDependency, unknown>>;
  for (const dependency of dependencies) {
    writableOutput[dependency] = source[dependency];
  }
  // TODO(widget-spec): remove this cast if TypeScript gains better support for dynamic object construction.
  return output as WidgetContext<TDeps>;
}
