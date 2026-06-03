import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { asyncCache } from "../src/cache.js";
import { EMPTY_GIT_INFO, getGitInfo, loadGitInfo } from "../src/git.js";

type ExecResult = { stdout: string; stderr: string; code: number; killed: boolean };
type ExecMock = (command: string, args: string[], options?: unknown) => Promise<ExecResult>;

const REPO_OUTPUT: Record<string, string> = {
  "rev-parse --show-toplevel": "/repo",
  "rev-parse --abbrev-ref HEAD": "main",
  "rev-parse --short HEAD": "abc123",
  // Unstaged entry first (leading space in column 1) so a stray stdout.trim() would miscount it.
  "status --porcelain=v1": " M unstaged.txt\nM  staged.txt\n?? new.txt\n",
  "diff --shortstat HEAD": "1 file changed, 2 insertions(+), 1 deletion(-)",
  "rev-list --left-right --count @{upstream}...HEAD": "3\t4",
  "remote get-url origin": "git@example.com:repo.git",
};

// A pi.exec that resolves canned git output, overriding the toplevel path per test.
function gitExec(rootPath = "/repo") {
  return vi.fn<ExecMock>(async (_command, args) => {
    const key = args.join(" ");
    const output = key === "rev-parse --show-toplevel" ? rootPath : REPO_OUTPUT[key];
    if (output === undefined) return { stdout: "", stderr: "unexpected", code: 1, killed: false };
    return { stdout: output, stderr: "", code: 0, killed: false };
  });
}

function piWith(exec: ReturnType<typeof vi.fn>): ExtensionAPI {
  return { exec } as unknown as ExtensionAPI;
}

const POPULATED_REPO = {
  branch: "main",
  sha: "abc123",
  root: "repo",
  staged: 1,
  unstaged: 1,
  untracked: 1,
  insertions: 2,
  deletions: 1,
  ahead: 4,
  behind: 3,
  remote: "git@example.com:repo.git",
  isRepo: true,
};

beforeEach(() => {
  asyncCache.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
  asyncCache.clear();
});

describe("loadGitInfo", () => {
  it("loads and parses git info for a repo", async () => {
    const exec = gitExec();

    const info = await loadGitInfo(piWith(exec), "/repo", "main");

    expect(info).toMatchObject(POPULATED_REPO);
    // toplevel + 5 detail commands; the branch comes from the hint, so HEAD is never resolved.
    expect(exec).toHaveBeenCalledTimes(6);
    expect(exec).not.toHaveBeenCalledWith(
      "git",
      ["rev-parse", "--abbrev-ref", "HEAD"],
      expect.anything(),
    );
  });

  it("resolves the branch from HEAD when no hint is given", async () => {
    const exec = gitExec();

    const info = await loadGitInfo(piWith(exec), "/repo", null);

    expect(info.branch).toBe("main");
    expect(exec).toHaveBeenCalledWith(
      "git",
      ["rev-parse", "--abbrev-ref", "HEAD"],
      expect.anything(),
    );
  });

  it("returns EMPTY_GIT_INFO outside a repo without running detail commands", async () => {
    const exec = vi.fn<ExecMock>(async () => ({
      stdout: "",
      stderr: "not a repo",
      code: 128,
      killed: false,
    }));

    const info = await loadGitInfo(piWith(exec), "/not-a-repo", null);

    expect(info).toBe(EMPTY_GIT_INFO);
    expect(exec).toHaveBeenCalledTimes(1);
  });

  it("treats a killed (timed-out) command as missing", async () => {
    const exec = vi.fn<ExecMock>(async () => ({ stdout: "", stderr: "", code: 0, killed: true }));

    const info = await loadGitInfo(piWith(exec), "/repo", "main");

    expect(info).toBe(EMPTY_GIT_INFO);
  });
});

describe("getGitInfo (SWR)", () => {
  it("serves empty immediately, then fresh data after the async refresh", async () => {
    const exec = gitExec();
    const pi = piWith(exec);
    const requestRender = vi.fn<() => void>();

    // Cold read: stale-now is empty, refresh kicked in the background.
    expect(getGitInfo(pi, "/repo", "main", requestRender)).toBe(EMPTY_GIT_INFO);
    await vi.waitFor(() => expect(requestRender).toHaveBeenCalledTimes(1));

    // Warm read within TTL: populated, and no extra git commands fired.
    expect(getGitInfo(pi, "/repo", "main", requestRender)).toMatchObject(POPULATED_REPO);
    expect(exec).toHaveBeenCalledTimes(6);
  });

  it("dedupes concurrent cold reads into a single refresh", async () => {
    const exec = gitExec();
    const pi = piWith(exec);
    const requestRender = vi.fn<() => void>();

    getGitInfo(pi, "/repo", "main", requestRender);
    getGitInfo(pi, "/repo", "main", requestRender);
    await vi.waitFor(() => expect(requestRender).toHaveBeenCalled());

    expect(exec).toHaveBeenCalledTimes(6);
  });

  it("keys the cache by branch hint", async () => {
    const exec = gitExec();
    const pi = piWith(exec);
    const requestRender = vi.fn<() => void>();

    getGitInfo(pi, "/repo", "main", requestRender);
    await vi.waitFor(() => expect(requestRender).toHaveBeenCalledTimes(1));
    expect(getGitInfo(pi, "/repo", "main", requestRender).branch).toBe("main");

    // Different branch hint -> different key -> its own refresh.
    getGitInfo(pi, "/repo", "feature/cache", requestRender);
    await vi.waitFor(() => expect(requestRender).toHaveBeenCalledTimes(2));
    expect(getGitInfo(pi, "/repo", "feature/cache", requestRender).branch).toBe("feature/cache");
  });
});
