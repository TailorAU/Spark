/*
 * Spark — interactive worksheets
 * One self-marking worksheet per child per week, generated deterministically
 * from (child stage + week + active life contexts) — the same tailoring spine
 * as the weekly plan. Four touch-first mechanics, no drag, big targets:
 *   choice  — tap the right answer
 *   tapall  — tap every matching item
 *   build   — build a word from letter tiles, in order
 *   sort    — send each item to one of two buckets
 * A question earns a star when finished with no wrong taps. Fully offline.
 */
(function () {
  "use strict";
  const D = window.SPARK_DATA;

  const esc = (s) =>
    String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  // --- seeded RNG (mulberry32 over a string hash) ------------------------------
  function hash(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }
  function rng(seedStr) {
    let a = hash(seedStr) || 1;
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
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(r() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
  const range = (n) => Array.from({ length: n }, (_, i) => i);

  // --- context themes -----------------------------------------------------------
  // Small pools the generators draw from so the sheet visibly reflects real life.
  const THEMES = {
    fiji: {
      label: "Fiji", emoji: "🏝️",
      things: ["🐚", "🌺", "🐠", "🥥", "⛵"],
      thing: "shells", one: "shell",
      words: ["FISH", "SAND", "BOAT", "SHELL"],
      floaters: [["🥥", "coconut"], ["⛵", "toy boat"], ["🍃", "leaf"]],
      sinkers: [["🪨", "rock"], ["🔑", "key"], ["🥄", "spoon"]],
    },
    camping: {
      label: "camping", emoji: "⛺",
      things: ["🍡", "🌟", "🥾", "🌲", "🔥"],
      thing: "marshmallows", one: "marshmallow",
      words: ["TENT", "STAR", "CAMP", "FIRE"],
      floaters: [["🍃", "leaf"], ["🪵", "stick"], ["🦆", "toy duck"]],
      sinkers: [["🪨", "rock"], ["⛏️", "peg"], ["🥄", "spoon"]],
    },
    crosscountry: {
      label: "cross country", emoji: "🏅",
      things: ["👟", "🏅", "⏱️", "🚩", "💧"],
      thing: "laps", one: "lap",
      words: ["RACE", "FAST", "JUMP", "TEAM"],
      floaters: [["🍃", "leaf"], ["🦆", "toy duck"], ["⚽", "ball"]],
      sinkers: [["🪨", "rock"], ["🔑", "key"], ["🥄", "spoon"]],
    },
    everyday: {
      label: "home", emoji: "🏡",
      things: ["🍎", "🧦", "🧸", "🥄", "📚"],
      thing: "apples", one: "apple",
      words: ["PLAY", "BOOK", "HOME", "JUMP"],
      floaters: [["🍃", "leaf"], ["🦆", "toy duck"], ["🧽", "sponge"]],
      sinkers: [["🪨", "rock"], ["🔑", "key"], ["🥄", "spoon"]],
    },
  };

  function themesFor(child, contexts) {
    const t = contexts.map((c) => THEMES[c.id]).filter(Boolean);
    return t.length ? t : [THEMES.everyday];
  }

  // --- question builders ---------------------------------------------------------
  // Each returns { area, prompt, kind, ... } — `star` and runtime state are added
  // by the player. `visual` is optional HTML rendered above the interaction.

  function qChoice(area, prompt, options, visual) {
    return { kind: "choice", area, prompt, options, visual: visual || "" };
  }
  function qTapAll(area, prompt, items, opts) {
    // items: [{label, match}]
    return { kind: "tapall", area, prompt, items, count: opts && opts.count };
  }
  function qBuild(area, prompt, word, r) {
    const distract = shuffle(r, "BDGKMOPRSU".split("").filter((c) => !word.includes(c))).slice(0, 2);
    return { kind: "build", area, prompt, word, tiles: shuffle(r, word.split("").concat(distract)) };
  }
  function qSort(area, prompt, buckets, items) {
    // items: [{label, name, bucket}]
    return { kind: "sort", area, prompt, buckets, items };
  }

  function choiceOpts(r, correct, wrongs, fmt) {
    const f = fmt || ((x) => String(x));
    return shuffle(
      r,
      [{ label: f(correct), correct: true }].concat(wrongs.map((w) => ({ label: f(w), correct: false })))
    );
  }

  // A simple SVG analogue clock for the Year-1 time question.
  function clockSVG(hour, half) {
    const hAng = ((hour % 12) + (half ? 0.5 : 0)) * 30;
    const mAng = half ? 180 : 0;
    const marks = range(12)
      .map((i) => {
        const a = (i * 30 * Math.PI) / 180;
        const x1 = 60 + Math.sin(a) * 50, y1 = 60 - Math.cos(a) * 50;
        const x2 = 60 + Math.sin(a) * 44, y2 = 60 - Math.cos(a) * 44;
        return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>`;
      })
      .join("");
    const hand = (ang, len, w) => {
      const a = (ang * Math.PI) / 180;
      return `<line x1="60" y1="60" x2="${60 + Math.sin(a) * len}" y2="${60 - Math.cos(a) * len}" stroke="currentColor" stroke-width="${w}" stroke-linecap="round"/>`;
    };
    return `<svg class="ws-clock" viewBox="0 0 120 120" role="img" aria-label="clock">
      <circle cx="60" cy="60" r="56" fill="none" stroke="currentColor" stroke-width="4"/>${marks}
      ${hand(hAng, 28, 6)}${hand(mAng, 40, 4)}<circle cx="60" cy="60" r="4" fill="currentColor"/></svg>`;
  }

  // --- per-stage generators (6 questions each) ------------------------------------

  function sheetYoungest(r, themes) {
    const t = () => pick(r, themes);
    const qs = [];

    // 1 · Colours — tap the named colour.
    const colours = [["RED", "🔴"], ["BLUE", "🔵"], ["GREEN", "🟢"], ["YELLOW", "🟡"]];
    const c = pick(r, colours);
    qs.push(qChoice("Colours", `Tap the ${c[0]} one!`,
      choiceOpts(r, c[1], colours.filter((x) => x[0] !== c[0]).map((x) => x[1]))));

    // 2 · Shapes — tap all the circles.
    const nCirc = 3;
    const items = shuffle(r, range(nCirc).map(() => ({ label: "⚪", match: true }))
      .concat([{ label: "🔺", match: false }, { label: "⬛", match: false }, { label: "🔺", match: false }]));
    qs.push(qTapAll("Shapes", "Tap ALL the circles!", items));

    // 3 · Big & small.
    const pair = pick(r, [["🐘", "🐜"], ["🦒", "🐞"], ["🐋", "🐟"]]);
    qs.push(qChoice("Size", "Tap the BIG one!",
      shuffle(r, [{ label: pair[0], correct: true, cls: "ws-big" }, { label: pair[1], correct: false, cls: "ws-small" }])));

    // 4 · Counting — tap each themed thing, hear the count grow.
    const th = t();
    const n = 3 + Math.floor(r() * 2); // 3-4
    qs.push({
      kind: "tapall", area: "Counting", countMode: true,
      prompt: `Tap each ${th.one} as you count: 1, 2, 3…`,
      items: shuffle(r, range(n).map(() => ({ label: pick(r, th.things), match: true }))),
    });

    // 5 · Animal sounds.
    const animals = [["MOO", "🐮", ["🐔", "🐱"]], ["WOOF", "🐶", ["🐷", "🐑"]], ["BAA", "🐑", ["🐮", "🦆"]]];
    const an = pick(r, animals);
    qs.push(qChoice("Sounds", `Who says ${an[0]}?`, choiceOpts(r, an[1], an[2])));

    // 6 · Feelings.
    const feels = [["HAPPY", "😊", ["😢", "😠"]], ["SLEEPY", "😴", ["😊", "😮"]], ["SAD", "😢", ["😊", "😆"]]];
    const fe = pick(r, feels);
    qs.push(qChoice("Feelings", `Tap the ${fe[0]} face!`, choiceOpts(r, fe[1], fe[2])));

    return qs;
  }

  function sheetMiddle(r, themes) {
    const t = () => pick(r, themes);
    const qs = [];

    // 1 · Letter hunt — first letter of a themed word.
    const th1 = t();
    const word = pick(r, th1.words);
    const L = word[0];
    const wrongL = shuffle(r, "ABCDEFGHKMNPRSTW".split("").filter((x) => x !== L)).slice(0, 5);
    const grid = shuffle(r, [L, L, L].map((x) => ({ label: x, match: true }))
      .concat(wrongL.map((x) => ({ label: x, match: false }))));
    qs.push(qTapAll("Letters", `${th1.emoji} ${word[0]}${word.slice(1).toLowerCase()} starts with ${L}. Tap ALL the ${L}s!`, grid));

    // 2 · Counting — how many?
    const th2 = t();
    const n = 3 + Math.floor(r() * 5); // 3-7
    const em = pick(r, th2.things);
    qs.push(qChoice("Counting", `How many ${th2.thing}?`,
      choiceOpts(r, n, shuffle(r, [n - 1, n + 1, n + 2].filter((x) => x > 0)).slice(0, 2)),
      `<div class="ws-swarm">${range(n).map(() => em).join(" ")}</div>`));

    // 3 · Patterns — what comes next?
    const [a, b] = pick(r, [["🔴", "🔵"], ["🌟", "🌙"], ["🍎", "🍌"], ["⚪", "🟩"]]);
    qs.push(qChoice("Patterns", "What comes NEXT?", choiceOpts(r, b, [a, "🟣"]),
      `<div class="ws-swarm">${[a, b, a, b, a].join(" ")} <span class="ws-blank">?</span></div>`));

    // 4 · Rhyme time.
    const rhymes = [
      ["CAT", "HAT", ["DOG", "SUN"]],
      ["STAR", "CAR", ["MOON", "FISH"]],
      ["TENT", "BENT", ["FIRE", "TREE"]],
      ["SHELL", "BELL", ["CRAB", "WAVE"]],
    ];
    const rh = pick(r, rhymes);
    qs.push(qChoice("Rhymes", `Which word rhymes with ${rh[0]}?`, choiceOpts(r, rh[1], rh[2])));

    // 5 · Odd one out.
    const odd = pick(r, [["⚪", "🔺"], ["🐟", "🌳"], ["🍎", "🚗"]]);
    qs.push(qChoice("Thinking", "Tap the ODD ONE OUT!",
      shuffle(r, [{ label: odd[1], correct: true }].concat(range(3).map(() => ({ label: odd[0], correct: false }))))));

    // 6 · Float or sink (themed).
    const th3 = t();
    const items = shuffle(r, shuffle(r, th3.floaters).slice(0, 2).map((f) => ({ label: f[0], name: f[1], bucket: 0 }))
      .concat(shuffle(r, th3.sinkers).slice(0, 2).map((s) => ({ label: s[0], name: s[1], bucket: 1 }))));
    qs.push(qSort("Science", "Does it FLOAT or SINK?", ["🌊 Floats", "⬇️ Sinks"], items));

    return qs;
  }

  function sheetEldest(r, themes) {
    const t = () => pick(r, themes);
    const qs = [];

    // 1 · Build the word from tiles.
    const th1 = t();
    qs.push(qBuild("English · phonics", `${th1.emoji} Build the word:`, pick(r, th1.words), r));

    // 2 · Addition within 20, themed story.
    const th2 = t();
    const a = 4 + Math.floor(r() * 8), b = 2 + Math.floor(r() * 7);
    qs.push(qChoice("Maths · addition",
      `You got ${a} ${th2.thing}, then ${b} more. How many altogether?`,
      choiceOpts(r, a + b, [a + b - 1, a + b + 2]),
      `<div class="ws-sum">${a} + ${b} = <span class="ws-blank">?</span></div>`));

    // 3 · Missing number on the path to 100.
    const start = 10 + Math.floor(r() * 80);
    qs.push(qChoice("Maths · number", "Which number is missing?",
      choiceOpts(r, start + 2, [start + 3, start + 1]),
      `<div class="ws-sum">${start}, ${start + 1}, <span class="ws-blank">?</span>, ${start + 3}</div>`));

    // 4 · Subtraction story.
    const th3 = t();
    const c2 = 9 + Math.floor(r() * 8), d = 2 + Math.floor(r() * 6);
    qs.push(qChoice("Maths · subtraction",
      `${c2} ${th3.thing}, then ${d} ${th3.id === "crosscountry" ? "done" : "gone"}. How many left?`,
      choiceOpts(r, c2 - d, [c2 - d + 1, c2 - d - 1].filter((x) => x >= 0)),
      `<div class="ws-sum">${c2} − ${d} = <span class="ws-blank">?</span></div>`));

    // 5 · Read the clock.
    const hour = 1 + Math.floor(r() * 11);
    const half = r() > 0.5;
    const label = (h, hf) => (hf ? `half past ${h}` : `${h} o'clock`);
    qs.push(qChoice("Maths · time", "What time is it?",
      choiceOpts(r, label(hour, half), [label((hour % 12) + 1, half), label(hour, !half)]),
      clockSVG(hour, half)));

    // 6 · Living or not living.
    const living = shuffle(r, [["🌳", "tree"], ["🐟", "fish"], ["🦘", "kangaroo"], ["🌱", "seedling"]]).slice(0, 2);
    const notLiving = shuffle(r, [["🪨", "rock"], ["⛺", "tent"], ["🚗", "car"], ["⏱️", "stopwatch"]]).slice(0, 2);
    const items = shuffle(r, living.map((x) => ({ label: x[0], name: x[1], bucket: 0 }))
      .concat(notLiving.map((x) => ({ label: x[0], name: x[1], bucket: 1 }))));
    qs.push(qSort("Science", "LIVING or NOT living?", ["🌱 Living", "🧱 Not living"], items));

    return qs;
  }

  function buildSheet(child, week, contexts, attempt) {
    const weekKey = week.toISOString().slice(0, 10);
    const r = rng(`${child.id}:${weekKey}:${attempt || 0}`);
    const themes = themesFor(child, contexts);
    const gen = { eylf: sheetYoungest, kindy: sheetMiddle, year1: sheetEldest }[child.stage] || sheetYoungest;
    return gen(r, themes);
  }

  // --- player ---------------------------------------------------------------------
  // Renders one question at a time into `host`; handles its own events; calls
  // hooks.onFinish(stars, total) at the end.

  function render(host, opts) {
    const { child, week, contexts, onExit, onFinish, saveBest } = opts;
    let attempt = 0;
    let qs, idx, mistakes, stars, state;

    function start() {
      qs = buildSheet(child, week, contexts, attempt);
      idx = 0; stars = 0;
      next();
    }

    function next() {
      if (idx >= qs.length) return finish();
      mistakes = 0;
      state = {};
      paint();
    }

    function dots() {
      return `<div class="ws-dots">${qs
        .map((q, i) =>
          `<span class="ws-dot ${i < idx ? (q.star ? "star" : "done") : ""} ${i === idx ? "now" : ""}">${i < idx ? (q.star ? "★" : "✓") : ""}</span>`)
        .join("")}</div>`;
    }

    function head(q) {
      return `<div class="ws-head" style="--kid:${child.colour};--kid-bg:${child.accent}">
          <button class="back" data-ws="exit">‹ ${esc(child.name)}</button>
          ${dots()}
          <div class="ws-area">${esc(q.area)}</div>
          <div class="ws-prompt">${q.prompt ? esc(q.prompt) : ""}</div>
        </div>`;
    }

    function paint() {
      const q = qs[idx];
      let body = "";
      if (q.kind === "choice") {
        body = `${q.visual || ""}<div class="ws-opts">${q.options
          .map((o, i) =>
            `<button class="ws-opt ${o.cls || ""}" data-ws="choice" data-i="${i}">${esc(o.label)}</button>`)
          .join("")}</div>`;
      } else if (q.kind === "tapall") {
        state.found = state.found || new Set();
        body = `<div class="ws-grid">${q.items
          .map((it, i) =>
            `<button class="ws-cell ${state.found.has(i) ? "hit" : ""}" data-ws="tap" data-i="${i}">
               ${esc(it.label)}${q.countMode && state.found.has(i) ? `<span class="ws-n">${[...state.found].indexOf(i) + 1}</span>` : ""}
             </button>`)
          .join("")}</div>
          <div class="ws-note">${q.countMode ? `Counted: <b>${state.found.size}</b>` : `Found ${state.found.size} of ${q.items.filter((x) => x.match).length}`}</div>`;
      } else if (q.kind === "build") {
        state.placed = state.placed || [];
        state.used = state.used || new Set();
        body = `<div class="ws-word">${q.word
          .split("")
          .map((ch, i) => `<span class="ws-slot ${i < state.placed.length ? "fill" : ""}">${i < state.placed.length ? esc(ch) : ""}</span>`)
          .join("")}</div>
          <div class="ws-tiles">${q.tiles
            .map((tl, i) =>
              `<button class="ws-tile ${state.used.has(i) ? "used" : ""}" data-ws="tile" data-i="${i}">${esc(tl)}</button>`)
            .join("")}</div>`;
      } else if (q.kind === "sort") {
        state.at = state.at || 0;
        const it = q.items[state.at];
        body = `<div class="ws-sort-item">${esc(it.label)}<div class="ws-sort-name">${esc(it.name)}</div></div>
          <div class="ws-buckets">${q.buckets
            .map((b, i) => `<button class="ws-bucket" data-ws="bucket" data-i="${i}">${esc(b)}</button>`)
            .join("")}</div>
          <div class="ws-note">${state.at + 1} of ${q.items.length}</div>`;
      }
      host.innerHTML = `${head(q)}<div class="ws-body">${body}</div>`;
    }

    function celebrate(el) {
      el.classList.add("pop");
      setTimeout(() => advance(), 550);
    }

    function advance() {
      const q = qs[idx];
      q.star = mistakes === 0;
      if (q.star) stars++;
      idx++;
      next();
    }

    function wrong(el) {
      mistakes++;
      el.classList.add("shake");
      setTimeout(() => el.classList.remove("shake"), 400);
    }

    function finish() {
      if (saveBest) saveBest(stars, qs.length);
      if (onFinish) onFinish(stars, qs.length);
      const burst = range(14)
        .map((i) => `<span class="ws-confetti" style="--i:${i}">${"🎉⭐✨🎈"[i % 4]}</span>`)
        .join("");
      host.innerHTML = `
        <div class="ws-end" style="--kid:${child.colour};--kid-bg:${child.accent}">
          <div class="ws-burst">${burst}</div>
          <div class="ws-end-emoji">${child.emoji}</div>
          <h2>Worksheet done!</h2>
          <div class="ws-stars">${qs.map((q) => (q.star ? "⭐" : "☆")).join("")}</div>
          <div class="ws-end-sub">${stars} of ${qs.length} stars${stars === qs.length ? " — perfect!" : ""}</div>
          <div class="ws-end-actions">
            <button class="btn" data-ws="again">Play again</button>
            <button class="btn ghost" data-ws="exit">Back to ${esc(child.name)}</button>
          </div>
        </div>`;
    }

    function onTap(e) {
      const el = e.target.closest("[data-ws]");
      if (!el || !host.contains(el)) return;
      const act = el.dataset.ws;
      const q = qs[idx];
      if (act === "exit") return onExit();
      if (act === "again") { attempt++; return start(); }
      if (!q) return;

      if (act === "choice" && q.kind === "choice") {
        const o = q.options[+el.dataset.i];
        if (o.correct) { el.classList.add("right"); celebrate(el); }
        else wrong(el);
      } else if (act === "tap" && q.kind === "tapall") {
        const i = +el.dataset.i;
        if (state.found.has(i)) return;
        if (q.items[i].match) {
          state.found.add(i);
          const total = q.items.filter((x) => x.match).length;
          if (state.found.size >= total) {
            paint();
            setTimeout(() => advance(), 650);
          } else paint();
        } else wrong(el);
      } else if (act === "tile" && q.kind === "build") {
        const i = +el.dataset.i;
        if (state.used.has(i)) return;
        const needed = q.word[state.placed.length];
        if (q.tiles[i] === needed) {
          state.used.add(i);
          state.placed.push(needed);
          if (state.placed.length >= q.word.length) {
            paint();
            setTimeout(() => advance(), 650);
          } else paint();
        } else wrong(el);
      } else if (act === "bucket" && q.kind === "sort") {
        const it = q.items[state.at];
        if (+el.dataset.i === it.bucket) {
          state.at++;
          if (state.at >= q.items.length) {
            el.classList.add("right");
            setTimeout(() => advance(), 450);
          } else paint();
        } else wrong(el);
      }
    }

    host.addEventListener("click", onTap);
    start();
    return { destroy: () => host.removeEventListener("click", onTap) };
  }

  window.SPARK_SHEETS = { buildSheet, render };
})();
