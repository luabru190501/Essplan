/* «Unser Essplan» – App-Logik. Die Wochendaten stehen in daten.js (const WOCHEN). */

const DAYS = [
  ["mo", "Mo", "Montag"], ["di", "Di", "Dienstag"], ["mi", "Mi", "Mittwoch"],
  ["do", "Do", "Donnerstag"], ["fr", "Fr", "Freitag"], ["sa", "Sa", "Samstag"], ["so", "So", "Sonntag"]
];
const WEEKDAYS = ["mo", "di", "mi", "do", "fr"];
const PORTIONS = 4;
const LONG = 45; /* Minuten: länger = Wochenend-Gericht */

const ICONS = {
  schnell: '<svg viewBox="0 0 24 24"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2.5M9 2h6"/></svg>',
  guenstig: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M15 9.5c-.6-1-1.7-1.5-3-1.5-1.7 0-3 .9-3 2.2 0 3 6 1.6 6 4.6 0 1.3-1.3 2.2-3 2.2-1.4 0-2.6-.6-3.2-1.6M12 6v2M12 16v2"/></svg>',
  aufwendig: '<svg viewBox="0 0 24 24"><path d="M4 11h16v5a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4z"/><path d="M2 11h20M9 4c0 1.5 1 1.5 1 3M13 4c0 1.5 1 1.5 1 3"/></svg>',
  vegi: '<svg viewBox="0 0 24 24"><path d="M5 19c0-8 5-13 14-14-1 9-6 14-14 14z"/><path d="M5 19l8-8"/></svg>',
  protein: '<svg viewBox="0 0 24 24"><path d="M6.5 6.5l11 11M4 9l5-5M15 20l5-5M3 12l2 2M10 3l2 2M12 19l2 2M19 10l2 2"/></svg>',
  italienisch: '<svg viewBox="0 0 24 24"><path d="M4 13h16a8 8 0 0 1-16 0z"/><path d="M8 13c0-3 1-6 3-8M12 13c0-3 1-5 4-7M16 13c0-2 .5-3 2-4"/></svg>'
};
const MOODS = [
  { id: "schnell", label: "Schnell" },
  { id: "guenstig", label: "Günstig" },
  { id: "aufwendig", label: "Gern länger kochen" },
  { id: "vegi", label: "Mehr Vegi" },
  { id: "protein", label: "Mehr Protein" },
  { id: "italienisch", label: "Italienisch" }
];

/* ---------- Hilfen ---------- */
const $ = id => document.getElementById(id);
function chf(n) { return "CHF " + n.toFixed(2); }
function fmtNum(n) { return (Math.round(n * 10) / 10).toString().replace(".", ","); }
function esc(s) { return String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])); }
function parseDate(s) { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); }
function addDays(d, n) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }
function dm(d) { return d.getDate() + "." + (d.getMonth() + 1) + "."; }
function todayDate() { const t = new Date(); return new Date(t.getFullYear(), t.getMonth(), t.getDate()); }
function kw(id) { const m = /KW(\d+)/.exec(id); return m ? m[1] : "?"; }

/* ---------- Wochen ---------- */
const weeks = (typeof WOCHEN !== "undefined" ? WOCHEN : []).slice().sort((a, b) => b.start.localeCompare(a.start));
const weekById = Object.fromEntries(weeks.map(w => [w.id, w]));
weeks.forEach(w => { w.byId = Object.fromEntries(w.recipes.map(r => [r.id, r])); });

function weekStatus(w) {
  const t = todayDate(), s = parseDate(w.start), e = addDays(s, 7);
  if (t >= s && t < e) return "current";
  if (t < s) return "next";
  return "past";
}
function currentWeek() {
  return weeks.find(w => weekStatus(w) === "current")
    || weeks.filter(w => weekStatus(w) === "next").slice(-1)[0]
    || weeks[0];
}
function todayKey() { return ["so", "mo", "di", "mi", "do", "fr", "sa"][new Date().getDay()]; }

