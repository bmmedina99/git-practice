import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { type TestContext, test } from "vitest";
import { parse } from "yaml";
import type { GitHubClient } from "./github.ts";
import type { PullRequest } from "./notes.ts";
import {
  planOutputs,
  planRelease,
  type ReleasePlan,
  writePlan,
} from "./release.ts";

interface Step {
  id?: string;
  run?: string;
  if?: string;
  env?: Record<string, string>;
}
const workflow = parse(
  readFileSync(
    new URL("../../.github/workflows/release.yml", import.meta.url),
    "utf8",
  ),
);
const steps: Step[] = workflow.jobs.release.steps;
const prWorkflow = parse(
  readFileSync(
    new URL("../../.github/workflows/pull-request-checks.yml", import.meta.url),
    "utf8",
  ),
);
const titleScript: string = prWorkflow.jobs.title.steps[0].run;

function fixture(t: TestContext) {
  const directory = mkdtempSync(join(tmpdir(), "kirakana-release-"));
  t.onTestFinished(() => rmSync(directory, { recursive: true, force: true }));
  const cwd = join(directory, "work");
  const remote = join(directory, "remote.git");
  execFileSync("git", ["init", "--bare", "--quiet", remote]);
  execFileSync("git", ["init", "--quiet", "-b", "production", cwd]);
  const git = (...args: string[]) =>
    execFileSync("git", args, {
      cwd,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    }).trim();
  git("config", "user.name", "Owner");
  git("config", "user.email", "owner@example.com");
  writeFileSync(
    join(cwd, "package.json"),
    '{"name":"fixture","version":"9.9.9"}\n',
  );
  for (const file of ["package-lock.json", "npm-shrinkwrap.json"]) {
    writeFileSync(
      join(cwd, file),
      '{"version":"9.9.9","lockfileVersion":3,"packages":{"":{"version":"9.9.9"}}}\n',
    );
  }
  git("add", ".");
  git("commit", "-qm", "chore: initial repository");
  git("tag", "v0.0.1");
  git("remote", "add", "origin", remote);
  const commit = (message: string) => {
    git("commit", "--allow-empty", "-qm", message);
    return git("rev-parse", "HEAD");
  };
  const releasesFile = join(directory, "releases.json");
  writeFileSync(releasesFile, "{}");
  const releases = (): Record<string, { body: string }> =>
    JSON.parse(readFileSync(releasesFile, "utf8"));
  const pulls: PullRequest[] = [];
  const api: GitHubClient = {
    list: async (path) => {
      // Removing newcomers must also remove the full commit-history API call.
      assert.equal(path, "/repos/owner/repo/pulls?state=closed&base=develop");
      return pulls;
    },
    request: async (path) => releases()[path.split("/").at(-1) ?? ""] ?? null,
  };
  const bin = join(directory, "bin");
  mkdirSync(bin);
  // Mock only GitHub; execute the workflow's actual Bash against real local Git refs.
  writeFileSync(
    join(bin, "gh"),
    `#!/usr/bin/env node
const fs = require('node:fs');
const assert = require('node:assert/strict');
const args = process.argv.slice(2);
assert.deepEqual(args.slice(0, 2), ['release', 'create']);
assert.ok(args.includes('--verify-tag'));
if (fs.existsSync(process.env.MOCK_GH_FAIL)) { console.error('Simulated GitHub outage'); process.exit(1); }
const tag = args[2];
const releases = JSON.parse(fs.readFileSync(process.env.MOCK_GH_RELEASES, 'utf8'));
assert.equal(releases[tag], undefined, 'Duplicate release');
releases[tag] = { body: fs.readFileSync(args[args.indexOf('--notes-file') + 1], 'utf8') };
fs.writeFileSync(process.env.MOCK_GH_RELEASES, JSON.stringify(releases));
`,
    { mode: 0o755 },
  );
  const options = { cwd, repository: "owner/repo", api, date: "2026-10-07" };
  const push = () => git("push", "--quiet", "origin", "production", "--tags");
  const failFile = join(directory, "fail");
  const run = (step: Step, output: string, plan: ReleasePlan) => {
    assert.ok(step.run);
    const values = planOutputs(plan);
    const stepEnv = Object.fromEntries(
      Object.entries(step.env ?? {}).map(([key, expression]) => {
        const match = /^\$\{\{ steps\.plan\.outputs\.(\w+) \}\}$/.exec(
          expression,
        );
        assert.ok(match && match[1] in values, `Unknown output: ${expression}`);
        return [key, values[match[1]]];
      }),
    );
    const result = spawnSync(
      "bash",
      ["--noprofile", "--norc", "-eo", "pipefail", "-c", step.run],
      {
        cwd,
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"],
        env: {
          ...process.env,
          ...stepEnv,
          PATH: `${bin}:${process.env.PATH}`,
          GITHUB_REF: "refs/heads/production",
          RELEASE_DIR: output,
          MOCK_GH_RELEASES: releasesFile,
          MOCK_GH_FAIL: failFile,
        },
      },
    );
    if (result.error) throw result.error;
    if (result.status !== 0)
      throw new Error(result.stderr || `Bash exited with ${result.status}`);
    return result.stdout;
  };
  const publish = async (dryRun = false) => {
    const plan = await planRelease(options);
    const output = mkdtempSync(join(directory, "plan-"));
    writePlan(plan, output, cwd);
    const conditions: Record<string, boolean> = {
      "env.DRY_RUN != 'true' && steps.plan.outputs.pending == 'true'":
        !dryRun && plan.pending !== null,
      "env.DRY_RUN != 'true' && steps.plan.outputs.release == 'true'":
        !dryRun && !plan.skipped,
    };
    for (const step of steps.filter((step) =>
      ["recover", "push", "publish"].includes(step.id ?? ""),
    )) {
      assert.ok(
        step.if && step.if in conditions,
        "Every mutation must be gated by dry_run and the plan",
      );
      if (conditions[step.if]) run(step, output, plan);
    }
    return plan;
  };
  return {
    cwd,
    remote,
    directory,
    git,
    commit,
    options,
    api,
    pulls,
    releases,
    push,
    publish,
    failFile,
    run,
  };
}

