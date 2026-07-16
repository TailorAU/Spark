/*
 * Spark — tailoring engine
 * Turns (child + week + active life contexts) into a concrete weekly plan:
 * a curriculum focus per learning area, each woven with what the family is
 * actually doing. Fully deterministic and offline. Optionally enriched by the
 * live Spark PLG API (see engine.enrichActivity).
 */
(function () {
  "use strict";
  const D = window.SPARK_DATA;

  // --- dates -----------------------------------------------------------------
  function ageOn(dobStr, onDate) {
    const dob = new Date(dobStr);
    let years = onDate.getFullYear() - dob.getFullYear();
    const m = onDate.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && onDate.getDate() < dob.getDate())) years--;
    const months =
      (onDate.getFullYear() - dob.getFullYear()) * 12 +
      (onDate.getMonth() - dob.getMonth()) -
      (onDate.getDate() < dob.getDate() ? 1 : 0);
    return { years, months };
  }

  // Monday of the week containing `d`.
  function weekStart(d) {
    const x = new Date(d);
    const day = (x.getDay() + 6) % 7; // 0 = Monday
    x.setDate(x.getDate() - day);
    x.setHours(0, 0, 0, 0);
    return x;
  }

  function fmtWeek(monday) {
    const end = new Date(monday);
    end.setDate(end.getDate() + 6);
    const opt = { day: "numeric", month: "short" };
    return `${monday.toLocaleDateString("en-AU", opt)} – ${end.toLocaleDateString("en-AU", opt)}`;
  }

  // ISO-week index used to rotate curriculum foci deterministically across the year.
  function weekIndex(monday) {
    const jan1 = new Date(monday.getFullYear(), 0, 1);
    return Math.floor((monday - jan1) / (7 * 24 * 3600 * 1000));
  }

  function addWeeks(monday, n) {
    const x = new Date(monday);
    x.setDate(x.getDate() + n * 7);
    return x;
  }

  // --- curriculum mapping ----------------------------------------------------
  // For a given child + week, pick one strand focus per area by rotating the
  // strand list with the week index. This is the "map every week against the
  // curriculum" spine.
  function weekFocus(child, monday) {
    const fw = D.FRAMEWORKS[child.framework];
    if (!fw) return []; // unknown framework degrades to an empty focus list, never a throw
    const wi = weekIndex(monday);
    return fw.areas.map((area) => ({
      areaId: area.id,
      area: area.label,
      strand: area.strands[wi % area.strands.length],
    }));
  }

  // The full-year map: 40 school weeks of foci per area.
  function yearMap(child, fromMonday, weeks) {
    const out = [];
    for (let i = 0; i < weeks; i++) {
      const wk = addWeeks(fromMonday, i);
      out.push({ week: wk, label: fmtWeek(wk), focus: weekFocus(child, wk) });
    }
    return out;
  }

  // --- tailoring -------------------------------------------------------------
  // Given a focus (area+strand) and the active contexts for this child, produce
  // a tailored activity. When several contexts can cover an area, spread them
  // across the week (by area index) so a week mixes e.g. Fiji and camping rather
  // than one context dominating. Falls back to a clean curriculum activity.
  function tailorActivity(child, focus, contexts, index) {
    const byStrand = weaveKeyForStrand(focus.strand, child.framework);
    const matches = contexts
      .map((ctx) => {
        const w = (byStrand && ctx.weave[byStrand]) || ctx.weave[focus.areaId] || null;
        return w ? { ctx, w } : null;
      })
      .filter(Boolean);
    if (matches.length) {
      const pick = matches[(index || 0) % matches.length];
      return {
        text: pick.w,
        tailoredBy: pick.ctx.id,
        tailoredLabel: pick.ctx.label,
        emoji: pick.ctx.emoji,
      };
    }
    return { text: baseActivity(child, focus), tailoredBy: null };
  }

  // Map a strand label to the finer weave keys used in the context library.
  // Only for the school framework (acv9): the finer "writing"/"measurement"
  // weaves are Year-1 tasks, and EYLF/QKLG strands like "Early mark-making &
  // writing" must fall through to their own age-appropriate areaId weave
  // instead of handing a toddler "write 3 sentences".
  function weaveKeyForStrand(strand, framework) {
    if (framework !== "acv9") return null;
    const s = strand.toLowerCase();
    if (s.includes("writing") || s.includes("recount") || s.includes("mark-making")) return "writing";
    if (s.includes("measurement") || s.includes("time")) return "measurement";
    return null;
  }

  // A plain, framework-appropriate activity when no life context applies.
  function baseActivity(child, focus) {
    const stage = child.stage;
    const templates = {
      year1: `Practise ${focus.strand.toLowerCase()} for 10 minutes with a real example from around the house.`,
      kindy: `Play-based ${focus.strand.toLowerCase()}: follow ${child.name}'s lead for 10–15 minutes.`,
      eylf: `Gentle ${focus.strand.toLowerCase()} through everyday play — no worksheet, just together time.`,
    };
    return templates[stage] || templates.eylf;
  }

  // The plan for one child this week: focus per area + a tailored activity each,
  // plus any relevant "spotlight" (e.g. cross-country session).
  function planForChild(child, monday, activeContexts) {
    const contexts = activeContexts.filter((c) => appliesTo(c, child));
    const focus = weekFocus(child, monday);
    const items = focus.map((f, idx) => ({
      ...f,
      activity: tailorActivity(child, f, contexts, idx),
    }));
    return {
      child,
      week: monday,
      weekLabel: fmtWeek(monday),
      contexts,
      items,
      tailoredCount: items.filter((i) => i.activity.tailoredBy).length,
      spotlight: spotlightFor(child, contexts, monday),
    };
  }

  function appliesTo(ctx, child) {
    if (ctx.childScope === "all" || !ctx.childScope) return true;
    return Array.isArray(ctx.childScope) && ctx.childScope.includes(child.id);
  }

  // Cross-country training spotlight for the eldest when the context is active and
  // a race date is set.
  function spotlightFor(child, contexts, monday) {
    const cc = contexts.find((c) => c.id === "crosscountry");
    if (!cc || !cc.raceDate) return null;
    const race = weekStart(new Date(cc.raceDate));
    const weeksOut = Math.round((race - monday) / (7 * 24 * 3600 * 1000));
    const plan = D.CROSS_COUNTRY_PLAN.find((p) => p.wk === weeksOut);
    if (!plan) return null;
    return {
      kind: "crosscountry",
      title: `Cross country — ${weeksOut} week${weeksOut === 1 ? "" : "s"} to go`,
      focus: plan.focus,
      sessions: plan.sessions,
      raceDate: cc.raceDate,
    };
  }

  // --- optional live enrichment (progressive enhancement) --------------------
  // Calls the extracted Spark PLG worksheet endpoint if a base URL is set. The
  // app is fully functional without it; this just swaps in fresh LLM activities.
  async function enrichActivity(baseUrl, child, focus, hobby) {
    if (!baseUrl) return null;
    const areaSubject = {
      english: "English", maths: "Maths", science: "Science", hass: "HASS",
      hpe: "Health & PE", arts: "The Arts", tech: "DigiTech",
    };
    try {
      const res = await fetch(baseUrl.replace(/\/$/, "") + "/api/spark/plg-worksheet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gradeName: D.STAGE_LABEL[child.stage] || "Foundation",
          framework: D.FRAMEWORKS[child.framework].label,
          topicTitle: focus.strand,
          topicSubject: areaSubject[focus.areaId] || focus.area,
          hobby: hobby || "everyday play",
        }),
      });
      if (!res.ok) return null;
      const data = await res.json();
      return data.activities || null;
    } catch (_) {
      return null;
    }
  }

  window.SPARK_ENGINE = {
    ageOn,
    weekStart,
    fmtWeek,
    addWeeks,
    weekFocus,
    yearMap,
    planForChild,
    appliesTo,
    enrichActivity,
  };
})();
