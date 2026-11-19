/* «Unser Zuhause» – Startseite mit Bild und den drei Bereichen. */

let homePhoto = null;
try { homePhoto = localStorage.getItem("zuhause-foto"); } catch (e) { /* ignorieren */ }

function startConnect() {
  if (!sync.api) return;
  const r = sync.api.ref(sync.db, "haushalte/" + SYNC.haushalt + "/home/foto");
  sync.api.onValue(r, snap => {
    const v = snap.val();
    if (v === null && homePhoto) { sync.api.set(r, homePhoto).catch(() => {}); return; }
    homePhoto = v || null;
    try { if (homePhoto) localStorage.setItem("zuhause-foto", homePhoto); else localStorage.removeItem("zuhause-foto"); } catch (e) { /* zu gross oder nicht erlaubt */ }
    if (ui.area === "start") render(true);
  });
}
function savePhoto(dataUrl) {
  homePhoto = dataUrl;
  try { if (dataUrl) localStorage.setItem("zuhause-foto", dataUrl); else localStorage.removeItem("zuhause-foto"); } catch (e) { /* ignorieren */ }
  if (sync.api) sync.api.set(sync.api.ref(sync.db, "haushalte/" + SYNC.haushalt + "/home/foto"), dataUrl || null).catch(() => {});
}

/* Gezeichnete Szene, passend zur Tageszeit */
function sceneSvg() {
  const h = new Date().getHours();
  const phase = h >= 6 && h < 10 ? "morgen" : h >= 10 && h < 17 ? "tag" : h >= 17 && h < 21 ? "abend" : "nacht";
  const sky = {
    morgen: ["#f9d9b8", "#bfdcef"], tag: ["#cfe8f7", "#7fb8de"], abend: ["#f6b26b", "#8d5a97"], nacht: ["#1b2a49", "#0c1428"]
  }[phase];
  const hill1 = phase === "nacht" ? "#24402f" : phase === "abend" ? "#4f7d4a" : "#7fb36a";
  const hill2 = phase === "nacht" ? "#1a3123" : phase === "abend" ? "#3d6a3c" : "#5f9a52";
  const lit = phase === "abend" || phase === "nacht";
  const win = lit ? "#ffd27a" : "#cfe6f5";
  const stars = phase === "nacht" ? Array.from({ length: 28 }, (_, i) => {
    const x = (i * 97) % 390, y = (i * 53) % 120 + 8, r = (i % 3) * 0.5 + 0.8;
    return `<circle cx="${x}" cy="${y}" r="${r}" fill="#fff" opacity="${0.4 + (i % 4) * 0.15}"/>`;
  }).join("") : "";
  const sun = phase === "nacht" ? `<circle cx="318" cy="62" r="22" fill="#f4efd8"/><circle cx="328" cy="55" r="20" fill="${sky[0]}"/>`
    : phase === "abend" ? `<circle cx="300" cy="150" r="34" fill="#ffcf7a" opacity=".9"/>`
    : phase === "morgen" ? `<circle cx="70" cy="110" r="28" fill="#ffe2a8"/>`
    : `<circle cx="320" cy="58" r="26" fill="#fff3c4"/><circle cx="320" cy="58" r="40" fill="#fff3c4" opacity=".25"/>`;
  const clouds = phase === "nacht" ? "" : `<g fill="#fff" opacity="${phase === "abend" ? 0.35 : 0.8}"><ellipse cx="110" cy="62" rx="34" ry="11"/><ellipse cx="132" cy="54" rx="22" ry="12"/><ellipse cx="236" cy="96" rx="26" ry="8"/><ellipse cx="252" cy="90" rx="16" ry="9"/></g>`;
  const glow = lit ? `<circle cx="160" cy="210" r="46" fill="#ffd27a" opacity=".18"/><circle cx="232" cy="210" r="46" fill="#ffd27a" opacity=".18"/>` : "";
  return `<svg class="scene" viewBox="0 0 390 420" preserveAspectRatio="xMidYMin slice" role="img" aria-label="Ein kleines Haus auf einem Hügel">
    <defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${sky[1]}"/><stop offset="1" stop-color="${sky[0]}"/></linearGradient></defs>
    <rect width="390" height="420" fill="url(#sky)"/>${stars}${sun}${clouds}<g transform="translate(0,-34)">
    <path d="M0 230 C70 196 140 206 200 220 S330 200 390 214 V460 H0Z" fill="${hill2}"/>
    <path d="M0 262 C90 236 170 246 230 256 S340 240 390 250 V460 H0Z" fill="${hill1}"/>
    ${glow}
    <g>
      <rect x="138" y="178" width="118" height="84" rx="4" fill="#f6efe1"/>
      <path d="M126 184 L197 128 L268 184 Z" fill="#c8462c"/>
      <path d="M126 184 L197 128 L268 184" fill="none" stroke="#9f3420" stroke-width="4" stroke-linejoin="round"/>
      <rect x="226" y="134" width="14" height="32" fill="#9f3420"/>
      ${phase === "nacht" || phase === "abend" ? "" : `<g fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".7"><path d="M233 126c-6-6 6-10 0-16"/><path d="M240 112c-5-5 5-9 0-14"/></g>`}
      ${phase === "abend" || phase === "nacht" ? `<g fill="none" stroke="#e8e0d0" stroke-width="3" stroke-linecap="round" opacity=".5"><path d="M233 126c-6-6 6-10 0-16"/></g>` : ""}
      <rect x="150" y="196" width="26" height="24" rx="3" fill="${win}"/><path d="M163 196v24M150 208h26" stroke="#f6efe1" stroke-width="2.5"/>
      <rect x="218" y="196" width="26" height="24" rx="3" fill="${win}"/><path d="M231 196v24M218 208h26" stroke="#f6efe1" stroke-width="2.5"/>
      <rect x="186" y="220" width="22" height="42" rx="11" fill="#2f6b46"/><circle cx="203" cy="242" r="1.8" fill="#e3a21a"/>
      <circle cx="197" cy="160" r="9" fill="${win}"/>
    </g>
    <path d="M197 262 C190 290 214 320 192 360 H218 C238 320 206 290 210 262Z" fill="#e9dcc2" opacity=".85"/>
    <g><rect x="76" y="214" width="6" height="40" fill="#6b4a2f"/><circle cx="79" cy="206" r="24" fill="${phase === "nacht" ? "#2b5238" : "#3f8a5a"}"/><circle cx="66" cy="214" r="15" fill="${phase === "nacht" ? "#24452f" : "#357a4d"}"/></g>
    <g><rect x="312" y="224" width="5" height="32" fill="#6b4a2f"/><circle cx="314" cy="216" r="18" fill="${phase === "nacht" ? "#2b5238" : "#4b9663"}"/></g>
    <g fill="${phase === "nacht" ? "#e8a0a0" : "#f08a6f"}"><circle cx="140" cy="262" r="4"/><circle cx="150" cy="265" r="3.5"/><circle cx="250" cy="263" r="4"/><circle cx="242" cy="266" r="3"/></g>
    </g>
  </svg>`;
}

