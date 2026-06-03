import type { Theme } from "@earendil-works/pi-coding-agent";

// pi Theme fixtures for tests. The real Theme exposes many methods; tests only need
// fg/bg/bold, so these are minimal stubs cast to Theme.

// Returns text unchanged — for tests that need a Theme but do not assert on color markup.
export const identityPiTheme = {
  fg: (_color: string, text: string) => text,
  bg: (_color: string, text: string) => text,
  bold: (text: string) => text,
} as unknown as Theme;

// Wraps text in <color>…</color> / <bold>…</bold> markers — for tests that assert which
// color was applied.
export const taggedPiTheme = {
  fg: (color: string, text: string) => `<${color}>${text}</${color}>`,
  bg: (color: string, text: string) => `<${color}>${text}</${color}>`,
  bold: (text: string) => `<bold>${text}</bold>`,
} as unknown as Theme;
