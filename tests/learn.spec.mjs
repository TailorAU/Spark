/*
 * Learning Journey: lesson intro card, practice to a perfect score (via the
 * corpus' own answer data), teaching explanations, and recorded mastery.
 * One representative skill per child; localStorage keys must stay stable
 * (childId:skillId) or the kids' history would be wiped.
 */
import { test, expect } from "@playwright/test";
import { unlock, expectedPractice, playPerfectly } from "./helpers.mjs";

const SKILLS = [
  { childId: "eldest", skillId: "y1-addition" },
  { childId: "middle", skillId: "kg-counting" },
  { childId: "youngest", skillId: "ey-count3" },
];

for (const { childId, skillId } of SKILLS) {
  test(`${childId}: practises ${skillId} to mastery`, async ({ page }) => {
    await unlock(page);

    const set = await expectedPractice(page, childId, skillId);
    expect(set).not.toBeNull();
    expect(set.qs.length).toBeGreaterThan(0);

    await page.click(`[data-act="child"][data-id="${childId}"]`);
    await page.click('[data-act="learn"]');
    await expect(page.locator(`[data-act="practice"][data-skill="${skillId}"]`)).toBeVisible();

    // Fresh state: the skill starts un-mastered.
    const before = await page.evaluate(
      ({ id, skill }) => window.SPARK_STORE.getSkillMastery(id, skill),
      { id: childId, skill: skillId }
    );
    expect(before).toBeNull();

    await page.click(`[data-act="practice"][data-skill="${skillId}"]`);

    // Lesson intro card first, with the skill title and curriculum framing.
    await expect(page.locator(".ws-lesson")).toBeVisible();
    await expect(page.locator(".ws-lesson-h")).toContainText(set.lessonTitle);
    await page.click('[data-ws="startset"]');

    await playPerfectly(page, set.qs, { learn: true });
    await expect(page.locator(".ws-end")).toBeVisible();

    // Mastery recorded (perfect >= 80% threshold) under the stable store key.
    const after = await page.evaluate(
      ({ id, skill }) => window.SPARK_STORE.getSkillMastery(id, skill),
      { id: childId, skill: skillId }
    );
    expect(after).not.toBeNull();
    expect(after.mastered).toBeTruthy();
    expect(after.bestStars).toBe(set.qs.length);

    // Back on the learn map the skill row shows as mastered.
    await page.click('[data-ws="exit"]');
    await expect(page.locator(`[data-act="practice"][data-skill="${skillId}"]`)).toHaveClass(/is-mastered/);
    await expect(
      page.locator(`[data-act="practice"][data-skill="${skillId}"] .skill-badge.mastered`)
    ).toBeVisible();
  });
}

test("learn map lists every corpus skill for each child", async ({ page }) => {
  await unlock(page);
  const perChild = await page.evaluate(() =>
    ["eldest", "middle", "youngest"].map((id) => {
      const areas = window.SPARK_LEARN.childAreas(id);
      return {
        id,
        skills: areas.reduce((n, a) => n + a.skills.length, 0),
        questions: areas.reduce(
          (n, a) => n + a.skills.reduce((m, s) => m + s.questionCount, 0),
          0
        ),
      };
    })
  );
  for (const c of perChild) {
    expect(c.skills, `${c.id} has skills`).toBeGreaterThanOrEqual(8);
    expect(c.questions, `${c.id} has questions`).toBeGreaterThanOrEqual(20);
    // Every mapped skill renders as a tappable row.
    await page.click(`[data-act="child"][data-id="${c.id}"]`);
    await page.click('[data-act="learn"]');
    await expect(page.locator('[data-act="practice"]')).toHaveCount(c.skills);
    await page.click('[data-act="go"][data-route="home"]');
  }
});
