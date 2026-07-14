/*
 * PWA deploy discipline, enforced: every file index.html loads must be in the
 * service worker's ASSETS list (or installed apps serve stale/missing code),
 * and the custom domain must stay intact. Pure file checks.
 */
import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";

const APP = fileURLToPath(new URL("../app/", import.meta.url));
const read = (rel) => readFileSync(join(APP, rel), "utf8");

test("every file index.html references is in the service worker ASSETS list", () => {
  const html = read("index.html");
  const sw = read("sw.js");
  const assets = [...sw.matchAll(/"\.\/([^"]+)"/g)].map((m) => m[1]);

  const refs = [
    ...[...html.matchAll(/src="\.\/([^"]+)"/g)].map((m) => m[1]),
    ...[...html.matchAll(/href="\.\/([^"]+)"/g)].map((m) => m[1]),
  ].filter((p) => !p.startsWith("icons/") || p.endsWith(".svg"));

  const missing = refs.filter((r) => !assets.includes(r));
  expect(missing, `index.html references missing from sw.js ASSETS: ${missing.join(", ")}`).toEqual([]);

  // The data files the app fetches at runtime must be cached for offline too.
  for (const runtime of ["content.json", "children.enc.json"]) {
    expect(assets, `${runtime} cached for offline`).toContain(runtime);
  }
});

test("service worker cache version is spark-vN", () => {
  const m = /const CACHE = "spark-v(\d+)"/.exec(read("sw.js"));
  expect(m, "sw.js declares a spark-vN cache").not.toBeNull();
  expect(Number(m[1])).toBeGreaterThanOrEqual(9);
});

test("custom domain CNAME is intact", () => {
  expect(read("CNAME").trim()).toBe("spark.tailorai.au");
});

test("all app scripts stay vanilla - no external CDNs or imports", () => {
  const html = read("index.html");
  expect(html).not.toMatch(/src="https?:\/\//);
  expect(html).not.toMatch(/href="https?:\/\//);
});
