/* «Unser Zuhause» – Bereich Kalender.
   Monatsansicht mit gemeinsamen Terminen, gespeichert unter haushalte/<id>/kalender/events. */

const K_LS = "essplan-kalender";
let K = { events: {} };
let kalUi = { month: null, sel: null };
const WD = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];

function kalLoad() {
  try { const s = JSON.parse(localStorage.getItem(K_LS) || "null"); if (s && s.events) K = s; } catch (e) { /* ignorieren */ }
  const t = todayDate();
  kalUi.month = new Date(t.getFullYear(), t.getMonth(), 1);
  kalUi.sel = iso(t);
}
function kalSave() { try { localStorage.setItem(K_LS, JSON.stringify(K)); } catch (e) { /* ignorieren */ } }
function kalPatch(p) {
  kalSave();
  if (!sync.api) return;
  sync.api.update(sync.api.ref(sync.db, "haushalte/" + SYNC.haushalt + "/kalender/events"), p).catch(() => {});
}
function kalConnect() {
  if (!sync.api) return;
  const r = sync.api.ref(sync.db, "haushalte/" + SYNC.haushalt + "/kalender/events");
  let first = true;
  sync.api.onValue(r, snap => {
    const v = snap.val();
    if (v) K.events = v;
    else if (first && Object.keys(K.events).length) sync.api.set(r, K.events).catch(() => {});
    first = false;
    kalSave();
    if (ui.area === "kalender" || ui.tab === "heute") render(true);
  });
}

/* ---------- Hilfen ---------- */
const personNames = () => (typeof P !== "undefined" && P.settings && P.settings.names) || ["Luana", "Derin"];
const whoColor = w => w === 0 ? "var(--tomato)" : w === 1 ? "var(--ocean)" : "var(--basil)";
const whoLabel = w => w === 2 ? "Beide" : personNames()[w];
function eventsOn(dIso) {
  return Object.entries(K.events).filter(([, e]) => e && e.date === dIso).map(([id, e]) => ({ id, ...e }))
    .sort((a, b) => (a.time || "00:00").localeCompare(b.time || "00:00"));
}
function longDate(d) { return DAYS[dayIndex(d)][2] + ", " + d.getDate() + ". " + MONTHS[d.getMonth()]; }
function mealOn(d) {
  const di = iso(d);
  for (const w of weeks) {
    const s = parseDate(w.start); if (d < s || d >= addDays(s, 7)) continue;
    const st = wstate(w), k = DAYKEYS[dayIndex(d)], v = st.sel[k];
    if (isSpecial(v)) return { w, k, special: v };
    if (v && w.byId[v]) return { w, k, r: w.byId[v] };
    return { w, k };
  }
  return null;
}
function choresOn(d) {
  if (typeof putzTasks !== "function") return [];
  const today = todayDate();
  return putzTasks().filter(t => !t.off && t.every > 1).filter(t => {
    const due = dueDate(t);
    if (iso(d) === iso(today)) return due <= today;
    return iso(due) === iso(d) && d > today;
  });
}

