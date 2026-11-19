/* «Unser Essplan» – App-Logik.
   Wochendaten: daten.js (const WOCHEN). Gemeinsames Speichern: sync-config.js (const SYNC). */

const DAYS = [
  ["mo", "Mo", "Montag"], ["di", "Di", "Dienstag"], ["mi", "Mi", "Mittwoch"],
  ["do", "Do", "Donnerstag"], ["fr", "Fr", "Freitag"], ["sa", "Sa", "Samstag"], ["so", "So", "Sonntag"]
];
const DAYKEYS = DAYS.map(d => d[0]);
const WEEKDAYS = ["mo", "di", "mi", "do", "fr"];
const PORTIONS = 4;
const LONG = 45;
const MONTHS = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];

const MOOD_ICONS = {
  schnell: '<svg viewBox="0 0 24 24"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2.5M9 2h6"/></svg>',
  guenstig: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M15 9.5c-.6-1-1.7-1.5-3-1.5-1.7 0-3 .9-3 2.2 0 3 6 1.6 6 4.6 0 1.3-1.3 2.2-3 2.2-1.4 0-2.6-.6-3.2-1.6M12 6v2M12 16v2"/></svg>',
  aufwendig: '<svg viewBox="0 0 24 24"><path d="M4 11h16v5a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4z"/><path d="M2 11h20M9 4c0 1.5 1 1.5 1 3M13 4c0 1.5 1 1.5 1 3"/></svg>',
  vegi: '<svg viewBox="0 0 24 24"><path d="M5 19c0-8 5-13 14-14-1 9-6 14-14 14z"/><path d="M5 19l8-8"/></svg>',
  protein: '<svg viewBox="0 0 24 24"><path d="M6.5 6.5l11 11M4 9l5-5M15 20l5-5M3 12l2 2M10 3l2 2M12 19l2 2M19 10l2 2"/></svg>',
  italienisch: '<svg viewBox="0 0 24 24"><path d="M4 13h16a8 8 0 0 1-16 0z"/><path d="M8 13c0-3 1-6 3-8M12 13c0-3 1-5 4-7M16 13c0-2 .5-3 2-4"/></svg>'
};
const MOODS = [
  ["schnell", "Schnell"], ["guenstig", "Günstig"], ["aufwendig", "Gern länger kochen"],
  ["vegi", "Mehr Vegi"], ["protein", "Mehr Protein"], ["italienisch", "Italienisch"]
];
const FILTERS = [["alle", "Alle"], ["schnell", "Schnell"], ["guenstig", "Günstig"], ["vegi", "Vegi"], ["protein", "Viel Protein"], ["italienisch", "Italienisch"], ["fleisch", "Fleisch & Fisch"], ["plan", "Im Plan"]];

/* Illustrationen pro Gerichtsart */
const ART = {
  pasta: '<path d="M8 40h48a24 24 0 0 1-48 0z"/><path d="M14 40c2-6 6-8 10-6s6 4 10 2 6-6 10-4 6 4 8 8"/><path d="M20 34c0-8 4-14 8-18M30 34c0-10 3-16 6-20M40 36c1-8 4-14 8-16"/>',
  soup: '<path d="M8 32h48a24 24 0 0 1-48 0z"/><path d="M4 32h56"/><path d="M22 22c0-4 4-4 4-8s-4-4-4-8M32 22c0-4 4-4 4-8s-4-4-4-8M42 22c0-4 4-4 4-8s-4-4-4-8"/>',
  pan: '<circle cx="28" cy="34" r="18"/><path d="M46 34h14"/><circle cx="22" cy="30" r="4"/><circle cx="34" cy="36" r="4"/><path d="M20 40l4-2M30 26l3 2"/>',
  eggs: '<circle cx="30" cy="34" r="20"/><path d="M50 34h12"/><circle cx="23" cy="30" r="6"/><circle cx="23" cy="30" r="2.5"/><circle cx="37" cy="38" r="6"/><circle cx="37" cy="38" r="2.5"/>',
  fish: '<path d="M6 32c8-12 22-16 34-10 4 2 8 6 10 10-2 4-6 8-10 10-12 6-26 2-34-10z"/><path d="M50 32l10-10v20z"/><circle cx="18" cy="29" r="2"/><path d="M28 24c2 5 2 11 0 16"/>',
  poultry: '<path d="M38 10c8 0 14 6 14 14 0 10-8 14-14 14-4 0-6 2-8 4l-8 8"/><path d="M38 10c-8 0-14 6-14 14 0 4 2 8 6 10"/><path d="M22 50a4 4 0 1 1-6-6 4 4 0 1 1 6 6zM14 48l6-6"/>',
  oven: '<rect x="8" y="12" width="48" height="40" rx="6"/><rect x="14" y="24" width="36" height="22" rx="3"/><path d="M14 18h4M24 18h4M40 18h10"/><path d="M22 38c4-6 16-6 20 0"/>',
  grain: '<path d="M8 32h48a24 24 0 0 1-48 0z"/><circle cx="20" cy="27" r="2"/><circle cx="28" cy="24" r="2"/><circle cx="36" cy="26" r="2"/><circle cx="44" cy="28" r="2"/><circle cx="32" cy="29" r="2"/><path d="M48 8l-8 18"/>',
  salad: '<path d="M8 32h48a24 24 0 0 1-48 0z"/><path d="M14 32c0-8 6-14 12-14M24 32c2-10 10-16 18-14M36 32c2-6 8-10 14-8"/>',
  plate: '<circle cx="32" cy="32" r="22"/><circle cx="32" cy="32" r="14"/><path d="M4 12v14M8 12v14M6 26v26M60 12c-3 2-4 6-4 12h4v28"/>'
};
function artKind(r) {
  const n = (r.name + " " + (r.tags || []).join(" ")).toLowerCase();
  if (/shakshuka|\beier?\b|omelett|frittata/.test(n)) return "eggs";
  if (/lachs|fisch|forelle|crevette|kabeljau|dorsch|fish/.test(n)) return "fish";
  if (/suppe|minestrone|eintopf|zuppa|brühe|curry/.test(n)) return "soup";
  if (/risotto|reis|couscous|bowl|quinoa|polenta/.test(n)) return "grain";
  if (/ofen|gratin|lasagne|blech|auflauf|braten/.test(n)) return /poulet|huhn/.test(n) ? "poultry" : "oven";
  if (/poulet|huhn|hähnchen/.test(n)) return "poultry";
  if (/pasta|penne|spaghetti|gnocchi|nudel|tagliatelle|ravioli|orecchiette|fusilli|rigatoni/.test(n)) return "pasta";
  if (/pfanne|wok|gebraten|tofu/.test(n)) return "pan";
  if (/salat/.test(n)) return "salad";
  return "plate";
}
function artColor(r) {
  const t = r.tags || [];
  if (t.includes("fisch")) return "ocean";
  if (t.includes("poulet") || t.includes("rind")) return "saffron";
  if (t.includes("italienisch")) return "tomato";
  if (t.includes("vegetarisch")) return "basil";
  return "plum";
}
function art(r, cls = "") {
  if (!r) return `<div class="art ${cls}"><svg class="ico" viewBox="0 0 64 64" aria-hidden="true">${ART.plate}</svg></div>`;
  return `<div class="art art-${artColor(r)} ${cls}" aria-hidden="true"><span class="blob b1"></span><span class="blob b2"></span><span class="blob b3"></span><svg class="ico" viewBox="0 0 64 64">${ART[artKind(r)]}</svg></div>`;
}

