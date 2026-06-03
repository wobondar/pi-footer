import { truncateToWidth } from "@earendil-works/pi-tui";

import { STATUS_KEY } from "../config.js";
import {
  allExtensionStatusEntries,
  toggleExtensionStatusRowKey,
  type GetExtensionStatuses,
} from "../extension-statuses.js";
import type { StatuslineSettings } from "../types.js";

export function extensionStatusRowLines(
  config: StatuslineSettings,
  getExtensionStatuses: GetExtensionStatuses,
  selected: number,
  width: number,
  menuTitle: (title: string, subtitle: string) => string,
  line: (content: string, width: number) => string,
  menuLine: (selected: boolean, content: string, width: number) => string,
  dim: (text: string) => string,
  success: (text: string) => string,
  warning: (text: string) => string,
): string[] {
  const entries = allExtensionStatusEntries(
    getExtensionStatuses(),
    config.extensionStatusRow,
    STATUS_KEY,
  );
  const hidden = new Set(config.extensionStatusRow.hiddenKeys);
  const lines = [
    line(
      menuTitle("Pi extensions", "Published statuses and extension status row visibility"),
      width,
    ),
    line(dim("↑/↓ select • pgup/pgdn jump • ←/→ or enter toggle • esc back"), width),
  ];

  if (entries.length === 0) {
    lines.push(line(warning("No extension statuses are currently available."), width));
    return lines;
  }

  entries.forEach((entry, index) => {
    const state = hidden.has(entry.key) ? dim("off") : success("on ");
    const key = dim(entry.key);
    const maxValueWidth = Math.max(1, width - entry.key.length - 8);
    const value = truncateToWidth(entry.value, maxValueWidth, "…");
    lines.push(menuLine(index === selected, `${state} ${key} ${value}`, width));
  });
  return lines;
}

export function toggleExtensionStatusRowSelection(
  config: StatuslineSettings,
  getExtensionStatuses: GetExtensionStatuses,
  selected: number,
): boolean {
  const entry = allExtensionStatusEntries(
    getExtensionStatuses(),
    config.extensionStatusRow,
    STATUS_KEY,
  )[selected];
  if (!entry) return false;
  config.extensionStatusRow = toggleExtensionStatusRowKey(config.extensionStatusRow, entry.key);
  return true;
}

export function extensionStatusRowCount(
  config: StatuslineSettings,
  getExtensionStatuses: GetExtensionStatuses,
): number {
  return allExtensionStatusEntries(getExtensionStatuses(), config.extensionStatusRow, STATUS_KEY)
    .length;
}
