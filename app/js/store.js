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
    setSetting,
    getSetting,
    resetAll,
    weekKey,
  };
})();
