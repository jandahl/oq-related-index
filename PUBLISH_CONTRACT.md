# Publish contract

Machine-readable schemas are published in [`schema/`](schema/). The monolithic
document is version `oq-related-index/0.2`; the shard manifest is version
`oq-related-index-shards/0.1`. Consumers should validate the version they
support and tolerate unknown fields.

The public endpoint is a versioned JSON document. Consumers must tolerate
unknown fields and missing optional fields.

```json
{
  "meta": {
    "schema": "oq-related-index/0.2",
    "generated_at": "2026-01-01T00:00:00.000Z",
    "attribution": "Oqaasileriffik / Greenland Language Secretariat",
    "license": "CC-BY-SA-4.0",
    "sources": {
      "lexicon": "https://example.invalid/lexicon.json",
      "semantic_classes": "https://example.invalid/semantic_classes.json"
    }
  },
  "records": [
    {
      "id": "lex_example",
      "headword": "example",
      "word_class": "t",
      "gloss_en": ["example"],
      "gloss_da": ["eksempel"],
      "semantic_classes": ["sem_example"],
      "domain": { "id": "dom_example", "code": "0.0.0", "label": "General" },
      "related": [{
        "id": "lex_other",
        "headword": "other",
        "score": 7.5,
        "reasons": ["same semantic class", "reciprocal relatedness"]
      }]
    }
  ],
  "bySemanticClass": { "sem_example": ["lex_example"] },
  "byDomain": { "dom_example": ["lex_example"] },
  "byGlossToken": { "example": ["lex_example"] },
  "semantic_classes": [
    {
      "id": "sem_example",
      "code": "example",
      "english": "Example",
      "danish": "Eksempel",
      "kalaallisut": ""
    }
  ]
}
```

`records` and the three inverted indexes remain available in schema `0.2`.
Each record may include a bounded `related` array. Its entries identify
candidate records, provide a deterministic score, and list the evidence used
by the compiler. Broad matches and weak single signals are filtered out, and
reciprocal relationships receive a small ranking bonus. Relatedness is a
candidate signal, not an assertion of synonymy.

## Sharded delivery

The optional `manifest.json` uses schema `oq-related-index-shards/0.1` and
points to complete record shards under `records/`. Shards are grouped by the
normalized first character of `headword`; `_` contains records without a
letter-or-number initial. Their `records` arrays use the same record shape as
the monolithic document. Every `related` item may include `shard`, the target
record's shard key, so a consumer can lazy-load related records without
holding the monolith in memory.
