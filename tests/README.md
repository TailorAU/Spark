# Spark E2E suite

Playwright end-to-end tests for the whole PWA: auth (lock/unlock/remember),
all three children's interactive worksheets played to a perfect score, the
Learning Journey (lesson, practice, mastery), the printable pack (the surface
the 5:30am print run depends on), engine/generator invariants, corpus
integrity, and a privacy scan of every tracked file.

## Running

```
cd tests
npm install
npx playwright install chromium   # first time only
npx playwright test
```

The family password must be in the `SPARK_VAULT_PW` environment variable
(it already is, as a user env var, on the machine that runs the overnight
print task). It is never stored in the repo, and no test writes decrypted
child data to disk or into assertions.

## Rules this suite enforces

- Same seed = same sheet: worksheets and print packs are deterministic per
  child/week/date. Expected answers are recomputed in-page via the modules'
  own exported functions, then the real UI is driven with real clicks.
- Scene overlays (mascot, basket, decor) must keep `pointer-events: none`.
- Repaints of a live question must not replay entrance animations
  (`ws-settled`).
- `/?date=YYYY-MM-DD#print` renders exactly one A4 page per child and a
  3-page PDF - verified the same way `tools/print-local.mjs` renders it.
- No real child data (names, DOB, school) and no family password in any
  tracked file: the privacy spec decrypts the vault at runtime and scans the
  repo for the decrypted strings.

Run the full suite green before every push to main - main is production AND
tomorrow's printout.

Generated PDFs land in `tests/.artifacts/` which is gitignored - they contain
real names; never commit or upload them.
