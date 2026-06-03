import { basename, sep } from "node:path";

import { defineWidget } from "../types.js";

const CWD_DISPLAY_STYLES = {
  default: {
    label: "Default (last path segments)",
    list: "default",
  },
  "full-home": {
    label: "Full path (~ home)",
    list: "full-path",
  },
  fish: {
    label: "Fish-style abbreviations",
    list: "fish-style",
  },
} as const;

type CwdDisplayStyle = keyof typeof CWD_DISPLAY_STYLES;

const CWD_DISPLAY_STYLE_VALUES = Object.keys(CWD_DISPLAY_STYLES) as CwdDisplayStyle[];

export const CwdWidget = defineWidget({
  type: "cwd",
  label: "Working Dir",
  category: "Core",
  description: "Current working directory",
  dependencies: ["cwd"],
  baseOptions: ["raw", "icon"],
  baseOptionDefaults: {},
  properties: [
    {
      id: "cwdDisplayStyle",
      label: "Display style",
      kind: "choice",
      description: "Working directory display style",
      default: "default",
      options: {
        choices: CWD_DISPLAY_STYLE_VALUES.map((style) => ({
          id: style,
          label: CWD_DISPLAY_STYLES[style].label,
          list: CWD_DISPLAY_STYLES[style].list,
        })),
        showInWidgets: true,
        showInColors: false,
        listProperty: "display",
      },
    },
    {
      id: "segments",
      label: "Segments",
      kind: "number",
      description: "Number of trailing path segments or fish abbreviation width",
      default: 2,
      options: { min: 1, max: 8, showInWidgets: true, showInColors: false },
    },
  ],
  icons: { emoji: "📁", nerd: "", text: "cwd" },
  defaultStyle: { fg: "blue", bg: "default", bold: false },
  render({ ctx, options, renderWidget }) {
    return renderWidget(
      formatCwdPath(ctx.cwd, options.cwdDisplayStyle, options.segments) || basename(ctx.cwd),
    );
  },
});

function formatCwdPath(path: string, style: CwdDisplayStyle, segments: number) {
  if (style === "full-home") return fullHomePath(path);
  if (style === "fish") return fishStylePath(path, segments);
  return shortenPath(path, segments);
}

function shortenPath(path: string, maxSegments: number) {
  const normalized = fullHomePath(path);
  const parts = normalized.split(/[\\/]+/).filter(Boolean);
  if (parts.length <= maxSegments) return normalized || sep;
  const prefix = normalized.startsWith("~") ? "~/…" : "…";
  return `${prefix}/${parts.slice(-maxSegments).join("/")}`;
}

function fullHomePath(path: string) {
  const home = process.env.HOME;
  if (!home || !isPathInsideHome(path, home)) return path;
  return `~${path.slice(home.length)}`;
}

function fishStylePath(path: string, segmentLength: number) {
  const normalized = fullHomePath(path);
  const hasHomePrefix = normalized.startsWith("~");
  const parts = normalized.split(/[\\/]+/).filter(Boolean);
  const pathParts = hasHomePrefix ? parts.slice(1) : parts;
  if (pathParts.length <= 1) return normalized || sep;

  const prefix = hasHomePrefix ? "~/" : normalized.startsWith(sep) ? sep : "";
  const abbreviated = pathParts.map((part, index) =>
    index === pathParts.length - 1
      ? part
      : Array.from(part).slice(0, segmentLength).join("") || part,
  );
  return `${prefix}${abbreviated.join("/")}`;
}

function isPathInsideHome(path: string, home: string) {
  if (path === home) return true;
  const next = path[home.length];
  return path.startsWith(home) && (next === "/" || next === "\\");
}
