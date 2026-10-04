import assert from "node:assert/strict";
import test from "node:test";
import { createGitHubClient } from "./github.mjs";

test("pagination includes later contributors and PRs", async () => {
  const urls = [];
  const client = createGitHubClient({
    token: "test-token",
    fetchImpl: async (url) => {
      urls.push(url);
      return Response.json(
        url.endsWith("page=1") ? Array(100).fill({}) : [{ id: 101 }],
      );
    },
  });
  assert.equal((await client.list("/items?state=closed")).length, 101);
  assert.equal(
    urls[1],
    "https://api.github.com/items?state=closed&per_page=100&page=2",
  );
});

test("permission errors cannot be mistaken for missing releases", async () => {
  for (const status of [401, 403, 429, 500]) {
    const client = createGitHubClient({
      token: "test-token",
      fetchImpl: async () => new Response(null, { status }),
    });
    await assert.rejects(
      client.request("/release", { allowMissing: true }),
      new RegExp(`HTTP ${status}`),
    );
  }
});

test("404 is handled only for explicitly optional resources", async () => {
  const client = createGitHubClient({
    token: "test-token",
    fetchImpl: async () => new Response(null, { status: 404 }),
  });
  assert.equal(await client.request("/release", { allowMissing: true }), null);
  await assert.rejects(client.request("/release"), /HTTP 404/);
});
