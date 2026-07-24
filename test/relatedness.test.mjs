import assert from "node:assert/strict";
import test from "node:test";
import { compileRelatedness } from "../scripts/relatedness.mjs";

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