const CATS = [["gemuese", "Gemüse & Früchte"], ["brot", "Brot"], ["fleisch", "Fleisch & Fisch"], ["kuehl", "Kühlregal"], ["vorrat", "Vorrat"], ["tk", "Tiefkühler"], ["andere", "Weiteres"]];
const CAT_ORDER = Object.fromEntries(CATS.map((c, i) => [c[0], i]));
function catOf(p) {
  if (p.cat && p.cat in CAT_ORDER) return p.cat;
  const n = (p.name + " " + p.label).toLowerCase();
  if (/tiefgekühlt|tk\b|tiefkühl/.test(n)) return "tk";
  if (/poulet|rind|lachs|fisch|crevette|hack|geschnetzelt|steak/.test(n)) return "fleisch";
  if (/brot|bürli|zopf|baguette/.test(n)) return "brot";
  if (/käse|gruyère|mozzarella|tofu|eier|milch|joghurt|rahm|quark|butter|gnocchi|frisch/.test(n)) return "kuehl";
  if (/dose|reis|penne|pasta|nudel|linsen|bohnen|kichererbsen|mehl|polenta|couscous/.test(n)) return "vorrat";
  if (/kabis|lauch|karotte|zwiebel|knoblauch|ingwer|zitrone|aubergine|kartoffel|tomate|salat|peterli|kräuter|zucchetti|peperoni|pilz|spinat|apfel|birne|orange|broccoli|blumenkohl|kürbis|fenchel|sellerie/.test(n)) return "gemuese";
  return "andere";
}
const FRAC = { "½": 0.5, "¼": 0.25, "¾": 0.75, "⅓": 1 / 3, "⅔": 2 / 3 };
function fmtQty(v) {
  if (v >= 10) return String(Math.round(v));
  const q = Math.round(v * 4) / 4, whole = Math.floor(q), fr = { 0.25: "¼", 0.5: "½", 0.75: "¾" }[+(q - whole).toFixed(2)] || "";
  return whole ? whole + fr : (fr || "¼");
}
function scaleText(t, f) {
  if (Math.abs(f - 1) < 1e-9) return t;
  const m = /^(\d+(?:[.,]\d+)?)?\s*([½¼¾⅓⅔])?/.exec(t);
  if (!m || (!m[1] && !m[2])) return t;
  const v = (m[1] ? parseFloat(m[1].replace(",", ".")) : 0) + (m[2] ? FRAC[m[2]] : 0);
  return fmtQty(v * f) + " " + t.slice(m[0].length).trimStart();
}

/* Besondere Tage: kein Kochen, nichts einkaufen */
const SPECIAL = {
  __aus: { name: "Auswärts essen", sub: "Restaurant, Freunde, Familie", icon: '<path d="M14 8v24M10 8v10a4 4 0 0 0 8 0V8M14 32v24"/><path d="M46 8c-5 3-7 9-7 18h7v30"/><circle cx="30" cy="34" r="0"/>' },
  __rest: { name: "Reste essen", sub: "Was noch im Kühlschrank ist", icon: '<rect x="10" y="20" width="44" height="30" rx="6"/><path d="M18 20v-4a4 4 0 0 1 4-4h20a4 4 0 0 1 4 4v4M10 32h44"/>' }
};
const isSpecial = v => Object.prototype.hasOwnProperty.call(SPECIAL, v);
function specialArt(v, cls = "") { return `<div class="art art-special ${cls}" aria-hidden="true"><svg class="ico" viewBox="0 0 64 64">${SPECIAL[v].icon}</svg></div>`; }

/* ---------- Hilfen ---------- */
const $ = id => document.getElementById(id);
const chf = n => "CHF " + n.toFixed(2);
const fmtNum = n => (Math.round(n * 10) / 10).toString().replace(".", ",");
const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const enc = k => String(k).replace(/[.#$\[\]\/]/g, "_");
function parseDate(s) { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); }
function addDays(d, n) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }
const dm = d => d.getDate() + "." + (d.getMonth() + 1) + ".";
function todayDate() { const t = new Date(); return new Date(t.getFullYear(), t.getMonth(), t.getDate()); }
const kw = id => { const m = /KW(\d+)/.exec(id); return m ? m[1] : "?"; };
const dayIndex = d => (d.getDay() + 6) % 7;

/* ---------- Wochen ---------- */
const weeks = (typeof WOCHEN !== "undefined" && Array.isArray(WOCHEN) ? WOCHEN : []).slice().sort((a, b) => b.start.localeCompare(a.start));
const weekById = Object.fromEntries(weeks.map(w => [w.id, w]));
weeks.forEach(w => { w.byId = Object.fromEntries(w.recipes.map(r => [r.id, r])); });
function weekStatus(w) {
  const t = todayDate(), s = parseDate(w.start);
  if (t >= s && t < addDays(s, 7)) return "current";
  return t < s ? "next" : "past";
}
const statusLabel = w => ({ current: "Diese Woche", next: "Nächste Woche", past: "Vorbei" })[weekStatus(w)];
function currentWeek() {
  return weeks.find(w => weekStatus(w) === "current") || weeks.filter(w => weekStatus(w) === "next").slice(-1)[0] || weeks[0];
}
function shopWeek() {
  const cur = currentWeek(), nxt = weeks.find(x => weekStatus(x) === "next" && x !== cur);
  const di = (new Date().getDay() + 6) % 7; /* 0 = Mo */
  return nxt && di >= 3 ? nxt : cur;
}
function dateOf(w, dayKey) { return addDays(parseDate(w.start), DAYKEYS.indexOf(dayKey)); }

/* ---------- Zustand ---------- */
const LS_KEY = "essplan-v3";
let store = { weeks: {}, hideDone: false, seenWeeks: {}, speak: false };
let ui = { area: "start", tab: "start", week: null, filter: "alle", query: "", ingDone: {}, tmpPor: {} };
const porOf = (s, k) => (s.por && s.por[k]) || PORTIONS;

function wstate(w) {
  let s = store.weeks[w.id];
  if (!s) s = store.weeks[w.id] = { sel: { ...w.defaultSel }, checked: {}, moods: [], have: {}, por: {} };
  if (!s.have || typeof s.have !== "object") s.have = {};
  if (!s.por || typeof s.por !== "object") s.por = {};
  if (!s.sel || typeof s.sel !== "object") s.sel = {};
  for (const k of DAYKEYS) if (!(k in s.sel) || (s.sel[k] !== "" && !isSpecial(s.sel[k]) && !w.byId[s.sel[k]])) s.sel[k] = w.defaultSel[k] || "";
  if (!Array.isArray(s.moods)) s.moods = s.moods && typeof s.moods === "object" ? Object.keys(s.moods) : [];
  if (!s.checked || typeof s.checked !== "object") s.checked = {};
  return s;
}
function saveLocal() { try { localStorage.setItem(LS_KEY, JSON.stringify(store)); } catch (e) { /* ignorieren */ } }
function loadLocal() {
  try {
    const s = JSON.parse(localStorage.getItem(LS_KEY) || "null");
    if (s && s.weeks) { store = { weeks: s.weeks, hideDone: !!s.hideDone, seenWeeks: s.seenWeeks || {}, speak: !!s.speak }; return; }
    const v2 = JSON.parse(localStorage.getItem("essplan-v2") || "null");
    if (v2 && v2.weeks) for (const [id, x] of Object.entries(v2.weeks)) {
      const checked = {}; for (const k of Object.keys(x.checked || {})) checked[enc(k)] = true;
      store.weeks[id] = { sel: x.sel || {}, checked, moods: x.moods || [] };
    }
  } catch (e) { /* ignorieren */ }
}

