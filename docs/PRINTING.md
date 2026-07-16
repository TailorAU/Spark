# Spark — printing worksheets

Spark generates **pen-and-paper worksheets** the kids can write on: one A4 page
per child, tailored to the week's life events and each child's level, with
today's schedule at the top. Fresh content every day.

## Print now (from the app)

1. Open [spark.tailorai.au](https://spark.tailorai.au) and unlock with the family
   password.
2. On the Home screen tap **🖨️ Print pack**.
3. Tap **Print now** → choose your printer → print. Each child gets one A4 page.

That's it — no setup. Everything below is only for **automatic overnight
printing**.

---

## Automatic overnight printing

Because Spark is a website (there's no server, and browsers can't print by
themselves), the overnight job runs outside the app. Two options — pick one.

### Option A — Email-to-print (recommended, no home computer needed)

Most modern printers can print a PDF that's **emailed** to them:

- **HP** → HP ePrint: your printer has an address like `something@hpeprint.com`
  (HP Smart app → Printer → ePrint).
- **Epson** → Epson Email Print / Epson Connect: `something@print.epsonconnect.com`.
- **Brother** → Brother Web Connect / Cloud Print.

A scheduled **GitHub Action** (`.github/workflows/nightly-print.yml`) renders the
day's pack to a PDF at **04:30 Brisbane time** and emails it to that address, so
it's in the tray in the morning.

**One-time setup** — in this repo: **Settings → Secrets and variables → Actions
→ New repository secret**, add:

| Secret | Value |
|---|---|
| `SPARK_VAULT_PW` | the family password (used only to unlock the vault in a headless browser, same as the app) |
| `PRINTER_EMAIL` | your printer's email-print address |
| `SMTP_HOST` | your outgoing mail server, e.g. `smtp.gmail.com` |
| `SMTP_PORT` | `587` (or `465`) |
| `SMTP_USER` | the sending mailbox, e.g. `you@gmail.com` |
| `SMTP_PASS` | an **app password** for that mailbox (not your normal password) |
| `FROM_EMAIL` | optional; defaults to `SMTP_USER` |

Then enable Actions (Actions tab → enable workflows). Test immediately without
waiting for the schedule: **Actions → Nightly worksheet print → Run workflow**
(optionally type a date). The run also uploads the PDF as an artifact you can
download and check.

> If `SPARK_VAULT_PW` isn't set, the job exits cleanly and does nothing — it
> won't spam you with failures.

Change the time by editing the `cron:` line (it's in UTC; `30 18` = 04:30
Brisbane). Gmail tip: turn on 2-Step Verification, then create an **App
password** for "Mail" and use that as `SMTP_PASS`.

### Option B — Local printer (a computer that's on overnight)

If your printer can't do email-print, run the render on any always-on machine
(a laptop, a Raspberry Pi) and print over USB/Wi-Fi:

```bash
cd tools
npm install
npx playwright install chromium
SPARK_VAULT_PW='your-password' node print-local.mjs        # prints to default printer
# options: PRINTER='Brother_HL' DATE=2026-07-16 NO_PRINT=1 (render only)
```

Schedule it overnight:

- **mac/Linux** (cron): `crontab -e` →
  `30 6 * * * cd /path/to/tools && SPARK_VAULT_PW='…' /usr/local/bin/node print-local.mjs`
- **Windows** (Task Scheduler): new task, daily 6:30am, action:
  `node C:\path\to\tools\print-local.mjs` with `SPARK_VAULT_PW` set as an
  environment variable for the task.

`print-local.mjs` uses CUPS (`lp`) on mac/Linux and the default PDF handler's
Print verb on Windows. It always saves `spark-pack.pdf` too, so if printing
fails you still have the file.

---

## What's on each page

- **Today's plan** — the child's real day: school/kindy/day-care, two of today's
  tailored learning activities, the cross-country training session for that
  weekday, tick-boxes and blank write-in rows.
- **The eldest (Year 1):** handwriting guide-lines + trace-the-word,
  write-a-sentence lines, sums with answer boxes at their current level, a
  missing-number sequence, and a draw-the-hands clock.
- **The middle child (Kindy):** letter tracing, name tracing, count-and-circle,
  draw-the-next pattern, rhyme matching.
- **The youngest (toddler):** pre-writing stroke traces, a big letter to trace,
  count 1–3, and colouring outlines.

Content is **date-seeded** — the same date always prints the same pack, and each
new day is fresh. The theme (Fiji / camping / race day / home) follows whatever
life events are switched on in the app's **Life** tab.

The pack ends with a **For grown-ups — today's answers** page: every checkable
answer (sums, sequences, the clock, count-and-circle, patterns, rhymes) in one
tear-off key.

## Keeping the pack current — `app/family.json`

The overnight render runs in a fresh browser with no saved state, so it can't
see what's in anyone's app. `app/family.json` is the committed, **PII-free**
source of truth it follows instead:

- `contexts` — which life events are on, and the real `raceDate` (this is what
  makes the printed cross-country countdown actually count down).
- `customContexts` — calendar-style one-off events (same shape the Life tab's
  ICS import creates) with a `date`/`until` window.
- `printSkills` — per-child print difficulty (0–2) for the maths sections.

Edit, commit, push — the next morning's pack reflects it (~90s to deploy). On
the kids' devices the file only fills gaps: their own toggles and adaptive
progress always win. **Never put names, birthdays or a school in this file** —
the repo is public.

## Privacy note

The nightly job needs the family password (as the `SPARK_VAULT_PW` secret) to
unlock the encrypted vault in a headless browser — exactly what the app does on
your device. GitHub encrypts secrets and never prints them in logs. The rendered
PDF contains the kids' names (it's their worksheet); it's emailed only to the
address you configure. If you'd rather names never leave your house, use
**Option B** (local printer).
