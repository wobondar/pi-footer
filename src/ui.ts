import type { ExtensionCommandContext } from "@earendil-works/pi-coding-agent";

import { cloneConfig } from "./config.ts";
import type { GetExtensionStatuses } from "./extension-statuses.ts";
import type { StatuslineConfig, StatuslineData } from "./types.ts";
import { type ConfigChange, type ConfigSave, type ConfigUiResult } from "./ui/config-lifecycle.ts";
import { CONFIG_UI_HEIGHT_RATIO } from "./ui/model.ts";
import { StatuslineConfigScreen } from "./ui/screen.ts";

export { StatuslineConfigScreen } from "./ui/screen.ts";

export async function openStatuslineConfigUi(
  ctx: ExtensionCommandContext,
  initialConfig: StatuslineConfig,
  previewData: StatuslineData,
  onChange: ConfigChange,
  onSave: ConfigSave,
  getExtensionStatuses: GetExtensionStatuses,
): Promise<ConfigUiResult> {
  let finalConfig = cloneConfig(initialConfig);

  return ctx.ui.custom<ConfigUiResult>(
    (tui, theme, _keybindings, done) => {
      const screen = new StatuslineConfigScreen(
        finalConfig,
        previewData,
        getExtensionStatuses,
        () => tui.requestRender(),
        () => tui.terminal.rows,
        {
          onChange(config) {
            finalConfig = cloneConfig(config);
            onChange(finalConfig);
            tui.requestRender();
          },
          async onSave(config) {
            finalConfig = cloneConfig(config);
            try {
              await onSave(finalConfig);
            } catch (error) {
              ctx.ui.notify(
                `Could not save pi-footer config: ${error instanceof Error ? error.message : String(error)}`,
                "error",
              );
              throw error;
            }
          },
          onClose(result) {
            done(result);
          },
          getTheme: () => theme,
        },
      );
      return screen;
    },
    {
      overlay: true,
      overlayOptions: {
        anchor: "top-center",
        width: "100%",
        maxHeight: `${CONFIG_UI_HEIGHT_RATIO * 100}%`,
        margin: 0,
      },
    },
  );
}