/* ---------- Gemeinsam speichern (Firebase Realtime Database) ---------- */
const FB_APP = "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
const FB_DB = "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";
let sync = { mode: "local", db: null, api: null, base: "" };
function syncConfigured() { return typeof SYNC !== "undefined" && SYNC && SYNC.firebase && SYNC.haushalt; }
async function connectSync() {
  if (!syncConfigured()) { sync.mode = "local"; return; }
  try {
    const [appMod, dbMod] = await Promise.all([import(FB_APP), import(FB_DB)]);
    const app = appMod.initializeApp(SYNC.firebase);
    const db = dbMod.getDatabase(app);
    sync = { mode: "connecting", db, api: dbMod, base: "haushalte/" + SYNC.haushalt + "/wochen" };
    if (typeof putzConnect === "function") putzConnect();
    if (typeof kalConnect === "function") kalConnect();
    if (typeof startConnect === "function") startConnect();
    dbMod.onValue(dbMod.ref(db, ".info/connected"), s => { sync.mode = s.val() ? "online" : "offline"; renderSyncChip(); });
    let first = true;
    dbMod.onValue(dbMod.ref(db, sync.base), snap => {
      const remote = snap.val() || {};
      for (const [id, r] of Object.entries(remote)) {
        if (!weekById[id]) continue;
        store.weeks[id] = {
          sel: r.sel || {},
          checked: r.checked || {},
          moods: r.moods ? Object.keys(r.moods) : [],
          have: r.have || {},
          por: r.por || {}
        };
      }
      if (first) {
        first = false;
        for (const [id, s] of Object.entries(store.weeks)) if (!remote[id] && weekById[id]) pushWeek(id);
      }
      saveLocal();
      render(true);
    }, () => { sync.mode = "local"; renderSyncChip(); });
  } catch (e) { sync.mode = "local"; renderSyncChip(); }
}
function remoteWeek(id) {
  const s = store.weeks[id];
  return { sel: s.sel, checked: s.checked, have: s.have || {}, por: s.por || {}, moods: Object.fromEntries((s.moods || []).map(m => [m, true])) };
}
function pushWeek(id) {
  if (!sync.api) return;
  sync.api.set(sync.api.ref(sync.db, sync.base + "/" + id), remoteWeek(id)).catch(() => {});
}
function patch(id, p) {
  saveLocal();
  if (!sync.api) return;
  sync.api.update(sync.api.ref(sync.db, sync.base + "/" + id), p).catch(() => {});
}

/* ---------- Berechnungen ---------- */
function recipeItems(r, sel) {
  let items = r.items.slice();
  if (r.needs && !Object.values(sel).includes(r.needs) && r.fallback) items = items.concat(r.fallback);
  return items;
}
const recipeCost = (w, r, sel = {}) => recipeItems(r, sel).reduce((a, [k, q]) => a + q / w.products[k].pack * w.products[k].price, 0);
const perPortion = (w, r, sel) => recipeCost(w, r, sel) / PORTIONS;
function selectedDays(w) {
  const s = wstate(w);
  return DAYS.filter(([k]) => s.sel[k] && w.byId[s.sel[k]]).map(([k, sh, l]) => ({ key: k, short: sh, long: l, recipe: w.byId[s.sel[k]] }));
}
function shoppingList(w) {
  const s = wstate(w), need = {}, usedBy = {}, pantry = {};
  for (const d of selectedDays(w)) {
    const f = porOf(s, d.key) / PORTIONS;
    for (const [k, q] of recipeItems(d.recipe, s.sel)) { need[k] = (need[k] || 0) + q * f; (usedBy[k] = usedBy[k] || new Set()).add(d.short); }
    for (const x of d.recipe.pantry || []) (pantry[x] = pantry[x] || new Set()).add(d.short);
  }
  const rows = Object.keys(need).map(k => {
    const p = w.products[k], packs = Math.max(1, Math.ceil(need[k] / p.pack - 1e-9));
    return { key: enc(k), p, cat: catOf(p), need: need[k], packs, cost: packs * p.price, statt: p.statt ? packs * p.statt : null, days: [...usedBy[k]], have: !!s.have[enc(k)] };
  });
  const pant = Object.keys(pantry).sort((a, b) => a.localeCompare(b, "de")).map(n => ({ key: enc("p:" + n), name: n, days: [...pantry[n]] }));
  return { rows, pantry: pant };
}
function summary(w) {
  const s = wstate(w), list = shoppingList(w), days = selectedDays(w);
  const buy = list.rows.filter(r => !r.have);
  const total = buy.reduce((a, r) => a + r.cost, 0);
  const saved = buy.reduce((a, r) => a + (r.statt ? r.statt - r.cost : 0), 0);
  const all = buy.length + list.pantry.length;
  const done = buy.filter(r => s.checked[r.key]).length + list.pantry.filter(p => s.checked[p.key]).length;
  const open = buy.filter(r => !s.checked[r.key]).reduce((a, r) => a + r.cost, 0);
  const withK = days.filter(d => d.recipe.kcal);
  return {
    list, days, total, saved, all, done, open, portions: days.reduce((a, d) => a + porOf(s, d.key), 0),
    kcal: withK.length ? withK.reduce((a, d) => a + d.recipe.kcal, 0) / withK.length : 0,
    prot: days.length ? days.reduce((a, d) => a + (d.recipe.protein || 0), 0) / days.length : 0,
    fish: days.filter(d => d.recipe.tags.includes("fisch")).length,
    vegi: days.filter(d => d.recipe.tags.includes("vegetarisch")).length
  };
}
function needText(row) {
  const u = row.p.unit, n = row.need;
  if (u === "g") return n >= 1000 ? fmtNum(n / 1000) + " kg" : Math.round(n) + " g";
  if (u === "dose") return fmtNum(n) + (n === 1 ? " Dose" : " Dosen");
  if (u === "beutel") return fmtNum(n) + " Beutel";
  if (u === "bund") return fmtNum(n) + " Bund";
  return fmtNum(n) + " Stück";
}

/* ---------- Plan nach Lust ---------- */
function planByMood(w, moods, keep = {}) {
  const blocked = Object.keys(keep);
  if (!moods.length && !blocked.length) return { ...w.defaultSel };
  if (!moods.length) { const sel = { ...w.defaultSel }; for (const k of blocked) sel[k] = keep[k]; return sel; }
  const slots = DAYKEYS.filter(k => !blocked.includes(k));
  const rs = w.recipes;
  const range = f => { const v = rs.map(f); const lo = Math.min(...v), hi = Math.max(...v); return r => hi > lo ? (f(r) - lo) / (hi - lo) : 0.5; };
  const cN = range(r => perPortion(w, r)), pN = range(r => r.protein || 0), tN = range(r => r.minutes || 30);
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
    if (r.minutes > LONG && chosen.filter(c => c.minutes > LONG).length >= 2) return false;
    return true;
  };
  let progress = true;
  while (chosen.length < slots.length && progress) {
    progress = false;
    for (const r of sorted) if (ok(r)) { chosen.push(r); progress = true; break; }
  }
  const sel = Object.fromEntries(DAYKEYS.map(k => [k, keep[k] || ""]));
  const wkEnd = ["sa", "so"].filter(k => slots.includes(k));
  const longs = chosen.filter(r => r.minutes > LONG).sort((a, b) => (a.needs ? 1 : 0) - (b.needs ? 1 : 0));
  const rest = chosen.filter(r => r.minutes <= LONG);
  longs.forEach((r, i) => { if (wkEnd[i]) sel[wkEnd[i]] = r.id; else rest.push(r); });
  const free = [...WEEKDAYS.filter(k => slots.includes(k)), ...wkEnd.filter(d => !sel[d])];
  rest.forEach((r, i) => { if (free[i]) sel[free[i]] = r.id; });
  return sel;
}

/* ---------- Bausteine ---------- */
function ringSvg(pct, size = 54) {
  const r = 22, c = 2 * Math.PI * r;
  return `<svg class="ring" viewBox="0 0 54 54" width="${size}" height="${size}" aria-hidden="true"><circle class="bg" cx="27" cy="27" r="${r}"/><circle class="fg" cx="27" cy="27" r="${r}" stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - pct)}"/></svg>`;
}
function weekbar(active) {
  return `<div class="weekbar" role="group" aria-label="Woche wählen">${weeks.slice().reverse().map(w => {
    const s = parseDate(w.start);
    return `<button class="wk" data-week="${w.id}" aria-pressed="${w.id === active.id}"><b>KW ${kw(w.id)}</b><span>${statusLabel(w)} · ${dm(s)}</span></button>`;
  }).join("")}</div>`;
}
function syncChipHtml() {
  const m = sync.mode;
  const txt = m === "online" ? "Gemeinsam" : m === "offline" ? "Offline" : m === "connecting" ? "Verbinde …" : "Nur dieses Handy";
  const cls = m === "online" ? "on" : m === "offline" ? "off" : "";
  return `<button class="sync ${cls}" id="syncChip" data-act="syncinfo"><i></i>${txt}</button>`;
}
function renderSyncChip() { const el = $("syncChip"); if (el) el.outerHTML = syncChipHtml(); }
function greeting() { const h = new Date().getHours(); return h < 11 ? "Guten Morgen" : h < 17 ? "Hallo" : "Guten Abend"; }
function moodPanel(w) {
  const s = wstate(w);
  return `<div class="card"><div class="spread"><h2>Worauf habt ihr Lust?</h2></div>
    <div class="moods" role="group" aria-label="Lust">${MOODS.map(([id, l]) => `<button class="mood" data-mood="${id}" aria-pressed="${s.moods.includes(id)}">${MOOD_ICONS[id]}<span>${l}</span></button>`).join("")}</div>
    <button class="btn primary block" data-act="plan">${s.moods.length ? "Woche nach Lust zusammenstellen" : "Vorschlag der Woche verwenden"}</button>
    <div class="toast" id="toast" aria-live="polite"></div></div>`;
}

