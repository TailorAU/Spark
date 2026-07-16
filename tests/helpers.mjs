/*
 * Shared helpers for the Spark E2E suite.
 *
 * SECURITY: the family password comes ONLY from the SPARK_VAULT_PW env var.
 * It must never appear in any committed file, and no test may write decrypted
 * child data (names, DOB, school) to disk, snapshots, or assertions.
 * Assertions stay structural: stage ids (eldest/middle/youngest), counts,
 * classes.
 */
import { expect } from "@playwright/test";

export const PASSWORD = process.env.SPARK_VAULT_PW || "";

export function requirePassword() {
  if (!PASSWORD) {
    throw new Error(
      "SPARK_VAULT_PW env var is required (the family vault password). " +
        "Set it in your shell before running the suite - it is never stored in the repo."
    );
  }
}

export const CHILD_IDS = ["eldest", "middle", "youngest"];

/* Unlock the app via the lock screen. remember=false unchecks 'keep me signed in'. */
export async function unlock(page, { remember = false, path = "/" } = {}) {
  requirePassword();
  await page.goto(path);
  await page.waitForSelector(".lock-card", { timeout: 15_000 });
  if (!remember) await page.uncheck("#lockRemember");
  await page.fill("#lockPw", PASSWORD);
  await page.click("#lockGo");
  // Post-unlock the app boots to home (kid cards) or, with #print, the pack.
  await page.waitForSelector(".kid-card, .pp-page", { timeout: 30_000 });
}

/*
 * Recompute the exact worksheet the player will generate for a child, by
 * calling the module's exported buildSheet in-page with the same inputs the
 * player uses (attempt 0, current store skills). Same seed = same sheet.
 * Returns a serializable driving script.
 */
export async function expectedSheet(page, childId) {
  return page.evaluate((id) => {
    const D = window.SPARK_DATA;
    const E = window.SPARK_ENGINE;
    const S = window.SPARK_STORE;
    const child = D.CHILDREN.find((c) => c.id === id);
    const week = E.weekStart(new Date());
    const contexts = S.activeContexts().filter((c) => E.appliesTo(c, child));
    const qs = window.SPARK_SHEETS.buildSheet(child, week, contexts, 0, S.sheetSkills(child.id));
    return qs.map((q) => ({
      kind: q.kind,
      correctIndex: q.kind === "choice" ? q.options.findIndex((o) => o.correct) : undefined,
      matches:
        q.kind === "tapall"
          ? q.items.map((it, i) => (it.match ? i : -1)).filter((i) => i >= 0)
          : undefined,
      word: q.word,
      tiles: q.tiles,
      buckets: q.kind === "sort" ? q.items.map((it) => it.bucket) : undefined,
    }));
  }, childId);
}

/*
 * Extract a driving script for a Learn practice set. Note: build-question
 * tiles are shuffled non-deterministically per call, so build questions are
 * driven by letter text, not tile index.
 */
export async function expectedPractice(page, childId, skillId) {
  return page.evaluate(
    ({ id, skill }) => {
      const set = window.SPARK_LEARN.practice(id, skill);
      if (!set) return null;
      return {
        lessonTitle: set.lesson.title,
        qs: set.questions.map((q) => ({
          kind: q.kind,
          correctIndex: q.kind === "choice" ? q.options.findIndex((o) => o.correct) : undefined,
          matches:
            q.kind === "tapall"
              ? q.items.map((it, i) => (it.match ? i : -1)).filter((i) => i >= 0)
              : undefined,
          word: q.word,
          buckets: q.kind === "sort" ? q.items.map((it) => it.bucket) : undefined,
        })),
      };
    },
    { id: childId, skill: skillId }
  );
}

/* Wait until question index `qi` is the active one (the 'now' progress dot). */
export async function waitForQuestion(page, qi) {
  await page.waitForFunction(
    (expected) => {
      const dots = document.querySelectorAll(".ws-dot");
      if (!dots.length) return false;
      let now = -1;
      dots.forEach((d, i) => {
        if (d.classList.contains("now")) now = i;
      });
      return now === expected;
    },
    qi,
    { timeout: 20_000 }
  );
}