/* ---------- Ansicht ---------- */
function viewKalender() {
  const m = kalUi.month, y = m.getFullYear(), mo = m.getMonth();
  const first = new Date(y, mo, 1), startOff = dayIndex(first);
  const gridStart = addDays(first, -startOff);
  const today = iso(todayDate());
  let cells = "";
  for (let i = 0; i < 42; i++) {
    const d = addDays(gridStart, i), di = iso(d), evs = eventsOn(di), meal = mealOn(d);
    if (i >= 35 && d.getMonth() !== mo) break;
    const cls = [d.getMonth() !== mo ? "other" : "", di === today ? "today" : "", di === kalUi.sel ? "sel" : ""].join(" ");
    const dots = evs.slice(0, 3).map(e => `<i style="background:${whoColor(e.who)}"></i>`).join("");
    const out = meal && meal.special === "__aus";
    cells += `<button class="kday ${cls}" data-kday="${di}" aria-label="${longDate(d)}${evs.length ? ", " + evs.length + " Termine" : ""}"><span class="n">${d.getDate()}</span><span class="dots">${dots}${out ? '<i class="out"></i>' : ""}</span></button>`;
  }
  const sel = parseDate(kalUi.sel), evs = eventsOn(kalUi.sel), meal = mealOn(sel), chores = choresOn(sel);
  const names = personNames();
  const upcoming = Object.entries(K.events).map(([id, e]) => ({ id, ...e })).filter(e => e.date > kalUi.sel || (e.date === today && kalUi.sel !== today && e.date >= today))
    .filter(e => e.date >= today && e.date !== kalUi.sel).sort((a, b) => (a.date + (a.time || "")).localeCompare(b.date + (b.time || ""))).slice(0, 5);
  return `
    <div class="top"><div><span class="eyebrow">Kalender</span><h1>${MONTHS[mo]} ${y}</h1></div>${syncChipHtml()}</div>
    <div class="spread"><span class="row"><button class="chip" data-kmonth="-1" aria-label="Voriger Monat">‹</button><button class="chip" data-kmonth="1" aria-label="Nächster Monat">›</button></span>
      <span class="row"><button class="chip" data-ktoday>Heute</button><button class="btn primary" style="padding:8px 14px" data-knew="${kalUi.sel}">+ Termin</button></span></div>
    <div class="cal">
      <div class="cal-head">${WD.map(w => `<span>${w}</span>`).join("")}</div>
      <div class="cal-grid">${cells}</div>
      <div class="legend small muted"><span><i style="background:var(--tomato)"></i>${esc(names[0])}</span><span><i style="background:var(--ocean)"></i>${esc(names[1])}</span><span><i style="background:var(--basil)"></i>Beide</span><span><i class="out"></i>auswärts essen</span></div>
    </div>
    <div class="section"><h2>${kalUi.sel === today ? "Heute, " + sel.getDate() + ". " + MONTHS[sel.getMonth()] : longDate(sel)}</h2>
      ${evs.length ? `<div class="plist">${evs.map(eventRow).join("")}</div>` : `<button class="kempty" data-knew="${kalUi.sel}">Noch nichts abgemacht. <b>Termin eintragen</b></button>`}
      <div class="kinfo">
        ${meal ? `<button class="krow" ${meal.r ? `data-recipe="${meal.r.id}" data-week="${meal.w.id}"` : `data-go="woche" data-week="${meal.w.id}"`}><span class="kico">${meal.r ? art(meal.r) : meal.special ? specialArt(meal.special) : art(null)}</span><span><span class="small muted">Essen</span><br><b>${meal.r ? esc(meal.r.name) : meal.special ? SPECIAL[meal.special].name : "Noch offen"}</b></span></button>` : ""}
        ${chores.length ? `<button class="krow" data-go="haushalt"><span class="kico">${roomArt(chores[0].room)}</span><span><span class="small muted">Haushalt</span><br><b>${esc(chores.slice(0, 2).map(t => t.name).join(" · "))}${chores.length > 2 ? ` +${chores.length - 2}` : ""}</b></span></button>` : ""}
      </div></div>
    ${upcoming.length ? `<div class="section"><h2>Demnächst</h2><div class="plist">${upcoming.map(e => eventRow(e, true)).join("")}</div></div>` : ""}`;
}
function eventRow(e, withDate = false) {
  const d = parseDate(e.date);
  return `<button class="kev" data-kedit="${e.id}" style="--c:${whoColor(e.who)}">
    <span class="ktime">${withDate ? `<b>${WD[dayIndex(d)]} ${dm(d)}</b><br>` : ""}${e.time ? esc(e.time) + (e.end ? "–" + esc(e.end) : "") : "ganzer Tag"}</span>
    <span class="ktxt"><b>${esc(e.title)}</b>${e.note ? `<br><span class="small muted">${esc(e.note)}</span>` : ""}${e.out ? `<br><span class="small" style="color:var(--basil);font-weight:700">Wir essen auswärts</span>` : ""}</span>
    <span class="kwho">${e.who === 2 ? avatar(0, 22) + avatar(1, 22) : avatar(e.who, 22)}</span></button>`;
}
function kalHeuteCard() {
  const evs = eventsOn(iso(todayDate()));
  if (!evs.length) return "";
  return `<div class="card"><div class="spread"><h3>Heute abgemacht</h3><button class="chip" data-go="kalender">Kalender</button></div>${evs.map(e => eventRow(e)).join("")}</div>`;
}
function kalSheet(id, dateIso) {
  const e = id ? K.events[id] : { title: "", date: dateIso, time: "", end: "", who: 2, note: "", out: false };
  sheetCtx = { type: "kal", id: id || null };
  const names = personNames();
  return `<div class="grab"><span class="handle"></span><button class="close" data-act="close" aria-label="Schliessen">×</button></div>
    <div class="content" style="padding-top:0">
      <h2>${id ? "Termin bearbeiten" : "Neuer Termin"}</h2>
      <input class="search" id="kTitle" placeholder="Was? z. B. Znacht bei Mama, Kino, Zahnarzt" value="${esc(e.title)}" aria-label="Titel">
      <div class="kform">
        <label>Datum<input type="date" id="kDate" value="${esc(e.date)}"></label>
        <label>Von<input type="time" id="kTime" value="${esc(e.time || "")}"></label>
        <label>Bis<input type="time" id="kEnd" value="${esc(e.end || "")}"></label>
      </div>
      <p class="small muted" style="margin-top:-6px">Ohne Uhrzeit gilt der Termin für den ganzen Tag.</p>
      <div class="section"><h3>Wer?</h3><div class="row" role="group" aria-label="Wer">${[0, 1, 2].map(w => `<button class="chip" data-kwho="${w}" aria-pressed="${e.who === w}">${w === 2 ? "Beide" : esc(names[w])}</button>`).join("")}</div></div>
      <textarea class="search" id="kNote" rows="2" placeholder="Notiz, z. B. Adresse oder was mitnehmen" aria-label="Notiz">${esc(e.note || "")}</textarea>
      <label class="switch"><input type="checkbox" id="kOut"${e.out ? " checked" : ""}>Wir essen an diesem Abend auswärts</label>
      <p class="small muted" style="margin-top:-6px">Trägt «Auswärts essen» im Essplan ein, dann fällt der Tag aus dem Einkauf.</p>
      <button class="btn primary block" data-ksave>Speichern</button>
      ${id ? `<button class="btn soft block" data-kdel style="color:var(--tomato)">Termin löschen</button>` : ""}
      <div class="toast" id="kMsg" aria-live="polite"></div>
    </div>`;
}
let kalWho = 2;
function setOutInPlan(dateIso, on) {
  const d = parseDate(dateIso), m = mealOn(d);
  if (!m) return false;
  const s = wstate(m.w);
  if (on) { s.sel[m.k] = "__aus"; patch(m.w.id, { ["sel/" + m.k]: "__aus" }); }
  else if (s.sel[m.k] === "__aus") { s.sel[m.k] = m.w.defaultSel[m.k] || ""; patch(m.w.id, { ["sel/" + m.k]: s.sel[m.k] }); }
  return true;
}

