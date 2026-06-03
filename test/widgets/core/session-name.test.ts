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
import { SessionNameWidget } from "../../../src/widgets/core/session-name.js";
import { WidgetInstance } from "../../../src/widgets/instance.js";
import { registry } from "../../../src/widgets/registry.js";
import { WidgetStore } from "../../../src/widgets/store.js";
import type { WidgetContext } from "../../../src/widgets/types.js";

function sessionName(options: WidgetOptions = {}) {
  return registry.createWidget("session-name", options);
}

function ctx(overrides: Partial<WidgetContext<["sessionName"]>> = {}) {
  return {
    iconMode: "text",
    minimalist: false,
    colorLevel: "none",
    sessionName: "release prep",
    ...overrides,
  } satisfies WidgetContext<["sessionName"]>;
}

const statuslineData = makeStatuslineData({ sessionName: "release prep" });

describe("SessionNameWidget", () => {
  it("owns metadata and default options", () => {
    expect(SessionNameWidget.type).toBe("session-name");
    expect(SessionNameWidget.label).toBe("Session Name");
    expect(SessionNameWidget.category).toBe("Core");
    expect(SessionNameWidget.description).toBe("Pi session name");
    expect(SessionNameWidget.dependencies).toEqual(["sessionName"]);
    expect(SessionNameWidget.baseOptionDefaults).toEqual({ hideWhenEmpty: true });
    expect(SessionNameWidget.icons).toEqual({ emoji: "🏷️", nerd: "󰍹", text: "session" });
    expect(SessionNameWidget.defaultStyle).toEqual({ fg: "cyan", bg: "default", bold: false });
    expect(registry.createEntry("session-name").options).toEqual({
      raw: false,
      hideWhenEmpty: true,
      icon: "",
      text: "-",
      fg: "cyan",
      bg: "default",
      bold: false,
    });
    const widget = sessionName();
    expect(widget).toBeInstanceOf(WidgetInstance);
    expect(registry.spec(widget.type)).toBe(SessionNameWidget);
  });

  it("exposes metadata fields and summaries", () => {
    expect(fieldsForWidget(sessionName()).map((field) => field.id)).toEqual([
      "enabled",
      "raw",
      "hideWhenEmpty",
      "icon",
    ]);
    expect(fieldsForWidget(sessionName({ hideWhenEmpty: false })).map((field) => field.id)).toEqual(
      ["enabled", "raw", "hideWhenEmpty", "icon", "text"],
    );
    expect(formatWidgetOptions(sessionName())).toBe("hide-empty");
    expect(formatWidgetOptions(sessionName({ raw: true }))).toBe("raw • hide-empty");
    expect(formatWidgetOptions(sessionName({ icon: "S " }))).toBe("hide-empty • icon='S '");
    expect(formatWidgetOptions(sessionName({ hideWhenEmpty: false, text: "none" }))).toBe(
      "text='none'",
    );
    expect(formatWidgetColorOptions(sessionName({ raw: true, icon: "S ", fg: "green" }))).toBe(
      "raw • hide-empty • icon='S ' • fg=Green",
    );
  });

  it("renders labels, raw output, custom icons, minimalist output, and empty fallbacks", () => {
    expect(sessionName().render(ctx())).toBe("session release prep");
    expect(sessionName({ raw: true }).render(ctx())).toBe("release prep");
    expect(sessionName({ icon: "S " }).render(ctx())).toBe("S release prep");
    expect(sessionName().render(ctx({ minimalist: true }))).toBe("release prep");
    expect(sessionName().render(ctx({ sessionName: undefined }))).toBeUndefined();
    expect(sessionName({ hideWhenEmpty: false }).render(ctx({ sessionName: undefined }))).toBe(
      "session -",
    );
    expect(
      sessionName({ hideWhenEmpty: false, text: "unnamed" }).render(
        ctx({ sessionName: undefined }),
      ),
    ).toBe("session unnamed");
    expect(sessionName({ hideWhenEmpty: false }).render(ctx({ sessionName: "" }))).toBe(
      "session -",
    );
  });

  it("normalizes config through metadata", () => {
    expect(
      normalizeConfig({
        lines: [
          [
            {
              type: "session-name",
              options: { raw: true, hideWhenEmpty: false, icon: "S ", text: "none" },
            },
          ],
        ],
      }).lines[0]?.[0]?.options,
    ).toMatchObject({
      raw: true,
      hideWhenEmpty: false,
      icon: "S ",
      text: "none",
    });
    expect(
      normalizeConfig({
        lines: [
          [
            {
              type: "session-name",
              options: {
                raw: "yes",
                hideWhenEmpty: "no",
                hideWhenZero: true,
                icon: 7,
                text: 8,
              },
            },
          ],
        ],
      }).lines[0]?.[0]?.options,
    ).toEqual({
      raw: false,
      hideWhenEmpty: true,
      icon: "",
      text: "-",
      fg: "cyan",
      bg: "default",
      bold: false,
    });
  });

  it("receives sessionName through the production store render path", () => {
    const store = WidgetStore.fromConfig(
      normalizeConfig({
        terminal: { colorLevel: "none" },
        iconMode: "text",
        lines: [[{ type: "session-name" }]],
      }),
    );

    expect(renderStatuslines(store, statuslineData, 200)).toEqual(["session release prep"]);
    expect(renderStatuslines(store, { ...statuslineData, sessionName: undefined }, 200)).toEqual(
      [],
    );
  });
});
