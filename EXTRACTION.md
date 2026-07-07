# Making Spark its own repo

This folder was built inside `TailorAU/tailor-app` (on branch
`claude/kids-education-tracking-app-xi9a9z`) because the GitHub App available to
the agent session **could not create a new repository** (`403 Resource not
accessible by integration` against both `TailorAU` and `Tailor-AUS`). Everything
here is **self-contained** — nothing under `spark/` imports from the rest of the
monorepo at runtime (the PWA is pure static assets; the `extracted/` `.cs` files
are reference copies).

So the moment an empty `spark` repo exists, this lifts straight out.

## Option A — you create the empty repo, then lift the subtree (keeps history)

```bash
# 1. Create an empty repo in GitHub UI: TailorAU/spark (or Tailor-AUS/spark).
#    Do NOT initialise it with a README.

# 2. From a full clone of tailor-app, split spark/ into its own history:
git clone https://github.com/TailorAU/tailor-app.git
cd tailor-app
git checkout claude/kids-education-tracking-app-xi9a9z

# Split just the spark/ directory into a new branch whose root IS spark/
git subtree split --prefix=spark -b spark-only

# 3. Push that branch as the new repo's main
git push https://github.com/TailorAU/spark.git spark-only:main
```

`git subtree split` rewrites so the new repo's root contains `app/`,
`extracted/`, `README.md`, etc. directly (no `spark/` wrapper), with the commits
that touched those files preserved.

## Option B — clean snapshot (no history)

```bash
# From this branch's checkout:
cp -r spark /tmp/spark-repo && cd /tmp/spark-repo
git init -b main
git add -A
git commit -m "Spark v1 — family learning PWA + extracted Spark backend"
git remote add origin https://github.com/TailorAU/spark.git
git push -u origin main
```

## Option C — let the agent do it

Grant the Claude GitHub App **repository-creation** permission (or pre-create the
empty `spark` repo and add it to the session with `add_repo`). Then the agent can
`create_repository` + `push_files` and this whole tree lands in the new repo in
one commit.

---

## Decoupling the extracted .NET backend (later, only if you want server sync)

The PWA needs **no backend** — it's the product as-is. You only need the backend
if you want cross-device sync or the live LLM activity generation always-on.

The `extracted/backend/*.cs` files still depend on monorepo primitives. To make
them compile standalone:

1. **New minimal .NET 9 WebAPI project** in `spark` (e.g. `src/Spark.Api/`).
2. **Drop the CCMS entities' monorepo coupling** — `SparkChild` /
   `SparkObservation` / `SparkSchool` inherit `AggregateRoot<TId>` and carry
   `TenantId` + a global EF query filter. For a single-family app you can either:
   - keep tenancy (one tenant = one family) and port `AggregateRoot`, `TenantId`,
     and the Vogen setup across, or
   - replace them with plain POCO entities + a `FamilyId`.
3. **Port the PLG engine** — `SparkEndpoints.cs` is the valuable part. Its only
   real dependencies are `ILlmClient` (swap for a thin OpenAI/Anthropic client),
   `IMemoryCache` (built-in), and `IContentModerationService` (keep — child
   safety matters). The prompts + JSON schemas are self-contained in the file.
4. **Config** — the moderation service needs Azure AI Content Safety keys; the
   LLM client needs a provider key. Both from env/user-secrets, never committed.

Until then, the PWA's built-in activity library covers every framework offline,
and `More → Live activity generation` can point at the **existing** deployed
`spark.tailor.au` PLG endpoints for enrichment without any new backend at all.
