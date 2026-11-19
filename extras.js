/* «Unser Zuhause» – Ausgaben, Umzug, eigene Einkaufsartikel.
   Gemeinsam gespeichert unter haushalte/<id>/ausgaben, /umzug, /einkauf. */

const X_LS = "essplan-extras";
let X = { ausgaben: {}, umzug: { datum: "", items: {} }, fav: {} };
try { const s = JSON.parse(localStorage.getItem(X_LS) || "null"); if (s) X = { ausgaben: s.ausgaben || {}, umzug: s.umzug || { datum: "", items: {} }, fav: s.fav || {} }; } catch (e) { /* ignorieren */ }
function xSave() { try { localStorage.setItem(X_LS, JSON.stringify(X)); } catch (e) { /* ignorieren */ } }
function xPatch(path, p) {
  xSave();
  if (!sync.api) return;
  sync.api.update(sync.api.ref(sync.db, "haushalte/" + SYNC.haushalt + "/" + path), p).catch(() => {});
}
function extrasConnect() {
  if (!sync.api) return;
  const base = "haushalte/" + SYNC.haushalt + "/";
  const watch = (path, apply, local) => {
    let first = true;
    sync.api.onValue(sync.api.ref(sync.db, base + path), snap => {
      const v = snap.val();
      if (v) apply(v);
      else if (first && local()) sync.api.set(sync.api.ref(sync.db, base + path), local()).catch(() => {});
      first = false; xSave();
      if (ui.area === "haushalt" || ui.tab === "einkauf" || ui.area === "start") render(true);
    });
  };
  watch("ausgaben", v => { X.ausgaben = v; }, () => Object.keys(X.ausgaben).length ? X.ausgaben : null);
  watch("umzug", v => { X.umzug = { datum: v.datum || "", items: v.items || {} }; }, () => (X.umzug.datum || Object.keys(X.umzug.items).length) ? X.umzug : null);
  watch("einkauf/favoriten", v => { X.fav = v; }, () => Object.keys(X.fav).length ? X.fav : null);
}
const newId = p => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
const pname = i => (typeof P !== "undefined" ? P.settings.names[i] : ["Luana", "Derin"][i]) || "?";
const meIdx = () => (typeof putzMe !== "undefined" && putzMe !== null ? putzMe : 0);

/* ---------- Haushalt-Register ---------- */
function haushaltNav() {
  const open = typeof putzToday === "function" && putzMe !== null ? putzToday().filter(x => !x.done && x.to === putzMe).length : 0;
  const um = umzugStats();
  return `<nav class="seg seg3" aria-label="Haushalt">${[["haushalt", "Putzen", open], ["ausgaben", "Ausgaben", 0], ["umzug", "Umzug", um.overdue]].map(([k, l, n]) =>
    `<button data-go="${k}" aria-current="${ui.tab === k ? "page" : "false"}">${l}${n ? `<span class="count num">${n}</span>` : ""}</button>`).join("")}</nav>`;
}

/* ---------- Eigene Einkaufsartikel ---------- */
const SHOPS = ["Migros", "Aldi", "Coop", "Andere"];
function extraRows(s) {
  return Object.entries(s.extra || {}).filter(([, x]) => x && x.name).map(([id, x]) => ({
    key: "x_" + id, id, extra: true, name: x.name, store: SHOPS.includes(x.store) ? x.store : "Andere", cat: catOf({ name: x.name, label: "" }), qty: x.qty || ""
  }));
}
function extraRowHtml(r, s) {
  const c = !!s.checked[r.key];
  return `<label class="item${c ? " checked" : ""}"><input type="checkbox" data-check="${r.key}"${c ? " checked" : ""}>
    <span><span class="name">${esc(r.name)}</span>${r.qty ? `<br><span class="info">${esc(r.qty)}</span>` : ""}</span>
    <span class="price"><button class="havebtn" data-xdel="${r.id}">Entfernen</button></span></label>`;
}
function addExtraHtml(w) {
  const favs = Object.entries(X.fav).filter(([, f]) => f && f.name).sort((a, b) => a[1].name.localeCompare(b[1].name, "de"));
  const s = wstate(w), have = new Set(Object.values(s.extra || {}).map(x => x && x.name.toLowerCase()));
  return `<div class="card addx">
    <h3>Etwas dazu?</h3>
    <div class="row"><input class="search" id="xName" placeholder="z. B. WC-Papier, Kaffee, Waschmittel" aria-label="Artikel" style="flex:1">
      <button class="btn primary" style="padding:10px 16px" data-xadd="${w.id}">Hinzufügen</button></div>
    <div class="row" role="group" aria-label="Laden">${SHOPS.map((st, i) => `<button class="chip" data-xshop="${st}" aria-pressed="${(addExtraHtml.shop || "Migros") === st}">${st}</button>`).join("")}</div>
    <label class="switch small"><input type="checkbox" id="xFav">Auch zu «Immer wieder» hinzufügen</label>
    ${favs.length ? `<div><span class="eyebrow">Immer wieder · antippen zum Hinzufügen</span><div class="favs">${favs.map(([id, f]) =>
      `<span class="fav${have.has(f.name.toLowerCase()) ? " on" : ""}"><button data-xfav="${id}" data-week="${w.id}">${have.has(f.name.toLowerCase()) ? "✓ " : "+ "}${esc(f.name)}</button><button class="favdel" data-xfavdel="${id}" aria-label="${esc(f.name)} aus Immer wieder entfernen">×</button></span>`).join("")}</div></div>` : ""}
  </div>`;
}
addExtraHtml.shop = "Migros";
function addExtra(w, name, store) {
  const s = wstate(w); if (!s.extra) s.extra = {};
  const id = newId("x"), item = { name, store, qty: "" };
  s.extra[id] = item; patch(w.id, { ["extra/" + id]: item });
}

