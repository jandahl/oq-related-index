import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

async function readSchema(name) {
  return JSON.parse(await readFile(new URL(`../schema/${name}`, import.meta.url), "utf8"));
}

test("published schemas are versioned and self-identifying", async () => {
  const index = await readSchema("oq-related-index-0.2.schema.json");
  const shards = await readSchema("oq-related-index-shards-0.1.schema.json");
  assert.equal(index.$id, "https://jandahl.github.io/oq-related-index/schema/oq-related-index-0.2.schema.json");
  assert.equal(shards.$id, "https://jandahl.github.io/oq-related-index/schema/oq-related-index-shards-0.1.schema.json");
  assert.equal(index.properties.meta.$ref, "#/$defs/meta");
  assert.equal(shards.properties.schema.const, "oq-related-index-shards/0.1");
});
