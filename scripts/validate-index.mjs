import { readFile } from "node:fs/promises";

const file = process.argv[2] ?? "docs/related-index.json";
const fail = (message) => {
  console.error(`${file}: ${message}`);
  process.exit(1);
};
const isStringArray = (value) => Array.isArray(value) && value.every((item) => typeof item === "string");
let content;
try {
  content = await readFile(file, "utf8");
} catch (error) {
  fail(`failed to read file: ${error.message}`);
}
let index;
try {
  index = JSON.parse(content);
} catch (error) {
  fail(`failed to parse JSON: ${error.message}`);
}

if (!index || typeof index !== "object" || Array.isArray(index)) fail("root must be an object");
if (index.meta !== undefined) {
  if (!index.meta || typeof index.meta !== "object" || Array.isArray(index.meta)) fail("meta must be an object when present");
  if (index.meta.schema !== undefined && !["oq-related-index/0.1", "oq-related-index/0.2"].includes(index.meta.schema)) fail("meta.schema must be a supported oq-related-index schema when present");
  if (index.meta.generated_at !== undefined && (typeof index.meta.generated_at !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(index.meta.generated_at) || Number.isNaN(Date.parse(index.meta.generated_at)))) {
    fail("meta.generated_at must be a valid ISO date when present");
  }
}
if (!Array.isArray(index.records)) fail("records must be an array");
for (const field of ["bySemanticClass", "byDomain", "byGlossToken"]) {
  if (!index[field] || typeof index[field] !== "object" || Array.isArray(index[field])) fail(`${field} must be an object`);
}

const ids = new Set();
for (const record of index.records) {
  if (!record || typeof record !== "object" || Array.isArray(record)) fail("records must contain objects");
  if (typeof record.id !== "string" || !record.id) fail("every record needs a non-empty string id");
  if (ids.has(record.id)) fail(`duplicate record id: ${record.id}`);
  ids.add(record.id);
  if (typeof record.headword !== "string" || !record.headword) fail(`record ${record.id} needs a headword`);
  for (const field of ["gloss_en", "gloss_da"]) {
    if (record[field] !== undefined && !isStringArray(record[field])) fail(`record ${record.id}: ${field} must be a string array when present`);
  }
  if (record.semantic_classes !== undefined && !isStringArray(record.semantic_classes)) {
    fail(`record ${record.id}: semantic_classes must be a string array when present`);
  }
  if (record.word_class !== undefined && typeof record.word_class !== "string") fail(`record ${record.id}: word_class must be a string when present`);
  if (record.domain !== undefined && record.domain !== null && (typeof record.domain !== "object" || Array.isArray(record.domain) || typeof record.domain.id !== "string" || !record.domain.id)) {
    fail(`record ${record.id}: domain must be null or an object with a non-empty string id when present`);
  }
}

for (const field of ["bySemanticClass", "byDomain", "byGlossToken"]) {
  for (const [key, refs] of Object.entries(index[field])) {
    if (!key || !isStringArray(refs) || refs.length === 0) fail(`${field}.${key} must contain a non-empty string array`);
    const seenRefs = new Set();
    for (const id of refs) {
      if (!ids.has(id)) fail(`${field}.${key} references missing record ${id}`);
      if (seenRefs.has(id)) fail(`${field}.${key} contains duplicate reference ${id}`);
      seenRefs.add(id);
    }
  }
}

if (index.semantic_classes !== undefined) {
  if (!Array.isArray(index.semantic_classes)) fail("semantic_classes must be an array when present");
  const seenClassIds = new Set();
  for (const entry of index.semantic_classes) {
    if (!entry || typeof entry !== "object" || Array.isArray(entry) || typeof entry.id !== "string" || !entry.id) {
      fail("semantic_classes entries must be objects with non-empty string ids");
    }
    if (seenClassIds.has(entry.id)) fail(`duplicate semantic class id: ${entry.id}`);
    seenClassIds.add(entry.id);
  }
}
console.log(`Validated ${index.records.length} records in ${file}`);
