import { execFile } from "node:child_process";
import { readdir } from "node:fs/promises";

import type { ColorName } from "../../colors.js";
import { CACHE_NAMESPACES, asyncCache } from "../../cache.js";
import type { WidgetIconSet } from "../types.js";
import { defineWidget } from "../types.js";

const VERSION_TIMEOUT_MS = 1_000;
const RUNTIME_CACHE_TTL_MS = 10_000;

interface VersionCommand {
  command: string;
  args: readonly string[];
  parse: (output: string) => string | undefined;
}

interface RuntimeDefinition<TName extends string = string> {
  name: TName;
  files: readonly string[];
  matchesEntry?: (entry: CwdEntry) => boolean;
  versionCommands: readonly VersionCommand[];
  icons: WidgetIconSet;
  color: ColorName;
}

interface CwdEntry {
  name: string;
  isFile: boolean;
}

const RUNTIME_DEFINITIONS = [
  {
    name: "bun",
    files: ["bun.lock", "bun.lockb"],
    versionCommands: [
      {
        command: "bun",
        args: ["--version"],
        parse: (output) => /\bv?([0-9][^\s]*)/i.exec(output)?.[1],
      },
    ],
    icons: { emoji: "🥟", nerd: "", text: "" },
    color: "pi:warning",
  },
  {
    name: "deno",
    files: ["deno.json", "deno.jsonc", "deno.lock"],
    versionCommands: [
      {
        command: "deno",
        args: ["--version"],
        parse: (output) => /deno\s+([0-9][^\s]*)/i.exec(output)?.[1],
      },
    ],
    icons: { emoji: "🦕", nerd: "", text: "" },
    color: "pi:syntaxType",
  },
  {
    name: "lua",
    files: ["stylua.toml", ".stylua.toml", ".luarc.json", ".luarc.jsonc", "init.lua"],
    matchesEntry: (entry) => entry.name === "lua" || (entry.isFile && entry.name.endsWith(".lua")),
    versionCommands: [
      { command: "lua", args: ["-v"], parse: (output) => /Lua\s+([0-9][^\s]*)/i.exec(output)?.[1] },
      {
        command: "luajit",
        args: ["-v"],
        parse: (output) => /LuaJIT\s+([0-9][^\s]*)/i.exec(output)?.[1],
      },
    ],
    icons: { emoji: "🌙", nerd: "", text: "" },
    color: "pi:accent",
  },
  {
    name: "node",
    files: ["package.json", ".nvmrc", ".node-version"],
    versionCommands: [
      {
        command: "node",
        args: ["--version"],
        parse: (output) => /\bv?([0-9][^\s]*)/i.exec(output)?.[1],
      },
    ],
    icons: { emoji: "⬢", nerd: "", text: "" },
    color: "pi:success",
  },
  {
    name: "python",
    files: [
      "pyproject.toml",
      "requirements.txt",
      "setup.py",
      "setup.cfg",
      "Pipfile",
      ".python-version",
    ],
    versionCommands: [
      {
        command: "python3",
        args: ["--version"],
        parse: (output) => /Python\s+([0-9][^\s]*)/i.exec(output)?.[1],
      },
      {
        command: "python",
        args: ["--version"],
        parse: (output) => /Python\s+([0-9][^\s]*)/i.exec(output)?.[1],
      },
    ],
    icons: { emoji: "🐍", nerd: "", text: "" },
    color: "pi:warning",
  },
  {
    name: "go",
    files: ["go.mod"],
    versionCommands: [
      {
        command: "go",
        args: ["version"],
        parse: (output) => /go version go([0-9][^\s]*)/i.exec(output)?.[1],
      },
    ],
    icons: { emoji: "🐹", nerd: "", text: "" },
    color: "pi:syntaxType",
  },
  {
    name: "rust",
    files: ["Cargo.toml"],
    versionCommands: [
      {
        command: "rustc",
        args: ["--version"],
        parse: (output) => /rustc\s+([0-9][^\s]*)/i.exec(output)?.[1],
      },
    ],
    icons: { emoji: "🦀", nerd: "", text: "" },
    color: "pi:error",
  },
  {
    name: "java",
    files: ["pom.xml", "build.gradle", "build.gradle.kts"],
    versionCommands: [
      {
        command: "java",
        args: ["-version"],
        parse: (output) => /(?:openjdk|java)\s+version\s+"?([0-9][^"\s]*)/i.exec(output)?.[1],
      },
    ],
    icons: { emoji: "☕", nerd: "", text: "" },
    color: "pi:warning",
  },
  {
    name: "ruby",
    files: ["Gemfile", ".ruby-version"],
    versionCommands: [
      {
        command: "ruby",
        args: ["--version"],
        parse: (output) => /ruby\s+([0-9][^\s]*)/i.exec(output)?.[1],
      },
    ],
    icons: { emoji: "💎", nerd: "", text: "" },
    color: "pi:error",
  },
  {
    name: "php",
    files: ["composer.json"],
    versionCommands: [
      {
        command: "php",
        args: ["--version"],
        parse: (output) => /PHP\s+([0-9][^\s]*)/i.exec(output)?.[1],
      },
    ],
    icons: { emoji: "🐘", nerd: "", text: "" },
    color: "pi:accent",
  },
] as const satisfies readonly RuntimeDefinition[];

export type RuntimeName = (typeof RUNTIME_DEFINITIONS)[number]["name"];

