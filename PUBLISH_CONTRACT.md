# Publish contract

The public endpoint is a versioned JSON document. Consumers must tolerate
unknown fields and missing optional fields.

```json
{
  "meta": {
    "schema": "oq-related-index/0.1",
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
      "domain": { "id": "dom_example", "code": "0.0.0", "label": "General" }
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

`records` and the three inverted indexes are the stable minimum fields in
schema `0.1`; the other fields are optional enrichment. Relatedness is a
candidate signal, not an assertion of synonymy.
