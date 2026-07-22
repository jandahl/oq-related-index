import { mkdir, writeFile } from "node:fs/promises";
import { compileRelatedness } from "./relatedness.mjs";
import { addRelationShards, groupRecords, shardManifest } from "./shards.mjs";

const LEXICON_URL = "https://jandahl.github.io/Oqaasileriffik-katersat/lexicon.json";
const SEMANTIC_URL = "https://jandahl.github.io/Oqaasileriffik-katersat/semantic_classes.json";

function entries(raw) {
  if (Array.isArray(raw)) return raw;
  return raw?.lexemes ?? raw?.entries ?? raw?.dictionary_entries ?? [];
}

function add(map, key, id) {
  if (!key) return;
  const list = map[key] ??= [];
  if (!list.includes(id)) list.push(id);
}

function tokens(value) {
  return String(value ?? "").toLowerCase().normalize("NFKC")
    .match(/[\p{L}\p{N}]+/gu) ?? [];
}

const [lexiconResponse, semanticResponse] = await Promise.all([
  fetch(LEXICON_URL),
  fetch(SEMANTIC_URL),
]);
if (!lexiconResponse.ok || !semanticResponse.ok) {
  throw new Error(`Source fetch failed: lexicon=${lexiconResponse.status}, semantic=${semanticResponse.status}`);
}

const lexicon = entries(await lexiconResponse.json());
const semantic = await semanticResponse.json();
const bySemanticClass = {};
const byDomain = {};
const byGlossToken = {};
const records = [];

for (const entry of lexicon) {
  const id = String(entry?.id ?? "").trim();
  const headword = String(entry?.kalaallisut ?? "").trim();
  if (!id || !headword) continue;
  records.push({
    id, headword, word_class: entry.word_class ?? "",
    gloss_en: entry.english ?? [], gloss_da: entry.danish ?? [],
    semantic_classes: entry.semantic_classes ?? [],
    domain: entry.domain ?? null,
  });
  for (const classId of entry.semantic_classes ?? []) add(bySemanticClass, classId, id);
  if (entry.domain?.id) add(byDomain, entry.domain.id, id);
  for (const gloss of [...(entry.english ?? []), ...(entry.danish ?? [])]) {
    for (const token of tokens(gloss)) add(byGlossToken, token, id);
  }
}

for (const index of [bySemanticClass, byDomain, byGlossToken]) {
  for (const ids of Object.values(index)) ids.sort();
}
records.sort((a, b) => a.headword.localeCompare(b.headword) || a.id.localeCompare(b.id));
const compiledRecords = addRelationShards(compileRelatedness(records, { bySemanticClass, byDomain, byGlossToken }));
const recordShards = groupRecords(compiledRecords);

await mkdir("dist", { recursive: true });
await mkdir("dist/records", { recursive: true });
for (const [key, shardRecords] of recordShards) {
  await writeFile(`dist/records/${encodeURIComponent(key)}.json`, JSON.stringify({ records: shardRecords }, null, 2));
}
await writeFile("dist/manifest.json", JSON.stringify({
  schema: "oq-related-index-shards/0.1",
  schema_url: "https://jandahl.github.io/oq-related-index/schema/oq-related-index-shards-0.1.schema.json",
  generated_at: new Date().toISOString(),
  record_count: compiledRecords.length,
  shards: shardManifest(recordShards),
}, null, 2));
await writeFile("dist/index.html", `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>OQ! related-word index</title></head><body>
<h1>OQ! related-word index</h1>
<p>Derived, experimental indexes for discovering semantically related Kalaallisut words.</p>
<ul>
<li><a href="https://github.com/jandahl/oq-related-index">Source repository</a></li>
<li><a href="related-index.json">Generated JSON index</a></li>
<li><a href="manifest.json">Sharded index manifest</a></li>
</ul>
<p>Derived from public Oqaasileriffik / Greenlandic Language Secretariat data;
see the <a href="https://github.com/jandahl/oq-related-index/blob/master/NOTICE.md">data notice</a>.</p>
</body></html>\n`);
await writeFile("dist/related-index.json", JSON.stringify({
  meta: {
    schema: "oq-related-index/0.2",
    schema_url: "https://jandahl.github.io/oq-related-index/schema/oq-related-index-0.2.schema.json",
    relatedness: {
      algorithm: "bounded-signal-v1",
      limit: 8,
      minimum_signal_score: 2,
      minimum_reasons: 2,
      reciprocal_bonus: 3,
    },
    generated_at: new Date().toISOString(),
    attribution: "Oqaasileriffik / Greenland Language Secretariat",
    license: "CC-BY-SA-4.0",
    sources: { lexicon: LEXICON_URL, semantic_classes: SEMANTIC_URL },
  },
  records: compiledRecords,
  bySemanticClass,
  byDomain,
  byGlossToken,
  semantic_classes: semantic.semantic_classes ?? [],
}, null, 2));

console.log(`Wrote ${records.length} records to dist/related-index.json`);
