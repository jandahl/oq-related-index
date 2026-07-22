# oq-related-index

Public, derived indexes for related-word discovery in [OQ!](https://oq.spacepope.dk/).

The generated data is built from the public Oqaasileriffik/Katersat exports. It
is intended to support explainable semantic neighborhoods, not to assert that
any two entries are synonyms.

The published records include a bounded `related` array compiled from
semantic-class, domain, and bilingual-gloss signals. Broad matches and weak
single signals are filtered out; reciprocal relationships receive a small
ranking bonus. Each item includes its source record id, score, and reasons so
consumers can present or audit the result without reproducing the algorithm.

For lower-memory consumers, `docs/manifest.json` and `docs/records/*.json`
provide the same complete records split by normalized first letter. The
monolithic `related-index.json` remains available; shard references on related
items identify which additional record file to load.

## Build

```sh
npm run build
```

The build downloads the pinned public JSON sources and writes compact indexes
to `docs/`. The generated files are committed deployment artifacts and are
published directly by GitHub Pages from `master/docs`.

The scheduled `Update published index` workflow checks source and build-input
fingerprints before generating anything. Changed inputs are built in a
temporary directory, validated, and proposed in an auto-mergeable update PR;
the existing published output is never replaced by a failed build.

## Data and licensing

The source linguistic data is attributed to Oqaasileriffik (Greenlandic
Language Secretariat) and is published by the source projects under CC
BY-SA 4.0. Generated indexes derived from that data are published under the
same license. See `NOTICE.md` and the generated manifest for provenance.

This repository contains no private grammar data.
