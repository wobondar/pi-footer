/// <reference types="vite/client" />
import { describe, expect, it } from "vitest";

import { EventValueWidget } from "../../src/widgets/core/event.js";
import { ModelWidget } from "../../src/widgets/core/model.js";
import { WidgetInstance } from "../../src/widgets/instance.js";
import { registry } from "../../src/widgets/registry.js";
import type { WidgetDependency } from "../../src/widgets/types.js";

const VALID_DEPENDENCIES = new Set<WidgetDependency>([
  "cwd",
  "model",
  "provider",
  "sessionName",
  "sessionId",
  "thinkingLevel",
  "textVerbosity",
  "metrics",
  "turnMetrics",
  "usingSubscription",
  "git",
  "activeToolCount",
  "contextTokens",
  "contextMaxTokens",
  "eventWidgets",
  "getExtensionStatuses",
]);

describe("widget registry", () => {
  it("exposes a unique widget catalog", () => {
    expect(new Set(registry.types).size).toBe(registry.types.length);
  });

  it("registers every defined widget", () => {
    const modules = import.meta.glob(
      "../../src/widgets/{core,git,layout,project,session,tokens}/*.ts",
      { eager: true },
    );
    const isWidgetSpec = (value: unknown): value is { type: string } =>
      typeof value === "object" &&
      value !== null &&
      typeof (value as { type?: unknown }).type === "string" &&
      typeof (value as { render?: unknown }).render === "function";

    const defined = Object.values(modules)
      .flatMap((module) => Object.values(module as Record<string, unknown>))
      .filter(isWidgetSpec)
      .map((spec) => spec.type);

    expect([...defined].sort()).toEqual([...registry.types].sort());
  });

  it("keeps definitions aligned with registry specs", () => {
    for (const definition of registry.definitions) {
      expect(registry.spec(definition.type).type).toBe(definition.type);
    }
  });

  it("exposes sane spec metadata", () => {
    for (const spec of registry.specs) {
      expect(spec.type).not.toBe("");
      expect(spec.label).not.toBe("");
      expect(spec.category).not.toBe("");
      expect(spec.description).not.toBe("");
      expect(spec.dependencies.every((dependency) => VALID_DEPENDENCIES.has(dependency))).toBe(
        true,
      );
    }
  });

  it("returns specs by type", () => {
    expect(registry.maybeSpec("nope")).toBeUndefined();
    expect(registry.spec("model").type).toBe(ModelWidget.type);
  });

  it("creates entries and applies dynamic defaults", () => {
    const first = registry.createEntry("event");
    const second = registry.createEntry("event");

    expect(first.type).toBe(EventValueWidget.type);
    expect(first.options.widgetId).toMatch(/^event_[a-z0-9]+$/);
    expect(second.options.widgetId).toMatch(/^event_[a-z0-9]+$/);
    expect(second.options.widgetId).not.toBe(first.options.widgetId);
  });

  it("normalizes options through specs", () => {
    expect(registry.normalizeOptions("model", { raw: "bad", fg: "green" })).toMatchObject({
      raw: false,
      icon: "",
      showProvider: false,
      fg: "green",
      bg: "default",
      bold: false,
    });
    expect(registry.normalizeOptions("spacer", { width: 999 })).toMatchObject({
      width: 40,
    });
    expect(registry.normalizeOptions("separator", { separator: "bad" })).toMatchObject({
      separator: "pipe",
      text: "|",
    });
  });

  it("creates spec-backed widget instances", () => {
    const widget = registry.createWidget("model");
    expect(widget).toBeInstanceOf(WidgetInstance);
    expect(widget.type).toBe(ModelWidget.type);
  });

  it("clones entries with a fresh id preserving options", () => {
    const source = registry.createEntry("model", { showProvider: true });
    const clone = registry.cloneEntry(source);

    expect(clone.type).toBe(ModelWidget.type);
    expect(clone.id).not.toBe(source.id);
    expect(clone.options.showProvider).toBe(true);
  });

  it("creates spec-backed widgets with a fresh id and sanitized options", () => {
    const widget = registry.createWidget("model", { raw: "bad", fg: "green" });

    expect(widget).toBeInstanceOf(WidgetInstance);
    expect(widget.type).toBe(ModelWidget.type);
    expect(widget.id).toMatch(/^model-/);
    expect(widget.options).toMatchObject({ raw: false, fg: "green" });
  });

  it("clones widgets into a new instance with a fresh id", () => {
    const source = registry.createWidget("model");
    const clone = registry.cloneWidget(source);

    expect(clone).toBeInstanceOf(WidgetInstance);
    expect(clone.type).toBe(ModelWidget.type);
    expect(clone.id).not.toBe(source.id);

    clone.update({ showProvider: true });
    expect(source.options.showProvider).toBe(false);
  });

  it("hydrates widgets preserving id without sharing option references", () => {
    const entry = {
      ...registry.createEntry("model", { raw: true }),
      id: "model-fixed",
      enabled: false,
    };
    const widget = registry.hydrateWidget(entry);

    expect(widget).toBeInstanceOf(WidgetInstance);
    expect(widget.id).toBe("model-fixed");
    expect(widget.enabled).toBe(false);
    expect(widget.options.raw).toBe(true);

    widget.update({ raw: false });
    expect(entry.options.raw).toBe(true);
  });

  it("cloneEntry preserves disabled state", () => {
    const source = { ...registry.createEntry("model"), enabled: false };
    expect(registry.cloneEntry(source).enabled).toBe(false);
  });

  it("cloneWidget preserves disabled state", () => {
    const source = registry.hydrateWidget({ ...registry.createEntry("model"), enabled: false });
    expect(registry.cloneWidget(source).enabled).toBe(false);
  });

  it("createEntry creates enabled widgets by default", () => {
    expect(registry.createEntry("model").enabled).toBe(true);
  });
});
