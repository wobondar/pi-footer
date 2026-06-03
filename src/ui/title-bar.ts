import { truncateToWidth, visibleWidth } from "@earendil-works/pi-tui";

import packageJson from "../../package.json" with { type: "json" };

const CONFIG_TITLE_TEXT = " pi-footer configuration ";
const VERSION = packageJson.version;

interface TitleBarParts {
  title: string;
  rightPad: number;
}

export function previewTitleParts(innerWidth: number): TitleBarParts {
  const title = truncateToWidth(" Preview ", innerWidth, "…");
  return {
    title,
    rightPad: Math.max(0, innerWidth - visibleWidth(title)),
  };
}

export function configTitleBarParts(
  innerWidth: number,
  dim: (text: string) => string,
  now = Date.now(),
  status = "",
  border: (text: string) => string = (text) => text,
): TitleBarParts {
  const titleWidth = Math.max(1, innerWidth - 1);
  const decoratedStatus = status ? ` ${status} ` : "";
  const statusWidth = visibleWidth(decoratedStatus);
  const contentWidth = statusWidth > 0 ? Math.max(1, titleWidth - 1) : titleWidth;
  const reserveForStatus = statusWidth > 0 ? statusWidth + 1 : 0;
  const leftWidth = Math.max(1, contentWidth - reserveForStatus);
  const suffixWidth = Math.max(0, leftWidth - visibleWidth(CONFIG_TITLE_TEXT));
  const suffix = suffixWidth > 0 ? dim(truncateToWidth(`| v${VERSION} `, suffixWidth, "…")) : "";
  const left = truncateToWidth(retroText(CONFIG_TITLE_TEXT, now) + suffix, leftWidth, "…");
  if (statusWidth === 0) {
    return {
      title: left,
      rightPad: Math.max(0, titleWidth - visibleWidth(left)),
    };
  }
  const separator = border(
    "─".repeat(Math.max(1, contentWidth - visibleWidth(left) - statusWidth)),
  );
  return {
    title: `${left}${separator}${decoratedStatus}`,
    rightPad: 1,
  };
}

type Rgb = readonly [number, number, number];

const RETRO_GRADIENT: readonly Rgb[] = [
  [63, 81, 177],
  [90, 85, 174],
  [123, 95, 172],
  [143, 106, 174],
  [168, 106, 164],
  [204, 107, 142],
  [241, 130, 113],
  [243, 164, 105],
  [247, 201, 120],
];

export const RETRO_FRAME_INTERVAL_MS = 140;
const RETRO_CYCLE_MS = 5000;

export function retroText(text: string, now = Date.now()): string {
  return gradientText(text, RETRO_GRADIENT, (now / RETRO_CYCLE_MS) % 1);
}

function gradientText(text: string, stops: readonly Rgb[], phase: number): string {
  const chars = Array.from(text);
  if (chars.length === 0) return "";
  return chars
    .map((char, index) => {
      const position = chars.length === 1 ? phase : index / (chars.length - 1) + phase;
      const [r, g, b] = sampleLoopingGradient(stops, position);
      return `\x1b[1;38;2;${r};${g};${b}m${char}\x1b[0m`;
    })
    .join("");
}

function sampleLoopingGradient(stops: readonly Rgb[], t: number): Rgb {
  if (stops.length === 0) return [255, 255, 255];
  if (stops.length === 1) return stops[0] ?? [255, 255, 255];

  const wrapped = ((t % 1) + 1) % 1;
  const scaled = wrapped * stops.length;
  const index = Math.floor(scaled) % stops.length;
  const mix = scaled - Math.floor(scaled);
  const left = stops[index] ?? stops[0] ?? [255, 255, 255];
  const right = stops[(index + 1) % stops.length] ?? left;
  return [
    Math.round(left[0] + (right[0] - left[0]) * mix),
    Math.round(left[1] + (right[1] - left[1]) * mix),
    Math.round(left[2] + (right[2] - left[2]) * mix),
  ];
}