function remindersToday() {
  const t = todayDate().getTime(), out = [];
  const sw = shopWeek();
  if (new Date().getDay() === 6 && sw !== currentWeek()) {
    const sm = summary(sw);
    if (sm.done < sm.all) out.push({ text: "Heute Grosseinkauf für nächste Woche", for: `${sm.all - sm.done} Dinge · ca. ${chf(sm.open)} · Migros-Aktionen gelten bis Mittwoch`, shop: sw.id });
  }
  for (const w of weeks) {
    const s = wstate(w);
    for (const [k, , l] of DAYS) {
      const r = w.byId[s.sel[k]];
      if (!r || !Array.isArray(r.prep)) continue;
      for (const p of r.prep) {
        if (addDays(dateOf(w, k), -(p.daysBefore || 0)).getTime() === t) out.push({ text: p.text, for: (p.daysBefore ? l + ": " : "Heute: ") + r.name });
      }
    }
  }
  return out;
}

/* ---------- Heute ---------- */
function viewHeute() {
  const w = currentWeek(), s = wstate(w), sm = summary(w), st = weekStatus(w);
  const now = new Date(), tk = DAYKEYS[dayIndex(now)];
  const r = st === "current" && s.sel[tk] ? w.byId[s.sel[tk]] : null;
  const prevKey = DAYKEYS[dayIndex(now) - 1];
  const yesterday = st === "current" && prevKey && s.sel[prevKey] ? w.byId[s.sel[prevKey]] : null;
  const tomorrowKey = DAYKEYS[dayIndex(now) + 1];
  const tomorrow = st === "current" && tomorrowKey && s.sel[tomorrowKey] ? w.byId[s.sel[tomorrowKey]] : null;
  const nxt = weeks.find(x => weekStatus(x) === "next" && x !== w);

  let hero;
  if (st !== "current") {
    hero = `<div class="hero">${art(w.byId[w.defaultSel.mo])}<div class="hero-body"><span class="eyebrow">Als Nächstes</span><h2>Woche ab ${dm(parseDate(w.start))}</h2><div class="btns"><button class="btn primary" data-go="woche" data-week="${w.id}">Plan ansehen</button></div></div></div>`;
  } else if (st === "current" && isSpecial(s.sel[tk])) {
    const sp = SPECIAL[s.sel[tk]];
    hero = `<div class="hero">${specialArt(s.sel[tk])}<div class="hero-body"><span class="eyebrow">Heute</span><h2>${sp.name}</h2><p class="muted">${sp.sub}. Heute müsst ihr nichts kochen.</p><div class="btns"><button class="btn soft" data-swap="${tk}" data-week="${w.id}">Doch kochen</button></div></div></div>`;
  } else if (r) {
    hero = `<div class="hero">${art(r)}<div class="hero-body">
      <span class="eyebrow">Heute auf dem Tisch</span><h2>${esc(r.name)}</h2>
      <div class="facts"><span class="fact">${esc(r.time)}</span>${r.kcal ? `<span class="fact">${r.kcal} kcal</span>` : ""}${r.protein ? `<span class="fact">${r.protein} g Protein</span>` : ""}<span class="fact num">${chf(perPortion(w, r, s.sel))} / Portion</span></div>
      <div class="btns"><button class="btn primary" data-cook="${tk}" data-week="${w.id}">Jetzt kochen</button><button class="btn soft" data-recipe="${r.id}" data-week="${w.id}">Rezept</button></div></div></div>`;
  } else {
    hero = `<div class="hero">${art(null)}<div class="hero-body"><span class="eyebrow">Heute</span><h2>Heute ist kochfrei</h2><p class="muted">Lust auf etwas? Wähle ein Gericht für heute.</p><div class="btns"><button class="btn primary" data-swap="${tk}" data-week="${w.id}">Gericht wählen</button></div></div></div>`;
  }
  const lunchIco = '<svg viewBox="0 0 24 24"><rect x="3" y="8" width="18" height="12" rx="3"/><path d="M8 8V6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 13h18"/></svg>';
  const lunch = yesterday ? `<div class="lunch">${lunchIco}<div><b>Lunchbox heute</b><div class="small">2 Portionen ${esc(yesterday.name)} von gestern.</div></div></div>`
    : r ? `<div class="lunch">${lunchIco}<div><b>Heute Abend 2 Portionen einpacken</b><div class="small">Die sind eure Lunchbox für morgen.</div></div></div>` : "";

  const strip = st === "current" || st === "next" ? `<div class="section"><div class="section-head"><h2>Diese Woche</h2><button class="chip" data-go="woche" data-week="${w.id}">Alle Tage</button></div>
    <div class="strip">${DAYS.map(([k, sh]) => {
      const x = w.byId[s.sel[k]], isT = st === "current" && k === tk, sp = isSpecial(s.sel[k]) ? s.sel[k] : null;
      return `<button class="daychip${isT ? " today" : ""}${x ? "" : " free"}" ${x ? `data-recipe="${x.id}"` : `data-swap="${k}"`} data-week="${w.id}">${sp ? specialArt(sp) : art(x)}<b>${sh} ${dm(dateOf(w, k))}</b><span>${x ? esc(x.name) : sp ? SPECIAL[sp].name : "frei"}</span></button>`;
    }).join("")}</div></div>` : "";

  const banner = nxt ? `<button class="banner" data-go="gerichte" data-week="${nxt.id}"><span class="spark">${nxt.recipes.length}</span><span><b>Neue Gerichte für nächste Woche</b><span class="small">Ab ${dm(parseDate(nxt.start))} · jetzt aussuchen</span></span><span class="go" aria-hidden="true">›</span></button>` : "";
  const ssm = summary(shopWeek());
  const pct = ssm.all ? ssm.done / ssm.all : 0;
  const d = new Date();
  const wunsch = "https://github.com/luabru190501/Essplan/issues/new?title=" + encodeURIComponent("Wunsch für nächste Woche") + "&body=" + encodeURIComponent("Schreib hier deinen Wunsch, z. B. «mehr Curry», «weniger Pasta», «Lieblingsgericht: …». Dann unten auf «Create» tippen.");

  return `
    <div class="top"><div><span class="eyebrow">${DAYS[dayIndex(d)][2]}, ${d.getDate()}. ${MONTHS[d.getMonth()]}</span><h1>${greeting()}!</h1></div>${syncChipHtml()}</div>
    ${banner}
    ${hero}
    ${(() => { const rem = remindersToday(); return rem.length ? `<div class="card remind"><h3>Nicht vergessen</h3>${rem.map(x => `<div class="rem"><span class="dot"></span><span><b>${esc(x.text)}</b><br><span class="small muted">${esc(x.for)}</span>${x.shop ? `<br><button class="chip" style="margin-top:6px" data-go="einkauf" data-week="${x.shop}">Zur Einkaufsliste</button>` : ""}</span></div>`).join("")}</div>` : ""; })()}
    ${lunch}
    ${typeof kalHeuteCard === "function" ? kalHeuteCard() : ""}
    ${typeof putzHeuteCard === "function" ? putzHeuteCard() : ""}
    ${tomorrow ? `<button class="pick" data-recipe="${tomorrow.id}" data-week="${w.id}">${art(tomorrow)}<span><span>Morgen</span><b>${esc(tomorrow.name)}</b></span><span class="muted small">${esc(tomorrow.time)}</span></button>` : ""}
    <div class="tiles">
      <button class="tile" data-go="einkauf" data-week="${shopWeek().id}"><span class="spread"><span><span class="small muted">${shopWeek() === w ? "Einkauf" : "Einkauf nächste Woche"}</span><b class="num">${ssm.done}/${ssm.all}</b></span>${ringSvg(pct)}</span><span class="small muted num">noch ${chf(ssm.open)}</span></button>
      <button class="tile" data-go="woche" data-week="${w.id}"><span class="small muted">Woche total</span><b class="num">${chf(sm.total)}</b><span class="small muted num">${sm.portions ? chf(sm.total / sm.portions) : "–"} pro Portion</span></button>
    </div>
    ${strip}
    <div class="card"><h3>Wunsch für nächste Woche</h3><p class="small muted">Mehr Curry, weniger Pasta, ein Lieblingsgericht? Der nächste Plan berücksichtigt es.</p>
      <a class="btn soft block" style="text-align:center;text-decoration:none" href="${wunsch}" target="_blank" rel="noopener">Wunsch schreiben</a></div>
    <p class="footer">Alle Rezepte ohne Schweinefleisch · 4 Portionen pro Gericht, 2 davon zum Mitnehmen</p>`;
}

