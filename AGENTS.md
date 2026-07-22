# AGENTS.md

> Onboarding for product agents working in this repository.

## Delivery ownership

A dedicated **Tailor Education product agent** owns delivery for this
repository. The repository may retain its legacy Spark name until the owner
approves a GitHub rename; public product branding is **Tailor Education** with
the promise **“Education shaped around the individual.”**

Local clone: `C:\tailor_OS\Spark`.

The product agent may ship the family PWA and school/centre frontend, maintain
builds and tests, and file GTM context. It must not draft outreach, press send,
publish PII, alter DNS, rename the GitHub repository, or bypass owner approval
for legal, billing, privacy, or security decisions.

Use `Refs #N` only. Never place real child or family data, credentials, tokens,
or print artifacts in source control or issues.

## Product architecture

Tailor Education has two frontend surfaces in one repository:

- `app/` — installable, offline-first family learning PWA.
- `sites/education/` — Next.js static-export school and centre site, including
  the existing educator observation frontend.

`npm run build` in `sites/education/` generates one export:

- `/` serves the schools/centres surface.
- `/families/` serves a generated copy of the family PWA.

The generated `sites/education/public/families/` directory is gitignored.
`scripts/sync-families.mjs` refreshes it from `app/` before each build and must
exclude `app/CNAME`.

## Transition constraints

The direct family PWA remains deployed at `spark.tailorai.au` until canonical
domain cutover. Do not change `app/CNAME` or the existing Pages workflow in a
way that breaks that deployment.

The intended unified domain is `education.tailor.au`, but DNS, hosting
configuration, deployment, and repository rename are human-controlled gates.
Build-only CI must not grow a deployment step that depends on unavailable
secrets.

Public strings use Tailor Education. “Daily Spark” may remain only as a clear
feature name. Internal `SPARK_*` globals, `spark.*` storage keys, cache naming,
API compatibility paths, and `spark-*` CSS classes stay stable unless a
separately approved migration includes backward compatibility.

## Safe product boundary

This repository owns frontend consolidation only. Do not port:

- CCMS Entity Framework entities or migrations;
- shared platform backend primitives;
- `src/WebApi` Spark code;
- API credentials, provider configuration, or deployment secrets;
- sales or outreach documents.

The school frontend API client and the family PWA's optional live-generation
hook are not backend implementations. API, identity, tenancy, sync, and CCMS
extraction are a later phase described in `EXTRACTION.md`.

## Run locally

Unified site:

```bash
cd sites/education
npm ci
npm run dev
```

Family PWA directly:

```bash
cd app
python -m http.server 8080
```

Family tests live in `tests/`. Suites that decrypt the vault require
`SPARK_VAULT_PW` from the environment. Never hard-code it, log it, or weaken
the privacy scan to make tests pass.
