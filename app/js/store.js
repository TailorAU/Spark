/*
 * Spark — persistence & state
 * localStorage-backed. Tracks which life contexts are active (with any extra
 * fields like a cross-country race date), completed activities per child/week,
 * and settings (optional live API base URL).
 */
(function () {
  "use strict";
  const KEY = "spark.state.v1";
  const D = window.SPARK_DATA;

  function defaults() {
    // Seed the family's current reality: back from Fiji, camping this weekend,
    // the eldest's cross-country training on with a race ~4 weeks out.
    const today = new Date();
    const race = new Date(today);
    race.setDate(race.getDate() + 28);
    return {
      contexts: {
        fiji: { active: true },
        camping: { active: true },
        crosscountry: { active: true, raceDate: race.toISOString().slice(0, 10) },
      },
      done: {}, // key: `${childId}:${weekISO}:${areaId}` -> true
      sheets: {}, // key: `${childId}:${weekISO}` -> { stars, total, at } (best result)
      skills: {}, // key: `${childId}:${skill}` -> { lv, up, down } (adaptive difficulty)
      mastery: {}, // key: `${childId}:${skillId}` -> { attempts, bestStars, total, mastered, at }
      customContexts: [], // calendar-imported life contexts (see calendar.js)
      settings: { apiBaseUrl: "" },
    };
  }

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return defaults();
      const parsed = JSON.parse(raw);
      return { ...defaults(), ...parsed };
    } catch (_) {
      return defaults();
    }
  }

  let state = load();

  // --- committed family config (family.json) ---------------------------------
  // The 5:30am print run renders in a fresh browser with NO localStorage, so
  // without this every nightly pack froze on defaults(): the race countdown
  // stuck at ~4 weeks, calendar events never reached paper. family.json is the
  // committed, PII-free source of truth the headless run follows. Semantics:
  //   - context fields (raceDate, dates): config wins over defaults AND over
  //     the seeded stored copy, so a curated date beats a stale rolling one;
  //   - `active` flags: a stored value wins - the family's in-app toggles are
  //     never stomped by config;
  //   - customContexts: config entries join by id; device-imported ones win;
  //   - printSkills: fallback difficulty ONLY where no local skill record
  //     exists (fresh headless run) - real adaptive progress always wins.
  // Never save()d here: the merge is recomputed each boot so config edits keep
  // taking effect on every device.
  let printConfig = null;

  function applyConfig(cfg) {
    if (!cfg || typeof cfg !== "object") return;
    printConfig = cfg;
    let storedCtx = {};
    try { storedCtx = (JSON.parse(localStorage.getItem(KEY)) || {}).contexts || {}; } catch (_) {}
    for (const [id, fields] of Object.entries(cfg.contexts || {})) {
      const stored = storedCtx[id] || {};
      const merged = { ...(state.contexts[id] || {}), ...fields };
      if ("active" in stored) merged.active = stored.active;
      state.contexts[id] = merged;
    }
    for (const ctx of cfg.customContexts || []) {
      if (!ctx || !ctx.id) continue;
      state.customContexts = state.customContexts || [];
      if (!state.customContexts.some((c) => c.id === ctx.id)) {
        state.customContexts.push(ctx);
        if (!("active" in (storedCtx[ctx.id] || {}))) {
          state.contexts[ctx.id] = { ...(state.contexts[ctx.id] || {}), active: true };
        }
      }
    }
  }

  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch (_) {}
  }

  // A calendar context is only relevant around its event: it warms up two
  // weeks before and lingers ten days after (recounts), keyed off `onDate` so
  // print packs stay deterministic per pack date.
  function inContextWindow(c, onDate) {
    if (!c.date) return true;
    const ref = new Date(onDate);
    ref.setHours(12, 0, 0, 0);
    const from = new Date(`${c.date}T12:00:00`);
    from.setDate(from.getDate() - 14);
    const to = new Date(`${c.until || c.date}T12:00:00`);
    to.setDate(to.getDate() + 10);
    return ref >= from && ref <= to;
  }

  // Merge stored context flags/fields onto the library (plus any calendar-
  // imported contexts) so the engine gets a single list of "active" objects.
  function activeContexts(onDate) {
    const ref = onDate ? new Date(onDate) : new Date();
    const lib = D.CONTEXT_LIBRARY.filter((c) => state.contexts[c.id]?.active);
    const custom = (state.customContexts || []).filter(
      (c) => state.contexts[c.id]?.active && inContextWindow(c, ref)
    );
    return lib.concat(custom).map((c) => ({ ...c, ...state.contexts[c.id] }));
  }

  // --- calendar-imported contexts --------------------------------------------
  function customContexts() {
    return (state.customContexts || []).slice();
  }

  function addCustomContext(ctx) {
    if (!ctx || !ctx.id) return false;
    state.customContexts = state.customContexts || [];
    if (state.customContexts.some((c) => c.id === ctx.id)) return false;
    state.customContexts.push(ctx);
    state.contexts[ctx.id] = { ...(state.contexts[ctx.id] || {}), active: true };
    save();
    return true;
  }

  function removeCustomContext(id) {
    state.customContexts = (state.customContexts || []).filter((c) => c.id !== id);
    delete state.contexts[id];
    save();
  }

  function isContextActive(id) {
    return !!state.contexts[id]?.active;
  }

  function toggleContext(id, active) {
    state.contexts[id] = { ...(state.contexts[id] || {}), active };
    save();
  }

  function setContextField(id, field, value) {
    state.contexts[id] = { ...(state.contexts[id] || {}), [field]: value };
    save();
  }

  function weekKey(week) {
    return week.toISOString().slice(0, 10);
  }

  function doneKey(childId, week, areaId) {
    return `${childId}:${weekKey(week)}:${areaId}`;
  }

  function isDone(childId, week, areaId) {
    return !!state.done[doneKey(childId, week, areaId)];
  }

  function toggleDone(childId, week, areaId) {
    const k = doneKey(childId, week, areaId);
    if (state.done[k]) delete state.done[k];
    else state.done[k] = true;
    save();
  }

  function weekProgress(childId, week, areaIds) {
    const total = areaIds.length;
    const done = areaIds.filter((a) => isDone(childId, week, a)).length;
    return { done, total, pct: total ? Math.round((done / total) * 100) : 0 };
  }

  function sheetKey(childId, week) {
    return `${childId}:${weekKey(week)}`;
  }

  function getSheetBest(childId, week) {
    return state.sheets[sheetKey(childId, week)] || null;
  }

  function saveSheetResult(childId, week, stars, total) {
    const k = sheetKey(childId, week);
    const prev = state.sheets[k];
    if (!prev || stars > prev.stars) {
      state.sheets[k] = { stars, total, at: new Date().toISOString() };
      save();
    }
  }

  // --- adaptive skill levels (0..2) -----------------------------------------
  // Two perfect questions in a row level a skill up; two misses level it down.
  function skillLevel(childId, key) {
    const rec = state.skills[`${childId}:${key}`];
    return rec ? rec.lv : 0;
  }

  function skillReport(childId, key, perfect) {
    const k = `${childId}:${key}`;
    const rec = state.skills[k] || { lv: 0, up: 0, down: 0 };
    if (perfect) {
      rec.up += 1;
      rec.down = 0;
      if (rec.up >= 2) { rec.lv = Math.min(2, rec.lv + 1); rec.up = 0; }
    } else {
      rec.up = 0;
      rec.down += 1;
      if (rec.down >= 2) { rec.lv = Math.max(0, rec.lv - 1); rec.down = 0; }
    }
    state.skills[k] = rec;
    save();
  }

  // The skill-level snapshot the worksheet generator keys off (deterministic
  // for a given store state — pass the SAME object when recomputing a sheet).
  function sheetSkills(childId) {
    // Local adaptive records win; the committed family.json printSkills only
    // fill the gap on a state-less run (the nightly print).
    const cfg = (printConfig && printConfig.printSkills && printConfig.printSkills[childId]) || {};
    const lv = (key) => {
      const rec = state.skills[`${childId}:${key}`];
      if (rec) return rec.lv;
      const v = cfg[key];
      return typeof v === "number" ? Math.max(0, Math.min(2, v)) : 0;
    };
    return { add: lv("add"), sub: lv("sub") };
  }

  // --- skill mastery (curriculum Learn surface) ------------------------------
  function getSkillMastery(childId, skillId) {
    return state.mastery[`${childId}:${skillId}`] || null;
  }
  function recordSkillResult(childId, skillId, stars, total) {
    const k = `${childId}:${skillId}`;
    const prev = state.mastery[k] || { attempts: 0, bestStars: 0, total, mastered: false };
    const bestStars = Math.max(prev.bestStars || 0, stars);
    const mastered = prev.mastered || (total > 0 && stars / total >= 0.8);
    state.mastery[k] = { attempts: (prev.attempts || 0) + 1, bestStars, total, mastered, at: new Date().toISOString() };
    save();
    return state.mastery[k];
  }
  // --- school term calendar (from family.json schoolTerms) --------------------
  // Which QLD school term + week a date falls in, or null in the holidays.
  // Week 1 starts the Monday of the term's first week.
  function schoolTerm(onDate) {
    const terms = (printConfig && printConfig.schoolTerms) || [];
    const ref = onDate ? new Date(onDate) : new Date();
    ref.setHours(12, 0, 0, 0);
    for (const t of terms) {
      const start = new Date(`${t.start}T12:00:00`);
      const end = new Date(`${t.end}T12:00:00`);
      if (ref < start || ref > end) continue;
      const mon = (d) => { const x = new Date(d); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); x.setHours(12, 0, 0, 0); return x; };
      const week = Math.floor((mon(ref) - mon(start)) / (7 * 24 * 3600 * 1000)) + 1;
      return { term: t.term, week };
    }
    return null;
  }

  // --- spaced repetition ------------------------------------------------------
  // Mastery fades: a mastered skill is due for a refresh after 14 days, an
  // attempted-but-unmastered one after 3. Practising again (recordSkillResult)
  // re-stamps `at`, so working the queue clears it. Deterministic given
  // (state, onDate); onDate defaults to now.
  const REVIEW_MASTERED_DAYS = 14;
  const REVIEW_SHAKY_DAYS = 3;

  function reviewStatus(childId, skillId, onDate) {
    const m = state.mastery[`${childId}:${skillId}`];
    if (!m || !m.at) return null; // never attempted - it's "new", not "due"
    const ref = onDate ? new Date(onDate) : new Date();
    const days = Math.floor((ref - new Date(m.at)) / 86400000);
    if (m.mastered) return { due: days >= REVIEW_MASTERED_DAYS, kind: "refresh", days };
    return { due: days >= REVIEW_SHAKY_DAYS, kind: "almost", days };
  }

  // Skills due for review, shakiest first (unmastered before mastered),
  // then stalest first within each group.
  function reviewQueue(childId, skillIds, onDate) {
    const out = [];
    for (const id of skillIds) {
      const r = reviewStatus(childId, id, onDate);
      if (r && r.due) out.push({ skillId: id, kind: r.kind, days: r.days });
    }
    out.sort((a, b) =>
      a.kind === b.kind ? b.days - a.days : a.kind === "almost" ? -1 : 1
    );
    return out;
  }

  function masterySummary(childId, skillIds) {
    let mastered = 0, started = 0;
    for (const id of skillIds) {
      const m = state.mastery[`${childId}:${id}`];
      if (m) { started++; if (m.mastered) mastered++; }
    }
    return { mastered, started, total: skillIds.length };
  }

  function setSetting(key, value) {
    state.settings[key] = value;
    save();
  }

  function getSetting(key) {
    return state.settings[key];
  }

  function resetAll() {
    state = defaults();
    save();
  }

  window.SPARK_STORE = {
    applyConfig,
    schoolTerm,
    activeContexts,
    customContexts,
    addCustomContext,
    removeCustomContext,
    isContextActive,
    toggleContext,
    setContextField,
    isDone,
    toggleDone,
    weekProgress,
    getSheetBest,
    saveSheetResult,
    skillLevel,
    skillReport,
    sheetSkills,
    getSkillMastery,
    recordSkillResult,
    masterySummary,
    reviewStatus,
    reviewQueue,
    setSetting,
    getSetting,
    resetAll,
    weekKey,
  };
})();
