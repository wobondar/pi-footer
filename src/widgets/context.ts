import type { StatuslineData } from "../types.js";
import type { RenderStatuslineOptions } from "../render.js";
import type {
  BaseWidgetContext,
  WidgetContext,
  WidgetDependency,
  WidgetDependencyValues,
} from "./types.js";

export const dependencyResolvers = {
  cwd: (data) => {
    return data.cwd;
  },
  model: (data) => {
    return data.model;
  },
  provider: (data) => {
    return data.provider;
  },
  sessionName: (data) => {
    return data.sessionName;
  },
  sessionId: (data) => {
    return data.sessionId;
  },
  thinkingLevel: (data) => {
    return data.thinkingLevel;
  },
  textVerbosity: (data) => {
    return data.textVerbosity;
  },
  metrics: (data) => {
    return data.metrics;
  },
  usingSubscription: (data) => {
    return data.usingSubscription;
  },
  git: (data) => {
    return data.git;
  },
  activeToolCount: (data) => {
    return data.activeToolCount;
  },
  contextTokens: (data) => {
    return data.contextTokens;
  },
  contextMaxTokens: (data) => {
    return data.contextMaxTokens;
  },
  eventWidgets: (data) => {
    return data.eventWidgets;
  },
  getExtensionStatuses: (_data, options) => {
    return options.getExtensionStatuses;
  },
} satisfies {
  [K in WidgetDependency]: (
    data: StatuslineData,
    options: RenderStatuslineOptions,
  ) => WidgetDependencyValues[K];
};

export function contextForDependencies<const TDeps extends readonly WidgetDependency[]>(
  baseCtx: BaseWidgetContext,
  dependencies: TDeps,
  data: StatuslineData,
  options: RenderStatuslineOptions,
): WidgetContext<TDeps> {
  const output: BaseWidgetContext & Partial<WidgetDependencyValues> = { ...baseCtx };
  const writableOutput = output as BaseWidgetContext & Partial<Record<WidgetDependency, unknown>>;
  for (const dependency of dependencies) {
    writableOutput[dependency] = dependencyResolvers[dependency](data, options);
  }
  // TODO(widget-spec): remove this cast if TypeScript gains better support for dynamic object construction.
  return output as WidgetContext<TDeps>;
}