/* ---------- Ausgaben ---------- */
const XCATS = [["einkauf", "Lebensmittel"], ["wohnung", "Wohnung & Möbel"], ["fix", "Miete & Rechnungen"], ["ausgang", "Ausgang & Ferien"], ["anderes", "Anderes"]];
function balance() {
  /* positiv: Person 1 schuldet Person 0 */
  let b = 0;
  for (const e of Object.values(X.ausgaben)) {
    if (!e || !(e.amount > 0)) continue;
    if (e.type === "settle") { b += e.by === 1 ? -e.amount : e.amount; continue; }
    const share = e.split === "half" ? e.amount / 2 : e.split === "other" ? e.amount : 0; /* Anteil des anderen */
    b += e.by === 0 ? share : -share;
  }
  return Math.round(b * 100) / 100;
}
function viewAusgaben() {
  const b = balance(), names = [pname(0), pname(1)];
  const list = Object.entries(X.ausgaben).map(([id, e]) => ({ id, ...e })).filter(e => e && e.amount > 0).sort((a, c) => (c.date || "").localeCompare(a.date || "") || (c.ts || 0) - (a.ts || 0));
  const ym = iso(todayDate()).slice(0, 7);
  const month = list.filter(e => e.type !== "settle" && (e.date || "").startsWith(ym));
  const total = month.reduce((a, e) => a + e.amount, 0);
  const byCat = XCATS.map(([k, l]) => [l, month.filter(e => (e.cat || "anderes") === k).reduce((a, e) => a + e.amount, 0)]).filter(x => x[1] > 0);
  const debtor = b > 0 ? 1 : 0, creditor = 1 - debtor;
  return `
    ${haushaltNav()}
    <div class="top"><div><span class="eyebrow">Gemeinsame Ausgaben</span><h1>Ausgaben</h1></div>${syncChipHtml()}</div>
    <div class="saldo">
      ${Math.abs(b) < 0.01 ? `<span class="eyebrow">Saldo</span><h2>Ihr seid quitt.</h2><p class="muted small">Neue Ausgaben werden hier verrechnet.</p>`
        : `<span class="eyebrow">Saldo</span><h2>${esc(names[debtor])} schuldet ${esc(names[creditor])}</h2><div class="big num">CHF ${Math.abs(b).toFixed(2)}</div>
           <button class="btn soft" data-xsettle="${debtor}">Ausgleichen</button>`}
    </div>
    <button class="btn primary block" data-xnew>+ Ausgabe eintragen</button>
    ${month.length ? `<div class="section"><div class="spread"><h2>${MONTHS[todayDate().getMonth()]}</h2><span class="num">CHF ${total.toFixed(2)}</span></div>
      <div class="catbars">${byCat.map(([l, v]) => `<div class="fair"><span>${esc(l)}</span><span class="bar"><i style="width:${Math.round(v / total * 100)}%;background:var(--ink)"></i></span><span class="num small">${v.toFixed(2)}</span></div>`).join("")}</div></div>` : ""}
    <div class="section"><h2>Verlauf</h2>
      ${list.length ? `<div class="xlist">${list.slice(0, 40).map(e => {
        const d = e.date ? parseDate(e.date) : todayDate();
        return `<button class="xrow" ${e.type === "settle" ? `data-xundo="${e.id}"` : `data-xedit="${e.id}"`}><span class="xdate">${dm(d)}</span>
          <span><b>${esc(e.type === "settle" ? "Ausgleich" : e.title)}</b><br><span class="small muted">${e.type === "settle" ? `${esc(names[e.by])} hat ${esc(names[1 - e.by])} bezahlt` : `${esc(names[e.by])} bezahlt · ${e.split === "half" ? "geteilt" : e.split === "other" ? "nur für " + esc(names[1 - e.by]) : "nur für " + esc(names[e.by])}`}</span></span>
          <span class="num">${e.type === "settle" ? `<span class="small muted">rückgängig</span><br>` : ""}${e.amount.toFixed(2)}</span></button>`;
      }).join("")}</div>` : `<div class="empty">Noch keine Ausgaben. Tragt zum Beispiel den nächsten Grosseinkauf ein.</div>`}
    </div>`;
}
let xForm = { by: 0, split: "half", cat: "einkauf" };
function ausgabeSheet(id, preset = {}) {
  const e = id ? X.ausgaben[id] : { title: preset.title || "", amount: preset.amount || "", date: iso(todayDate()), by: meIdx(), split: "half", cat: preset.cat || "einkauf" };
  xForm = { by: e.by, split: e.split || "half", cat: e.cat || "anderes" };
  sheetCtx = { type: "ausgabe", id: id || null };
  const names = [pname(0), pname(1)];
  return `<div class="grab"><span class="handle"></span><button class="close" data-act="close" aria-label="Schliessen">×</button></div>
    <div class="content" style="padding-top:0">
      <h2>${id ? "Ausgabe bearbeiten" : "Neue Ausgabe"}</h2>
      <input class="search" id="xTitle" placeholder="Wofür? z. B. Grosseinkauf, Stromrechnung" value="${esc(e.title || "")}" aria-label="Wofür">
      <div class="kform" style="grid-template-columns:minmax(0,1fr) minmax(0,1fr)">
        <label>Betrag CHF<input type="number" inputmode="decimal" step="0.05" min="0" id="xAmount" value="${e.amount === "" ? "" : Number(e.amount).toFixed(2)}"></label>
        <label>Datum<input type="date" id="xDate" value="${esc(e.date || iso(todayDate()))}"></label>
      </div>
      <div class="section"><h3>Wer hat bezahlt?</h3><div class="row">${[0, 1].map(i => `<button class="chip" data-xby="${i}" aria-pressed="${xForm.by === i}">${esc(names[i])}</button>`).join("")}</div></div>
      <div class="section"><h3>Für wen?</h3><div class="row" style="flex-wrap:wrap">
        <button class="chip" data-xsplit="half" aria-pressed="${xForm.split === "half"}">Für beide, halb-halb</button>
        <button class="chip" data-xsplit="self" aria-pressed="${xForm.split === "self"}">Nur für die Person, die bezahlt hat</button>
        <button class="chip" data-xsplit="other" aria-pressed="${xForm.split === "other"}">Nur für die andere Person</button></div></div>
      <div class="section"><h3>Kategorie</h3><div class="row" style="flex-wrap:wrap">${XCATS.map(([k, l]) => `<button class="chip" data-xcat="${k}" aria-pressed="${xForm.cat === k}">${l}</button>`).join("")}</div></div>
      <button class="btn primary block" data-xsave>Speichern</button>
      ${id ? `<button class="btn soft block" data-xremove style="color:var(--tomato);border-color:var(--tomato)">Löschen</button>` : ""}
      <div class="toast" id="xMsg" aria-live="polite"></div>
    </div>`;
}

