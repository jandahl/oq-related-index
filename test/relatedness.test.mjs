import test from "node:test";
import assert from "node:assert/strict";
import { compileRelatedness } from "../scripts/relatedness.mjs";

const records = [
  { id: "a", headword: "illu", word_class: "n", semantic_classes: ["home"], gloss_en: ["house"] },
  { id: "b", headword: "qaqqaq", word_class: "n", semantic_classes: ["home"], gloss_en: ["house"] },
  { id: "c", headword: "weak", word_class: "n", semantic_classes: ["other"], gloss_en: ["house"] },
];
const indexes = {
  recordsById: new Map(records.map((record) => [record.id, record])),
  bySemanticClass: { home: ["a", "b"], other: ["c"] },
  byDomain: {},
  byGlossToken: { house: ["a", "b", "c"] },
};

test("compiled relatedness includes explainable signals and reciprocal support", () => {
  const [illu] = compileRelatedness(records, indexes, { limit: 8 });
  assert.equal(illu.related[0].id, "b");
  assert.deepEqual(illu.related[0].reasons, ["same semantic class", "same word class", "shared gloss", "reciprocal relatedness"]);
  assert.ok(illu.related[0].score > 8);
});

test("broad word-class-only matches and weak gloss matches are omitted", () => {
  const [illu] = compileRelatedness(records, indexes, { limit: 8 });
  assert.deepEqual(illu.related.map((item) => item.id), ["b"]);
});

test("single-signal matches require reciprocal support", () => {
  const records = [
    { id: "source", headword: "illu", semantic_classes: ["home"], gloss_en: [] },
    { id: "one-way", headword: "kukiusaq", semantic_classes: ["other"], gloss_en: [] },
  ];
  const related = compileRelatedness(records, {
    bySemanticClass: { home: ["source", "one-way"], other: ["one-way"] }, byDomain: {}, byGlossToken: {},
  })[0].related;
  assert.deepEqual(related, []);
});

test("reciprocal single-signal matches remain available", () => {
  const records = [
    { id: "source", headword: "illu", semantic_classes: ["home"], gloss_en: [] },
    { id: "peer", headword: "qaqqaq", semantic_classes: ["home"], gloss_en: [] },
  ];
  const indexes = {
    bySemanticClass: { home: ["source", "peer"] }, byDomain: {}, byGlossToken: {},
  };
  assert.deepEqual(compileRelatedness(records, indexes)[0].related[0].reasons,
    ["same semantic class", "reciprocal relatedness"]);
});

test("compiled relatedness is bounded and excludes the source record", () => {
  const [illu] = compileRelatedness(records, indexes, { limit: 1 });
  assert.equal(illu.related.length, 1);
  assert.notEqual(illu.related[0].id, illu.id);
});

test("large semantic classes do not make every class member related", () => {
  const records = [
    { id: "source", headword: "illu", semantic_classes: ["build"], gloss_en: [] },
    { id: "broad", headword: "kukiusaq", semantic_classes: ["build"], gloss_en: [] },
  ];
  const related = compileRelatedness(records, {
    bySemanticClass: { build: ["source", "broad", ...Array.from({ length: 87 }, (_, i) => `other-${i}`)] },
    byDomain: {},
    byGlossToken: {},
  })[0].related;
  assert.deepEqual(related, []);
});
