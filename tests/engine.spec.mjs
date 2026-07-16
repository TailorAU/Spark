/*
 * Engine + generator invariants. These run against the served modules on the
 * lock screen (no unlock needed) using synthetic child records - generation
 * only keys off id/stage/framework, never real data.
 */
import { test, expect } from "@playwright/test";

const SYNTH = {
  eldest: { id: "eldest", name: "Child A", stage: "year1", framework: "acv9", dob: "2019-07-01" },
  middle: { id: "middle", name: "Child B", stage: "kindy", framework: "qklg", dob: "2021-03-01" },
  youngest: { id: "youngest", name: "Child C", stage: "eylf", framework: "eylf", dob: "2023-11-01" },
};

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.waitForFunction(() => window.SPARK_SHEETS && window.SPARK_ENGINE && window.SPARK_DATA);
});

test("buildSheet is deterministic: same seed, same sheet", async ({ page }) => {
  const results = await page.evaluate((synth) => {
    const D = window.SPARK_DATA;
    const week = new Date("2026-06-01T00:00:00");
    const out = {};
    for (const child of Object.values(synth)) {
      const contexts = D.CONTEXT_LIBRARY.filter(
        (c) => c.childScope === "all" || !c.childScope || c.childScope.includes(child.id)
      );
      // Sprites embed a per-render unique id (svg defs collision guard) -
      // normalise those before comparing; everything else must match exactly.
      const norm = (qs) => JSON.stringify(qs).replace(/\b(sa|sk)\d+_/g, "$1N_");
      const a = window.SPARK_SHEETS.buildSheet(child, week, contexts, 0, { add: 0, sub: 0 });
      const b = window.SPARK_SHEETS.buildSheet(child, week, contexts, 0, { add: 0, sub: 0 });
      out[child.id] = { same: norm(a) === norm(b), count: a.length };
    }
    return out;
  }, SYNTH);
  for (const [id, r] of Object.entries(results)) {
    expect(r.same, `${id} same-seed sheets must match`).toBeTruthy();
    expect(r.count, `${id} sheet has 6 questions`).toBe(6);
  }
});

test("every generated question is winnable and well-formed", async ({ page }) => {
  const problems = await page.evaluate((synth) => {
    const D = window.SPARK_DATA;
    const bad = [];
    // Sample 8 different weeks x 3 children x 3 skill levels.
    for (let w = 0; w < 8; w++) {
      const week = new Date(Date.UTC(2026, 0, 5 + w * 7));
      for (const child of Object.values(synth)) {
        for (const lv of [0, 1, 2]) {
          const contexts = D.CONTEXT_LIBRARY.filter(
            (c) => c.childScope === "all" || !c.childScope || c.childScope.includes(child.id)
          );
          const qs = window.SPARK_SHEETS.buildSheet(child, week, contexts, 0, { add: lv, sub: lv });
          qs.forEach((q, i) => {
            const at = `${child.id} wk${w} lv${lv} q${i}`;
            if (q.kind === "choice") {
              const right = q.options.filter((o) => o.correct).length;
              if (right !== 1) bad.push(`${at}: choice has ${right} correct options`);
            } else if (q.kind === "tapall") {
              if (!q.items.some((it) => it.match)) bad.push(`${at}: tapall has no matches`);
            } else if (q.kind === "build") {
              const pool = q.tiles.slice();
              for (const ch of q.word) {
                const idx = pool.indexOf(ch);
                if (idx < 0) {
                  bad.push(`${at}: build word not coverable by tiles`);
                  break;
                }
                pool.splice(idx, 1);
              }
            } else if (q.kind === "sort") {
              for (const it of q.items) {
                if (!(it.bucket >= 0 && it.bucket < q.buckets.length))
                  bad.push(`${at}: sort item has invalid bucket`);
              }
            } else {
              bad.push(`${at}: unknown kind ${q.kind}`);
            }
          });
        }
      }
    }
    return bad;
  }, SYNTH);
  expect(problems).toEqual([]);
});