/* ---------- Zustand ---------- */
const LS_KEY = "essplan-v2";
let store = { weeks: {} };
let doneSteps = {};
function wstate(w) {
  if (!store.weeks[w.id]) store.weeks[w.id] = { sel: { ...w.defaultSel }, checked: {}, moods: [] };
  const s = store.weeks[w.id];
  for (const [k] of DAYS) if (!(k in s.sel) || (s.sel[k] !== "" && !w.byId[s.sel[k]])) s.sel[k] = w.defaultSel[k] || "";
  if (!Array.isArray(s.moods)) s.moods = [];
  if (!s.checked || typeof s.checked !== "object") s.checked = {};
  return s;
}
function save() { try { localStorage.setItem(LS_KEY, JSON.stringify(store)); } catch (e) { /* ignorieren */ } }
function load() {
  try {
    const s = JSON.parse(localStorage.getItem(LS_KEY) || "null");
    if (s && s.weeks && typeof s.weeks === "object") { store = s; return; }
    const old = JSON.parse(localStorage.getItem("essplan-state") || "null");
    if (old && old.week && weekById[old.week]) store.weeks[old.week] = { sel: old.sel || {}, checked: old.checked || {}, moods: [] };
  } catch (e) { /* ignorieren */ }
}

/* ---------- Berechnungen ---------- */
function recipeItems(w, r, sel) {
  let items = r.items.slice();
  if (r.needs && !Object.values(sel).includes(r.needs) && r.fallback) items = items.concat(r.fallback);
  return items;
}
function recipeCost(w, r, sel) {
  return recipeItems(w, r, sel).reduce((sum, [k, q]) => sum + q / w.products[k].pack * w.products[k].price, 0);
}
function selectedDays(w) {
  const s = wstate(w);
  return DAYS.filter(([k]) => s.sel[k] && w.byId[s.sel[k]]).map(([k, sh, l]) => ({ key: k, short: sh, long: l, recipe: w.byId[s.sel[k]] }));
}
function shoppingList(w) {
  const s = wstate(w), need = {}, usedBy = {}, pantry = {};
  for (const d of selectedDays(w)) {
    for (const [k, q] of recipeItems(w, d.recipe, s.sel)) {
      need[k] = (need[k] || 0) + q;
      (usedBy[k] = usedBy[k] || new Set()).add(d.short);
    }
    for (const x of d.recipe.pantry || []) (pantry[x] = pantry[x] || new Set()).add(d.short);
  }
  const rows = Object.keys(need).map(k => {
    const p = w.products[k];
    const packs = Math.max(1, Math.ceil(need[k] / p.pack - 1e-9));
    return { key: k, p, need: need[k], packs, cost: packs * p.price, statt: p.statt ? packs * p.statt : null, days: [...usedBy[k]] };
  });
  return { rows, pantry };
}
function summary(w) {
  const list = shoppingList(w), s = wstate(w);
  const total = list.rows.reduce((a, r) => a + r.cost, 0);
  const saved = list.rows.reduce((a, r) => a + (r.statt ? r.statt - r.cost : 0), 0);
  const days = selectedDays(w);
  const portions = days.length * PORTIONS;
  const all = list.rows.length + Object.keys(list.pantry).length;
  const done = list.rows.filter(r => s.checked[r.key]).length + Object.keys(list.pantry).filter(n => s.checked["p:" + n]).length;
  const prot = days.length ? days.reduce((a, d) => a + (d.recipe.protein || 0), 0) / days.length : 0;
  const fish = days.filter(d => d.recipe.tags.includes("fisch")).length;
  const vegi = days.filter(d => d.recipe.tags.includes("vegetarisch")).length;
  return { list, total, saved, portions, all, done, prot, fish, vegi, days };
}
function needText(row) {
  const u = row.p.unit, n = row.need;
  if (u === "g") return n >= 1000 ? fmtNum(n / 1000) + " kg" : Math.round(n) + " g";
  if (u === "dose") return fmtNum(n) + (n === 1 ? " Dose" : " Dosen");
  if (u === "beutel") return fmtNum(n) + " Beutel";
  if (u === "bund") return fmtNum(n) + " Bund";
  return fmtNum(n) + " Stück";
}

