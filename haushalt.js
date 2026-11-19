/* «Unser Essplan» – Bereich Haushalt (Putzplan).
   Aufgaben mit Rhythmus, faire Verteilung nach Minuten, gemeinsam gespeichert unter haushalte/<id>/putzen. */

const ROOMS = {
  kueche: { name: "Küche", color: "tomato", icon: '<path d="M10 20h44v30a4 4 0 0 1-4 4H14a4 4 0 0 1-4-4z"/><path d="M6 20h52M22 12v8M32 10v10M42 12v8"/>' },
  bad: { name: "Bad", color: "ocean", icon: '<path d="M8 32h48v6a12 12 0 0 1-12 12H20A12 12 0 0 1 8 38z"/><path d="M14 32V14a6 6 0 0 1 12 0M20 54l-2 4M44 54l2 4"/><circle cx="28" cy="20" r="2"/>' },
  wohnung: { name: "Wohnung", color: "basil", icon: '<path d="M8 30L32 10l24 20"/><path d="M14 26v28h36V26"/><path d="M26 54V40h12v14"/>' },
  schlaf: { name: "Schlafzimmer", color: "plum", icon: '<path d="M6 46V20M58 46V34a8 8 0 0 0-8-8H26v20"/><path d="M6 40h52M6 46h52"/><circle cx="16" cy="32" r="5"/>' },
  waesche: { name: "Wäsche", color: "saffron", icon: '<rect x="10" y="8" width="44" height="50" rx="6"/><circle cx="32" cy="36" r="13"/><path d="M16 16h8"/><path d="M24 38c4-4 12 4 16 0"/>' },
  aussen: { name: "Balkon & Abfall", color: "saffron", icon: '<path d="M14 18h36l-4 38H18z"/><path d="M8 18h48M24 18v-6h16v6M26 28v20M38 28v20"/>' }
};

const PUTZ_DEFAULT = [
  { id: "kueche", name: "Küche aufräumen und Abwasch", room: "kueche", min: 15, every: 1 },
  { id: "abfall", name: "Abfall und Recycling rausbringen", room: "aussen", min: 10, every: 3 },
  { id: "pflanzen", name: "Pflanzen giessen", room: "wohnung", min: 5, every: 4 },
  { id: "waesche", name: "Wäsche waschen und aufhängen", room: "waesche", min: 20, every: 4 },
  { id: "bad1", name: "Bad putzen (WC, Lavabo, Dusche)", room: "bad", min: 30, every: 7 },
  { id: "bad2", name: "Zweites Bad putzen", room: "bad", min: 20, every: 7, needsBaths: 2 },
  { id: "staubsaugen", name: "Ganze Wohnung staubsaugen", room: "wohnung", min: 30, every: 7 },
  { id: "kueche-gross", name: "Küche gründlich: Herd, Fronten, Spüle", room: "kueche", min: 25, every: 7 },
  { id: "handtuecher", name: "Handtücher wechseln", room: "bad", min: 5, every: 7 },
  { id: "boden", name: "Böden feucht wischen", room: "wohnung", min: 30, every: 14 },
  { id: "bettwaesche", name: "Bettwäsche wechseln", room: "schlaf", min: 15, every: 14 },
  { id: "staub", name: "Staub wischen", room: "wohnung", min: 20, every: 14 },
  { id: "kuehlschrank", name: "Kühlschrank auswischen (am besten vor dem Grosseinkauf)", room: "kueche", min: 15, every: 28 },
  { id: "balkon", name: "Balkon wischen", room: "aussen", min: 20, every: 30 },
  { id: "backofen", name: "Backofen reinigen", room: "kueche", min: 30, every: 60 },
  { id: "entkalken", name: "Wasserkocher und Duschkopf entkalken", room: "bad", min: 15, every: 60 },
  { id: "fenster", name: "Fenster putzen", room: "wohnung", min: 60, every: 90 }
];
const EVERY_OPTIONS = [[1, "täglich"], [2, "alle 2 Tage"], [3, "alle 3 Tage"], [4, "alle 4 Tage"], [7, "wöchentlich"], [14, "alle 2 Wochen"], [21, "alle 3 Wochen"], [28, "alle 4 Wochen"], [30, "monatlich"], [60, "alle 2 Monate"], [90, "alle 3 Monate"], [180, "halbjährlich"]];
const everyLabel = n => (EVERY_OPTIONS.find(o => o[0] === n) || [n, `alle ${n} Tage`])[1];

