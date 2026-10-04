import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { runRelease } from "./release.mjs";

function fixture(t) {
  const directory = mkdtempSync(join(tmpdir(), "kirakana-release-"));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const cwd = join(directory, "work");
  const remote = join(directory, "remote.git");
  execFileSync("git", ["init", "--bare", "--quiet", remote]);
  execFileSync("git", ["init", "--quiet", "-b", "production", cwd]);
  const git = (...args) =>
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
  writeFileSync(
    join(cwd, "package-lock.json"),
    '{"version":"9.9.9","lockfileVersion":3,"packages":{"":{"version":"9.9.9"}}}\n',
  );
  git("add", ".");
  git("commit", "-qm", "chore: initial repository");
  const initial = git("rev-parse", "HEAD");
  git("tag", "v0.0.1");
  git("remote", "add", "origin", remote);
  const commit = (message) => {
    git("commit", "--allow-empty", "-qm", message);
    return git("rev-parse", "HEAD");
  };
  const releases = new Map();
  const pulls = [];
  const writes = [];
  const api = {
    list: async (path) => {
      if (path.includes("/pulls?")) return pulls;
      return git("rev-list", "HEAD")
        .split("\n")
        .map((sha) => ({
          sha,
          author: { login: sha === initial ? "owner" : "alice", type: "User" },
        }));
    },
    request: async (path, options = {}) => {
      if (options.method === "POST") {
        writes.push(options.body);
        releases.set(options.body.tag_name, options.body);
        return options.body;
      }
      return releases.get(path.split("/").at(-1)) ?? null;
    },
  };
  const options = { cwd, repository: "owner/repo", api, date: "2026-10-04" };
  const push = () => git("push", "--quiet", "origin", "production", "--tags");
  return { cwd, git, commit, options, api, pulls, releases, writes, push };
}

