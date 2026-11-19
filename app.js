const DAYS = [
  ["mo", "Mo", "Montag"], ["di", "Di", "Dienstag"], ["mi", "Mi", "Mittwoch"],
  ["do", "Do", "Donnerstag"], ["fr", "Fr", "Freitag"], ["sa", "Sa", "Samstag"], ["so", "So", "Sonntag"]
];

/* ---------- Zustand ---------- */
const byId = Object.fromEntries(RECIPES.map(r => [r.id, r]));
let state = { week: WEEK.id, sel: { ...DEFAULT_SEL }, checked: {} };
let filter = "alle";
let doneSteps = {};
const LS_KEY = "essplan-state";

function chf(n) { return "CHF " + n.toFixed(2); }
function fmtNum(n) { return (Math.round(n * 10) / 10).toString().replace(".", ","); }
function esc(s) { return String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])); }

function normalize(s) {
  const out = { week: WEEK.id, sel: { ...DEFAULT_SEL }, checked: {} };
  if (!s || typeof s !== "object" || s.week !== WEEK.id) return out;
  if (s.sel && typeof s.sel === "object") {
    for (const [k] of DAYS) {
      const v = s.sel[k];
      if (v === "" || (typeof v === "string" && byId[v])) out.sel[k] = v;
    }
  }
  if (s.checked && typeof s.checked === "object") {
    for (const [k, v] of Object.entries(s.checked)) if (v === true) out.checked[k] = true;
  }
  return out;
}

/* ---------- Berechnungen ---------- */
function selectedDays() { return DAYS.filter(([k]) => state.sel[k]).map(([k, s, l]) => ({ key: k, short: s, long: l, recipe: byId[state.sel[k]] })); }

function recipeItems(r, sel) {
  let items = r.items.slice();
  if (r.needs && !Object.values(sel).includes(r.needs) && r.fallback) items = items.concat(r.fallback);
  return items;
}

function recipeCost(r) {
  return recipeItems(r, state.sel).reduce((sum, [k, q]) => sum + q / PRODUCTS[k].pack * PRODUCTS[k].price, 0);
}

function shoppingList() {
  const need = {}, usedBy = {};
  for (const d of selectedDays()) {
    for (const [k, q] of recipeItems(d.recipe, state.sel)) {
      need[k] = (need[k] || 0) + q;
      (usedBy[k] = usedBy[k] || new Set()).add(d.short);
    }
  }
  const rows = Object.keys(need).map(k => {
    const p = PRODUCTS[k];
    const packs = Math.max(1, Math.ceil(need[k] / p.pack - 1e-9));
    return { key: k, p, need: need[k], packs, cost: packs * p.price, statt: p.statt ? packs * p.statt : null, days: [...usedBy[k]] };
  });
  const pantry = {};
  for (const d of selectedDays()) for (const x of d.recipe.pantry) (pantry[x] = pantry[x] || new Set()).add(d.short);
  return { rows, pantry };
}

function needText(row) {
  const u = row.p.unit, n = row.need;
  if (u === "g") return n >= 1000 ? fmtNum(n / 1000) + " kg" : Math.round(n) + " g";
  if (u === "dose") return fmtNum(n) + (n === 1 ? " Dose" : " Dosen");
  if (u === "beutel") return fmtNum(n) + " Beutel";
  if (u === "bund") return fmtNum(n) + " Bund";
  return fmtNum(n) + " Stück";
}

/* ---------- Darstellung ---------- */
function renderHeader(list) {
  const total = list.rows.reduce((s, r) => s + r.cost, 0);
  const saved = list.rows.reduce((s, r) => s + (r.statt ? r.statt - r.cost : 0), 0);
  const portions = selectedDays().length * PORTIONS;
  document.getElementById("weekLabel").textContent = WEEK.label;
  document.getElementById("statTotal").textContent = chf(total);
  document.getElementById("statPortion").textContent = portions ? chf(total / portions) : "–";
  document.getElementById("statSave").textContent = chf(saved);
  const fish = selectedDays().filter(d => d.recipe.tags.includes("fisch")).length;
  const pills = ['<span class="pill">Ohne Schweinefleisch</span>', `<span class="pill">${portions} Portionen, je 2 zum Mitnehmen</span>`];
  pills.push(fish > 1 ? `<span class="pill warn">Fisch ${fish}× – lieber höchstens 1×</span>` : `<span class="pill">Fisch ${fish}× pro Woche</span>`);
  document.getElementById("pills").innerHTML = pills.join("");
}

