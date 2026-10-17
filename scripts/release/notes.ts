import { parseConventionalCommit, type Section } from "./core.ts";

export interface Commit {
  sha: string;
  message: string;
}
export interface PullRequest {
  number: number;
  merged_at: string | null;
  merge_commit_sha: string | null;
  base: { ref: string };
  user: { login: string };
}

function markdownText(value: string) {
  return value.replace(/[\\`*_{}[\]<>]/g, "\\$&").replace(/@/g, "&#64;");
}

// develop receives squash merges, so merge_commit_sha identifies the original
// PR exactly. The develop -> production promotion PR is deliberately excluded.
export function originalPullRequests(
  pulls: PullRequest[],
  reachable: Set<string>,
) {
  const result = new Map<string, PullRequest>();
  for (const pull of pulls) {
    if (
      !pull.merged_at ||
      !pull.merge_commit_sha ||
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

export function renderNotes({
  tag,
  previousTag,
  date,
  commits,
  pullsBySha,
  repository,
}: {
  tag: string;
  previousTag: string | null;
  date: string;
  commits: Commit[];
  pullsBySha: Map<string, PullRequest>;
  repository: string;
}) {
  const sections = new Map<Section, string[]>([
    ["Breaking Changes", []],
    ["Features", []],
    ["Performance", []],
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
    sections.get(parsed.section)?.push(`- ${label}${credit}`);
  }

  const lines = [`## ${tag} - ${date}`, ""];
  for (const [heading, entries] of sections) {
    if (entries.length) lines.push(`### ${heading}`, "", ...entries, "");
  }
  if (previousTag) {
    lines.push(
      `**Full Changelog**: https://github.com/${repository}/compare/${previousTag}...${tag}`,
      "",
    );
  }
  return lines.join("\n");
}

export function prependChangelog(existing: string, notes: string) {
  const history = existing.replace(/^# Changelog\s*\n/i, "").trim();
  return `# Changelog\n\n${notes.trim()}\n${history ? `\n${history}\n` : ""}`;
}

export function extractReleaseNotes(changelog: string, tag: string) {
  const escaped = tag.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = new RegExp(
    `^## ${escaped} - [^\\n]+\\n[\\s\\S]*?(?=^## |$(?![\\s\\S]))`,
    "m",
  ).exec(changelog);
  if (!match) throw new Error(`CHANGELOG.md has no section for ${tag}`);
  return `${match[0].trim()}\n`;
}
