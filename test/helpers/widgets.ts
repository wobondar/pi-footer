import type { WidgetOptions } from "../../src/types.js";
import { registry, type WidgetType } from "../../src/widgets/registry.js";
import type { Widget } from "../../src/widgets/types.js";

export function createHydratedWidgetForTest(type: WidgetType, options: WidgetOptions = {}): Widget {
  // TODO(widget-spec): replace this creation chain once registry owns widget lifecycle per SPEC_PLAN_APPEX_P10_P11.md.
  return registry.createWidget(type, options);
}
