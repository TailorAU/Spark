/*
 * Spark — illustrated sprite library (SPARK_ART)
 * A consistent hand-drawn SVG object set for the worksheets: soft gradients,
 * white highlights, rounded ink outlines — one art direction across every
 * theme. Plus "Sparky", the little flame mascot, with moods.
 * No assets, no fonts, no emoji dependence for game objects. Each sprite is
 * generated with unique gradient ids so many can coexist in one DOM.
 *
 *   SPARK_ART.has(name)          — is `name` a drawn sprite?
 *   SPARK_ART.sprite(name, px)   — svg string at px size (falls back to text)
 *   SPARK_ART.sparky(mood)       — mascot svg ("idle" | "cheer" | "oops")
 */
(function () {
  "use strict";
  let uid = 0;

  const INK = "#20303a";

  // Small helpers -------------------------------------------------------------
  function lg(id, c1, c2, rot) {
    return `<linearGradient id="${id}" x1="0" y1="0" x2="${rot ? 1 : 0}" y2="1">
      <stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient>`;
  }
  const shine = (cx, cy, rx, ry, o) =>
    `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="#fff" opacity="${o || 0.55}" />`;

  // Sprite bodies: functions of a unique gradient prefix `u`.
  const LIB = {
    shell: (u) => `${lg(u + "a", "#ffd9e8", "#e88aa9")}
      <path d="M32 56 C14 50 8 34 10 20 C20 26 26 26 32 14 C38 26 44 26 54 20 C56 34 50 50 32 56 Z" fill="url(#${u}a)" stroke="${INK}" stroke-width="2.5"/>
      <path d="M32 54 L32 18 M20 48 L26 22 M44 48 L38 22" stroke="#c9688c" stroke-width="2" fill="none" stroke-linecap="round"/>
      ${shine(24, 24, 5, 3)}`,
    fish: (u) => `${lg(u + "a", "#ffb35c", "#ef7d3a", 1)}
      <path d="M8 32 L20 22 L20 42 Z" fill="url(#${u}a)" stroke="${INK}" stroke-width="2.5"/>
      <ellipse cx="36" cy="32" rx="18" ry="13" fill="url(#${u}a)" stroke="${INK}" stroke-width="2.5"/>
      <path d="M34 20 Q40 12 46 20" fill="none" stroke="${INK}" stroke-width="2.5"/>
      <circle cx="44" cy="29" r="2.6" fill="${INK}"/>
      <path d="M30 32 Q34 38 40 36" stroke="#c95f22" stroke-width="2" fill="none"/>
      ${shine(32, 25, 6, 3)}
      <circle cx="58" cy="22" r="2.5" fill="#bfe6f5"/><circle cx="60" cy="14" r="1.8" fill="#bfe6f5"/>`,
    coconut: (u) => `${lg(u + "a", "#9a6b43", "#6b4426")}
      <circle cx="32" cy="34" r="20" fill="url(#${u}a)" stroke="${INK}" stroke-width="2.5"/>
      <path d="M18 24 Q32 14 46 24 M16 34 Q20 30 24 33 M40 33 Q44 30 48 34" stroke="#54331c" stroke-width="2" fill="none"/>
      <circle cx="27" cy="38" r="2.4" fill="#3c2413"/><circle cx="37" cy="38" r="2.4" fill="#3c2413"/><circle cx="32" cy="46" r="2.4" fill="#3c2413"/>
      ${shine(24, 26, 5, 3, 0.35)}`,
    hibiscus: (u) => `${lg(u + "a", "#ff9db8", "#e8557f")}
      ${[0, 72, 144, 216, 288].map((r) => `<ellipse cx="32" cy="20" rx="8" ry="13" fill="url(#${u}a)" stroke="${INK}" stroke-width="2" transform="rotate(${r} 32 32)"/>`).join("")}
      <circle cx="32" cy="32" r="6" fill="#ffd54d" stroke="${INK}" stroke-width="2"/>
      ${shine(29, 30, 2, 1.4)}`,
    boat: (u) => `${lg(u + "a", "#ff8b5c", "#e05a2b")}${lg(u + "b", "#ffffff", "#d8e8f0")}
      <path d="M10 42 L54 42 L46 54 L18 54 Z" fill="url(#${u}a)" stroke="${INK}" stroke-width="2.5"/>
      <line x1="32" y1="10" x2="32" y2="42" stroke="${INK}" stroke-width="2.5"/>
      <path d="M32 12 L50 38 L32 38 Z" fill="url(#${u}b)" stroke="${INK}" stroke-width="2.5"/>
      <path d="M30 16 L16 38 L30 38 Z" fill="url(#${u}b)" stroke="${INK}" stroke-width="2.5"/>`,
    marshmallow: (u) => `${lg(u + "a", "#ffffff", "#efe3d4")}
      <line x1="32" y1="30" x2="32" y2="58" stroke="#9a6b43" stroke-width="3" stroke-linecap="round"/>
      <rect x="18" y="10" width="28" height="24" rx="9" fill="url(#${u}a)" stroke="${INK}" stroke-width="2.5"/>
      <path d="M20 14 Q32 8 44 14" stroke="#d9a066" stroke-width="3" fill="none" stroke-linecap="round"/>
      ${shine(26, 18, 4, 2.6)}`,
    star: (u) => `${lg(u + "a", "#ffe27a", "#f2b01e")}
      <path d="M32 8 L38.8 23.6 L55 25.4 L42.8 36.4 L46.4 52.6 L32 44 L17.6 52.6 L21.2 36.4 L9 25.4 L25.2 23.6 Z" fill="url(#${u}a)" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/>
      <circle cx="27" cy="30" r="2" fill="${INK}"/><circle cx="37" cy="30" r="2" fill="${INK}"/>
      <path d="M27 37 Q32 41 37 37" stroke="${INK}" stroke-width="2" fill="none" stroke-linecap="round"/>
      ${shine(24, 22, 3, 2)}`,
    pine: (u) => `${lg(u + "a", "#5fae6b", "#2f7a44")}
      <rect x="28" y="46" width="8" height="12" rx="2" fill="#8a5a2b" stroke="${INK}" stroke-width="2"/>
      <path d="M32 6 L46 24 L38 24 L50 38 L42 38 L54 50 L10 50 L22 38 L14 38 L26 24 L18 24 Z" fill="url(#${u}a)" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/>
      ${shine(26, 20, 3, 2, 0.4)}`,
    campfire: (u) => `${lg(u + "a", "#ffd54d", "#ff7a2e")}
      <path d="M14 52 L50 44 M14 44 L50 52" stroke="#8a5a2b" stroke-width="5" stroke-linecap="round"/>
      <path d="M32 10 C40 20 46 26 44 36 C43 44 38 48 32 48 C26 48 21 44 20 36 C18 26 24 20 32 10 Z" fill="url(#${u}a)" stroke="${INK}" stroke-width="2.5"/>
      <path d="M32 26 C36 31 38 33 37 38 C36 42 34 44 32 44 C30 44 28 42 27 38 C26 33 28 31 32 26 Z" fill="#fff3c2"/>`,
    boot: (u) => `${lg(u + "a", "#b97a45", "#8a5427")}
      <path d="M18 10 L38 10 L38 34 L52 42 Q56 46 52 52 L18 52 Z" fill="url(#${u}a)" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/>
      <rect x="16" y="48" width="40" height="8" rx="4" fill="#54331c" stroke="${INK}" stroke-width="2"/>
      <path d="M22 16 L34 16 M22 22 L34 22 M22 28 L34 28" stroke="#f0d9b8" stroke-width="2.4" stroke-linecap="round"/>`,
    medal: (u) => `${lg(u + "a", "#ffe27a", "#e8a51e")}
      <path d="M24 6 L32 24 L40 6 Z" fill="#e34f4f" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/>
      <path d="M40 6 L32 24 L48 14 Z" fill="#4a90d9" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/>
      <circle cx="32" cy="40" r="16" fill="url(#${u}a)" stroke="${INK}" stroke-width="2.5"/>
      <path d="M32 31 L34.6 37 L41 37.6 L36.3 42 L37.7 48.4 L32 45 L26.3 48.4 L27.7 42 L23 37.6 L29.4 37 Z" fill="#fff3c2" stroke="#c98a12" stroke-width="1.5" stroke-linejoin="round"/>`,
    shoe: (u) => `${lg(u + "a", "#6db2e8", "#3a7fc4")}
      <path d="M10 42 Q10 26 24 26 L34 26 Q40 34 52 38 Q58 40 56 48 L12 48 Q10 46 10 42 Z" fill="url(#${u}a)" stroke="${INK}" stroke-width="2.5"/>
      <rect x="10" y="46" width="48" height="8" rx="4" fill="#fff" stroke="${INK}" stroke-width="2"/>
      <path d="M26 28 L30 36 M32 27 L36 34" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/>
      <path d="M12 40 Q20 36 26 40" stroke="#2b5f95" stroke-width="2" fill="none"/>`,
    stopwatch: (u) => `${lg(u + "a", "#eef4f8", "#c9d8e2")}
      <rect x="28" y="6" width="8" height="6" rx="2" fill="${INK}"/>
      <line x1="45" y1="14" x2="50" y2="19" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>
      <circle cx="32" cy="36" r="20" fill="url(#${u}a)" stroke="${INK}" stroke-width="2.5"/>
      <circle cx="32" cy="36" r="15" fill="#fff" stroke="#9fb4c2" stroke-width="1.5"/>
      <line x1="32" y1="36" x2="32" y2="25" stroke="#e34f4f" stroke-width="2.6" stroke-linecap="round"/>
      <line x1="32" y1="36" x2="39" y2="40" stroke="${INK}" stroke-width="2.4" stroke-linecap="round"/>
      <circle cx="32" cy="36" r="2" fill="${INK}"/>`,
    flag: (u) => `${lg(u + "a", "#ff7a6b", "#e3372e")}
      <line x1="18" y1="8" x2="18" y2="56" stroke="${INK}" stroke-width="3.5" stroke-linecap="round"/>
      <path d="M20 10 Q32 6 40 10 Q48 14 54 10 L54 30 Q48 34 40 30 Q32 26 20 30 Z" fill="url(#${u}a)" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/>
      ${shine(28, 15, 4, 2, 0.35)}`,
    drop: (u) => `${lg(u + "a", "#9fd8f5", "#3a92d4")}
      <path d="M32 6 C42 22 50 30 50 40 C50 50 42 57 32 57 C22 57 14 50 14 40 C14 30 22 22 32 6 Z" fill="url(#${u}a)" stroke="${INK}" stroke-width="2.5"/>
      ${shine(24, 36, 4, 6)}`,
    apple: (u) => `${lg(u + "a", "#ff8a80", "#e33e30")}
      <path d="M32 18 Q34 10 40 8" stroke="#6b4426" stroke-width="3" fill="none" stroke-linecap="round"/>
      <path d="M36 14 Q44 10 48 16 Q42 20 36 16 Z" fill="#5fae6b" stroke="${INK}" stroke-width="2"/>
      <path d="M32 20 C20 12 8 22 12 38 C15 50 24 58 32 56 C40 58 49 50 52 38 C56 22 44 12 32 20 Z" fill="url(#${u}a)" stroke="${INK}" stroke-width="2.5"/>
      ${shine(22, 30, 4, 6)}`,
    book: (u) => `${lg(u + "a", "#ffffff", "#e7ded0")}
      <path d="M32 14 C24 8 14 8 8 12 L8 50 C14 46 24 46 32 52 C40 46 50 46 56 50 L56 12 C50 8 40 8 32 14 Z" fill="url(#${u}a)" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/>
      <line x1="32" y1="14" x2="32" y2="52" stroke="${INK}" stroke-width="2"/>
      <path d="M14 20 L26 18 M14 27 L26 25 M14 34 L26 32 M38 18 L50 20 M38 25 L50 27 M38 32 L50 34" stroke="#9fb4c2" stroke-width="2" stroke-linecap="round"/>`,
    teddy: (u) => `${lg(u + "a", "#c99359", "#a06c35")}
      <circle cx="18" cy="16" r="8" fill="url(#${u}a)" stroke="${INK}" stroke-width="2.5"/>
      <circle cx="46" cy="16" r="8" fill="url(#${u}a)" stroke="${INK}" stroke-width="2.5"/>
      <circle cx="18" cy="16" r="3.4" fill="#e8c99a"/><circle cx="46" cy="16" r="3.4" fill="#e8c99a"/>
      <circle cx="32" cy="34" r="22" fill="url(#${u}a)" stroke="${INK}" stroke-width="2.5"/>
      <ellipse cx="32" cy="42" rx="9" ry="7" fill="#e8c99a"/>
      <circle cx="25" cy="28" r="2.6" fill="${INK}"/><circle cx="39" cy="28" r="2.6" fill="${INK}"/>
      <path d="M32 38 L32 42 M28 45 Q32 48 36 45" stroke="${INK}" stroke-width="2" fill="none" stroke-linecap="round"/>
      <ellipse cx="32" cy="39" rx="3" ry="2.4" fill="${INK}"/>`,
    sock: (u) => `${lg(u + "a", "#8fd3f4", "#4a9fd4")}
      <path d="M22 8 L42 8 L42 34 Q42 40 47 43 Q54 48 51 54 Q47 60 39 56 L26 46 Q22 42 22 36 Z" fill="url(#${u}a)" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/>
      <rect x="20" y="6" width="24" height="8" rx="3" fill="#fff" stroke="${INK}" stroke-width="2"/>
      <path d="M24 22 L42 22 M24 29 L42 29" stroke="#fff" stroke-width="3"/>`,
    spoon: (u) => `${lg(u + "a", "#e6edf2", "#b7c6d1")}
      <ellipse cx="32" cy="17" rx="11" ry="13" fill="url(#${u}a)" stroke="${INK}" stroke-width="2.5"/>
      <rect x="29" y="28" width="6" height="30" rx="3" fill="url(#${u}a)" stroke="${INK}" stroke-width="2.5"/>
      ${shine(28, 12, 3, 4, 0.7)}`,
    rock: (u) => `${lg(u + "a", "#a8b2ba", "#78838c")}
      <path d="M14 48 L10 36 L20 22 L38 16 L52 26 L54 42 L44 52 L22 54 Z" fill="url(#${u}a)" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/>
      <path d="M20 24 L34 34 L52 28 M34 34 L30 52" stroke="#5f6a72" stroke-width="2" fill="none"/>
      ${shine(24, 28, 4, 3, 0.3)}`,
    key: (u) => `${lg(u + "a", "#ffe27a", "#e8a51e")}
      <circle cx="20" cy="20" r="12" fill="none" stroke="url(#${u}a)" stroke-width="7"/>
      <circle cx="20" cy="20" r="12" fill="none" stroke="${INK}" stroke-width="2" opacity="0.5"/>
      <path d="M28 28 L50 50 M44 44 L52 38 M38 38 L45 32" stroke="url(#${u}a)" stroke-width="7" stroke-linecap="round"/>
      <path d="M28 28 L50 50" stroke="${INK}" stroke-width="2" opacity="0.4"/>`,
    leaf: (u) => `${lg(u + "a", "#8fd08a", "#4d9e54")}
      <path d="M50 12 C28 12 12 28 14 50 C36 52 52 36 50 12 Z" fill="url(#${u}a)" stroke="${INK}" stroke-width="2.5"/>
      <path d="M46 16 Q30 30 17 47 M36 22 L38 32 M28 30 L32 40" stroke="#2f7a44" stroke-width="2" fill="none" stroke-linecap="round"/>`,
    duck: (u) => `${lg(u + "a", "#ffe27a", "#f2c31e")}
      <circle cx="42" cy="22" r="11" fill="url(#${u}a)" stroke="${INK}" stroke-width="2.5"/>
      <path d="M52 22 L60 24 L52 27 Z" fill="#ff8a3d" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>
      <circle cx="45" cy="19" r="2.2" fill="${INK}"/>
      <path d="M12 34 Q10 50 26 52 L40 52 Q52 50 50 38 Q42 42 32 40 Q18 38 12 34 Z" fill="url(#${u}a)" stroke="${INK}" stroke-width="2.5"/>
      <path d="M18 42 Q26 46 34 44" stroke="#d9a018" stroke-width="2" fill="none"/>`,
    peg: (u) => `${lg(u + "a", "#e6edf2", "#9fb0bc")}
      <path d="M24 8 L40 8 L36 14 L36 44 L32 58 L28 44 L28 14 Z" fill="url(#${u}a)" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/>
      <path d="M24 8 Q18 14 22 20 L28 16" fill="url(#${u}a)" stroke="${INK}" stroke-width="2.5"/>`,
    stick: (u) => `${lg(u + "a", "#b97a45", "#8a5427")}
      <path d="M10 50 Q28 36 40 24 Q46 18 54 12" stroke="url(#${u}a)" stroke-width="8" fill="none" stroke-linecap="round"/>
      <path d="M34 30 L42 34 M44 20 L52 24" stroke="url(#${u}a)" stroke-width="6" stroke-linecap="round"/>
      <path d="M10 50 Q28 36 40 24" stroke="#6b4426" stroke-width="2" fill="none" opacity="0.5"/>`,
    sponge: (u) => `${lg(u + "a", "#ffe98a", "#e8c53a")}
      <rect x="8" y="18" width="48" height="30" rx="8" fill="url(#${u}a)" stroke="${INK}" stroke-width="2.5"/>
      <circle cx="20" cy="28" r="2.6" fill="#c9a428"/><circle cx="34" cy="38" r="3" fill="#c9a428"/>
      <circle cx="44" cy="26" r="2.2" fill="#c9a428"/><circle cx="26" cy="42" r="2" fill="#c9a428"/>
      ${shine(20, 23, 6, 2.4, 0.4)}`,
    ball: (u) => `${lg(u + "a", "#ffffff", "#d8e2e8")}
      <circle cx="32" cy="32" r="22" fill="url(#${u}a)" stroke="${INK}" stroke-width="2.5"/>
      <path d="M32 24 L39 29 L36.4 37 L27.6 37 L25 29 Z" fill="${INK}"/>
      <path d="M32 10 L32 24 M39 29 L52 24 M36.4 37 L44 48 M27.6 37 L20 48 M25 29 L12 24" stroke="${INK}" stroke-width="2"/>`,
    tent: (u) => `${lg(u + "a", "#ff9d5c", "#e8702b")}
      <path d="M32 10 L58 52 L6 52 Z" fill="url(#${u}a)" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/>
      <path d="M32 10 L32 52 M32 52 L24 52 L32 30 L40 52 Z" fill="#b85218" stroke="${INK}" stroke-width="2"/>
      <path d="M32 30 L40 52 L24 52 Z" fill="#8f3d10"/>`,
    house: (u) => `${lg(u + "a", "#f6e3c1", "#e3c895")}
      <path d="M10 30 L32 10 L54 30 Z" fill="#d1603d" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/>
      <rect x="14" y="30" width="36" height="24" rx="2" fill="url(#${u}a)" stroke="${INK}" stroke-width="2.5"/>
      <rect x="27" y="38" width="10" height="16" rx="2" fill="#8a5a2b" stroke="${INK}" stroke-width="2"/>
      <rect x="18" y="35" width="7" height="7" rx="1.5" fill="#9fd8ef" stroke="${INK}" stroke-width="1.8"/>
      <rect x="40" y="35" width="7" height="7" rx="1.5" fill="#9fd8ef" stroke="${INK}" stroke-width="1.8"/>`,
    sandcastle: (u) => `${lg(u + "a", "#f2dca6", "#dcbd75")}
      <rect x="10" y="34" width="14" height="22" rx="2" fill="url(#${u}a)" stroke="${INK}" stroke-width="2.5"/>
      <rect x="40" y="34" width="14" height="22" rx="2" fill="url(#${u}a)" stroke="${INK}" stroke-width="2.5"/>
      <rect x="22" y="40" width="20" height="16" fill="url(#${u}a)" stroke="${INK}" stroke-width="2.5"/>
      <path d="M10 34 L10 28 L14 32 L17 28 L20 32 L24 28 L24 34 Z" fill="url(#${u}a)" stroke="${INK}" stroke-width="2"/>
      <path d="M40 34 L40 28 L44 32 L47 28 L50 32 L54 28 L54 34 Z" fill="url(#${u}a)" stroke="${INK}" stroke-width="2"/>
      <line x1="32" y1="40" x2="32" y2="28" stroke="${INK}" stroke-width="2"/>
      <path d="M32 28 L40 31 L32 34 Z" fill="#e34f4f" stroke="${INK}" stroke-width="1.8"/>`,
    kangaroo: (u) => `${lg(u + "a", "#c98a59", "#a06835")}
      <path d="M20 54 Q10 52 12 44 Q14 38 22 38 Q20 26 30 20 Q40 14 48 20 Q54 24 52 32 Q50 40 40 42 L38 54 Z" fill="url(#${u}a)" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/>
      <path d="M44 18 L46 8 L50 16 M52 20 L58 14 L56 22" fill="url(#${u}a)" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/>
      <circle cx="46" cy="24" r="2.2" fill="${INK}"/>
      <path d="M12 44 Q4 46 6 52" stroke="${INK}" stroke-width="2.5" fill="none" stroke-linecap="round"/>
      <ellipse cx="30" cy="44" rx="7" ry="9" fill="#e0b98c"/>`,
    basket: (u) => `${lg(u + "a", "#c99359", "#96682f")}
      <path d="M8 24 L56 24 L50 54 Q49 58 44 58 L20 58 Q15 58 14 54 Z" fill="url(#${u}a)" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/>
      <path d="M14 32 L50 32 M16 40 L48 40 M18 48 L46 48" stroke="#6b4426" stroke-width="2"/>
      <path d="M22 34 L26 46 M32 34 L32 46 M42 34 L38 46" stroke="#6b4426" stroke-width="2" opacity="0.5"/>
      <path d="M20 24 Q32 6 44 24" fill="none" stroke="${INK}" stroke-width="3.5" stroke-linecap="round"/>`,
  };

  function has(name) {
    return Object.prototype.hasOwnProperty.call(LIB, name);
  }

  function sprite(name, px) {
    const size = px || 44;
    if (!has(name)) return null;
    const u = "sa" + (uid++) + "_";
    return `<svg class="art" width="${size}" height="${size}" viewBox="0 0 64 64" aria-hidden="true"><defs></defs>${LIB[name](u)}</svg>`;
  }

  // Sparky — the flame mascot. Moods: idle | cheer | oops.
  function sparky(mood, px) {
    const size = px || 64;
    const u = "sk" + (uid++) + "_";
    const m = mood || "idle";
    const eyes =
      m === "oops"
        ? `<path d="M24 30 L30 33 M40 30 L34 33" stroke="${INK}" stroke-width="2.6" stroke-linecap="round"/>`
        : `<circle cx="26.5" cy="31" r="3.2" fill="${INK}" class="sparky-eye"/><circle cx="37.5" cy="31" r="3.2" fill="${INK}" class="sparky-eye"/>
           <circle cx="27.6" cy="29.8" r="1.1" fill="#fff"/><circle cx="38.6" cy="29.8" r="1.1" fill="#fff"/>`;
    const mouth =
      m === "cheer"
        ? `<path d="M25 38 Q32 47 39 38 Z" fill="#fff" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>`
        : m === "oops"
          ? `<ellipse cx="32" cy="40" rx="3.4" ry="4.2" fill="${INK}"/>`
          : `<path d="M26 38 Q32 43 38 38" stroke="${INK}" stroke-width="2.4" fill="none" stroke-linecap="round"/>`;
    const arms =
      m === "cheer"
        ? `<path d="M14 30 Q6 22 10 14 M50 30 Q58 22 54 14" stroke="${INK}" stroke-width="3" fill="none" stroke-linecap="round"/>`
        : `<path d="M14 36 Q8 40 10 46 M50 36 Q56 40 54 46" stroke="${INK}" stroke-width="3" fill="none" stroke-linecap="round"/>`;
    return `<svg class="sparky sparky-${m}" width="${size}" height="${size}" viewBox="0 0 64 64" aria-hidden="true">
      ${lg(u + "a", "#ffd54d", "#ff8a3d")}
      <path d="M32 4 C42 16 50 23 48 36 C46.5 47 40 54 32 54 C24 54 17.5 47 16 36 C14 23 22 16 32 4 Z"
        fill="url(#${u}a)" stroke="${INK}" stroke-width="2.6"/>
      <path d="M32 16 C37 22 40 26 39 33 C38 39 35.5 42 32 42 C28.5 42 26 39 25 33 C24 26 27 22 32 16 Z" fill="#fff3c2" opacity="0.85"/>
      ${arms}${eyes}${mouth}</svg>`;
  }

  window.SPARK_ART = { has, sprite, sparky };
})();
