<p align="center">
  <img src="app/icons/icon.svg" width="96" alt="Tailor Education" />
</p>

<h1 align="center">Tailor Education</h1>

<p align="center"><b>Education shaped around the individual.</b></p>

Tailor Education is one product with two source-controlled public surfaces:

- `sites/education/` is the Next.js static-export site for schools and early
  learning centres. It owns the public landing, privacy and terms pages, plus
  the existing educator observation frontend.
- `app/` is the mobile-first family learning PWA. It maps each learner's week
  to the relevant Australian framework and tailors activities to family life.

The education site build mounts the family PWA at `/families/`, producing one
static export intended for `https://education.tailor.au`. The existing direct
PWA deployment at `https://spark.tailorai.au` remains live during transition:
`app/CNAME` and the GitHub Pages deployment workflow are intentionally
unchanged until a human-approved domain cutover.

## Product surfaces

### Schools and centres

The root site keeps the school/centre story: educator-reviewed observation
drafts, curriculum mapping, family updates, leadership visibility, and the
existing privacy and terms copy. Public branding is Tailor Education. “Daily
Spark” remains only as the name of a family-update feature.

### Families

The PWA under `app/` works offline and can be installed to a home screen. It
contains the curriculum map, life-context tailoring, progress tracking,
learning journey, interactive worksheets, and printable packs. Public labels
use Tailor Education; existing `SPARK_*` JavaScript globals, storage keys, API
route compatibility, and the legacy CNAME remain stable for existing users.

Public seed records are anonymised. Never commit real names, dates of birth,
school identifiers, family passwords, or generated print packs.

## Build the unified export

```bash
cd sites/education
npm ci
npm run build
```

`prebuild` runs `scripts/sync-families.mjs`, which refreshes
`public/families/` from the repository's root `app/` directory. The generated
directory is gitignored. `app/CNAME` is deliberately excluded so the unified
export cannot claim the legacy Spark domain.

The export is written to:

```text
sites/education/out/
├── index.html
├── privacy.html
├── terms.html
└── families/
    ├── index.html
    ├── manifest.webmanifest
    └── sw.js
```

For direct family-PWA development, serve `app/` as static files:

```bash
cd app
python -m http.server 8080
```

## Repository layout

```text
.
├── app/                              # family PWA; legacy direct deployment
├── sites/education/                  # school/centre Next.js site
│   ├── scripts/sync-families.mjs     # deterministic family-asset refresh
│   └── src/
├── tests/                            # family PWA Playwright tests
├── .github/workflows/
│   ├── education-build.yml           # build-only CI for the unified export
│   ├── pages.yml                     # legacy app/ deployment; keep during cutover
│   └── nightly-print.yml
└── EXTRACTION.md                     # later API/CCMS phase boundary
```

## Backend boundary

There is no extracted API, CCMS entity model, or shared platform backend in
this repository. The educator frontend's `src/lib/api.ts` is a client adapter,
and the family PWA has an optional compatibility hook for live activity
generation; neither is a backend implementation.

API, identity, tenancy, sync, and any CCMS migration are a later phase with
separate architecture, privacy, and security approval. See `EXTRACTION.md`.

## Verification

The standalone education build is secret-free. Family tests that exercise the
encrypted vault require `SPARK_VAULT_PW`; privacy and security coverage must
not be weakened or supplied with a committed password.

Domain cutover, deployment of the unified export, DNS changes, and any GitHub
repository rename are owner-controlled operations and are not performed by
this repository build.
