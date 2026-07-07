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

  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch (_) {}
  }

  // Merge stored context flags/fields onto the library so the engine gets a
  // single list of "active" context objects.
  function activeContexts() {
    return D.CONTEXT_LIBRARY.filter((c) => state.contexts[c.id]?.active).map((c) => ({
      ...c,
      ...state.contexts[c.id],
    }));
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
    return { add: skillLevel(childId, "add"), sub: skillLevel(childId, "sub") };
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
    activeContexts,
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
    setSetting,
    getSetting,
    resetAll,
    weekKey,
  };
})();
