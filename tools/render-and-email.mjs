/*
 * Spark — nightly pack renderer + emailer.
 * Renders the day's tailored worksheet pack (one A4 page per child) to a PDF,
 * then emails it to a printer's email-print address (HP ePrint / Epson Email
 * Print / Brother etc.) so it prints overnight.
 *
 * Runs headless against the LIVE site, so it always uses the deployed app,
 * content and the child's current adaptive level. No data is stored here; the
 * family password is provided via the SPARK_VAULT_PW secret and only used to
 * decrypt the vault in the browser, exactly as the app does.
 *
 * Env:
 *   SPARK_URL        default https://spark.tailorai.au
 *   SPARK_VAULT_PW   required — the family password
 *   DATE             optional YYYY-MM-DD (default: today in Australia/Brisbane)
 *   OUT              output pdf path (default ./spark-pack.pdf)
 *   Email (optional — omit to just render):
 *   PRINTER_EMAIL, SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, FROM_EMAIL
 *   DRY_RUN=1        render only, skip sending
 */
import { chromium } from "playwright";
import { statSync } from "node:fs";

const URL = process.env.SPARK_URL || "https://spark.tailorai.au";
const PW = process.env.SPARK_VAULT_PW;
const OUT = process.env.OUT || "spark-pack.pdf";
if (!PW) { console.error("SPARK_VAULT_PW is required"); process.exit(2); }

function brisbaneToday() {
  // en-CA yields YYYY-MM-DD
  return new Date().toLocaleDateString("en-CA", { timeZone: "Australia/Brisbane" });
}
const DATE = process.env.DATE || brisbaneToday();

async function render() {
  const browser = await chromium.launch({
    args: ["--no-sandbox"],
    executablePath: process.env.PW_CHROMIUM || undefined,
  });
  const ctx = await browser.newContext({ viewport: { width: 820, height: 1123 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(`${URL}/?date=${DATE}#print`, { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForSelector(".lock-card", { timeout: 30000 });
  await page.fill("#lockPw", PW);
  await page.click("#lockGo");
  await page.waitForSelector(".pp-page", { timeout: 30000 });
  const pages = await page.locator(".pp-page").count();
  if (!pages) throw new Error("no worksheet pages rendered (wrong password?)");
  await page.emulateMedia({ media: "print" });
  await page.pdf({ path: OUT, format: "A4", printBackground: true });
  await browser.close();
  if (errors.length) console.warn("page warnings:", errors.join(" | "));
  return { pages, bytes: statSync(OUT).size };
}

async function email() {
  const { PRINTER_EMAIL, SMTP_HOST, SMTP_USER, SMTP_PASS } = process.env;
  if (process.env.DRY_RUN === "1" || !PRINTER_EMAIL || !SMTP_HOST) {
    console.log(`(email skipped — ${process.env.DRY_RUN === "1" ? "DRY_RUN" : "no PRINTER_EMAIL/SMTP_HOST"}). PDF at ${OUT}`);
    return;
  }
  const { default: nodemailer } = await import("nodemailer");
  const transport = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: SMTP_USER ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
  });
  await transport.sendMail({
    from: process.env.FROM_EMAIL || SMTP_USER,
    to: PRINTER_EMAIL,
    subject: `Spark worksheets — ${DATE}`,
    text: `Today's tailored worksheet pack for the kids (${DATE}).`,
    attachments: [{ filename: `spark-pack-${DATE}.pdf`, path: OUT }],
  });
  console.log(`emailed ${OUT} to ${PRINTER_EMAIL}`);
}

const r = await render();
console.log(`rendered ${r.pages} page(s), ${r.bytes} bytes for ${DATE}`);
await email();
console.log("done");
