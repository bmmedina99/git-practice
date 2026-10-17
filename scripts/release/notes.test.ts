import assert from "node:assert/strict";
import { test } from "vitest";
import {
  extractReleaseNotes,
  originalPullRequests,
  prependChangelog,
  renderNotes,
} from "./notes.ts";

const sha = "abcdef1234567890";
const original = {
  number: 42,
  merged_at: "2026-10-01",
  merge_commit_sha: sha,
  base: { ref: "develop" },
  user: { login: "alice", type: "User" },
};

test("original squash PR wins over promotion PR; unmerged PRs are ignored", () => {
  const pulls = originalPullRequests(
    [
      { ...original, number: 50, base: { ref: "production" } },
      { ...original, number: 43, merged_at: null },
      original,
    ],
    new Set([sha]),
  );
  assert.equal(pulls.get(sha)?.number, 42);
  assert.equal(originalPullRequests([original], new Set()).size, 0);
});

test("notes include exact PR credit, while direct commits have no PR or thanks", () => {
  const notes = renderNotes({
    tag: "v1.1.0",
    previousTag: "v1.0.0",
    date: "2026-10-04",
    repository: "owner/repo",
    commits: [
      { sha, message: "feat(kana): add practice (#42)" },
      { sha: "123456789", message: "fix: direct correction" },
      { sha: "999999999", message: "refactor!: replace storage" },
      { sha: "888888888", message: "perf(cache): reuse results" },
    ],
    pullsBySha: new Map([[sha, original]]),
  });
  assert.match(
    notes,
    /- kana: add practice \(#42\) \(abcdef1\) - thanks @alice/,
  );
  assert.match(notes, /- direct correction \(1234567\)\n/);
  assert.match(notes, /### Breaking Changes/);
  assert.match(notes, /### Features/);
  assert.match(notes, /### Fixes/);
  assert.match(notes, /### Performance\n\n- cache: reuse results \(8888888\)/);
  assert.doesNotMatch(notes, /New Contributors|first contribution/);
  assert.doesNotMatch(notes, /#50|sin PR|thanks @undefined/);
});

test("changelog preserves history and recovery extracts only the requested version", () => {
  const older = "## v1.0.0 - 2026-09-01\n\n### Fixes\n\n- Older fix\n";
  const newer = "## v1.1.0 - 2026-10-04\n\n### Features\n\n- New feature\n";
  const changelog = prependChangelog(`# Changelog\n\n${older}`, newer);
  assert.equal(changelog.match(/^# Changelog$/gm)?.length, 1);
  assert.equal(extractReleaseNotes(changelog, "v1.1.0"), newer);
  assert.equal(extractReleaseNotes(changelog, "v1.0.0"), older);
  assert.throws(() => extractReleaseNotes(changelog, "v2.0.0"), /no section/);
});

test("breaking perf appears only in Breaking Changes", () => {
  const notes = renderNotes({
    tag: "v1.0.0",
    previousTag: null,
    date: "2026-10-07",
    repository: "owner/repo",
    commits: [{ sha, message: "perf!: replace cache" }],
    pullsBySha: new Map(),
  });
  assert.match(notes, /### Breaking Changes/);
  assert.doesNotMatch(notes, /### Performance/);
});
