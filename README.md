<p align="center">
  <img src="app/icons/icon.svg" width="96" alt="Spark" />
</p>

<h1 align="center">Spark</h1>

<p align="center"><b>Bringing transparency to parenting — every week of your child's education mapped to the Australian curriculum, tailored to what your family is actually doing.</b></p>

---

Spark is a **mobile-first, installable app** for parents. For each child it maps
the school year, week by week, against the framework they actually sit under —
then **weaves in real life**: you just got back from Fiji, you're camping this
weekend with schoolmates, there's a cross-country race coming up. Spark turns
those into the week's learning, on-curriculum, so learning rides along with the
life you're already living.

Built first for one family and designed to open up to other parents. The seed
children in this public repo are **anonymised** — swap in your own locally.

## The kids (v1 seed — anonymised)

| Child | Setting | Stage (2026) | Framework |
|---|---|---|---|
| 🏃 **Eldest** | Primary school | **Year 1** | Australian Curriculum v9 |
| 🌻 **Middle** | Kindergarten (C&K) | **Kindergarten** | QLD Kindergarten Learning Guideline |
| 🌸 **Youngest** | Preschool | **Early years** | EYLF V2.0 |

*(Ages/year levels derive from Queensland enrolment cut-offs. Names and exact dates are anonymised for this public repo.)*

## What it does

- **Weekly curriculum map** — each child's week gets a focus per learning area
  (English, Maths, Science… for the eldest; the five EYLF/QKLG outcomes for the
  little ones), rotating across the strands so the whole year is covered.
- **Life-event tailoring** — turn on *"just back from Fiji"*, *"camping this
  weekend"*, *"cross-country training"* and Spark rewrites the week's activities
  to use them, while staying on-curriculum. A tailored activity is badged with
  what it's tied to.
- **Cross-country training plan** — a safe, play-based 6-week build-up for
  the eldest, counting down to race day.
- **Progress tracking** — tick off each area; per-child weekly progress rings.
- **Full-year map** — every week ahead, per child, against their framework.
- **Works offline, installs to the home screen** — it's a PWA. No app store needed.
- **Optional live enrichment** — point it at the extracted Spark PLG engine
  (`/api/spark/plg-worksheet`) to swap in fresh, LLM-generated, child-safety-
  moderated activities. Fully optional; the built-in library needs no backend.

## Run it

It's a static PWA — no build step.

```bash
cd app
python3 -m http.server 8080     # or: npx serve .
# open http://localhost:8080
```

On a phone, open that URL and choose **Add to Home Screen** → it runs full-screen, offline.

Deploy anywhere static (GitHub Pages, Netlify, Azure Static Web Apps, Cloudflare Pages) — just serve `app/`.

## Layout

```
.
├── app/                    # the installable PWA (this is the product)
│   ├── index.html
│   ├── styles.css · manifest.webmanifest · sw.js · CNAME
│   ├── icons/
│   └── js/
│       ├── data.js         # kids, curriculum frameworks, life-context library
│       ├── engine.js       # week/curriculum mapping + tailoring engine
│       ├── store.js        # localStorage state + progress
│       └── app.js          # UI / views / navigation
├── .github/workflows/
│   └── pages.yml           # deploys app/ to GitHub Pages (spark.tailorai.au)
└── README.md
```

## Status & roadmap

**v1 (this):** single-family, offline PWA, three frameworks, life-event
tailoring, cross-country plan, progress tracking.

**Next, to open it to other parents:**
1. Accounts + multiple families (the model already keys everything by child).
2. Add-your-own-child onboarding (school, DOB → auto-stage/framework).
3. Custom life events (birthdays, carnivals, term breaks, trips) beyond the seed set.
4. Wire live PLG enrichment on by default; expand `plg-play` for the early-years kids.
5. Push notifications for the week's plan + training days.
6. Backend for sync across devices.

## Provenance

Spark started inside a private monorepo. The reusable engine (curriculum-mapped,
interest-tailored activity generation) was built there first; this repo is the
standalone, parent-facing app.
