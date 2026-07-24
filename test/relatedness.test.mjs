import assert from "node:assert/strict";
import test from "node:test";
import { compileRelatedness, RELATEDNESS_POLICY } from "../scripts/relatedness.mjs";

test("the published policy identifies its scoring parameters", () => {
  assert.equal(RELATEDNESS_POLICY.algorithm, "bounded-signal-v2");
  assert.equal(RELATEDNESS_POLICY.sharedNeighbourCap, 1.5);
  assert.equal(RELATEDNESS_POLICY.sharedNeighbourDiscount, "inverse-log-degree");
});

const indexes = (records, byGlossToken = {}) => ({
  bySemanticClass: { build: records.map((record) => record.id) },
  byDomain: {}, byGlossToken,
});
const record = (id, gloss = []) => ({
  id, headword: id, word_class: "t", gloss_en: gloss, gloss_da: [],
  semantic_classes: ["build"], domain: null,
});

test("reciprocity does not turn one primary signal into two reasons", () => {
  const records = [record("a"), record("b")];
  const result = compileRelatedness(records, indexes(records));
  assert.deepEqual(result.map((item) => item.related), [[], []]);
});

test("two primary signals still qualify and reciprocity remains explainable", () => {
  const records = [record("a", ["house"]), record("b", ["house"] )];
  const result = compileRelatedness(records, indexes(records, { house: ["a", "b"] }));
  assert.equal(result[0].related[0].id, "b");
  assert.deepEqual(result[0].related[0].reasons.sort(), [
    "reciprocal relatedness", "same semantic class", "same word class", "shared gloss",
  ]);
});

test("shared neighbours provide a weak explainable secondary signal", () => {
  const records = [record("a"), record("b", ["b-gloss"]), record("c", ["c-gloss"] )];
  const byGlossToken = {
    "b-gloss": ["b", "c"],
    "c-gloss": ["a", "c"],
  };
  const result = compileRelatedness(records, indexes(records, byGlossToken));
  assert.equal(result[0].related[0].id, "b");
  assert.ok(result[0].related[0].reasons.includes("shared related words"));
});