/* ---------- Woche ---------- */
function viewWoche(w) {
  const s = wstate(w), sm = summary(w), st = weekStatus(w), tk = st === "current" ? DAYKEYS[dayIndex(new Date())] : "";
  const start = parseDate(w.start);
  const badges = [`<span class="badge">${sm.vegi}× vegi</span>`, `<span class="badge">Ø ${Math.round(sm.prot)} g Protein</span>`, ...(sm.kcal ? [`<span class="badge">Ø ${Math.round(sm.kcal)} kcal</span>`] : []),
    sm.fish > 1 ? `<span class="badge warn">Fisch ${sm.fish}×, lieber 1×</span>` : `<span class="badge">Fisch ${sm.fish}×</span>`, `<span class="badge">ohne Schweinefleisch</span>`];
  return `
    <div class="top"><div><span class="eyebrow">${statusLabel(w)}</span><h1>${dm(start)} – ${dm(addDays(start, 6))}</h1></div>${syncChipHtml()}</div>
    ${weeks.length > 1 ? weekbar(w) : ""}
    <div class="stats">
      <div class="stat"><b class="num">${chf(sm.total)}</b><span>Einkauf</span></div>
      <div class="stat"><b class="num">${sm.portions ? chf(sm.total / sm.portions) : "–"}</b><span>pro Portion</span></div>
      <div class="stat"><b class="num">${chf(sm.saved)}</b><span>gespart</span></div>
    </div>
    <div class="badges">${badges.join("")}</div>
    ${st === "past" ? `<div class="note">Diese Woche ist vorbei. Preise und Aktionen stimmen nicht mehr, die Rezepte kannst du weiter nutzen.</div>` : ""}
    ${moodPanel(w)}
    <div class="section"><h2>Euer Plan</h2><div class="days">${DAYS.map(([k, sh]) => {
      const r = w.byId[s.sel[k]];
      const needsNote = r && r.needs && !Object.values(s.sel).includes(r.needs) ? `<span>+ Zusatzzutat, weil ${esc(w.byId[r.needs] ? w.byId[r.needs].name : "das Vorgericht")} fehlt</span>` : "";
      const sp = isSpecial(s.sel[k]) ? s.sel[k] : null;
      return `<div class="day${k === tk ? " today" : ""}${r ? "" : " free"}">
        <div class="date"><b>${sh}</b><span>${dm(dateOf(w, k))}</span></div>
        ${sp ? specialArt(sp) : art(r)}
        <div class="info">${r ? `<button class="name" data-recipe="${r.id}" data-week="${w.id}">${esc(r.name)}</button>
          <div class="meta"><span>${esc(r.time)}</span>${r.kcal ? `<span>${r.kcal} kcal</span>` : ""}${r.protein ? `<span>${r.protein} g Protein</span>` : ""}<span class="num">${chf(perPortion(w, r, s.sel))}</span>${porOf(s, k) !== PORTIONS ? `<span class="porbadge">${porOf(s, k)} Portionen</span>` : ""}${needsNote}</div>`
          : sp ? `<b>${SPECIAL[sp].name}</b><div class="meta"><span>${SPECIAL[sp].sub}</span></div>` : `<b class="muted">Kochfrei</b>`}
          <button class="swap" data-swap="${k}" data-week="${w.id}">${r ? "Tauschen" : "Gericht wählen"}</button></div></div>`;
    }).join("")}</div></div>
    <p class="footer">${esc(w.updated)}</p>`;
}

/* ---------- Gerichte ---------- */
function matchFilter(w, r, s) {
  switch (ui.filter) {
    case "schnell": return r.minutes <= 25;
    case "guenstig": return perPortion(w, r) <= 3;
    case "vegi": return r.tags.includes("vegetarisch");
    case "protein": return (r.protein || 0) >= 30;
    case "italienisch": return r.tags.includes("italienisch");
    case "fleisch": return !r.tags.includes("vegetarisch");
    case "plan": return Object.values(s.sel).includes(r.id);
    default: return true;
  }
}
function matchQuery(r) {
  const q = ui.query.trim().toLowerCase();
  if (!q) return true;
  return (r.name + " " + r.ingredients.join(" ")).toLowerCase().includes(q);
}
function dishGrid(w) {
  const s = wstate(w);
  const list = w.recipes.filter(r => matchFilter(w, r, s) && matchQuery(r));
  if (!list.length) return `<div class="empty">Kein Gericht passt. Probier einen anderen Filter.</div>`;
  return `<div class="grid">${list.map(r => {
    const on = DAYS.filter(([k]) => s.sel[k] === r.id).map(d => d[1]);
    return `<button class="dish" data-recipe="${r.id}" data-week="${w.id}">${on.length ? `<span class="inplan">${on.join(" · ")}</span>` : ""}${art(r)}
      <span class="txt"><b>${esc(r.name)}</b><span>${esc(r.time)} · ${chf(perPortion(w, r))}${r.kcal ? ` · ${r.kcal} kcal` : ""}${r.protein ? ` · ${r.protein} g Prot.` : ""}</span></span></button>`;
  }).join("")}</div>`;
}
function viewGerichte(w) {
  return `
    <div class="top"><div><span class="eyebrow">KW ${kw(w.id)} · ${statusLabel(w)}</span><h1>${w.recipes.length} Gerichte</h1></div>${syncChipHtml()}</div>
    ${weeks.length > 1 ? weekbar(w) : ""}
    <input class="search" id="search" type="search" placeholder="Suchen, z. B. Kichererbsen" value="${esc(ui.query)}" aria-label="Gerichte suchen">
    <div class="chips" role="group" aria-label="Filter">${FILTERS.map(([v, l]) => `<button class="chip" data-filter="${v}" aria-pressed="${ui.filter === v}">${l}</button>`).join("")}</div>
    <div id="dishGrid">${dishGrid(w)}</div>`;
}

