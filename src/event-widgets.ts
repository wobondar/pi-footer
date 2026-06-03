import { isRecord } from "./types.js";

export const UPDATE_EVENT_WIDGET_EVENT = "pi-footer:update-widget";

interface UpdateEventWidgetPayload {
  widgetId: string;
  value: string | null;
}

const EVENT_WIDGET_ID_PREFIX = "event_";

export function createEventWidgetId(): string {
  return `${EVENT_WIDGET_ID_PREFIX}${Math.random().toString(36).slice(2, 10)}`;
}

export class EventWidgetValues {
  private readonly valuesById = new Map<string, string>();

  get values(): ReadonlyMap<string, string> {
    return this.valuesById;
  }

  update(payload: unknown): boolean {
    if (!isUpdatePayload(payload)) return false;
    if (payload.value === null) {
      return this.valuesById.delete(payload.widgetId);
    }
    const previous = this.valuesById.get(payload.widgetId);
    this.valuesById.set(payload.widgetId, payload.value);
    return previous !== payload.value;
  }
}

function isUpdatePayload(value: unknown): value is UpdateEventWidgetPayload {
  if (!isRecord(value)) return false;
  return (
    typeof value.widgetId === "string" &&
    value.widgetId.length > 0 &&
    (typeof value.value === "string" || value.value === null)
  );
}
