import { defineWidget } from "../types.js";

export const GitDiffWidget = defineWidget({
  type: "git-diff",
  label: "Git Diff",
  category: "Git",
  description: "Insertion/deletion diff summary",
  dependencies: ["git"],
  baseOptions: ["raw", "hideWhenEmpty", "icon", "text"],
  baseOptionDefaults: { text: "" },
  properties: [
    {
      id: "gitDiffMode",
      label: "Display",
      kind: "choice",
      description: "Git diff display mode",
      default: "plain",
      options: {
        choices: [
          { id: "plain", label: "Plain (+/-)", list: "Plain (+/-)" },
          { id: "compact", label: "Compact (+n,-n)", list: "Compact (+n,-n)" },
        ],
        showInWidgets: true,
        showInColors: false,
        listProperty: "display",
      },
    },
  ],
  icons: { emoji: "📈", nerd: "", text: "diff" },
  defaultStyle: { fg: "yellow", bg: "default", bold: false },
  render({ ctx, options, renderWidget }) {
    return renderWidget(
      options.gitDiffMode === "compact"
        ? `(+${ctx.git.insertions},-${ctx.git.deletions})`
        : `+${ctx.git.insertions}/-${ctx.git.deletions}`,
    );
  },
});