/* ---------- Zustand ---------- */
const P_LS = "essplan-putzen";
let P = { settings: { names: ["Luana", "Derin"], baths: 1, off: {}, every: {}, custom: {} }, log: {}, assign: {}, snooze: {}, start: null };
let putzMe = null;
let putzUi = { addOpen: false };
const iso = d => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
const daysBetween = (a, b) => Math.round((b - a) / 86400000);
function hashStr(s) { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h; }

function putzLoad() {
  try {
    const s = JSON.parse(localStorage.getItem(P_LS) || "null");
    if (s && s.settings) P = { ...P, ...s, settings: { ...P.settings, ...s.settings } };
    const m = localStorage.getItem("putz-me"); putzMe = m === null ? null : Number(m);
  } catch (e) { /* ignorieren */ }
  if (!P.start) { P.start = iso(todayDate()); putzSave(); }
}
function putzSave() { try { localStorage.setItem(P_LS, JSON.stringify(P)); } catch (e) { /* ignorieren */ } }
function putzPatch(p) {
  putzSave();
  if (!sync.api) return;
  sync.api.update(sync.api.ref(sync.db, "haushalte/" + SYNC.haushalt + "/putzen"), p).catch(() => {});
}
function putzConnect() {
  if (!sync.api) return;
  const r = sync.api.ref(sync.db, "haushalte/" + SYNC.haushalt + "/putzen");
  let first = true;
  sync.api.onValue(r, snap => {
    const v = snap.val();
    if (v) {
      P = {
        settings: { ...P.settings, ...(v.settings || {}), off: (v.settings && v.settings.off) || {}, every: (v.settings && v.settings.every) || {}, custom: (v.settings && v.settings.custom) || {} },
        log: v.log || {}, assign: v.assign || {}, snooze: v.snooze || {}, start: v.start || P.start
      };
      if (!Array.isArray(P.settings.names)) P.settings.names = Object.values(P.settings.names || {});
    } else if (first) {
      sync.api.set(r, { settings: P.settings, log: P.log, assign: P.assign, snooze: P.snooze, start: P.start }).catch(() => {});
    }
    first = false;
    putzSave();
    if (ui.tab === "haushalt" || ui.tab === "heute") render(true);
  });
}

/* ---------- Logik ---------- */
function putzTasks() {
  const st = P.settings;
  const list = PUTZ_DEFAULT.filter(t => !t.needsBaths || (st.baths || 1) >= t.needsBaths)
    .concat(Object.entries(st.custom || {}).map(([id, c]) => ({ id, custom: true, ...c })));
  return list.map(t => ({ ...t, every: Number((st.every || {})[t.id] || t.every), off: !!(st.off || {})[t.id] })).filter(t => t.name);
}
function lastDone(t) {
  let last = null;
  for (const e of Object.values(P.log)) if (e && e.t === t.id && (!last || e.d > last.d)) last = e;
  return last;
}
function dueDate(t) {
  const last = lastDone(t);
  let due = last ? addDays(parseDate(last.d), t.every) : addDays(parseDate(P.start), t.every > 1 ? hashStr(t.id) % Math.min(t.every, 7) : 0);
  const sn = P.snooze[t.id]; if (sn && parseDate(sn) > due) due = parseDate(sn);
  return due;
}
function minutesBy(daysBack) {
  const from = iso(addDays(todayDate(), -daysBack)), m = [0, 0], n = [0, 0];
  for (const e of Object.values(P.log)) if (e && e.d >= from && (e.by === 0 || e.by === 1)) { m[e.by] += e.min || 0; n[e.by]++; }
  return { m, n };
}
function assigneeFor(t, dueIso, pending) {
  const a = P.assign[t.id];
  if (a && a.due === dueIso && (a.to === 0 || a.to === 1)) return a.to;
  const { m } = minutesBy(28);
  const load = [m[0] + pending[0], m[1] + pending[1]];
  let to = load[0] === load[1] ? (lastDone(t) ? 1 - lastDone(t).by : hashStr(t.id) % 2) : (load[0] < load[1] ? 0 : 1);
  if (t.every === 1) { const lt = lastDone(t); to = lt ? 1 - lt.by : 0; }
  P.assign[t.id] = { due: dueIso, to };
  putzPatch({ ["assign/" + t.id]: { due: dueIso, to } });
  return to;
}
function doneToday(t) { return !!P.log[iso(todayDate()) + "_" + t.id]; }
function putzToday() {
  const today = todayDate(), tIso = iso(today), pending = [0, 0], out = [];
  const tasks = putzTasks().filter(t => !t.off).sort((a, b) => dueDate(a) - dueDate(b) || b.min - a.min);
  for (const t of tasks) {
    const done = doneToday(t);
    const due = dueDate(t);
    if (!done && due > today) continue;
    const dueIso = done ? tIso : iso(due);
    const to = done ? P.log[tIso + "_" + t.id].by : assigneeFor(t, dueIso, pending);
    if (!done) pending[to] += t.min;
    out.push({ t, to, done, overdue: done ? 0 : daysBetween(due, today) });
  }
  return out;
}
function putzUpcoming(days = 7) {
  const today = todayDate(), out = [];
  for (const t of putzTasks().filter(x => !x.off && x.every > 1)) {
    const due = dueDate(t), d = daysBetween(today, due);
    if (d >= 1 && d <= days) out.push({ t, due, d });
  }
  return out.sort((a, b) => a.due - b.due);
}

