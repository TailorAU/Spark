/*
 * Calendar hook: ICS parsing, keyword mapping to built-in contexts (including
 * race-date extraction), custom context creation with weave text, date-window
 * activation, Life-tab import UI, store migration, and print determinism with
 * calendar contexts active. All fixtures are synthetic.
 */
import { test, expect } from "@playwright/test";
import { unlock } from "./helpers.mjs";

const pad = (n) => String(n).padStart(2, "0");
function ymd(offsetDays) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
const ics = (ymdStr) => ymdStr.replaceAll("-", "");

function vcal(body) {
  return ["BEGIN:VCALENDAR", "VERSION:2.0", body, "END:VCALENDAR"].join("\r\n");
}
function vevent(summary, startYmd, endYmd) {
  const lines = ["BEGIN:VEVENT", `SUMMARY:${summary}`, `DTSTART;VALUE=DATE:${ics(startYmd)}`];
  if (endYmd) lines.push(`DTEND;VALUE=DATE:${ics(endYmd)}`);
  lines.push("END:VEVENT");
  return lines.join("\r\n");
}

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.waitForFunction(() => window.SPARK_CAL && window.SPARK_STORE);
});

test("parseICS: folded lines, escapes, all-day ranges, UTC times, RRULE ignored", async ({ page }) => {
  const out = await page.evaluate(() => {
    const text = [
      "BEGIN:VCALENDAR",
      "BEGIN:VEVENT",
      // RFC 5545 fold: continuation = CRLF + single space; the second space is content.
      "SUMMARY:Grandparents visit\\, with",
      "  a folded line",
      "DTSTART;VALUE=DATE:20260720",
      "DTEND;VALUE=DATE:20260723",
      "END:VEVENT",
      "BEGIN:VEVENT",
      "SUMMARY:Swimming lesson",
      "DTSTART:20260722T020000Z",
      "RRULE:FREQ=WEEKLY;COUNT=8",
      "END:VEVENT",
      "BEGIN:VEVENT",
      "SUMMARY:No dates - skipped",
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");
    return window.SPARK_CAL.parseICS(text);
  });
  expect(out.length).toBe(2);
  expect(out[0].summary).toBe("Grandparents visit, with a folded line");
  expect(out[0].date).toBe("2026-07-20");
  expect(out[0].until).toBe("2026-07-22"); // DTEND is exclusive for all-day
  expect(out[0].allDay).toBeTruthy();
  expect(out[1].summary).toBe("Swimming lesson");
  // 02:00Z is midday-ish in any AU timezone - same calendar date everywhere east of UTC.
  expect(out[1].date).toBe("2026-07-22");
  expect(out[1].allDay).toBeFalsy();
});

test("classify: keywords map to built-in contexts, races set the race date", async ({ page }) => {
  const r = await page.evaluate(() => {
    const C = window.SPARK_CAL;
    return {
      camp: C.classify({ summary: "Camping at Neurum Creek", date: "2026-08-01" }),
      xcTrain: C.classify({ summary: "Cross country training", date: "2026-08-03" }),
      xcRace: C.classify({ summary: "School Cross Country Carnival", date: "2026-08-14" }),
      fiji: C.classify({ summary: "Fiji photos night", date: "2026-07-20" }),
      custom: C.classify({ summary: "Trip to the library", date: "2026-07-21" }),
    };
  });
  expect(r.camp).toEqual({ kind: "builtin", id: "camping" });
  expect(r.xcTrain).toEqual({ kind: "builtin", id: "crosscountry" });
  expect(r.xcRace).toEqual({ kind: "builtin", id: "crosscountry", raceDate: "2026-08-14" });
  expect(r.fiji).toEqual({ kind: "builtin", id: "fiji" });
  expect(r.custom.kind).toBe("custom");
  expect(r.custom.context.id).toMatch(/^cal-/);
  expect(r.custom.context.childScope).toBe("all");
  // The weave covers every area id across all three frameworks.
  const areaIds = await page.evaluate(() =>
    Object.values(window.SPARK_DATA.FRAMEWORKS).flatMap((f) => f.areas.map((a) => a.id))
  );
  for (const id of new Set(areaIds)) {
    expect(r.custom.context.weave[id], `weave covers area ${id}`).toBeTruthy();
  }
});

test("custom contexts tailor the weekly plan for every stage", async ({ page }) => {
  const r = await page.evaluate(() => {
    const C = window.SPARK_CAL;
    const E = window.SPARK_ENGINE;
    const ctx = { ...C.makeContext({ summary: "Nanna's birthday party", date: "2026-07-20", until: null }), active: true };
    const kids = [
      { id: "eldest", name: "Child A", stage: "year1", framework: "acv9", dob: "2019-07-01" },
      { id: "middle", name: "Child B", stage: "kindy", framework: "qklg", dob: "2021-03-01" },
      { id: "youngest", name: "Child C", stage: "eylf", framework: "eylf", dob: "2023-11-01" },
    ];
    const week = E.weekStart(new Date("2026-07-20T12:00:00"));
    return kids.map((k) => {
      const plan = E.planForChild(k, week, [ctx]);
      return { id: k.id, tailored: plan.tailoredCount, total: plan.items.length };
    });
  });
  for (const row of r) {
    expect(row.tailored, `${row.id} plan tailored by calendar event`).toBe(row.total);
  }
});

test("date window: calendar contexts fade in before and out after the event", async ({ page }) => {
  const r = await page.evaluate(() => {
    const S = window.SPARK_STORE;
    const C = window.SPARK_CAL;
    const ctx = C.makeContext({ summary: "Zoo excursion", date: "2026-09-10", until: null });
    S.addCustomContext(ctx);
    const has = (onDate) => S.activeContexts(new Date(onDate + "T12:00:00")).some((c) => c.id === ctx.id);
    return {
      farBefore: has("2026-08-01"),
      warmup: has("2026-08-30"),
      onDay: has("2026-09-10"),
      linger: has("2026-09-18"),
      farAfter: has("2026-10-01"),
    };
  });
  expect(r.farBefore).toBeFalsy();
  expect(r.warmup).toBeTruthy();
  expect(r.onDay).toBeTruthy();
  expect(r.linger).toBeTruthy();
  expect(r.farAfter).toBeFalsy();
});

test("import window: stale and far-future events are skipped, reimports dedupe", async ({ page }) => {
  const r = await page.evaluate(() => {
    const C = window.SPARK_CAL;
    const S = window.SPARK_STORE;
    const iso = (off) => {
      const d = new Date();
      d.setDate(d.getDate() + off);
      return d.toISOString().slice(0, 10);
    };
    const events = [
      { summary: "Old thing", date: iso(-60), until: null },
      { summary: "Too far away", date: iso(200), until: null },
      { summary: "Picnic in the park", date: iso(7), until: null },
    ];
    const first = C.importEvents(events);
    const again = C.importEvents(events);
    return { first, again, count: S.customContexts().length };
  });
  expect(r.first.created).toBe(1);
  expect(r.first.skipped).toBe(2);
  expect(r.again.created).toBe(0);
  expect(r.count).toBe(1);
});

test("Life tab: paste + import shows the event, weaves the week, remove works", async ({ page }) => {
  await unlock(page);
  await page.click('[data-act="go"][data-route="contexts"]');
  await expect(page.locator(".cal-import")).toBeVisible();

  const start = ymd(7);
  const text = vcal(vevent("Picnic at Botanic Gardens", start));
  await page.fill("#icsPaste", text);
  await page.click('[data-act="cal-import"]');

  const row = page.locator(".ctx-row", { hasText: "Picnic at Botanic Gardens" });
  await expect(row).toBeVisible();
  await expect(row.locator(".toggle")).toHaveClass(/on/);

  // The event now tailors the plan for the week it happens in.
  const woven = await page.evaluate((dateStr) => {
    const D = window.SPARK_DATA;
    const E = window.SPARK_ENGINE;
    const S = window.SPARK_STORE;
    const onDate = new Date(dateStr + "T12:00:00");
    const active = S.activeContexts(onDate);
    const ctx = active.find((c) => c.id.startsWith("cal-"));
    if (!ctx) return { found: false };
    const child = D.CHILDREN[0];
    const plan = E.planForChild(child, E.weekStart(onDate), active);
    return {
      found: true,
      tailoredByEvent: plan.items.filter((i) => i.activity.tailoredBy === ctx.id).length,
    };
  }, start);
  expect(woven.found).toBeTruthy();
  expect(woven.tailoredByEvent).toBeGreaterThan(0);

  // Remove forgets it.
  await row.locator('[data-act="cal-remove"]').click();
  await expect(page.locator(".ctx-row", { hasText: "Picnic at Botanic Gardens" })).toHaveCount(0);
  const left = await page.evaluate(() => window.SPARK_STORE.customContexts().length);
  expect(left).toBe(0);
});

test("cross-country carnival import sets the race date and spotlight", async ({ page }) => {
  await unlock(page);
  await page.click('[data-act="go"][data-route="contexts"]');
  const race = ymd(21); // 3 weeks out - inside the training plan
  await page.fill("#icsPaste", vcal(vevent("School Cross Country Carnival", race)));
  await page.click('[data-act="cal-import"]');

  const r = await page.evaluate(() => {
    const S = window.SPARK_STORE;
    const cc = S.activeContexts().find((c) => c.id === "crosscountry");
    return { active: !!cc, raceDate: cc && cc.raceDate };
  });
  expect(r.active).toBeTruthy();
  expect(r.raceDate).toBe(race);

  // The eldest's child view shows the training spotlight with the new date.
  await page.click('[data-act="go"][data-route="home"]');
  await page.click('[data-act="child"][data-id="eldest"]');
  await expect(page.locator(".spotlight")).toBeVisible();
  await expect(page.locator(".spot-note")).toContainText(race);
});

test("store migration: pre-calendar state loads clean, history intact", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      "spark.state.v1",
      JSON.stringify({
        contexts: { fiji: { active: true } },
        done: { "eldest:2026-01-05:english": true },
        sheets: {},
        skills: { "eldest:add": { lv: 1, up: 0, down: 0 } },
        mastery: { "eldest:y1-phonics": { attempts: 1, bestStars: 3, total: 3, mastered: true } },
        settings: { apiBaseUrl: "" },
      })
    );
  });
  await page.goto("/");
  await page.waitForFunction(() => window.SPARK_STORE);
  const r = await page.evaluate(() => {
    const S = window.SPARK_STORE;
    return {
      customs: S.customContexts().length,
      active: S.activeContexts().map((c) => c.id),
      doneKept: S.isDone("eldest", new Date("2026-01-05T12:00:00"), "english"),
      skillKept: S.skillLevel("eldest", "add"),
      masteryKept: !!S.getSkillMastery("eldest", "y1-phonics")?.mastered,
      addWorks: S.addCustomContext({ id: "cal-migrate", label: "x", emoji: "x", weave: {} }),
    };
  });
  expect(r.customs).toBe(0);
  expect(r.active).toContain("fiji");
  expect(r.doneKept).toBeTruthy();
  expect(r.skillKept).toBe(1);
  expect(r.masteryKept).toBeTruthy();
  expect(r.addWorks).toBeTruthy();
});

test("print pack stays deterministic with a calendar context active", async ({ page }) => {
  test.use; // viewport default is fine - structure only
  await unlock(page, { remember: true });
  const packDate = ymd(7);
  await page.evaluate((d) => {
    const C = window.SPARK_CAL;
    window.SPARK_STORE.addCustomContext(C.makeContext({ summary: "Picnic at the gardens", date: d, until: null }));
  }, packDate);

  await page.goto(`/?date=${packDate}#print`);
  await expect(page.locator(".pp-page")).toHaveCount(3);
  const first = await page.locator(".pp-pack").innerHTML();
  await page.goto(`/?date=${packDate}#print`);
  await expect(page.locator(".pp-page")).toHaveCount(3);
  const second = await page.locator(".pp-pack").innerHTML();
  expect(second).toBe(first);
});
