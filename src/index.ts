import type {
  ExtensionAPI,
  ExtensionCommandContext,
  ExtensionContext,
} from "@earendil-works/pi-coding-agent";
import { truncateToWidth } from "@earendil-works/pi-tui";

import {
  cloneConfig,
  configWithPreset,
  DEFAULT_CONFIG,
  isPreset,
  loadConfig,
  saveConfig,
  STATUS_KEY,
} from "./config.js";
import { EventWidgetValues, UPDATE_EVENT_WIDGET_EVENT } from "./event-widgets.js";
import {
  EMPTY_EXTENSION_STATUSES,
  visibleExtensionStatusRowEntries,
} from "./extension-statuses.js";
import { EMPTY_GIT_INFO, getGitInfo, hasEnabledGitWidgets, loadGitInfo } from "./git.js";
import { collectSessionMetrics } from "./metrics.js";
import { renderStatuslines } from "./render.js";
import { isRecord, type GitInfo, type StatuslineConfig, type StatuslineData } from "./types.js";
import { openStatuslineConfigUi } from "./ui.js";
import { WidgetStore } from "./widgets/store.js";

// Structural mirror of pi's footerData — collectStatuslineData only needs the branch getter.
interface FooterDataLike {
  getGitBranch(): string | null;
}

export default async function statuslineExtension(pi: ExtensionAPI): Promise<void> {
  let config = await loadConfig();
  let widgetStore = WidgetStore.fromConfig(config);
  const eventWidgets = new EventWidgetValues();
  let liveTextVerbosity: string | undefined;
  let renderCurrentFooter: (() => void) | undefined;
  let getExtensionStatuses = (): ReadonlyMap<string, string> => EMPTY_EXTENSION_STATUSES;

  function apply(ctx: ExtensionContext | ExtensionCommandContext): void {
    if (!ctx.hasUI || !config.enabled) {
      ctx.ui.setFooter(undefined);
      ctx.ui.setStatus(STATUS_KEY, undefined);
      return;
    }

    ctx.ui.setStatus(STATUS_KEY, ctx.ui.theme.fg("accent", "pi-footer"));
    ctx.ui.setFooter((tui, theme, footerData) => {
      getExtensionStatuses = () => footerData.getExtensionStatuses();
      renderCurrentFooter = () => tui.requestRender();
      const unsubscribeBranch = footerData.onBranchChange(() => tui.requestRender());
      return {
        dispose(): void {
          unsubscribeBranch();
          if (renderCurrentFooter) renderCurrentFooter = undefined;
          getExtensionStatuses = () => EMPTY_EXTENSION_STATUSES;
        },
        invalidate(): void {},
        render(width: number): string[] {
          const data = collectStatuslineData(ctx, pi, footerData, eventWidgets.values, {
            config,
            requestRender: () => tui.requestRender(),
            textVerbosity: liveTextVerbosity,
          });
          const lines = renderStatuslines(widgetStore, data, width, {
            getExtensionStatuses,
            theme,
            requestRender: () => tui.requestRender(),
          });
          if (lines.length === 0) return [];

          const statuses = visibleExtensionStatusRowEntries(
            footerData.getExtensionStatuses(),
            config.extensionStatusRow.hiddenKeys,
            STATUS_KEY,
          ).map((entry) => entry.value);
          const renderedLines = lines.map((line) => truncateToWidth(line, width, "…"));
          if (statuses.length === 0) return renderedLines;
          return [
            ...renderedLines,
            truncateToWidth(theme.fg("dim", statuses.join(" ")), width, "…"),
          ];
        },
      };
    });
  }

  function replaceConfig(next: StatuslineConfig): void {
    config = next;
    widgetStore = WidgetStore.fromConfig(config);
  }

  async function setConfig(
    next: StatuslineConfig,
    ctx: ExtensionContext | ExtensionCommandContext,
  ): Promise<void> {
    replaceConfig(next);
    await saveConfig(config);
    apply(ctx);
  }

  pi.events.on(UPDATE_EVENT_WIDGET_EVENT, (payload: unknown) => {
    const changed = eventWidgets.update(payload);
    if (changed) renderCurrentFooter?.();
  });

  // pi has no verbosity accessor; capture the real value from the actual provider
  // request payload. Passive — the footer picks it up on its next render rather than
  // forcing one. Only the openai-codex-responses payload carries text.verbosity.
  //
  // Handlers run in extension load order and the payload is chained forward, so we
  // observe it as of our own position in that chain (we return undefined and never
  // mutate it). A custom provider that bakes verbosity into the body is always seen;
  // a later-loaded extension that rewrites text.verbosity in its own
  // before_provider_request handler is the one case we'd miss.
  pi.on("before_provider_request", (event) => {
    const verbosity = readTextVerbosity(event.payload);
    if (verbosity !== undefined) liveTextVerbosity = verbosity;
  });

  pi.registerCommand("footer", {
    description: "Configure the pi statusline/footer",
    handler: async (args, ctx) => {
      const handled = await handleArgs(args, ctx, config, async (next) => setConfig(next, ctx));
      if (handled) return;

      const previewData = collectStatuslineData(
        ctx,
        pi,
        {
          getGitBranch: () => "main",
        },
        eventWidgets.values,
        {
          collectGit: true,
          git: await loadGitInfo(pi, ctx.cwd, "main"),
          textVerbosity: liveTextVerbosity,
        },
      );
      const result = await openStatuslineConfigUi(
        ctx,
        config,
        previewData,
        (updated) => {
          replaceConfig(updated);
          apply(ctx);
        },
        async (updated) => setConfig(updated, ctx),
        getExtensionStatuses,
      );
      replaceConfig(result.config);
      apply(ctx);
    },
  });

  pi.on("session_start", async (_event, ctx) => {
    replaceConfig(await loadConfig());
    apply(ctx);
  });

  pi.on("model_select", async (_event, ctx) => {
    // A new model selection invalidates the captured verbosity; fall back to the
    // provider default until the next request reveals the real value.
    liveTextVerbosity = undefined;
    apply(ctx);
  });

  pi.on("session_shutdown", (_event, ctx) => {
    ctx.ui.setFooter(undefined);
    ctx.ui.setStatus(STATUS_KEY, undefined);
  });
}

