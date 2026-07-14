/*
 * Worksheets: unlock, open each child's weekly sheet, play to a perfect score
 * by recomputing the expected sheet in-page (same seed = same sheet) and
 * driving the real UI. Verifies the end screen, the saved best result, and
 * that scene overlays never block taps.
 */
import { test, expect } from "@playwright/test";
import { unlock, expectedSheet, playPerfectly, CHILD_IDS } from "./helpers.mjs";

for (const childId of CHILD_IDS) {
  test(`${childId}: weekly worksheet plays to a perfect score`, async ({ page }) => {
    await unlock(page);

    // Compute the expected sheet BEFORE entering (player builds with attempt 0
    // and the same store skill snapshot).
    const script = await expectedSheet(page, childId);
    expect(script.length).toBe(6);

    await page.click(`[data-act="child"][data-id="${childId}"]`);
    await page.click('[data-act="sheet"]');
    await page.waitForSelector(".ws-root .ws-head");

    await playPerfectly(page, script);

    await expect(page.locator(".ws-end")).toBeVisible();
    await expect(page.locator(".ws-end-sub")).toContainText("perfect");

    // The best result is persisted for this child + week.
    const best = await page.evaluate((id) => {
      const S = window.SPARK_STORE;
      const E = window.SPARK_ENGINE;
      return S.getSheetBest(id, E.weekStart(new Date()));
    }, childId);
    expect(best).not.toBeNull();
    expect(best.total).toBe(6);
    expect(best.stars).toBe(6);
  });
}

test("play again reshuffles: attempt 1 differs from attempt 0", async ({ page }) => {
  await unlock(page);
  const differs = await page.evaluate(() => {
    const D = window.SPARK_DATA;
    const E = window.SPARK_ENGINE;
    const S = window.SPARK_STORE;
    const child = D.CHILDREN.find((c) => c.id === "eldest");
    const week = E.weekStart(new Date());
    const contexts = S.activeContexts().filter((c) => E.appliesTo(c, child));
    const skills = S.sheetSkills(child.id);
    const a = JSON.stringify(window.SPARK_SHEETS.buildSheet(child, week, contexts, 0, skills));
    for (let attempt = 1; attempt <= 4; attempt++) {
      const b = JSON.stringify(window.SPARK_SHEETS.buildSheet(child, week, contexts, attempt, skills));
      if (b !== a) return true;
    }
    return false;
  });
  expect(differs).toBeTruthy();
});

test("exit button leaves the sheet cleanly mid-question", async ({ page }) => {
  await unlock(page);
  await page.click('[data-act="child"][data-id="eldest"]');
  await page.click('[data-act="sheet"]');
  await page.waitForSelector(".ws-root .ws-head");
  await page.click('[data-ws="exit"]');
  await expect(page.locator(".child-hero")).toBeVisible();
});
