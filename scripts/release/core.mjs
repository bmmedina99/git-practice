// Pure release rules: no network requests, Git mutations or npm dependencies.
const STABLE_TAG = /^v(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;

export function releaseCommitMessage(tag) {
  return `chore(release): :bookmark: ${tag} [skip ci]`;
}

export function parseStableTag(tag) {
  const match = STABLE_TAG.exec(tag);
  return match ? match.slice(1).map(BigInt) : null;
}

// The caller must supply only tags reachable from the publication branch.
export function latestStableTag(tags) {
  let latest = null;
  for (const tag of tags) {
    const parts = parseStableTag(tag);
    if (!parts) continue;
    if (!latest) {
      latest = { tag, parts };
      continue;
    }
    for (let index = 0; index < parts.length; index++) {
      if (parts[index] === latest.parts[index]) continue;
      if (parts[index] > latest.parts[index]) latest = { tag, parts };
      break;
    }
  }
  return latest?.tag ?? null;
}

export function parseConventionalCommit(message) {
  const [subject] = message.split(/\r?\n/);
  const match =
    /^([a-z][a-z0-9-]*)(?:\(([^()\r\n]+)\))?(!)?:[ \t]+(\S.*)$/i.exec(subject);
  if (!match) return null;

  const [, rawType, scope, bang, description] = match;
  const type = rawType.toLowerCase();
  const breaking =
    Boolean(bang) ||
    /(?:^|\r?\n)BREAKING(?: CHANGE|-CHANGE):[ \t]+\S/.test(message);
  const section = breaking
    ? "Breaking Changes"
    : type === "feat"
      ? "Features"
      : type === "fix"
        ? "Fixes"
        : null;

  return {
    type,
    scope: scope ?? null,
    description,
    breaking,
    section,
    bump: breaking
      ? "major"
      : type === "feat"
        ? "minor"
        : type === "fix"
          ? "patch"
          : null,
  };
}

export function releaseBump(messages) {
  const priority = { patch: 1, minor: 2, major: 3 };
  let bump = null;
  for (const message of messages) {
    const candidate = parseConventionalCommit(message)?.bump;
    if (candidate && priority[candidate] > (priority[bump] ?? 0))
      bump = candidate;
  }
  return bump;
}

export function nextVersion(previousTag, bump) {
  const parts = parseStableTag(previousTag);
  if (!parts)
    throw new Error(`Expected a stable vX.Y.Z tag, received: ${previousTag}`);
  const index = { major: 0, minor: 1, patch: 2 }[bump];
  if (index === undefined) throw new Error(`Unsupported version bump: ${bump}`);
  parts[index] += 1n;
  for (let following = index + 1; following < parts.length; following++) {
    parts[following] = 0n;
  }
  return parts.join(".");
}
