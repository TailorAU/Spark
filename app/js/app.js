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
    route: "home", // home | child | contexts | map | more
    childId: null,
    week: E.weekStart(new Date()),
    mapChildId: "eldest",
  };

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
        <div class="section-head"><h2>The kids</h2></div>
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
      ${spotlight}
      <section class="section">
        <div class="section-head"><h2>This week's learning</h2><span class="muted">${p.done}/${p.total} done</span></div>
        <div class="areas">${items}</div>
      </section>
      <div class="foot-hint"><button class="link" data-act="go" data-route="map">See ${esc(child.name)}'s full-year map ›</button></div>
    `;
  }

  // --- CONTEXTS --------------------------------------------------------------
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
      <div class="foot-hint">More life events (birthdays, sport carnivals, term breaks) are easy to add — this is the seed set.</div>
    `;
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
          <p>Spark maps each child's week to the Australian curriculum (EYLF, QKLG, Australian Curriculum v9) and tailors it to what your family is actually doing — bringing transparency to parenting. Single-family v1; seed children are anonymised (Eldest / Middle / Youngest) — swap in your own locally.</p>
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
          `<button class="tab ${view.route === t.r || (view.route === "child" && t.r === "home") ? "on" : ""}" data-act="go" data-route="${t.r}">
            <span class="ti">${t.icon}</span><span class="tl">${t.label}</span></button>`
      )
      .join("");
  }

  function render() {
    ({
      home: renderHome,
      child: renderChild,
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

  // --- boot ------------------------------------------------------------------
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => navigator.serviceWorker.register("./sw.js").catch(() => {}));
  }
  render();
})();
