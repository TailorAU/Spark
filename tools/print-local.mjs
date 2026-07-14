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
const page = await (await browser.newContext({ viewport: { width: 820, height: 1123 } })).newPage();
await page.goto(`${URL}/?date=${DATE}#print`, { waitUntil: "networkidle", timeout: 60000 });
await page.waitForSelector(".lock-card", { timeout: 30000 });
await page.fill("#lockPw", PW);
await page.click("#lockGo");
await page.waitForSelector(".pp-page", { timeout: 30000 });
await page.emulateMedia({ media: "print" });
await page.pdf({ path: OUT, format: "A4", printBackground: true });
await browser.close();
console.log(`rendered ${DATE} -> ${OUT} (${statSync(OUT).size} bytes)`);

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