test("dry run uses the tag, preserves files/refs and attributes squash PRs across promotion merges", async (t) => {
  const f = fixture(t);
  f.git("checkout", "-qb", "develop");
  const sha = f.commit("feat(kana): add practice (#42)");
  f.pulls.push({
    number: 42,
    merge_commit_sha: sha,
    merged_at: "2026-10-01",
    base: { ref: "develop" },
    user: { login: "alice", type: "User" },
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
  const result = await runRelease(f.options);
  assert.equal(result.tag, "v0.1.0");
  assert.match(result.notes, /\(#42\).*thanks @alice/);
  assert.match(result.notes, /New Contributors/);
  assert.doesNotMatch(result.notes, /#50/);
  assert.equal(f.git("rev-parse", "HEAD"), before);
  assert.equal(f.git("tag", "--list"), "v0.0.1");
  assert.equal(
    JSON.parse(readFileSync(join(f.cwd, "package.json"))).version,
    "9.9.9",
  );
  assert.equal(f.writes.length, 0);
});

test("publication updates manifests, pushes matching commit/tag and is idempotent", async (t) => {
  const f = fixture(t);
  f.commit("fix: correct direct change");
  f.push();
  const result = await runRelease({ ...f.options, publish: true });
  assert.equal(result.tag, "v0.0.2");
  assert.equal(
    f.git("log", "-1", "--format=%s"),
    "chore(release): :bookmark: v0.0.2 [skip ci]",
  );
  assert.equal(
    f.git("rev-parse", "HEAD"),
    f.git("rev-parse", "v0.0.2^{commit}"),
  );
  assert.equal(
    f.git("rev-parse", "HEAD"),
    f.git("ls-remote", "origin", "refs/heads/production").split(/\s/)[0],
  );
  for (const file of ["package.json", "package-lock.json"]) {
    assert.equal(JSON.parse(readFileSync(join(f.cwd, file))).version, "0.0.2");
  }
  assert.equal(
    JSON.parse(readFileSync(join(f.cwd, "package-lock.json"))).packages[""]
      .version,
    "0.0.2",
  );
  assert.equal(f.writes[0].body, result.notes);
  assert.doesNotMatch(result.notes, /thanks|New Contributors/);
  assert.equal(f.git("status", "--porcelain"), "");
  assert.equal(
    (await runRelease({ ...f.options, publish: true })).skipped,
    true,
  );
  assert.equal(f.writes.length, 1);
});

test("retry after API failure recovers notes from the published tag without another bump", async (t) => {
  const f = fixture(t);
  f.commit("fix: recoverable release");
  f.push();
  const request = f.api.request;
  f.api.request = async (path, options) => {
    if (options?.method === "POST") throw new Error("Simulated GitHub outage");
    return request(path, options);
  };
  await assert.rejects(
    runRelease({ ...f.options, publish: true }),
    /Simulated GitHub outage/,
  );
  const head = f.git("rev-parse", "HEAD");
  f.api.request = request;
  const preview = await runRelease(f.options);
  assert.equal(preview.recovered[0].tag, "v0.0.2");
  assert.equal(f.writes.length, 0);
  const retry = await runRelease({ ...f.options, publish: true });
  assert.equal(retry.skipped, true);
  assert.equal(f.git("rev-parse", "HEAD"), head);
  assert.equal(f.writes[0].tag_name, "v0.0.2");
  assert.equal(f.writes[0].body, preview.recovered[0].notes);
});

test("new commits during publication prevent pushing stale release metadata", async (t) => {
  const f = fixture(t);
  f.commit("fix: version candidate");
  f.push();
  const candidate = f.git("rev-parse", "HEAD");
  f.commit("chore: concurrent update");
  f.push();
  f.git("checkout", "-B", "production", candidate);
  await assert.rejects(
    runRelease({ ...f.options, publish: true }),
    /production changed/,
  );
  assert.equal(f.git("tag", "--list"), "v0.0.1");
  assert.equal(f.writes.length, 0);
});

test("a rejected atomic push leaves both remote branch and tag untouched", async (t) => {
  const f = fixture(t);
  f.commit("fix: candidate");
  f.push();
  const before = f.git("ls-remote", "origin", "refs/heads/production");
  const remote = f.git("remote", "get-url", "origin");
  execFileSync("git", [
    "--git-dir",
    remote,
    "config",
    "receive.denyNonFastForwards",
    "true",
  ]);
  const hook = join(remote, "hooks", "update");
  writeFileSync(hook, '#!/bin/sh\ncase "$1" in refs/tags/*) exit 1;; esac\n', {
    mode: 0o755,
  });
  await assert.rejects(runRelease({ ...f.options, publish: true }));
  assert.equal(f.git("ls-remote", "origin", "refs/heads/production"), before);
  assert.equal(f.git("ls-remote", "origin", "refs/tags/v0.0.2"), "");
  assert.equal(f.writes.length, 0);
  await assert.rejects(
    runRelease({ ...f.options, publish: true }),
    /matching tag is not published/,
  );
  assert.equal(f.writes.length, 0);
});

test("first release without any tags starts at zero and uses the conventional bump", async (t) => {
  const f = fixture(t);
  f.git("tag", "-d", "v0.0.1");
  f.commit("feat: first feature");
  const result = await runRelease(f.options);
  assert.equal(result.tag, "v0.1.0");
  assert.equal(result.previousTag, null);
});

test("incomplete GitHub history fails before changing versions or publishing", async (t) => {
  const f = fixture(t);
  f.commit("fix: candidate");
  f.api.list = async () => [];
  await assert.rejects(runRelease(f.options), /history is incomplete/);
  assert.equal(f.writes.length, 0);
  assert.equal(
    JSON.parse(readFileSync(join(f.cwd, "package.json"))).version,
    "9.9.9",
  );
});

test("no release-worthy commits skip all contributor API calls", async (t) => {
  const f = fixture(t);
  f.commit("docs: improve guide");
  f.api.list = () => {
    throw new Error("Unexpected API call");
  };
  assert.equal((await runRelease(f.options)).skipped, true);
});
