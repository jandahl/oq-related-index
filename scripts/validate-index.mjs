import { readFile } from "node:fs/promises";

const file = process.argv[2] ?? "dist/related-index.json";
const fail = (message) => { throw new Error(`${file}: ${message}`); };
const isStringArray = (value) => Array.isArray(value) && value.every((item) => typeof item === "string");
let index;
try {
  index = JSON.parse(await readFile(file, "utf8"));
} catch (error) {
  fail(`failed to parse JSON: ${error.message}`);
}

if (!index || typeof index !== "object") fail("root must be an object");
if (index.meta?.schema !== "oq-related-index/0.1") fail("meta.schema must be oq-related-index/0.1");
if (!index.meta?.generated_at || Number.isNaN(Date.parse(index.meta.generated_at))) fail("meta.generated_at must be an ISO date");
if (!Array.isArray(index.records)) fail("records must be an array");
for (const field of ["bySemanticClass", "byDomain", "byGlossToken"]) {
  if (!index[field] || typeof index[field] !== "object" || Array.isArray(index[field])) fail(`${field} must be an object`);
}

const ids = new Set();
for (const record of index.records) {
  if (!record || typeof record !== "object") fail("records must contain objects");
  if (typeof record.id !== "string" || !record.id) fail("every record needs a non-empty string id");
  if (ids.has(record.id)) fail(`duplicate record id: ${record.id}`);
  ids.add(record.id);
  if (typeof record.headword !== "string" || !record.headword) fail(`record ${record.id} needs a headword`);
  for (const field of ["gloss_en", "gloss_da", "semantic_classes"]) {
    if (!isStringArray(record[field])) fail(`record ${record.id}: ${field} must be a string array`);
  }
  if (typeof record.word_class !== "string") fail(`record ${record.id}: word_class must be a string`);
  if (record.domain !== null && (typeof record.domain !== "object" || typeof record.domain.id !== "string" || !record.domain.id)) {
    fail(`record ${record.id}: domain must be null or an object with a non-empty string id`);
  }
}

for (const field of ["bySemanticClass", "byDomain", "byGlossToken"]) {
  for (const [key, refs] of Object.entries(index[field])) {
    if (!key || !isStringArray(refs)) fail(`${field}.${key} must contain a string array`);
    const seenRefs = new Set();
    for (const id of refs) {
      if (!ids.has(id)) fail(`${field}.${key} references missing record ${id}`);
      if (seenRefs.has(id)) fail(`${field}.${key} contains duplicate reference ${id}`);
      seenRefs.add(id);
    }
  }
}

if (!Array.isArray(index.semantic_classes)) fail("semantic_classes must be an array");
console.log(`Validated ${index.records.length} records in ${file}`);
