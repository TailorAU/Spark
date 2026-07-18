/*
 * family.json - the committed, PII-free family config that lets the state-less
 * 5:30am print run track real family life. Semantics under test:
 *   - fresh state (the nightly run): config wins over rolling defaults
 *   - the family's in-app toggles are never stomped by config
 *   - printSkills fill difficulty gaps only; real adaptive records win
 *   - the printed cross-country countdown ADVANCES between dates (the frozen
 *     "always 4 weeks to go" bug class)
 */
import { test, expect } from "@playwright/test";
import { unlock } from "./helpers.mjs";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const CONFIG = JSON.parse(readFileSync(fileURLToPath(new URL("../app/family.json", import.meta.url)), "utf8"));
const RACE = CONFIG.contexts.crosscountry.raceDate;

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.waitForFunction(() => window.SPARK_STORE && window.SPARK_ENGINE);
});

test("fresh state: config race date beats the rolling default", async ({ page }) => {
  const raceDate = await page.evaluate(() => {
    const cc = window.SPARK_STORE.activeContexts().find((c) => c.id === "crosscountry");
    return cc ? cc.raceDate : null;
  });
  expect(raceDate).toBe(RACE);
});

test("in-app context toggles survive a reload with config present", async ({ page }) => {
  await page.evaluate(() => window.SPARK_STORE.toggleContext("camping", false));
  await page.reload();
  await page.waitForFunction(() => window.SPARK_STORE && window.SPARK_ENGINE);
  const camping = await page.evaluate(() =>
    window.SPARK_STORE.activeContexts().some((c) => c.id === "camping")
  );
  expect(camping, "config must not re-activate a context the family switched off").toBe(false);
});

test("printSkills: config fills the gap, real adaptive records win", async ({ page }) => {
  const r = await page.evaluate(() => {
    const S = window.SPARK_STORE;
    const fresh = S.sheetSkills("eldest"); // no local records yet
    // Two perfect reports level 'add' up to 1 - the local record must now win
    // regardless of what the config says.
    S.skillReport("eldest", "add", true);
    S.skillReport("eldest", "add", true);
    return { fresh, after: S.sheetSkills("eldest") };
  });
  expect(r.fresh).toEqual({
    add: CONFIG.printSkills.eldest.add,
    sub: CONFIG.printSkills.eldest.sub,
  });
  expect(r.after.add).toBe(1);
});

test("school term calendar: term/week from config, holidays are null", async ({ page }) => {
  const r = await page.evaluate(() => {
    const T = window.SPARK_STORE.schoolTerm;
    return {
      week2: T("2026-07-20"), // Knox's ground truth: Term 3 commences Week 2 here
      week1: T("2026-07-13"),
      lastWeek: T("2026-09-18"),
      holidays: T("2026-09-25"),
      sundayBeforeWeek2: T("2026-07-19"), // Sunday still inside term week 1
    };
  });
  expect(r.week2).toEqual({ term: 3, week: 2 });
  expect(r.week1).toEqual({ term: 3, week: 1 });
  expect(r.lastWeek).toEqual({ term: 3, week: 10 });
  expect(r.holidays).toBeNull();
  expect(r.sundayBeforeWeek2).toEqual({ term: 3, week: 1 });
});

test("printed countdown advances between pack dates (never frozen)", async ({ page }) => {
  // Pick two Mondays, 1 and 3 weeks before the configured race.
  const monday = (weeksBefore) => {
    const d = new Date(`${RACE}T12:00:00`);
    d.setDate(d.getDate() - ((d.getDay() + 6) % 7) - weeksBefore * 7);
    return d.toISOString().slice(0, 10);
  };
  await unlock(page, { path: `/?date=${monday(3)}#print`, remember: true });
  await expect(page.locator(".pp-page")).toHaveCount(4);
  const at3 = await page.locator(".pp-page:has(.pp-sumgrid) .pp-todo", { hasText: "Training:" }).innerText();

  await page.goto(`/?date=${monday(1)}#print`);
  await expect(page.locator(".pp-page")).toHaveCount(4);
  const at1 = await page.locator(".pp-page:has(.pp-sumgrid) .pp-todo", { hasText: "Training:" }).innerText();

  expect(at3, "training session must progress as the race approaches").not.toBe(at1);
});
