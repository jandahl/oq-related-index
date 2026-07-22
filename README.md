# oq-related-index

Public, derived indexes for related-word discovery in [OQ!](https://oq.spacepope.dk/).

The generated data is built from the public Oqaasileriffik/Katersat exports. It
is intended to support explainable semantic neighborhoods, not to assert that
any two entries are synonyms.

## Automatic refresh

The `Update related index` Action checks the upstream source checksums daily and
can also be started manually. It opens an update PR only when a source changes;
the generated index must pass validation before that PR is eligible for
automatic squash-merge. A failed or incomplete build leaves the last published
`docs/` artifact untouched. Successful refreshes are recorded in
`updates/refresh.log`.

## Build

```sh
npm run build
```

The build downloads the pinned public JSON sources and writes compact indexes
to `docs/`. The generated files are deployment artifacts and are published by
GitHub Pages from this repository.

## Data and licensing

The source linguistic data is attributed to Oqaasileriffik (Greenlandic
Language Secretariat) and is published by the source projects under CC
BY-SA 4.0. Generated indexes derived from that data are published under the
same license. See `NOTICE.md` and the generated manifest for provenance.

This repository contains no private grammar data.
