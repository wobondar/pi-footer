import { describe, expect, it } from "vitest";

import { createHydratedWidgetForTest } from "./helpers/widgets.js";
import { createEventWidgetId, EventWidgetValues } from "../src/event-widgets.js";
import { eventWidgetUsageLines } from "../src/ui/events.js";

describe("event widget UI", () => {
  it("renders usage lines", () => {
    const lines = eventWidgetUsageLines(
      createHydratedWidgetForTest("event", { widgetId: "fast_mode" }),
      80,
      (content) => content,
      (text) => `<${text}>`,
    );

    expect(lines[0]).toBe("");
    expect(lines[1]).toBe("<Send events with a value:>");
    expect(lines[2]).toContain("fast_mode");
    expect(lines[3]).toBe("");
    expect(lines[4]).toBe("<Send events to remove status:>");
    expect(lines[5]).toContain("fast_mode");

    const eventWithoutId = createHydratedWidgetForTest("event");
    delete eventWithoutId.options.widgetId;
    const linesWithoutId = eventWidgetUsageLines(
      eventWithoutId,
      80,
      (content) => content,
      (text) => text,
    );
    expect(linesWithoutId[2]).toContain('"widgetId": ""');
    expect(linesWithoutId[5]).toContain('"value": null');
  });
});

describe("event widgets", () => {
  it("generates editable prefixed widget IDs", () => {
    const id = createEventWidgetId();
    expect(id).toMatch(/^event_[a-z0-9]+$/);
  });

  it("stores, updates, and clears values", () => {
    const values = new EventWidgetValues();

    expect(values.update({ widgetId: "service_tier", value: "fast" })).toBe(true);
    expect(values.values.get("service_tier")).toBe("fast");

    expect(values.update({ widgetId: "service_tier", value: "fast" })).toBe(false);
    expect(values.update({ widgetId: "service_tier", value: "slow" })).toBe(true);
    expect(values.values.get("service_tier")).toBe("slow");

    expect(values.update({ widgetId: "service_tier", value: null })).toBe(true);
    expect(values.values.has("service_tier")).toBe(false);
  });

  it("ignores malformed payloads", () => {
    const values = new EventWidgetValues();
    expect(values.update({ widgetId: "service_tier", value: 1 })).toBe(false);
    expect(values.update({ value: "fast" })).toBe(false);
    expect(values.values.size).toBe(0);
  });
});
