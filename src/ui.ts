/* Zahlenotter – Oberfläche (aus dem Prototyp übernommen, Verhalten unverändert).
   TODO: schrittweise typisieren und in Bausteine aufteilen. */
// @ts-nocheck
import * as ZO from "./logic";
import * as QR from "./qr";
import * as P from "./progress";
import * as Store from "./storage";
import * as Pfad from "./pfad";
import * as Copy from "./copy";
import "./style.css";

(function () {
  const $app = document.getElementById("app");
  const STAGES = [0, 6, 15, 30];
  const GIFTS = ["Schal", "Brille", "Krone"];
  const ERR_LABEL = {
    zehner: ["Zehnerfehler", "Ziffern stimmen, aber die Zehnerstelle ist um 1, 2 … verschoben (z. B. 17 statt 27). Typisch beim Zehnerübergang."],
    knapp: ["Knapp daneben", "Das Ergebnis ist um genau 1 falsch. Meist ein Zählfehler."],
    dreher: ["Zahlendreher", "Ziffern vertauscht (z. B. 61 statt 16)."],
    andere: ["Andere Fehler", "Kein erkennbares Muster, zum Beispiel falsche Rechenart."],
  };
  const GAME_NAME = { M: "Mustermauer", R: "Reihenpfad" };

  const S = {
    screen: "home", game: { M: Store.emptyGame("M"), R: Store.emptyGame("R") }, adaptive: true, fish: 0,
    stats: Store.emptyStats(), pfadType: "M", pfadMsg: "", offerDue: false, angebot: false, eltSel: { M: "", R: "" }, eltMsg: "", copied: null, toast: "", copyFail: "",
    session: null, tasks: [], active: null, hintCell: null, msg: "", mood: "happy", overlay: null,
    sheet: null, sheetType: "M", sheetLevel: 2, showSol: false, codeInput: "", codeError: "", baseUrl: "", checkResult: null, confirmReset: false,
  };

  function load() {
    const st = Store.load();
    S.adaptive = st.adaptive; S.fish = st.fish; S.stats = st.stats; S.baseUrl = st.baseUrl;
    S.game = { M: st.M, R: st.R };
  }
  function save() {
    Store.save({ version: 2, adaptive: S.adaptive, fish: S.fish, stats: S.stats, baseUrl: S.baseUrl, M: S.game.M, R: S.game.R });
  }

  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const fmt = (d) => (d < 0 ? "−" : "+") + Math.abs(d);
  const stageOf = (f) => STAGES.reduce((s, th, i) => (f >= th ? i : s), 0);

  // ---------- Grafiken ----------
  function otter(mood, stage, size) {
    const brown = "#8A5A3B", belly = "#EBD6B5", dark = "#2B1E17";
    const eyes = mood === "cheer"
      ? `<path d="M70 80 Q78 68 86 80" stroke="${dark}" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M114 80 Q122 68 130 80" stroke="${dark}" stroke-width="4" fill="none" stroke-linecap="round"/>`
      : `<circle cx="78" cy="78" r="7" fill="${dark}"/><circle cx="122" cy="78" r="7" fill="${dark}"/><circle cx="${mood === "think" ? 80 : 80}" cy="${mood === "think" ? 74 : 75}" r="2.4" fill="#fff"/><circle cx="${mood === "think" ? 124 : 124}" cy="${mood === "think" ? 74 : 75}" r="2.4" fill="#fff"/>`;
    const brow = mood === "think" ? `<path d="M112 63 L132 58" stroke="${dark}" stroke-width="3.5" stroke-linecap="round"/>` : mood === "oops" ? `<path d="M67 68 L88 61 M112 61 L133 68" stroke="${dark}" stroke-width="3.5" stroke-linecap="round"/>` : "";
    const mouth = mood === "cheer"
      ? `<path d="M84 104 Q100 130 116 104 Z" fill="#7A2E2E"/><path d="M92 117 Q100 124 108 117" fill="#E8767A"/>`
      : mood === "think" ? `<path d="M92 111 Q100 107 108 111" stroke="${dark}" stroke-width="3" fill="none" stroke-linecap="round"/>`
      : mood === "oops" ? `<path d="M90 113 Q100 106 110 113" stroke="${dark}" stroke-width="3" fill="none" stroke-linecap="round"/>`
      : `<path d="M88 106 Q100 119 112 106" stroke="${dark}" stroke-width="3.5" fill="none" stroke-linecap="round"/>`;
    const arms = mood === "cheer"
      ? `<ellipse cx="46" cy="112" rx="13" ry="24" fill="${brown}" transform="rotate(-25 46 112)"/><ellipse cx="154" cy="112" rx="13" ry="24" fill="${brown}" transform="rotate(25 154 112)"/>`
      : `<ellipse cx="58" cy="150" rx="13" ry="22" fill="${brown}" transform="rotate(12 58 150)"/><ellipse cx="142" cy="150" rx="13" ry="22" fill="${brown}" transform="rotate(-12 142 150)"/>`;
    const scarf = stage >= 1 ? `<path d="M60 124 Q100 146 140 124 L138 138 Q100 160 62 138Z" fill="#E4572E"/><path d="M122 140 L134 172 L146 166 L136 138Z" fill="#E4572E"/><path d="M80 134 L84 146 M96 140 L100 152 M112 140 L116 152" stroke="#fff" stroke-width="3" opacity=".7"/>` : "";
    const glasses = stage >= 2 ? `<g fill="rgba(255,255,255,.35)" stroke="#23355B" stroke-width="4"><circle cx="78" cy="78" r="15"/><circle cx="122" cy="78" r="15"/></g><path d="M93 78 H107" stroke="#23355B" stroke-width="4"/>` : "";
    const crown = stage >= 3 ? `<path d="M70 46 L76 22 L90 38 L100 16 L110 38 L124 22 L130 46Z" fill="#F4B942" stroke="#C98A12" stroke-width="3" stroke-linejoin="round"/><circle cx="100" cy="30" r="3.5" fill="#E4572E"/>` : "";
    return `<svg class="otter" width="${size}" height="${size}" viewBox="0 0 200 200" aria-hidden="true">
      <path d="M150 170 Q196 170 190 130 Q186 156 150 154Z" fill="${brown}"/>
      <ellipse cx="100" cy="150" rx="52" ry="44" fill="${brown}"/>
      <ellipse cx="100" cy="158" rx="32" ry="30" fill="${belly}"/>
      ${arms}
      <circle cx="58" cy="52" r="13" fill="${brown}"/><circle cx="142" cy="52" r="13" fill="${brown}"/>
      <circle cx="58" cy="52" r="6" fill="${belly}"/><circle cx="142" cy="52" r="6" fill="${belly}"/>
      <circle cx="100" cy="86" r="48" fill="${brown}"/>
      <ellipse cx="100" cy="102" rx="30" ry="22" fill="${belly}"/>
      <ellipse cx="100" cy="94" rx="10" ry="7" fill="${dark}"/>
      <path d="M62 100 H44 M62 106 L46 114 M138 100 H156 M138 106 L154 114" stroke="${dark}" stroke-width="2" stroke-linecap="round" opacity=".55"/>
      ${eyes}${brow}${mouth}${scarf}${glasses}${crown}</svg>`;
  }
  const fishIcon = (s) => `<svg width="${s || 22}" height="${s || 22}" viewBox="0 0 32 32" aria-hidden="true"><path d="M3 16 Q14 3 24 14 L30 8 V24 L24 18 Q14 29 3 16Z" fill="#4FB0C6"/><circle cx="9" cy="14" r="1.8" fill="#fff"/></svg>`;
  const starIcon = (on) => `<svg viewBox="0 0 24 24"><path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3 6.1 20.6l1.3-6.6L2.5 9.4l6.6-.8z" fill="${on ? "#F4B942" : "#E3E7EF"}" stroke="${on ? "#C98A12" : "#C9CFDB"}" stroke-width="1.2" stroke-linejoin="round"/></svg>`;
  const copyIcon = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="11" height="11" rx="3"/><path d="M5 15V6a2 2 0 0 1 2-2h9"/></svg>';
  const checkIcon = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 13l4 4L19 7"/></svg>';
  const backIcon = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>';
  const bulb = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.7.6 1 1.2 1 2.1h5c0-.9.3-1.5 1-2.1A6 6 0 0 0 12 3z"/></svg>';

  // ---------- Bretter ----------
  function cellHtml(t, ti, i, o) {
    let cls = "cell", txt = "", interactive = false;
    if (t.given[i]) { cls += " given"; txt = t.sol[i]; }
    else if (o.static) { cls += " blank"; if (o.sol) { cls += " sol"; txt = t.sol[i]; } }
    else {
      const st = t.st[i];
      cls += " blank" + (st === "ok" ? " ok" : st === "bad" ? " bad" : "");
      txt = t.val[i];
      interactive = st !== "ok";
      if (S.active && S.active.t === ti && S.active.i === i) cls += " active";
      if (S.hintCell && S.hintCell.t === ti && S.hintCell.i === i) cls += " hint";
    }
    return interactive
      ? `<button class="${cls}" data-act="cell" data-t="${ti}" data-i="${i}" aria-label="Feld ${i + 1}">${esc(txt)}</button>`
      : `<div class="${cls}">${esc(txt)}</div>`;
  }
  function mauerHtml(t, ti, o) {
    let h = '<div class="pyr">';
    for (let r = 0; r < t.n; r++) {
      h += '<div class="prow">';
      for (let i = 0; i <= r; i++) h += cellHtml(t, ti, ZO.mid(r, i), o);
      h += "</div>";
    }
    return h + "</div>";
  }
  function reiheHtml(t, ti, o) {
    let h = `<div class="rrow${o.static ? " st" : ""}">`;
    for (let i = 0; i < 8; i++) {
      let arc = "";
      if (i < 7 && !o.static) {
        const on = t.showSteps[i];
        arc = `<span class="arc${on ? " on" : ""}"><b>${on ? fmt(t.diffs[i]) : ""}</b><svg viewBox="0 0 100 26" preserveAspectRatio="none"><path d="M4 26 Q50 -10 96 26" vector-effect="non-scaling-stroke"/></svg></span>`;
      }
      h += `<div class="rc">${cellHtml(t, ti, i, o)}${arc}</div>`;
    }
    return h + "</div>";
  }
  const boardHtml = (t, ti, o) => (t.type === "M" ? mauerHtml(t, ti, o || {}) : reiheHtml(t, ti, o || {}));
  const instruction = (t) =>
    t.type === "M"
      ? t.level === 1 ? "Zähle die zwei Steine unten zusammen – das ergibt den Stein darüber." : "Jeder Stein ist die Summe der zwei Steine darunter. Manchmal musst du abziehen!"
      : t.text;

  function padHtml(allowNext) {
    let h = `<div class="pad${allowNext ? " sticky" : ""}">`;
    for (const d of [1, 2, 3, 4, 5, 6, 7, 8, 9, 0]) h += `<button data-act="key" data-d="${d}">${d}</button>`;
    h += `<button data-act="back" class="wide w2" aria-label="Löschen">⌫</button>`;
    h += `<button data-act="prev" class="wide" aria-label="Voriges Feld">←</button>`;
    h += `<button data-act="next" class="wide w2" aria-label="Nächstes Feld">→</button>`;
    return h + "</div>";
  }

  // ---------- Bildschirme ----------
  function homeHtml() {
    const st = stageOf(S.fish), next = STAGES[st + 1];
    const progress = next ? Math.min(100, Math.round(((S.fish - STAGES[st]) / (next - STAGES[st])) * 100)) : 100;
    const gift = next ? `Noch ${next - S.fish} Fische bis: ${GIFTS[st]}` : "Plitsch hat alle Geschenke!";
    const world = (type, title, sub, icon) => `<div class="world">
      <div class="ico">${icon}</div><h2>${title}</h2><div class="muted small">${sub}</div>
      <div class="chip" style="align-self:flex-start">Station ${Pfad.nummer(type, S.game[type].station)} von ${ZO.STATIONS[type].length}</div>
      <div class="small muted" style="min-height:40px">${esc(ZO.stationInfo(type, S.game[type].station).name)}</div>
      <div class="world-btns"><button class="btn alt" data-act="pfad" data-type="${type}">Pfad ansehen</button><button class="btn" data-act="start" data-type="${type}">Los geht’s</button></div></div>`;
    const miniM = '<svg width="120" height="64" viewBox="0 0 120 64"><g fill="#fff" stroke="#1F8A8A" stroke-width="3"><rect x="45" y="4" width="30" height="16" rx="4"/><rect x="30" y="24" width="30" height="16" rx="4"/><rect x="60" y="24" width="30" height="16" rx="4"/><rect x="15" y="44" width="30" height="16" rx="4"/><rect x="45" y="44" width="30" height="16" rx="4"/><rect x="75" y="44" width="30" height="16" rx="4"/></g></svg>';
    const miniR = '<svg width="150" height="64" viewBox="0 0 150 64"><g fill="#fff" stroke="#1F8A8A" stroke-width="3"><rect x="4" y="30" width="26" height="26" rx="5"/><rect x="42" y="30" width="26" height="26" rx="5"/><rect x="80" y="30" width="26" height="26" rx="5"/><rect x="118" y="30" width="26" height="26" rx="5"/></g><g fill="none" stroke="#F39C4A" stroke-width="3" stroke-linecap="round"><path d="M17 24 Q30 6 55 24"/><path d="M55 24 Q68 6 93 24"/><path d="M93 24 Q106 6 131 24"/></g></svg>';
    return `<div class="hero">${otter("happy", st, 130)}<div style="flex:1"><div class="bubble">Hallo! Ich bin Plitsch. Was wollen wir heute knobeln?</div>
      <div class="row spread" style="margin-top:10px"><span class="chip">${fishIcon()} ${S.fish} Fische</span><span class="small muted">${gift}</span></div>
      <div class="progress"><i style="width:${progress}%"></i></div></div></div>
      <div class="worlds">${world("M", "Mustermauer", "Zahlenmauern: oben ist die Summe von unten", miniM)}${world("R", "Reihenpfad", "Zahlenreihen: finde den nächsten Schritt", miniR)}</div>
      <div class="switch"><button class="${S.adaptive ? "on" : ""}" data-act="adaptive" aria-label="Automatisch weiterkommen"></button><span>Automatisch weiterkommen <span class="muted small">(4 von 5 Aufgaben sicher = nächste Station)</span></span></div>
      <div class="footer-links"><button class="btn alt small" data-act="go" data-to="sheets">Papierblatt erstellen</button><button class="btn alt small" data-act="go" data-to="code">Blatt prüfen (Code)</button><button class="btn alt small" data-act="go" data-to="parents">Eltern</button></div>`;
  }

  function playHtml() {
    const t = S.tasks[0], se = S.session;
    const dots = Array.from({ length: se.total }, (_, i) => `<span class="dot${i < se.stars.length ? " done" : i === se.stars.length ? " now" : ""}"></span>`).join("");
    let ov = "";
    if (S.overlay) {
      const o = S.overlay;
      ov = `<div class="overlay"><div class="modal"><div class="bounce">${otter("cheer", stageOf(S.fish), 150)}</div>
        <h2>${["Gut gemacht!", "Super!", "Wow, fantastisch!"][o.stars - 1]}</h2>
        <div class="stars">${[1, 2, 3].map((n) => starIcon(n <= o.stars)).join("")}</div>
        <div class="chip">${fishIcon()} +${o.stars} Fische</div>
        ${o.rule ? `<p>Die Regel war: <b>${esc(o.rule)}</b></p>` : ""}
        ${o.note ? `<p class="chip" style="background:var(--green-l)">${esc(o.note)}</p>` : ""}
        ${o.gift ? `<p class="chip" style="background:#FFF3CF">Neues Geschenk: ${o.gift}!</p>` : ""}
        <div style="margin-top:14px"><button class="btn orange" data-act="continue">Weiter</button></div></div></div>`;
    }
    if (S.angebot) {
      ov = `<div class="overlay"><div class="modal">${otter("think", stageOf(S.fish), 150)}
        <h2>Das war knifflig!</h2><p style="margin:8px 0 14px">Magst du eine leichtere Aufgabe oder eine kleine Pause?</p>
        <div class="stack"><button class="btn" data-act="angebotEasy">Leichtere Aufgabe</button><button class="btn alt" data-act="angebotPause">Pause</button><button class="btn alt" data-act="angebotWeiter">Weiter so</button></div></div></div>`;
    }
    return `<div class="noprint">
      <div class="topbar"><button class="btn alt small" data-act="go" data-to="home">${backIcon} Zurück</button><div class="dots" aria-label="Fortschritt">${dots}</div><span class="chip">${fishIcon()} ${S.fish}</span></div>
      <div class="banner">${esc(instruction(t))}</div>
      <div class="stage">${boardHtml(t, 0)}</div>
      <div class="coach">${otter(S.mood, stageOf(S.fish), 84)}<div class="bubble msg">${esc(S.msg)}</div></div>
      <div class="tools"><button class="btn alt" data-act="hint">${bulb} Hilfe</button><button class="btn orange" data-act="check">Prüfen</button></div>
      ${padHtml()}<div class="code-tag"><span>Aufgabe ${t.code} · ${esc(ZO.stationInfo(t.type, t.station).name)}</span>${copyBtn("task", t.code, "Code kopieren")}</div>${ov}</div>`;
  }

  function flagIcon() {
    return '<svg class="flag" viewBox="0 0 40 44" aria-hidden="true"><path d="M8 4v38" stroke="#23355B" stroke-width="3" stroke-linecap="round"/><path d="M10 6h24v18H10z" fill="#fff" stroke="#23355B" stroke-width="2"/><path d="M10 6h8v6h-8zM26 6h8v6h-8zM18 12h8v6h-8zM10 18h8v6h-8zM26 18h8v6h-8z" fill="#23355B"/></svg>';
  }
  function pfadHtml() {
    const type = S.pfadType, g = S.game[type], pl = Pfad.plaetze(type), rows = Pfad.zeilen(type), n = ZO.STATIONS[type].length;
    const mini = otter("happy", stageOf(S.fish), 54);
    const dots = pl.map((q) => {
      const st = Pfad.stationStatus(type, g, q.id);
      return `<button class="tdot ${st}" style="left:${q.x}%;top:${q.y}px" data-act="pfadStation" data-id="${q.id}" aria-label="${esc(Pfad.stationLabel(type, q.id, st))}">${st === "now" ? mini : Pfad.nummer(type, q.id)}</button>`;
    }).join("");
    const klass = rows.map((z, r) => { const f = pl.find((q) => q.id === z[0].id); return `<span class="klass" style="left:calc(${f.x}% - 44px);top:${f.y - 76}px">Klasse ${r + 1}</span>`; }).join("");
    const lastRow = rows[2], flag = lastRow.length < Pfad.SLOT_X.length ? `<span class="flagpos" style="left:${Pfad.SLOT_X[lastRow.length]}%;top:${Pfad.ZEILE_Y[2]}px">${flagIcon()}</span>` : "";
    const info = ZO.stationInfo(type, g.station);
    return `<div class="noprint"><div class="topbar"><button class="btn alt small" data-act="go" data-to="home">${backIcon} Zurück</button><h2>Dein Pfad: ${GAME_NAME[type]}</h2><span class="chip">${fishIcon()} ${S.fish}</span></div>
      <div class="board" style="height:${Pfad.BRETT_HOEHE}px"><svg class="river" viewBox="0 0 100 ${Pfad.BRETT_HOEHE}" preserveAspectRatio="none" aria-hidden="true"><path d="${Pfad.flussPfad(type)}" fill="none" stroke="var(--river)" stroke-width="44" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/><path d="${Pfad.flussPfad(type)}" fill="none" stroke="#fff" stroke-width="5" stroke-dasharray="2 14" stroke-linecap="round" vector-effect="non-scaling-stroke"/></svg>${klass}${dots}${flag}</div>
      <div class="legend"><span><i class="lg done"></i>geschafft</span><span><i class="lg vor"></i>vorausgesetzt</span><span><i class="lg now"></i>jetzt</span><span><i class="lg todo"></i>kommt noch</span></div>
      <div class="banner">Jetzt: Station ${Pfad.nummer(type, g.station)} von ${n}. ${esc(info.name)}</div>
      ${S.pfadMsg ? `<div class="coach">${otter("think", stageOf(S.fish), 70)}<div class="bubble msg">${esc(S.pfadMsg)}</div></div>` : ""}
      <div class="tools"><button class="btn orange" data-act="pfadWeiter">Weiter üben</button></div></div>`;
  }

  function summaryHtml() {
    const se = S.session, tot = se.stars.reduce((a, b) => a + b, 0);
    return `<div class="noprint"><div class="panel" style="text-align:center"><div class="bounce">${otter("cheer", stageOf(S.fish), 170)}</div>
      <h1>Das war stark!</h1><p>Du hast ${se.total} Aufgaben geschafft und <b>${tot}</b> Fische gesammelt.</p>
      <div class="stars sm">${se.stars.map((s) => `<span class="mini" title="${s} von 3 Sternen">${[1, 2, 3].map((n) => starIcon(n <= s)).join("")}</span>`).join("")}</div>
      <p class="muted">Zeit für eine kleine Pause? Plitsch schwimmt gern später weiter.</p>
      <div class="row wrap" style="justify-content:center;margin-top:12px"><button class="btn" data-act="start" data-type="${se.type}">Noch 5 Aufgaben</button><button class="btn alt" data-act="go" data-to="home">Zur Startseite</button></div></div></div>`;
  }

  function baseUrl() { return S.baseUrl || location.href.split("#")[0]; }
  // Kopieren-Knopf: zeigt nach dem Kopieren zwei Sekunden «Kopiert!» (Haken und Farbe, nicht nur Farbe)
  function copyBtn(kind, text, label) {
    const ok = S.copied === kind;
    return `<button class="copybtn${ok ? " ok" : ""}" data-act="copy" data-kind="${kind}" data-text="${esc(text)}">${ok ? checkIcon : copyIcon}<span>${ok ? "Kopiert!" : label}</span></button>`;
  }
  function codeCardHtml(sheet) {
    return `<div class="codecard noprint"><div class="codeinfo"><span class="lbl">Code dieses Blatts</span><span class="big">${esc(sheet.code)}</span></div>${copyBtn("code", sheet.code, "Code kopieren")}${copyBtn("addr", baseUrl(), "Adresse kopieren")}</div>`;
  }
  // Hinweis unten und Ersatz, wenn das Kopieren nicht klappt (Feld mit markiertem Text)
  function extrasHtml() {
    let h = "";
    if (S.toast) h += `<div class="toast noprint" role="status">${checkIcon}<span>${esc(S.toast)}</span></div>`;
    if (S.copyFail) h += `<div class="overlay noprint" role="dialog" aria-modal="true" aria-label="Kopieren ging nicht"><div class="modal" style="text-align:left"><h2>Kopieren ging nicht</h2><p style="margin:8px 0 12px">Dein Gerät erlaubt das Kopieren hier nicht. Tippe in das Feld und kopiere den Text von Hand.</p><input class="txt copyfield" data-copyfield readonly value="${esc(S.copyFail)}" aria-label="Text zum Kopieren"><div style="margin-top:14px;display:flex;justify-content:flex-end"><button class="btn" data-act="copyClose">Fertig</button></div></div></div>`;
    return h;
  }
  let copyTimer = null;
  function legacyCopy(text) {
    const ta = document.createElement("textarea");
    ta.value = text; ta.setAttribute("readonly", ""); ta.className = "copyhelper";
    document.body.appendChild(ta); ta.select();
    let ok = false;
    try { ok = document.execCommand("copy"); } catch (e) { ok = false; }
    ta.remove();
    return ok;
  }
  async function doCopy(kind, text) {
    const res = await Copy.copyText(text, { clipboard: typeof navigator !== "undefined" ? navigator.clipboard : null, legacy: legacyCopy });
    if (res === "fehler") { S.copyFail = text; S.copied = null; S.toast = ""; }
    else {
      S.copied = kind; S.toast = Copy.copiedMessage(kind, text);
      clearTimeout(copyTimer);
      copyTimer = setTimeout(() => { S.copied = null; S.toast = ""; render(); }, 2000);
    }
    render();
  }
  function sheetHtml(sheet, sol) {
    const name = sheet.type === "M" ? "Mustermauer" : "Reihenpfad";
    const url = baseUrl() + "#" + sheet.code;
    let qr = "";
    try { qr = QR.svg(url); } catch (e) { qr = `<div>QR nicht möglich</div>`; }
    const tasks = sheet.tasks.map((t, i) => `<div><div class="tasknum">${i + 1})</div>${sheet.type === "R" ? `<div class="instr">${esc(t.text)}</div>` : ""}<div class="stage">${boardHtml(t, i, { static: true, sol })}</div></div>`).join("");
    return `<section class="sheet"><header><div><h2>Zahlenotter · ${name}</h2><div class="small">Stufe ${sheet.level} · Name: ______________________</div></div><div class="code">${sheet.code}</div></header>
      ${sheet.type === "M" ? '<p class="instr">Jeder Stein ist die Summe der zwei Steine darunter. Schreibe die fehlenden Zahlen in die leeren Steine.</p>' : '<p class="instr">Fülle die leeren Kästchen aus.</p>'}
      <div class="tasks ${sheet.type.toLowerCase()}">${tasks}</div>
      <footer>${qr}<div><b>Fertig? Prüfe deine Zahlen!</b><br>Scanne den QR-Code oder gib den Code <b>${sheet.code}</b> in Zahlenotter ein.</div></footer></section>`;
  }

  function sheetsHtml() {
    const seg = (cur, key, vals) => `<div class="seg">${vals.map(([v, l]) => `<button class="pill${cur === v ? " on" : ""}" style="flex:0 0 auto;padding:0 18px" data-act="${key}" data-v="${v}">${l}</button>`).join("")}</div>`;
    return `<div class="noprint"><div class="topbar"><button class="btn alt small" data-act="go" data-to="home">${backIcon} Zurück</button><h2>Papierblatt</h2><span></span></div>
      <div class="panel"><div class="grid2"><div><b>Übung</b>${seg(S.sheetType, "sheetType", [["M", "Mustermauer (4 Mauern)"], ["R", "Reihenpfad (6 Reihen)"]])}</div>
      <div><b>Stufe</b>${seg(S.sheetLevel, "sheetLevel", [[1, "Stufe 1"], [2, "Stufe 2"], [3, "Stufe 3"]])}</div></div>
      <div class="row wrap" style="margin-top:14px"><button class="btn" data-act="genSheet">Neues Blatt erzeugen</button>
      ${S.sheet ? `<button class="btn alt" data-act="print">Drucken</button><button class="btn alt" data-act="toggleSol">${S.showSol ? "Lösung ausblenden" : "Lösung anzeigen (Eltern)"}</button><button class="btn orange" data-act="checkSheet">Am Tablet prüfen</button>` : ""}</div>
      <div style="margin-top:14px"><b class="small">Adresse der App für den QR-Code</b><input class="txt" data-bind="baseUrl" value="${esc(S.baseUrl)}" placeholder="${esc(location.href.split("#")[0])}"><div class="small muted">Leer lassen = aktuelle Adresse. Für gedruckte Blätter später die öffentliche Adresse eintragen (z. B. GitHub Pages).</div></div>
      ${S.printNote ? `<p class="small muted">${esc(S.printNote)}</p>` : ""}</div>${S.sheet ? codeCardHtml(S.sheet) : ""}</div>
      ${S.sheet ? sheetHtml(S.sheet, S.showSol) : '<div class="noprint panel muted">Erzeuge ein Blatt: Du siehst es genau so, wie es gedruckt wird. Jedes Blatt hat einen Code, mit dem die Lösung später am Tablet geprüft wird.</div>'}`;
  }

  function codeHtml() {
    return `<div class="noprint"><div class="topbar"><button class="btn alt small" data-act="go" data-to="home">${backIcon} Zurück</button><h2>Blatt prüfen</h2><span></span></div>
      <div class="panel"><div class="row" style="align-items:flex-end">${otter("happy", stageOf(S.fish), 90)}<div style="flex:1"><p style="margin:0 0 8px">Tippe den Code vom Blatt ein (zum Beispiel <b>M2-K7P2Q</b>) oder scanne den QR-Code mit der Kamera.</p>
      <input class="txt" data-bind="code" value="${esc(S.codeInput)}" placeholder="Code vom Blatt" autocapitalize="characters" autocomplete="off" spellcheck="false"></div></div>
      ${S.codeError ? `<p style="color:#a55a12;font-weight:700">${esc(S.codeError)}</p>` : ""}
      <div style="margin-top:12px"><button class="btn orange" data-act="loadCode">Prüfen</button></div></div></div>`;
  }

  function checkHtml() {
    const sh = S.sheet, r = S.checkResult;
    const chips = r ? `<div class="resultchips">${r.map((x, i) => `<span class="rchip ${x}">Aufgabe ${i + 1}: ${x === "ok" ? "richtig" : x === "bad" ? "noch nicht ganz" : "offen"}</span>`).join("")}</div>` : "";
    return `<div class="noprint"><div class="topbar"><button class="btn alt small" data-act="go" data-to="home">${backIcon} Zurück</button><h2>Blatt ${esc(sh.code)}</h2><span class="chip">${fishIcon()} ${S.fish}</span></div>
      <div class="banner">Trage die Zahlen von deinem Papierblatt ein. Tippe ein leeres Feld an.</div>
      ${sh.tasks.map((t, i) => `<div class="panel"><div class="tasknum">Aufgabe ${i + 1}</div>${sh.type === "R" ? `<div class="small muted" style="margin-bottom:6px">${esc(t.text)}</div>` : ""}<div class="stage" style="box-shadow:none;padding:6px 0">${boardHtml(t, i)}</div></div>`).join("")}
      ${chips}<div class="coach">${otter(S.mood, stageOf(S.fish), 84)}<div class="bubble msg">${esc(S.msg)}</div></div>
      <div class="tools"><button class="btn orange" data-act="checkAll">Alles prüfen</button></div>${padHtml(true)}</div>`;
  }

  function pfadZeile(type) {
    const g = S.game[type], sel = S.eltSel[type] || g.station, last5 = g.results.slice(-5);
    const stars = last5.length ? last5.map((x) => `<span class="mini" title="${x.stars} von 3 Sternen${x.revealed ? ", Feld aufgedeckt" : ""}">${[1, 2, 3].map((k) => starIcon(k <= x.stars)).join("")}</span>`).join(" ") : '<span class="small muted">Noch keine Aufgaben</span>';
    return `<div class="rowp"><div><b>${GAME_NAME[type]}: Station ${Pfad.nummer(type, g.station)} von ${ZO.STATIONS[type].length}</b><div class="small muted">${esc(ZO.stationInfo(type, g.station).name)}</div><div class="stars sm" style="justify-content:flex-start;margin:6px 0 0">${stars}</div></div>
      <div class="festlegen"><select class="txt" data-bind="station-${type}" aria-label="Station festlegen für ${GAME_NAME[type]}">${ZO.STATIONS[type].map((x, k) => `<option value="${x.id}"${x.id === sel ? " selected" : ""}>Station ${k + 1}: ${esc(x.name)}</option>`).join("")}</select>
      <button class="btn alt small holdbtn" data-hold-act="stationSet" data-type="${type}" aria-label="Station festlegen, 2 Sekunden gedrückt halten"><span>Festlegen (2 s halten)</span></button></div></div>`;
  }
  function fehlerTabelle() {
    const rows = [];
    for (const type of ["M", "R"]) {
      const by = {};
      S.game[type].results.forEach((x) => { const b = (by[x.station] = by[x.station] || { n: 0, zehner: 0, knapp: 0, dreher: 0, andere: 0 }); b.n++; for (const k of ["zehner", "knapp", "dreher", "andere"]) b[k] += (x.errs && x.errs[k]) || 0; });
      ZO.STATIONS[type].forEach((st, k) => { const b = by[st.id]; if (b) rows.push(`<tr><td>${GAME_NAME[type]} ${k + 1}</td><td>${b.n}</td><td>${b.zehner}</td><td>${b.knapp}</td><td>${b.dreher}</td><td>${b.andere}</td></tr>`); });
    }
    if (!rows.length) return '<p class="small muted">Noch keine Aufgaben im neuen Pfad gelöst.</p>';
    return `<div style="overflow-x:auto"><table class="fe"><tr><th>Station</th><th>Aufgaben</th><th>Zehnerfehler</th><th>Knapp daneben</th><th>Zahlendreher</th><th>Andere</th></tr>${rows.join("")}</table></div>`;
  }
  function parentsHtml() {
    const e = S.stats.errors, totE = Object.values(e).reduce((a, b) => a + b, 0);
    const top = Object.entries(e).sort((a, b) => b[1] - a[1])[0];
    const tip = totE && top[1] ? (top[0] === "zehner" ? "Zehnerfehler häufen sich: Aufgaben mit Zehnerübergang in Ruhe üben, zum Beispiel in der Mustermauer die Stationen «Einmal über den Zehner rechnen» und «Über den Zehner rechnen». Hilfreich: erst die Zehner, dann die Einer rechnen." : top[0] === "dreher" ? "Zahlendreher: Zahlen beim Schreiben laut mitsprechen lassen." : top[0] === "knapp" ? "Knappe Fehler: Reihen mit dem Finger auf dem Zahlenstrahl abzählen." : "Gemischte Fehler: Aufgaben langsamer und mit Hilfe 2 (Rechenweg) bearbeiten.") : "Noch keine Fehler erfasst.";
    return `<div class="noprint"><div class="topbar"><button class="btn alt small" data-act="go" data-to="home">${backIcon} Zurück</button><h2>Eltern</h2><span></span></div>
      <div class="panel"><div class="grid2"><div class="stat"><b>${S.stats.solved.M}</b>Mauern gelöst</div><div class="stat"><b>${S.stats.solved.R}</b>Reihen gelöst</div><div class="stat"><b>${S.fish}</b>Fische gesammelt</div><div class="stat"><b>${S.stats.hints}</b>Hilfen genutzt</div></div></div>
      <div class="panel"><h3>Fehlerarten</h3><p class="muted small">Die App merkt sich, was schiefgeht, nicht nur ob. Daraus ergibt sich, was als Nächstes geübt werden sollte.</p>
      ${Object.keys(ERR_LABEL).map((k) => `<div class="row spread" style="padding:8px 0;border-bottom:1px solid var(--line)"><div><b>${ERR_LABEL[k][0]}</b><div class="small muted">${ERR_LABEL[k][1]}</div></div><b style="font-size:24px">${e[k]}</b></div>`).join("")}
      <p><b>Empfehlung:</b> ${esc(tip)}</p></div>
      <div class="panel"><h3>Pfad</h3><p class="muted small">Hier siehst du, wo dein Kind steht. Das Kind kann Stationen wiederholen; weiter geht es über die Regel (4 von 5 Aufgaben sicher) oder über dich.</p>
      ${["M", "R"].map(pfadZeile).join("")}${S.eltMsg ? `<p class="small" style="color:var(--teal-d);font-weight:700">${esc(S.eltMsg)}</p>` : ""}
      <h3 style="margin-top:16px">Fehlerarten je Station</h3>${fehlerTabelle()}</div>
      <div class="panel"><h3>Daten</h3><p class="small muted">Daten bleiben nur auf diesem Gerät (kein Konto, keine Übertragung).</p>
      ${S.confirmReset ? `<button class="btn orange small" data-act="reset2">Wirklich alles zurücksetzen</button> <button class="btn alt small" data-act="reset0">Abbrechen</button>` : `<button class="btn alt small" data-act="reset1">Fortschritt zurücksetzen</button>`}</div></div>`;
  }

  // ---------- Rendern ----------
  function render() {
    const y = window.scrollY;
    const map = { home: homeHtml, pfad: pfadHtml, play: playHtml, summary: summaryHtml, sheets: sheetsHtml, code: codeHtml, check: checkHtml, parents: parentsHtml };
    $app.innerHTML = map[S.screen]() + extrasHtml();
    window.scrollTo(0, y);
    if (S.copyFail) { const f = $app.querySelector("[data-copyfield]"); if (f) { f.focus(); f.select(); } }
  }

  // ---------- Aktionen ----------
  function blanksList() {
    const l = [];
    S.tasks.forEach((t, ti) => t.sol.forEach((_, i) => { if (!t.given[i] && t.st[i] !== "ok") l.push([ti, i]); }));
    return l;
  }
  function step(dir) {
    const l = blanksList();
    if (!l.length) return;
    let k = S.active ? l.findIndex(([a, b]) => a === S.active.t && b === S.active.i) : -1;
    k = k < 0 ? 0 : (k + dir + l.length) % l.length;
    S.active = { t: l[k][0], i: l[k][1] };
  }
  function newTask() {
    const se = S.session, type = se.type;
    // Übt das Kind nicht eine bestimmte Station, folgt die Einheit der aktuellen Station (auch nach einem Aufstieg).
    let station = se.practice ? se.station : S.game[type].station;
    if (se.easy) { station = P.leichtereStation(type, station); se.easy = false; }
    const info = ZO.stationInfo(type, station);
    const code = ZO.makeCode(type, info.level, station);
    const t = ZO.makeTask(type, info.level, code.split("-")[1], station);
    t.code = code;
    S.tasks = [t]; S.active = null; step(1); S.hintCell = null; S.overlay = null;
    S.mood = "happy";
    S.msg = ["Du schaffst das! Fang bei einem Feld an, das du kennst.", "Los geht’s! Tipp ein Feld an und gib die Zahl ein.", "Schau erst, wo du schon etwas ausrechnen kannst."][S.session.stars.length % 3];
  }
  function startSession(type, station) {
    const front = S.game[type].station;
    S.session = { type, total: 5, stars: [], station: station || front, practice: !!station && station !== front, easy: false, offered: false };
    S.offerDue = false; S.angebot = false;
    S.screen = "play";
    newTask();
  }
  function digit(d) {
    const a = S.active;
    if (!a) return;
    const t = S.tasks[a.t];
    if (t.st[a.i] === "ok" || t.given[a.i]) return;
    if (t.st[a.i] === "bad") { t.st[a.i] = ""; t.val[a.i] = ""; } // falsche Zahl wird ersetzt, nicht erweitert
    if (t.val[a.i] === "0") t.val[a.i] = d;
    else if (t.val[a.i].length < 3) t.val[a.i] += d;
    S.hintCell = null;
  }
  function backspace() {
    const a = S.active;
    if (!a) return;
    const t = S.tasks[a.t];
    if (t.st[a.i] === "ok") return;
    if (t.st[a.i] === "bad") { t.st[a.i] = ""; t.val[a.i] = ""; return; }
    t.val[a.i] = t.val[a.i].slice(0, -1);
  }
  const OKMSG = ["Das stimmt alles!", "Richtig, super gerechnet!", "Genau so geht das!"];
  function recordErrors(errs) { errs.forEach((k) => (S.stats.errors[k] = (S.stats.errors[k] || 0) + 1)); }
  function errMsg(errs) {
    let m = "Fast! Die orangen Felder stimmen noch nicht.";
    if (errs.includes("zehner")) m += " Schau bei den Zehnern nochmal genau hin.";
    else if (errs.includes("dreher")) m += " Prüfe die Reihenfolge der Ziffern.";
    else if (errs.includes("knapp")) m += " Ganz knapp daneben. Rechne nochmal nach.";
    return m;
  }
  function doCheck() {
    const t = S.tasks[0];
    const r = ZO.checkTask(t);
    if (r.status === "incomplete") { S.msg = "Fülle erst alle leeren Felder aus, dann prüfe ich."; S.mood = "think"; return; }
    recordErrors(r.errs);
    t.hintStage = 0; S.hintCell = null;
    if (r.status === "wrong") { S.msg = errMsg(r.errs); S.mood = "oops"; S.active = null; const b = blanksList().find(([, i]) => t.st[i] === "bad"); if (b) S.active = { t: b[0], i: b[1] }; save(); return; }
    // geloest
    const stars = ZO.starsOf(t), type = t.type;
    S.fish += stars; S.stats.solved[type]++; S.session.stars.push(stars);
    const g = S.game[type];
    const errs = {}; t.errLog.forEach((k) => (errs[k] = (errs[k] || 0) + 1));
    g.results.push({ day: P.heute(), stars, errs, revealed: t.revealed.length > 0, station: t.station });
    if (g.results.length > Store.MAX_RESULTS) g.results.splice(0, g.results.length - Store.MAX_RESULTS);
    const prevStage = stageOf(S.fish - stars), nowStage = stageOf(S.fish);
    let note = "";
    const wasDone = g.geschafft.includes(g.station);
    if (S.adaptive && !S.session.practice && t.station === g.station && !wasDone && P.aufstieg(g.results, g.station)) {
      g.geschafft.push(g.station);
      const nx = P.naechsteStation(type, g.station);
      if (nx) { g.station = nx; note = `Neue Station: ${ZO.stationInfo(type, nx).name}`; }
      else note = "Alle Stationen geschafft!";
    }
    S.offerDue = !S.session.offered && S.session.stars.length < S.session.total && P.angebotFaellig(S.session.stars);
    if (type === "R") t.showSteps.fill(true);
    S.mood = "cheer"; S.msg = OKMSG[stars - 1] || OKMSG[0]; S.active = null;
    S.overlay = { stars, rule: type === "R" && !t.announced ? t.rule : null, note, gift: nowStage > prevStage ? GIFTS[nowStage - 1] : "" };
    save();
  }
  function doHint() {
    const t = S.tasks[0];
    const r = ZO.applyHint(t);
    S.stats.hints++;
    S.msg = r.text; S.mood = "think";
    S.hintCell = r.cell != null ? { t: 0, i: r.cell } : null;
    if (t.hintStage === 0 && r.cell != null) { // Feld wurde aufgedeckt
      S.hintCell = null;
      if (ZO.blanksOf(t).every((i) => t.st[i] === "ok")) doCheck();
      else { S.active = null; step(1); }
    } else if (r.cell != null) S.active = { t: 0, i: r.cell };
    save();
  }
  function checkAll() {
    const sh = S.sheet, res = [];
    let allErrs = [], solvedAll = true;
    sh.tasks.forEach((t) => {
      const r = ZO.checkTask(t);
      allErrs = allErrs.concat(r.errs);
      res.push(r.status === "incomplete" ? "open" : r.status === "ok" ? "ok" : "bad");
    });
    recordErrors(allErrs);
    S.checkResult = res;
    solvedAll = res.every((x) => x === "ok");
    if (solvedAll) {
      if (!sh.awarded) {
        sh.awarded = true;
        const gain = sh.tasks.reduce((a, t) => a + ZO.starsOf(t), 0);
        S.fish += gain; sh.tasks.forEach(() => S.stats.solved[sh.type]++);
        S.msg = `Alles richtig! Plitsch bekommt ${gain} Fische.`;
      } else S.msg = "Alles richtig!";
      S.mood = "cheer";
    } else if (res.includes("bad")) { S.msg = errMsg(allErrs); S.mood = "oops"; }
    else { S.msg = "Einige Aufgaben sind noch offen. Trage alle Zahlen ein."; S.mood = "think"; }
    save();
  }
  function openCheck(code) {
    const sh = ZO.makeSheet(code);
    if (!sh) return false;
    S.sheet = sh; S.tasks = sh.tasks; S.checkResult = null; S.active = null; step(1);
    S.msg = "Tippe ein leeres Feld an und gib deine Zahl vom Papier ein."; S.mood = "happy";
    S.screen = "check";
    return true;
  }

  function act(a, d) {
    switch (a) {
      case "copy": doCopy(d.kind, d.text); break;
      case "copyClose": S.copyFail = ""; break;
      case "go": S.screen = d.to; S.overlay = null; S.angebot = false; S.offerDue = false; S.codeError = ""; S.confirmReset = false; S.eltMsg = ""; break;
      case "pfad": S.screen = "pfad"; S.pfadType = d.type; S.pfadMsg = ""; break;
      case "pfadStation": {
        const type = S.pfadType, g = S.game[type], st = Pfad.stationStatus(type, g, d.id);
        const hint = Pfad.tippHinweis(st);
        if (hint) { S.pfadMsg = hint; break; }
        startSession(type, d.id);
        break;
      }
      case "pfadWeiter": startSession(S.pfadType); break;
      case "stationSet": {
        const type = d.type, g = S.game[type], sel = S.eltSel[type] || g.station, idx = ZO.stationIndex(type, sel);
        if (idx < 0) break;
        g.station = sel;
        g.geschafft = g.geschafft.filter((id) => ZO.stationIndex(type, id) < idx);
        S.eltMsg = `${GAME_NAME[type]}: Station ${idx + 1} festgelegt (${ZO.stationInfo(type, sel).name}).`;
        save();
        break;
      }
      case "angebotEasy": S.angebot = false; S.session.easy = true; newTask(); break;
      case "angebotWeiter": S.angebot = false; newTask(); break;
      case "angebotPause": S.angebot = false; S.session = null; S.screen = "home"; break;
      case "adaptive": S.adaptive = !S.adaptive; save(); break;
      case "start": startSession(d.type); break;
      case "cell": S.active = { t: +d.t, i: +d.i }; break;
      case "key": digit(d.d); break;
      case "back": backspace(); break;
      case "next": step(1); break;
      case "prev": step(-1); break;
      case "hint": doHint(); break;
      case "check": doCheck(); break;
      case "continue":
        S.overlay = null;
        if (S.session.stars.length >= S.session.total) S.screen = "summary";
        else if (S.offerDue) { S.offerDue = false; S.session.offered = true; S.angebot = true; }
        else newTask();
        break;
      case "sheetType": S.sheetType = d.v; break;
      case "sheetLevel": S.sheetLevel = +d.v; break;
      case "genSheet": S.sheet = ZO.makeSheet(ZO.makeCode(S.sheetType, S.sheetLevel)); S.showSol = false; S.printNote = ""; break;
      case "toggleSol": S.showSol = !S.showSol; break;
      case "print":
        try { window.print(); S.printNote = ""; } catch (e) { S.printNote = "Drucken wird hier blockiert. Öffne die App direkt im Browser und drücke dort Drucken (A4, ohne Kopf-/Fusszeilen)."; }
        break;
      case "checkSheet": openCheck(S.sheet.code); break;
      case "loadCode":
        if (!openCheck(S.codeInput)) S.codeError = "Dieser Code ist nicht gültig. Er sieht so aus: M2-K7P2Q.";
        break;
      case "checkAll": checkAll(); break;
      case "reset1": S.confirmReset = true; break;
      case "reset0": S.confirmReset = false; break;
      case "reset2":
        S.fish = 0; S.game = { M: Store.emptyGame("M"), R: Store.emptyGame("R") };
        S.stats = Store.emptyStats(); S.eltSel = { M: "", R: "" };
        S.confirmReset = false; save(); break;
    }
    render();
  }

  $app.addEventListener("click", (e) => {
    const el = e.target.closest("[data-act]");
    if (el) act(el.dataset.act, el.dataset);
  });
  $app.addEventListener("change", (e) => {
    const b = e.target.dataset && e.target.dataset.bind;
    if (b === "station-M") S.eltSel.M = e.target.value;
    if (b === "station-R") S.eltSel.R = e.target.value;
  });
  // Knöpfe, die 2 Sekunden gehalten werden müssen (Schutz gegen Versehen, zum Beispiel auf der Elternseite)
  let holdTimer = null;
  function holdCancel() {
    if (holdTimer) { clearTimeout(holdTimer); holdTimer = null; }
    document.querySelectorAll(".holding").forEach((x) => x.classList.remove("holding"));
  }
  function holdStart(el) {
    holdCancel();
    el.classList.add("holding");
    holdTimer = setTimeout(() => { holdTimer = null; el.classList.remove("holding"); act(el.dataset.holdAct, el.dataset); }, 2000);
  }
  $app.addEventListener("pointerdown", (e) => { const el = e.target.closest("[data-hold-act]"); if (el) holdStart(el); });
  document.addEventListener("pointerup", holdCancel);
  document.addEventListener("pointercancel", holdCancel);
  $app.addEventListener("keydown", (e) => { const el = e.target.closest && e.target.closest("[data-hold-act]"); if (el && (e.key === "Enter" || e.key === " ") && !e.repeat) { e.preventDefault(); holdStart(el); } });
  $app.addEventListener("keyup", (e) => { if (e.key === "Enter" || e.key === " ") holdCancel(); });
  $app.addEventListener("input", (e) => {
    const b = e.target.dataset.bind;
    if (b === "code") S.codeInput = e.target.value;
    if (b === "baseUrl") { S.baseUrl = e.target.value.trim(); save(); }
  });
  document.addEventListener("keydown", (e) => {
    if (S.copyFail) { if (e.key === "Escape" || e.key === "Enter") { e.preventDefault(); act("copyClose", {}); } return; }
    if (e.target.tagName === "INPUT") { if (e.key === "Enter" && S.screen === "code") act("loadCode", {}); return; }
    if (S.screen !== "play" && S.screen !== "check") return;
    if (S.overlay) { if (e.key === "Enter") act("continue", {}); return; }
    if (/^[0-9]$/.test(e.key)) act("key", { d: e.key });
    else if (e.key === "Backspace") act("back", {});
    else if (e.key === "ArrowRight" || e.key === "Tab") { e.preventDefault(); act("next", {}); }
    else if (e.key === "ArrowLeft") act("prev", {});
    else if (e.key === "Enter") act(S.screen === "play" ? "check" : "checkAll", {});
  });
  function fromHash() {
    const h = decodeURIComponent(location.hash.replace(/^#/, ""));
    const c = ZO.parseCode(h);
    if (c && openCheck(c.code)) render();
  }
  window.addEventListener("hashchange", fromHash);

  load();
  window.__ZO_APP = { S, render, act };
  render();
  fromHash();
})();
