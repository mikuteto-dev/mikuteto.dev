/**
 * Pulls real repository metadata at build time.
 *
 * Hand-written dates went stale the moment they were typed: every entry claimed
 * 2025 while every repository was created in 2026, and nothing in the build could
 * catch it. Only the curated list of names lives in source now; language, last
 * activity and URL come from the API.
 *
 * A failed fetch keeps the previous file rather than breaking the build, because
 * a deploy should not depend on GitHub being reachable.
 */
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const USER = "mikuteto-dev";
const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(HERE, "../src/data/repos.generated.json");
/** Shared with the app so only curated repositories reach the bundle. */
const FEATURED_PATH = resolve(HERE, "../src/data/featured.json");

/** YYYY.MM. The year alone is identical across every repository here. */
function stamp(iso) {
  return `${iso.slice(0, 4)}.${iso.slice(5, 7)}`;
}

async function readCache() {
  try {
    return JSON.parse(await readFile(OUT, "utf8"));
  } catch {
    return null;
  }
}

async function main() {
  const headers = { "user-agent": `${USER}-portfolio-build` };
  if (process.env.GITHUB_TOKEN) {
    headers.authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  let payload;
  try {
    const res = await fetch(
      `https://api.github.com/users/${USER}/repos?per_page=100&sort=updated`,
      { headers },
    );
    if (!res.ok) throw new Error(`GitHub responded ${res.status}`);
    payload = await res.json();
  } catch (error) {
    const cache = await readCache();
    if (cache) {
      console.warn(
        `[repos] fetch failed (${error.message}); keeping cache from ${cache.generatedAt}`,
      );
      return;
    }
    throw new Error(
      `[repos] fetch failed (${error.message}) and no cache exists to fall back on`,
    );
  }

  let featured;
  try {
    featured = JSON.parse(await readFile(FEATURED_PATH, "utf8"));
  } catch (error) {
    throw new Error(
      `[repos] could not read ${FEATURED_PATH}: ${error.message}. ` +
        `It must be a JSON array of repository names, e.g. ["my-repo"].`,
    );
  }
  if (!Array.isArray(featured) || featured.some((n) => typeof n !== "string")) {
    throw new Error(
      `[repos] ${FEATURED_PATH} must be a JSON array of repository name strings.`,
    );
  }

  const byName = new Map(payload.map((repo) => [repo.name, repo]));

  const missing = featured.filter((name) => !byName.has(name));
  if (missing.length) {
    console.warn(`[repos] not found on GitHub: ${missing.join(", ")}`);
  }

  const repos = {};
  for (const name of featured) {
    const repo = byName.get(name);
    if (!repo) continue;
    repos[name] = {
      language: repo.language ?? null,
      updated: stamp(repo.pushed_at),
      url: repo.html_url,
    };
  }

  await mkdir(dirname(OUT), { recursive: true });
  await writeFile(
    OUT,
    `${JSON.stringify({ generatedAt: new Date().toISOString(), repos }, null, 2)}\n`,
  );
  console.log(`[repos] wrote ${Object.keys(repos).length} repositories`);
}

await main();