/* ---------- Ansicht ---------- */
const avatarColor = i => i === 0 ? "var(--tomato)" : "var(--ocean)"; /* Ton und Nebelblau */
function avatar(i, size = 30) {
  const n = P.settings.names[i] || "?";
  return `<span class="avatar" style="background:${avatarColor(i)};width:${size}px;height:${size}px;font-size:${Math.round(size * 0.45)}px">${esc(n.charAt(0).toUpperCase())}</span>`;
}
function roomArt(room, cls = "") {
  const r = ROOMS[room] || ROOMS.wohnung;
  return `<div class="art art-${r.color} ${cls}" aria-hidden="true"><span class="blob b1"></span><span class="blob b2"></span><svg class="ico" viewBox="0 0 64 64">${r.icon}</svg></div>`;
}
function taskRow(x) {
  const { t, to, done, overdue } = x;
  const mine = putzMe === to;
  return `<div class="ptask${done ? " done" : ""}${mine && !done ? " mine" : ""}">
    ${roomArt(t.room)}
    <div class="pinfo"><b>${esc(t.name)}</b>
      <span class="meta">${t.min} Min. · ${everyLabel(t.every)}${overdue > 0 ? ` · <span class="late">${overdue === 1 ? "seit gestern" : "seit " + overdue + " Tagen"} fällig</span>` : ""}</span>
      <span class="who">${avatar(to, 22)} ${done ? `erledigt von ${esc(P.settings.names[to])}` : esc(P.settings.names[to])}${!done ? ` · <button class="linkish" data-psnooze="${t.id}">morgen</button>` : ""}</span></div>
    <button class="pcheck${done ? " on" : ""}" data-pdone="${t.id}" aria-label="${done ? "Rückgängig" : "Erledigt"}: ${esc(t.name)}"></button></div>`;
}
function viewHaushalt() {
  const today = putzToday(), up = putzUpcoming(7);
  const open = today.filter(x => !x.done), done = today.filter(x => x.done);
  const mine = putzMe === null ? [] : open.filter(x => x.to === putzMe);
  const { m, n } = minutesBy(30), tot = m[0] + m[1] || 1;
  const names = P.settings.names;
  const whoPick = putzMe === null ? `<div class="card"><h3>Wer bist du?</h3><p class="small muted">Damit die App weiss, wer etwas erledigt hat. Das wird nur auf diesem Handy gespeichert.</p>
      <div class="row">${names.map((nm, i) => `<button class="btn soft" data-pme="${i}">${avatar(i, 26)} ${esc(nm)}</button>`).join("")}</div></div>` : "";
  const byDay = {};
  for (const u of up) (byDay[u.d] = byDay[u.d] || []).push(u);
  return `
    <div class="top"><div><span class="eyebrow">${open.length ? open.length + " offen heute" : "Heute alles erledigt"}</span><h1>Haushalt</h1></div>${syncChipHtml()}</div>
    ${whoPick}
    ${putzMe !== null ? `<div class="hhero"><div><span class="eyebrow" style="color:inherit;opacity:.75">Für dich heute</span>
      <h2>${mine.length ? mine.length + (mine.length === 1 ? " Aufgabe" : " Aufgaben") + " · " + mine.reduce((a, x) => a + x.t.min, 0) + " Min." : "Nichts mehr für dich"}</h2>
      <span class="small" style="opacity:.85">${mine.length ? esc(mine.map(x => x.t.name).join(" · ")) : "Geniess den Abend."}</span></div>${avatar(putzMe, 46)}</div>` : ""}
    <div class="section"><h2>Heute</h2>
      ${open.length ? `<div class="plist">${open.map(taskRow).join("")}</div>` : `<div class="empty">Alles erledigt. Sauber!</div>`}
      ${done.length ? `<details class="pdone"><summary>${done.length} erledigt</summary><div class="plist">${done.map(taskRow).join("")}</div></details>` : ""}</div>
    <div class="section"><h2>Nächste Tage</h2>
      ${up.length ? Object.entries(byDay).map(([d, list]) => {
        const dd = addDays(todayDate(), Number(d));
        return `<div class="pday"><b>${d === "1" ? "Morgen" : DAYS[dayIndex(dd)][2]}, ${dm(dd)}</b><span>${list.map(u => esc(u.t.name)).join(" · ")}</span></div>`;
      }).join("") : `<div class="empty small">Diese Woche nichts Grösseres.</div>`}</div>
    <div class="card"><div class="spread"><h3>Fairness, letzte 30 Tage</h3></div>
      ${[0, 1].map(i => `<div class="fair"><span class="row">${avatar(i, 26)}<b>${esc(names[i])}</b></span><span class="bar"><i style="width:${Math.round(m[i] / tot * 100)}%;background:${avatarColor(i)}"></i></span><span class="num small">${m[i]} Min. · ${n[i]}×</span></div>`).join("")}
      <p class="small muted">Die App verteilt neue Aufgaben so, dass ihr beide etwa gleich viel Zeit investiert.</p></div>
    <button class="btn soft block" data-psettings>Aufgaben und Einstellungen</button>
    <p class="footer">${putzTasks().filter(t => !t.off).length} Aufgaben aktiv · ${P.settings.baths || 1} ${(P.settings.baths || 1) === 1 ? "Bad" : "Bäder"}</p>`;
}
function putzHeuteCard() {
  if (putzMe === null) return `<button class="pick" data-go="haushalt">${roomArt("wohnung")}<span><span>Haushalt</span><b>Putzplan einrichten</b></span><span class="muted small">Wer bist du? ›</span></button>`;
  const open = putzToday().filter(x => !x.done), mine = open.filter(x => x.to === putzMe);
  return `<button class="pick" data-go="haushalt">${roomArt(mine[0] ? mine[0].t.room : "wohnung")}<span><span>Haushalt heute</span><b>${mine.length ? esc(mine[0].t.name) + (mine.length > 1 ? ` +${mine.length - 1}` : "") : open.length ? "Für dich nichts, " + open.length + " für " + esc(P.settings.names[1 - putzMe]) : "Alles erledigt"}</b></span><span class="muted small">${mine.reduce((a, x) => a + x.t.min, 0) || ""}${mine.length ? " Min." : ""}</span></button>`;
}
function putzSettingsSheet() {
  sheetCtx = { type: "putz" };
  const st = P.settings, tasks = putzTasks();
  return `<div class="grab"><span class="handle"></span><button class="close" data-act="close" aria-label="Schliessen">×</button></div>
    <div class="content" style="padding-top:0">
      <h2>Haushalt einstellen</h2>
      <div class="section"><h3>Namen</h3><div class="row">${[0, 1].map(i => `<input class="search" style="flex:1" data-pname="${i}" value="${esc(st.names[i] || "")}" aria-label="Name ${i + 1}">`).join("")}</div>
        <div class="row small muted">Ich bin: ${[0, 1].map(i => `<button class="chip" data-pme="${i}" aria-pressed="${putzMe === i}">${esc(st.names[i])}</button>`).join("")}</div></div>
      <div class="section"><h3>Badezimmer</h3><div class="row">${[1, 2].map(b => `<button class="chip" data-pbaths="${b}" aria-pressed="${(st.baths || 1) === b}">${b} ${b === 1 ? "Bad" : "Bäder"}</button>`).join("")}</div></div>
      <div class="section"><h3>Aufgaben</h3><div class="plist">
        ${tasks.map(t => `<div class="pset${t.off ? " off" : ""}">
          <label class="switch"><input type="checkbox" data-pon="${t.id}"${t.off ? "" : " checked"}><span><b>${esc(t.name)}</b><br><span class="small muted">${ROOMS[t.room] ? ROOMS[t.room].name : ""} · ${t.min} Min.</span></span></label>
          <span class="row"><select data-pevery="${t.id}" aria-label="Rhythmus">${EVERY_OPTIONS.map(([v, l]) => `<option value="${v}"${v === t.every ? " selected" : ""}>${l}</option>`).join("")}${EVERY_OPTIONS.some(o => o[0] === t.every) ? "" : `<option selected value="${t.every}">alle ${t.every} Tage</option>`}</select>
          ${t.custom ? `<button class="chip" data-pdel="${t.id}">Löschen</button>` : ""}</span></div>`).join("")}
      </div></div>
      <div class="card"><h3>Eigene Aufgabe</h3>
        <input class="search" id="pNewName" placeholder="z. B. Katzenklo, Auto saugen" aria-label="Name der Aufgabe">
        <div class="row"><select id="pNewRoom" aria-label="Bereich">${Object.entries(ROOMS).map(([k, r]) => `<option value="${k}">${r.name}</option>`).join("")}</select>
          <select id="pNewMin" aria-label="Minuten">${[5, 10, 15, 20, 30, 45, 60].map(v => `<option value="${v}"${v === 15 ? " selected" : ""}>${v} Min.</option>`).join("")}</select></div>
        <select id="pNewEvery" aria-label="Rhythmus">${EVERY_OPTIONS.map(([v, l]) => `<option value="${v}"${v === 7 ? " selected" : ""}>${l}</option>`).join("")}</select>
        <button class="btn primary block" data-padd>Hinzufügen</button></div>
    </div>`;
}