/* ---------- Umzug ---------- */
const UMZUG_PHASES = [
  ["sofort", "Sobald der Mietvertrag unterschrieben ist", null],
  ["m1", "Einen Monat vorher", -30],
  ["w2", "Zwei Wochen vorher", -14],
  ["w1", "In der Umzugswoche", -7],
  ["tag", "Am Umzugstag", 0],
  ["danach", "In den zwei Wochen danach", 14]
];
const UMZUG_DEFAULT = [
  ["sofort", "Alte Wohnung fristgerecht kündigen (eingeschrieben, Termine im Mietvertrag prüfen)"],
  ["sofort", "Umzugstag festlegen und Helfer, Umzugsfirma oder Mietwagen reservieren"],
  ["sofort", "Freien Tag für den Umzug beim Arbeitgeber anfragen"],
  ["sofort", "Internet, TV und Handy-Abo für die neue Adresse bestellen oder umziehen"],
  ["sofort", "Hausrat- und Haftpflichtversicherung auf die neue Wohnung anpassen"],
  ["m1", "Neue Wohnung ausmessen und planen, welche Möbel wohin kommen"],
  ["m1", "Kisten, Klebeband und Packmaterial besorgen"],
  ["m1", "Ausmisten: verkaufen, verschenken, Sperrgut anmelden"],
  ["m1", "Strom beim Elektrizitätswerk an- und abmelden"],
  ["m1", "Falls nötig: Parkbewilligung für den Umzugswagen beantragen"],
  ["w2", "Nachsendeauftrag bei der Post einrichten"],
  ["w2", "Neue Adresse melden: Arbeitgeber, Uni, Bank, Krankenkasse, Versicherungen, Abos"],
  ["w2", "Abgabetermin der alten Wohnung mit der Verwaltung abmachen"],
  ["w2", "Endreinigung der alten Wohnung planen (selbst oder mit Abnahmegarantie)"],
  ["w1", "Kisten nach Zimmer beschriften und eine «Erste-Nacht-Kiste» packen (Dokumente, Ladekabel, WC-Papier, Werkzeug, Bettwäsche)"],
  ["w1", "Kühlschrank leeren und Tiefkühler abtauen"],
  ["w1", "Wenig einkaufen: Essplan für die Umzugswoche mit Vorräten planen"],
  ["tag", "Übergabe der neuen Wohnung: Protokoll prüfen, Mängel notieren, Fotos machen"],
  ["tag", "Zählerstände (Strom, Wasser) in beiden Wohnungen fotografieren"],
  ["tag", "Schlüssel zählen und notieren"],
  ["danach", "Bei der neuen Gemeinde anmelden und bei der alten abmelden (Frist meist 14 Tage)"],
  ["danach", "Mängel der neuen Wohnung schriftlich an die Verwaltung melden (Frist im Mietvertrag prüfen)"],
  ["danach", "Alte Wohnung abgeben und Protokoll unterschreiben"],
  ["danach", "Namen an Briefkasten und Tür anbringen"],
  ["danach", "Mietkaution der alten Wohnung zurückfordern"],
  ["danach", "Waschküchen-Plan und Abfallkalender der neuen Gemeinde in den Kalender eintragen"]
];
function umzugItems() {
  const items = { ...X.umzug.items };
  UMZUG_DEFAULT.forEach(([ph, t], i) => { const id = "d" + i; items[id] = { phase: ph, text: t, ...(items[id] || {}) }; });
  return Object.entries(items).filter(([, it]) => it && it.text && !it.removed).map(([id, it]) => ({ id, ...it }));
}
function phaseDue(ph) {
  const p = UMZUG_PHASES.find(x => x[0] === ph);
  if (!p || p[2] === null || !X.umzug.datum) return null;
  return addDays(parseDate(X.umzug.datum), p[2]);
}
function umzugStats() {
  const items = umzugItems(), today = todayDate();
  const done = items.filter(i => i.done).length;
  const overdue = items.filter(i => !i.done && phaseDue(i.phase) && phaseDue(i.phase) < today && i.phase !== "danach").length;
  return { all: items.length, done, overdue };
}
function viewUmzug() {
  const items = umzugItems(), st = umzugStats(), names = [pname(0), pname(1)];
  const dat = X.umzug.datum ? parseDate(X.umzug.datum) : null, today = todayDate();
  const days = dat ? daysBetween(today, dat) : null;
  const whoBtn = it => `<button class="whochip" data-uwho="${it.id}" aria-label="Zuständig wechseln">${it.who === 0 || it.who === 1 ? avatar(it.who, 22) : it.who === 2 ? avatar(0, 22) + avatar(1, 22) : '<span class="nobody">wer?</span>'}</button>`;
  return `
    ${haushaltNav()}
    <div class="top"><div><span class="eyebrow">Zügeln</span><h1>Umzug</h1></div>${syncChipHtml()}</div>
    <div class="saldo">
      ${dat ? `<span class="eyebrow">${days > 0 ? "Noch" : days === 0 ? "Heute ist" : "Seit"}</span><h2>${days > 0 ? days + (days === 1 ? " Tag" : " Tage") : days === 0 ? "Umzugstag" : -days + " Tagen im neuen Zuhause"}</h2>
        <p class="small muted">Umzug am ${DAYS[dayIndex(dat)][2]}, ${dat.getDate()}. ${MONTHS[dat.getMonth()]} ${dat.getFullYear()}</p>` : `<span class="eyebrow">Umzugsdatum</span><h2>Wann zügelt ihr?</h2><p class="small muted">Mit Datum zeigt die Liste, bis wann was erledigt sein sollte.</p>`}
      <label class="kform" style="grid-template-columns:1fr"><input type="date" id="uDate" value="${esc(X.umzug.datum || "")}" aria-label="Umzugsdatum"></label>
      <div class="fair"><span class="small">${st.done} von ${st.all}</span><span class="bar"><i style="width:${Math.round(st.done / (st.all || 1) * 100)}%;background:var(--ink)"></i></span><span class="small num">${Math.round(st.done / (st.all || 1) * 100)}%</span></div>
    </div>
    ${UMZUG_PHASES.map(([ph, label]) => {
      const list = items.filter(i => i.phase === ph); if (!list.length) return "";
      const due = phaseDue(ph), late = due && due < today && ph !== "danach" && list.some(i => !i.done);
      return `<div class="section"><div class="spread"><h3>${label}</h3>${due ? `<span class="small ${late ? "late" : "muted"}">${ph === "danach" ? "bis" : "ab"} ${dm(due)}</span>` : ""}</div>
        <div class="group">${list.map(it => `<div class="item uitem${it.done ? " checked" : ""}"><input type="checkbox" data-udone="${it.id}"${it.done ? " checked" : ""} aria-label="${esc(it.text)}">
          <span class="name" style="font-weight:400">${esc(it.text)}</span><span class="price">${whoBtn(it)}${it.custom ? `<button class="havebtn" data-udel="${it.id}">Löschen</button>` : ""}</span></div>`).join("")}</div></div>`;
    }).join("")}
    <div class="card"><h3>Eigener Punkt</h3>
      <input class="search" id="uText" placeholder="z. B. Velo-Vignette, Katze beim Tierarzt ummelden" aria-label="Neuer Punkt">
      <select id="uPhase" aria-label="Wann">${UMZUG_PHASES.map(([k, l]) => `<option value="${k}">${l}</option>`).join("")}</select>
      <button class="btn primary block" data-uadd>Hinzufügen</button></div>
    <p class="footer">Tippe auf «wer?», um festzulegen, wer sich darum kümmert. Fristen sind Richtwerte, verbindlich sind Mietvertrag und Gemeinde.</p>`;
}

