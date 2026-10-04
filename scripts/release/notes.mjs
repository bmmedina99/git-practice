import { parseConventionalCommit } from "./core.mjs";

function markdownText(value) {
  return value.replace(/[\\`*_{}[\]<>]/g, "\\$&").replace(/@/g, "&#64;");
}

// develop receives squash merges, so merge_commit_sha identifies the original
// PR exactly. The develop -> production promotion PR is deliberately excluded.
export function originalPullRequests(pulls, reachable) {
  const result = new Map();
  for (const pull of pulls) {
    if (
      !pull.merged_at ||
      pull.base.ref !== "develop" ||
      !reachable.has(pull.merge_commit_sha)
    )
      continue;
    if (result.has(pull.merge_commit_sha)) {
      throw new Error(`Multiple original PRs for ${pull.merge_commit_sha}`);
    }
    result.set(pull.merge_commit_sha, pull);
  }
  return result;
}

export function newContributors(commits, history, previousHashes, pullsBySha) {
  const known = new Set();
  for (const commit of history) {
    if (!previousHashes.has(commit.sha)) continue;
    if (commit.author?.login) known.add(commit.author.login.toLowerCase());
  }
  for (const [sha, pull] of pullsBySha) {
    if (previousHashes.has(sha)) known.add(pull.user.login.toLowerCase());
  }

  const metadata = new Map(history.map((commit) => [commit.sha, commit]));
  const newcomers = new Map();
  for (const commit of commits) {
    const pull = pullsBySha.get(commit.sha);
    // Direct pushes intentionally receive no acknowledgement.
    if (!pull) continue;
    const users = [pull.user, metadata.get(commit.sha)?.author];
    for (const user of users) {
      if (!user?.login || user.type === "Bot" || user.login.endsWith("[bot]"))
        continue;
      const key = user.login.toLowerCase();
      if (!known.has(key) && !newcomers.has(key)) {
        newcomers.set(key, { login: user.login, number: pull.number });
      }
    }
  }
  return [...newcomers.values()];
}

export function renderNotes({
  tag,
  previousTag,
  date,
  commits,
  pullsBySha,
  newcomers,
  repository,
}) {
  const sections = new Map([
    ["Breaking Changes", []],
    ["Features", []],
    ["Fixes", []],
  ]);
  for (const commit of commits) {
    const parsed = parseConventionalCommit(commit.message);
    if (!parsed?.section) continue;
    const pull = pullsBySha.get(commit.sha);
    const description = parsed.description.replace(/\s+\(#\d+\)$/, "");
    const label = markdownText(
      parsed.scope ? `${parsed.scope}: ${description}` : description,
    );
    const credit = pull
      ? ` (#${pull.number}) (${commit.sha.slice(0, 7)}) - thanks @${pull.user.login}`
      : ` (${commit.sha.slice(0, 7)})`;
    sections.get(parsed.section).push(`- ${label}${credit}`);
  }

  const lines = [`## ${tag} - ${date}`, ""];
  for (const [heading, entries] of sections) {
    if (entries.length) lines.push(`### ${heading}`, "", ...entries, "");
  }
  if (newcomers.length) {
    lines.push("### New Contributors", "");
    for (const newcomer of newcomers) {
      lines.push(
        `- @${newcomer.login} made their first contribution in #${newcomer.number}`,
      );
    }
    lines.push("");
  }
  if (previousTag) {
    lines.push(
      `**Full Changelog**: https://github.com/${repository}/compare/${previousTag}...${tag}`,
      "",
    );
  }
  return lines.join("\n");
}

export function prependChangelog(existing, notes) {
  const history = existing.replace(/^# Changelog\s*\n/i, "").trim();
  return `# Changelog\n\n${notes.trim()}\n${history ? `\n${history}\n` : ""}`;
}

export function extractReleaseNotes(changelog, tag) {
  const escaped = tag.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = new RegExp(
    `^## ${escaped} - [^\\n]+\\n[\\s\\S]*?(?=^## |$(?![\\s\\S]))`,
    "m",
  ).exec(changelog);
  if (!match) throw new Error(`CHANGELOG.md has no section for ${tag}`);
  return `${match[0].trim()}\n`;
}
