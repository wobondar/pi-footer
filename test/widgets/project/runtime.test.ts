import type { Theme } from "@earendil-works/pi-coding-agent";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { normalizeConfig } from "../../../src/config.js";
import type { WidgetOptions } from "../../../src/types.js";
import {
  fieldsForWidget,
  formatWidgetColorOptions,
  formatWidgetOptions,
} from "../../../src/ui/fields.js";
import { asyncCache } from "../../../src/cache.js";
import { RuntimeWidget, type RuntimeName } from "../../../src/widgets/project/runtime.js";
import { WidgetInstance } from "../../../src/widgets/instance.js";
import { registry } from "../../../src/widgets/registry.js";
import type { WidgetContext } from "../../../src/widgets/types.js";

type DirentLike = { name: string; isFile: () => boolean };
type ReaddirMock = (path: string, options: { withFileTypes: true }) => Promise<DirentLike[]>;
type ExecFileCallback = (
  error: Error | null,
  stdout: string | Buffer,
  stderr: string | Buffer,
) => void;
type ExecFileMock = (
  command: string,
  args: readonly string[],
  options: unknown,
  callback: ExecFileCallback,
) => unknown;

const mocks = vi.hoisted(() => ({
  execFileMock: vi.fn<ExecFileMock>(),
  readdirMock: vi.fn<ReaddirMock>(),
}));

const taggedTheme = {
  fg: (color: string, text: string) => `<${color}>${text}</${color}>`,
  bg: (color: string, text: string) => `<${color}>${text}</${color}>`,
  bold: (text: string) => `<bold>${text}</bold>`,
} as unknown as Theme;

vi.mock("node:child_process", () => ({
  execFile: mocks.execFileMock,
}));

vi.mock("node:fs/promises", () => ({
  readdir: mocks.readdirMock,
}));

function file(name: string): DirentLike {
  return { name, isFile: () => true };
}

function dir(name: string): DirentLike {
  return { name, isFile: () => false };
}

function entriesFor(...entries: (string | DirentLike)[]): DirentLike[] {
  return entries.map((entry) => (typeof entry === "string" ? file(entry) : entry));
}

function entriesForRuntime(runtime: RuntimeName): DirentLike[] {
  switch (runtime) {
    case "bun":
      return entriesFor("bun.lock");
    case "deno":
      return entriesFor("deno.json");
    case "lua":
      return entriesFor("main.lua");
    case "node":
      return entriesFor("package.json");
    case "python":
      return entriesFor("pyproject.toml");
    case "go":
      return entriesFor("go.mod");
    case "rust":
      return entriesFor("Cargo.toml");
    case "java":
      return entriesFor("pom.xml");
    case "ruby":
      return entriesFor("Gemfile");
    case "php":
      return entriesFor("composer.json");
  }
}

function runtimeWidget(options: WidgetOptions = {}) {
  return registry.createWidget("runtime", options);
}

function ctx(overrides: Partial<WidgetContext<["cwd"]>> = {}): WidgetContext<["cwd"]> {
  return {
    cwd: "/repo",
    iconMode: "text",
    minimalist: false,
    colorLevel: "none",
    ...overrides,
  };
}