function matchesFilter(r) {
  if (filter === "alle") return true;
  return r.tags.includes(filter);
}

function renderWoche() {
  const el = document.getElementById("view-woche");
  const filters = [["alle", "Alle"], ["italienisch", "Italienisch"], ["vegetarisch", "Vegetarisch"], ["schnell", "Schnell"]];
  let html = `<div class="filters" role="group" aria-label="Gerichte filtern">${filters.map(([v, l]) => `<button class="chip" data-filter="${v}" aria-pressed="${filter === v}">${l}</button>`).join("")}</div>`;
  for (const [k, short, long] of DAYS) {
    const cur = state.sel[k];
    const opts = RECIPES.filter(r => matchesFilter(r) || r.id === cur);
    const r = byId[cur];
    html += `<div class="card day"><div class="day-label" aria-hidden="true">${short}</div><div class="day-body">
      <label class="small muted" for="sel-${k}">${long}</label>
      <select id="sel-${k}" data-day="${k}">
        <option value=""${cur === "" ? " selected" : ""}>Kein Kochen (auswärts, Reste)</option>
        ${opts.map(o => `<option value="${o.id}"${o.id === cur ? " selected" : ""}>${esc(o.name)}</option>`).join("")}
      </select>
      ${r ? `<div class="meta"><span>${esc(r.time)}</span><span class="num">${chf(recipeCost(r) / PORTIONS)} pro Portion</span>${r.tags.map(t => `<span class="pill">${t}</span>`).join("")}<button class="linkbtn" data-open="${k}">Rezept ansehen</button></div>` : ""}
      ${r && r.needs && !Object.values(state.sel).includes(r.needs) ? `<div class="note">Ohne Ofen-Poulet am Samstag kommt ein ganzes Poulet auf die Einkaufsliste.</div>` : ""}
    </div></div>`;
  }
  html += `<div class="actions"><button class="ghost" id="resetWeek">Vorschlag der Woche wiederherstellen</button></div>`;
  el.innerHTML = html;
}

function renderRezepte(openDay) {
  const el = document.getElementById("view-rezepte");
  const days = selectedDays();
  if (!days.length) { el.innerHTML = `<div class="card">Noch keine Gerichte gewählt. Wähle sie unter «Woche» aus.</div>`; return; }
  el.innerHTML = days.map(d => {
    const r = d.recipe;
    return `<details class="recipe" id="rec-${d.key}"${openDay === d.key ? " open" : ""}>
      <summary><span class="small muted">${d.long} · ${esc(r.time)} · 4 Portionen</span><span class="row"><h3>${esc(r.name)}</h3></span></summary>
      <div class="recipe-body">
        ${r.note ? `<div class="note">${esc(r.note)}</div>` : ""}
        <div><strong>Zutaten</strong><ul>${r.ingredients.map(i => `<li>${esc(i)}</li>`).join("")}</ul></div>
        <div><strong>Zubereitung</strong> <span class="small muted">(Schritt antippen, wenn erledigt)</span>
          <ol class="steps">${r.steps.map((s, i) => `<li data-day="${d.key}" data-step="${i}" class="${doneSteps[d.key + i] ? "done" : ""}">${esc(s)}</li>`).join("")}</ol></div>
        <button class="primary" data-cook="${d.key}">Schritt für Schritt kochen</button>
      </div></details>`;
  }).join("");
}

