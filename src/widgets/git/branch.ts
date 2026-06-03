import { defineWidget } from "../types.js";

const GIT_BRANCH_DISPLAY_STYLES = {
  default: {
    label: "Default",
    list: "default",
  },
  "round-brackets": {
    label: "Round brackets",
    list: "brackets",
  },
  custom: {
    label: "Custom surround text",
    list: "custom",
  },
} as const;

type GitBranchDisplayStyle = keyof typeof GIT_BRANCH_DISPLAY_STYLES;

const GIT_BRANCH_DISPLAY_STYLE_VALUES = Object.keys(
  GIT_BRANCH_DISPLAY_STYLES,
) as GitBranchDisplayStyle[];

export const GitBranchWidget = defineWidget({
  type: "git-branch",
  label: "Git Branch",
  category: "Git",
  description: "Current Git branch",
  dependencies: ["git"],
  baseOptions: ["raw", "hideWhenEmpty", "icon", "text"],
  baseOptionDefaults: { text: "" },
  properties: [
    {
      id: "gitBranchDisplayStyle",
      label: "Display style",
      kind: "choice",
      description: "Branch name display style",
      default: "default",
      options: {
        choices: GIT_BRANCH_DISPLAY_STYLE_VALUES.map((style) => ({
          id: style,
          label: GIT_BRANCH_DISPLAY_STYLES[style].label,
          list: GIT_BRANCH_DISPLAY_STYLES[style].list,
        })),
        showInWidgets: true,
        showInColors: false,
        listProperty: "display",
      },
    },
    {
      id: "surroundLeft",
      label: "Surround left",
      kind: "text",
      description: "Text before the branch name when custom display is enabled",
      default: "",
      showWhen: { property: "gitBranchDisplayStyle", equals: "custom" },
      options: { showInWidgets: false, showInColors: false },
    },
    {
      id: "surroundRight",
      label: "Surround right",
      kind: "text",
      description: "Text after the branch name when custom display is enabled",
      default: "",
      showWhen: { property: "gitBranchDisplayStyle", equals: "custom" },
      options: { showInWidgets: false, showInColors: false },
    },
  ],
  icons: { emoji: "🌿", nerd: "", text: "git" },
  defaultStyle: { fg: "magenta", bg: "default", bold: false },
  render({ ctx, options, renderWidget }) {
    const branch = ctx.git.branch;
    if (!branch) return renderWidget("");

    if (options.gitBranchDisplayStyle === "round-brackets") return renderWidget(`(${branch})`);
    if (options.gitBranchDisplayStyle === "custom") {
      return renderWidget(`${options.surroundLeft}${branch}${options.surroundRight}`);
    }
    return renderWidget(branch);
  },
});
