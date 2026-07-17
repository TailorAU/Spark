/*
 * Spaced repetition: mastery fades and due skills resurface.
 *   - a mastered skill is due for a refresh after 14 days
 *   - an attempted-but-unmastered skill is due after 3 days
 *   - the queue orders shaky before mastered, stalest first
 *   - the Learn map shows the "time to revisit" strip and due badges,
 *     and practising a due skill clears it end-to-end
 * Store keys stay stable (childId:skillId) - records are seeded via the
 * store's own API shape, never by renaming keys.
 */
import { test, expect } from "@playwright/test";
import { unlock, expectedPractice, playPerfectly } from "./helpers.mjs";

const daysAgo = (n) => new Date(Date.now() - n * 86400000).toISOString();

/* Seed a mastery record with a back-dated timestamp before the app boots. */
async function seedMastery(page, entries) {
  await page.addInitScript((list) => {
    const KEY = "spark.state.v1";
    const state = JSON.parse(localStorage.getItem(KEY) || "{}");
    state.mastery = state.mastery || {};
    for (const e of list) {
      state.mastery[`${e.childId}:${e.skillId}`] = {
        attempts: 1, bestStars: e.stars, total: e.total, mastered: e.mastered, at: e.at,
      };
    }
    localStorage.setItem(KEY, JSON.stringify(state));
  }, entries);
}

test("review semantics: fade thresholds and shaky-first ordering", async ({ page }) => {
  await page.goto("/");
  await page.waitForFunction(() => window.SPARK_STORE);
  const r = await page.evaluate((at) => {
    const KEY = "spark.state.v1";
    const state = JSON.parse(localStorage.getItem(KEY) || "{}");
    state.mastery = {
      "eldest:fresh-m":  { attempts: 1, bestStars: 4, total: 4, mastered: true,  at: at.d2 },
      "eldest:stale-m":  { attempts: 1, bestStars: 4, total: 4, mastered: true,  at: at.d20 },
      "eldest:staler-m": { attempts: 1, bestStars: 4, total: 4, mastered: true,  at: at.d40 },
      "eldest:fresh-s":  { attempts: 1, bestStars: 2, total: 4, mastered: false, at: at.d2 },
      "eldest:stale-s":  { attempts: 1, bestStars: 2, total: 4, mastered: false, at: at.d5 },
    };
    localStorage.setItem(KEY, JSON.stringify(state));
    return null;
  }, { d2: daysAgo(2), d5: daysAgo(5), d20: daysAgo(20), d40: daysAgo(40) })
    .then(() => page.reload())
    .then(() => page.waitForFunction(() => window.SPARK_STORE))
    .then(() =>
      page.evaluate(() => {
        const S = window.SPARK_STORE;
        const ids = ["fresh-m", "stale-m", "staler-m", "fresh-s", "stale-s", "never"];
        return {
          queue: S.reviewQueue("eldest", ids).map((q) => q.skillId),
          never: S.reviewStatus("eldest", "never"),
          freshM: S.reviewStatus("eldest", "fresh-m").due,
          staleS: S.reviewStatus("eldest", "stale-s"),
        };
      })
    );
  // Unattempted skills are "new", never "due"; fresh ones aren't due either.
  expect(r.never).toBeNull();
  expect(r.freshM).toBe(false);
  expect(r.staleS.due).toBe(true);
  expect(r.staleS.kind).toBe("almost");
  // Shaky first, then mastered stalest-first.
  expect(r.queue).toEqual(["stale-s", "staler-m", "stale-m"]);
});

test("stale skill surfaces on the Learn map and practising it clears the queue", async ({ page }) => {
  const childId = "eldest", skillId = "y1-addition";
  await seedMastery(page, [
    { childId, skillId, stars: 4, total: 4, mastered: true, at: daysAgo(20) },
  ]);
  await unlock(page);

  // The child card CTA counts the due skill.
  await page.click(`[data-act="child"][data-id="${childId}"]`);
  await expect(page.locator(".learn-cta .sheet-cta-sub")).toContainText("1 to revisit");

  // The Learn map shows the strip, the chip, and the due badge on the row.
  await page.click('[data-act="learn"]');
  await expect(page.locator(".review-strip")).toBeVisible();
  await expect(page.locator(`.review-chip[data-skill="${skillId}"]`)).toBeVisible();
  await expect(page.locator(`.skill-row[data-skill="${skillId}"] .skill-badge.due`)).toBeVisible();

  // Practise it from the review chip; finishing re-stamps mastery.
  const set = await expectedPractice(page, childId, skillId);
  await page.click(`.review-chip[data-skill="${skillId}"]`);
  await expect(page.locator(".ws-lesson")).toBeVisible();
  await page.click('[data-ws="startset"]');
  await playPerfectly(page, set.qs, { learn: true });
  await page.click('[data-ws="exit"]');

  // Queue cleared: no strip, row back to mastered.
  await expect(page.locator(".review-strip")).toHaveCount(0);
  await expect(page.locator(`.skill-row[data-skill="${skillId}"] .skill-badge.mastered`)).toBeVisible();
});