function renderEinkauf() {
  const el = document.getElementById("view-einkauf");
  const list = shoppingList();
  const all = list.rows.length + Object.keys(list.pantry).length;
  const done = list.rows.filter(r => state.checked[r.key]).length + Object.keys(list.pantry).filter(n => state.checked["p:" + n]).length;
  const total = list.rows.reduce((s, r) => s + r.cost, 0);
  const open = list.rows.filter(r => !state.checked[r.key]).reduce((s, r) => s + r.cost, 0);
  let html = `<div class="card shop-head">
    <div class="row"><strong class="num">${done} von ${all} erledigt</strong><span class="num muted">noch ${chf(open)} von ${chf(total)}</span></div>
    <div class="progress" aria-hidden="true"><div style="width:${all ? Math.round(done / all * 100) : 0}%"></div></div>
    <div class="actions"><button class="ghost" id="copyList">Liste kopieren</button><button class="ghost" id="resetChecks">Häkchen zurücksetzen</button></div>
    <div class="small muted" id="copyMsg" aria-live="polite"></div>
  </div>`;
  for (const store of ["Migros", "Aldi"]) {
    const rows = list.rows.filter(r => r.p.store === store).sort((a, b) => (!!b.p.statt - !!a.p.statt) || a.p.name.localeCompare(b.p.name, "de"));
    if (!rows.length) continue;
    const sum = rows.reduce((s, r) => s + r.cost, 0);
    html += `<div class="group"><h3>${store} <span class="num">${chf(sum)}</span></h3>${rows.map(r => itemRow(r)).join("")}</div>`;
  }
  const pantry = Object.keys(list.pantry).sort((a, b) => a.localeCompare(b, "de"));
  if (pantry.length) {
    html += `<div class="group"><h3>Grundvorrat <span>zu Hause prüfen</span></h3>${pantry.map(n => {
      const key = "p:" + n, c = !!state.checked[key];
      return `<label class="item${c ? " checked" : ""}"><input type="checkbox" data-check="${esc(key)}"${c ? " checked" : ""}><div><div class="name">${esc(n)}</div><div class="info">für ${[...list.pantry[n]].join(", ")}</div></div><div></div></label>`;
    }).join("")}</div>`;
  }
  el.innerHTML = html;
}

function itemRow(r) {
  const c = !!state.checked[r.key];
  const deal = r.p.statt ? `<span class="tag-deal">Aktion</span>` : "";
  const packs = r.packs > 1 ? `${r.packs} × ` : "";
  return `<label class="item${c ? " checked" : ""}">
    <input type="checkbox" data-check="${r.key}"${c ? " checked" : ""}>
    <div><div class="name">${packs}${esc(r.p.name)}${deal}</div>
      <div class="info">${esc(r.p.label)} · Bedarf ${needText(r)} · für ${r.days.join(", ")}</div></div>
    <div class="price num">${r.p.approx ? "ca. " : ""}${r.cost.toFixed(2)}${r.statt ? `<s>${r.statt.toFixed(2)}</s>` : ""}</div>
  </label>`;
}

function renderAll(openDay) {
  const list = shoppingList();
  renderHeader(list);
  renderWoche();
  renderRezepte(openDay);
  renderEinkauf();
  document.getElementById("footer").textContent = WEEK.updated;
}

/* ---------- Ansicht wechseln ---------- */
const VIEWS = ["woche", "rezepte", "einkauf"];
function show(view, focusDay) {
  if (!VIEWS.includes(view)) view = "woche";
  for (const v of VIEWS) {
    document.getElementById("view-" + v).hidden = v !== view;
    document.getElementById("tab-" + v).setAttribute("aria-selected", String(v === view));
  }
  if (location.hash !== "#" + view) history.replaceState(null, "", "#" + view);
  if (focusDay) {
    const d = document.getElementById("rec-" + focusDay);
    if (d) { d.open = true; d.scrollIntoView({ block: "start" }); }
  } else {
    window.scrollTo(0, 0);
  }
}
window.addEventListener("hashchange", () => show(location.hash.slice(1)));

