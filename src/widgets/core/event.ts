import { createEventWidgetId } from "../../event-widgets.js";
import { defineWidget } from "../types.js";

export const EventValueWidget = defineWidget({
  type: "event",
  label: "Event Value",
  category: "Core",
  description: "Value updated by other extensions through pi.events",
  dependencies: ["eventWidgets"],
  baseOptions: ["raw", "hideWhenEmpty", "icon", "text"],
  baseOptionDefaults: { hideWhenEmpty: true },
  properties: [
    {
      id: "widgetId",
      label: "Widget ID",
      kind: "text",
      description: "ID used by pi.events publishers to update this widget",
      default: "",
      options: {
        showInWidgets: true,
        showInColors: false,
        listProperty: "id",
      },
    },
  ],
  icons: { emoji: "", nerd: "", text: "" },
  defaultStyle: { fg: "default", bg: "default", bold: false },
  createOptionDefaults() {
    return { widgetId: createEventWidgetId() };
  },
  render({ ctx, options, renderWidget }) {
    return renderWidget(ctx.eventWidgets?.get(options.widgetId ?? ""));
  },
});
