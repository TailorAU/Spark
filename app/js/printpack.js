/*
 * Spark — printable worksheet pack (SPARK_PRINT)
 * Generates a pen-and-paper A4 page per child: handwriting guide-lines,
 * trace-the-word rows, sums with answer boxes (at the child's current
 * adaptive level), draw-the-hands clocks, count-and-circle rows, pattern
 * boxes, pre-writing strokes and colouring outlines for the toddler.
 * Date-seeded so every day prints a fresh pack; themed by the week's active
 * life events — the same tailoring spine as the on-screen worksheets.
 */
(function () {
  "use strict";

  const esc = (s) =>
    String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  // seeded rng (same family as worksheets.js)
  function hash(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  function rng(seed) {
    let a = hash(seed) || 1;
    return function () {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const pick = (r, arr) => arr[Math.floor(r() * arr.length)];
  function shuffle(r, arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  }
  const range = (n) => Array.from({ length: n }, (_, i) => i);

  const THEME_WORDS = {
    fiji: { label: "Fiji adventure", words: ["FISH", "SAND", "BOAT", "SHELL"], things: ["shell", "fish", "boat", "hibiscus", "coconut"] },
    camping: { label: "Camping trip", words: ["TENT", "STAR", "CAMP", "FIRE"], things: ["marshmallow", "star", "pine", "boot", "tent"] },
    crosscountry: { label: "Race day", words: ["RACE", "FAST", "JUMP", "TEAM"], things: ["shoe", "medal", "flag", "stopwatch", "drop"] },
    everyday: { label: "Home adventure", words: ["PLAY", "BOOK", "HOME", "STAR"], things: ["apple", "teddy", "book", "ball", "sock"] },
  };

  const art = (name, px) => {
    const ART = window.SPARK_ART;
    return ART && ART.has(name) ? ART.sprite(name, px || 40) : `<span style="font-size:${(px || 40) * 0.8}px">${esc(name)}</span>`;
  };

  // Handwriting guide-lines (Foundation style: solid top/bottom, dashed middle).
  const hwLines = (n) => range(n || 1).map(() => `<div class="pp-hw"></div>`).join("");
  const traceWord = (word, times) =>
    `<div class="pp-trace">${range(times || 3).map(() => `<span>${esc(word)}</span>`).join("")}</div>`;

  // A blank analogue clock to draw hands on.
  function blankClock(labelText) {
    const marks = range(12).map((i) => {
      const a = (i * 30 * Math.PI) / 180;
      const x = 60 + Math.sin(a) * 46, y = 60 - Math.cos(a) * 46;
      const num = i === 0 ? 12 : i;
      return `<text x="${x}" y="${y + 4}" font-size="11" text-anchor="middle" fill="#333">${num}</text>`;
    }).join("");
    return `<div class="pp-clockwrap"><svg class="pp-clock" viewBox="0 0 120 120">
      <circle cx="60" cy="60" r="56" fill="none" stroke="#333" stroke-width="2.5"/>${marks}
      <circle cx="60" cy="60" r="3" fill="#333"/></svg>
      <div class="pp-clock-label">${esc(labelText)}</div></div>`;
  }

  // Simple colouring outlines (thick strokes, no fill) for the toddler page.
  const OUTLINES = {
    star: `<svg viewBox="0 0 64 64"><path d="M32 6 L39.6 22.8 L58 24.8 L44.4 37.2 L48.4 55.4 L32 45.8 L15.6 55.4 L19.6 37.2 L6 24.8 L24.4 22.8 Z" fill="none" stroke="#333" stroke-width="2.5" stroke-linejoin="round"/></svg>`,
    fish: `<svg viewBox="0 0 64 64"><path d="M8 32 L20 22 L20 42 Z M20 32 a17 12 0 1 0 34 0 a17 12 0 1 0 -34 0" fill="none" stroke="#333" stroke-width="2.5"/><circle cx="45" cy="29" r="2.5" fill="#333"/></svg>`,
    boat: `<svg viewBox="0 0 64 64"><path d="M10 42 L54 42 L46 54 L18 54 Z M32 10 L32 42 M32 12 L50 38 L32 38 Z M30 16 L16 38 L30 38 Z" fill="none" stroke="#333" stroke-width="2.5" stroke-linejoin="round"/></svg>`,
    tent: `<svg viewBox="0 0 64 64"><path d="M32 10 L58 52 L6 52 Z M32 30 L40 52 L24 52 Z" fill="none" stroke="#333" stroke-width="2.5" stroke-linejoin="round"/></svg>`,
    apple: `<svg viewBox="0 0 64 64"><path d="M32 20 C20 12 8 22 12 38 C15 50 24 58 32 56 C40 58 49 50 52 38 C56 22 44 12 32 20 Z M32 18 Q34 10 40 8" fill="none" stroke="#333" stroke-width="2.5"/></svg>`,
  };

  // Pre-writing stroke paths to trace (dashed).
  const STROKES = {
    wave: "M4 20 Q14 4 24 20 T44 20 T64 20 T84 20 T104 20 T124 20 T144 20 T164 20",
    zigzag: "M4 30 L20 8 L36 30 L52 8 L68 30 L84 8 L100 30 L116 8 L132 30 L148 8 L164 30",
    loops: "M4 24 Q12 2 20 24 Q28 46 36 24 Q44 2 52 24 Q60 46 68 24 Q76 2 84 24 Q92 46 100 24 Q108 2 116 24 Q124 46 132 24",
  };
  const strokeRow = (name) =>
    `<svg class="pp-stroke" viewBox="0 0 168 40" preserveAspectRatio="none"><path d="${STROKES[name]}" fill="none" stroke="#999" stroke-width="2" stroke-dasharray="5 5" stroke-linecap="round"/></svg>`;

  const sumRow = (a, op, b) =>
    `<div class="pp-sum"><span>${a} ${op} ${b} =</span><span class="pp-box"></span></div>`;

  // Today's schedule: school/kindy, today's tailored learning focuses, the
  // cross-country session for this exact day, plus write-in rows.
  function scheduleSec(child, date, plan) {
    const dow = date.getDay(); // 0 Sun .. 6 Sat
    const weekday = dow >= 1 && dow <= 5;
    const settingLine = weekday
      ? { year1: "School day", kindy: "Kindy day", eylf: "Day care / home play" }[child.stage]
      : "Weekend — family day";
    const rows = [];
    rows.push(`<div class="pp-todo"><span class="pp-cb"></span>${esc(settingLine)}</div>`);
    // Two of today's tailored plan activities, rotating through the week.
    const items = (plan && plan.items) || [];
    if (items.length) {
      for (let k = 0; k < 2; k++) {
        const it = items[(dow * 2 + k) % items.length];
        const txt = it.activity.text.length > 110 ? it.activity.text.slice(0, 107) + "…" : it.activity.text;
        rows.push(`<div class="pp-todo"><span class="pp-cb"></span><b>${esc(it.area)}:</b>&nbsp;${esc(txt)}</div>`);
      }
    }
    // Cross-country session for this day (sessions are Mon..Fri).
    if (plan && plan.spotlight && dow >= 1 && dow <= 5) {
      const sess = plan.spotlight.sessions[dow - 1];
      if (sess) rows.push(`<div class="pp-todo"><span class="pp-cb"></span><b>Training:</b>&nbsp;${esc(sess)}</div>`);
    }
    rows.push(`<div class="pp-todo"><span class="pp-cb"></span>This worksheet!</div>`);
    rows.push(`<div class="pp-todo write"><span class="pp-cb"></span><span class="pp-writein"></span></div>`);
    rows.push(`<div class="pp-todo write"><span class="pp-cb"></span><span class="pp-writein"></span></div>`);
    return sec("Today's plan — tick them off!", `<div class="pp-todos">${rows.join("")}</div>`);
  }

  function head(child, dateLabel, themeLabel) {
    return `<div class="pp-head">
      <div class="pp-brand"><span class="pp-dot"></span> Spark</div>
      <div class="pp-title">${esc(child.name)}'s worksheet</div>
      <div class="pp-meta">${esc(dateLabel)} · ${esc(themeLabel)} · ${esc(child.schoolType || "")}</div>
      <div class="pp-namedate"><span>Name: <i>${esc(child.name)}</i></span><span>Date: ______________</span></div>
    </div>`;
  }
  const sec = (title, inner, note) =>
    `<div class="pp-sec"><div class="pp-sec-h">${esc(title)}${note ? `<span class="pp-note">${esc(note)}</span>` : ""}</div>${inner}</div>`;

  // ---- per-child pages -------------------------------------------------------

  function pageEldest(child, r, theme, skills, dateLabel, sched) {
    const w1 = pick(r, theme.words), w2 = pick(r, theme.words.filter((w) => w !== w1));
    const addLv = (skills && skills.add) || 0, subLv = (skills && skills.sub) || 0;
    const sums = [];
    for (let i = 0; i < 3; i++) {
      const a = [2 + Math.floor(r() * 5), 4 + Math.floor(r() * 8), 7 + Math.floor(r() * 6)][addLv];
      const b = [1 + Math.floor(r() * 4), 2 + Math.floor(r() * 7), 5 + Math.floor(r() * 4)][addLv];
      sums.push(sumRow(a, "+", b));
    }
    for (let i = 0; i < 3; i++) {
      const c = [5 + Math.floor(r() * 5), 9 + Math.floor(r() * 8), 12 + Math.floor(r() * 7)][subLv];
      const d = [1 + Math.floor(r() * 4), 2 + Math.floor(r() * 6), 5 + Math.floor(r() * 5)][subLv];
      sums.push(sumRow(c, "−", d));
    }
    const seqStart = 10 + Math.floor(r() * 80);
    const seqStart2 = 10 + Math.floor(r() * 80);
    const hour = 1 + Math.floor(r() * 11);
    const half = r() > 0.5;
    return `<div class="pp-page">
      ${head(child, dateLabel, theme.label)}
      ${sched}
      ${sec("Handwriting — trace, then write your own", traceWord(w1) + hwLines(1) + traceWord(w2) + hwLines(1))}
      ${sec("Write a sentence", `<div class="pp-prompt">Write a sentence about the ${esc(theme.label.toLowerCase())}. Remember your capital letter and full stop!</div>` + hwLines(2))}
      ${sec("Maths — write the answers in the boxes", `<div class="pp-sumgrid">${sums.join("")}</div>
        <div class="pp-seq">Fill in the missing numbers:&nbsp; <b>${seqStart}</b>, ${seqStart + 1}, <span class="pp-box sm"></span>, ${seqStart + 3} &nbsp;&nbsp;·&nbsp;&nbsp; <b>${seqStart2}</b>, <span class="pp-box sm"></span>, ${seqStart2 + 2}, <span class="pp-box sm"></span></div>`)}
      ${sec("Time — draw the hands", `<div class="pp-clockrow">${blankClock(`${half ? `half past ${hour}` : `${hour} o'clock`}`)}<div class="pp-clock-side">Draw the hour hand (short) and minute hand (long). The long hand points ${half ? "down to 6" : "up to 12"}.</div></div>`)}
      <div class="pp-foot">Spark · tailored for ${esc(child.name)} · ${esc(dateLabel)}</div>
    </div>`;
  }

  function pageMiddle(child, r, theme, dateLabel, sched) {
    const w = pick(r, theme.words);
    const letters = [...new Set([w[0], pick(r, "ABMST".split("")), child.name[0].toUpperCase()])].slice(0, 3);
    const rows = letters.map((L) => traceWord((L + " ").repeat(6).trim(), 1)).join("");
    const countRows = range(2).map(() => {
      const n = 4 + Math.floor(r() * 4);
      const total = n + 2 + Math.floor(r() * 2);
      const item = pick(r, theme.things);
      return `<div class="pp-count"><span class="pp-count-ask">Circle <b>${n}</b>:</span><span class="pp-count-items">${range(total).map(() => art(item, 34)).join("")}</span></div>`;
    }).join("");
    const pat = shuffle(r, theme.things).slice(0, 2);
    const patternRow = `<div class="pp-pattern">${[0, 1, 0, 1, 0].map((i) => art(pat[i], 36)).join("")}<span class="pp-box draw"></span></div>`;
    const rhymes = shuffle(r, [["CAT", "HAT"], ["STAR", "CAR"], ["BELL", "SHELL"]]);
    const left = rhymes.map((p) => p[0]), right = shuffle(r, rhymes.map((p) => p[1]));
    const match = `<div class="pp-match"><div>${left.map((x) => `<div class="pp-match-w">${x} ●</div>`).join("")}</div><div>${right.map((x) => `<div class="pp-match-w">● ${x}</div>`).join("")}</div></div>`;
    return `<div class="pp-page">
      ${head(child, dateLabel, theme.label)}
      ${sched}
      ${sec("Trace the letters", rows + hwLines(1), "then try a row of your own")}
      ${sec("Trace your name", traceWord(child.name, 2) + hwLines(1))}
      ${sec("Count and circle", countRows)}
      ${sec("What comes next? Draw it in the box", patternRow)}
      ${sec("Draw a line between the rhyming words", match)}
      <div class="pp-foot">Spark · tailored for ${esc(child.name)} · ${esc(dateLabel)}</div>
    </div>`;
  }

  function pageYoungest(child, r, theme, dateLabel, sched) {
    const outlineNames = shuffle(r, Object.keys(OUTLINES)).slice(0, 2);
    const colouring = `<div class="pp-colour">${outlineNames.map((n) => `<div class="pp-colour-item">${OUTLINES[n]}</div>`).join("")}</div>`;
    const strokes = ["wave", "zigzag"].map((s) => strokeRow(s)).join("");
    const initial = child.name[0].toUpperCase();
    const dots = range(3).map((i) => {
      const n = i + 1;
      const item = pick(r, theme.things);
      return `<div class="pp-count"><span class="pp-count-ask">Count: <b>${n}</b></span><span class="pp-count-items">${range(n).map(() => art(item, 40)).join("")}</span></div>`;
    }).join("");
    return `<div class="pp-page">
      ${head(child, dateLabel, theme.label)}
      ${sched}
      ${sec("Trace the lines with your finger, then a crayon", strokes)}
      ${sec(`The letter ${initial} — trace it big!`, `<div class="pp-biginitial">${initial}</div>`)}
      ${sec("Point and count together", dots)}
      ${sec("Colour me in!", colouring)}
      <div class="pp-foot">Spark · tailored for ${esc(child.name)} · ${esc(dateLabel)}</div>
    </div>`;
  }

  // ---- pack ------------------------------------------------------------------
  function render(dateStr) {
    const D = window.SPARK_DATA, S = window.SPARK_STORE;
    const date = dateStr ? new Date(dateStr + "T12:00:00") : new Date();
    const dayKey = date.toISOString().slice(0, 10);
    const dateLabel = date.toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long" });
    const active = S.activeContexts();
    const pages = (D.CHILDREN || []).map((child) => {
      const mine = active.filter((c) => c.childScope === "all" || !c.childScope || (Array.isArray(c.childScope) && c.childScope.includes(child.id)));
      const themeId = mine.length ? pick(rng(`theme:${child.id}:${dayKey}`), mine).id : "everyday";
      const theme = THEME_WORDS[themeId] || THEME_WORDS.everyday;
      const r = rng(`print:${child.id}:${dayKey}`);
      const E = window.SPARK_ENGINE;
      const plan = E ? E.planForChild(child, E.weekStart(date), active) : null;
      const sched = scheduleSec(child, date, plan);
      if (child.stage === "year1") return pageEldest(child, r, theme, S.sheetSkills(child.id), dateLabel, sched);
      if (child.stage === "kindy") return pageMiddle(child, r, theme, dateLabel, sched);
      return pageYoungest(child, r, theme, dateLabel, sched);
    });
    return `<div class="pp-pack">${pages.join("")}</div>`;
  }

  window.SPARK_PRINT = { render };
})();
