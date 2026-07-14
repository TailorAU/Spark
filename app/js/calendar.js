/*
 * Spark — calendar hook (SPARK_CAL)
 * Offline ICS import: paste or open an .ics export and family calendar events
 * become life contexts that tailor each child's week — the same weave spine
 * as the built-in contexts. No backend, nothing leaves the device.
 *
 *   SPARK_CAL.parseICS(text)      -> [{ summary, date, until, allDay }]
 *   SPARK_CAL.classify(event)     -> { kind: "builtin"|"custom"|"skip", ... }
 *   SPARK_CAL.importEvents(evts)  -> { builtins, created, skipped, total }
 *
 * Deterministic by construction: context ids hash from (summary, date), weave
 * text is templated — no randomness, so worksheets and print packs stay
 * date-seeded and reproducible.
 */
(function () {
  "use strict";

  // Same FNV-1a family as the other modules — stable ids across imports.
  function hash(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return (h >>> 0).toString(36);
  }

  const pad = (n) => String(n).padStart(2, "0");
  const ymdLocal = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  function addDays(ymd, n) {
    const d = new Date(`${ymd}T12:00:00`);
    d.setDate(d.getDate() + n);
    return ymdLocal(d);
  }

  // --- ICS parsing -----------------------------------------------------------
  // Minimal, forgiving VEVENT reader: folded lines, escaped text, VALUE=DATE
  // all-day events (DTEND exclusive), UTC "Z" times converted to local. RRULE
  // is ignored — a repeating event imports as its first occurrence.
  function unescapeText(s) {
    return s
      .replace(/\\n/gi, " ")
      .replace(/\\,/g, ",")
      .replace(/\\;/g, ";")
      .replace(/\\\\/g, "\\")
      .trim();
  }

  function parseStamp(value, params) {
    const m = /^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})?(Z)?)?/.exec(value.trim());
    if (!m) return null;
    const [, y, mo, d, hh, mm, ss, z] = m;
    const allDay = /VALUE=DATE(?!-TIME)/i.test(params || "") || !hh;
    if (z) {
      // UTC time — convert to this device's local calendar date.
      const dt = new Date(Date.UTC(+y, +mo - 1, +d, +(hh || 0), +(mm || 0), +(ss || 0)));
      return { ymd: ymdLocal(dt), allDay };
    }
    return { ymd: `${y}-${mo}-${d}`, allDay };
  }

  function parseICS(text) {
    if (!text) return [];
    const lines = String(text).replace(/\r\n?/g, "\n").replace(/\n[ \t]/g, "").split("\n");
    const events = [];
    let cur = null;
    for (const line of lines) {
      const up = line.toUpperCase();
      if (up === "BEGIN:VEVENT") {
        cur = {};
        continue;
      }
      if (up === "END:VEVENT") {
        if (cur && cur.summary && cur.start) {
          let until = null;
          if (cur.end) {
            // DTEND is exclusive for all-day events.
            until = cur.end.allDay ? addDays(cur.end.ymd, -1) : cur.end.ymd;
            if (until < cur.start.ymd) until = null;
          }
          events.push({
            summary: cur.summary,
            date: cur.start.ymd,
            until: until && until !== cur.start.ymd ? until : null,
            allDay: cur.start.allDay,
          });
        }
        cur = null;
        continue;
      }
      if (!cur) continue;
      const idx = line.indexOf(":");
      if (idx < 0) continue;
      const key = line.slice(0, idx);
      const value = line.slice(idx + 1);
      const name = key.split(";")[0].toUpperCase();
      if (name === "SUMMARY") cur.summary = unescapeText(value);
      else if (name === "DTSTART") cur.start = parseStamp(value, key);
      else if (name === "DTEND") cur.end = parseStamp(value, key);
    }
    return events;
  }

  // --- classification --------------------------------------------------------
  // Keyword rules for the built-in contexts; everything else becomes a custom
  // context with a generic weave.
  const BUILTIN_RULES = [
    { id: "camping", re: /\bcamp(ing|out|site)?\b/i },
    { id: "crosscountry", re: /\b(cross[\s-]?country|xc)\b/i },
    { id: "fiji", re: /\bfiji\b/i },
  ];
  const RACE_RE = /\b(race|carnival|meet)\b/i;

  const EMOJI_RULES = [
    [/\bbirthday|bday\b/i, "🎂"],
    [/\bswim/i, "🏊"],
    [/\blibrary|book/i, "📚"],
    [/\bfooty|soccer|netball|sport|athletic/i, "⚽"],
    [/\bdoctor|dentist|hospital/i, "🩺"],
    [/\bholiday|trip|travel|flight/i, "✈️"],
    [/\bparty|celebrat/i, "🎈"],
    [/\bmarket|shop/i, "🛒"],
    [/\bvisit|grandma|grandpa|nana|pop\b/i, "🏡"],
  ];

  function emojiFor(summary) {
    for (const [re, e] of EMOJI_RULES) if (re.test(summary)) return e;
    return "📅";
  }

  // Generic weave bank keyed by the union of all framework area ids (plus the
  // finer writing/measurement keys the engine checks first). Parameterised by
  // the event label so any family event tailors any child's week.
  function weaveFor(label) {
    const L = label;
    return {
      english: `Talk about "${L}": who, where, when? Tell it in order — first, next, last.`,
      writing: `Write one sentence about "${L}". Capital letter and full stop!`,
      maths: `Find "${L}" on the calendar. How many sleeps between now and then? Count them.`,
      measurement: `How long until (or since) "${L}"? Count the days on a calendar together.`,
      science: `What will you see, hear and touch at "${L}"? Guess first, then check after.`,
      hass: `Who shares "${L}" with us? Talk about the people and places involved.`,
      hpe: `Get ready for "${L}": hop, skip and stretch like you're warming up for it.`,
      arts: `Draw a picture of "${L}" and give it a title.`,
      tech: `Plan "${L}" in steps: what happens first, then, last?`,
      identity: `How do you feel about "${L}"? Excited, curious, wiggly? Say why.`,
      community: `Who will be at "${L}"? Practise a friendly hello and a thank you.`,
      connectedness: `Who shares "${L}" with us? Practise taking turns when we're there.`,
      wellbeing: `Getting ready for "${L}": what does your body need? Sleep, food, water.`,
      learning: `What do you wonder about "${L}"? Ask one big question.`,
      activelearning: `Build or draw something you'll need for "${L}".`,
      communication: `Make up a little song about "${L}" with actions.`,
      communicating: `Tell a story about "${L}" — you start, someone else adds a line.`,
    };
  }

  function fmtDateLabel(ymd) {
    return new Date(`${ymd}T12:00:00`).toLocaleDateString("en-AU", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
  }

  function makeContext(ev) {
    const label = ev.summary.length > 60 ? ev.summary.slice(0, 57) + "…" : ev.summary;
    return {
      id: `cal-${hash(`${ev.summary}|${ev.date}`)}`,
      label,
      emoji: emojiFor(ev.summary),
      kind: "oneOff",
      childScope: "all",
      source: "calendar",
      date: ev.date,
      until: ev.until || null,
      blurb: `From your calendar — ${fmtDateLabel(ev.date)}${ev.until ? " to " + fmtDateLabel(ev.until) : ""}.`,
      weave: weaveFor(label),
    };
  }

  function classify(ev) {
    for (const rule of BUILTIN_RULES) {
      if (rule.re.test(ev.summary)) {
        const out = { kind: "builtin", id: rule.id };
        if (rule.id === "crosscountry" && RACE_RE.test(ev.summary)) out.raceDate = ev.date;
        return out;
      }
    }
    return { kind: "custom", context: makeContext(ev) };
  }

  // Only import events near enough to matter: 30 days back, 120 days ahead.
  function inImportWindow(ev, today) {
    const ref = today || ymdLocal(new Date());
    const last = ev.until || ev.date;
    return last >= addDays(ref, -30) && ev.date <= addDays(ref, 120);
  }

  function importEvents(events, today) {
    const S = window.SPARK_STORE;
    const res = { builtins: [], created: 0, skipped: 0, total: events.length };
    for (const ev of events) {
      if (!inImportWindow(ev, today)) {
        res.skipped++;
        continue;
      }
      const c = classify(ev);
      if (c.kind === "builtin") {
        S.toggleContext(c.id, true);
        if (c.raceDate) S.setContextField("crosscountry", "raceDate", c.raceDate);
        res.builtins.push(c.id);
      } else if (S.addCustomContext(c.context)) {
        res.created++;
      } else {
        res.skipped++; // already imported
      }
    }
    return res;
  }

  window.SPARK_CAL = { parseICS, classify, importEvents, makeContext, inImportWindow };
})();
