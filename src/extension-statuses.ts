import { isRecord } from "./types.js";

export const EMPTY_STATUS_LABEL = "[Empty status]";

export interface ExtensionStatusRowConfig {
  hiddenKeys: string[];
  knownKeys: string[];
}

interface ExtensionStatusEntry {
  key: string;
  value: string;
  published: boolean;
}

export type GetExtensionStatuses = () => ReadonlyMap<string, string>;

export const DEFAULT_EXTENSION_STATUS_ROW: ExtensionStatusRowConfig = {
  hiddenKeys: [],
  knownKeys: [],
};

export const EMPTY_EXTENSION_STATUSES: ReadonlyMap<string, string> = new Map<string, string>();

export function extensionStatusEntries(
  statuses: ReadonlyMap<string, string>,
  ownStatusKey: string,
): ExtensionStatusEntry[] {
  return [...statuses.entries()]
    .filter(([key, value]) => key !== ownStatusKey && value.length > 0)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => ({ key, value, published: true }));
}

export function allExtensionStatusEntries(
  statuses: ReadonlyMap<string, string>,
  rowConfig: ExtensionStatusRowConfig,
  ownStatusKey: string,
): ExtensionStatusEntry[] {
  const keys = new Set([...statuses.keys(), ...rowConfig.hiddenKeys, ...rowConfig.knownKeys]);
  return [...keys]
    .filter((key) => key.length > 0 && key !== ownStatusKey)
    .sort((left, right) => left.localeCompare(right))
    .map((key) => {
      const value = statuses.get(key) ?? "";
      return {
        key,
        value: value.length > 0 ? value : EMPTY_STATUS_LABEL,
        published: value.length > 0,
      };
    });
}

export function visibleExtensionStatusRowEntries(
  statuses: ReadonlyMap<string, string>,
  hiddenKeys: readonly string[],
  ownStatusKey: string,
): ExtensionStatusEntry[] {
  const hidden = new Set(hiddenKeys);
  return extensionStatusEntries(statuses, ownStatusKey).filter((entry) => !hidden.has(entry.key));
}

export function toggleExtensionStatusRowKey(
  rowConfig: ExtensionStatusRowConfig,
  key: string,
): ExtensionStatusRowConfig {
  const hidden = new Set(rowConfig.hiddenKeys);
  const known = new Set(rowConfig.knownKeys);
  known.add(key);
  if (hidden.has(key)) hidden.delete(key);
  else hidden.add(key);
  return {
    hiddenKeys: sortedKeys(hidden),
    knownKeys: sortedKeys(known),
  };
}

export function normalizeExtensionStatusRow(value: unknown): ExtensionStatusRowConfig {
  if (!isRecord(value)) return cloneExtensionStatusRow(DEFAULT_EXTENSION_STATUS_ROW);
  return {
    hiddenKeys: normalizeKeyList(value.hiddenKeys),
    knownKeys: normalizeKeyList(value.knownKeys),
  };
}

export function cloneExtensionStatusRow(value: ExtensionStatusRowConfig): ExtensionStatusRowConfig {
  return {
    hiddenKeys: [...value.hiddenKeys],
    knownKeys: [...value.knownKeys],
  };
}

function normalizeKeyList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return sortedKeys(
    new Set(value.filter((key): key is string => typeof key === "string" && key.length > 0)),
  );
}

function sortedKeys(keys: Iterable<string>): string[] {
  return [...keys].sort((left, right) => left.localeCompare(right));
}
