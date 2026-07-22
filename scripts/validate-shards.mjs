import { readFile } from "node:fs/promises";

const file = process.argv[2] ?? "docs/manifest.json";
const root = process.argv[3] ?? "docs";
const fail = (message) => {
  console.error(`${file}: ${message}`);
  process.exit(1);
};
let manifest;
try {
  manifest = JSON.parse(await readFile(file, "utf8"));
} catch (error) {
  fail(`failed to read or parse: ${error.message}`);
}
if (manifest.schema !== "oq-related-index-shards/0.1") fail("unexpected shard schema");
if (!manifest.shards || typeof manifest.shards !== "object" || Array.isArray(manifest.shards)) fail("shards must be an object");

const ids = new Set();
let count = 0;
for (const [key, entry] of Object.entries(manifest.shards)) {
  if (!/^(?:_|[\p{L}\p{N}])$/u.test(key)) fail(`invalid shard key ${key}`);
  if (!entry || typeof entry.url !== "string" || !Number.isInteger(entry.records) || entry.records < 1) fail(`malformed shard ${key}`);
  let shard;
  try {
    shard = JSON.parse(await readFile(`${root}/${entry.url}`, "utf8"));
  } catch (error) {
    fail(`failed to read ${entry.url}: ${error.message}`);
  }
  if (!Array.isArray(shard.records) || shard.records.length !== entry.records) fail(`record count mismatch for ${key}`);
  for (const record of shard.records) {
    if (!record || typeof record.id !== "string" || ids.has(record.id)) fail(`duplicate or malformed record in ${key}`);
    ids.add(record.id);
  }
  count += shard.records.length;
}
if (count !== manifest.record_count) fail(`manifest record_count ${manifest.record_count} does not match ${count}`);
console.log(`Validated ${count} records in ${Object.keys(manifest.shards).length} shards`);
