import { execFileSync } from "node:child_process";
import {
  appendFileSync,
  existsSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import {
  latestStableTag,
  nextVersion,
  releaseBump,
  releaseCommitMessage,
} from "./core.mjs";
import { createGitHubClient } from "./github.mjs";
import {
  extractReleaseNotes,
  newContributors,
  originalPullRequests,
  prependChangelog,
  renderNotes,
} from "./notes.mjs";

export async function runRelease({
  cwd = process.cwd(),
  repository,
  api,
  publish = false,
  date = new Date().toISOString().slice(0, 10),
}) {
  if (!/^[\w.-]+\/[\w.-]+$/.test(repository ?? ""))
    throw new Error("Set GITHUB_REPOSITORY to owner/repository.");
  const git = (...args) =>
    execFileSync("git", args, {
      cwd,
      encoding: "utf8",
      maxBuffer: 64 * 1024 * 1024,
    }).trimEnd();
  const read = (file) => readFileSync(resolve(cwd, file), "utf8");
  const fileExists = (file) => existsSync(resolve(cwd, file));
  const root = `/repos/${repository}`;
  const head = git("rev-parse", "HEAD");
  if (publish) {
    if (git("branch", "--show-current") !== "production")
      throw new Error("Publication requires the production branch.");
    if (git("status", "--porcelain"))
      throw new Error("Publication requires a clean working tree.");
  }
  const previousTag = latestStableTag(git("tag", "--merged", head).split("\n"));
  const reachable = new Set(git("rev-list", head).split("\n"));
  const previousHashes = new Set(
    previousTag ? git("rev-list", previousTag).split("\n") : [],
  );
  const recovered = [];

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
      if (publish) {
        await api.request(`${root}/releases`, {
          method: "POST",
          body: {
            tag_name: previousTag,
            name: previousTag,
            body,
            generate_release_notes: false,
          },
        });
      }
      recovered.push({ tag: previousTag, notes: body });
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
      recovered,
      reason: "No feat, fix or breaking changes since the last stable tag.",
    };

  const version = nextVersion(previousTag ?? "v0.0.0", bump);
  const tag = `v${version}`;
  if (git("tag", "--list", tag))
    throw new Error(
      `Tag ${tag} already exists outside the selected release history.`,
    );

  // Full pagination matters: historical contributors must not be announced
  // again simply because they fell outside the first page of API results.
  const pulls = await api.list(`${root}/pulls?state=closed&base=develop`);
  const history = await api.list(`${root}/commits?sha=${head}`);
  const availableHashes = new Set(history.map((commit) => commit.sha));
  if ([...reachable].some((sha) => !availableHashes.has(sha))) {
    throw new Error(
      "GitHub commit history is incomplete; retry before publishing contributor credits.",
    );
  }
  const pullsBySha = originalPullRequests(pulls, reachable);
  const notes = renderNotes({
    tag,
    previousTag,
    date,
    commits,
    pullsBySha,
    repository,
    newcomers: newContributors(commits, history, previousHashes, pullsBySha),
  });
  const result = {
    skipped: false,
    previousTag,
    version,
    tag,
    notes,
    recovered,
  };
  if (!publish) return result;

  const remoteHead = git("ls-remote", "origin", "refs/heads/production").split(
    /\s/,
  )[0];
  if (remoteHead !== head)
    throw new Error(
      "production changed while preparing the release; rerun the workflow.",
    );

  const changedFiles = ["package.json", "CHANGELOG.md"];
  const pkg = JSON.parse(read("package.json"));
  pkg.version = version;
  writeFileSync(
    resolve(cwd, "package.json"),
    `${JSON.stringify(pkg, null, 2)}\n`,
  );
  // pnpm-lock.yaml has no root package version. npm lockfiles do.
  for (const lockfile of ["package-lock.json", "npm-shrinkwrap.json"]) {
    if (!fileExists(lockfile)) continue;
    const lock = JSON.parse(read(lockfile));
    lock.version = version;
    if (lock.packages?.[""]) lock.packages[""].version = version;
    writeFileSync(resolve(cwd, lockfile), `${JSON.stringify(lock, null, 2)}\n`);
    changedFiles.push(lockfile);
  }
  writeFileSync(
    resolve(cwd, "CHANGELOG.md"),
    prependChangelog(
      fileExists("CHANGELOG.md") ? read("CHANGELOG.md") : "",
      notes,
    ),
  );
  git("add", "--", ...changedFiles);
  git(
    "-c",
    "user.name=github-actions[bot]",
    "-c",
    "user.email=41898282+github-actions[bot]@users.noreply.github.com",
    "commit",
    "-m",
    releaseCommitMessage(tag),
  );
  git(
    "-c",
    "user.name=github-actions[bot]",
    "-c",
    "user.email=41898282+github-actions[bot]@users.noreply.github.com",
    "tag",
    "-a",
    tag,
    "-m",
    tag,
  );
  // Either both refs are accepted or neither is. Never force-push or push all tags.
  git(
    "push",
    "--atomic",
    "origin",
    "HEAD:refs/heads/production",
    `refs/tags/${tag}`,
  );
  await api.request(`${root}/releases`, {
    method: "POST",
    body: {
      tag_name: tag,
      name: tag,
      body: notes,
      generate_release_notes: false,
    },
  });
  return result;
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  try {
    const args = process.argv.slice(2);
    if (
      args.some((arg) => !["--publish", "--dry-run"].includes(arg)) ||
      args.length > 1
    )
      throw new Error(
        "Usage: node scripts/release/release.mjs [--dry-run|--publish]",
      );
    const publish = args.includes("--publish");
    if (publish && process.env.GITHUB_REF !== "refs/heads/production")
      throw new Error("--publish requires GITHUB_REF=refs/heads/production.");
    const result = await runRelease({
      repository: process.env.GITHUB_REPOSITORY,
      api: createGitHubClient({
        token: process.env.GH_TOKEN || process.env.GITHUB_TOKEN,
        apiUrl: process.env.GITHUB_API_URL,
      }),
      publish,
    });
    const summary = [
      `${publish ? "Release" : "Dry run — no changes published"}\n`,
      ...result.recovered.map(
        (item) => `Pending release ${item.tag}:\n\n${item.notes}`,
      ),
      result.skipped ? result.reason : result.notes,
    ].join("\n");
    console.log(summary);
    if (process.env.GITHUB_STEP_SUMMARY)
      appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${summary}\n`);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
