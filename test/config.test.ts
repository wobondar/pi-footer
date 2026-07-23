import { mkdtemp, readFile, rm } from "node:fs/promises";
import { registry } from "../src/widgets/registry.js";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { getAgentDir } from "@earendil-works/pi-coding-agent";
import { afterEach, describe, expect, it } from "vitest";

import {
  configWithPreset,
  DEFAULT_CONFIG,
  getConfigPath,
  loadConfig,
  normalizeConfig,
  saveConfig,
} from "../src/config.js";

let tempDir: string | undefined;
const originalConfigEnv = process.env.PI_FOOTER_CONFIG;

afterEach(async () => {
  if (tempDir) await rm(tempDir, { recursive: true, force: true });
  tempDir = undefined;
  if (originalConfigEnv === undefined) delete process.env.PI_FOOTER_CONFIG;
  else process.env.PI_FOOTER_CONFIG = originalConfigEnv;
});

describe("config", () => {
  it("uses pi agent extension config path by default and supports env override", () => {
    delete process.env.PI_FOOTER_CONFIG;
    expect(getConfigPath()).toBe(join(getAgentDir(), "extensions", "pi-footer.json"));

    process.env.PI_FOOTER_CONFIG = "/tmp/custom-pi-footer.json";
    expect(getConfigPath()).toBe("/tmp/custom-pi-footer.json");
  });

  it("normalizes line widget arrays and preserves duplicates", () => {
    const config = normalizeConfig({
      lines: [
        [
          registry.createEntry("model"),
          registry.createEntry("cost"),
          registry.createEntry("model"),
        ],
      ],
      enabled: false,
    });
    expect(config.enabled).toBe(false);
    expect(config.lines[0]?.map((widget) => widget.type)).toEqual(["model", "cost", "model"]);
  });

  it("normalizes icon mode", () => {
    expect(normalizeConfig({ iconMode: "nerd" }).iconMode).toBe("nerd");
    expect(normalizeConfig({ iconMode: "text" }).iconMode).toBe("text");
    expect(normalizeConfig({ iconMode: "nonsense" }).iconMode).toBe(DEFAULT_CONFIG.iconMode);
  });

  it("applies presets", () => {
    const config = configWithPreset(DEFAULT_CONFIG, "compact");
    expect(config.lines[0]?.map((widget) => widget.type)).toEqual([
      "model",
      "thinking-level",
      "text-verbosity",
      "git-branch",
      "context",
      "cost",
    ]);
    expect(config.preset).toBe("compact");
    expect(config.separator).toBe("space");
    expect(config.terminal.widthMode).toBe("full-minus-40");
  });

  it("applies the powerline preset with explicit colored separator widgets", () => {
    const config = configWithPreset(DEFAULT_CONFIG, "powerline");

    expect(config.separator).toBe("none");
    expect(config.iconMode).toBe("nerd");
    expect(config.terminal.widthMode).toBe("full");
    expect(config.lines[0]?.map((widget) => widget.type)).toEqual([
      "model-provider",
      "separator",
      "git-branch",
      "separator",
      "tokens",
      "separator",
      "context-bar",
      "separator",
      "output-speed",
      "separator",
      "total-time",
    ]);
    expect(
      config.lines[0]
        ?.filter((widget) => widget.type === "separator")
        .every(
          (widget) =>
            widget.options.separator === "powerline-right-spaced" &&
            widget.options.fg &&
            widget.options.bg,
        ),
    ).toBe(true);
    expect(config.lines[0]?.[6]?.options).toMatchObject({
      fg: "ansi256:234",
      bg: "ansi256:136",
      contextBarMode: "medium",
    });
    expect(config.lines[0]?.[7]?.options).toMatchObject({
      fg: "ansi256:136",
      bg: "ansi256:37",
    });
  });

  it("applies additional powerline presets", () => {
    for (const preset of ["powerline-bright", "powerline-blocks", "powerline-mono"] as const) {
      const config = configWithPreset(DEFAULT_CONFIG, preset);
      expect(config.separator).toBe("none");
      expect(config.terminal.widthMode).toBe("full");
      expect(config.lines.length).toBeGreaterThan(1);
      expect(config.lines.flat().some((widget) => widget.type === "separator")).toBe(true);
    }
  });

  it("applies the demo preset with pi-footer first", () => {
    const config = configWithPreset(DEFAULT_CONFIG, "demo");

    expect(config.separator).toBe("none");
    expect(config.iconMode).toBe("nerd");
    expect(config.lines.slice(0, 4).map((line) => line.map((widget) => widget.type))).toEqual([
      ["custom-text"],
      ["cwd", "git-branch", "session-name"],
      [
        "tokens",
        "cache-read",
        "cache-write",
        "cache-hit-rate",
        "cost",
        "context",
        "context-window",
        "flex-separator",
        "model",
        "thinking-level",
      ],
      ["custom-text"],
    ]);
    expect(config.lines[0]?.[0]?.options).toMatchObject({
      fg: "pi:success",
      text: "Preset 'pi-footer':",
    });
    expect(config.lines[3]?.[0]?.options).toMatchObject({ text: "" });
    expect(config.lines[4]?.[0]?.options).toMatchObject({ text: "Preset 'powerline':" });
    expect(config.lines.flat().some((widget) => widget.type === "separator")).toBe(true);
  });

  it("applies the pi-footer preset", () => {
    const config = configWithPreset(DEFAULT_CONFIG, "pi-footer");

    expect(config.separator).toBe("none");
    expect(config.iconMode).toBe("text");
    expect(config.lines).toHaveLength(2);
    expect(config.lines[0]?.map((widget) => widget.type)).toEqual([
      "cwd",
      "git-branch",
      "session-name",
    ]);
    expect(config.lines[1]?.map((widget) => widget.type)).toEqual([
      "tokens",
      "cache-read",
      "cache-write",
      "cache-hit-rate",
      "cost",
      "context",
      "context-window",
      "flex-separator",
      "model",
      "thinking-level",
    ]);
    expect(config.lines[0]?.[0]?.options).toMatchObject({
      raw: true,
      fg: "pi:dim",
      cwdDisplayStyle: "full-home",
    });
    expect(config.lines[0]?.[1]?.options).toMatchObject({
      icon: " ",
      fg: "pi:dim",
      hideWhenEmpty: true,
      gitBranchDisplayStyle: "round-brackets",
    });
    expect(config.lines[1]?.[0]?.options).toMatchObject({
      raw: true,
      fg: "pi:dim",
      tokenFormatStyle: "compact",
    });
    expect(config.lines[1]?.[1]?.options).toMatchObject({
      icon: " R",
      fg: "pi:dim",
      tokenFormatStyle: "compact",
      hideWhenZero: true,
    });
    expect(config.lines[1]?.[2]?.options).toMatchObject({
      icon: " W",
      fg: "pi:dim",
      tokenFormatStyle: "compact",
      hideWhenZero: true,
    });
    expect(config.lines[1]?.[3]?.options).toMatchObject({
      icon: " CH",
      fg: "pi:dim",
      hideWhenZero: true,
      cacheHitSource: "turn",
    });
    expect(config.lines[1]?.[4]?.options).toMatchObject({
      icon: " ",
      fg: "pi:dim",
      costFormatStyle: "compact",
      showSubscription: true,
    });
    expect(config.lines[1]?.[5]?.options).toMatchObject({
      icon: " ",
      fg: "pi:dim",
      contextConditionalColors: true,
      warningFg: "pi:warning",
      dangerFg: "pi:error",
    });
    expect(config.lines[1]?.[6]?.options).toMatchObject({
      icon: "/",
      fg: "pi:dim",
      contextConditionalColors: true,
      warningFg: "pi:warning",
      dangerFg: "pi:error",
      tokenFormatStyle: "compact",
    });
  });

  it("uses semantic default widget foreground colors", () => {
    expect(registry.createEntry("model").options.fg).toBe("cyan");
    expect(registry.createEntry("git-deletions").options.fg).toBe("red");
    expect(registry.createEntry("git-diff").options.fg).toBe("yellow");
    expect(registry.createEntry("context-length").options.fg).toBe("brightBlack");
    expect(registry.createEntry("runtime").options.fg).toBe("default");
    expect(registry.createEntry("external-status").options.fg).toBe("default");
    expect(registry.createEntry("compactions").options.fg).toBe("yellow");
    expect(registry.createEntry("model", { fg: "default" }).options.fg).toBe("default");
    expect(registry.createEntry("model", { fg: "pi:dim" }).options.fg).toBe("pi:dim");
  });

  it("loads defaults when config does not exist", async () => {
    tempDir = await mkdtemp(join(tmpdir(), "pi-footer-"));
    const config = await loadConfig(join(tempDir, "missing.json"));
    expect(config.lines[0]?.map((widget) => widget.type)).toEqual(
      DEFAULT_CONFIG.lines[0]?.map((widget) => widget.type),
    );
  });

  it("preserves empty lines", () => {
    const config = normalizeConfig({ lines: [["model"], []] });
    expect(config.lines).toHaveLength(2);
    expect(config.lines[1]).toEqual([]);
  });

  it("normalizes malformed widget options through the registry", () => {
    const config = normalizeConfig({
      lines: [
        [
          { type: "model", options: { raw: "yes", fg: "green" } },
          { type: "spacer", options: { width: 999 } },
          { type: "separator", options: { separator: "bad" } },
          { type: "nope", options: { raw: true } },
        ],
      ],
    });

    expect(config.lines[0]?.map((widget) => widget.type)).toEqual(["model", "spacer", "separator"]);
    expect(config.lines[0]?.[0]?.options).toMatchObject({ raw: false, fg: "green" });
    expect(config.lines[0]?.[1]?.options).toMatchObject({ width: 40 });
    expect(config.lines[0]?.[2]?.options).toMatchObject({ separator: "pipe", text: "|" });
  });

  it("saves normalized config", async () => {
    tempDir = await mkdtemp(join(tmpdir(), "pi-footer-"));
    const path = join(tempDir, "settings.json");
    await saveConfig({ ...DEFAULT_CONFIG, lines: [[registry.createEntry("model")]] }, path);
    const saved = JSON.parse(await readFile(path, "utf8")) as {
      lines: Array<Array<{ type: string }>>;
    };
    expect(saved.lines[0]?.map((widget) => widget.type)).toEqual(["model"]);
  });
});
