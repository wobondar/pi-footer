import { cloneConfig } from "../config.ts";
import type { StatuslineConfig } from "../types.ts";

export type ConfigChange = (config: StatuslineConfig) => void;
export type ConfigSave = (config: StatuslineConfig) => Promise<void>;

export interface ConfigUiResult {
  config: StatuslineConfig;
  saved: boolean;
}

export type ConfigState = "clean" | "dirty" | "saving" | "saved" | "error";

export class ConfigLifecycle {
  private savedConfig: StatuslineConfig;
  private configState: ConfigState = "clean";

  constructor(config: StatuslineConfig) {
    this.savedConfig = cloneConfig(config);
  }

  get dirty(): boolean {
    return this.configState === "dirty" || this.configState === "error";
  }

  get state(): ConfigState {
    return this.configState;
  }

  get label(): string | undefined {
    if (this.configState === "dirty") return "Unsaved";
    if (this.configState === "saving") return "Saving…";
    if (this.configState === "saved") return "Saved";
    if (this.configState === "error") return "Save failed";
    return undefined;
  }

  markChanged(): void {
    this.configState = "dirty";
  }

  beginSave(): void {
    this.configState = "saving";
  }

  markSaved(config: StatuslineConfig): void {
    this.savedConfig = cloneConfig(config);
    this.configState = "saved";
  }

  markSaveFailed(): void {
    this.configState = "error";
  }

  closeResult(saved: boolean): ConfigUiResult {
    return {
      config: cloneConfig(this.savedConfig),
      saved,
    };
  }
}