function collectStatuslineData(
  ctx: ExtensionContext | ExtensionCommandContext,
  pi: ExtensionAPI,
  footerData: FooterDataLike,
  eventWidgets: ReadonlyMap<string, string>,
  options: {
    config?: StatuslineConfig;
    collectGit?: boolean;
    requestRender?: () => void;
    git?: GitInfo;
    textVerbosity?: string | undefined;
  } = {},
): StatuslineData {
  const contextUsage = ctx.getContextUsage();
  const collectGit =
    options.collectGit ?? (options.config ? hasEnabledGitWidgets(options.config) : true);
  return {
    model: ctx.model?.id,
    provider: ctx.model?.provider,
    sessionName: pi.getSessionName(),
    sessionId: ctx.sessionManager.getSessionId(),
    thinkingLevel: ctx.model?.reasoning ? pi.getThinkingLevel() : undefined,
    textVerbosity: getTextVerbosity(ctx.model, options.textVerbosity),
    git:
      options.git ??
      (collectGit
        ? getGitInfo(pi, ctx.cwd, footerData.getGitBranch(), options.requestRender ?? (() => {}))
        : EMPTY_GIT_INFO),
    cwd: ctx.cwd,
    activeToolCount: pi.getActiveTools().length,
    usingSubscription: ctx.model ? ctx.modelRegistry.isUsingOAuth(ctx.model) : false,
    contextTokens: contextUsage?.tokens ?? undefined,
    contextMaxTokens: contextUsage?.contextWindow,
    metrics: collectSessionMetrics(ctx.sessionManager.getBranch()),
    eventWidgets,
  };
}

async function handleArgs(
  args: string,
  ctx: ExtensionCommandContext,
  currentConfig: StatuslineConfig,
  setConfig: (config: StatuslineConfig) => Promise<void>,
): Promise<boolean> {
  const [command, value] = args.trim().split(/\s+/, 2);
  if (!command) return false;

  if (command === "on" || command === "enable") {
    await setConfig({ ...currentConfig, enabled: true });
    ctx.ui.notify("pi-footer enabled", "info");
    return true;
  }
  if (command === "off" || command === "disable") {
    await setConfig({ ...currentConfig, enabled: false });
    ctx.ui.notify("pi-footer disabled", "info");
    return true;
  }
  if (command === "reset") {
    await setConfig(cloneConfig(DEFAULT_CONFIG));
    ctx.ui.notify("pi-footer reset to defaults", "info");
    return true;
  }
  if (command === "preset" && isPreset(value)) {
    await setConfig(configWithPreset(currentConfig, value));
    ctx.ui.notify(`pi-footer preset: ${value}`, "info");
    return true;
  }

  ctx.ui.notify(
    "Usage: /footer [on|off|reset|preset compact|default|powerline|powerline-bright|powerline-blocks|powerline-mono|git-heavy|pi-footer|demo|demo-standard]",
    "warning",
  );
  return true;
}

function getTextVerbosity(
  model: ExtensionContext["model"],
  liveVerbosity: string | undefined,
): string | undefined {
  // pi exposes text verbosity only through the OpenAI Codex Responses provider.
  if (!model || model.api !== "openai-codex-responses") return undefined;
  // Prefer the value captured from the real request payload; before the first
  // request (or just after a model switch) fall back to the provider default.
  return liveVerbosity ?? "low";
}

function readTextVerbosity(payload: unknown): string | undefined {
  if (!isRecord(payload)) return undefined;
  const text = payload.text;
  if (!isRecord(text)) return undefined;
  return typeof text.verbosity === "string" ? text.verbosity : undefined;
}
