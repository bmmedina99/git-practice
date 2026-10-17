import type { PullRequest } from "./notes.ts";

export interface GitHubClient {
  request(path: string, options?: { allowMissing?: boolean }): Promise<unknown>;
  list(path: string): Promise<PullRequest[]>;
}

// Read-only GitHub REST client using Node's built-in fetch. A 404 is only optional when
// explicitly requested; authentication, permission and rate-limit errors fail.
export function createGitHubClient({
  token,
  apiUrl = "https://api.github.com",
  fetchImpl = fetch,
}: {
  token?: string;
  apiUrl?: string;
  fetchImpl?: (url: string, init: RequestInit) => Promise<Response>;
}): GitHubClient {
  if (!token) throw new Error("Set GH_TOKEN or GITHUB_TOKEN to access GitHub.");

  async function request(
    path: string,
    { allowMissing = false }: { allowMissing?: boolean } = {},
  ) {
    const response = await fetchImpl(`${apiUrl}${path}`, {
      method: "GET",
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${token}`,
        "X-GitHub-Api-Version": "2026-03-10",
        "Content-Type": "application/json",
      },
      signal: AbortSignal.timeout(30_000),
    });
    if (allowMissing && response.status === 404) return null;
    if (!response.ok) {
      throw new Error(`GitHub GET ${path}: HTTP ${response.status}`);
    }
    return response.status === 204 ? null : response.json();
  }

  async function list(path: string): Promise<PullRequest[]> {
    const items = [];
    for (let page = 1; ; page++) {
      const separator = path.includes("?") ? "&" : "?";
      const batch = await request(
        `${path}${separator}per_page=100&page=${page}`,
      );
      if (!Array.isArray(batch))
        throw new Error(`Expected an array from ${path}`);
      items.push(...batch);
      if (batch.length < 100) return items;
    }
  }

  return { request, list };
}
