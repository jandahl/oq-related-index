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

## Build

```sh
npm run build
```

The build downloads the pinned public JSON sources and writes compact indexes
to `dist/`. The generated files are deployment artifacts and are published by
GitHub Pages from this repository.

## Data and licensing

The source linguistic data is attributed to Oqaasileriffik (Greenlandic
Language Secretariat) and is published by the source projects under CC
BY-SA 4.0. Generated indexes derived from that data are published under the
same license. See `NOTICE.md` and the generated manifest for provenance.

This repository contains no private grammar data.
