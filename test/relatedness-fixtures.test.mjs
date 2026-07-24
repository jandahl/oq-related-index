import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { compileRelatedness } from "../scripts/relatedness.mjs";

const fixtures = JSON.parse(await readFile(new URL("./relatedness-fixtures.json", import.meta.url)));

for (const fixture of fixtures) {
  test(`fixture: ${fixture.name}`, () => {
    const records = fixture.records.map((record) => ({
      word_class: "t", gloss_da: [], semantic_classes: ["build"], domain: null,
      ...record, headword: record.id,
    }));
    const indexes = {
      bySemanticClass: {}, byDomain: {}, byGlossToken: {}, ...fixture.indexes,
    };
    const result = compileRelatedness(records, indexes);
    for (const record of records) {
      if (!(record.id in fixture.expected)) continue;
      const expected = fixture.expected[record.id];
      const actual = result.find((item) => item.id === record.id)?.related ?? [];
      if (Array.isArray(expected)) assert.deepEqual(actual, expected);
      else {
        const match = actual.find((item) => item.id === expected.id);
        assert.ok(match);
        assert.ok(match.reasons.includes(expected.reason));
      }
    }
  });
}
