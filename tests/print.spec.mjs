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

  await expect(page.locator(".pp-page")).toHaveCount(3);

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

  // Cross-country training session appears on the Year 1 page on weekdays
  // (default race date is 4 weeks out, which the plan covers).
  const dow = new Date(`${date}T12:00:00`).getDay();
  const training = page.locator(".pp-page:has(.pp-sumgrid) .pp-todo", { hasText: "Training:" });
  await expect(training).toHaveCount(dow >= 1 && dow <= 5 ? 1 : 0);
});

test("pack is date-deterministic: same date same pack, new date new pack", async ({ page }) => {
  await unlock(page, { path: "/?date=2026-03-05#print", remember: true });
  await expect(page.locator(".pp-page")).toHaveCount(3);
  const first = await page.locator(".pp-pack").innerHTML();

  // Re-render the same date (remember-me carries the unlock through reload).
  await page.goto("/?date=2026-03-05#print");
  await expect(page.locator(".pp-page")).toHaveCount(3);
  const second = await page.locator(".pp-pack").innerHTML();
  expect(second).toBe(first);

  // A different date produces different content.
  await page.goto("/?date=2026-03-06#print");
  await expect(page.locator(".pp-page")).toHaveCount(3);
  const other = await page.locator(".pp-pack").innerHTML();
  expect(other).not.toBe(first);
});

test("print media hides app chrome and a 3-page A4 PDF renders", async ({ page }) => {
  const date = brisbaneToday();
  await unlock(page, { path: `/?date=${date}#print` });
  await expect(page.locator(".pp-page")).toHaveCount(3);

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
  // One page per child: count page objects in the PDF stream.
  const pages = (pdf.toString("latin1").match(/\/Type\s*\/Page[^s]/g) || []).length;
  expect(pages).toBe(3);
});