test("dry run preserves files/refs and attributes original squash PRs without new contributors", async (t) => {
  const f = fixture(t);
  f.git("checkout", "-qb", "develop");
  const sha = f.commit("feat(kana): add practice (#42)");
  f.pulls.push({
    number: 42,
    merge_commit_sha: sha,
    merged_at: "2026-10-01",
    base: { ref: "develop" },
    user: { login: "alice" },
  });
  f.git("checkout", "production");
  f.git(
    "merge",
    "--no-ff",
    "develop",
    "-m",
    "Merge pull request #50 from owner/develop",
  );
  const before = f.git("rev-parse", "HEAD");
  const result = await f.publish(true);
  assert.equal(result.skipped, false);
  if (result.skipped) return;
  assert.equal(result.tag, "v0.1.0");
  assert.match(result.notes, /\(#42\).*thanks @alice/);
  assert.doesNotMatch(result.notes, /New Contributors|#50/);
  assert.equal(f.git("rev-parse", "HEAD"), before);
  assert.equal(f.git("tag", "--list"), "v0.0.1");
  assert.equal(
    JSON.parse(readFileSync(join(f.cwd, "package.json"), "utf8")).version,
    "9.9.9",
  );
  assert.equal(f.git("status", "--porcelain"), "");
  assert.deepEqual(f.releases(), {});
});

test("Bash publication updates manifests, atomically pushes matching refs and is idempotent", async (t) => {
  const f = fixture(t);
  f.commit("perf(cache): reuse results");
  f.push();
  const result = await f.publish();
  assert.equal(result.skipped, false);
  if (result.skipped) return;
  assert.equal(result.tag, "v0.1.0");
  assert.match(result.notes, /### Performance/);
  assert.equal(
    f.git("log", "-1", "--format=%s"),
    "chore(release): :bookmark: v0.1.0 [skip ci]",
  );
  assert.equal(
    f.git("rev-parse", "HEAD"),
    f.git("rev-parse", "v0.1.0^{commit}"),
  );
  assert.equal(
    f.git("rev-parse", "HEAD"),
    f.git("ls-remote", "origin", "refs/heads/production").split(/\s/)[0],
  );
  for (const file of [
    "package.json",
    "package-lock.json",
    "npm-shrinkwrap.json",
  ]) {
    const manifest = JSON.parse(readFileSync(join(f.cwd, file), "utf8"));
    assert.equal(manifest.version, "0.1.0");
    if (file !== "package.json")
      assert.equal(manifest.packages[""].version, "0.1.0");
  }
  assert.equal(f.releases()[result.tag].body, result.notes);
  assert.doesNotMatch(result.notes, /thanks|New Contributors/);
  assert.equal(f.git("status", "--porcelain"), "");
  assert.equal((await f.publish()).skipped, true);
  assert.equal(Object.keys(f.releases()).length, 1);
});

test("retry after GitHub failure recovers the published tag without another bump", async (t) => {
  const f = fixture(t);
  f.commit("fix: recoverable release");
  f.push();
  writeFileSync(f.failFile, "fail");
  await assert.rejects(f.publish(), /Simulated GitHub outage/);
  const head = f.git("rev-parse", "HEAD");
  rmSync(f.failFile);
  const preview = await f.publish(true);
  assert.equal(preview.pending?.tag, "v0.0.2");
  assert.deepEqual(f.releases(), {});
  const retry = await f.publish();
  assert.equal(retry.skipped, true);
  assert.equal(f.git("rev-parse", "HEAD"), head);
  assert.equal(f.releases()["v0.0.2"].body, preview.pending?.notes);
});

test("recovery can be followed by a new perf release", async (t) => {
  const f = fixture(t);
  f.commit("fix: initial fix");
  f.push();
  writeFileSync(f.failFile, "fail");
  await assert.rejects(f.publish());
  rmSync(f.failFile);
  f.commit("perf: faster startup");
  f.push();
  await f.publish();
  assert.deepEqual(Object.keys(f.releases()), ["v0.0.2", "v0.1.0"]);
});

test("concurrent production updates prevent pushing stale metadata", async (t) => {
  const f = fixture(t);
  f.commit("fix: candidate");
  f.push();
  const candidate = f.git("rev-parse", "HEAD");
  f.commit("chore: concurrent update");
  f.push();
  f.git("checkout", "-B", "production", candidate);
  await assert.rejects(f.publish(), /production changed/);
  assert.equal(f.git("tag", "--list"), "v0.0.1");
  assert.deepEqual(f.releases(), {});
});

test("rejected atomic push leaves the remote branch and tag untouched", async (t) => {
  const f = fixture(t);
  f.commit("fix: candidate");
  f.push();
  const before = f.git("ls-remote", "origin", "refs/heads/production");
  writeFileSync(
    join(f.remote, "hooks", "update"),
    '#!/bin/sh\ncase "$1" in refs/tags/*) exit 1;; esac\n',
    { mode: 0o755 },
  );
  await assert.rejects(f.publish(), /atomic push failure/);
  assert.equal(f.git("ls-remote", "origin", "refs/heads/production"), before);
  assert.equal(f.git("ls-remote", "origin", "refs/tags/v0.0.2"), "");
  assert.deepEqual(f.releases(), {});
  await assert.rejects(f.publish(), /matching tag is not published/);
});

test("first perf release without tags starts at v0.1.0", async (t) => {
  const f = fixture(t);
  f.git("tag", "-d", "v0.0.1");
  f.commit("perf: first improvement");
  const result = await planRelease(f.options);
  assert.equal(result.skipped, false);
  if (!result.skipped) {
    assert.equal(result.tag, "v0.1.0");
    assert.equal(result.previousTag, null);
  }
});

test("no release-worthy commits skip PR API calls and all publication steps", async (t) => {
  const f = fixture(t);
  f.commit("docs: improve guide");
  f.api.list = async () => {
    throw new Error("Unexpected API call");
  };
  assert.equal((await f.publish()).skipped, true);
  assert.deepEqual(f.releases(), {});
});

test("planning refuses to stage files inside the checkout", async (t) => {
  const f = fixture(t);
  f.commit("fix: candidate");
  const result = await planRelease(f.options);
  assert.throws(
    () => writePlan(result, join(f.cwd, "output"), f.cwd),
    /outside the working tree/,
  );
  assert.equal(existsSync(join(f.cwd, "output")), false);
});

test("Node runs the TypeScript CLI and emits workflow outputs without changing the checkout", (t) => {
  const f = fixture(t);
  const output = join(f.directory, "cli-plan");
  const githubOutput = join(f.directory, "github-output");
  const summary = join(f.directory, "summary");
  execFileSync(
    process.execPath,
    [
      fileURLToPath(new URL("./release.ts", import.meta.url)),
      "--output-dir",
      output,
    ],
    {
      cwd: f.cwd,
      env: {
        ...process.env,
        GITHUB_REPOSITORY: "owner/repo",
        GH_TOKEN: "test-token",
        GITHUB_OUTPUT: githubOutput,
        GITHUB_STEP_SUMMARY: summary,
      },
      stdio: "pipe",
    },
  );
  assert.equal(
    JSON.parse(readFileSync(join(output, "plan.json"), "utf8")).skipped,
    true,
  );
  assert.match(
    readFileSync(githubOutput, "utf8"),
    /^release=false\npending=false\nhead=[a-f0-9]+\ntag=\npending_tag=\ncommit_message=\n$/,
  );
  assert.match(
    readFileSync(summary, "utf8"),
    /No feat, perf, fix or breaking changes/,
  );
  assert.equal(f.git("status", "--porcelain"), "");
  assert.deepEqual(f.releases(), {});
});

test("Bash title validation accepts perf, scopes and bangs and rejects invalid titles", () => {
  const validate = (title: string) =>
    execFileSync("bash", ["-eo", "pipefail", "-c", titleScript], {
      env: { ...process.env, PR_TITLE: title },
      stdio: "pipe",
    });
  for (const title of [
    "perf: faster startup",
    "PERF(cache)!: replacement",
    "feat(kana): practice",
    "fix: $(touch should-not-exist)",
  ])
    assert.doesNotThrow(() => validate(title));
  for (const title of [
    "Add feature",
    "feat:",
    "perf:   ",
    "feat(): invalid",
    "feat: title\nsecond line",
  ])
    assert.throws(() => validate(title));
});
