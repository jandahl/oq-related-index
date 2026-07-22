import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";

export const SOURCES = {
  lexicon: "https://jandahl.github.io/Oqaasileriffik-katersat/lexicon.json",
  semantic_classes: "https://jandahl.github.io/Oqaasileriffik-katersat/semantic_classes.json",
};
const BUILD_INPUTS = ["scripts/build-index.mjs", "scripts/relatedness.mjs", "schema/oq-related-index-0.2.schema.json"];

const statePath = process.argv[2] ?? ".source-fingerprint.json";
const writeState = process.argv.includes("--write");
let previous = {};
try { previous = JSON.parse(await readFile(statePath, "utf8")); } catch { /* first run */ }

const sources = {};
for (const [name, url] of Object.entries(SOURCES)) {
  const response = await fetch(url, { method: "HEAD" });
  if (!response.ok) throw new Error(`${name} HEAD failed: ${response.status}`);
  const fingerprint = response.headers.get("etag") ?? response.headers.get("last-modified") ??
    response.headers.get("content-length");
  sources[name] = { url, fingerprint };
}
const buildHash = createHash("sha256");
for (const file of BUILD_INPUTS) buildHash.update(await readFile(file));
const build_fingerprint = buildHash.digest("hex");
const changed = previous.build_fingerprint !== build_fingerprint || Object.entries(sources).some(([name, source]) =>
  previous.sources?.[name]?.url !== source.url || !source.fingerprint || previous.sources[name].fingerprint !== source.fingerprint);
const result = { schema: "oq-related-source-state/0.1", checked_at: new Date().toISOString(), changed, build_fingerprint, sources };
if (writeState) await writeFile(statePath, `${JSON.stringify({ ...result, changed: undefined }, null, 2).replace(/,\n  "changed": undefined/, "")}\n`);
console.log(JSON.stringify(result));