/* ---------- Einkauf ---------- */
function viewEinkauf(w) {
  const s = wstate(w), sm = summary(w), list = sm.list;
  const groupHtml = (title, rows, extra) => {
    const vis = store.hideDone ? rows.filter(r => !s.checked[r.key]) : rows;
    if (!rows.length) return "";
    let lastCat = null, body = "";
    for (const r of vis) {
      if (r.p && r.cat !== lastCat) { lastCat = r.cat; body += `<div class="subhead">${CATS[CAT_ORDER[r.cat]][1]}</div>`; }
      body += r.p ? itemRow(r, s) : pantryRow(r, s);
    }
    return `<div class="group"><h3>${title} ${extra}</h3>${vis.length ? body : `<div class="empty small">Alles erledigt.</div>`}</div>`;
  };
  const itemRow = (r, s) => `<label class="item${s.checked[r.key] ? " checked" : ""}"><input type="checkbox" data-check="${r.key}"${s.checked[r.key] ? " checked" : ""}>
      <span><span class="name">${r.packs > 1 ? r.packs + " × " : ""}${esc(r.p.name)}${r.p.statt ? `<span class="deal">Aktion</span>` : ""}</span><br>
      <span class="info">${esc(r.p.label)} · Bedarf ${needText(r)} · ${r.days.join(", ")}</span></span>
      <span class="price num">${r.p.approx ? "ca. " : ""}${r.cost.toFixed(2)}${r.statt ? `<s>${r.statt.toFixed(2)}</s>` : ""}<button class="havebtn" data-have="${r.key}">Haben wir</button></span></label>`;
  const pantryRow = (p, s) => `<label class="item${s.checked[p.key] ? " checked" : ""}"><input type="checkbox" data-check="${p.key}"${s.checked[p.key] ? " checked" : ""}>
      <span><span class="name">${esc(p.name)}</span><br><span class="info">${p.days.join(", ")}</span></span><span></span></label>`;
  const byStore = st => list.rows.filter(r => r.p.store === st && !r.have).sort((a, b) => (CAT_ORDER[a.cat] - CAT_ORDER[b.cat]) || a.p.name.localeCompare(b.p.name, "de"));
  const haveRows = list.rows.filter(r => r.have);
  const sumOf = rows => chf(rows.reduce((a, r) => a + r.cost, 0));
  const mig = byStore("Migros"), aldi = byStore("Aldi");
  return `
    <div class="top"><div><span class="eyebrow">KW ${kw(w.id)} · ${statusLabel(w)}</span><h1>Einkauf</h1></div>${syncChipHtml()}</div>
    ${weeks.length > 1 ? weekbar(w) : ""}
    <div class="card shop-head">${ringSvg(sm.all ? sm.done / sm.all : 0, 72)}
      <div><b class="num" style="font-family:var(--font-display);font-size:22px">${sm.done} von ${sm.all}</b><div class="muted small num">noch ${chf(sm.open)} von ${chf(sm.total)}</div></div></div>
    <div class="spread"><label class="switch"><input type="checkbox" id="hideDone"${store.hideDone ? " checked" : ""}>Erledigte ausblenden</label>
      <span class="row"><button class="chip" data-act="copy">Kopieren</button><button class="chip" data-act="reset">Zurücksetzen</button></span></div>
    <div class="toast" id="copyMsg" aria-live="polite"></div>
    ${groupHtml("Migros", mig, `<span class="num">${sumOf(mig)}</span>`)}
    ${groupHtml("Aldi", aldi, `<span class="num">${sumOf(aldi)}</span>`)}
    ${groupHtml("Grundvorrat", list.pantry, "<span>zu Hause prüfen</span>")}
    ${haveRows.length ? `<div class="group"><h3>Schon zu Hause <span>nicht im Total</span></h3>${haveRows.map(r => `<div class="item haveitem"><span></span><span><span class="name">${esc(r.p.name)}</span><br><span class="info">${esc(r.p.label)} · Bedarf ${needText(r)}</span></span><span class="price"><button class="havebtn" data-unhave="${r.key}">Doch kaufen</button></span></div>`).join("")}</div>` : ""}
    <p class="footer">${esc(w.updated)}</p>`;
}

