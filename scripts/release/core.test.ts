import assert from "node:assert/strict";
import { test } from "vitest";
import {
  type Bump,
  latestStableTag,
  nextVersion,
  parseConventionalCommit,
  parseStableTag,
  releaseBump,
} from "./core.ts";

test("stable tags are ordered numerically, excluding prereleases and unrelated tags", () => {
  assert.equal(
    latestStableTag([
      "v1.9.9",
      "v1.10.0",
      "v1.2.0",
      "v2.0.0-beta.1",
      "deploy-2026",
      "v01.0.0",
    ]),
    "v1.10.0",
  );
  assert.equal(latestStableTag(["v0.2.0", "v1.0.0", "v0.99.99"]), "v1.0.0");
  assert.equal(latestStableTag([]), null);
  assert.equal(parseStableTag("1.0.0"), null);
});

test("features and fixes retain scopes and descriptions", () => {
  assert.deepEqual(parseConventionalCommit("feat(kana): add practice (#42)"), {
    type: "feat",
    scope: "kana",
    description: "add practice (#42)",
    breaking: false,
    section: "Features",
    bump: "minor",
  });
  assert.equal(
    parseConventionalCommit("fix: repair keyboard")?.section,
    "Fixes",
  );
});

test("breaking changes support bangs and both footer spellings, including CRLF", () => {
  for (const message of [
    "feat!: replace storage",
    "fix(api)!: remove endpoint",
    "refactor: replace storage\n\nBREAKING CHANGE: migrate saved data",
    "chore(deps): upgrade runtime\r\n\r\nBREAKING-CHANGE: requires new runtime",
  ]) {
    const parsed = parseConventionalCommit(message);
    assert.ok(parsed);
    assert.equal(parsed.bump, "major", message);
    assert.equal(parsed.section, "Breaking Changes", message);
  }
});

test("incidental breaking-change text does not trigger a major release", () => {
  assert.equal(
    parseConventionalCommit("fix: explain BREAKING CHANGE: syntax")?.bump,
    "patch",
  );
  assert.equal(
    parseConventionalCommit(
      "docs: explain footers\n\nExample BREAKING CHANGE: text",
    )?.bump,
    null,
  );
});

test("non-release commits and promotion merge subjects do not trigger a release", () => {
  assert.equal(
    releaseBump([
      "docs: update guide",
      "chore(release): v1.0.0",
      "Merge pull request #50 from owner/develop",
      "not a conventional commit",
    ]),
    null,
  );
  assert.equal(parseConventionalCommit("feat: "), null);
});

test("highest bump wins regardless of commit ordering", () => {
  assert.equal(
    releaseBump(["FEAT: uppercase type", "Fix: mixed case"]),
    "minor",
  );
  assert.equal(releaseBump(["fix: a", "feat: b"]), "minor");
  assert.equal(releaseBump(["feat: a", "fix: b"]), "minor");
  assert.equal(releaseBump(["refactor!: a", "feat: b", "fix: c"]), "major");
  assert.equal(releaseBump(["docs: a", "fix: b"]), "patch");
});

test("SemVer increments reset subordinate components, including zero-major versions", () => {
  assert.equal(nextVersion("v0.0.1", "patch"), "0.0.2");
  assert.equal(nextVersion("v0.0.1", "minor"), "0.1.0");
  assert.equal(nextVersion("v0.0.1", "major"), "1.0.0");
  assert.equal(nextVersion("v2.9.9", "major"), "3.0.0");
  assert.equal(nextVersion("v2.9.9", "minor"), "2.10.0");
  assert.throws(() => nextVersion("v2.0.0-rc.1", "patch"));
  assert.throws(() => nextVersion("v2.0.0", "unknown" as Bump));
});

test("perf is a minor release, while breaking performance changes remain major", () => {
  for (const message of [
    "perf: faster startup",
    "perf(cache): reuse results",
    "PERF: faster lookup",
  ]) {
    assert.equal(parseConventionalCommit(message)?.section, "Performance");
    assert.equal(releaseBump(["fix: bug", message]), "minor");
  }
  for (const message of [
    "perf!: remove old cache",
    "perf(cache): replace cache\n\nBREAKING CHANGE: invalidate stored data",
  ]) {
    assert.equal(parseConventionalCommit(message)?.section, "Breaking Changes");
    assert.equal(releaseBump(["feat: feature", message]), "major");
  }
});
