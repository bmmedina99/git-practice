import { execFileSync } from "node:child_process";
import {
  appendFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { isAbsolute, relative, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";
import {
  latestStableTag,
  nextVersion,
  releaseBump,
  releaseCommitMessage,
} from "./core.ts";
import { createGitHubClient, type GitHubClient } from "./github.ts";
import {
  extractReleaseNotes,
  originalPullRequests,
  prependChangelog,
  renderNotes,
} from "./notes.ts";

interface PendingRelease {
  tag: string;
  notes: string;
}
export type ReleasePlan = {
  head: string;
  pending: PendingRelease | null;
} & (
  | { skipped: true; reason: string }
  | {
      skipped: false;
      previousTag: string | null;
      version: string;
      tag: string;
      commitMessage: string;
      notes: string;
    }
);

// Only generated, single-line values become workflow outputs. Notes stay in files.
export function planOutputs(plan: ReleasePlan): Record<string, string> {
  return {
    release: String(!plan.skipped),
    pending: String(plan.pending !== null),
    head: plan.head,
    tag: plan.skipped ? "" : plan.tag,
    pending_tag: plan.pending?.tag ?? "",
    commit_message: plan.skipped ? "" : plan.commitMessage,
  };
}

// Planning reads Git and GitHub, but never changes the repository or publishes.
export async function planRelease({
  cwd = process.cwd(),
  repository,
  api,
  date = new Date().toISOString().slice(0, 10),
}: {
  cwd?: string;
  repository: string;
  api: GitHubClient;
  date?: string;
}): Promise<ReleasePlan> {
  if (!/^[\w.-]+\/[\w.-]+$/.test(repository))
    throw new Error("Set GITHUB_REPOSITORY to owner/repository.");
  const git = (...args: string[]) =>
    execFileSync("git", args, {
      cwd,
      encoding: "utf8",
      maxBuffer: 64 * 1024 * 1024,
    }).trimEnd();
  const root = `/repos/${repository}`;
  const head = git("rev-parse", "HEAD");
  const previousTag = latestStableTag(git("tag", "--merged", head).split("\n"));
  const reachable = new Set(git("rev-list", head).split("\n"));
  let pending: PendingRelease | null = null;

  // Recover only tags created by this script. Existing migration tags are not
  // assumed to need a release, and errors other than HTTP 404 are never ignored.
  if (
    previousTag &&
    git("log", "-1", "--format=%s", previousTag) ===
      releaseCommitMessage(previousTag)
  ) {
    const release = await api.request(`${root}/releases/tags/${previousTag}`, {
      allowMissing: true,
    });

    if (!release) {
      const tagCommit = git("rev-parse", `${previousTag}^{commit}`);
      const remoteTags = git(
        "ls-remote",
        "origin",
        `refs/tags/${previousTag}`,
        `refs/tags/${previousTag}^{}`,
      )
        .split("\n")
        .map((line) => line.split(/\s+/));
      const remoteCommit =
        remoteTags.find(([, ref]) => ref?.endsWith("^{}"))?.[0] ??
        remoteTags.find(([, ref]) => ref === `refs/tags/${previousTag}`)?.[0];
      if (remoteCommit !== tagCommit)
        throw new Error(
          `Cannot recover ${previousTag}: the matching tag is not published on origin.`,
        );
      const body = extractReleaseNotes(
        git("show", `${previousTag}:CHANGELOG.md`),
        previousTag,
      );
      pending = { tag: previousTag, notes: body };
    }
  }

  const range = previousTag ? `${previousTag}..${head}` : head;
  const fields = git(
    "log",
    "--reverse",
    "--no-merges",
    "--format=%H%x00%B%x00",
    range,
  ).split("\0");
  const commits = [];
  for (let index = 0; index + 1 < fields.length; index += 2) {
    commits.push({
      sha: fields[index].trim(),
      message: fields[index + 1].trimEnd(),
    });
  }
  const bump = releaseBump(commits.map((commit) => commit.message));
  if (!bump)
    return {
      skipped: true,
      head,
      pending,
      reason:
        "No feat, perf, fix or breaking changes since the last stable tag.",
    };

  const version = nextVersion(previousTag ?? "v0.0.0", bump);
  const tag = `v${version}`;
  if (git("tag", "--list", tag))
    throw new Error(
      `Tag ${tag} already exists outside the selected release history.`,
    );

  // PR pagination is still required for credits; commit-author history is no longer needed.
  const pulls = await api.list(`${root}/pulls?state=closed&base=develop`);
  const pullsBySha = originalPullRequests(pulls, reachable);
  const notes = renderNotes({
    tag,
    previousTag,
    date,
    commits,
    pullsBySha,
    repository,
  });
  return {
    skipped: false,
    head,
    previousTag,
    version,
    tag,
    commitMessage: releaseCommitMessage(tag),
    notes,
    pending,
  };
}

// Stage generated files outside the checkout, including during workflow previews.
export function writePlan(
  plan: ReleasePlan,
  directory: string,
  cwd = process.cwd(),
) {
  const output = resolve(directory);
  const pathFromCheckout = relative(resolve(cwd), output);
  if (
    !isAbsolute(pathFromCheckout) &&
    pathFromCheckout !== ".." &&
    !pathFromCheckout.startsWith(`..${sep}`)
  )
    throw new Error(
      "Release output directory must be outside the working tree.",
    );
  mkdirSync(output, { recursive: true });
  const write = (file: string, content: string) =>
    writeFileSync(resolve(output, file), content);
  write("plan.json", `${JSON.stringify(plan, null, 2)}\n`);
  if (plan.pending) write("pending-notes.md", plan.pending.notes);
  if (plan.skipped) return;
  write("notes.md", plan.notes);
  for (const file of [
    "package.json",
    "package-lock.json",
    "npm-shrinkwrap.json",
  ]) {
    const source = resolve(cwd, file);
    if (file !== "package.json" && !existsSync(source)) continue;
    const manifest = JSON.parse(readFileSync(source, "utf8"));
    manifest.version = plan.version;
    if (file !== "package.json" && manifest.packages?.[""])
      manifest.packages[""].version = plan.version;
    write(file, `${JSON.stringify(manifest, null, 2)}\n`);
  }
  const changelog = resolve(cwd, "CHANGELOG.md");
  write(
    "CHANGELOG.md",
    prependChangelog(
      existsSync(changelog) ? readFileSync(changelog, "utf8") : "",
      plan.notes,
    ),
  );
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  try {
    const args = process.argv.slice(2);
    if (
      args.length &&
      !(args.length === 2 && args[0] === "--output-dir" && args[1])
    )
      throw new Error(
        "Usage: node scripts/release/release.ts [--output-dir DIRECTORY]",
      );
    const plan = await planRelease({
      repository: process.env.GITHUB_REPOSITORY ?? "",
      api: createGitHubClient({
        token: process.env.GH_TOKEN || process.env.GITHUB_TOKEN,
        apiUrl: process.env.GITHUB_API_URL,
      }),
    });
    if (args[1]) writePlan(plan, args[1]);
    if (process.env.GITHUB_OUTPUT) {
      appendFileSync(
        process.env.GITHUB_OUTPUT,
        Object.entries(planOutputs(plan))
          .map(([key, value]) => `${key}=${value}\n`)
          .join(""),
      );
    }
    const summary = [
      "Release plan — no changes published\n",
      plan.pending
        ? `Pending release ${plan.pending.tag}:\n\n${plan.pending.notes}`
        : "",
      plan.skipped ? plan.reason : plan.notes,
    ]
      .filter(Boolean)
      .join("\n");
    console.log(summary);
    if (process.env.GITHUB_STEP_SUMMARY)
      appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${summary}\n`);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
