/*
 * Spark — app shell & views
 * A tiny state->render UI over the data/engine/store modules. No framework,
 * no build step: this is the "fastest path" installable PWA.
 */
(function () {
  "use strict";
  const D = window.SPARK_DATA;
  const E = window.SPARK_ENGINE;
  const S = window.SPARK_STORE;

  const app = document.getElementById("app");
  const nav = document.getElementById("nav");

  // Current view state.
  const view = {
    route: "home", // home | child | sheet | contexts | map | more
    childId: null,
    week: E.weekStart(new Date()),
    mapChildId: "eldest",
  };

  // Active worksheet player (so we can detach its listener on route change).
  let sheetPlayer = null;
  function destroySheet() {
    if (sheetPlayer) {
      sheetPlayer.destroy();
      sheetPlayer = null;
    }
  }

  const esc = (s) =>
    String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  const childById = (id) => D.CHILDREN.find((c) => c.id === id);

  // --- progress ring ---------------------------------------------------------
  function ring(pct, colour, size = 46) {
    const r = size / 2 - 4;
    const c = 2 * Math.PI * r;
    const off = c * (1 - pct / 100);
    return `<svg class="ring" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="rgba(0,0,0,.08)" stroke-width="4"/>
      <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="${colour}" stroke-width="4"
        stroke-linecap="round" stroke-dasharray="${c}" stroke-dashoffset="${off}"
        transform="rotate(-90 ${size / 2} ${size / 2})"/>
      <text x="50%" y="52%" text-anchor="middle" dominant-baseline="middle" class="ring-t">${pct}%</text>
    </svg>`;
  }

  // --- week strip ------------------------------------------------------------
  function weekStrip() {
    const isThis = S.weekKey(view.week) === S.weekKey(E.weekStart(new Date()));
    return `<div class="weekstrip">
      <button class="wk-btn" data-act="week" data-dir="-1" aria-label="Previous week">‹</button>
      <div class="wk-label">
        <div class="wk-main">${esc(E.fmtWeek(view.week))}</div>
        <div class="wk-sub">${isThis ? "This week" : '<button class="link" data-act="week" data-dir="0">Back to this week</button>'}</div>
      </div>
      <button class="wk-btn" data-act="week" data-dir="1" aria-label="Next week">›</button>
    </div>`;
  }

  // --- contexts strip --------------------------------------------------------
  function contextsStrip() {
    const active = S.activeContexts();
    if (!active.length)
      return `<div class="ctx-strip empty">No life events on — <button class="link" data-act="go" data-route="contexts">add what you're doing</button> to tailor the week.</div>`;
    return `<div class="ctx-strip">
      ${active
        .map(
          (c) =>
            `<span class="chip" title="${esc(c.blurb)}">${c.emoji} ${esc(c.label)}</span>`
        )
        .join("")}
    </div>`;
  }

  // --- HOME ------------------------------------------------------------------
  function renderHome() {
    const active = S.activeContexts();
    const cards = D.CHILDREN.map((child) => {
      const plan = E.planForChild(child, view.week, active);
      const areaIds = plan.items.map((i) => i.areaId);
      const p = S.weekProgress(child.id, view.week, areaIds);
      const age = E.ageOn(child.dob, view.week);
      return `<button class="kid-card" data-act="child" data-id="${child.id}" style="--kid:${child.colour};--kid-bg:${child.accent}">
        <div class="kid-emoji">${child.emoji}</div>
        <div class="kid-main">
          <div class="kid-name">${esc(child.name)}</div>
          <div class="kid-meta">${esc(D.STAGE_LABEL[child.stage])} · ${esc(child.school)} · ${age.years} yrs</div>
          <div class="kid-tags">
            <span class="tag">${D.FRAMEWORKS[child.framework].label}</span>
            ${plan.tailoredCount ? `<span class="tag tailored">✦ ${plan.tailoredCount} tailored</span>` : ""}
          </div>
        </div>
        <div class="kid-ring">${ring(p.pct, child.colour)}<div class="kid-count">${p.done}/${p.total}</div></div>
      </button>`;
    }).join("");

    app.innerHTML = `
      <header class="hero">
        <div class="brand"><span class="spark-dot"></span> Spark</div>
        <div class="hero-sub">Bringing transparency to parenting — every week mapped to the curriculum, tailored to what you're actually doing.</div>
      </header>
      ${weekStrip()}
      <section class="section">
        <div class="section-head"><h2>What we're doing</h2><button class="link" data-act="go" data-route="contexts">Edit</button></div>
        ${contextsStrip()}
      </section>
      <section class="section">
        <div class="section-head"><h2>The kids</h2><button class="link" data-act="go" data-route="print">🖨️ Print pack</button></div>
        <div class="kid-list">${cards}</div>
      </section>
      <div class="foot-hint">Tap a child to see their tailored week.</div>
    `;
  }

  // --- CHILD -----------------------------------------------------------------
  function renderChild() {
    const child = childById(view.childId) || D.CHILDREN[0];
    const active = S.activeContexts();
    const plan = E.planForChild(child, view.week, active);
    const areaIds = plan.items.map((i) => i.areaId);
    const p = S.weekProgress(child.id, view.week, areaIds);
    const age = E.ageOn(child.dob, view.week);

    const spotlight = plan.spotlight
      ? `<div class="spotlight">
          <div class="spot-head">${child.emoji} ${esc(plan.spotlight.title)} · <span>${esc(plan.spotlight.focus)}</span></div>
          <ol class="spot-list">${plan.spotlight.sessions.map((s) => `<li>${esc(s)}</li>`).join("")}</ol>
          <div class="spot-note">Race day: ${esc(plan.spotlight.raceDate)}</div>
        </div>`
      : "";

    const items = plan.items
      .map((i) => {
        const done = S.isDone(child.id, view.week, i.areaId);
        const t = i.activity;
        return `<div class="area ${done ? "done" : ""}" style="--kid:${child.colour}">
          <button class="check" data-act="done" data-id="${child.id}" data-area="${i.areaId}" aria-label="Mark done">${done ? "✓" : ""}</button>
          <div class="area-body">
            <div class="area-top"><span class="area-name">${esc(i.area)}</span><span class="strand">${esc(i.strand)}</span></div>
            <div class="activity">${esc(t.text)}</div>
            ${t.tailoredBy ? `<div class="tailored-by">${t.emoji} Tailored to: ${esc(t.tailoredLabel)}</div>` : ""}
          </div>
        </div>`;
      })
      .join("");

    const best = S.getSheetBest(child.id, view.week);
    const sheetCta = `<button class="sheet-cta" data-act="sheet" data-id="${child.id}" style="--kid:${child.colour};--kid-bg:${child.accent}">
        <span class="sheet-cta-icon">✏️</span>
        <span class="sheet-cta-main">
          <span class="sheet-cta-title">This week's worksheet</span>
          <span class="sheet-cta-sub">${
            best
              ? `Best: ${"⭐".repeat(best.stars)}${"☆".repeat(Math.max(0, best.total - best.stars))} — play again`
              : "6 quick games, tailored to this week"
          }</span>
        </span>
        <span class="sheet-cta-go">›</span>
      </button>`;

    // Learning-journey CTA (curriculum mastery map).
    let learnCta = "";
    const LEARN = window.SPARK_LEARN;
    if (LEARN && LEARN.has()) {
      const areas = LEARN.childAreas(child.id);
      const allSkills = areas.reduce((n, a) => n.concat(a.skills.map((s) => s.skillId)), []);
      const ms = S.masterySummary(child.id, allSkills);
      learnCta = `<button class="sheet-cta learn-cta" data-act="learn" data-id="${child.id}" style="--kid:${child.colour};--kid-bg:${child.accent}">
        <span class="sheet-cta-icon">📚</span>
        <span class="sheet-cta-main">
          <span class="sheet-cta-title">Learning journey</span>
          <span class="sheet-cta-sub">${ms.mastered} of ${ms.total} skills mastered · ${esc(D.FRAMEWORKS[child.framework].label)}</span>
        </span>
        <span class="sheet-cta-go">›</span>
      </button>`;
    }

    app.innerHTML = `
      <header class="child-hero" style="--kid:${child.colour};--kid-bg:${child.accent}">
        <button class="back" data-act="go" data-route="home">‹ Home</button>
        <div class="child-hero-row">
          <div class="child-emoji">${child.emoji}</div>
          <div>
            <div class="child-name">${esc(child.name)}</div>
            <div class="child-meta">${esc(D.STAGE_LABEL[child.stage])} · ${esc(child.school)} · ${age.years} yrs</div>
            <div class="child-fw">${esc(D.FRAMEWORKS[child.framework].long)}</div>
          </div>
          <div class="child-ring">${ring(p.pct, child.colour, 58)}</div>
        </div>
      </header>
      ${weekStrip()}
      ${sheetCta}
      ${learnCta}
      ${spotlight}
      <section class="section">
        <div class="section-head"><h2>This week's learning</h2><span class="muted">${p.done}/${p.total} done</span></div>
        <div class="areas">${items}</div>
      </section>
      <div class="foot-hint"><button class="link" data-act="go" data-route="map">See ${esc(child.name)}'s full-year map ›</button></div>
    `;
  }

  // --- WORKSHEET ---------------------------------------------------------------
  function renderSheet() {
    const child = childById(view.childId) || D.CHILDREN[0];
    app.innerHTML = `<div id="sheetHost" class="ws-root"></div>`;
    sheetPlayer = window.SPARK_SHEETS.render(document.getElementById("sheetHost"), {
      child,
      week: view.week,
      contexts: S.activeContexts().filter((c) => E.appliesTo(c, child)),
      saveBest: (stars, total) => S.saveSheetResult(child.id, view.week, stars, total),
      onFinish: () => {},
      onExit: () => go("child"),
    });
  }

  // --- LEARN (curriculum mastery map) -----------------------------------------
  function renderLearn() {
    const child = childById(view.childId) || D.CHILDREN[0];
    const LEARN = window.SPARK_LEARN;
    const areas = LEARN && LEARN.has() ? LEARN.childAreas(child.id) : [];
    const areaHtml = areas.map((a) => {
      const rows = a.skills.map((sk) => {
        const m = S.getSkillMastery(child.id, sk.skillId);
        const badge = m && m.mastered
          ? `<span class="skill-badge mastered">★ Mastered</span>`
          : m
            ? `<span class="skill-badge started">${"⭐".repeat(m.bestStars)}${"☆".repeat(Math.max(0, m.total - m.bestStars))}</span>`
            : `<span class="skill-badge new">New</span>`;
        return `<button class="skill-row ${m && m.mastered ? "is-mastered" : ""}" data-act="practice" data-id="${child.id}" data-skill="${sk.skillId}" style="--kid:${child.colour}">
          <span class="skill-tick">${m && m.mastered ? "✓" : ""}</span>
          <span class="skill-main">
            <span class="skill-title">${esc(sk.title)}</span>
            <span class="skill-milestone">${esc(sk.milestone)}</span>
          </span>
          ${badge}
        </button>`;
      }).join("");
      return `<section class="section">
        <div class="section-head"><h2>${esc(a.areaLabel)}</h2></div>
        <div class="skill-list">${rows}</div>
      </section>`;
    }).join("");

    app.innerHTML = `
      <header class="child-hero" style="--kid:${child.colour};--kid-bg:${child.accent}">
        <button class="back" data-act="child" data-id="${child.id}">‹ ${esc(child.name)}</button>
        <div class="child-hero-row">
          <div class="child-emoji">${child.emoji}</div>
          <div>
            <div class="child-name">Learning journey</div>
            <div class="child-meta">${esc(D.FRAMEWORKS[child.framework].long)}</div>
          </div>
        </div>
      </header>
      ${areas.length ? areaHtml : `<div class="foot-hint">Learning content is loading…</div>`}
      <div class="foot-hint">Every skill is mapped to ${esc(D.FRAMEWORKS[child.framework].label)}. Tap one to learn and practise.</div>
    `;
  }

  // --- PRACTICE (a skill's lesson + question set) -----------------------------
  function renderPractice() {
    const child = childById(view.childId) || D.CHILDREN[0];
    const LEARN = window.SPARK_LEARN;
    const set = LEARN && LEARN.has() ? LEARN.practice(child.id, view.skillId) : null;
    if (!set) { go("learn"); return; }
    app.innerHTML = `<div id="sheetHost" class="ws-root"></div>`;
    sheetPlayer = window.SPARK_SHEETS.render(document.getElementById("sheetHost"), {
      child,
      questions: set.questions,
      lesson: set.lesson,
      onFinish: (stars, total) => S.recordSkillResult(child.id, view.skillId, stars, total),
      onExit: () => go("learn"),
    });
  }

  // --- PRINT PACK ---------------------------------------------------------------
  function renderPrint() {
    const P = window.SPARK_PRINT;
    if (!P) { go("home"); return; }
    // ?date=YYYY-MM-DD lets the overnight job render tomorrow's pack.
    const qd = new URLSearchParams(location.search).get("date");
    app.innerHTML = `
      <div class="pp-toolbar">
        <button class="back" data-act="go" data-route="home">‹ Home</button>
        <button class="btn" id="ppPrintBtn">🖨️ Print now</button>
        <span class="muted">One A4 page per child — write-on worksheets + today's plan.</span>
      </div>
      ${P.render(qd)}
    `;
    const b = document.getElementById("ppPrintBtn");
    if (b) b.onclick = () => window.print();
  }

  // --- CONTEXTS --------------------------------------------------------------
  function calendarSection() {
    const customs = S.customContexts();
    const rows = customs
      .map((c) => {
        const on = S.isContextActive(c.id);
        return `<div class="ctx-row ${on ? "on" : ""}">
          <div class="ctx-emoji">${c.emoji}</div>
          <div class="ctx-info">
            <div class="ctx-label">${esc(c.label)}</div>
            <div class="ctx-blurb">${esc(c.blurb)}</div>
            <div class="ctx-scope">All kids · <button class="link" data-act="cal-remove" data-id="${esc(c.id)}">Remove</button></div>
          </div>
          <button class="toggle ${on ? "on" : ""}" data-act="toggle" data-id="${esc(c.id)}" aria-label="Toggle"><span></span></button>
        </div>`;
      })
      .join("");
    return `<section class="section">
      <div class="section-head"><h2>From your calendar</h2></div>
      ${customs.length ? `<div class="ctx-rows">${rows}</div>` : `<div class="ctx-strip empty">No calendar events imported yet.</div>`}
      <div class="card cal-import">
        <h3>Import calendar (.ics)</h3>
        <p>Paste an invite or an export from your calendar app. Events become life
        contexts woven into each child's week — camping trips and cross-country
        carnivals switch on their built-in plans (a race day even sets the training
        countdown). Nothing leaves this device.</p>
        <textarea id="icsPaste" class="cal-paste" rows="4" placeholder="BEGIN:VCALENDAR …" spellcheck="false"></textarea>
        <div class="cal-import-row">
          <button class="btn" data-act="cal-import">Import pasted text</button>
          <label class="btn ghost cal-filebtn">Import a file<input type="file" id="icsFile" accept=".ics,text/calendar" hidden></label>
        </div>
      </div>
    </section>`;
  }

  function importICS(text) {
    const CAL = window.SPARK_CAL;
    if (!CAL) return;
    if (!text || !text.trim()) {
      toast("Nothing to import");
      return;
    }
    const events = CAL.parseICS(text);
    if (!events.length) {
      toast("No events found in that text");
      return;
    }
    const res = CAL.importEvents(events);
    const brought = res.builtins.length + res.created;
    toast(brought ? `Imported ${brought} of ${res.total} event${res.total === 1 ? "" : "s"}` : "Those events are already in (or too far away)");
    render();
  }

  function renderContexts() {
    const rows = D.CONTEXT_LIBRARY.map((c) => {
      const on = S.isContextActive(c.id);
      const scope =
        c.childScope === "all" || !c.childScope
          ? "All kids"
          : c.childScope.map((id) => childById(id)?.name).join(", ");
      const extra =
        c.id === "crosscountry"
          ? `<label class="race">Race day
              <input type="date" data-act="race" value="${esc(S.activeContexts().find((x) => x.id === "crosscountry")?.raceDate || "")}">
            </label>`
          : "";
      return `<div class="ctx-row ${on ? "on" : ""}">
        <div class="ctx-emoji">${c.emoji}</div>
        <div class="ctx-info">
          <div class="ctx-label">${esc(c.label)}</div>
          <div class="ctx-blurb">${esc(c.blurb)}</div>
          <div class="ctx-scope">${esc(scope)}</div>
          ${on ? extra : ""}
        </div>
        <button class="toggle ${on ? "on" : ""}" data-act="toggle" data-id="${c.id}" aria-label="Toggle"><span></span></button>
      </div>`;
    }).join("");

    app.innerHTML = `
      <header class="page-hero"><h1>What we're doing</h1>
        <p>Turn on what's happening in real life. Spark weaves it into each child's curriculum for the week.</p></header>
      <section class="section"><div class="ctx-rows">${rows}</div></section>
      ${calendarSection()}
      <div class="foot-hint">Import the family calendar above, or just toggle what's on — either way the week tailors itself.</div>
    `;
    const file = document.getElementById("icsFile");
    if (file)
      file.onchange = () => {
        const f = file.files && file.files[0];
        if (!f) return;
        const reader = new FileReader();
        reader.onload = () => importICS(String(reader.result || ""));
        reader.readAsText(f);
      };
  }

  // --- MAP -------------------------------------------------------------------
  function renderMap() {
    const child = childById(view.mapChildId) || D.CHILDREN[0];
    const from = E.weekStart(new Date());
    const map = E.yearMap(child, from, 20);
    const picker = D.CHILDREN.map(
      (c) =>
        `<button class="pick ${c.id === child.id ? "on" : ""}" data-act="mapchild" data-id="${c.id}" style="--kid:${c.colour}">${c.emoji} ${esc(c.name)}</button>`
    ).join("");

    const weeks = map
      .map((w, idx) => {
        const foci = w.focus
          .map((f) => `<span class="mf"><b>${esc(f.area)}</b> ${esc(f.strand)}</span>`)
          .join("");
        return `<div class="mapweek">
          <div class="mw-head"><span class="mw-n">Wk ${idx + 1}</span><span class="mw-date">${esc(w.label)}</span></div>
          <div class="mw-foci">${foci}</div>
        </div>`;
      })
      .join("");

    app.innerHTML = `
      <header class="page-hero"><h1>Curriculum map</h1>
        <p>Every week ahead, mapped against ${esc(D.FRAMEWORKS[child.framework].long)}.</p></header>
      <div class="pickrow" style="--kid:${child.colour}">${picker}</div>
      <section class="section"><div class="mapweeks">${weeks}</div></section>
    `;
  }

  // --- MORE ------------------------------------------------------------------
  function renderMore() {
    const base = S.getSetting("apiBaseUrl") || "";
    app.innerHTML = `
      <header class="page-hero"><h1>More</h1></header>
      <section class="section">
        <div class="card">
          <h3>Install Spark</h3>
          <p>Add Spark to your home screen: open the browser menu and choose <b>Add to Home Screen</b>. It then runs full-screen like an app, offline.</p>
          <button class="btn" id="installBtn" ${deferredInstall ? "" : "disabled"}>Install app</button>
        </div>
        <div class="card">
          <h3>Live activity generation (optional)</h3>
          <p>Spark works fully offline with a built-in activity library. To pull fresh, LLM-generated activities from the extracted Spark PLG engine, set its base URL.</p>
          <label class="field">Spark API base URL
            <input type="url" id="apiBase" placeholder="https://spark.tailor.au" value="${esc(base)}">
          </label>
          <button class="btn ghost" id="saveApi">Save</button>
        </div>
        <div class="card">
          <h3>About</h3>
          <p>Spark maps each child's week to the Australian curriculum (EYLF, QKLG, Australian Curriculum v9) and tailors it to what your family is actually doing — bringing transparency to parenting. Your family's details are encrypted and unlocked with the family password; nothing readable is ever published.</p>
        </div>
        <div class="card">
          <h3>Lock Spark</h3>
          <p>Sign out on this device. You'll need the family password to open Spark again.</p>
          <button class="btn ghost" id="lockBtn">Lock &amp; sign out</button>
        </div>
        <div class="card danger">
          <h3>Reset</h3>
          <p>Clear all progress and restore the default life events.</p>
          <button class="btn danger" id="resetBtn">Reset everything</button>
        </div>
      </section>
      <div class="foot-hint">Spark · v1 · made for family learning</div>
    `;

    document.getElementById("saveApi").onclick = () => {
      S.setSetting("apiBaseUrl", document.getElementById("apiBase").value.trim());
      toast("Saved");
    };
    const lb = document.getElementById("lockBtn");
    if (lb)
      lb.onclick = () => {
        if (window.SPARK_AUTH) window.SPARK_AUTH.lock();
        location.reload();
      };
    document.getElementById("resetBtn").onclick = () => {
      if (confirm("Reset all progress and life events?")) {
        S.resetAll();
        toast("Reset");
        go("home");
      }
    };
    const ib = document.getElementById("installBtn");
    if (ib)
      ib.onclick = async () => {
        if (!deferredInstall) return;
        deferredInstall.prompt();
        deferredInstall = null;
        ib.disabled = true;
      };
  }

  // --- nav & routing ---------------------------------------------------------
  function renderNav() {
    const tabs = [
      { r: "home", label: "Home", icon: "🏠" },
      { r: "contexts", label: "Life", icon: "🗓️" },
      { r: "map", label: "Map", icon: "🧭" },
      { r: "more", label: "More", icon: "⋯" },
    ];
    nav.innerHTML = tabs
      .map(
        (t) =>
          `<button class="tab ${view.route === t.r || ((view.route === "child" || view.route === "sheet" || view.route === "learn" || view.route === "practice") && t.r === "home") ? "on" : ""}" data-act="go" data-route="${t.r}">
            <span class="ti">${t.icon}</span><span class="tl">${t.label}</span></button>`
      )
      .join("");
  }

  function render() {
    destroySheet();
    ({
      home: renderHome,
      child: renderChild,
      sheet: renderSheet,
      learn: renderLearn,
      practice: renderPractice,
      print: renderPrint,
      contexts: renderContexts,
      map: renderMap,
      more: renderMore,
    }[view.route] || renderHome)();
    renderNav();
    window.scrollTo(0, 0);
  }

  function go(route) {
    view.route = route;
    render();
  }

  // --- events (delegation) ---------------------------------------------------
  document.addEventListener("click", (e) => {
    const el = e.target.closest("[data-act]");
    if (!el) return;
    const act = el.dataset.act;
    if (act === "go") go(el.dataset.route);
    else if (act === "child") {
      view.childId = el.dataset.id;
      go("child");
    } else if (act === "sheet") {
      view.childId = el.dataset.id;
      go("sheet");
    } else if (act === "learn") {
      view.childId = el.dataset.id;
      go("learn");
    } else if (act === "practice") {
      view.childId = el.dataset.id;
      view.skillId = el.dataset.skill;
      go("practice");
    } else if (act === "week") {
      const dir = parseInt(el.dataset.dir, 10);
      view.week = dir === 0 ? E.weekStart(new Date()) : E.addWeeks(view.week, dir);
      render();
    } else if (act === "done") {
      S.toggleDone(el.dataset.id, view.week, el.dataset.area);
      render();
    } else if (act === "toggle") {
      S.toggleContext(el.dataset.id, !S.isContextActive(el.dataset.id));
      render();
    } else if (act === "cal-import") {
      const ta = document.getElementById("icsPaste");
      importICS(ta ? ta.value : "");
    } else if (act === "cal-remove") {
      S.removeCustomContext(el.dataset.id);
      toast("Removed");
      render();
    } else if (act === "mapchild") {
      view.mapChildId = el.dataset.id;
      render();
    }
  });

  document.addEventListener("change", (e) => {
    const el = e.target.closest("[data-act='race']");
    if (el) {
      S.setContextField("crosscountry", "raceDate", el.value);
      toast("Race day set");
    }
  });

  // --- install prompt & toast ------------------------------------------------
  let deferredInstall = null;
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredInstall = e;
  });

  let toastT;
  function toast(msg) {
    let t = document.getElementById("toast");
    if (!t) {
      t = document.createElement("div");
      t.id = "toast";
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toastT);
    toastT = setTimeout(() => t.classList.remove("show"), 1600);
  }

  // --- lock screen -----------------------------------------------------------
  function renderLock(msg) {
    nav.innerHTML = "";
    app.innerHTML = `
      <div class="lock">
        <div class="lock-card">
          <div class="lock-brand"><span class="spark-dot"></span> Spark</div>
          <h1 class="lock-h">Family sign-in</h1>
          <p class="lock-sub">Enter the family password to open Spark.</p>
          <form id="lockForm" autocomplete="off">
            <input class="lock-input" id="lockPw" type="password" inputmode="text"
              placeholder="Password" aria-label="Family password" autocomplete="current-password" />
            <label class="lock-remember"><input type="checkbox" id="lockRemember" checked /> Keep me signed in on this device</label>
            <button class="btn lock-btn" id="lockGo" type="submit">Unlock</button>
            <div class="lock-error ${msg ? "show" : ""}" id="lockErr">${esc(msg || "")}</div>
          </form>
          <div class="lock-foot">Your family's details are encrypted — they never leave this device readable.</div>
        </div>
      </div>`;
    const form = document.getElementById("lockForm");
    const pw = document.getElementById("lockPw");
    const err = document.getElementById("lockErr");
    setTimeout(() => pw.focus(), 60);
    form.onsubmit = async (e) => {
      e.preventDefault();
      const btn = document.getElementById("lockGo");
      btn.disabled = true;
      btn.textContent = "Unlocking…";
      const kids = await window.SPARK_AUTH.unlock(pw.value, document.getElementById("lockRemember").checked);
      if (kids && kids.length) {
        boot();
      } else {
        btn.disabled = false;
        btn.textContent = "Unlock";
        err.textContent = "That password didn't work. Try again.";
        err.classList.add("show");
        const card = document.querySelector(".lock-card");
        card.classList.remove("shake");
        void card.offsetWidth;
        card.classList.add("shake");
        pw.select();
      }
    };
  }

  // --- boot ------------------------------------------------------------------
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => navigator.serviceWorker.register("./sw.js").catch(() => {}));
  }

  function boot() {
    view.route = location.hash === "#print" ? "print" : "home";
    render();
  }

  async function init() {
    // Warm the Learn corpus WITHOUT blocking boot — the lock screen (and the
    // 5:30am print flow behind it) must never wait on a content.json fetch the
    // print pack doesn't use. Every Learn consumer already degrades via
    // LEARN.has(); when the corpus lands, refresh the passive views so the
    // Learning Journey appears — never mid-worksheet, never over the lock.
    if (window.SPARK_LEARN) {
      window.SPARK_LEARN.ready()
        .then(() => {
          const locked = document.querySelector(".lock-card");
          if (!locked && !sheetPlayer && ["home", "child", "learn"].includes(view.route)) render();
        })
        .catch(() => {});
    }
    // The committed family config (family.json) IS a print-pack input, so load
    // it before first render — but cap the wait so a stall can never block the
    // lock screen (and the 5:30am flow). Missing/invalid config = defaults.
    try {
      const cfg = await Promise.race([
        fetch("./family.json", { cache: "no-store" }).then((r) => (r.ok ? r.json() : null)),
        new Promise((resolve) => setTimeout(() => resolve(null), 3000)),
      ]);
      if (cfg) S.applyConfig(cfg);
    } catch (_) {}
    const AUTH = window.SPARK_AUTH;
    // No vault configured (dev build) → run open, as before.
    if (!AUTH || !(await AUTH.hasVault())) {
      boot();
      return;
    }
    const kids = await AUTH.tryRemembered();
    if (kids && kids.length) boot();
    else renderLock();
  }

  init();
})();
