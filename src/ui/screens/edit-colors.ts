import { Key, matchesKey } from "@earendil-works/pi-tui";

import type { Widget } from "../../widgets/types.js";
import {
  applyColorDigit,
  applyColorOptionField,
  deleteColorDigit,
  EDIT_COLORS_HINT,
} from "../color-options.js";
import { editColorsFieldRows, editColorsTitle } from "../edit-colors.js";
import { colorFields } from "../fields.js";
import { isPrintable, wrap } from "../helpers.js";
import type { ColorOptionField } from "../model.js";
import { Controller } from "./controller.js";

export class EditColorsScreen extends Controller {
  private selected = 0;

  renderScreen(width: number): string[] {
    const widget = this.ctx.currentWidget();
    if (!widget) return [this.render.line(this.ctx.theme.warning("No widget selected"), width)];
    const fields = editColorsFieldRows(widget);
    this.clampSelection(fields.length);
    return [
      this.render.line(
        this.render.menuTitle(editColorsTitle(widget), "Select a field to edit its colors"),
        width,
      ),
      this.render.line(this.ctx.theme.dim(EDIT_COLORS_HINT), width),
      ...fields.map((field, index) => this.render.menuLine(index === this.selected, field, width)),
    ];
  }

  handleInput(data: string): void {
    const widget = this.ctx.currentWidget();
    if (!widget) return;
    const fields = colorFields(widget);
    this.clampSelection(fields.length);
    const field = fields[this.selected];
    if (!field) return;
    if (matchesKey(data, Key.up)) this.selected = wrap(this.selected - 1, fields.length);
    else if (matchesKey(data, Key.down)) this.selected = wrap(this.selected + 1, fields.length);
    else if (matchesKey(data, Key.left)) this.adjustColorField(widget, field, -1);
    else if (matchesKey(data, Key.right) || matchesKey(data, Key.enter))
      this.adjustColorField(widget, field, 1);
    else if (matchesKey(data, Key.backspace)) this.deleteColorDigit(widget, field);
    else if (isPrintable(data)) this.applyColorDigit(widget, field, data);
  }

  private clampSelection(fieldCount: number): void {
    this.selected = Math.min(Math.max(this.selected, 0), Math.max(0, fieldCount - 1));
  }

  private applyColorDigit(widget: Widget, field: ColorOptionField, digit: string): void {
    if (!applyColorDigit(widget, field, digit)) return;
    this.ctx.emitChange();
  }

  private deleteColorDigit(widget: Widget, field: ColorOptionField): void {
    if (!deleteColorDigit(widget, field)) return;
    this.ctx.emitChange();
  }

  private adjustColorField(widget: Widget, field: ColorOptionField, delta: number): void {
    applyColorOptionField(widget, field, delta);
    this.ctx.emitChange();
  }
}