/* ---------- Blatt: Rezept und Auswahl ---------- */
let sheetCtx = null;
function openSheet(html, plain = false) {
  const sh = $("sheet"), sc = $("scrim");
  sh.innerHTML = html; sh.classList.toggle("plain", plain);
  sh.hidden = false; sc.hidden = false; sh.scrollTop = 0;
  requestAnimationFrame(() => { sh.classList.add("show"); sc.classList.add("show"); });
  const c = sh.querySelector(".close"); if (c) c.focus();
}
function closeSheet() {
  const sh = $("sheet"), sc = $("scrim");
  sh.classList.remove("show"); sc.classList.remove("show"); sheetCtx = null;
  setTimeout(() => { if (!sh.classList.contains("show")) { sh.hidden = true; sc.hidden = true; } }, 300);
}
function sourceLink(r) {
  if (!r.source || !/^https:\/\//.test(r.source.url || "")) return "";
  return `<a class="src" href="${esc(r.source.url)}" target="_blank" rel="noopener">Originalrezept auf ${esc(r.source.name || "der Webseite")} ↗</a>`;
}
function recipeSheet(w, r) {
  const s = wstate(w);
  sheetCtx = { type: "recipe", week: w.id, recipe: r.id };
  const days = DAYS.filter(([k]) => s.sel[k] === r.id).map(d => d[0]);
  const por = days.length ? porOf(s, days[0]) : (ui.tmpPor[r.id] || PORTIONS), f = por / PORTIONS;
  return `<div class="grab"><span class="handle"></span><button class="close" data-act="close" aria-label="Schliessen">×</button></div>
    ${art(r, "head")}
    <div class="content">
      <div class="badges">${r.tags.map(t => `<span class="badge">${t}</span>`).join("")}</div>
      <h2 style="font-size:27px">${esc(r.name)}</h2>
      <div class="factgrid">
        <div><b>${r.minutes}′</b><span>Minuten</span></div>
        <div><b>${r.kcal || "–"}</b><span>kcal/Portion</span></div>
        <div><b>${r.protein || "–"}${r.protein ? " g" : ""}</b><span>Protein</span></div>
        <div><b class="num">${perPortion(w, r, s.sel).toFixed(2)}</b><span>CHF/Portion</span></div>
      </div>
      <div class="stepper"><span><b>Portionen</b><br><span class="small muted">${days.length ? "gilt für " + days.map(k => DAYS.find(d => d[0] === k)[1]).join(", ") + " · Einkauf passt sich an" : "2 zum Essen, 2 zum Mitnehmen"}</span></span>
        <span class="row"><button data-por="-1" aria-label="Weniger Portionen">−</button><b class="num" id="porVal">${por}</b><button data-por="1" aria-label="Mehr Portionen">+</button></span></div>
      ${sourceLink(r)}
      ${r.note ? `<div class="note">${esc(r.note)}</div>` : ""}
      <div class="section"><h3>An welchem Tag?</h3>
        <div class="daypick">${DAYS.map(([k, sh]) => `<button data-assign="${k}" aria-pressed="${days.includes(k)}" aria-label="${sh}">${sh}</button>`).join("")}</div></div>
      <div class="section"><h3>Zutaten</h3><ul class="ing">${r.ingredients.map((x, i) => `<li data-ing="${i}" class="${ui.ingDone[r.id + i] ? "done" : ""}">${esc(scaleText(x, f))}</li>`).join("")}</ul></div>
      <div class="section"><h3>Zubereitung</h3><ol class="steps">${r.steps.map(x => `<li>${esc(x)}</li>`).join("")}</ol></div>
    </div>
    <div class="sticky-cta"><button class="btn primary block" data-cookrecipe="${r.id}">Schritt für Schritt kochen</button></div>`;
}
function pickSheet(w, dayKey) {
  const s = wstate(w), cur = s.sel[dayKey], dayName = DAYS.find(d => d[0] === dayKey)[2];
  sheetCtx = { type: "pick", week: w.id, day: dayKey };
  const sorted = w.recipes.slice().sort((a, b) => (b.id === cur) - (a.id === cur));
  return `<div class="grab"><span class="handle"></span><button class="close" data-act="close" aria-label="Schliessen">×</button></div>
    <div class="content" style="padding-top:0">
      <div><span class="eyebrow">${dayName}, ${dm(dateOf(w, dayKey))}</span><h2>Was kocht ihr?</h2></div>
      <div class="pick-list">
        ${Object.entries(SPECIAL).map(([v, sp]) => `<button class="pick${cur === v ? " current" : ""}" data-choose="${v}">${specialArt(v)}<span><b>${sp.name}</b><span>${sp.sub}</span></span><span class="tick">${cur === v ? "✓" : ""}</span></button>`).join("")}
        <button class="pick${cur === "" ? " current" : ""}" data-choose="">${art(null)}<span><b>Noch offen</b><span>Entscheiden wir spontan</span></span><span class="tick">${cur === "" ? "✓" : ""}</span></button>
        ${sorted.map(r => `<button class="pick${r.id === cur ? " current" : ""}" data-choose="${r.id}">${art(r)}<span><b>${esc(r.name)}</b><span>${esc(r.time)} · ${chf(perPortion(w, r))}${r.protein ? ` · ${r.protein} g Prot.` : ""}</span></span><span class="tick">${r.id === cur ? "✓" : ""}</span></button>`).join("")}
      </div></div>`;
}
function syncSheet() {
  sheetCtx = { type: "sync" };
  const on = syncConfigured();
  return `<div class="grab"><span class="handle"></span><button class="close" data-act="close" aria-label="Schliessen">×</button></div>
    <div class="content" style="padding-top:0"><h2>${on ? "Gemeinsam speichern" : "Nur auf diesem Handy"}</h2>
    <p>${on ? "Auswahl, Lust und Häkchen werden sofort mit allen Handys geteilt, auf denen diese App läuft. Ohne Internet speichert die App auf dem Handy und gleicht später ab."
      : "Im Moment speichert jedes Handy seine Auswahl und Häkchen für sich. Sobald das gemeinsame Speichern eingerichtet ist, seht ihr beide dasselbe."}</p></div>`;
}

/* ---------- Kochmodus ---------- */
let cook = null, wakeLock = null, timer = null;
function openCookRecipe(w, r) {
  closeSheet();
  cook = { r, i: 0 };
  $("cookTitle").textContent = r.name;
  const s = wstate(w), days = DAYS.filter(([k]) => s.sel[k] === r.id).map(d => d[0]);
  const f = (days.length ? porOf(s, days[0]) : (ui.tmpPor[r.id] || PORTIONS)) / PORTIONS;
  $("cookIng").innerHTML = r.ingredients.map(x => `<li>${esc(scaleText(x, f))}</li>`).join("");
  drawSpeakBtn();
  $("cook").hidden = false;
  drawCook();
  try { if (navigator.wakeLock) navigator.wakeLock.request("screen").then(l => { wakeLock = l; }).catch(() => {}); } catch (e) { /* ignorieren */ }
}
function stepMinutes(t) { const m = /(\d+)(?:\s*(?:bis|–|-)\s*(\d+))?\s*Min/.exec(t); return m ? Number(m[2] || m[1]) : 0; }
function drawCook() {
  const { r, i } = cook;
  $("cookSegs").innerHTML = r.steps.map((_, j) => `<i class="${j <= i ? "on" : ""}"></i>`).join("");
  $("cookNum").textContent = String(i + 1).padStart(2, "0") + " / " + String(r.steps.length).padStart(2, "0");
  $("cookStep").textContent = r.steps[i];
  $("cookPrev").disabled = i === 0;
  $("cookNext").textContent = i === r.steps.length - 1 ? "Fertig, en Guete!" : "Weiter";
  if (store.speak) say(`Schritt ${i + 1}. ${r.steps[i]}`);
  const min = stepMinutes(r.steps[i]);
  const tb = $("cookTimer");
  if (timer && timer.step === i) { tb.hidden = false; }
  else if (min > 0 && !timer) { tb.hidden = false; tb.classList.remove("run"); $("cookTimerTxt").textContent = `Timer ${min} Min. starten`; tb.dataset.min = min; }
  else if (!timer) { tb.hidden = true; }
}
function beep() {
  try {
    const ctx = timer && timer.ctx; if (!ctx) return;
    [0, 0.35, 0.7].forEach(t => { const o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.value = 880; o.connect(g); g.connect(ctx.destination); g.gain.setValueAtTime(0.25, ctx.currentTime + t); g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.3); o.start(ctx.currentTime + t); o.stop(ctx.currentTime + t + 0.3); });
  } catch (e) { /* ignorieren */ }
}
function toggleTimer() {
  const tb = $("cookTimer");
  if (timer) { clearInterval(timer.id); timer = null; tb.classList.remove("run"); drawCook(); return; }
  const min = Number(tb.dataset.min || 0); if (!min) return;
  let ctx = null; try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { /* ohne Ton */ }
  const end = Date.now() + min * 60000;
  timer = { step: cook.i, ctx, id: setInterval(() => {
    const left = Math.max(0, end - Date.now()), m = Math.floor(left / 60000), s = Math.floor(left / 1000) % 60;
    $("cookTimerTxt").textContent = left ? `${m}:${String(s).padStart(2, "0")} · antippen zum Stoppen` : "Zeit ist um!";
    if (!left) { clearInterval(timer.id); beep(); setTimeout(() => { timer = null; tb.classList.remove("run"); if (cook) drawCook(); }, 4000); }
  }, 250) };
  tb.classList.add("run");
}
function say(text) {
  try {
    if (!("speechSynthesis" in window)) return;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text), voices = speechSynthesis.getVoices();
    u.lang = "de-DE"; u.rate = 0.95;
    const v = voices.find(v => /^de[-_]CH/i.test(v.lang)) || voices.find(v => /^de/i.test(v.lang)); if (v) u.voice = v;
    speechSynthesis.speak(u);
  } catch (e) { /* ignorieren */ }
}
function drawSpeakBtn() {
  const b = $("cookSpeak"); if (!b) return;
  b.setAttribute("aria-pressed", String(!!store.speak));
  $("cookSpeakTxt").textContent = store.speak ? "Vorlesen an" : "Vorlesen";
  b.hidden = !("speechSynthesis" in window);
}
function closeCook() {
  try { if ("speechSynthesis" in window) speechSynthesis.cancel(); } catch (e) { /* ignorieren */ }
  $("cook").hidden = true; cook = null;
  if (timer) { clearInterval(timer.id); timer = null; }
  if (wakeLock) { wakeLock.release().catch(() => {}); wakeLock = null; }
}
$("cookPrev").onclick = () => { if (cook.i > 0) { cook.i--; drawCook(); } };
$("cookNext").onclick = () => { if (cook.i < cook.r.steps.length - 1) { cook.i++; drawCook(); } else closeCook(); };
$("cookClose").onclick = closeCook;
$("cookTimer").onclick = toggleTimer;
$("cookSpeak").onclick = () => {
  store.speak = !store.speak; saveLocal(); drawSpeakBtn();
  if (store.speak && cook) say(`Schritt ${cook.i + 1}. ${cook.r.steps[cook.i]}`);
  else try { speechSynthesis.cancel(); } catch (e) { /* ignorieren */ }
};

/* ---------- Navigation ---------- */
function activeWeek() { return weekById[ui.week] || currentWeek(); }
const ESSEN_TABS = ["heute", "woche", "gerichte", "einkauf"];
function go(tab, weekId) {
  if (tab === "essen") tab = ESSEN_TABS.includes(ui.tab) ? ui.tab : "heute";
  ui.area = ESSEN_TABS.includes(tab) ? "essen" : tab;
  ui.tab = tab; if (weekId) ui.week = weekId;
  const h = tab === "start" ? "zuhause" : ["heute", "haushalt", "kalender"].includes(tab) ? tab : tab + "-" + activeWeek().id;
  if (location.hash !== "#" + h) history.replaceState(null, "", "#" + h);
  render();
}
function readHash() {
  const h = decodeURIComponent(location.hash.slice(1));
  const m = /^(woche|gerichte|einkauf)(?:-(.+))?$/.exec(h);
  if (m) { ui.tab = m[1]; if (m[2] && weekById[m[2]]) ui.week = m[2]; }
  else if (h === "haushalt" && typeof viewHaushalt === "function") ui.tab = "haushalt";
  else if (h === "kalender" && typeof viewKalender === "function") ui.tab = "kalender";
  else if (h === "heute") ui.tab = "heute";
  else ui.tab = typeof viewStart === "function" ? "start" : "heute";
  ui.area = ESSEN_TABS.includes(ui.tab) ? "essen" : ui.tab;
}
window.addEventListener("hashchange", () => { readHash(); render(); });