function sourceHtml(r) {
  if (!r.source || !r.source.url || !/^https:\/\//.test(r.source.url)) return "";
  return `<a class="src" href="${esc(r.source.url)}" target="_blank" rel="noopener">Originalrezept auf ${esc(r.source.name || "der Webseite")} ↗</a>`;
}
const WUNSCH_URL = "https://github.com/luabru190501/Essplan/issues/new?title=" + encodeURIComponent("Wunsch für nächste Woche") + "&body=" + encodeURIComponent("Schreib hier deinen Wunsch, z. B. «mehr Curry», «weniger Pasta», «Lieblingsgericht: …». Dann unten auf «Create» tippen.");

/* ---------- Plan nach Lust ---------- */
function planByMood(w, moods) {
  if (!moods.length) return { ...w.defaultSel };
  const rs = w.recipes;
  const cost = r => recipeCost(w, r, {}) / PORTIONS;
  const range = f => { const v = rs.map(f); const lo = Math.min(...v), hi = Math.max(...v); return r => hi > lo ? (f(r) - lo) / (hi - lo) : 0.5; };
  const cN = range(cost), pN = range(r => r.protein || 0), tN = range(r => r.minutes || 30);
  const defaults = new Set(Object.values(w.defaultSel));
  const score = r => {
    let s = defaults.has(r.id) ? 0.3 : 0;
    if (moods.includes("schnell")) s += 2 * (1 - tN(r)) + (r.minutes <= 25 ? 1 : 0);
    if (moods.includes("aufwendig")) s += 2 * tN(r);
    if (moods.includes("guenstig")) s += 2.5 * (1 - cN(r));
    if (moods.includes("vegi")) s += r.tags.includes("vegetarisch") ? 2.5 : -1;
    if (moods.includes("protein")) s += 2.5 * pN(r);
    if (moods.includes("italienisch")) s += r.tags.includes("italienisch") ? 2 : 0;
    return s;
  };
  const sorted = rs.slice().sort((a, b) => score(b) - score(a));
  const chosen = [];
  const ok = r => {
    if (chosen.includes(r)) return false;
    if (r.tags.includes("fisch") && chosen.some(c => c.tags.includes("fisch"))) return false;
    if (r.needs && !chosen.some(c => c.id === r.needs)) return false;
    const longs = chosen.filter(c => c.minutes > LONG).length;
    if (r.minutes > LONG && longs >= 2) return false;
    return true;
  };
  let progress = true;
  while (chosen.length < 7 && progress) {
    progress = false;
    for (const r of sorted) { if (ok(r)) { chosen.push(r); progress = true; break; } }
  }
  /* Tage verteilen: lange Gerichte aufs Wochenende, abhängige Gerichte einen Tag später */
  const sel = Object.fromEntries(DAYS.map(([k]) => [k, ""]));
  const longs = chosen.filter(r => r.minutes > LONG).sort((a, b) => (a.needs ? 1 : 0) - (b.needs ? 1 : 0));
  const shorts = chosen.filter(r => r.minutes <= LONG);
  const weekend = ["sa", "so"];
  longs.forEach((r, i) => { sel[weekend[i]] = r.id; });
  const free = [...WEEKDAYS, ...weekend.filter(d => !sel[d])];
  shorts.forEach((r, i) => { if (free[i]) sel[free[i]] = r.id; });
  return sel;
}

/* ---------- Ansichten ---------- */
let route = { view: "home" };
function parseHash() {
  const h = decodeURIComponent(location.hash.slice(1));
  const m = /^w-(.+?)(?:-(plan|gerichte|rezepte|einkauf))?$/.exec(h);
  if (m && weekById[m[1]]) return { view: "week", id: m[1], tab: m[2] || "plan" };
  return { view: "home" };
}
function go(r, opts = {}) {
  route = r;
  const hash = r.view === "home" ? "start" : "w-" + r.id + "-" + r.tab;
  if (location.hash !== "#" + hash) history.replaceState(null, "", "#" + hash);
  render(opts);
}
window.addEventListener("hashchange", () => { route = parseHash(); render(); });

function render(opts = {}) {
  const el = $("app");
  if (!weeks.length) { el.innerHTML = `<div class="card">Noch keine Wochendaten vorhanden.</div>`; return; }
  el.innerHTML = route.view === "home" ? homeHtml() : weekHtml(weekById[route.id], route.tab, opts.openDay);
  if (opts.openDay) { const d = $("rec-" + opts.openDay); if (d) d.scrollIntoView({ block: "start" }); }
  else if (!opts.keepScroll) window.scrollTo(0, 0);
}

function greeting() { const h = new Date().getHours(); return h < 11 ? "Guten Morgen" : h < 17 ? "Hallo" : "Guten Abend"; }

function moodsHtml(w) {
  const s = wstate(w);
  return `<div class="moods" role="group" aria-label="Worauf habt ihr Lust?">${MOODS.map(m =>
    `<button class="mood" data-mood="${m.id}" data-week="${w.id}" aria-pressed="${s.moods.includes(m.id)}">${ICONS[m.id]}<span>${m.label}</span></button>`).join("")}</div>
    <button class="primary" data-plan="${w.id}">${s.moods.length ? "Plan nach Lust erstellen" : "Vorschlag der Woche verwenden"}</button>
    <div class="toast" id="toast" aria-live="polite"></div>`;
}

function homeHtml() {
  const w = currentWeek(), st = weekStatus(w), s = wstate(w), sm = summary(w);
  const tk = todayKey(), r = st === "current" && s.sel[tk] ? w.byId[s.sel[tk]] : null;
  const d = new Date();
  const dateStr = DAYS[(d.getDay() + 6) % 7][2] + ", " + d.getDate() + ". " + ["Januar","Februar","März","April","Mai","Juni","Juli","August","September","Oktober","November","Dezember"][d.getMonth()];
  let today;
  if (st !== "current") {
    today = `<div class="today"><span class="eyebrow">Als Nächstes</span><h2>Woche ab ${dm(parseDate(w.start))}</h2><div class="btns"><button class="btn-light" data-goweek="${w.id}" data-tab="plan">Plan ansehen</button></div></div>`;
  } else if (r) {
    today = `<div class="today"><span class="eyebrow">Heute auf dem Tisch</span><h2>${esc(r.name)}</h2>
      <div class="facts"><span class="fact">${esc(r.time)}</span>${r.protein ? `<span class="fact">ca. ${r.protein} g Protein</span>` : ""}<span class="fact num">${chf(recipeCost(w, r, s.sel) / PORTIONS)} pro Portion</span></div>
      <div class="btns"><button class="btn-light" data-cookday="${tk}" data-week="${w.id}">Jetzt kochen</button><button class="btn-outline-light" data-goweek="${w.id}" data-tab="rezepte" data-day="${tk}">Rezept</button></div></div>`;
  } else {
    today = `<div class="today"><span class="eyebrow">Heute</span><h2>Kein Kochen geplant</h2><div class="btns"><button class="btn-light" data-goweek="${w.id}" data-tab="plan">Gericht wählen</button></div></div>`;
  }
  const pct = sm.all ? Math.round(sm.done / sm.all * 100) : 0;
  const list = weeks.map(x => {
    const xs = weekStatus(x), start = parseDate(x.start);
    const label = xs === "current" ? "Diese Woche" : xs === "next" ? "Nächste Woche" : "Vorbei";
    const cls = xs === "next" ? "next" : xs === "past" ? "past" : "";
    return `<button class="week-row ${xs === "past" ? "past" : ""}" data-goweek="${x.id}" data-tab="plan">
      <span class="week-badge"><span>KW<big>${kw(x.id)}</big></span></span>
      <span><strong>${dm(start)} – ${dm(addDays(start, 6))}</strong><br><span class="small muted num">${chf(summary(x).total)} · ${selectedDays(x).length} Gerichte</span></span>
      <span class="status ${cls}">${label}</span></button>`;
  }).join("");
  const nxt = weeks.find(x => weekStatus(x) === "next" && x !== w);
  const banner = nxt ? `<button class="banner" data-goweek="${nxt.id}" data-tab="gerichte"><span><strong>Neu: ${nxt.recipes.length} Gerichte für nächste Woche</strong><br><span class="small">Ab ${dm(parseDate(nxt.start))} · jetzt auswählen</span></span><span aria-hidden="true">›</span></button>` : "";
  return `
    <div class="hello"><span class="eyebrow">${dateStr}</span><h1>${greeting()}!</h1></div>
    ${banner}
    ${today}
    <div class="quick">
      <button class="tile" data-goweek="${w.id}" data-tab="plan"><span class="small muted">Diese Woche</span><b class="num">${chf(sm.total)}</b><span class="small muted num">${sm.portions ? chf(sm.total / sm.portions) : "–"} pro Portion</span></button>
      <button class="tile" data-goweek="${w.id}" data-tab="einkauf"><span class="small muted">Einkauf</span><b class="num">${sm.done}/${sm.all}</b><span class="bar"><i style="width:${pct}%"></i></span></button>
    </div>
    <div class="card section"><div><span class="eyebrow">KW ${kw(w.id)}</span><h2>Worauf habt ihr Lust?</h2></div>
      <p class="small muted" style="margin:0">Wählt eine oder mehrere Richtungen, dann stelle ich die Woche aus den Rezepten dieser Woche neu zusammen.</p>
      ${moodsHtml(w)}</div>
    <div class="section"><h2>Alle Wochen</h2><div class="weeks">${list}</div></div>
    <div class="card section"><h3>Wunsch für nächste Woche</h3>
      <p class="small muted" style="margin:0">Mehr Curry, weniger Pasta, ein Lieblingsgericht? Schreib es hier hinein. Der nächste Plan berücksichtigt es.</p>
      <a class="primary linkish" href="${WUNSCH_URL}" target="_blank" rel="noopener">Wunsch schreiben</a></div>
    <p class="footer">Alle Rezepte ohne Schweinefleisch · 4 Portionen pro Gericht, davon 2 zum Mitnehmen.</p>`;
}

function weekHtml(w, tab, openDay) {
  const sm = summary(w), start = parseDate(w.start);
  const tabs = [["plan", "Plan"], ["gerichte", "Gerichte"], ["rezepte", "Rezepte"], ["einkauf", "Einkauf"]];
  const pills = [`<span class="pill">Ohne Schweinefleisch</span>`, `<span class="pill">${sm.vegi}× vegi</span>`, `<span class="pill">ca. ${Math.round(sm.prot)} g Protein pro Portion</span>`];
  pills.push(sm.fish > 1 ? `<span class="pill warn">Fisch ${sm.fish}×, lieber höchstens 1×</span>` : `<span class="pill">Fisch ${sm.fish}×</span>`);
  const body = tab === "rezepte" ? rezepteHtml(w, openDay) : tab === "einkauf" ? einkaufHtml(w) : tab === "gerichte" ? gerichteHtml(w) : planHtml(w);
  return `
    <div class="topbar"><button class="back" data-home>‹ Übersicht</button><span class="eyebrow">KW ${kw(w.id)} · ${weekStatus(w) === "current" ? "Diese Woche" : weekStatus(w) === "next" ? "Nächste Woche" : "Vorbei"}</span></div>
    <div><h1>${dm(start)} – ${dm(addDays(start, 6))}</h1><div class="small muted">${esc(w.label)}</div></div>
    <div class="stats">
      <div class="stat"><b class="num">${chf(sm.total)}</b><span>Einkauf total</span></div>
      <div class="stat"><b class="num">${sm.portions ? chf(sm.total / sm.portions) : "–"}</b><span>pro Portion</span></div>
      <div class="stat"><b class="num">${chf(sm.saved)}</b><span>gespart</span></div>
    </div>
    <div class="pills">${pills.join("")}</div>
    ${weekStatus(w) === "past" ? `<div class="note">Diese Woche ist vorbei. Die Preise und Aktionen stimmen nicht mehr, die Rezepte kannst du aber weiter nutzen.</div>` : ""}
    <nav class="tabs-wrap"><div class="tabs" role="tablist">${tabs.map(([k, l]) => `<button role="tab" data-tabgo="${k}" data-week="${w.id}" aria-selected="${tab === k}">${l}</button>`).join("")}</div></nav>
    <section class="section">${body}</section>
    <p class="footer">${esc(w.updated)}</p>`;
}

function planHtml(w) {
  const s = wstate(w), tk = weekStatus(w) === "current" ? todayKey() : "";
  let html = `<div class="card section"><h3>Worauf habt ihr Lust?</h3>${moodsHtml(w)}</div>`;
  for (const [k, short, long] of DAYS) {
    const cur = s.sel[k], r = w.byId[cur];
    html += `<div class="card day${k === tk ? " is-today" : ""}"><div class="day-label" aria-hidden="true">${short}</div><div class="day-body">
      <label class="small muted" for="sel-${k}">${long}${k === tk ? " · heute" : ""}</label>
      <select id="sel-${k}" data-day="${k}" data-week="${w.id}">
        <option value=""${cur === "" ? " selected" : ""}>Kein Kochen (auswärts, Reste)</option>
        ${w.recipes.map(o => `<option value="${o.id}"${o.id === cur ? " selected" : ""}>${esc(o.name)}</option>`).join("")}
      </select>
      ${r ? `<div class="meta"><span>${esc(r.time)}</span><span class="num">${chf(recipeCost(w, r, s.sel) / PORTIONS)}/Portion</span>${r.protein ? `<span>ca. ${r.protein} g Protein</span>` : ""}<button class="linkbtn" data-goweek="${w.id}" data-tab="rezepte" data-day="${k}">Rezept</button></div>` : ""}
      ${r && r.needs && !Object.values(s.sel).includes(r.needs) ? `<div class="note">Ohne «${esc(w.byId[r.needs] ? w.byId[r.needs].name : r.needs)}» kommt eine Zusatzzutat auf die Einkaufsliste.</div>` : ""}
    </div></div>`;
  }
  return html;
}

let gFilter = "alle";
const GFILTERS = [["alle", "Alle"], ["schnell", "Schnell"], ["guenstig", "Günstig"], ["vegi", "Vegi"], ["protein", "Viel Protein"], ["italienisch", "Italienisch"], ["fleisch", "Fleisch & Fisch"]];
function gMatch(w, r) {
  switch (gFilter) {
    case "schnell": return r.minutes <= 25;
    case "guenstig": return recipeCost(w, r, {}) / PORTIONS <= 3;
    case "vegi": return r.tags.includes("vegetarisch");
    case "protein": return (r.protein || 0) >= 30;
    case "italienisch": return r.tags.includes("italienisch");
    case "fleisch": return !r.tags.includes("vegetarisch");
    default: return true;
  }
}
function gerichteHtml(w) {
  const s = wstate(w);
  const daysOf = id => DAYS.filter(([k]) => s.sel[k] === id).map(d => d[1]);
  const list = w.recipes.filter(r => gMatch(w, r));
  return `<div class="card section"><h3>Alle ${w.recipes.length} Gerichte dieser Woche</h3>
      <p class="small muted" style="margin:0">Legt ein Gericht auf einen Tag, dann erscheint es im Plan, bei den Rezepten und auf der Einkaufsliste.</p>
      <div class="chips">${GFILTERS.map(([v, l]) => `<button class="chip" data-gfilter="${v}" data-week="${w.id}" aria-pressed="${gFilter === v}">${l}</button>`).join("")}</div></div>
    ${list.length ? "" : `<div class="card">Kein Gericht passt zu diesem Filter.</div>`}
    ${list.map(r => {
      const on = daysOf(r.id);
      return `<div class="card dish${on.length ? " picked" : ""}">
        <div class="row"><h3>${esc(r.name)}</h3>${on.length ? `<span class="status">${on.join(", ")}</span>` : ""}</div>
        <div class="meta"><span>${esc(r.time)}</span><span class="num">${chf(recipeCost(w, r, {}) / PORTIONS)}/Portion</span>${r.protein ? `<span>ca. ${r.protein} g Protein</span>` : ""}${r.tags.filter(t => t !== "schnell").map(t => `<span class="pill">${t}</span>`).join("")}</div>
        ${sourceHtml(r)}
        <label class="small muted" for="pick-${r.id}">Auf Tag legen</label>
        <select id="pick-${r.id}" data-pick="${r.id}" data-week="${w.id}">
          <option value="">Tag wählen …</option>
          ${DAYS.map(([k, , l]) => `<option value="${k}">${l}${s.sel[k] && w.byId[s.sel[k]] ? " (statt " + esc(w.byId[s.sel[k]].name) + ")" : ""}</option>`).join("")}
        </select>
      </div>`;
    }).join("")}`;
}

function rezepteHtml(w, openDay) {
  const days = selectedDays(w);
  if (!days.length) return `<div class="card">Noch keine Gerichte gewählt. Wähle sie unter «Plan» aus.</div>`;
  return days.map(d => {
    const r = d.recipe;
    return `<details class="recipe" id="rec-${d.key}"${openDay === d.key ? " open" : ""}>
      <summary><span class="small muted">${d.long} · ${esc(r.time)}${r.protein ? ` · ca. ${r.protein} g Protein` : ""}</span><span class="row"><h3>${esc(r.name)}</h3></span></summary>
      <div class="recipe-body">
        ${r.note ? `<div class="note">${esc(r.note)}</div>` : ""}
        ${sourceHtml(r)}
        <div><strong>Zutaten für 4 Portionen</strong><ul>${r.ingredients.map(i => `<li>${esc(i)}</li>`).join("")}</ul></div>
        <div><strong>Zubereitung</strong> <span class="small muted">(Schritt antippen, wenn erledigt)</span>
          <ol class="steps">${r.steps.map((st, i) => `<li data-step="${w.id}|${d.key}|${i}" class="${doneSteps[w.id + d.key + i] ? "done" : ""}">${esc(st)}</li>`).join("")}</ol></div>
        <button class="primary" data-cookday="${d.key}" data-week="${w.id}">Schritt für Schritt kochen</button>
      </div></details>`;
  }).join("");
}

function einkaufHtml(w) {
  const s = wstate(w), sm = summary(w), list = sm.list;
  const open = list.rows.filter(r => !s.checked[r.key]).reduce((a, r) => a + r.cost, 0);
  let html = `<div class="card">
    <div class="row"><strong class="num">${sm.done} von ${sm.all} erledigt</strong><span class="num muted">noch ${chf(open)}</span></div>
    <div class="progress" aria-hidden="true"><div style="width:${sm.all ? Math.round(sm.done / sm.all * 100) : 0}%"></div></div>
    <div class="actions"><button class="ghost" data-copy="${w.id}">Liste kopieren</button><button class="ghost" data-resetchecks="${w.id}">Häkchen zurücksetzen</button></div>
    <div class="small muted" id="copyMsg" aria-live="polite"></div></div>`;
  for (const store of ["Migros", "Aldi"]) {
    const rows = list.rows.filter(r => r.p.store === store).sort((a, b) => (!!b.p.statt - !!a.p.statt) || a.p.name.localeCompare(b.p.name, "de"));
    if (!rows.length) continue;
    html += `<div class="group"><h3>${store} <span class="num">${chf(rows.reduce((a, r) => a + r.cost, 0))}</span></h3>${rows.map(r => {
      const c = !!s.checked[r.key];
      return `<label class="item${c ? " checked" : ""}"><input type="checkbox" data-check="${r.key}" data-week="${w.id}"${c ? " checked" : ""}>
        <div><div class="name">${r.packs > 1 ? r.packs + " × " : ""}${esc(r.p.name)}${r.p.statt ? `<span class="tag-deal">Aktion</span>` : ""}</div>
        <div class="info">${esc(r.p.label)} · Bedarf ${needText(r)} · für ${r.days.join(", ")}</div></div>
        <div class="price num">${r.p.approx ? "ca. " : ""}${r.cost.toFixed(2)}${r.statt ? `<s>${r.statt.toFixed(2)}</s>` : ""}</div></label>`;
    }).join("")}</div>`;
  }
  const pantry = Object.keys(list.pantry).sort((a, b) => a.localeCompare(b, "de"));
  if (pantry.length) {
    html += `<div class="group"><h3>Grundvorrat <span>zu Hause prüfen</span></h3>${pantry.map(n => {
      const key = "p:" + n, c = !!s.checked[key];
      return `<label class="item${c ? " checked" : ""}"><input type="checkbox" data-check="${esc(key)}" data-week="${w.id}"${c ? " checked" : ""}><div><div class="name">${esc(n)}</div><div class="info">für ${[...list.pantry[n]].join(", ")}</div></div><div></div></label>`;
    }).join("")}</div>`;
  }
  return html;
}

/* ---------- Kochmodus ---------- */
let cook = null;
function openCook(w, day) {
  const r = w.byId[wstate(w).sel[day]];
  if (!r) return;
  cook = { r, i: 0 };
  $("cookTitle").textContent = r.name;
  $("cook").hidden = false;
  drawCook();
  $("cookNext").focus();
}
function drawCook() {
  const { r, i } = cook;
  $("cookCount").textContent = `Schritt ${i + 1} von ${r.steps.length}`;
  $("cookDots").innerHTML = r.steps.map((_, j) => `<i class="${j <= i ? "on" : ""}"></i>`).join("");
  $("cookStep").textContent = r.steps[i];
  $("cookPrev").disabled = i === 0;
  $("cookNext").textContent = i === r.steps.length - 1 ? "Fertig" : "Weiter";
}
function closeCook() { $("cook").hidden = true; cook = null; }
$("cookPrev").onclick = () => { if (cook.i > 0) { cook.i--; drawCook(); } };
$("cookNext").onclick = () => { if (cook.i < cook.r.steps.length - 1) { cook.i++; drawCook(); } else closeCook(); };
$("cookClose").onclick = closeCook;
document.addEventListener("keydown", e => {
  if (!cook) return;
  if (e.key === "Escape") closeCook();
  if (e.key === "ArrowRight") $("cookNext").click();
  if (e.key === "ArrowLeft") $("cookPrev").click();
});

/* ---------- Ereignisse ---------- */
$("app").addEventListener("click", async e => {
  const t = e.target.closest("button, li[data-step]");
  if (!t) return;
  const w = weekById[t.dataset.week];
  if ("home" in t.dataset) return go({ view: "home" });
  if (t.dataset.goweek) return go({ view: "week", id: t.dataset.goweek, tab: t.dataset.tab || "plan" }, { openDay: t.dataset.day });
  if (t.dataset.tabgo) return go({ view: "week", id: t.dataset.week, tab: t.dataset.tabgo });
  if (t.dataset.mood) {
    const s = wstate(w), m = t.dataset.mood;
    if (s.moods.includes(m)) s.moods = s.moods.filter(x => x !== m);
    else {
      s.moods.push(m);
      if (m === "schnell") s.moods = s.moods.filter(x => x !== "aufwendig");
      if (m === "aufwendig") s.moods = s.moods.filter(x => x !== "schnell");
    }
    save();
    return render({ keepScroll: true });
  }
  if (t.dataset.plan) {
    const s = wstate(weekById[t.dataset.plan]);
    s.sel = planByMood(weekById[t.dataset.plan], s.moods);
    s.checked = {};
    save();
    if (route.view === "home") return go({ view: "week", id: t.dataset.plan, tab: "plan" });
    render({ keepScroll: true });
    const toast = $("toast"); if (toast) toast.textContent = "Neuer Plan erstellt. Einzelne Tage kannst du unten noch tauschen.";
    return;
  }
  if (t.dataset.gfilter) { gFilter = t.dataset.gfilter; return render({ keepScroll: true }); }
  if (t.dataset.cookday) return openCook(w, t.dataset.cookday);
  if (t.dataset.step) {
    const [wid, day, i] = t.dataset.step.split("|"), k = wid + day + i;
    doneSteps[k] = !doneSteps[k]; t.classList.toggle("done", doneSteps[k]); return;
  }
  if (t.dataset.resetchecks) { wstate(weekById[t.dataset.resetchecks]).checked = {}; save(); return render({ keepScroll: true }); }
  if (t.dataset.copy) {
    const cw = weekById[t.dataset.copy], s = wstate(cw), list = shoppingList(cw), lines = [];
    for (const st of ["Migros", "Aldi"]) {
      const rows = list.rows.filter(r => r.p.store === st && !s.checked[r.key]);
      if (!rows.length) continue;
      lines.push(st.toUpperCase());
      for (const r of rows) lines.push(`- ${r.packs > 1 ? r.packs + " × " : ""}${r.p.name} (${r.p.label})`);
      lines.push("");
    }
    try { await navigator.clipboard.writeText(lines.join("\n").trim()); $("copyMsg").textContent = "Liste kopiert, du kannst sie z. B. in WhatsApp einfügen."; }
    catch (err) { $("copyMsg").textContent = "Kopieren ist hier nicht möglich."; }
  }
});
$("app").addEventListener("change", e => {
  const t = e.target, w = weekById[t.dataset.week];
  if (!w) return;
  const s = wstate(w);
  if (t.matches("select[data-day]")) {
    s.sel[t.dataset.day] = t.value; save(); render({ keepScroll: true });
    const again = $("sel-" + t.dataset.day); if (again) again.focus();
  }
  if (t.matches("select[data-pick]") && t.value) {
    s.sel[t.value] = t.dataset.pick; save(); render({ keepScroll: true });
    const toast = $("pick-" + t.dataset.pick); if (toast) toast.focus();
    return;
  }
  if (t.matches("input[data-check]")) {
    if (t.checked) s.checked[t.dataset.check] = true; else delete s.checked[t.dataset.check];
    save(); render({ keepScroll: true });
  }
});

/* ---------- Start ---------- */
load();
route = parseHash();
render();
if ("serviceWorker" in navigator) { navigator.serviceWorker.register("sw.js").catch(() => {}); }
