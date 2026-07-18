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

  // ---- seeded puzzles (all deterministic: same rng stream = same puzzle) -----

  // Perfect maze via seeded depth-first search; drawn as SVG wall segments
  // with an arrow in at the top-left and out at the bottom-right.
  function mazeSvg(r, cols, rows, px) {
    const right = [], bottom = [];
    for (let i = 0; i < cols * rows; i++) { right[i] = true; bottom[i] = true; }
    const seen = new Array(cols * rows).fill(false);
    const stack = [0];
    seen[0] = true;
    while (stack.length) {
      const cur = stack[stack.length - 1];
      const cx = cur % cols, cy = Math.floor(cur / cols);
      const opts = [];
      if (cx > 0 && !seen[cur - 1]) opts.push([cur - 1, "L"]);
      if (cx < cols - 1 && !seen[cur + 1]) opts.push([cur + 1, "R"]);
      if (cy > 0 && !seen[cur - cols]) opts.push([cur - cols, "U"]);
      if (cy < rows - 1 && !seen[cur + cols]) opts.push([cur + cols, "D"]);
      if (!opts.length) { stack.pop(); continue; }
      const [nxt, dir] = opts[Math.floor(r() * opts.length)];
      if (dir === "R") right[cur] = false;
      if (dir === "L") right[nxt] = false;
      if (dir === "D") bottom[cur] = false;
      if (dir === "U") bottom[nxt] = false;
      seen[nxt] = true;
      stack.push(nxt);
    }
    const C = 16, P = 4, W = cols * C + P * 2, H = rows * C + P * 2;
    const seg = [];
    // outer border, leaving the entrance (top of first cell) and exit open
    seg.push(`M${P + C} ${P} L${P + cols * C} ${P}`); // top minus entrance
    seg.push(`M${P} ${P} L${P} ${P + rows * C}`); // left
    seg.push(`M${P + cols * C} ${P} L${P + cols * C} ${P + rows * C}`); // right
    seg.push(`M${P} ${P + rows * C} L${P + (cols - 1) * C} ${P + rows * C}`); // bottom minus exit
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const i = y * cols + x;
        if (right[i] && x < cols - 1) seg.push(`M${P + (x + 1) * C} ${P + y * C} L${P + (x + 1) * C} ${P + (y + 1) * C}`);
        if (bottom[i] && y < rows - 1) seg.push(`M${P + x * C} ${P + (y + 1) * C} L${P + (x + 1) * C} ${P + (y + 1) * C}`);
      }
    }
    return `<svg class="pp-maze" viewBox="0 0 ${W} ${H}" style="height:${px}px">
      <path d="${seg.join(" ")}" fill="none" stroke="#333" stroke-width="2.4" stroke-linecap="round"/>
      <text x="${P + C / 2}" y="${P - 0.5}" font-size="8" text-anchor="middle" fill="#333">▼</text>
      <text x="${P + (cols - 0.5) * C}" y="${H - 0.2}" font-size="8" text-anchor="middle" fill="#333">▼</text>
    </svg>`;
  }

  // Numbered dot-to-dot outlines (hand-plotted, connect 1..N then back to 1).
  const DOT_SHAPES = {
    star: [[50, 4], [61, 34], [93, 34], [67, 53], [77, 84], [50, 65], [23, 84], [33, 53], [7, 34], [39, 34]],
    boat: [[10, 55], [90, 55], [78, 72], [22, 72], [10, 55], [50, 55], [50, 10], [78, 48], [50, 48]],
    fish: [[12, 42], [30, 26], [58, 20], [78, 30], [88, 42], [78, 54], [58, 64], [30, 58], [12, 42], [4, 28], [4, 56]],
    house: [[15, 45], [50, 12], [85, 45], [75, 45], [75, 82], [25, 82], [25, 45]],
  };
  function dotToDotSvg(r, shapeNames, px) {
    const name = pick(r, shapeNames);
    const pts = DOT_SHAPES[name];
    const dots = pts.map(([x, y], i) =>
      `<circle cx="${x}" cy="${y}" r="${i === 0 ? 2.6 : 1.9}" fill="${i === 0 ? "#e8833a" : "#333"}"/>
       <text x="${x + 4}" y="${y - 3}" font-size="7" fill="#333">${i + 1}</text>`
    ).join("");
    return `<svg class="pp-dots" viewBox="0 0 100 90" style="height:${px}px">${dots}</svg>`;
  }

  // Seeded word search: theme words hidden right/down/diagonal in a grid.
  function wordSearch(r, words, size) {
    const grid = Array.from({ length: size }, () => new Array(size).fill(null));
    const DIRS = [[1, 0], [0, 1], [1, 1]];
    for (const word of words) {
      let placed = false;
      for (let t = 0; t < 60 && !placed; t++) {
        const [dx, dy] = DIRS[Math.floor(r() * DIRS.length)];
        const x0 = Math.floor(r() * (size - (word.length - 1) * dx));
        const y0 = Math.floor(r() * (size - (word.length - 1) * dy));
        let ok = true;
        for (let i = 0; i < word.length; i++) {
          const cur = grid[y0 + i * dy][x0 + i * dx];
          if (cur && cur !== word[i]) { ok = false; break; }
        }
        if (!ok) continue;
        for (let i = 0; i < word.length; i++) grid[y0 + i * dy][x0 + i * dx] = word[i];
        placed = true;
      }
      // Deterministic fallback: first free row, left-aligned.
      if (!placed) {
        for (let y = 0; y < size && !placed; y++) {
          if (grid[y].slice(0, word.length).every((c, i) => !c || c === word[i])) {
            for (let i = 0; i < word.length; i++) grid[y][i] = word[i];
            placed = true;
          }
        }
      }
    }
    const AB = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const rows = grid.map((row) =>
      `<div class="pp-wsr">${row.map((c) => `<span>${c || AB[Math.floor(r() * 26)]}</span>`).join("")}</div>`
    ).join("");
    return `<div class="pp-wsgrid">${rows}</div>
      <div class="pp-wswords">Find: ${words.map((w) => `<b>${esc(w)}</b>`).join(" · ")}</div>`;
  }

  // The rotating "puzzle of the day" slot: same date = same puzzle, and the
  // pick advances with the shared page rng so every day feels different.
  function puzzleSec(r, child, theme) {
    const kinds = child.stage === "year1" ? ["wordsearch", "maze", "dots"] : ["maze", "dots"];
    const kind = pick(r, kinds);
    if (kind === "wordsearch") {
      return { key: { q: "Word search", a: theme.words.join(", ") }, html: sec("Word search", wordSearch(r, theme.words, 7)) };
    }
    if (kind === "maze") {
      const dims = child.stage === "year1" ? [11, 7] : [8, 5];
      return { key: null, html: sec("Maze — find the way through", mazeSvg(r, dims[0], dims[1], child.stage === "year1" ? 132 : 104)) };
    }
    const shapes = child.stage === "year1" ? ["fish", "boat", "star", "house"] : ["star", "house", "boat"];
    return { key: null, html: sec("Dot-to-dot — join 1, 2, 3… then back to 1", dotToDotSvg(r, shapes, child.stage === "year1" ? 118 : 102)) };
  }

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
    const w1 = pick(r, theme.words);
    const addLv = (skills && skills.add) || 0, subLv = (skills && skills.sub) || 0;
    const sums = [], mathsAns = [];
    for (let i = 0; i < 3; i++) {
      const a = [2 + Math.floor(r() * 5), 4 + Math.floor(r() * 8), 7 + Math.floor(r() * 6)][addLv];
      const b = [1 + Math.floor(r() * 4), 2 + Math.floor(r() * 7), 5 + Math.floor(r() * 4)][addLv];
      sums.push(sumRow(a, "+", b));
      mathsAns.push(`${a} + ${b} = ${a + b}`);
    }
    for (let i = 0; i < 3; i++) {
      const c = [5 + Math.floor(r() * 5), 9 + Math.floor(r() * 8), 12 + Math.floor(r() * 7)][subLv];
      const d = [1 + Math.floor(r() * 4), 2 + Math.floor(r() * 6), 5 + Math.floor(r() * 5)][subLv];
      sums.push(sumRow(c, "−", d));
      mathsAns.push(`${c} − ${d} = ${c - d}`);
    }
    const seqStart = 10 + Math.floor(r() * 80);
    const seqStart2 = 10 + Math.floor(r() * 80);
    const hour = 1 + Math.floor(r() * 11);
    const half = r() > 0.5;
    // Rotate the "extra" slot (sentence vs clock) and the puzzle of the day so
    // no two mornings look alike, while the page height stays in A4 budget.
    const useClock = r() > 0.5;
    const extra = useClock
      ? sec("Time — draw the hands", `<div class="pp-clockrow">${blankClock(`${half ? `half past ${hour}` : `${hour} o'clock`}`)}<div class="pp-clock-side">Draw the hour hand (short) and minute hand (long). The long hand points ${half ? "down to 6" : "up to 12"}.</div></div>`)
      : sec("Write a sentence", `<div class="pp-prompt">Write a sentence about the ${esc(theme.label.toLowerCase())}. Remember your capital letter and full stop!</div>` + hwLines(2));
    const puzzle = puzzleSec(r, child, theme);
    const answers = {
      stageLabel: "Year 1",
      rows: [
        { q: "Maths", a: mathsAns.join("&nbsp;&nbsp; ") },
        { q: "Missing numbers", a: `${seqStart}, ${seqStart + 1}, <b>${seqStart + 2}</b>, ${seqStart + 3} &nbsp;·&nbsp; ${seqStart2}, <b>${seqStart2 + 1}</b>, ${seqStart2 + 2}, <b>${seqStart2 + 3}</b>` },
        ...(useClock
          ? [{ q: "Clock", a: half ? `half past ${hour} — long hand on 6, short hand just past ${hour}` : `${hour} o'clock — long hand on 12, short hand on ${hour}` }]
          : []),
        ...(puzzle.key ? [puzzle.key] : []),
      ],
    };
    const html = `<div class="pp-page">
      ${head(child, dateLabel, theme.label)}
      ${sched}
      ${sec("Handwriting — trace, then write your own", traceWord(w1) + hwLines(1))}
      ${sec("Maths — write the answers in the boxes", `<div class="pp-sumgrid">${sums.join("")}</div>
        <div class="pp-seq">Fill in the missing numbers:&nbsp; <b>${seqStart}</b>, ${seqStart + 1}, <span class="pp-box sm"></span>, ${seqStart + 3} &nbsp;&nbsp;·&nbsp;&nbsp; <b>${seqStart2}</b>, <span class="pp-box sm"></span>, ${seqStart2 + 2}, <span class="pp-box sm"></span></div>`)}
      ${extra}
      ${puzzle.html}
      <div class="pp-foot">Spark · tailored for ${esc(child.name)} · ${esc(dateLabel)}</div>
    </div>`;
    return { html, answers };
  }

  function pageMiddle(child, r, theme, dateLabel, sched) {
    const w = pick(r, theme.words);
    const letters = [...new Set([w[0], pick(r, "ABMST".split("")), child.name[0].toUpperCase()])].slice(0, 3);
    const rows = letters.map((L) => traceWord((L + " ").repeat(6).trim(), 1)).join("");
    // Compute the count-and-circle data first (same rng order), then render — so
    // the answer key can report the targets without a second, divergent stream.
    const countData = range(2).map(() => {
      const n = 4 + Math.floor(r() * 4);
      const total = n + 2 + Math.floor(r() * 2);
      const item = pick(r, theme.things);
      return { n, total, item };
    });
    const countRows = countData.map(({ n, total, item }) =>
      `<div class="pp-count"><span class="pp-count-ask">Circle <b>${n}</b>:</span><span class="pp-count-items">${range(total).map(() => art(item, 34)).join("")}</span></div>`
    ).join("");
    // Rotate the language slot (pattern vs rhymes) and add the puzzle of the
    // day, keeping the page inside the A4 budget.
    const useRhymes = r() > 0.5;
    let langSec, langKey;
    if (useRhymes) {
      const rhymes = shuffle(r, [["CAT", "HAT"], ["STAR", "CAR"], ["BELL", "SHELL"]]);
      const left = rhymes.map((p) => p[0]), right = shuffle(r, rhymes.map((p) => p[1]));
      langSec = sec("Draw a line between the rhyming words", `<div class="pp-match"><div>${left.map((x) => `<div class="pp-match-w">${x} ●</div>`).join("")}</div><div>${right.map((x) => `<div class="pp-match-w">● ${x}</div>`).join("")}</div></div>`);
      langKey = { q: "Rhymes", a: [["CAT", "HAT"], ["STAR", "CAR"], ["BELL", "SHELL"]].map((p) => `${p[0]}–${p[1]}`).join(", ") };
    } else {
      const pat = shuffle(r, theme.things).slice(0, 2);
      langSec = sec("What comes next? Draw it in the box", `<div class="pp-pattern">${[0, 1, 0, 1, 0].map((i) => art(pat[i], 36)).join("")}<span class="pp-box draw"></span></div>`);
      langKey = { q: "What comes next", a: `a ${esc(pat[1])}` };
    }
    const puzzle = puzzleSec(r, child, theme);
    const answers = {
      stageLabel: "Kindergarten",
      rows: [
        { q: "Count &amp; circle", a: countData.map((c) => `circle ${c.n}`).join(", ") },
        langKey,
        ...(puzzle.key ? [puzzle.key] : []),
      ],
    };
    const html = `<div class="pp-page">
      ${head(child, dateLabel, theme.label)}
      ${sched}
      ${sec("Trace the letters", rows + hwLines(1), "then try a row of your own")}
      ${sec("Trace your name", traceWord(child.name, 2) + hwLines(1))}
      ${sec("Count and circle", countRows)}
      ${langSec}
      ${puzzle.html}
      <div class="pp-foot">Spark · tailored for ${esc(child.name)} · ${esc(dateLabel)}</div>
    </div>`;
    return { html, answers };
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
    // Rotate the fun slot: colouring one day, an easy dot-to-dot another.
    const funSec = r() > 0.5
      ? sec("Colour me in!", colouring)
      : sec("Dot-to-dot — join the dots with a crayon", dotToDotSvg(r, ["star", "house"], 110));
    const answers = {
      stageLabel: "Early years",
      openEnded: true,
      rows: [{ q: "", a: `Tracing, the big letter ${initial}, counting 1–2–3 and the drawing fun are all open-ended — count along together and praise the effort.` }],
    };
    const html = `<div class="pp-page">
      ${head(child, dateLabel, theme.label)}
      ${sched}
      ${sec("Trace the lines with your finger, then a crayon", strokes)}
      ${sec(`The letter ${initial} — trace it big!`, `<div class="pp-biginitial">${initial}</div>`)}
      ${sec("Point and count together", dots)}
      ${funSec}
      <div class="pp-foot">Spark · tailored for ${esc(child.name)} · ${esc(dateLabel)}</div>
    </div>`;
    return { html, answers };
  }

  // ---- grown-ups' answer key -------------------------------------------------
  const safeName = (child) => (child && child.name && String(child.name).trim()) || "Friend";

  function keyBlock(e) {
    const rows = (e.answers.rows || [])
      .map((row) => `<div class="pp-key-row">${row.q ? `<b>${row.q}:</b> ` : ""}${row.a}</div>`)
      .join("");
    return `<div class="pp-keyblock">
      <div class="pp-key-name">${esc(e.name)}${e.answers.stageLabel ? ` · ${esc(e.answers.stageLabel)}` : ""}</div>
      ${rows}
    </div>`;
  }

  // A single grown-ups' page: every child's checkable answers, kept separate
  // from the kids' pages so it can be torn off. Deterministic (derived from the
  // same seeded models as the worksheets).
  function answerKeyPage(entries, dateLabel) {
    return `<div class="pp-page pp-keypage">
      <div class="pp-head">
        <div class="pp-brand"><span class="pp-dot"></span> Spark</div>
        <div class="pp-title">For grown-ups — today's answers</div>
        <div class="pp-meta">${esc(dateLabel)} · a quick check-list for marking together</div>
      </div>
      <div class="pp-keynote">Keep this page for yourself. The maths and puzzle answers are below; the handwriting, drawing and colouring are all “great effort” by default.</div>
      ${entries.map(keyBlock).join("")}
      <div class="pp-foot">Spark · answer key · ${esc(dateLabel)}</div>
    </div>`;
  }

  // Last-resort page so a single bad child record degrades one page, never the
  // whole 5:30am run.
  function fallbackPage(child, dateLabel) {
    return `<div class="pp-page">
      ${head({ name: safeName(child), stage: "", schoolType: "" }, dateLabel, "Home adventure")}
      ${sec("Today's sheet", `<div class="pp-prompt">We couldn't build today's activities for this page. Grab a pencil and draw your favourite thing about today!</div>` + hwLines(3))}
      <div class="pp-foot">Spark · ${esc(dateLabel)}</div>
    </div>`;
  }

  // ---- pack ------------------------------------------------------------------
  function render(dateStr) {
    const D = window.SPARK_DATA, S = window.SPARK_STORE;
    const date = dateStr ? new Date(dateStr + "T12:00:00") : new Date();
    const dayKey = date.toISOString().slice(0, 10);
    const dateLabel = date.toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long" });
    const active = S.activeContexts(date); // date-keyed so packs stay deterministic
    const pages = [];
    const keyEntries = [];
    for (const child of D.CHILDREN || []) {
      try {
        // Normalise the name once so an empty/missing vault field can never crash
        // name[0] and blank the entire pack.
        const c = { ...child, name: safeName(child) };
        const mine = active.filter((ctx) => ctx.childScope === "all" || !ctx.childScope || (Array.isArray(ctx.childScope) && ctx.childScope.includes(c.id)));
        const themeId = mine.length ? pick(rng(`theme:${c.id}:${dayKey}`), mine).id : "everyday";
        const theme = THEME_WORDS[themeId] || THEME_WORDS.everyday;
        const r = rng(`print:${c.id}:${dayKey}`);
        const E = window.SPARK_ENGINE;
        const plan = E ? E.planForChild(c, E.weekStart(date), active) : null;
        const sched = scheduleSec(c, date, plan);
        let built;
        if (c.stage === "year1") built = pageEldest(c, r, theme, S.sheetSkills(c.id), dateLabel, sched);
        else if (c.stage === "kindy") built = pageMiddle(c, r, theme, dateLabel, sched);
        else built = pageYoungest(c, r, theme, dateLabel, sched);
        pages.push(built.html);
        keyEntries.push({ name: c.name, answers: built.answers });
      } catch (_) {
        // One bad record must not take down the other children's pages.
        pages.push(fallbackPage(child, dateLabel));
      }
    }
    if (keyEntries.length) pages.push(answerKeyPage(keyEntries, dateLabel));
    return `<div class="pp-pack">${pages.join("")}</div>`;
  }

  window.SPARK_PRINT = { render };
})();
