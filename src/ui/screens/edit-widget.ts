import { Key, matchesKey } from "@earendil-works/pi-tui";

import { registry } from "../../widgets/registry.js";
import type { Widget } from "../../widgets/types.js";
import { eventWidgetUsageLines } from "../events.js";
import { cycleExternalStatusKey, statusKeyPickerLines } from "../extension-status-picker.js";
import { fieldsForWidget, fieldValue } from "../fields.js";
import { isPrintable, wrap } from "../helpers.js";
import type { OptionField } from "../model.js";
import { applyOptionField, applyOptionFieldEdit } from "../option-edit.js";
import { Controller } from "./controller.js";

const HINT = "↑/↓ field • ←/→ change • type text • backspace delete • esc back";

export class EditWidgetScreen extends Controller {
  private selected = 0;

  renderScreen(width: number): string[] {
    const widget = this.ctx.currentWidget();
    if (!widget) return [this.render.line(this.ctx.theme.warning("No widget selected"), width)];
    const fields = fieldsForWidget(widget);
    this.clampSelection(fields.length);
    const selectedField = fields[this.selected];
    const lines = [
      this.render.line(
        this.render.menuTitle(this.widgetTitle(widget), "Select a field to edit its options"),
        width,
      ),
      this.render.line(this.ctx.theme.dim(HINT), width),
      ...fields.map((field, index) =>
        this.render.menuLine(
          index === this.selected,
          `${field.label}: ${fieldValue(widget, field)}`,
          width,
        ),
      ),
    ];

    if (selectedField?.editAction === "external-status-key") {
      lines.push(
        ...statusKeyPickerLines(
          this.ctx.getExtensionStatuses,
          this.ctx.state.store.settings.extensionStatusRow,
          width,
          (content, lineWidth) => this.render.line(content, lineWidth),
          (value) => this.ctx.theme.dim(value),
        ),
      );
    }

    if (widget.type === "event") {
      lines.push(
        ...eventWidgetUsageLines(
          widget,
          width,
          (content, lineWidth) => this.render.line(content, lineWidth),
          (value) => this.ctx.theme.dim(value),
        ),
      );
    }

    return lines;
  }

  handleInput(data: string): void {
    const widget = this.ctx.currentWidget();
    if (!widget) return;
    const fields = fieldsForWidget(widget);
    this.clampSelection(fields.length);
    const field = fields[this.selected];
    if (!field) return;
    if (matchesKey(data, Key.up)) this.selected = wrap(this.selected - 1, fields.length);
    else if (matchesKey(data, Key.down)) this.selected = wrap(this.selected + 1, fields.length);
    else if (matchesKey(data, Key.left)) this.adjustField(widget, field, -1);
    else if (matchesKey(data, Key.right) || matchesKey(data, Key.enter))
      this.adjustField(widget, field, 1);
    else if (matchesKey(data, Key.backspace) && field.kind === "text")
      this.applyTextFieldEdit(widget, field, { kind: "deleteText" });
    else if (isPrintable(data) && field.kind === "text")
      this.applyTextFieldEdit(widget, field, { kind: "appendText", text: data });
  }

  private widgetTitle(widget: Widget): string {
    return `Edit ${registry.spec(widget.type).label}`;
  }

  private clampSelection(fieldCount: number): void {
    this.selected = Math.min(Math.max(this.selected, 0), Math.max(0, fieldCount - 1));
  }

  private applyTextFieldEdit(
    widget: Widget,
    field: OptionField,
    edit: { kind: "appendText"; text: string } | { kind: "deleteText" },
  ): void {
    if (applyOptionFieldEdit(widget, field, edit) !== "changed") return;
    this.ctx.emitChange();
  }

  private adjustField(widget: Widget, field: OptionField, delta: number): void {
    const result = applyOptionField(widget, field, delta);
    if (result === "external-status-key") {
      if (
        !cycleExternalStatusKey(
          widget,
          this.ctx.getExtensionStatuses,
          this.ctx.state.store.settings.extensionStatusRow,
          delta,
        )
      )
        return;
    } else if (result === "unchanged") return;
    this.ctx.emitChange();
  }
}
