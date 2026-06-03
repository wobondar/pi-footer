import { describe, expect, it } from "vitest";

import { normalizeConfig } from "../../../src/config.js";
import { renderStatuslines } from "../../../src/render.js";
import { makeStatuslineData } from "../../helpers/render.js";
import type { WidgetOptions } from "../../../src/types.js";
import {
  fieldsForWidget,
  formatWidgetColorOptions,
  formatWidgetOptions,
} from "../../../src/ui/fields.js";
import { EventValueWidget } from "../../../src/widgets/core/event.js";
import { WidgetInstance } from "../../../src/widgets/instance.js";
import { defaultOptionsFromSpec } from "../../../src/widgets/options.js";
import { registry } from "../../../src/widgets/registry.js";
import { WidgetStore } from "../../../src/widgets/store.js";
import type { WidgetContext } from "../../../src/widgets/types.js";

function eventValue(options: WidgetOptions = {}) {
  return registry.createWidget("event", options);
}

function ctx(overrides: Partial<WidgetContext<["eventWidgets"]>> = {}) {
  return {
    iconMode: "text",
    minimalist: false,
    colorLevel: "none",
    eventWidgets: new Map([["fast_mode", "on"]]),
    ...overrides,
  } satisfies WidgetContext<["eventWidgets"]>;
}

const statuslineData = makeStatuslineData({ eventWidgets: new Map([["fast_mode", "on"]]) });

describe("EventValueWidget", () => {
  it("owns metadata and default options", () => {
    expect(EventValueWidget.type).toBe("event");
    expect(EventValueWidget.label).toBe("Event Value");
    expect(EventValueWidget.category).toBe("Core");
    expect(EventValueWidget.description).toBe(
      "Value updated by other extensions through pi.events",
    );
    expect(EventValueWidget.dependencies).toEqual(["eventWidgets"]);
    expect(EventValueWidget.baseOptions).toEqual(["raw", "hideWhenEmpty", "icon", "text"]);
    expect(EventValueWidget.baseOptionDefaults).toEqual({ hideWhenEmpty: true });
    expect(EventValueWidget.icons).toEqual({ emoji: "", nerd: "", text: "" });
    expect(EventValueWidget.defaultStyle).toEqual({ fg: "default", bg: "default", bold: false });

    const first = registry.createEntry("event");
    const second = registry.createEntry("event");
    expect(first.options).toMatchObject({
      raw: false,
      hideWhenEmpty: true,
      icon: "",
      text: "-",
      fg: "default",
      bg: "default",
      bold: false,
    });
    expect(first.options.widgetId).toMatch(/^event_[a-z0-9]+$/);
    expect(second.options.widgetId).toMatch(/^event_[a-z0-9]+$/);
    expect(second.options.widgetId).not.toBe(first.options.widgetId);
    const widget = eventValue();
    expect(widget).toBeInstanceOf(WidgetInstance);
    expect(registry.spec(widget.type)).toBe(EventValueWidget);
  });

  it("applies typed dynamic defaults for new event widgets", () => {
    expect(registry.spec("event").createOptionDefaults?.().widgetId).toMatch(/^event_[a-z0-9]+$/);

    const first = defaultOptionsFromSpec(registry.spec("event"));
    const second = defaultOptionsFromSpec(registry.spec("event"));
    expect(first.widgetId).toMatch(/^event_[a-z0-9]+$/);
    expect(second.widgetId).toMatch(/^event_[a-z0-9]+$/);
    expect(second.widgetId).not.toBe(first.widgetId);
  });

  it("renders labels, custom icons, raw values, fallbacks, and missing values", () => {
    expect(eventValue({ widgetId: "fast_mode" }).render(ctx())).toBe("on");
    expect(eventValue({ widgetId: "fast_mode", icon: "⚡" }).render(ctx())).toBe("⚡on");
    expect(eventValue({ widgetId: "fast_mode", raw: true, icon: "⚡" }).render(ctx())).toBe("on");
    expect(eventValue({ widgetId: "missing" }).render(ctx())).toBeUndefined();
    expect(eventValue({ widgetId: "missing", hideWhenEmpty: false }).render(ctx())).toBe("-");
    expect(
      eventValue({ widgetId: "missing", hideWhenEmpty: false, text: "unset" }).render(ctx()),
    ).toBe("unset");
  });

  it("exposes metadata fields and summaries", () => {
    expect(fieldsForWidget(eventValue({ widgetId: "fast_mode" })).map((field) => field.id)).toEqual(
      ["enabled", "raw", "hideWhenEmpty", "icon", "widgetId"],
    );
    expect(
      fieldsForWidget(eventValue({ widgetId: "fast_mode", hideWhenEmpty: false })).map(
        (field) => field.id,
      ),
    ).toEqual(["enabled", "raw", "hideWhenEmpty", "icon", "text", "widgetId"]);
    expect(formatWidgetOptions(eventValue({ widgetId: "fast_mode" }))).toBe(
      "hide-empty • id=fast_mode",
    );
    expect(formatWidgetOptions(eventValue({ widgetId: "fast_mode", raw: true }))).toBe(
      "raw • hide-empty • id=fast_mode",
    );
    expect(
      formatWidgetOptions(
        eventValue({ widgetId: "fast_mode", hideWhenEmpty: false, text: "unset" }),
      ),
    ).toBe("text='unset' • id=fast_mode");
    expect(formatWidgetColorOptions(eventValue({ widgetId: "fast_mode", fg: "green" }))).toBe(
      "hide-empty • fg=Green",
    );
  });

  it("normalizes config and hydrates store entries through metadata", () => {
    expect(
      normalizeConfig({
        lines: [[{ type: "event", options: { widgetId: "fast_mode", raw: true } }]],
      }).lines[0]?.[0]?.options,
    ).toMatchObject({ widgetId: "fast_mode", raw: true, hideWhenEmpty: true });

    const store = WidgetStore.fromConfig(
      normalizeConfig({ lines: [[{ type: "event", options: { widgetId: "fast_mode" } }]] }),
    );
    expect(store.lines[0]?.[0]).toBeInstanceOf(WidgetInstance);
    expect(store.lines[0]?.[0]?.type).toBe(EventValueWidget.type);
  });

  it("generates a widgetId when event config options are missing", () => {
    const normalized = normalizeConfig({ lines: [[{ type: "event" }]] });
    expect(normalized.lines[0]?.[0]?.options.widgetId).toMatch(/^event_[a-z0-9]+$/);
  });

  it("keeps corrupted widgetId behavior explicit", () => {
    // TODO(widget-spec): decide whether invalid widgetId should regenerate once specs own defaults.
    expect(
      normalizeConfig({ lines: [[{ type: "event", options: { widgetId: 7, raw: "yes" } }]] })
        .lines[0]?.[0]?.options,
    ).toMatchObject({ widgetId: "", raw: false, hideWhenEmpty: true });
  });

  it("receives eventWidgets through the production store render path", () => {
    const store = WidgetStore.fromConfig(
      normalizeConfig({
        terminal: { colorLevel: "none" },
        lines: [[{ type: "event", options: { widgetId: "fast_mode" } }]],
      }),
    );

    expect(renderStatuslines(store, statuslineData, 200)).toEqual(["on"]);
    expect(renderStatuslines(store, { ...statuslineData, eventWidgets: new Map() }, 200)).toEqual(
      [],
    );
  });
});