function render(keepScroll = false) {
  const v = $("view");
  if (!weeks.length) { v.innerHTML = `<div class="empty">Noch keine Wochendaten vorhanden.</div>`; return; }
  const y = window.scrollY;
  const w = activeWeek();
  const essenNav = () => {
    const ssm = summary(shopWeek()), left = ssm.all - ssm.done;
    return `<nav class="seg" aria-label="Essen">${[["heute", "Heute"], ["woche", "Woche"], ["gerichte", "Gerichte"], ["einkauf", "Einkauf"]].map(([k, l]) =>
      `<button data-go="${k}" ${k === "einkauf" ? `data-week="${shopWeek().id}"` : ""} aria-current="${ui.tab === k ? "page" : "false"}">${l}${k === "einkauf" && left ? `<span class="count num">${left}</span>` : ""}</button>`).join("")}</nav>`;
  };
  v.innerHTML = ui.area === "start" && typeof viewStart === "function" ? viewStart()
    : ui.area === "haushalt" && typeof viewHaushalt === "function" ? viewHaushalt()
    : ui.area === "kalender" && typeof viewKalender === "function" ? viewKalender()
    : essenNav() + (ui.tab === "woche" ? viewWoche(w) : ui.tab === "gerichte" ? viewGerichte(w) : ui.tab === "einkauf" ? viewEinkauf(w) : viewHeute());
  document.querySelectorAll(".tabbar button").forEach(b => b.setAttribute("aria-current", b.dataset.tab === ui.area ? "page" : "false"));
  const cnt = $("tabCountHaushalt");
  if (cnt && typeof putzToday === "function" && putzMe !== null) { const n = putzToday().filter(x => !x.done && x.to === putzMe).length; cnt.hidden = !n; cnt.textContent = n; }
  const kc = $("tabCountKalender");
  if (kc && typeof eventsOn === "function") { const n = eventsOn(iso(todayDate())).length; kc.hidden = !n; kc.textContent = n; }
  if (keepScroll) window.scrollTo(0, y); else window.scrollTo(0, 0);
  const wk = v.querySelector('.wk[aria-pressed="true"]'); if (wk && wk.scrollIntoView) wk.scrollIntoView({ inline: "center", block: "nearest" });
  if (keepScroll) window.scrollTo(0, y);
  if (sheetCtx && sheetCtx.type === "recipe") { const sw = weekById[sheetCtx.week]; $("sheet").querySelectorAll("[data-assign]").forEach(b => b.setAttribute("aria-pressed", String(wstate(sw).sel[b.dataset.assign] === sheetCtx.recipe))); }
}

/* ---------- Ereignisse ---------- */
document.querySelector(".tabbar").addEventListener("click", e => {
  const b = e.target.closest("button[data-tab]"); if (!b) return;
  go(b.dataset.tab);
});
$("scrim").addEventListener("click", closeSheet);
document.addEventListener("keydown", e => {
  if (e.key === "Escape") { if (cook) closeCook(); else if (sheetCtx) closeSheet(); }
  if (cook && e.key === "ArrowRight") $("cookNext").click();
  if (cook && e.key === "ArrowLeft") $("cookPrev").click();
});

$("view").addEventListener("click", async e => {
  const t = e.target.closest("button, a"); if (!t || t.tagName === "A") return;
  const d = t.dataset;
  if (d.go) return go(d.go, d.week);
  if (t.classList.contains("wk")) { ui.week = d.week; return go(ui.tab, d.week); }
  const w = weekById[d.week] || activeWeek();
  if (d.recipe) return openSheet(recipeSheet(w, w.byId[d.recipe]));
  if (d.swap) return openSheet(pickSheet(w, d.swap), true);
  if (d.cook) return openCookRecipe(w, w.byId[wstate(w).sel[d.cook]]);
  if (d.filter) { ui.filter = d.filter; return render(true); }
  if (d.mood) {
    const s = wstate(w), m = d.mood;
    if (s.moods.includes(m)) s.moods = s.moods.filter(x => x !== m);
    else { s.moods.push(m); if (m === "schnell") s.moods = s.moods.filter(x => x !== "aufwendig"); if (m === "aufwendig") s.moods = s.moods.filter(x => x !== "schnell"); }
    patch(w.id, { moods: Object.fromEntries(s.moods.map(x => [x, true])) });
    return render(true);
  }
  if (d.act === "plan") {
    const s = wstate(w), keep = Object.fromEntries(DAYKEYS.filter(k => isSpecial(s.sel[k])).map(k => [k, s.sel[k]]));
    s.sel = planByMood(w, s.moods, keep); s.checked = {};
    patch(w.id, { sel: s.sel, checked: null });
    render(true); const tt = $("toast"); if (tt) tt.textContent = "Neu zusammengestellt. Einzelne Tage könnt ihr unten tauschen.";
    return;
  }
  if (d.have || d.unhave) {
    e.preventDefault();
    const s = wstate(w), k = d.have || d.unhave, val = !!d.have;
    if (val) s.have[k] = true; else delete s.have[k];
    patch(w.id, { ["have/" + k]: val ? true : null });
    return render(true);
  }
  if (d.act === "syncinfo") return openSheet(syncSheet(), true);
  if (d.act === "reset") { wstate(w).checked = {}; patch(w.id, { checked: null }); return render(true); }
  if (d.act === "copy") {
    const s = wstate(w), list = shoppingList(w), lines = [];
    for (const st of ["Migros", "Aldi"]) {
      const rows = list.rows.filter(r => r.p.store === st && !s.checked[r.key]); if (!rows.length) continue;
      lines.push(st.toUpperCase()); rows.forEach(r => lines.push(`- ${r.packs > 1 ? r.packs + " × " : ""}${r.p.name} (${r.p.label})`)); lines.push("");
    }
    try { await navigator.clipboard.writeText(lines.join("\n").trim()); $("copyMsg").textContent = "Kopiert. Du kannst die Liste z. B. in WhatsApp einfügen."; }
    catch (err) { $("copyMsg").textContent = "Kopieren ist hier nicht möglich."; }
  }
});
$("view").addEventListener("change", e => {
  const t = e.target, w = activeWeek();
  if (t.id === "hideDone") { store.hideDone = t.checked; saveLocal(); return render(true); }
  if (t.matches("input[data-check]")) {
    const s = wstate(w), k = t.dataset.check;
    if (t.checked) s.checked[k] = true; else delete s.checked[k];
    patch(w.id, { ["checked/" + k]: t.checked ? true : null });
    if (navigator.vibrate) navigator.vibrate(10);
    render(true);
  }
});
$("view").addEventListener("input", e => {
  if (e.target.id !== "search") return;
  ui.query = e.target.value; const g = $("dishGrid"); if (g) g.innerHTML = dishGrid(activeWeek());
});

$("sheet").addEventListener("click", e => {
  const t = e.target.closest("button, li[data-ing]"); if (!t) return;
  const d = t.dataset;
  if (d.act === "close") return closeSheet();
  if (!sheetCtx) return;
  const w = weekById[sheetCtx.week];
  if (d.ing !== undefined && sheetCtx.type === "recipe") { const k = sheetCtx.recipe + d.ing; ui.ingDone[k] = !ui.ingDone[k]; t.classList.toggle("done", ui.ingDone[k]); return; }
  if (d.assign) {
    const s = wstate(w), k = d.assign, val = s.sel[k] === sheetCtx.recipe ? "" : sheetCtx.recipe;
    s.sel[k] = val; patch(w.id, { ["sel/" + k]: val });
    return render(true);
  }
  if (d.por) {
    const s = wstate(w), r = w.byId[sheetCtx.recipe], days = DAYS.filter(([k]) => s.sel[k] === r.id).map(x => x[0]);
    const cur = days.length ? porOf(s, days[0]) : (ui.tmpPor[r.id] || PORTIONS);
    const next = Math.min(12, Math.max(1, cur + Number(d.por)));
    if (days.length) { const p = {}; days.forEach(k => { s.por[k] = next; p["por/" + k] = next === PORTIONS ? null : next; if (next === PORTIONS) delete s.por[k]; }); patch(w.id, p); render(true); }
    else ui.tmpPor[r.id] = next;
    const y = $("sheet").scrollTop; $("sheet").innerHTML = recipeSheet(w, r); $("sheet").scrollTop = y;
    return;
  }
  if (d.cookrecipe) return openCookRecipe(w, w.byId[d.cookrecipe]);
  if (d.choose !== undefined && sheetCtx.type === "pick") {
    const s = wstate(w); s.sel[sheetCtx.day] = d.choose; patch(w.id, { ["sel/" + sheetCtx.day]: d.choose });
    closeSheet(); return render(true);
  }
});

/* ---------- Start (nach allen Skripten, damit auch haushalt.js geladen ist) ---------- */
window.addEventListener("DOMContentLoaded", () => {
  loadLocal();
  readHash();
  render();
  connectSync();
  if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(() => {});
});
