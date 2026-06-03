import type { GitInfo } from "../../../src/types.js";

export const GIT_INFO: GitInfo = {
  branch: "main",
  sha: "abc1234",
  root: "pi-footer",
  staged: 1,
  unstaged: 2,
  untracked: 3,
  insertions: 10,
  deletions: 4,
  ahead: 1,
  behind: 0,
  remote: "git@github.com:example/pi-footer.git",
  isRepo: true,
};