function deferred<T>(): { promise: Promise<T>; resolve: (value: T) => void } {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

async function detectRenderedRuntime(
  cwd: string,
  entries: DirentLike[],
  options: WidgetOptions = { displayVersion: false },
): Promise<string | undefined> {
  mocks.readdirMock.mockResolvedValueOnce(entries);
  const requestRender = vi.fn<() => void>();
  const widget = runtimeWidget(options);

  expect(widget.render(ctx({ cwd, requestRender }))).toBeUndefined();
  await vi.waitFor(() => expect(requestRender).toHaveBeenCalledTimes(1));

  return widget.render(ctx({ cwd }));
}

async function detectRenderedRuntimeVersion(
  runtime: RuntimeName,
  output: string,
): Promise<string | undefined> {
  asyncCache.clear();
  mocks.readdirMock.mockResolvedValueOnce(entriesForRuntime(runtime));
  mocks.execFileMock.mockImplementation((_command, _args, _options, callback) => {
    callback(null, output, "");
  });

  const cwd = `/repo/version-${runtime}`;
  const requestRender = vi.fn<() => void>();
  const widget = runtimeWidget({ style: "default" });

  expect(widget.render(ctx({ cwd, requestRender }))).toBeUndefined();
  await vi.waitFor(() => expect(requestRender).toHaveBeenCalledTimes(1));

  return widget.render(ctx({ cwd }));
}

beforeEach(() => {
  asyncCache.clear();
  mocks.readdirMock.mockReset();
  mocks.execFileMock.mockReset();
  mocks.execFileMock.mockImplementation((_command, _args, _options, callback) => {
    callback(new Error("version command not mocked"), "", "");
  });
});

afterEach(() => {
  vi.restoreAllMocks();
  asyncCache.clear();
});

describe("RuntimeWidget", () => {
  it("owns metadata and default options", () => {
    const widget = runtimeWidget();
    expect(widget).toBeInstanceOf(WidgetInstance);
    expect(registry.spec(widget.type)).toBe(RuntimeWidget);
    expect(RuntimeWidget.dependencies).toEqual(["cwd"]);
    expect(RuntimeWidget.icons).toEqual({ emoji: "⚙️", nerd: "", text: "runtime" });
    expect(RuntimeWidget.defaultStyle).toEqual({ fg: "default", bg: "default", bold: false });
    expect(RuntimeWidget.baseOptionDefaults).toEqual({ hideWhenEmpty: true });
    expect(widget.options).toEqual({
      raw: false,
      hideWhenEmpty: true,
      text: "-",
      icon: "",
      style: "compact",
      displayVersion: true,
      fg: "default",
      bg: "default",
      bold: false,
    });
  });

  it("exposes metadata fields and summaries", () => {
    const widget = runtimeWidget({ hideWhenEmpty: false });
    expect(fieldsForWidget(widget).map((field) => field.id)).toEqual([
      "enabled",
      "raw",
      "hideWhenEmpty",
      "icon",
      "text",
      "style",
      "displayVersion",
    ]);
    expect(formatWidgetOptions(runtimeWidget({ displayVersion: false }))).not.toContain(
      "with-version",
    );

    const summary = formatWidgetOptions(
      runtimeWidget({
        hideWhenEmpty: false,
        text: "none",
        icon: "rt=",
        style: "default",
        displayVersion: true,
      }),
    );
    expect(summary).toContain("style=default");
    expect(summary).toContain("with-version");
    expect(summary).toContain("text='none'");
    expect(summary).toContain("icon='rt='");
    expect(formatWidgetColorOptions(runtimeWidget({ displayVersion: true }))).toContain(
      "with-version",
    );
  });

  it("normalizes config through metadata", () => {
    expect(
      normalizeConfig({
        lines: [
          [
            {
              type: "runtime",
              options: {
                hideWhenEmpty: false,
                style: "default",
                displayVersion: false,
              },
            },
          ],
        ],
      }).lines[0]?.[0]?.options,
    ).toMatchObject({
      hideWhenEmpty: false,
      style: "default",
      displayVersion: false,
    });
    expect(
      normalizeConfig({
        lines: [
          [
            {
              type: "runtime",
              options: {
                hideWhenEmpty: "no",
                hideWhenZero: true,
                segments: 4,
                style: "wide",
                displayVersion: "yes",
                tokenFormatStyle: "compact",
              },
            },
          ],
        ],
      }).lines[0]?.[0]?.options,
    ).toEqual({
      raw: false,
      hideWhenEmpty: true,
      text: "-",
      icon: "",
      fg: "default",
      bg: "default",
      bold: false,
      style: "compact",
      displayVersion: true,
    });
  });

  it("detects each runtime from cwd files and entries", async () => {
    const cases: Array<[RuntimeName, DirentLike[]]> = [
      ["bun", entriesFor("bun.lock")],
      ["deno", entriesFor("deno.json")],
      ["lua", entriesFor("main.lua")],
      ["node", entriesFor("package.json")],
      ["python", entriesFor("pyproject.toml")],
      ["go", entriesFor("go.mod")],
      ["rust", entriesFor("Cargo.toml")],
      ["java", entriesFor("pom.xml")],
      ["ruby", entriesFor("Gemfile")],
      ["php", entriesFor("composer.json")],
    ];

    for (const [runtime, entries] of cases) {
      asyncCache.clear();
      expect(await detectRenderedRuntime(`/repo/${runtime}`, entries)).toBe(runtime);
    }

    asyncCache.clear();
    expect(await detectRenderedRuntime("/repo/lua-dir", entriesFor(dir("lua")))).toBe("lua");
  });

  it("prioritizes bun and deno project markers before node", async () => {
    expect(
      await detectRenderedRuntime("/repo/bun-node", entriesFor("package.json", "bun.lock")),
    ).toBe("bun");

    asyncCache.clear();
    expect(
      await detectRenderedRuntime("/repo/deno-node", entriesFor("package.json", "deno.json")),
    ).toBe("deno");
  });

  it("hides when no runtime is detected by default", async () => {
    const output = await detectRenderedRuntime("/repo/no-runtime", entriesFor("README.md"));

    expect(output).toBeUndefined();
  });

  it("uses text fallback when no runtime is detected and hideWhenEmpty is false", async () => {
    mocks.readdirMock.mockResolvedValueOnce(entriesFor("README.md"));
    const requestRender = vi.fn<() => void>();
    const widget = runtimeWidget({
      hideWhenEmpty: false,
      text: "no-runtime",
      displayVersion: false,
    });

    expect(widget.render(ctx({ cwd: "/repo/no-runtime-fallback", requestRender }))).toBe(
      "no-runtime",
    );
    await vi.waitFor(() => expect(requestRender).toHaveBeenCalledTimes(1));
    expect(widget.render(ctx({ cwd: "/repo/no-runtime-fallback" }))).toBe("no-runtime");
    expect(mocks.execFileMock).not.toHaveBeenCalled();
  });

  it("renders parsed versions for all runtimes", async () => {
    const cases: Array<[RuntimeName, string, string]> = [
      ["bun", "1.0.17\n", "bun v1.0.17"],
      ["deno", "deno 1.40.5\nv8 12.1.285.27\ntypescript 5.3.3", "deno v1.40.5"],
      ["lua", "Lua 5.4.6  Copyright (C) 1994-2023 Lua.org", "lua v5.4.6"],
      ["node", "v20.11.1\n", "node v20.11.1"],
      ["python", "Python 3.12.1", "python v3.12.1"],
      ["go", "go version go1.22.0 darwin/arm64", "go v1.22.0"],
      ["rust", "rustc 1.75.0 (82e1608df 2023-12-21)", "rust v1.75.0"],
      ["java", 'openjdk version "21.0.1" 2023-10-17', "java v21.0.1"],
      ["ruby", "ruby 3.2.2p53 (2023-03-30 revision e51014f9c0)", "ruby v3.2.2p53"],
      ["php", "PHP 8.3.1 (cli) (built: Jan 01 2024)", "php v8.3.1"],
    ];

    for (const [runtime, output, expected] of cases) {
      expect(await detectRenderedRuntimeVersion(runtime, output)).toBe(expected);
    }
  });

  it("uses runtime-specific parsers for noisy version output", async () => {
    const cases: Array<[RuntimeName, string, string]> = [
      ["lua", "Copyright 1994-2024\nLua 5.4.6", "lua v5.4.6"],
      ["lua", "Copyright 1994\nLuaJIT 2.1.0-beta3 -- rolling", "lua v2.1.0-beta3"],
      ["python", "build 2024\nPython 3.12.1", "python v3.12.1"],
      ["rust", "release date 2023-12-21\nrustc 1.75.0", "rust v1.75.0"],
      ["ruby", "release date 2023-03-30\nruby 3.2.2p53", "ruby v3.2.2p53"],
      ["php", "built Jan 01 2024\nPHP 8.3.1 (cli)", "php v8.3.1"],
    ];

    for (const [runtime, output, expected] of cases) {
      expect(await detectRenderedRuntimeVersion(runtime, output)).toBe(expected);
    }
  });

  it("does not call version commands when displayVersion is false", async () => {
    const output = await detectRenderedRuntime("/repo/no-version", entriesFor("package.json"), {
      displayVersion: false,
    });

    expect(output).toBe("node");
    expect(mocks.execFileMock).not.toHaveBeenCalled();
  });

  it("returns stale cached runtime while refreshing", async () => {
    vi.spyOn(Date, "now").mockReturnValue(0);
    mocks.readdirMock.mockResolvedValueOnce(entriesFor("package.json"));
    const requestRender = vi.fn<() => void>();
    const widget = runtimeWidget({ displayVersion: false });

    expect(widget.render(ctx({ cwd: "/repo/stale", requestRender }))).toBeUndefined();
    await vi.waitFor(() => expect(requestRender).toHaveBeenCalledTimes(1));
    expect(widget.render(ctx({ cwd: "/repo/stale" }))).toBe("node");

    const refresh = deferred<DirentLike[]>();
    mocks.readdirMock.mockReturnValueOnce(refresh.promise);
    vi.mocked(Date.now).mockReturnValue(10_000);

    expect(widget.render(ctx({ cwd: "/repo/stale", requestRender }))).toBe("node");
    expect(widget.render(ctx({ cwd: "/repo/stale", requestRender: vi.fn<() => void>() }))).toBe(
      "node",
    );
    expect(mocks.readdirMock).toHaveBeenCalledTimes(2);

    refresh.resolve(entriesFor("pyproject.toml"));
    await vi.waitFor(() => expect(requestRender).toHaveBeenCalledTimes(2));
    expect(widget.render(ctx({ cwd: "/repo/stale" }))).toBe("python");
  });

  it("keeps cache entries fresh for less than 10 seconds and refreshes after 10 seconds", async () => {
    vi.spyOn(Date, "now").mockReturnValue(0);
    mocks.readdirMock.mockResolvedValueOnce(entriesFor("package.json"));
    const requestRender = vi.fn<() => void>();
    const widget = runtimeWidget({ displayVersion: false });

    expect(widget.render(ctx({ cwd: "/repo/ttl", requestRender }))).toBeUndefined();
    await vi.waitFor(() => expect(requestRender).toHaveBeenCalledTimes(1));
    expect(mocks.readdirMock).toHaveBeenCalledTimes(1);

    vi.mocked(Date.now).mockReturnValue(9_999);
    expect(widget.render(ctx({ cwd: "/repo/ttl" }))).toBe("node");
    expect(mocks.readdirMock).toHaveBeenCalledTimes(1);

    mocks.readdirMock.mockResolvedValueOnce(entriesFor("pyproject.toml"));
    vi.mocked(Date.now).mockReturnValue(10_000);
    expect(widget.render(ctx({ cwd: "/repo/ttl", requestRender }))).toBe("node");
    expect(mocks.readdirMock).toHaveBeenCalledTimes(2);

    await vi.waitFor(() => expect(requestRender).toHaveBeenCalledTimes(2));
    expect(widget.render(ctx({ cwd: "/repo/ttl" }))).toBe("python");
  });

  it("deduplicates pending refreshes for the same cache key", async () => {
    const pending = deferred<DirentLike[]>();
    mocks.readdirMock.mockReturnValueOnce(pending.promise);
    const firstRender = vi.fn<() => void>();
    const secondRender = vi.fn<() => void>();
    const widget = runtimeWidget({ displayVersion: false });

    expect(
      widget.render(ctx({ cwd: "/repo/pending", requestRender: firstRender })),
    ).toBeUndefined();
    expect(
      widget.render(ctx({ cwd: "/repo/pending", requestRender: secondRender })),
    ).toBeUndefined();
    expect(mocks.readdirMock).toHaveBeenCalledTimes(1);

    pending.resolve(entriesFor("package.json"));
    await vi.waitFor(() => expect(firstRender).toHaveBeenCalledTimes(1));
    expect(secondRender).toHaveBeenCalledTimes(1);
    expect(widget.render(ctx({ cwd: "/repo/pending" }))).toBe("node");
  });

  it("uses runtime colors unless widget foreground overrides them", async () => {
    mocks.readdirMock.mockResolvedValueOnce(entriesFor("package.json"));
    const requestRender = vi.fn<() => void>();
    const widget = runtimeWidget({ displayVersion: false });

    expect(widget.render(ctx({ cwd: "/repo/colors", requestRender }))).toBeUndefined();
    await vi.waitFor(() => expect(requestRender).toHaveBeenCalledTimes(1));

    expect(
      widget.render(ctx({ cwd: "/repo/colors", colorLevel: "ansi16", theme: taggedTheme })),
    ).toBe("<success>node</success>");
    expect(
      runtimeWidget({ displayVersion: false, fg: "pi:accent" }).render(
        ctx({ cwd: "/repo/colors", colorLevel: "ansi16", theme: taggedTheme }),
      ),
    ).toBe("<accent>node</accent>");
  });

  it("formats rendered runtime with styles, icon modes, raw, and minimalist options", async () => {
    mocks.readdirMock.mockResolvedValueOnce(entriesFor("package.json"));
    mocks.execFileMock.mockImplementation((_command, _args, _options, callback) => {
      callback(null, "v20.11.1\n", "");
    });
    const requestRender = vi.fn<() => void>();
    const widget = runtimeWidget();

    expect(
      widget.render(ctx({ cwd: "/repo/render", iconMode: "emoji", requestRender })),
    ).toBeUndefined();
    await vi.waitFor(() => expect(requestRender).toHaveBeenCalledTimes(1));

    expect(widget.render(ctx({ cwd: "/repo/render", iconMode: "emoji" }))).toBe("⬢ v20");
    expect(widget.render(ctx({ cwd: "/repo/render", iconMode: "nerd" }))).toBe(" v20");
    expect(widget.render(ctx({ cwd: "/repo/render", iconMode: "text" }))).toBe("v20");
    expect(
      runtimeWidget({ style: "default" }).render(ctx({ cwd: "/repo/render", iconMode: "emoji" })),
    ).toBe("⬢ node v20.11.1");
    expect(
      runtimeWidget({ icon: "node:", style: "default" }).render(ctx({ cwd: "/repo/render" })),
    ).toBe("node:node v20.11.1");
    expect(
      runtimeWidget({ raw: true }).render(ctx({ cwd: "/repo/render", iconMode: "emoji" })),
    ).toBe("v20");
    expect(widget.render(ctx({ cwd: "/repo/render", iconMode: "emoji", minimalist: true }))).toBe(
      "v20",
    );
  });
});