test("weekly plan: deterministic, tailored by contexts, Monday-anchored", async ({ page }) => {
  const r = await page.evaluate((synth) => {
    const D = window.SPARK_DATA;
    const E = window.SPARK_ENGINE;
    const monday = E.weekStart(new Date("2026-06-04T10:00:00"));
    const contexts = D.CONTEXT_LIBRARY.map((c) => ({ ...c, active: true }));
    const child = synth.eldest;
    const p1 = E.planForChild(child, monday, contexts);
    const p2 = E.planForChild(child, monday, contexts);
    const bare = E.planForChild(child, monday, []);
    return {
      mondayDow: monday.getDay(),
      same: JSON.stringify(p1.items) === JSON.stringify(p2.items),
      tailored: p1.tailoredCount,
      bareTailored: bare.tailoredCount,
      areas: p1.items.length,
      frameworkAreas: D.FRAMEWORKS[child.framework].areas.length,
    };
  }, SYNTH);
  expect(r.mondayDow).toBe(1);
  expect(r.same).toBeTruthy();
  expect(r.areas).toBe(r.frameworkAreas);
  expect(r.tailored).toBeGreaterThan(0);
  expect(r.bareTailored).toBe(0);
});

test("cross-country spotlight follows the race date", async ({ page }) => {
  const r = await page.evaluate((synth) => {
    const D = window.SPARK_DATA;
    const E = window.SPARK_ENGINE;
    const monday = E.weekStart(new Date("2026-06-01T00:00:00"));
    const mk = (raceDate) =>
      D.CONTEXT_LIBRARY.filter((c) => c.id === "crosscountry").map((c) => ({ ...c, active: true, raceDate }));
    const inRange = E.planForChild(synth.eldest, monday, mk("2026-06-29")); // 4 weeks out
    const past = E.planForChild(synth.eldest, monday, mk("2026-05-01")); // already run
    const wrongChild = E.planForChild(synth.middle, monday, mk("2026-06-29")); // scoped to eldest
    return {
      has: !!inRange.spotlight,
      sessions: inRange.spotlight ? inRange.spotlight.sessions.length : 0,
      pastHas: !!past.spotlight,
      wrongChildHas: !!wrongChild.spotlight,
    };
  }, SYNTH);
  expect(r.has).toBeTruthy();
  expect(r.sessions).toBe(5);
  expect(r.pastHas).toBeFalsy();
  expect(r.wrongChildHas).toBeFalsy();
});

test("strand-level writing/measurement weaves are gated to the school framework", async ({ page }) => {
  const r = await page.evaluate((synth) => {
    const D = window.SPARK_DATA;
    const E = window.SPARK_ENGINE;
    const contexts = D.CONTEXT_LIBRARY.map((c) => ({ ...c, active: true, raceDate: "2026-06-29" }));
    // Every strand-level weave string across the library - a Year-1 task like
    // "write 3 sentences" must never be handed to the kindy/eylf children.
    const strandWeaves = new Set(
      contexts.flatMap((c) => [c.weave && c.weave.writing, c.weave && c.weave.measurement]).filter(Boolean)
    );
    let littleKidHits = 0;
    let eldestHits = 0;
    const start = E.weekStart(new Date("2026-01-05T12:00:00"));
    for (let w = 0; w < 52; w++) {
      const monday = E.addWeeks(start, w);
      for (const child of [synth.middle, synth.youngest]) {
        for (const item of E.planForChild(child, monday, contexts).items) {
          if (strandWeaves.has(item.activity.text)) littleKidHits++;
        }
      }
      for (const item of E.planForChild(synth.eldest, monday, contexts).items) {
        if (strandWeaves.has(item.activity.text)) eldestHits++;
      }
    }
    return { littleKidHits, eldestHits };
  }, SYNTH);
  // The gate blocks the leak for eylf/qklg...
  expect(r.littleKidHits).toBe(0);
  // ...without turning the finer weaves off for the school child.
  expect(r.eldestHits).toBeGreaterThan(0);
});
