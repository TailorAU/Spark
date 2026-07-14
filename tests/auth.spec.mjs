/*
 * Auth: vault shape, lock screen, wrong password, unlock, remember-me, Lock button.
 * No decrypted child data ever appears in assertions - counts and ids only.
 */
import { test, expect } from "@playwright/test";
import { unlock, requirePassword, PASSWORD } from "./helpers.mjs";

test.describe("vault + lock screen", () => {
  test("children.enc.json is ciphertext-only with PBKDF2 params", async ({ request }) => {
    const res = await request.get("/children.enc.json");
    expect(res.ok()).toBeTruthy();
    const v = await res.json();
    for (const k of ["ct", "iter", "iv", "salt"]) expect(v, `vault has ${k}`).toHaveProperty(k);
    expect(v.kdf).toBe("PBKDF2");
    expect(v.hash).toBe("SHA-256");
    expect(v.iter).toBeGreaterThanOrEqual(310_000);
    // All payload fields are base64 - nothing readable ships.
    for (const k of ["ct", "iv", "salt"]) {
      expect(v[k]).toMatch(/^[A-Za-z0-9+/]+=*$/);
    }
    // GCM ct for three child records should be substantial but compact.
    expect(v.ct.length).toBeGreaterThan(100);
  });

  test("locked by default: no children in memory, lock card shown", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator(".lock-card")).toBeVisible();
    await expect(page.locator(".kid-card")).toHaveCount(0);
    const n = await page.evaluate(() => window.SPARK_DATA.CHILDREN.length);
    expect(n).toBe(0);
  });

  test("wrong password shows an error and stays locked", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector(".lock-card");
    await page.fill("#lockPw", "definitely-not-the-password");
    await page.click("#lockGo");
    await expect(page.locator(".lock-error")).toHaveClass(/show/);
    await expect(page.locator(".kid-card")).toHaveCount(0);
    const n = await page.evaluate(() => window.SPARK_DATA.CHILDREN.length);
    expect(n).toBe(0);
  });

  test("correct password unlocks to home with three kids; no remember means relock on reload", async ({ page }) => {
    await unlock(page, { remember: false });
    await expect(page.locator(".kid-card")).toHaveCount(3);
    const ids = await page.evaluate(() => window.SPARK_DATA.CHILDREN.map((c) => c.id));
    expect(ids).toEqual(["eldest", "middle", "youngest"]);
    // Not remembered: a reload demands the password again.
    await page.reload();
    await expect(page.locator(".lock-card")).toBeVisible();
    await expect(page.locator(".kid-card")).toHaveCount(0);
  });

  test("remember-me survives reload; Lock button forgets it", async ({ page }) => {
    requirePassword();
    await unlock(page, { remember: true });
    await expect(page.locator(".kid-card")).toHaveCount(3);

    await page.reload();
    await expect(page.locator(".kid-card")).toHaveCount(3, { timeout: 20_000 });

    // Lock & sign out from the More tab (it reloads the page itself).
    await page.click('[data-act="go"][data-route="more"]');
    await page.click("#lockBtn");
    await page.waitForSelector(".lock-card", { timeout: 20_000 });
    const remembered = await page.evaluate(() => localStorage.getItem("spark.vault.pw"));
    expect(remembered).toBeNull();
  });

  test("password sanity: env var decrypts the live vault in-page", async ({ page }) => {
    requirePassword();
    await page.goto("/");
    await page.waitForSelector(".lock-card");
    const ok = await page.evaluate(async (pw) => {
      const kids = await window.SPARK_AUTH.unlock(pw, false);
      return Array.isArray(kids) && kids.length === 3 && kids.every((k) => k.id && k.stage && k.name);
    }, PASSWORD);
    expect(ok).toBeTruthy();
  });
});