/* ---------- Ereignisse ---------- */
function putzAction(d, el) {
  const tIso = iso(todayDate());
  if (d.pme !== undefined) { putzMe = Number(d.pme); try { localStorage.setItem("putz-me", String(putzMe)); } catch (e) { /* ignorieren */ } return true; }
  if (d.pdone) {
    const t = putzTasks().find(x => x.id === d.pdone); if (!t) return true;
    const k = tIso + "_" + t.id;
    if (P.log[k]) { delete P.log[k]; putzPatch({ ["log/" + k]: null }); }
    else {
      const a = P.assign[t.id], by = putzMe !== null ? putzMe : (a ? a.to : 0);
      P.log[k] = { t: t.id, by, min: t.min, d: tIso };
      delete P.snooze[t.id];
      putzPatch({ ["log/" + k]: P.log[k], ["snooze/" + t.id]: null });
      if (navigator.vibrate) navigator.vibrate(15);
    }
    return true;
  }
  if (d.psnooze) { const tm = iso(addDays(todayDate(), 1)); P.snooze[d.psnooze] = tm; putzPatch({ ["snooze/" + d.psnooze]: tm }); return true; }
  if (d.pbaths) { P.settings.baths = Number(d.pbaths); putzPatch({ "settings/baths": P.settings.baths }); return "sheet"; }
  if (d.pdel) { delete P.settings.custom[d.pdel]; putzPatch({ ["settings/custom/" + d.pdel]: null }); return "sheet"; }
  if ("padd" in d) {
    const name = ($("pNewName").value || "").trim(); if (!name) { $("pNewName").focus(); return false; }
    const id = "c" + Date.now().toString(36);
    const c = { name, room: $("pNewRoom").value, min: Number($("pNewMin").value), every: Number($("pNewEvery").value) };
    P.settings.custom[id] = c; putzPatch({ ["settings/custom/" + id]: c }); return "sheet";
  }
  return false;
}
function putzChange(el) {
  if (el.dataset.pon) { const id = el.dataset.pon; if (el.checked) delete P.settings.off[id]; else P.settings.off[id] = true; putzPatch({ ["settings/off/" + id]: el.checked ? null : true }); return true; }
  if (el.dataset.pevery) { const id = el.dataset.pevery, v = Number(el.value); P.settings.every[id] = v; putzPatch({ ["settings/every/" + id]: v }); return true; }
  if (el.dataset.pname !== undefined) { const i = Number(el.dataset.pname), v = el.value.trim() || (i ? "Partner" : "Ich"); P.settings.names[i] = v; putzPatch({ ["settings/names/" + i]: v }); return true; }
  return false;
}

$("view").addEventListener("click", e => {
  const t = e.target.closest("button"); if (!t) return;
  if ("psettings" in t.dataset) { openSheet(putzSettingsSheet(), true); return; }
  const r = putzAction(t.dataset, t);
  if (r) render(true);
});
$("sheet").addEventListener("click", e => {
  const t = e.target.closest("button"); if (!t || !sheetCtx || sheetCtx.type !== "putz") return;
  const r = putzAction(t.dataset, t);
  if (r) { const y = $("sheet").scrollTop; $("sheet").innerHTML = putzSettingsSheet(); $("sheet").scrollTop = y; render(true); }
});
$("sheet").addEventListener("change", e => {
  if (!sheetCtx || sheetCtx.type !== "putz") return;
  if (putzChange(e.target)) { if (!e.target.dataset.pname) { const y = $("sheet").scrollTop; $("sheet").innerHTML = putzSettingsSheet(); $("sheet").scrollTop = y; } render(true); }
});

putzLoad();