/* ---------- Ereignisse ---------- */
$("view").addEventListener("click", e => {
  const t = e.target.closest("button"); if (!t || ui.area !== "kalender" && !t.dataset.kedit) return;
  const d = t.dataset;
  if (d.kday) { kalUi.sel = d.kday; const dd = parseDate(d.kday); if (dd.getMonth() !== kalUi.month.getMonth()) kalUi.month = new Date(dd.getFullYear(), dd.getMonth(), 1); return render(true); }
  if (d.kmonth) { kalUi.month = new Date(kalUi.month.getFullYear(), kalUi.month.getMonth() + Number(d.kmonth), 1); return render(true); }
  if ("ktoday" in d) { const t0 = todayDate(); kalUi.month = new Date(t0.getFullYear(), t0.getMonth(), 1); kalUi.sel = iso(t0); return render(true); }
  if (d.knew) { kalWho = 2; return openSheet(kalSheet(null, d.knew), true); }
  if (d.kedit) { kalWho = K.events[d.kedit] ? K.events[d.kedit].who : 2; return openSheet(kalSheet(d.kedit), true); }
});
$("sheet").addEventListener("click", e => {
  const t = e.target.closest("button"); if (!t || !sheetCtx || sheetCtx.type !== "kal") return;
  const d = t.dataset;
  if (d.kwho !== undefined) { kalWho = Number(d.kwho); $("sheet").querySelectorAll("[data-kwho]").forEach(b => b.setAttribute("aria-pressed", String(Number(b.dataset.kwho) === kalWho))); return; }
  if ("ksave" in d) {
    const title = $("kTitle").value.trim(), date = $("kDate").value;
    if (!title) { $("kMsg").textContent = "Bitte gib an, was ihr abgemacht habt."; $("kTitle").focus(); return; }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) { $("kMsg").textContent = "Bitte wähle ein Datum."; return; }
    const id = sheetCtx.id || "e" + Date.now().toString(36);
    const old = K.events[id];
    const ev = { title, date, time: $("kTime").value || "", end: $("kEnd").value || "", who: kalWho, note: $("kNote").value.trim(), out: $("kOut").checked };
    K.events[id] = ev; kalPatch({ [id]: ev });
    if (old && old.out && (!ev.out || old.date !== ev.date)) setOutInPlan(old.date, false);
    let inPlan = true;
    if (ev.out) inPlan = setOutInPlan(ev.date, true);
    kalUi.sel = date; const dd = parseDate(date); kalUi.month = new Date(dd.getFullYear(), dd.getMonth(), 1);
    closeSheet(); render(true);
    if (ev.out && !inPlan) setTimeout(() => alertToast("Termin gespeichert. Für diese Woche gibt es noch keinen Essplan, trag «Auswärts essen» später dort ein."), 350);
    return;
  }
  if ("kdel" in d && sheetCtx.id) {
    const old = K.events[sheetCtx.id];
    delete K.events[sheetCtx.id]; kalPatch({ [sheetCtx.id]: null });
    if (old && old.out) setOutInPlan(old.date, false);
    closeSheet(); render(true);
  }
});
function alertToast(text) {
  const el = document.createElement("div"); el.className = "floattoast"; el.textContent = text; el.setAttribute("role", "status");
  document.body.appendChild(el); setTimeout(() => el.remove(), 4500);
}

kalLoad();
