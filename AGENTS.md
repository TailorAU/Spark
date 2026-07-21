# AGENTS.md

> Onboarding for AI agents picking up work in this repo. Self-contained.

## Product agent (delivery ownership)

A dedicated **Spark product agent** owns this repo's delivery loop. North-star
epic: [`#1`](https://github.com/TailorAU/Spark/issues/1) — first **$10k MRR**.

Local clone (orchestrator home): `C:\tailor_OS\Spark`.

| Role | Does | Does not |
|---|---|---|
| **Spark product agent** | Pull `ready` issues; ship the PWA; file GTM context (pricing/ICP pointers) | Draft outreach / press send; put real child PII in-repo or issues |
| **Global orchestrator** | Shape + label; stock `ready`; drain holdings#6 | Bypass this agent for Spark product work |
| **Owner (Knox)** | Legal privacy copy, outreach, real family data, billing decisions | — |

**Labels:** `requirement` · `ready` · `blocked` · `needs-human-review` · `epic`.

**Ready bar:** clear acceptance criteria; no secrets/PII (especially real children)
in issues. **`file-don't-draft`** for all GTM. **`Refs #N` only**.

## What Spark is

**Spark** — transparency for parenting. Every week of a child's education mapped
to the Australian framework they actually sit under, tailored to real family
life (trips, camping, sports). Mobile-first installable PWA under `app/`.

Frameworks in v1 seed (anonymised children only in the public repo):

| Setting | Framework |
|---|---|
| Primary | Australian Curriculum v9 |
| Kindergarten (C&K) | QLD Kindergarten Learning Guideline |
| Preschool / early years | EYLF V2.0 |

Optional live enrichment: extracted Spark PLG engine (`/api/spark/plg-worksheet`)
— see `EXTRACTION.md`. Built-in library works fully offline with no backend.

## Run locally

```bash
cd app
python -m http.server 8080   # or: npx serve .
# open http://localhost:8080 → Add to Home Screen on phone
```

Deploy: serve `app/` statically. GH Pages workflow targets `spark.tailorai.au`.

## Child safety

Public seed children are **anonymised**. Never commit real names, DOBs, school
identifiers, or photos. Local overrides stay on the device / owner machine.

## Commercial north star

First **$10k MRR** = recurring parent/family subscriptions or school seats.
Agent files pricing + ICP pointers only; owner presses send.