/* ---------- Kochmodus ---------- */
let cook = null;
function openCook(day) {
  const r = byId[state.sel[day]];
  if (!r) return;
  cook = { r, i: 0 };
  document.getElementById("cookTitle").textContent = r.name;
  document.getElementById("cook").hidden = false;
  drawCook();
  document.getElementById("cookNext").focus();
}
function drawCook() {
  const { r, i } = cook;
  document.getElementById("cookCount").textContent = `Schritt ${i + 1} von ${r.steps.length}`;
  document.getElementById("cookStep").textContent = r.steps[i];
  document.getElementById("cookPrev").disabled = i === 0;
  document.getElementById("cookNext").textContent = i === r.steps.length - 1 ? "Fertig" : "Weiter";
}
document.getElementById("cookPrev").onclick = () => { if (cook.i > 0) { cook.i--; drawCook(); } };
document.getElementById("cookNext").onclick = () => { if (cook.i < cook.r.steps.length - 1) { cook.i++; drawCook(); } else closeCook(); };
document.getElementById("cookClose").onclick = closeCook;
function closeCook() { document.getElementById("cook").hidden = true; cook = null; }
document.addEventListener("keydown", e => {
  if (!cook) return;
  if (e.key === "Escape") closeCook();
  if (e.key === "ArrowRight") document.getElementById("cookNext").click();
  if (e.key === "ArrowLeft") document.getElementById("cookPrev").click();
});

/* ---------- Speichern auf diesem Gerät ---------- */
function saveLocal() { try { localStorage.setItem(LS_KEY, JSON.stringify(state)); } catch (e) { /* ignorieren */ } }
function loadLocal() { try { const s = localStorage.getItem(LS_KEY); return s ? JSON.parse(s) : null; } catch (e) { return null; } }
function persist() { saveLocal(); }

/* ---------- Ereignisse ---------- */
document.querySelector(".tabs").addEventListener("click", e => {
  const b = e.target.closest("button[data-view]");
  if (b) show(b.dataset.view);
});

document.getElementById("view-woche").addEventListener("click", e => {
  const f = e.target.closest("[data-filter]");
  if (f) { filter = f.dataset.filter; renderWoche(); return; }
  const o = e.target.closest("[data-open]");
  if (o) { renderRezepte(o.dataset.open); show("rezepte", o.dataset.open); return; }
  if (e.target.id === "resetWeek") { state.sel = { ...DEFAULT_SEL }; state.checked = {}; renderAll(); persist(); }
});
document.getElementById("view-woche").addEventListener("change", e => {
  const s = e.target.closest("select[data-day]");
  if (!s) return;
  state.sel[s.dataset.day] = s.value;
  renderAll();
  persist();
  const again = document.getElementById("sel-" + s.dataset.day);
  if (again) again.focus();
});

document.getElementById("view-rezepte").addEventListener("click", e => {
  const c = e.target.closest("[data-cook]");
  if (c) { openCook(c.dataset.cook); return; }
  const li = e.target.closest("li[data-step]");
  if (li) { const k = li.dataset.day + li.dataset.step; doneSteps[k] = !doneSteps[k]; li.classList.toggle("done", doneSteps[k]); }
});

document.getElementById("view-einkauf").addEventListener("change", e => {
  const cb = e.target.closest("input[data-check]");
  if (!cb) return;
  if (cb.checked) state.checked[cb.dataset.check] = true; else delete state.checked[cb.dataset.check];
  renderHeader(shoppingList());
  renderEinkauf();
  persist();
});
document.getElementById("view-einkauf").addEventListener("click", async e => {
  if (e.target.id === "resetChecks") { state.checked = {}; renderEinkauf(); persist(); }
  if (e.target.id === "copyList") {
    const list = shoppingList();
    const lines = [];
    for (const store of ["Migros", "Aldi"]) {
      const rows = list.rows.filter(r => r.p.store === store && !state.checked[r.key]);
      if (!rows.length) continue;
      lines.push(store.toUpperCase());
      for (const r of rows) lines.push(`- ${r.packs > 1 ? r.packs + " × " : ""}${r.p.name} (${r.p.label})`);
      lines.push("");
    }
    const msg = document.getElementById("copyMsg");
    try { await navigator.clipboard.writeText(lines.join("\n").trim()); msg.textContent = "Liste kopiert, du kannst sie jetzt z. B. in WhatsApp einfügen."; }
    catch (err) { msg.textContent = "Kopieren ist hier nicht erlaubt."; }
  }
});

/* ---------- Start ---------- */
state = normalize(loadLocal());
renderAll();
show(location.hash.slice(1) || "woche");
document.getElementById("sync").textContent = "Gespeichert auf diesem Gerät";
if ("serviceWorker" in navigator) { navigator.serviceWorker.register("sw.js").catch(() => {}); }
