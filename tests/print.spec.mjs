/*
 * Print pack: the surface the 5:30am Task Scheduler run depends on.
 * /?date=YYYY-MM-DD#print must render one A4 page per child with the day's
 * plan; output must be date-deterministic; print CSS must hide app chrome;
 * and a real PDF must render (like tools/print-local.mjs does).
 *
 * Rendered pages and PDFs contain real names: the PDF goes to the gitignored
 * .artifacts/ folder only, and no assertion or snapshot captures name text.
 */
import { test, expect } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { unlock } from "./helpers.mjs";

test.use({ viewport: { width: 820, height: 1123 } });

const brisbaneToday = () =>
  new Date().toLocaleDateString("en-CA", { timeZone: "Australia/Brisbane" });

test("today's pack: one structured A4 page per child", async ({ page }) => {
  const date = brisbaneToday();
  await unlock(page, { path: `/?date=${date}#print` });

  await expect(page.locator(".pp-page")).toHaveCount(4);

  // Stage-specific structure identifies each child's page without names:
  // Year 1 = sums + clock, Kindergarten = rhyme matching, toddler = big initial + colouring.
  await expect(page.locator(".pp-page:has(.pp-sumgrid)")).toHaveCount(1);
  await expect(page.locator(".pp-page:has(.pp-match)")).toHaveCount(1);
  await expect(page.locator(".pp-page:has(.pp-biginitial)")).toHaveCount(1);
  await expect(page.locator(".pp-page:has(.pp-sumgrid) .pp-sum")).toHaveCount(6);
  await expect(page.locator(".pp-page:has(.pp-sumgrid) .pp-clock")).toHaveCount(1);
  await expect(page.locator(".pp-page:has(.pp-biginitial) .pp-colour-item")).toHaveCount(2);

  for (let i = 0; i < 3; i++) {
    const pg = page.locator(".pp-page").nth(i);
    await expect(pg.locator(".pp-head")).toHaveCount(1);
    await expect(pg.locator(".pp-foot")).toHaveCount(1);
    // Today's plan: school line + 2 plan items + worksheet line + 2 write-ins
    // (plus training for the eldest on weekdays).
    expect(await pg.locator(".pp-todo").count()).toBeGreaterThanOrEqual(6);
    await expect(pg.locator(".pp-writein")).toHaveCount(2);
  }

  // Cross-country training appears on the Year 1 page on weekdays while the
  // configured race date is within the training plan - derive the expectation
  // from live state so the suite stays green after race day passes.
  const expectTraining = await page.evaluate((d) => {
    const S = window.SPARK_STORE, E = window.SPARK_ENGINE, D = window.SPARK_DATA;
    const ref = new Date(`${d}T12:00:00`);
    const dow = ref.getDay();
    if (dow < 1 || dow > 5) return false;
    const cc = S.activeContexts(ref).find((c) => c.id === "crosscountry");
    if (!cc || !cc.raceDate) return false;
    const weeksOut = Math.round((E.weekStart(new Date(cc.raceDate)) - E.weekStart(ref)) / (7 * 24 * 3600 * 1000));
    const plan = D.CROSS_COUNTRY_PLAN.find((p) => p.wk === weeksOut);
    return !!(plan && plan.sessions[dow - 1]);
  }, date);
  const training = page.locator(".pp-page:has(.pp-sumgrid) .pp-todo", { hasText: "Training:" });
  await expect(training).toHaveCount(expectTraining ? 1 : 0);
});

test("pack is date-deterministic: same date same pack, new date new pack", async ({ page }) => {
  await unlock(page, { path: "/?date=2026-03-05#print", remember: true });
  await expect(page.locator(".pp-page")).toHaveCount(4);
  const first = await page.locator(".pp-pack").innerHTML();

  // Re-render the same date (remember-me carries the unlock through reload).
  await page.goto("/?date=2026-03-05#print");
  await expect(page.locator(".pp-page")).toHaveCount(4);
  const second = await page.locator(".pp-pack").innerHTML();
  expect(second).toBe(first);

  // A different date produces different content.
  await page.goto("/?date=2026-03-06#print");
  await expect(page.locator(".pp-page")).toHaveCount(4);
  const other = await page.locator(".pp-pack").innerHTML();
  expect(other).not.toBe(first);
});

test("print media hides app chrome and a 4-page A4 PDF renders", async ({ page }) => {
  const date = brisbaneToday();
  await unlock(page, { path: `/?date=${date}#print` });
  await expect(page.locator(".pp-page")).toHaveCount(4);

  await page.emulateMedia({ media: "print" });
  await expect(page.locator("#nav")).toHaveCSS("display", "none");
  await expect(page.locator(".pp-toolbar")).toHaveCSS("display", "none");

  const dir = fileURLToPath(new URL("./.artifacts/", import.meta.url));
  mkdirSync(dir, { recursive: true });
  const pdf = await page.pdf({
    path: `${dir}pack-${date}.pdf`,
    format: "A4",
    printBackground: true,
  });

  expect(pdf.length).toBeGreaterThan(20_000);
  // One page per child (3) plus the grown-ups' answer key (1): count page
  // objects in the PDF stream.
  const pages = (pdf.toString("latin1").match(/\/Type\s*\/Page[^s]/g) || []).length;
  expect(pages).toBe(4);
});

test("grown-ups' answer key: last page, one block per child, arithmetically correct", async ({ page }) => {
  const date = brisbaneToday();
  await unlock(page, { path: `/?date=${date}#print` });
  await expect(page.locator(".pp-page")).toHaveCount(4);

  // The key is the final page and never mixes into a child's worksheet page.
  const key = page.locator(".pp-keypage");
  await expect(key).toHaveCount(1);
  await expect(page.locator(".pp-page").last()).toHaveClass(/pp-keypage/);
  await expect(key.locator(".pp-keyblock")).toHaveCount(3);

  // Whatever the seed, every printed maths answer must actually be correct.
  const mathsRow = key.locator(".pp-key-row", { hasText: "Maths:" }).first();
  const txt = await mathsRow.innerText();
  const eqs = txt.match(/(\d+)\s*([+−-])\s*(\d+)\s*=\s*(-?\d+)/g) || [];
  expect(eqs.length).toBe(6);
  for (const eq of eqs) {
    const m = eq.match(/(\d+)\s*([+−-])\s*(\d+)\s*=\s*(-?\d+)/);
    const a = +m[1], b = +m[3], got = +m[4];
    expect(got).toBe(m[2] === "+" ? a + b : a - b);
  }
});
