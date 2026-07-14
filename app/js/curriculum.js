/*
 * Spark — curriculum engine (SPARK_LEARN)
 * Loads the validated, PII-free corpus (content.json) and exposes each child's
 * skill map plus practice sets, adapting corpus questions into the shape the
 * worksheet player renders. The corpus is generic per stage (eldest/middle/
 * youngest) — the child's real name comes from the encrypted vault, not here.
 */
(function () {
  "use strict";

  const THEME = "everyday"; // neutral animated scene for Learn practice
  let corpus = null, loadPromise = null;

  function load() {
    if (!loadPromise) {
      loadPromise = fetch("./content.json", { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : null))
        .then((c) => { corpus = c; return c; })
        .catch(() => null);
    }
    return loadPromise;
  }

  function shuffle(a) {
    const x = a.slice();
    for (let i = x.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [x[i], x[j]] = [x[j], x[i]];
    }
    return x;
  }

  function picHtml(pic) {
    const ART = window.SPARK_ART;
    const inner = ART && ART.has(pic) ? ART.sprite(pic, 84) : `<span class="ws-pic-emoji">${pic}</span>`;
    return `<div class="ws-pic">${inner}</div>`;
  }

  function buildTiles(word) {
    const pool = "BDGKMOPRSTU".split("").filter((c) => !word.includes(c));
    const distract = shuffle(pool).slice(0, 2);
    return shuffle(word.split("").concat(distract));
  }

  // Corpus question -> player-ready question.
  function toPlayer(q) {
    const base = { kind: q.kind, prompt: q.prompt, hint: q.hint, explanation: q.explanation, theme: THEME };
    if (q.pic) base.visual = picHtml(q.pic);
    if (q.kind === "choice") return { ...base, options: q.options.map((o) => ({ label: o.label, correct: !!o.correct })) };
    if (q.kind === "tapall") return { ...base, items: q.items.map((i) => ({ label: i.label, match: !!i.match })), countMode: !!q.countMode };
    if (q.kind === "build") return { ...base, word: q.word, tiles: buildTiles(q.word), visual: base.visual };
    if (q.kind === "sort") return { ...base, buckets: q.buckets.slice(), items: q.sortItems.map((i) => ({ label: i.label, name: i.name, bucket: i.bucket })) };
    return base;
  }

  function childBlock(childId) {
    return corpus && corpus.children ? corpus.children[childId] : null;
  }

  // The skill map for a child: areas -> skills (metadata only).
  function childAreas(childId) {
    const c = childBlock(childId);
    if (!c) return [];
    return c.areas.map((a) => ({
      areaId: a.areaId, areaLabel: a.areaLabel,
      skills: a.skills.map((s) => ({
        skillId: s.skillId, title: s.title, milestone: s.milestone,
        curriculumCode: s.curriculumCode, questionCount: (s.questions || []).length,
      })),
    }));
  }

  function findSkill(childId, skillId) {
    const c = childBlock(childId);
    if (!c) return null;
    for (const a of c.areas) for (const s of a.skills) if (s.skillId === skillId) return { area: a, skill: s };
    return null;
  }

  // A practice set: the lesson + player-ready questions (graduated by difficulty).
  function practice(childId, skillId) {
    const hit = findSkill(childId, skillId);
    if (!hit) return null;
    const s = hit.skill;
    const qs = (s.questions || []).slice().sort((a, b) => (a.difficulty || 1) - (b.difficulty || 1)).map(toPlayer);
    return {
      skillId: s.skillId,
      lesson: {
        title: s.title, intro: s.lessonIntro, example: s.workedExample,
        parentNote: s.parentNote, milestone: s.milestone, curriculumCode: s.curriculumCode,
        area: hit.area.areaLabel,
      },
      questions: qs,
    };
  }

  window.SPARK_LEARN = {
    ready: load,
    childAreas,
    practice,
    has: () => !!corpus,
  };
})();
