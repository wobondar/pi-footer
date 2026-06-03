import { truncateToWidth } from "@earendil-works/pi-tui";

import { STATUS_KEY } from "../config.js";
import {
  allExtensionStatusEntries,
  type ExtensionStatusRowConfig,
  type GetExtensionStatuses,
} from "../extension-statuses.js";
import type { Widget } from "../widgets/types.js";

export function statusKeyPickerLines(
  getExtensionStatuses: GetExtensionStatuses,
  rowConfig: ExtensionStatusRowConfig,
  width: number,
  line: (content: string, width: number) => string,
  dim: (text: string) => string,
): string[] {
  const entries = allExtensionStatusEntries(getExtensionStatuses(), rowConfig, STATUS_KEY);
  const lines = [line("", width), line(dim("Available extension statuses:"), width)];

  if (entries.length === 0) {
    lines.push(
      line(dim("No extension statuses are currently available. Type a key manually."), width),
    );
    return lines;
  }

  for (const entry of entries) {
    lines.push(
      line(
        `${dim(entry.key)} ${truncateToWidth(entry.value, Math.max(1, width - entry.key.length - 4), "…")}`,
        width,
      ),
    );
  }
  return lines;
}

export function cycleExternalStatusKey(
  widget: Widget,
  getExtensionStatuses: GetExtensionStatuses,
  rowConfig: ExtensionStatusRowConfig,
  delta: number,
): boolean {
  const keys = allExtensionStatusEntries(getExtensionStatuses(), rowConfig, STATUS_KEY).map(
    (entry) => entry.key,
  );
  if (keys.length === 0) return false;
  const currentValue = widget.options.externalStatusKey;
  const current = typeof currentValue === "string" ? currentValue : "";
  const currentIndex = keys.indexOf(current);
  const nextIndex =
    currentIndex === -1
      ? delta > 0
        ? 0
        : keys.length - 1
      : (currentIndex + delta + keys.length) % keys.length;
  widget.update({ externalStatusKey: keys[nextIndex] ?? current });
  return true;
}