/* Scene overlays must never block taps - the bug class the suite exists for. */
export async function assertOverlaysInert(page) {
  for (const sel of [".ws-sparky", ".ws-basket", ".ws-spot-decor"]) {
    const els = page.locator(sel);
    const n = await els.count();
    for (let i = 0; i < n; i++) {
      await expect(els.nth(i), `${sel} must not intercept taps`).toHaveCSS("pointer-events", "none");
    }
  }
}

/*
 * Tap a scatter/grid item by real mouse coordinates. Scatter spots bob on an
 * infinite animation, so Playwright's stability gate never settles - but a
 * click at the element's centre still exercises real hit-testing (an overlay
 * intercepting the tap makes the registration check below fail).
 */
async function tapItem(page, index) {
  const sel = `[data-ws="tap"][data-i="${index}"]`;
  const box = await page.locator(sel).boundingBox();
  expect(box, `bounding box for ${sel}`).not.toBeNull();
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  // Confirm the tap registered: scatter spots repaint as .flown, grid cells as .hit.
  await page.waitForFunction(
    (s) => {
      const el = document.querySelector(s);
      return !el || el.classList.contains("flown") || el.classList.contains("hit");
    },
    sel,
    { timeout: 5_000 }
  );
}

/* Click an unused letter tile by its visible letter (Learn mode: tile order is not deterministic). */
async function clickTileByLetter(page, letter) {
  const idx = await page.evaluate((ch) => {
    const tiles = [...document.querySelectorAll('[data-ws="tile"]')];
    return tiles.findIndex((t) => !t.classList.contains("used") && t.textContent.trim() === ch);
  }, letter);
  expect(idx, `a free tile for letter ${letter}`).toBeGreaterThanOrEqual(0);
  await page.click(`[data-ws="tile"][data-i="${idx}"]`);
}

/*
 * Play a rendered worksheet/practice set to a perfect score, driving the real
 * UI (real clicks, so blocked taps or repaint races fail the run).
 * In learn mode, dismiss the teaching explanation card after each question.
 */
export async function playQuestion(page, q, { learn = false, checkSettled = false } = {}) {
  if (q.kind === "choice") {
    await page.click(`[data-ws="choice"][data-i="${q.correctIndex}"]`);
  } else if (q.kind === "tapall") {
    for (let t = 0; t < q.matches.length; t++) {
      await tapItem(page, q.matches[t]);
      if (checkSettled && t === 0) {
        // Repaints of the same question must not replay entrance animations.
        await expect(page.locator(".ws-body")).toHaveClass(/ws-settled/);
      }
    }
  } else if (q.kind === "build") {
    if (learn) {
      for (const ch of q.word) await clickTileByLetter(page, ch);
    } else {
      const used = new Set();
      for (const ch of q.word) {
        const i = q.tiles.findIndex((t, idx) => t === ch && !used.has(idx));
        expect(i, `tile for letter ${ch}`).toBeGreaterThanOrEqual(0);
        used.add(i);
        await page.click(`[data-ws="tile"][data-i="${i}"]`);
      }
    }
  } else if (q.kind === "sort") {
    for (const bucket of q.buckets) {
      await page.click(`[data-ws="bucket"][data-i="${bucket}"]`);
      // The sort item repaints ~260ms after a correct drop.
      await page.waitForTimeout(320);
    }
  } else {
    throw new Error(`unknown question kind: ${q.kind}`);
  }
}

export async function playPerfectly(page, script, { learn = false } = {}) {
  let checkedOverlays = false;
  let checkedSettled = false;

  for (let qi = 0; qi < script.length; qi++) {
    const q = script[qi];
    await waitForQuestion(page, qi);

    if (!checkedOverlays && (await page.locator(".ws-scene").count())) {
      await assertOverlaysInert(page);
      checkedOverlays = true;
    }

    await playQuestion(page, q, { learn, checkSettled: q.kind === "tapall" && !checkedSettled });
    if (q.kind === "tapall") checkedSettled = true;

    if (learn) {
      // Teaching explanation card follows each correct answer in Learn mode.
      const next = page.locator('[data-ws="explnext"]');
      try {
        await next.waitFor({ state: "visible", timeout: 5_000 });
        await next.click();
      } catch {
        // Auto-advance timer beat us to it - fine.
      }
    }
  }

  await page.waitForSelector(".ws-end", { timeout: 20_000 });
}