interface RuntimeInfo {
  name: RuntimeName;
  version?: string;
  icons: WidgetIconSet;
  color: ColorName;
}

interface RuntimeDetection {
  cwd: string;
  displayVersion: boolean;
}

export const RuntimeWidget = defineWidget({
  type: "runtime",
  label: "Runtime",
  category: "Project",
  description: "Current project runtime (e.g. Bun, Python, Go, Rust)",
  dependencies: ["cwd"],
  baseOptions: ["raw", "hideWhenEmpty", "icon", "text"],
  baseOptionDefaults: { hideWhenEmpty: true },
  properties: [
    {
      id: "style",
      label: "Style",
      kind: "choice",
      description: "Display style",
      default: "compact",
      options: {
        choices: [
          { id: "default", label: "Default", list: "default" },
          { id: "compact", label: "Compact", list: "compact" },
        ],
        showInWidgets: true,
        showInColors: false,
        listProperty: "style",
      },
    },
    {
      id: "displayVersion",
      label: "Display version",
      kind: "boolean",
      description: "Show runtime version",
      default: true,
      options: {
        label: "with-version",
        showInWidgets: true,
        showInColors: true,
        listProperty: "",
      },
    },
  ],
  icons: { emoji: "⚙️", nerd: "", text: "runtime" },
  defaultStyle: { fg: "default", bg: "default", bold: false },
  render({ ctx, options, renderWidget }) {
    const cwd = ctx.cwd;
    if (cwd.length === 0) return renderWidget("");

    const info = asyncCache.get(
      CACHE_NAMESPACES.runtime,
      `${cwd}:${options.displayVersion ? "version" : "no-version"}`,
      RUNTIME_CACHE_TTL_MS,
      { cwd, displayVersion: options.displayVersion },
      detectRuntime,
      ctx.requestRender,
    );
    if (!info) return renderWidget("", { icons: { emoji: "", nerd: "", text: "" } });

    return renderWidget(renderRuntimeValue(info, options.displayVersion, options.style), {
      icons: info.icons,
      fg: options.fg && options.fg !== "default" ? options.fg : info.color,
    });
  },
});

function renderRuntimeValue(
  info: RuntimeInfo,
  displayVersion: boolean,
  style: "default" | "compact",
) {
  if (!displayVersion || !info.version) return info.name;
  if (style === "compact") return compactRuntimeVersion(info.name, info.version);
  return `${info.name} ${info.version}`;
}

function prefixRuntimeVersion(version: string) {
  const trimmed = version.trim();
  if (!trimmed) return trimmed;
  return trimmed.toLowerCase().startsWith("v") ? trimmed : `v${trimmed}`;
}

function compactRuntimeVersion(name: RuntimeName, version: string) {
  const prefixed = prefixRuntimeVersion(version);
  const match = /^v([0-9]+)(?:\.([0-9]+))?/i.exec(prefixed);
  if (!match) return prefixed;

  const major = match[1] ?? "";
  const minor = match[2];
  if ((name === "python" || name === "go" || name === "bun") && minor !== undefined)
    return `v${major}.${minor}`;
  return `v${major}`;
}

async function detectRuntime({
  cwd,
  displayVersion,
}: RuntimeDetection): Promise<RuntimeInfo | null> {
  const entries = await readCwdEntries(cwd);
  if (!entries) return null;

  for (const definition of RUNTIME_DEFINITIONS) {
    if (!matchesRuntime(definition, entries)) continue;

    const version = displayVersion ? await detectVersion(definition) : undefined;
    return version
      ? {
          name: definition.name,
          version,
          icons: definition.icons,
          color: definition.color,
        }
      : {
          name: definition.name,
          icons: definition.icons,
          color: definition.color,
        };
  }

  return null;
}

async function readCwdEntries(cwd: string) {
  try {
    const entries = await readdir(cwd, { withFileTypes: true });
    return entries.map((entry) => ({ name: entry.name, isFile: entry.isFile() }));
  } catch {
    return undefined;
  }
}

function matchesRuntime(definition: RuntimeDefinition, entries: readonly CwdEntry[]) {
  if (hasAnyFile(entries, definition.files)) return true;
  return definition.matchesEntry
    ? entries.some((entry) => definition.matchesEntry?.(entry) === true)
    : false;
}

function hasAnyFile(entries: readonly CwdEntry[], files: readonly string[]) {
  const fileNames = new Set(entries.filter((entry) => entry.isFile).map((entry) => entry.name));
  return files.some((file) => fileNames.has(file));
}

async function detectVersion(definition: RuntimeDefinition) {
  for (const command of definition.versionCommands) {
    const version = await runVersion(command);
    if (version) return version;
  }
  return undefined;
}

async function runVersion(versionCommand: VersionCommand) {
  return new Promise<string | undefined>((resolve) => {
    execFile(
      versionCommand.command,
      [...versionCommand.args],
      { encoding: "utf8", timeout: VERSION_TIMEOUT_MS, windowsHide: true },
      (error, stdout, stderr) => {
        const output = `${stringOutput(stdout)}\n${stringOutput(stderr)}`;
        if (error && output.trim().length === 0) {
          resolve(undefined);
          return;
        }
        const parsed = versionCommand.parse(output);
        resolve(parsed ? prefixRuntimeVersion(parsed) : undefined);
      },
    );
  });
}

function stringOutput(value: string | Buffer) {
  return typeof value === "string" ? value : value.toString("utf8");
}
