import type { WidgetEntry, WidgetOptions } from "../types.js";
import { ActiveToolsWidget } from "./core/active-tools.js";
import { ContextWindowWidget } from "./core/context-window.js";
import { CwdBasenameWidget } from "./core/cwd-basename.js";
import { CwdWidget } from "./core/cwd.js";
import { EventValueWidget } from "./core/event.js";
import { ExtensionStatusWidget } from "./core/external-status.js";
import { ModelProviderWidget } from "./core/model-provider.js";
import { ModelWidget } from "./core/model.js";
import { ProviderWidget } from "./core/provider.js";
import { SessionNameWidget } from "./core/session-name.js";
import { TextVerbosityWidget } from "./core/text-verbosity.js";
import { ThinkingLevelWidget } from "./core/thinking-level.js";
import { GitAheadBehindWidget } from "./git/ahead-behind.js";
import { GitBranchWidget } from "./git/branch.js";
import { GitCleanStatusWidget } from "./git/clean.js";
import { GitDeletionsWidget } from "./git/deletions.js";
import { GitDiffWidget } from "./git/diff.js";
import { GitInsertionsWidget } from "./git/insertions.js";
import { GitRemoteWidget } from "./git/remote.js";
import { GitRootDirWidget } from "./git/root.js";
import { GitShaWidget } from "./git/sha.js";
import { GitStagedWidget } from "./git/staged.js";
import { GitStatusWidget } from "./git/status.js";
import { GitUnstagedWidget } from "./git/unstaged.js";
import { GitUntrackedWidget } from "./git/untracked.js";
import { WidgetInstance } from "./instance.js";
import { CustomTextWidget } from "./layout/custom-text.js";
import { FlexSeparatorWidget } from "./layout/flex-separator.js";
import { SeparatorWidget } from "./layout/separator.js";
import { SpacerWidget } from "./layout/spacer.js";
import { sanitizeOptionsFromSpec } from "./options.js";
import { RuntimeWidget } from "./project/runtime.js";
import { AssistantMessagesWidget } from "./session/assistant-messages.js";
import { CompactionsWidget } from "./session/compactions.js";
import { ElapsedWidget } from "./session/elapsed.js";
import { LastActivityWidget } from "./session/last-activity.js";
import { MessagesWidget } from "./session/messages.js";
import { SessionIdWidget } from "./session/session-id.js";
import { SessionStartWidget } from "./session/session-start.js";
import { ToolResultsWidget } from "./session/tool-results.js";
import { TotalMessagesWidget } from "./session/total-messages.js";
import { TotalTimeWidget } from "./session/total-time.js";
import { UserMessagesWidget } from "./session/user-messages.js";
import { CacheReadWidget } from "./tokens/cache-read.js";
import { CacheWriteWidget } from "./tokens/cache-write.js";
import { ContextBarWidget } from "./tokens/context-bar.js";
import { ContextLengthWidget } from "./tokens/context-length.js";
import { ContextRemainingWidget } from "./tokens/context-remaining.js";
import { ContextWidget } from "./tokens/context.js";
import { CostWidget } from "./tokens/cost.js";
import { InputSpeedWidget } from "./tokens/input-speed.js";
import { InputTokensWidget } from "./tokens/input-tokens.js";
import { OutputSpeedWidget } from "./tokens/output-speed.js";
import { OutputTokensWidget } from "./tokens/output-tokens.js";
import { TokensWidget } from "./tokens/tokens.js";
import { TotalSpeedWidget } from "./tokens/total-speed.js";
import { TotalTokensWidget } from "./tokens/total-tokens.js";
import type { Widget } from "./types.js";

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
