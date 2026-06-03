import { defineWidget } from "../types.js";

export const GitRemoteWidget = defineWidget({
  type: "git-remote",
  label: "Git Remote",
  category: "Git",
  description: "Origin remote",
  dependencies: ["git"],
  baseOptions: ["raw", "hideWhenEmpty", "icon", "text"],
  baseOptionDefaults: { text: "" },
  properties: [],
  icons: { emoji: "🌐", nerd: "󰊢", text: "remote" },
  defaultStyle: { fg: "cyan", bg: "default", bold: false },
  render({ ctx, renderWidget }) {
    return renderWidget(ctx.git.remote ?? "");
  },
});
