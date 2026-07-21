import test from "node:test";
import assert from "node:assert/strict";
import { addRelationShards, groupRecords, shardKey, shardManifest } from "../scripts/shards.mjs";

test("shards use the normalized first character", () => {
  assert.equal(shardKey(" Illu"), "i");
  assert.equal(shardKey("-livik"), "_");
});

test("relations carry target shard metadata", () => {
  const records = addRelationShards([
    { id: "a", headword: "illu", related: [{ id: "b", score: 1, reasons: [] }] },
    { id: "b", headword: "qaqqaq", related: [] },
  ]);
  assert.equal(records[0].related[0].shard, "q");
});

test("manifest is deterministic and counts every record", () => {
  const groups = groupRecords([{ id: "a", headword: "illu" }, { id: "b", headword: "qaqqaq" }]);
  assert.deepEqual(shardManifest(groups), {
    i: { url: "records/i.json", records: 1 },
    q: { url: "records/q.json", records: 1 },
  });
});
