/*
 * Spark — local-printer fallback.
 * Renders the day's pack to a PDF and sends it straight to a printer on this
 * machine (no email/cloud). Run it on any always-on computer via cron (mac/
 * Linux) or Task Scheduler (Windows) for overnight printing.
 *
 *   SPARK_VAULT_PW=... node print-local.mjs
 * Env: SPARK_URL, DATE, PRINTER (named printer), OUT, NO_PRINT=1 (render only).
 */
import { chromium } from "playwright";
import { spawnSync } from "node:child_process";
import { statSync } from "node:fs";

const URL = process.env.SPARK_URL || "https://spark.tailorai.au";
const PW = process.env.SPARK_VAULT_PW;
const OUT = process.env.OUT || "spark-pack.pdf";
if (!PW) { console.error("SPARK_VAULT_PW is required"); process.exit(2); }
const DATE = process.env.DATE || new Date().toLocaleDateString("en-CA", { timeZone: "Australia/Brisbane" });

const browser = await chromium.launch({ args: ["--no-sandbox"], executablePath: process.env.PW_CHROMIUM || undefined });
const ctx = await browser.newContext({ viewport: { width: 820, height: 1123 } });

async function renderOnce() {
  const page = await ctx.newPage();
  try {
    await page.goto(`${URL}/?date=${DATE}#print`, { waitUntil: "networkidle", timeout: 60000 });
    await page.waitForSelector(".lock-card", { timeout: 30000 });
    await page.fill("#lockPw", PW);
    await page.click("#lockGo");
    await page.waitForSelector(".pp-page", { timeout: 30000 });
    const pages = await page.locator(".pp-page").count();
    if (pages < 3) console.warn(`only ${pages} page(s) rendered - expected one per child + answer key; printing anyway`);
    await page.emulateMedia({ media: "print" });
    await page.pdf({ path: OUT, format: "A4", printBackground: true });
    return pages;
  } finally {
    await page.close();
  }
}

// A transient network/site blip at 5:30am must not cost the morning's pack:
// retry the whole render a few times before giving up.
const ATTEMPTS = Number(process.env.ATTEMPTS || 3);
let pages = 0, lastErr = null;
for (let i = 1; i <= ATTEMPTS; i++) {
  try { pages = await renderOnce(); lastErr = null; break; }
  catch (e) {
    lastErr = e;
    console.error(`render attempt ${i}/${ATTEMPTS} failed: ${e.message}`);
    if (i < ATTEMPTS) await new Promise((r) => setTimeout(r, 15000));
  }
}
await browser.close();
if (lastErr) { console.error("all render attempts failed - nothing to print"); process.exit(1); }
console.log(`rendered ${DATE} (${pages} pages) -> ${OUT} (${statSync(OUT).size} bytes)`);

if (process.env.NO_PRINT === "1") process.exit(0);

// Send to the printer.
const isWin = process.platform === "win32";
let res;
if (isWin) {
  // Windows: print the PDF with the default associated app.
  res = spawnSync("powershell", ["-Command", `Start-Process -FilePath '${OUT}' -Verb Print`], { stdio: "inherit" });
} else {
  // mac/Linux: CUPS.
  const args = ["-o", "media=A4", "-o", "fit-to-page"];
  if (process.env.PRINTER) args.unshift("-d", process.env.PRINTER);
  res = spawnSync("lp", [...args, OUT], { stdio: "inherit" });
}
if (res.status !== 0) {
  console.error("print command failed — is a printer set up? PDF is saved at", OUT);
  process.exit(1);
}
console.log("sent to printer.");