function viewStart() {
  const d = new Date(), h = d.getHours();
  const name = typeof putzMe !== "undefined" && putzMe !== null && P.settings.names[putzMe] ? ", " + P.settings.names[putzMe] : "";
  const greet = (h < 11 ? "Guten Morgen" : h < 17 ? "Schön, dass du da bist" : h < 22 ? "Guten Abend" : "Gute Nacht") + name;

  /* Essen */
  const w = currentWeek(), st = weekStatus(w), s = wstate(w), tk = DAYKEYS[dayIndex(d)];
  let essen = "Plan für die Woche ansehen";
  if (st === "current") {
    const v = s.sel[tk];
    essen = isSpecial(v) ? SPECIAL[v].name : w.byId[v] ? "Heute: " + w.byId[v].name : "Heute noch nichts geplant";
  }
  const nxt = weeks.find(x => weekStatus(x) === "next" && x !== w);
  const essenSub = nxt ? `Neu: ${nxt.recipes.length} Gerichte für nächste Woche` : (() => { const sm = summary(shopWeek()); return sm.all - sm.done ? `Einkauf: noch ${sm.all - sm.done} Dinge` : "Einkauf erledigt"; })();

  /* Haushalt */
  let haus = "Putzplan einrichten", hausSub = "Sag der App, wer du bist";
  if (typeof putzToday === "function" && putzMe !== null) {
    const open = putzToday().filter(x => !x.done), mine = open.filter(x => x.to === putzMe);
    haus = mine.length ? `${mine.length} ${mine.length === 1 ? "Aufgabe" : "Aufgaben"} für dich heute` : "Für dich ist heute alles erledigt";
    hausSub = mine.length ? mine.map(x => x.t.name).slice(0, 2).join(" · ") : open.length ? `${open.length} offen für ${P.settings.names[1 - putzMe]}` : "Die Wohnung glänzt";
  }

  /* Kalender */
  let kal = "Nichts abgemacht", kalSub = "Termin eintragen";
  if (typeof eventsOn === "function") {
    const todayEv = eventsOn(iso(todayDate()));
    const up = Object.values(K.events).filter(e => e && e.date >= iso(todayDate())).sort((a, b) => (a.date + (a.time || "")).localeCompare(b.date + (b.time || "")));
    if (todayEv.length) { kal = `Heute: ${todayEv[0].title}`; kalSub = todayEv[0].time ? todayEv[0].time + " Uhr" + (todayEv.length > 1 ? ` · +${todayEv.length - 1} weitere` : "") : todayEv.length > 1 ? `+${todayEv.length - 1} weitere` : "ganzer Tag"; }
    else if (up.length) { const e = up[0], ed = parseDate(e.date); kal = e.title; kalSub = `${DAYS[dayIndex(ed)][2]}, ${dm(ed)}${e.time ? " · " + e.time + " Uhr" : ""}`; }
  }

  const ico = {
    essen: '<svg viewBox="0 0 24 24"><circle cx="12" cy="13" r="7"/><circle cx="12" cy="13" r="3.5"/><path d="M3 3v6M5 3v6M4 9v12M20 3c-1.5 1-2 3-2 6h2v12"/></svg>',
    haushalt: '<svg viewBox="0 0 24 24"><path d="M14 3l-4 9"/><path d="M6 12h8l2 9H4z"/><path d="M8 16v5M11 16v5"/><path d="M18 4l.6 1.4L20 6l-1.4.6L18 8l-.6-1.4L16 6l1.4-.6z"/></svg>',
    kalender: '<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/><circle cx="8" cy="14.5" r="1"/><circle cx="12" cy="14.5" r="1"/><circle cx="16" cy="14.5" r="1"/></svg>'
  };
  const card = (go, cls, label, title, sub) => `<button class="area area-${cls}" data-go="${go}"><span class="area-ico">${ico[cls]}</span><span class="area-txt"><span class="eyebrow">${label}</span><b>${esc(title)}</b><span>${esc(sub)}</span></span><span class="area-go" aria-hidden="true">›</span></button>`;

  return `
    <div class="home-hero">
      ${homePhoto ? `<img class="scene" src="${homePhoto}" alt="Euer Zuhause">` : sceneSvg()}
      <div class="home-shade"></div>
      <div class="home-txt">
        <span class="eyebrow">${DAYS[dayIndex(d)][2]}, ${d.getDate()}. ${MONTHS[d.getMonth()]}</span>
        <h1>Zuhause ist es am schönsten</h1>
        <p>${esc(greet)}</p>
      </div>
      <div class="home-sync">${syncChipHtml()}</div>
    </div>
    <div class="areas">
      ${card("essen", "essen", "Essen", essen, essenSub)}
      ${card("haushalt", "haushalt", "Haushalt", haus, hausSub)}
      ${card("kalender", "kalender", "Kalender", kal, kalSub)}
    </div>
    <div class="photo-row">
      <label class="chip" for="homePhotoInput">${homePhoto ? "Titelbild ändern" : "Eigenes Foto als Titelbild"}</label>
      <input type="file" id="homePhotoInput" accept="image/*" hidden>
      ${homePhoto ? `<button class="chip" data-photoreset>Gezeichnetes Haus</button>` : ""}
    </div>`;
}

$("view").addEventListener("change", e => {
  if (e.target.id !== "homePhotoInput") return;
  const f = e.target.files && e.target.files[0]; if (!f) return;
  const img = new Image(), url = URL.createObjectURL(f);
  img.onload = () => {
    const max = 1000, sc = Math.min(1, max / Math.max(img.width, img.height));
    const c = document.createElement("canvas"); c.width = Math.round(img.width * sc); c.height = Math.round(img.height * sc);
    c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
    URL.revokeObjectURL(url);
    savePhoto(c.toDataURL("image/jpeg", 0.72));
    render(true);
  };
  img.src = url;
});
$("view").addEventListener("click", e => {
  const t = e.target.closest("button[data-photoreset]"); if (!t) return;
  savePhoto(null); render(true);
});
