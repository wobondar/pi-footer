import { clamp } from "./helpers.ts";

export function pageSelection(
  selected: number,
  total: number,
  visibleCount: number,
  direction: -1 | 1,
): number {
  if (total <= 0) return 0;
  return clamp(selected + direction * visibleCount, 0, total - 1);
}

export function scrollWindow(
  total: number,
  selected: number,
  visibleCount: number,
): { start: number; end: number } {
  const start = clamp(
    selected - Math.floor(visibleCount / 2),
    0,
    Math.max(0, total - visibleCount),
  );
  return { start, end: Math.min(total, start + visibleCount) };
}

export function rangeLabel(start: number, end: number, total: number): string {
  if (total === 0) return "0-0";
  return `${start + 1}-${end}`;
}
