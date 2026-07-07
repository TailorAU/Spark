/*
 * Spark — interactive worksheets
 * One self-marking worksheet per child per week, generated deterministically
 * from (child stage + week + active life contexts) — the same tailoring spine
 * as the weekly plan. Each sheet is a themed "adventure": an animated SVG
 * scene from whatever the family is actually doing (Fiji, camping, cross
 * country) that the questions play out inside. Touch-first mechanics, no drag:
 *   choice  — tap the right answer
 *   tapall  — tap every matching item (in a grid, or scattered in the scene)
 *   build   — build a word from letter tiles, in order
 *   sort    — send each item to one of two buckets
 * A question earns a star when finished with no wrong taps. Gentle WebAudio
 * feedback with a persisted mute toggle. Fully offline.
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

  // --- sound FX (tiny synth, no assets) ----------------------------------------
  const FX = (() => {
    let ctx = null;
    const MUTE_KEY = "spark.ws.muted";
    let muted = false;
    try { muted = localStorage.getItem(MUTE_KEY) === "1"; } catch (_) {}
    function ac() {
      if (!ctx) {
        try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (_) {}
      }
      if (ctx && ctx.state === "suspended") ctx.resume().catch(() => {});
      return ctx;
    }
    function note(freq, t0, dur, type, vol) {
      const c = ac();
      if (!c) return;
      const o = c.createOscillator(), g = c.createGain();
      o.type = type || "sine";
      o.frequency.value = freq;
      g.gain.setValueAtTime(0.0001, c.currentTime + t0);
      g.gain.exponentialRampToValueAtTime(vol || 0.08, c.currentTime + t0 + 0.015);
      g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + t0 + dur);
      o.connect(g).connect(c.destination);
      o.start(c.currentTime + t0);
      o.stop(c.currentTime + t0 + dur + 0.05);
    }
    return {
      isMuted: () => muted,
      toggle() {
        muted = !muted;
        try { localStorage.setItem(MUTE_KEY, muted ? "1" : "0"); } catch (_) {}
        return muted;
      },
      correct() { if (!muted) { note(660, 0, 0.12); note(880, 0.09, 0.16); } },
      wrong() { if (!muted) note(170, 0, 0.18, "triangle", 0.06); },
      tick() { if (!muted) note(520, 0, 0.08, "sine", 0.05); },
      fanfare() {
        if (muted) return;
        [523, 659, 784, 1047].forEach((f, i) => note(f, i * 0.13, 0.22, "triangle", 0.07));
      },
    };
  })();

  // --- context themes -----------------------------------------------------------
  // Pools + a full animated SVG scene per theme. The scene is the question's
  // stage: scatter-questions place their tappable items inside it.
  const THEMES = {
    fiji: {
      label: "Fiji adventure", emoji: "🏝️",
      things: ["🐚", "🌺", "🐠", "🥥", "⛵"],
      thing: "shells", one: "shell",
      words: ["FISH", "SAND", "BOAT", "SHELL"],
      floaters: [["🥥", "coconut"], ["⛵", "toy boat"], ["🍃", "leaf"]],
      sinkers: [["🪨", "rock"], ["🔑", "key"], ["🥄", "spoon"]],
    },
    camping: {
      label: "Camping trip", emoji: "⛺",
      things: ["🍡", "🌟", "🥾", "🌲", "🔥"],
      thing: "marshmallows", one: "marshmallow",
      words: ["TENT", "STAR", "CAMP", "FIRE"],
      floaters: [["🍃", "leaf"], ["🪵", "stick"], ["🦆", "toy duck"]],
      sinkers: [["🪨", "rock"], ["⛏️", "peg"], ["🥄", "spoon"]],
    },
    crosscountry: {
      label: "Race day", emoji: "🏅",
      things: ["👟", "🏅", "⏱️", "🚩", "💧"],
      thing: "laps", one: "lap",
      words: ["RACE", "FAST", "JUMP", "TEAM"],
      floaters: [["🍃", "leaf"], ["🦆", "toy duck"], ["⚽", "ball"]],
      sinkers: [["🪨", "rock"], ["🔑", "key"], ["🥄", "spoon"]],
    },
    everyday: {
      label: "Home adventure", emoji: "🏡",
      things: ["🍎", "🧦", "🧸", "🥄", "📚"],
      thing: "apples", one: "apple",
      words: ["PLAY", "BOOK", "HOME", "JUMP"],
      floaters: [["🍃", "leaf"], ["🦆", "toy duck"], ["🧽", "sponge"]],
      sinkers: [["🪨", "rock"], ["🔑", "key"], ["🥄", "spoon"]],
    },
  };

  // Animated scene backdrops (pure SVG + CSS classes animated in styles.css).
  const SCENES = {
    fiji: `
      <svg viewBox="0 0 400 140" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <defs>
          <linearGradient id="skyF" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="#8fd3f4"/><stop offset="1" stop-color="#cfeffd"/>
          </linearGradient>
        </defs>
        <rect width="400" height="140" fill="url(#skyF)" class="sc-bg"/>
        <circle cx="340" cy="30" r="18" fill="#ffd54d" class="sc-sun sc-bg"/>
        <ellipse cx="60" cy="26" rx="26" ry="9" fill="#fff" opacity="0.85" class="sc-cloud sc-bg"/>
        <ellipse cx="88" cy="32" rx="18" ry="7" fill="#fff" opacity="0.7" class="sc-cloud sc-cloud2 sc-bg"/>
        <path d="M0 88 Q40 78 80 88 T160 88 T240 88 T320 88 T400 88 V140 H0 Z" fill="#3fb0d8" class="sc-wave sc-bg"/>
        <path d="M0 100 Q50 92 100 100 T200 100 T300 100 T400 100 V140 H0 Z" fill="#2a8fc0" opacity="0.85" class="sc-wave sc-wave2 sc-bg"/>
        <ellipse cx="80" cy="122" rx="95" ry="26" fill="#f6dfa4"/>
        <path d="M64 96 Q60 66 78 52 M64 96 Q76 70 92 64 M64 96 Q52 72 40 68" stroke="#2f8f5b" stroke-width="5" fill="none" stroke-linecap="round"/>
        <rect x="60" y="92" width="8" height="26" rx="3" fill="#8a5a2b"/>
      </svg>`,
    camping: `
      <svg viewBox="0 0 400 140" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <defs>
          <linearGradient id="skyC" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="#1b2a52"/><stop offset="1" stop-color="#3b4a7a"/>
          </linearGradient>
        </defs>
        <rect width="400" height="140" fill="url(#skyC)" class="sc-bg"/>
        <circle cx="330" cy="28" r="14" fill="#f4f1de" class="sc-bg"/>
        <circle cx="336" cy="24" r="14" fill="#1b2a52" opacity="0.55" class="sc-bg"/>
        <g fill="#fff" class="sc-bg">
          <circle cx="40" cy="24" r="2" class="sc-star"/>
          <circle cx="120" cy="16" r="2" class="sc-star sc-star2"/>
          <circle cx="200" cy="30" r="2" class="sc-star sc-star3"/>
          <circle cx="260" cy="14" r="2" class="sc-star"/>
          <circle cx="70" cy="44" r="1.6" class="sc-star sc-star2"/>
          <circle cx="300" cy="48" r="1.6" class="sc-star sc-star3"/>
        </g>
        <path d="M0 118 L60 84 L120 118 Z" fill="#243b2f"/>
        <path d="M330 118 L380 80 L400 118 Z" fill="#243b2f"/>
        <rect y="112" width="400" height="28" fill="#2e4636" class="sc-bg"/>
        <path d="M150 118 L200 66 L250 118 Z" fill="#e8833a"/>
        <path d="M186 118 L200 88 L214 118 Z" fill="#b85f1f"/>
        <g class="sc-flame">
          <ellipse cx="300" cy="106" rx="10" ry="14" fill="#ff9d2e"/>
          <ellipse cx="300" cy="110" rx="6" ry="9" fill="#ffd54d"/>
        </g>
        <path d="M286 120 L314 116 M288 114 L312 122" stroke="#7a4a1e" stroke-width="4" stroke-linecap="round"/>
      </svg>`,
    crosscountry: `
      <svg viewBox="0 0 400 140" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <defs>
          <linearGradient id="skyR" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="#9fd8ef"/><stop offset="1" stop-color="#d9f1fb"/>
          </linearGradient>
        </defs>
        <rect width="400" height="140" fill="url(#skyR)" class="sc-bg"/>
        <circle cx="52" cy="30" r="15" fill="#ffd54d" class="sc-sun sc-bg"/>
        <ellipse cx="250" cy="26" rx="24" ry="8" fill="#fff" opacity="0.8" class="sc-cloud sc-bg"/>
        <path d="M0 96 Q100 74 200 92 T400 88 V140 H0 Z" fill="#69b96b" class="sc-bg"/>
        <path d="M0 116 Q120 100 240 112 T400 110 V140 H0 Z" fill="#4d9e54" class="sc-bg"/>
        <path d="M20 124 Q200 104 380 120" stroke="#e8e3d4" stroke-width="10" fill="none" stroke-linecap="round" stroke-dasharray="1 18" class="sc-track sc-bg"/>
        <g class="sc-flagwave">
          <rect x="332" y="58" width="4" height="52" rx="2" fill="#7a4a1e"/>
          <path d="M336 60 L370 66 L336 74 Z" fill="#e34f4f"/>
        </g>
        <text x="180" y="126" font-size="20" class="sc-runner">🏃</text>
      </svg>`,
    everyday: `
      <svg viewBox="0 0 400 140" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <defs>
          <linearGradient id="skyH" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="#a5d8f3"/><stop offset="1" stop-color="#e2f3fc"/>
          </linearGradient>
        </defs>
        <rect width="400" height="140" fill="url(#skyH)" class="sc-bg"/>
        <circle cx="60" cy="30" r="16" fill="#ffd54d" class="sc-sun sc-bg"/>
        <ellipse cx="220" cy="24" rx="26" ry="9" fill="#fff" opacity="0.85" class="sc-cloud sc-bg"/>
        <rect y="112" width="400" height="28" fill="#7bc47f" class="sc-bg"/>
        <rect x="150" y="66" width="90" height="50" rx="4" fill="#f2e3c6"/>
        <path d="M142 70 L195 38 L248 70 Z" fill="#d1603d"/>
        <rect x="186" y="88" width="18" height="28" rx="2" fill="#8a5a2b"/>
        <rect x="160" y="78" width="16" height="14" rx="2" fill="#9fd8ef"/>
        <rect x="214" y="78" width="16" height="14" rx="2" fill="#9fd8ef"/>
        <path d="M60 116 Q58 84 76 72 M60 116 Q70 88 88 84" stroke="#3f8f4f" stroke-width="5" fill="none" stroke-linecap="round"/>
        <text x="300" y="60" font-size="22" class="sc-kite">🪁</text>
      </svg>`,
  };

  // Slot positions (percent of the scene box) for scatter items — spread out,
  // kept in the lower two-thirds so they sit "in" the scene.
  const SLOTS = [
    [11, 42], [30, 40], [50, 44], [70, 40], [89, 42],
    [11, 76], [30, 78], [50, 74], [70, 78], [89, 76],
  ];

  function themesFor(child, contexts) {
    const t = contexts.map((c) => THEMES[c.id] && { id: c.id, ...THEMES[c.id] }).filter(Boolean);
    return t.length ? t : [{ id: "everyday", ...THEMES.everyday }];
  }

  // --- question builders ---------------------------------------------------------
  function qChoice(area, prompt, options, visual, theme) {
    return { kind: "choice", area, prompt, options, visual: visual || "", theme };
  }
  function qTapAll(area, prompt, items, theme, opts) {
    return { kind: "tapall", area, prompt, items, theme, countMode: opts && opts.countMode, scatter: opts && opts.scatter };
  }
  function qBuild(area, prompt, word, r, theme) {
    const distract = shuffle(r, "BDGKMOPRSU".split("").filter((c) => !word.includes(c))).slice(0, 2);
    return { kind: "build", area, prompt, word, tiles: shuffle(r, word.split("").concat(distract)), theme };
  }
  function qSort(area, prompt, buckets, items, theme) {
    return { kind: "sort", area, prompt, buckets, items, theme };
  }
  function choiceOpts(r, correct, wrongs, fmt) {
    const f = fmt || ((x) => String(x));
    return shuffle(
      r,
      [{ label: f(correct), correct: true }].concat(wrongs.map((w) => ({ label: f(w), correct: false })))
    );
  }
  // Scatter n matching items (+ optional decoys) onto scene slots.
  function scatterItems(r, emojis, matches, decoys) {
    const slots = shuffle(r, SLOTS);
    const items = [];
    for (let i = 0; i < matches; i++)
      items.push({ label: typeof emojis === "string" ? emojis : pick(r, emojis), match: true, pos: slots[i] });
    (decoys || []).forEach((d, j) => items.push({ label: d, match: false, pos: slots[matches + j] }));
    return shuffle(r, items);
  }

  const WORD_PIC = {
    FISH: "🐟", SAND: "🏖️", BOAT: "⛵", SHELL: "🐚", TENT: "⛺", STAR: "⭐",
    CAMP: "🏕️", FIRE: "🔥", RACE: "🏁", FAST: "💨", JUMP: "🦘", TEAM: "🤝",
    PLAY: "🎈", BOOK: "📚", HOME: "🏠",
  };

  // A number line 0..20 with hop arcs — makes the sum visible.
  function numberLineSVG(from, delta) {
    const to = from + delta, step = 360 / 20;
    const x = (n) => 20 + n * step;
    const ticks = range(21)
      .map((n) => `<line x1="${x(n)}" y1="52" x2="${x(n)}" y2="${n % 5 ? 46 : 42}" stroke="currentColor" stroke-width="1.6"/>
        ${n % 5 === 0 ? `<text x="${x(n)}" y="68" font-size="11" text-anchor="middle" fill="currentColor">${n}</text>` : ""}`)
      .join("");
    const dir = delta >= 0 ? 1 : -1;
    const hops = range(Math.abs(delta))
      .map((i) => {
        const a = x(from + i * dir), b = x(from + (i + 1) * dir);
        return `<path d="M${a} 50 Q${(a + b) / 2} 26 ${b} 50" fill="none" stroke="#e8833a" stroke-width="2.4" class="ws-hop" style="--hop:${i}"/>`;
      })
      .join("");
    return `<svg class="ws-nline" viewBox="0 0 400 74" role="img" aria-label="number line from ${from} ${delta >= 0 ? "plus" : "minus"} ${Math.abs(delta)}">
      <line x1="14" y1="52" x2="386" y2="52" stroke="currentColor" stroke-width="2"/>
      ${ticks}${hops}
      <circle cx="${x(from)}" cy="52" r="5" fill="#2f9e57"/>
      <circle cx="${x(to)}" cy="52" r="7" fill="none" stroke="#e8833a" stroke-width="2.6"/>
      <text x="${x(to)}" y="34" font-size="15" font-weight="800" text-anchor="middle" fill="#e8833a">?</text>
    </svg>`;
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

    // 1 · Find things hiding in the scene (tap-to-count).
    const th1 = t();
    const n1 = 3 + Math.floor(r() * 2); // 3-4
    qs.push(qTapAll("Counting", `Tap each ${th1.one} as you count: 1, 2, 3…`,
      scatterItems(r, th1.things, n1), th1, { countMode: true, scatter: true }));

    // 2 · Colours — tap the named colour.
    const colours = [["RED", "🔴"], ["BLUE", "🔵"], ["GREEN", "🟢"], ["YELLOW", "🟡"]];
    const c = pick(r, colours);
    qs.push(qChoice("Colours", `Tap the ${c[0]} one!`,
      choiceOpts(r, c[1], colours.filter((x) => x[0] !== c[0]).map((x) => x[1])), "", t()));

    // 3 · Shapes hiding in the scene — tap all the circles.
    const th3 = t();
    qs.push(qTapAll("Shapes", "Tap ALL the circles!",
      scatterItems(r, "⚪", 3, ["🔺", "⬛", "🔺"]), th3, { scatter: true }));

    // 4 · Big & small.
    const pair = pick(r, [["🐘", "🐜"], ["🦒", "🐞"], ["🐋", "🐟"]]);
    qs.push(qChoice("Size", "Tap the BIG one!",
      shuffle(r, [{ label: pair[0], correct: true, cls: "ws-big" }, { label: pair[1], correct: false, cls: "ws-small" }]), "", t()));

    // 5 · Animal sounds.
    const animals = [["MOO", "🐮", ["🐔", "🐱"]], ["WOOF", "🐶", ["🐷", "🐑"]], ["BAA", "🐑", ["🐮", "🦆"]]];
    const an = pick(r, animals);
    qs.push(qChoice("Sounds", `Who says ${an[0]}?`, choiceOpts(r, an[1], an[2]), "", t()));

    // 6 · Feelings.
    const feels = [["HAPPY", "😊", ["😢", "😠"]], ["SLEEPY", "😴", ["😊", "😮"]], ["SAD", "😢", ["😊", "😆"]]];
    const fe = pick(r, feels);
    qs.push(qChoice("Feelings", `Tap the ${fe[0]} face!`, choiceOpts(r, fe[1], fe[2]), "", t()));

    return qs;
  }

  function sheetMiddle(r, themes) {
    const t = () => pick(r, themes);
    const qs = [];

    // 1 · Letter hunt — first letter of a themed word, letters hiding in the scene.
    const th1 = t();
    const word = pick(r, th1.words);
    const L = word[0];
    const wrongL = shuffle(r, "ABCDEFGHKMNPRSTW".split("").filter((x) => x !== L)).slice(0, 4);
    const slots = shuffle(r, SLOTS);
    const grid = shuffle(r,
      [L, L, L].map((x, i) => ({ label: x, match: true, pos: slots[i] }))
        .concat(wrongL.map((x, j) => ({ label: x, match: false, pos: slots[3 + j] }))));
    qs.push(qTapAll("Letters", `${WORD_PIC[word] || th1.emoji} ${word[0]}${word.slice(1).toLowerCase()} starts with ${L}. Tap ALL the ${L}s!`, grid, th1, { scatter: true }));

    // 2 · Counting — count the things in the scene, pick the numeral.
    const th2 = t();
    const n = 3 + Math.floor(r() * 5); // 3-7
    const em = pick(r, th2.things);
    qs.push({
      ...qChoice("Counting", `How many ${th2.thing} can you see?`,
        choiceOpts(r, n, shuffle(r, [n - 1, n + 1, n + 2].filter((x) => x > 0)).slice(0, 2)), "", th2),
      decor: scatterItems(r, em, n).map((x) => ({ label: x.label, pos: x.pos })),
    });

    // 3 · Patterns — what comes next?
    const [a, b] = pick(r, [["🔴", "🔵"], ["🌟", "🌙"], ["🍎", "🍌"], ["⚪", "🟩"]]);
    qs.push(qChoice("Patterns", "What comes NEXT?", choiceOpts(r, b, [a, "🟣"]),
      `<div class="ws-swarm">${[a, b, a, b, a].join(" ")} <span class="ws-blank">?</span></div>`, t()));

    // 4 · Rhyme time.
    const rhymes = [
      ["CAT", "HAT", ["DOG", "SUN"]],
      ["STAR", "CAR", ["MOON", "FISH"]],
      ["TENT", "BENT", ["FIRE", "TREE"]],
      ["SHELL", "BELL", ["CRAB", "WAVE"]],
    ];
    const rh = pick(r, rhymes);
    qs.push(qChoice("Rhymes", `Which word rhymes with ${rh[0]}?`, choiceOpts(r, rh[1], rh[2]), "", t()));

    // 5 · Odd one out.
    const odd = pick(r, [["⚪", "🔺"], ["🐟", "🌳"], ["🍎", "🚗"]]);
    qs.push(qChoice("Thinking", "Tap the ODD ONE OUT!",
      shuffle(r, [{ label: odd[1], correct: true }].concat(range(3).map(() => ({ label: odd[0], correct: false })))), "", t()));

    // 6 · Float or sink (themed).
    const th6 = t();
    const items = shuffle(r, shuffle(r, th6.floaters).slice(0, 2).map((f) => ({ label: f[0], name: f[1], bucket: 0 }))
      .concat(shuffle(r, th6.sinkers).slice(0, 2).map((s) => ({ label: s[0], name: s[1], bucket: 1 }))));
    qs.push(qSort("Science", "Does it FLOAT or SINK?", ["🌊 Floats", "⬇️ Sinks"], items, th6));

    return qs;
  }

  function sheetEldest(r, themes) {
    const t = () => pick(r, themes);
    const qs = [];

    // 1 · Build the word from tiles (with a picture hint).
    const th1 = t();
    const w = pick(r, th1.words);
    const q1 = qBuild("English · phonics", "Build the word:", w, r, th1);
    q1.visual = `<div class="ws-pic">${WORD_PIC[w] || th1.emoji}</div>`;
    qs.push(q1);

    // 2 · Addition within 20 — watch the hops on the number line.
    const th2 = t();
    const a = 4 + Math.floor(r() * 8), b = 2 + Math.floor(r() * 7);
    qs.push(qChoice("Maths · addition",
      `You got ${a} ${th2.thing}, then ${b} more. How many altogether?`,
      choiceOpts(r, a + b, [a + b - 1, a + b + 2]),
      numberLineSVG(a, b) + `<div class="ws-sum">${a} + ${b} = <span class="ws-blank">?</span></div>`, th2));

    // 3 · Missing number on the path to 100.
    const start = 10 + Math.floor(r() * 80);
    qs.push(qChoice("Maths · number", "Which number is missing?",
      choiceOpts(r, start + 2, [start + 3, start + 1]),
      `<div class="ws-sum">${start}, ${start + 1}, <span class="ws-blank">?</span>, ${start + 3}</div>`, t()));

    // 4 · Subtraction — hops backwards.
    const th4 = t();
    const c2 = 9 + Math.floor(r() * 8), d = 2 + Math.floor(r() * 6);
    qs.push(qChoice("Maths · subtraction",
      `${c2} ${th4.thing}, then ${d} ${th4.id === "crosscountry" ? "done" : "gone"}. How many left?`,
      choiceOpts(r, c2 - d, [c2 - d + 1, c2 - d - 1].filter((x) => x >= 0)),
      numberLineSVG(c2, -d) + `<div class="ws-sum">${c2} − ${d} = <span class="ws-blank">?</span></div>`, th4));

    // 5 · Read the clock.
    const hour = 1 + Math.floor(r() * 11);
    const half = r() > 0.5;
    const label = (h, hf) => (hf ? `half past ${h}` : `${h} o'clock`);
    qs.push(qChoice("Maths · time", "What time is it?",
      choiceOpts(r, label(hour, half), [label((hour % 12) + 1, half), label(hour, !half)]),
      clockSVG(hour, half), t()));

    // 6 · Living or not living.
    const th6 = t();
    const living = shuffle(r, [["🌳", "tree"], ["🐟", "fish"], ["🦘", "kangaroo"], ["🌱", "seedling"]]).slice(0, 2);
    const notLiving = shuffle(r, [["🪨", "rock"], ["⛺", "tent"], ["🚗", "car"], ["⏱️", "stopwatch"]]).slice(0, 2);
    const items = shuffle(r, living.map((x) => ({ label: x[0], name: x[1], bucket: 0 }))
      .concat(notLiving.map((x) => ({ label: x[0], name: x[1], bucket: 1 }))));
    qs.push(qSort("Science", "LIVING or NOT living?", ["🌱 Living", "🧱 Not living"], items, th6));

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
  function render(host, opts) {
    const { child, week, contexts, onExit, onFinish, saveBest } = opts;
    const GFX = window.SPARK_FX;
    const burstCols = [child.colour, "#f2b01e", "#2f9e57", "#e8833a"];
    let attempt = 0;
    let qs, idx, mistakes, stars, state;
    let sceneFX = null, confettiFX = null;

    function killFX() {
      if (sceneFX) { sceneFX.destroy(); sceneFX = null; }
      if (confettiFX) { confettiFX.destroy(); confettiFX = null; }
    }
    // After painting, replace the SVG backdrop with the GPU scene when available.
    function mountSceneFX() {
      if (sceneFX) { sceneFX.destroy(); sceneFX = null; }
      if (!GFX || !GFX.available) return;
      const el = host.querySelector(".ws-scene[data-theme]");
      if (el) sceneFX = GFX.scene(el, el.dataset.theme);
    }
    function burstAt(el) {
      if (!GFX) return;
      const r = el.getBoundingClientRect();
      GFX.burst(r.left + r.width / 2, r.top + r.height / 2, burstCols);
    }

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

    function sceneBlock(q, extraItems) {
      const th = q.theme;
      if (!th || !SCENES[th.id]) return "";
      const spots = (q.scatter ? q.items : q.decor || [])
        .map((it, i) => {
          if (!it.pos) return "";
          const interactive = q.scatter;
          const hit = interactive && state.found && state.found.has(i);
          const numBadge = q.countMode && hit ? `<span class="ws-n">${[...state.found].indexOf(i) + 1}</span>` : "";
          return interactive
            ? `<button class="ws-spot ${hit ? "hit" : ""}" data-ws="tap" data-i="${i}" style="left:${it.pos[0]}%;top:${it.pos[1]}%">${esc(it.label)}${numBadge}</button>`
            : `<span class="ws-spot ws-spot-decor" style="left:${it.pos[0]}%;top:${it.pos[1]}%">${esc(it.label)}</span>`;
        })
        .join("");
      return `<div class="ws-scene" data-theme="${esc(th.id)}">${SCENES[th.id]}${spots}${extraItems || ""}</div>`;
    }

    function head(q) {
      const th = q.theme;
      return `<div class="ws-head" style="--kid:${child.colour};--kid-bg:${child.accent}">
          <div class="ws-topline">
            <button class="back" data-ws="exit">‹ ${esc(child.name)}</button>
            <button class="ws-mute" data-ws="mute" aria-label="Toggle sound">${FX.isMuted() ? "🔇" : "🔊"}</button>
          </div>
          ${dots()}
          ${th ? `<div class="ws-frame">${th.emoji} ${esc(th.label)}</div>` : ""}
          <div class="ws-area">${esc(q.area)}</div>
          <div class="ws-prompt">${q.prompt ? esc(q.prompt) : ""}</div>
        </div>`;
    }

    function paint() {
      const q = qs[idx];
      let body = "";
      if (q.kind === "choice") {
        body = `${sceneBlock(q)}${q.visual || ""}<div class="ws-opts">${q.options
          .map((o, i) =>
            `<button class="ws-opt ${o.cls || ""} ${String(o.label).length > 4 ? "ws-txt" : ""}" data-ws="choice" data-i="${i}">${esc(o.label)}</button>`)
          .join("")}</div>`;
      } else if (q.kind === "tapall") {
        state.found = state.found || new Set();
        const total = q.items.filter((x) => x.match).length;
        if (q.scatter) {
          body = `${sceneBlock(q)}
            <div class="ws-note">${q.countMode ? `Counted: <b>${state.found.size}</b>` : `Found ${state.found.size} of ${total}`}</div>`;
        } else {
          body = `<div class="ws-grid">${q.items
            .map((it, i) =>
              `<button class="ws-cell ${state.found.has(i) ? "hit" : ""}" data-ws="tap" data-i="${i}">
                 ${esc(it.label)}${q.countMode && state.found.has(i) ? `<span class="ws-n">${[...state.found].indexOf(i) + 1}</span>` : ""}
               </button>`)
            .join("")}</div>
            <div class="ws-note">${q.countMode ? `Counted: <b>${state.found.size}</b>` : `Found ${state.found.size} of ${total}`}</div>`;
        }
      } else if (q.kind === "build") {
        state.placed = state.placed || [];
        state.used = state.used || new Set();
        body = `${sceneBlock(q)}${q.visual || ""}<div class="ws-word">${q.word
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
        body = `${sceneBlock(q)}<div class="ws-sort-item">${esc(it.label)}<div class="ws-sort-name">${esc(it.name)}</div></div>
          <div class="ws-buckets">${q.buckets
            .map((b, i) => `<button class="ws-bucket" data-ws="bucket" data-i="${i}">${esc(b)}</button>`)
            .join("")}</div>
          <div class="ws-note">${state.at + 1} of ${q.items.length}</div>`;
      }
      host.innerHTML = `${head(q)}<div class="ws-body">${body}</div>`;
      mountSceneFX();
    }

    function celebrate(el) {
      el.classList.add("pop");
      burstAt(el);
      FX.correct();
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
      FX.wrong();
      el.classList.add("shake");
      setTimeout(() => el.classList.remove("shake"), 400);
    }

    function finish() {
      if (sceneFX) { sceneFX.destroy(); sceneFX = null; }
      if (saveBest) saveBest(stars, qs.length);
      if (onFinish) onFinish(stars, qs.length);
      FX.fanfare();
      const useFX = GFX && GFX.available && !GFX.reduced;
      if (useFX) confettiFX = GFX.confetti(burstCols);
      const burst = useFX
        ? ""
        : range(14)
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
      if (act === "exit") { killFX(); return onExit(); }
      if (act === "again") { attempt++; killFX(); return start(); }
      if (act === "mute") {
        FX.toggle();
        el.textContent = FX.isMuted() ? "🔇" : "🔊";
        return;
      }
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
          burstAt(el);
          FX.tick();
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
          FX.tick();
          if (state.placed.length >= q.word.length) {
            paint();
            setTimeout(() => advance(), 650);
          } else paint();
        } else wrong(el);
      } else if (act === "bucket" && q.kind === "sort") {
        const it = q.items[state.at];
        if (+el.dataset.i === it.bucket) {
          state.at++;
          FX.tick();
          if (state.at >= q.items.length) {
            el.classList.add("right");
            setTimeout(() => advance(), 450);
          } else paint();
        } else wrong(el);
      }
    }

    host.addEventListener("click", onTap);
    start();
    return {
      destroy() {
        killFX();
        host.removeEventListener("click", onTap);
      },
    };
  }

  window.SPARK_SHEETS = { buildSheet, render };
})();