/* ---------- Ereignisse ---------- */
$("view").addEventListener("click", e => {
  const t = e.target.closest("button"); if (!t) return;
  const d = t.dataset;
  /* Einkauf */
  if (d.xshop) { addExtraHtml.shop = d.xshop; t.parentElement.querySelectorAll("[data-xshop]").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.xshop === d.xshop))); return; }
  if (d.xadd) {
    const name = ($("xName").value || "").trim(); if (!name) { $("xName").focus(); return; }
    const w = weekById[d.xadd]; addExtra(w, name, addExtraHtml.shop || "Migros");
    if ($("xFav").checked && !Object.values(X.fav).some(f => f && f.name.toLowerCase() === name.toLowerCase())) { const id = newId("f"); X.fav[id] = { name, store: addExtraHtml.shop || "Migros" }; xPatch("einkauf/favoriten", { [id]: X.fav[id] }); }
    render(true); const i = $("xName"); if (i) i.focus(); return;
  }
  if (d.xfav) {
    const f = X.fav[d.xfav], w = weekById[d.week]; if (!f || !w) return;
    const s = wstate(w), ex = Object.entries(s.extra || {}).find(([, x]) => x && x.name.toLowerCase() === f.name.toLowerCase());
    if (ex) { delete s.extra[ex[0]]; patch(w.id, { ["extra/" + ex[0]]: null }); } else addExtra(w, f.name, f.store || "Migros");
    return render(true);
  }
  if (d.xfavdel) { delete X.fav[d.xfavdel]; xPatch("einkauf/favoriten", { [d.xfavdel]: null }); return render(true); }
  if (d.xdel) { e.preventDefault(); const w = activeWeek(), s = wstate(w); if (s.extra) delete s.extra[d.xdel]; patch(w.id, { ["extra/" + d.xdel]: null }); return render(true); }
  if (d.xpaid) { const w = weekById[d.xpaid], sm = summary(w); return openSheet(ausgabeSheet(null, { title: "Grosseinkauf KW " + kw(w.id), amount: sm.total.toFixed(2), cat: "einkauf" }), true); }
  /* Ausgaben */
  if ("xnew" in d) return openSheet(ausgabeSheet(null), true);
  if (d.xedit) return openSheet(ausgabeSheet(d.xedit), true);
  if (d.xundo) { delete X.ausgaben[d.xundo]; xPatch("ausgaben", { [d.xundo]: null }); return render(true); }
  if (d.xsettle !== undefined) {
    const debtor = Number(d.xsettle), amt = Math.abs(balance()), id = newId("a");
    X.ausgaben[id] = { type: "settle", by: debtor, amount: amt, date: iso(todayDate()), ts: Date.now(), title: "Ausgleich" };
    xPatch("ausgaben", { [id]: X.ausgaben[id] }); return render(true);
  }
  /* Umzug */
  if (d.uwho) {
    const it = X.umzug.items[d.uwho] || {}, cur = it.who, next = cur === undefined || cur === null ? 0 : cur === 0 ? 1 : cur === 1 ? 2 : null;
    X.umzug.items[d.uwho] = { ...it, who: next }; xPatch("umzug/items/" + d.uwho, { who: next }); return render(true);
  }
  if (d.udel) { X.umzug.items[d.udel] = { ...(X.umzug.items[d.udel] || {}), removed: true }; xPatch("umzug/items/" + d.udel, { removed: true }); return render(true); }
  if ("uadd" in d) {
    const text = ($("uText").value || "").trim(); if (!text) { $("uText").focus(); return; }
    const id = newId("u"), it = { text, phase: $("uPhase").value, custom: true };
    X.umzug.items[id] = it; xPatch("umzug/items", { [id]: it }); return render(true);
  }
});
$("view").addEventListener("change", e => {
  const t = e.target;
  if (t.dataset.udone) {
    const id = t.dataset.udone; X.umzug.items[id] = { ...(X.umzug.items[id] || {}), done: t.checked };
    xPatch("umzug/items/" + id, { done: t.checked }); return render(true);
  }
  if (t.id === "uDate") { X.umzug.datum = t.value || ""; xPatch("umzug", { datum: X.umzug.datum }); return render(true); }
});
$("view").addEventListener("keydown", e => {
  if (e.key === "Enter" && e.target.id === "xName") { const b = document.querySelector("[data-xadd]"); if (b) b.click(); }
});
$("sheet").addEventListener("click", e => {
  const t = e.target.closest("button"); if (!t || !sheetCtx || sheetCtx.type !== "ausgabe") return;
  const d = t.dataset;
  const press = (attr, val) => $("sheet").querySelectorAll(`[data-${attr}]`).forEach(b => b.setAttribute("aria-pressed", String(b.dataset[attr.replace(/-./g, m => m[1].toUpperCase())] === String(val))));
  if (d.xby !== undefined) { xForm.by = Number(d.xby); press("xby", xForm.by); return; }
  if (d.xsplit) { xForm.split = d.xsplit; press("xsplit", xForm.split); return; }
  if (d.xcat) { xForm.cat = d.xcat; press("xcat", xForm.cat); return; }
  if ("xsave" in d) {
    const title = $("xTitle").value.trim(), amount = Math.round(parseFloat(($("xAmount").value || "").replace(",", ".")) * 100) / 100;
    if (!title) { $("xMsg").textContent = "Wofür war die Ausgabe?"; return; }
    if (!(amount > 0)) { $("xMsg").textContent = "Bitte einen Betrag eingeben."; return; }
    const id = sheetCtx.id || newId("a"), old = X.ausgaben[id] || {};
    X.ausgaben[id] = { type: "expense", title, amount, date: $("xDate").value || iso(todayDate()), by: xForm.by, split: xForm.split, cat: xForm.cat, ts: old.ts || Date.now() };
    xPatch("ausgaben", { [id]: X.ausgaben[id] }); closeSheet(); return render(true);
  }
  if ("xremove" in d && sheetCtx.id) { delete X.ausgaben[sheetCtx.id]; xPatch("ausgaben", { [sheetCtx.id]: null }); closeSheet(); return render(true); }
});
