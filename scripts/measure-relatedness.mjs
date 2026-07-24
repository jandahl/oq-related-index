import { mkdir, readFile, writeFile } from "node:fs/promises";

const index = JSON.parse(await readFile("docs/related-index.json", "utf8"));
const recordsByHeadword = new Map();
for (const record of index.records) {
  const list = recordsByHeadword.get(record.headword) ?? [];
  list.push(record);
  recordsByHeadword.set(record.headword, list);
}

const links = index.records.flatMap((record) => (record.related ?? []).map((relation) => ({
  from: record.id, to: relation.id, reasons: [...relation.reasons].sort(),
})));
const reasonCombinations = {};
for (const link of links) {
  const key = link.reasons.join(" + ");
  reasonCombinations[key] = (reasonCombinations[key] ?? 0) + 1;
}
const degree = index.records.map((record) => record.related?.length ?? 0).sort((a, b) => a - b);
const percentile = (value) => degree[Math.min(degree.length - 1, Math.floor((degree.length - 1) * value))];
const semanticOnly = links.filter(({ reasons }) => reasons.includes("same semantic class") && !reasons.includes("shared gloss")).length;
const broadClasses = {};
for (const record of index.records) for (const classId of record.semantic_classes ?? []) broadClasses[classId] = (broadClasses[classId] ?? 0) + 1;
const known = {};
for (const headword of ["illu", "kukiusaq", "affarleriit"]) {
  known[headword] = (recordsByHeadword.get(headword) ?? []).map((record) => ({
    id: record.id, gloss_en: record.gloss_en, gloss_da: record.gloss_da,
    semantic_classes: record.semantic_classes, related: record.related,
  }));
}

const report = {
  generated_at: new Date().toISOString(), source_generated_at: index.meta?.generated_at ?? null,
  record_count: index.records.length, directed_relation_count: links.length,
  reason_combinations: Object.fromEntries(Object.entries(reasonCombinations).sort((a, b) => b[1] - a[1])),
  degree: { min: degree[0], p50: percentile(.5), p90: percentile(.9), p99: percentile(.99), max: degree.at(-1) },
  semantic_class_only_or_shared_class_links: semanticOnly,
  largest_semantic_classes: Object.fromEntries(Object.entries(broadClasses).sort((a, b) => b[1] - a[1]).slice(0, 20)),
  known,
};
await mkdir("reports", { recursive: true });
await writeFile("reports/relatedness-baseline.json", `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({ record_count: report.record_count, directed_relation_count: report.directed_relation_count, semantic_class_only_or_shared_class_links: semanticOnly }, null, 2));
