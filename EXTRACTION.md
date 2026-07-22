# API and CCMS extraction — later phase

Tailor Education's first consolidation is frontend-only. This repository
currently contains:

- the offline family PWA in `app/`;
- the school/centre Next.js frontend in `sites/education/`;
- a browser API client in `sites/education/src/lib/api.ts`; and
- an optional family-PWA compatibility hook for live activity generation.

It does **not** contain an extracted backend, CCMS Entity Framework entities,
shared platform primitives, `src/WebApi` Spark code, database migrations, or a
deployable API. Earlier extraction notes that referred to
`extracted/backend/*.cs` are obsolete; those files are absent by design.

## Current behaviour

The family PWA is complete enough to run offline from its built-in curriculum
and activity library. Existing `SPARK_*` browser globals, `spark.*` storage
keys, and `/api/spark/plg-worksheet` compatibility remain unchanged so the
branding consolidation does not break existing devices or an independently
configured service.

The school/centre observation pages expect an external Education API through
`NEXT_PUBLIC_API_URL`. Copying that frontend into this repository does not
claim that the API exists or deploy it.

## Later-phase decisions

Before any backend code is added, the owner must approve:

1. The family and school/centre data boundaries, including whether they share
   an API or remain separate services.
2. Identity, tenancy, consent, authorisation, audit, retention, and Australian
   data-residency requirements.
3. A standalone data model. Do not mechanically copy CCMS EF aggregates,
   tenant filters, value objects, or migrations into this repository.
4. Child-safety and privacy review for audio, observations, family records,
   model providers, moderation, and data deletion.
5. Hosting, secret management, operational ownership, and domain/API routing.
6. A migration plan that preserves current offline behaviour and the legacy
   `spark.tailorai.au` PWA until cutover is verified.

Until those gates are cleared, keep this repository static-exportable and
secret-free. API/CCMS extraction must be a separate, reviewable phase rather
than an implicit dependency of the Tailor Education brand consolidation.
