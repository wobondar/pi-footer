import type { WidgetEntry, WidgetOptions } from "../types.ts";
import { ActiveToolsWidget } from "./core/active-tools.ts";
import { ContextWindowWidget } from "./core/context-window.ts";
import { CwdBasenameWidget } from "./core/cwd-basename.ts";
import { CwdWidget } from "./core/cwd.ts";
import { EventValueWidget } from "./core/event.ts";
import { ExtensionStatusWidget } from "./core/external-status.ts";
import { ModelProviderWidget } from "./core/model-provider.ts";
import { ModelWidget } from "./core/model.ts";
import { ProviderWidget } from "./core/provider.ts";
import { SessionNameWidget } from "./core/session-name.ts";
import { TextVerbosityWidget } from "./core/text-verbosity.ts";
import { ThinkingLevelWidget } from "./core/thinking-level.ts";
import { GitAheadBehindWidget } from "./git/ahead-behind.ts";
import { GitBranchWidget } from "./git/branch.ts";
import { GitCleanStatusWidget } from "./git/clean.ts";
import { GitDeletionsWidget } from "./git/deletions.ts";
import { GitDiffWidget } from "./git/diff.ts";
import { GitInsertionsWidget } from "./git/insertions.ts";
import { GitRemoteWidget } from "./git/remote.ts";
import { GitRootDirWidget } from "./git/root.ts";
import { GitShaWidget } from "./git/sha.ts";
import { GitStagedWidget } from "./git/staged.ts";
import { GitStatusWidget } from "./git/status.ts";
import { GitUnstagedWidget } from "./git/unstaged.ts";
import { GitUntrackedWidget } from "./git/untracked.ts";
import { WidgetInstance } from "./instance.ts";
import { CustomTextWidget } from "./layout/custom-text.ts";
import { FlexSeparatorWidget } from "./layout/flex-separator.ts";
import { SeparatorWidget } from "./layout/separator.ts";
import { SpacerWidget } from "./layout/spacer.ts";
import { sanitizeOptionsFromSpec } from "./options.ts";
import { RuntimeWidget } from "./project/runtime.ts";
import { AssistantMessagesWidget } from "./session/assistant-messages.ts";
import { CompactionsWidget } from "./session/compactions.ts";
import { ElapsedWidget } from "./session/elapsed.ts";
import { LastActivityWidget } from "./session/last-activity.ts";
import { MessagesWidget } from "./session/messages.ts";
import { SessionIdWidget } from "./session/session-id.ts";
import { SessionStartWidget } from "./session/session-start.ts";
import { ToolResultsWidget } from "./session/tool-results.ts";
import { TotalMessagesWidget } from "./session/total-messages.ts";
import { TotalTimeWidget } from "./session/total-time.ts";
import { UserMessagesWidget } from "./session/user-messages.ts";
import { CacheHitRateWidget } from "./tokens/cache-hit-rate.ts";
import { CacheReadWidget } from "./tokens/cache-read.ts";
import { CacheWriteWidget } from "./tokens/cache-write.ts";
import { ContextBarWidget } from "./tokens/context-bar.ts";
import { ContextLengthWidget } from "./tokens/context-length.ts";
import { ContextRemainingWidget } from "./tokens/context-remaining.ts";
import { ContextWidget } from "./tokens/context.ts";
import { CostWidget } from "./tokens/cost.ts";
import { InputSpeedWidget } from "./tokens/input-speed.ts";
import { InputTokensWidget } from "./tokens/input-tokens.ts";
import { OutputSpeedWidget } from "./tokens/output-speed.ts";
import { OutputTokensWidget } from "./tokens/output-tokens.ts";
import { TokensWidget } from "./tokens/tokens.ts";
import { TotalSpeedWidget } from "./tokens/total-speed.ts";
import { TotalTokensWidget } from "./tokens/total-tokens.ts";
import type { Widget } from "./types.ts";

