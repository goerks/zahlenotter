/* Zahlenotter – Spiel-Logik (ohne Oberflaeche).
   Eine Aufgabe ist vollstaendig durch  Typ + Stufe + Seed  beschrieben.
   Typ: M = Zahlenmauer, R = Zahlenreihe.  Stufen 1-3 (Klasse 1-3). */
const ZO = (function () {
  // ---------- Zufall (deterministisch aus Text-Seed) ----------
  function xmur3(str) {
    let h = 1779033703 ^ str.length;
    for (let i = 0; i < str.length; i++) {
      h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
      h = (h << 13) | (h >>> 19);
    }
    return function () {
      h = Math.imul(h ^ (h >>> 16), 2246822507);
      h = Math.imul(h ^ (h >>> 13), 3266489909);
      return (h ^= h >>> 16) >>> 0;
    };
  }
  function mulberry32(a) {
    return function () {
      a |= 0;
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const rngFrom = (s) => mulberry32(xmur3(s)());
  const ri = (r, a, b) => a + Math.floor(r() * (b - a + 1));
  const pick = (r, arr) => arr[Math.floor(r() * arr.length)];
  function shuffle(r, arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(r() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  // ---------- Codes ----------
  const ALPHA = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  function newSeed(len) {
    let s = "";
    for (let i = 0; i < (len || 5); i++) s += ALPHA[Math.floor(Math.random() * ALPHA.length)];
    return s;
  }
  const makeCode = (type, level) => type + level + "-" + newSeed(5);
  function parseCode(raw) {
    const m = /^([MR])([1-3])-([A-HJ-NP-Z2-9]{5})$/.exec(String(raw || "").toUpperCase().replace(/\s+/g, ""));
    return m ? { type: m[1], level: +m[2], seed: m[3], code: m[0] } : null;
  }

  // ---------- Zahlenmauer ----------
  const mid = (r, i) => (r * (r + 1)) / 2 + i; // Zeile r (0 = Spitze), Stein i
  function relations(n) {
    const rel = [];
    for (let r = 0; r < n - 1; r++)
      for (let i = 0; i <= r; i++) rel.push([mid(r, i), mid(r + 1, i), mid(r + 1, i + 1)]);
    return rel; // [oben, unten-links, unten-rechts]: oben = links + rechts
  }
  function propagate(n, known) {
    const rel = relations(n);
    let changed = true;
    while (changed) {
      changed = false;
      for (const [t, a, b] of rel) {
        if (known[t] != null && known[a] != null && known[b] == null) { known[b] = known[t] - known[a]; changed = true; }
        else if (known[t] != null && known[b] != null && known[a] == null) { known[a] = known[t] - known[b]; changed = true; }
        else if (known[a] != null && known[b] != null && known[t] == null) { known[t] = known[a] + known[b]; changed = true; }
      }
    }
    return known.every((v) => v != null);
  }
  const MAUER_CFG = {
    1: { n: 3, max: 20, lo: 1, hi: 7, noCarry: false, needCarry: false, blanks: [2, 3], baseBlank: 0 },
    2: { n: 3, max: 100, lo: 3, hi: 40, noCarry: true, needCarry: false, blanks: [3, 4], baseBlank: 1 },
    3: { n: 4, max: 100, lo: 3, hi: 28, noCarry: false, needCarry: true, blanks: [5, 7], baseBlank: 2 },
  };
  function genMauer(rng, level) {
    const C = MAUER_CFG[level];
    const n = C.n, total = (n * (n + 1)) / 2, baseStart = mid(n - 1, 0);
    const rel = relations(n);
    for (let attempt = 0; attempt < 400; attempt++) {
      const sol = new Array(total).fill(0);
      for (let i = 0; i < n; i++) sol[baseStart + i] = ri(rng, C.lo, C.hi);
      for (let r = n - 2; r >= 0; r--) for (let i = 0; i <= r; i++) sol[mid(r, i)] = sol[mid(r + 1, i)] + sol[mid(r + 1, i + 1)];
      if (sol[0] > C.max) continue;
      const carries = rel.map(([, a, b]) => (sol[a] % 10) + (sol[b] % 10) >= 10);
      if (C.noCarry && carries.some(Boolean)) continue;
      if (C.needCarry && !carries.some(Boolean)) continue;
      const target = ri(rng, C.blanks[0], C.blanks[1]);
      const blanks = [];
      let baseBlanks = 0;
      for (const id of shuffle(rng, [...Array(total).keys()])) {
        if (blanks.length >= target) break;
        const isBase = id >= baseStart;
        if (isBase && baseBlanks >= C.baseBlank) continue;
        const bl = blanks.concat(id);
        const known = sol.map((v, i) => (bl.includes(i) ? null : v));
        if (propagate(n, known)) { blanks.push(id); if (isBase) baseBlanks++; }
      }
      if (blanks.length < C.blanks[0]) continue;
      return { n, sol, given: sol.map((_, i) => !blanks.includes(i)) };
    }
    throw new Error("Mauer-Generator: keine Aufgabe gefunden");
  }

  // ---------- Zahlenreihe ----------
  const fmtStep = (d) => (d < 0 ? "−" : "+") + Math.abs(d);
  function genReihe(rng, level) {
    const LEN = 8;
    for (let attempt = 0; attempt < 400; attempt++) {
      let kind = "const", diffs, announced, start, limit = 100;
      if (level === 1) {
        const s = pick(rng, [1, 2, 5, 10]);
        limit = s < 5 ? 20 : s === 5 ? 50 : 100;
        diffs = new Array(LEN - 1).fill(s);
        start = s < 5 ? ri(rng, 0, limit - 7 * s) : ri(rng, 0, Math.floor((limit - 7 * s) / s)) * s;
        announced = true;
      } else if (level === 2) {
        const s = pick(rng, [2, 3, 4, 5, 10]);
        const back = rng() < 0.5;
        diffs = new Array(LEN - 1).fill(back ? -s : s);
        start = back ? ri(rng, 7 * s, 100) : ri(rng, 0, 100 - 7 * s);
        announced = true;
      } else {
        kind = pick(rng, ["const", "alt", "grow", "const"]);
        if (kind === "const") {
          const s = pick(rng, [3, 4, 6, 7, 8, 9]);
          const back = rng() < 0.5;
          diffs = new Array(LEN - 1).fill(back ? -s : s);
          start = back ? ri(rng, 7 * s, 100) : ri(rng, 0, 100 - 7 * s);
          announced = rng() < 0.4;
        } else if (kind === "alt") {
          const p = pick(rng, [[1, 2], [2, 1], [2, 3], [3, 2], [5, 1], [1, 5], [10, 5], [5, 10], [5, -2], [3, -1]]);
          diffs = Array.from({ length: LEN - 1 }, (_, i) => p[i % 2]);
          start = ri(rng, 10, 40);
          announced = false;
        } else {
          const d0 = pick(rng, [1, 2, 3]), inc = pick(rng, [1, 1, 2]);
          const back = rng() < 0.25;
          diffs = Array.from({ length: LEN - 1 }, (_, i) => (back ? -1 : 1) * (d0 + inc * i));
          const sum = diffs.reduce((a, b) => a + b, 0);
          start = back ? ri(rng, -sum, 100) : ri(rng, 0, 100 - sum);
          announced = false;
        }
      }
      const sol = [start];
      diffs.forEach((d) => sol.push(sol[sol.length - 1] + d));
      if (sol.some((v) => v < 0 || v > (level === 1 ? limit : 100))) continue;

      let anchors;
      if (kind === "alt") anchors = [0, 1, 2, 7];
      else if (kind === "grow") anchors = [0, 1, 2, 3];
      else if (level === 1) anchors = pick(rng, [[0, 1, 7], [0, 1, 4], [0, 1, 5]]);
      else if (level === 2) anchors = pick(rng, [[0, 2, 5], [0, 1, 7], [1, 4, 7], [0, 3, 7]]);
      else anchors = pick(rng, [[0, 1, 7], [0, 2, 6], [1, 4, 7]]);

      const s0 = Math.abs(diffs[0]);
      const text = announced
        ? `Zähle ${diffs[0] < 0 ? "rückwärts" : "vorwärts"} in ${s0}er-Schritten.`
        : "Finde die Regel und setze die Reihe fort.";
      const rule = diffs.slice(0, 4).map(fmtStep).join(", ") + " …";
      return { sol, diffs, kind, announced, text, rule, given: sol.map((_, i) => anchors.includes(i)) };
    }
    throw new Error("Reihen-Generator: keine Aufgabe gefunden");
  }

  // ---------- Aufgabe ----------
  function makeTask(type, level, seed) {
    const rng = rngFrom(type + level + ":" + seed);
    const base = type === "M" ? genMauer(rng, level) : genReihe(rng, level);
    const total = base.sol.length;
    return Object.assign(base, {
      type, level, seed,
      val: new Array(total).fill(""),
      st: base.given.map((g) => (g ? "given" : "")),
      errors: 0, hintsUsed: 0, hintStage: 0, seen: {}, errLog: [], solved: false,
      showSteps: type === "R" ? new Array(7).fill(level === 1) : null,
      revealed: [],
    });
  }

  return { makeTask, rngFrom };
})();
if (typeof module !== "undefined") module.exports = ZO;