const WIDGETS = [
  ModelWidget,
  ProviderWidget,
  ModelProviderWidget,
  ThinkingLevelWidget,
  TextVerbosityWidget,
  ContextWindowWidget,
  ActiveToolsWidget,
  SessionNameWidget,
  CwdWidget,
  CwdBasenameWidget,
  EventValueWidget,
  ExtensionStatusWidget,
  CustomTextWidget,
  SeparatorWidget,
  SpacerWidget,
  FlexSeparatorWidget,
  RuntimeWidget,
  AssistantMessagesWidget,
  CompactionsWidget,
  ElapsedWidget,
  LastActivityWidget,
  MessagesWidget,
  SessionIdWidget,
  SessionStartWidget,
  ToolResultsWidget,
  TotalMessagesWidget,
  TotalTimeWidget,
  UserMessagesWidget,
  GitAheadBehindWidget,
  GitBranchWidget,
  GitCleanStatusWidget,
  GitDeletionsWidget,
  GitDiffWidget,
  GitInsertionsWidget,
  GitRemoteWidget,
  GitRootDirWidget,
  GitShaWidget,
  GitStagedWidget,
  GitStatusWidget,
  GitUnstagedWidget,
  GitUntrackedWidget,
  ContextBarWidget,
  ContextLengthWidget,
  ContextWidget,
  ContextRemainingWidget,
  CostWidget,
  CacheReadWidget,
  CacheWriteWidget,
  CacheHitRateWidget,
  TokensWidget,
  InputTokensWidget,
  OutputTokensWidget,
  TotalTokensWidget,
  InputSpeedWidget,
  OutputSpeedWidget,
  TotalSpeedWidget,
] as const;

export type WidgetSpecUnion = (typeof WIDGETS)[number];
export type WidgetType = WidgetSpecUnion["type"];
export type WidgetCategory = WidgetSpecUnion["category"];

export interface WidgetDefinition {
  readonly type: WidgetType;
  readonly label: string;
  readonly category: WidgetCategory;
  readonly description: string;
}

interface WidgetRegistry {
  readonly specs: readonly WidgetSpecUnion[];
  readonly definitions: readonly WidgetDefinition[];
  readonly types: readonly WidgetType[];
  readonly typeSet: ReadonlySet<WidgetType>;

  spec(type: WidgetType): WidgetSpecUnion;
  maybeSpec(type: string): WidgetSpecUnion | undefined;
  createEntry(type: WidgetType, options?: Record<string, unknown>): WidgetEntry;
  cloneEntry(entry: WidgetEntry): WidgetEntry;
  normalizeOptions(type: WidgetType, input: Record<string, unknown>): WidgetOptions;
  createWidget(type: WidgetType, options?: Record<string, unknown>): Widget;
  cloneWidget(widget: Widget): Widget;
  hydrateWidget(entry: WidgetEntry): Widget;
}

function createWidgetRegistry(widgets: readonly WidgetSpecUnion[]): WidgetRegistry {
  const specs = [...widgets];
  const specsByType = new Map<WidgetType, WidgetSpecUnion>(
    specs.map((spec) => [spec.type as WidgetType, spec]),
  );
  const definitions = specs.map(definitionFromWidgetSpec);
  const types = definitions.map((definition) => definition.type);
  const typeSet = new Set<WidgetType>(types);

  const specFor = (type: WidgetType): WidgetSpecUnion => {
    const spec = specsByType.get(type);
    if (!spec) throw new Error(`Unsupported widget type: ${type}`);
    return spec;
  };

  const buildEntry = (
    type: WidgetType,
    options: Record<string, unknown> = {},
    enabled = true,
  ): WidgetEntry => ({
    id: `${type}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    type,
    enabled,
    options: sanitizeOptionsFromSpec(specFor(type), options),
  });

  return {
    specs,
    definitions,
    types,
    typeSet,
    spec(type) {
      return specFor(type);
    },
    maybeSpec(type) {
      return specsByType.get(type as WidgetType);
    },
    createEntry(type, options = {}) {
      return buildEntry(type, options);
    },
    normalizeOptions(type, input) {
      return sanitizeOptionsFromSpec(specFor(type), input);
    },
    cloneEntry(entry) {
      return buildEntry(entry.type, entry.options, entry.enabled);
    },
    createWidget(type, options = {}) {
      return new WidgetInstance(specFor(type), buildEntry(type, options));
    },
    cloneWidget(widget) {
      return new WidgetInstance(
        specFor(widget.type),
        buildEntry(widget.type, widget.options, widget.enabled),
      );
    },
    hydrateWidget(entry) {
      return new WidgetInstance(specFor(entry.type), {
        id: entry.id,
        type: entry.type,
        enabled: entry.enabled,
        options: { ...entry.options },
      });
    },
  };
}

function definitionFromWidgetSpec(spec: WidgetSpecUnion): WidgetDefinition {
  return {
    type: spec.type as WidgetType,
    label: spec.label,
    category: spec.category as WidgetCategory,
    description: spec.description,
  };
}

export const registry = createWidgetRegistry(WIDGETS);
