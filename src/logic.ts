/* Zahlenotter – Spiel-Logik (ohne Oberflaeche).
 Eine Aufgabe ist vollstaendig durch  Typ + Stufe + Seed  beschrieben.
 Typ: M = Zahlenmauer, R = Zahlenreihe.  Stufen 1-3 (Klasse 1-3). */
export type TaskType = "M" | "R";
export type Level = 1 | 2 | 3;
export type Rng = () => number;
export type ErrorKind = "zehner" | "knapp" | "dreher" | "andere";
export type CellState = "" | "given" | "ok" | "bad";
export type ReiheKind = "const" | "alt" | "grow";

export interface Task {
  type: TaskType;
  level: Level;
  seed: string;
  sol: number[];
  given: boolean[];
  val: string[];
  st: CellState[];
  errors: number;
  hintsUsed: number;
  hintStage: number;
  seen: Record<string, number>;
  errLog: ErrorKind[];
  solved: boolean;
  showSteps: boolean[] | null;
  revealed: number[];
  // Mauer
  n?: number;
  // Reihe
  diffs?: number[];
  kind?: ReiheKind;
  announced?: boolean;
  text?: string;
  rule?: string;
}
export interface Sheet { code: string; type: TaskType; level: Level; tasks: Task[]; }
export interface ParsedCode { type: TaskType; level: Level; seed: string; code: string; }
export interface Hint { cell: number; eq: string | null; kind?: "add" | "sub"; }
export interface HintResult { cell: number | null; text: string; }

// ---------- Zufall (deterministisch aus Text-Seed) ----------
export function xmur3(str: string): Rng {
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
export function mulberry32(a: number): Rng {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export const rngFrom = (s: string): Rng => mulberry32(xmur3(s)());
const ri = (r: Rng, a: number, b: number) => a + Math.floor(r() * (b - a + 1));
const pick = <T>(r: Rng, arr: T[]): T => arr[Math.floor(r() * arr.length)];
function shuffle<T>(r: Rng, arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ---------- Codes ----------
export const ALPHA = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export function newSeed(len?: number): string {
  let s = "";
  for (let i = 0; i < (len || 5); i++) s += ALPHA[Math.floor(Math.random() * ALPHA.length)];
  return s;
}
export const makeCode = (type: TaskType, level: Level): string => type + level + "-" + newSeed(5);
export function parseCode(raw: unknown): ParsedCode | null {
  const m = /^([MR])([1-3])-([A-HJ-NP-Z2-9]{5})$/.exec(String(raw || "").toUpperCase().replace(/\s+/g, ""));
  return m ? { type: m[1] as TaskType, level: +m[2] as Level, seed: m[3], code: m[0] } : null;
}

// ---------- Zahlenmauer ----------
export const mid = (r: number, i: number): number => (r * (r + 1)) / 2 + i; // Zeile r (0 = Spitze), Stein i
export function relations(n: number): [number, number, number][] {
  const rel: [number, number, number][] = [];
  for (let r = 0; r < n - 1; r++)
    for (let i = 0; i <= r; i++) rel.push([mid(r, i), mid(r + 1, i), mid(r + 1, i + 1)]);
  return rel; // [oben, unten-links, unten-rechts]: oben = links + rechts
}
export function propagate(n: number, known: (number | null)[]): boolean {
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
export const MAUER_CFG: Record<Level, { n: number; max: number; lo: number; hi: number; noCarry: boolean; needCarry: boolean; blanks: [number, number]; baseBlank: number }> = {
  1: { n: 3, max: 20, lo: 1, hi: 7, noCarry: false, needCarry: false, blanks: [2, 3], baseBlank: 0 },
  2: { n: 3, max: 100, lo: 3, hi: 40, noCarry: true, needCarry: false, blanks: [3, 4], baseBlank: 1 },
  3: { n: 4, max: 100, lo: 3, hi: 28, noCarry: false, needCarry: true, blanks: [5, 7], baseBlank: 2 },
};
function genMauer(rng: Rng, level: Level) {
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
    const blanks: number[] = [];
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
const fmtStep = (d: number) => (d < 0 ? "−" : "+") + Math.abs(d);
function genReihe(rng: Rng, level: Level) {
  const LEN = 8;
  for (let attempt = 0; attempt < 400; attempt++) {
    let kind: ReiheKind = "const", diffs: number[], announced: boolean, start: number, limit = 100;
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

    let anchors: number[];
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
export function makeTask(type: TaskType, level: Level, seed: string): Task {
  const rng = rngFrom(type + level + ":" + seed);
  const base: Partial<Task> & { sol: number[]; given: boolean[] } = type === "M" ? genMauer(rng, level) : genReihe(rng, level);
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
export const makeSheet = (code: string): Sheet | null => {
  const c = parseCode(code);
  if (!c) return null;
  const count = c.type === "M" ? 4 : 6;
  return { code: c.code, type: c.type, level: c.level, tasks: Array.from({ length: count }, (_, i) => makeTask(c.type, c.level, c.code + "/" + (i + 1))) };
};

// ---------- Pruefen ----------
export function classifyError(ans: number, sol: number): ErrorKind {
  const d = Math.abs(ans - sol);
  if (d !== 0 && d % 10 === 0) return "zehner";
  if (d === 1) return "knapp";
  if (String(ans).split("").reverse().join("") === String(sol) && ans !== sol) return "dreher";
  return "andere";
}
export const blanksOf = (t: Task): number[] => t.sol.map((_, i) => i).filter((i) => !t.given[i]);
export function checkTask(t: Task): { status: "incomplete" | "wrong" | "ok"; errs: ErrorKind[] } {
  const blanks = blanksOf(t);
  if (blanks.some((i) => t.st[i] !== "ok" && t.val[i] === "")) return { status: "incomplete", errs: [] };
  let bad = 0;
  const errs: ErrorKind[] = [];
  for (const i of blanks) {
    if (t.st[i] === "ok") continue;
    const v = Number(t.val[i]);
    if (v === t.sol[i]) t.st[i] = "ok";
    else {
      t.st[i] = "bad"; bad++;
      const key = i + ":" + v;
      if (!t.seen[key]) { t.seen[key] = 1; t.errors++; const k = classifyError(v, t.sol[i]); errs.push(k); t.errLog.push(k); }
    }
  }
  if (!bad) t.solved = true;
  return { status: bad ? "wrong" : "ok", errs };
}
export const starsOf = (t: Task): 1 | 2 | 3 => { const s = t.errors + t.hintsUsed; return s === 0 ? 3 : s <= 2 ? 2 : 1; };

// ---------- Hilfen ----------
const isKnown = (t: Task, i: number) => t.given[i] || t.st[i] === "ok";
function nextHint(t: Task): Hint | null {
  // liefert {cell, text}; text je nach Stufe wird in der Oberflaeche gewaehlt
  if (t.type === "M") {
    const rel = relations(t.n!);
    for (const [top, a, b] of rel) {
      const k = [top, a, b].map((i) => isKnown(t, i));
      if (k.filter(Boolean).length === 2) {
        const miss = [top, a, b][k.indexOf(false)];
        let eq;
        if (miss === top) eq = `${t.sol[a]} + ${t.sol[b]} = ?`;
        else if (miss === a) eq = `${t.sol[top]} − ${t.sol[b]} = ?`;
        else eq = `${t.sol[top]} − ${t.sol[a]} = ?`;
        return { cell: miss, eq, kind: miss === top ? "add" : "sub" };
      }
    }
    return null;
  }
  const i = t.sol.findIndex((_, j) => !isKnown(t, j));
  if (i < 0) return null;
  return { cell: i, eq: null };
}
export function applyHint(t: Task): HintResult {
  const h = nextHint(t);
  if (!h) return { text: "Du bist schon fertig – drücke Prüfen.", cell: null };
  t.hintStage = Math.min(3, t.hintStage + 1);
  if (t.hintStage === 1)
    return { cell: h.cell, text: t.type === "M" ? "Hier kannst du anfangen. Die orange Umrandung zeigt das Feld." : "Als Nächstes fehlt diese Zahl." };
  if (t.hintStage === 2) {
    t.hintsUsed += 1;
    if (t.type === "M") return { cell: h.cell, text: "Rechne: " + h.eq };
    let any = false;
    for (let k = 0; k < 7; k++) if (t.level === 1 || t.announced || (isKnown(t, k) && isKnown(t, k + 1))) { t.showSteps![k] = true; any = true; }
    return { cell: h.cell, text: any ? "Schau auf die Bögen: Sie zeigen den Schritt zwischen zwei Zahlen." : "Vergleiche die festen Zahlen: Um wie viel wird es jedes Mal mehr oder weniger?" };
  }
  // Stufe 3: aufdecken (Stufe 1 gratis, Stufe 2 und 3 kosten je einen Hilfe-Punkt)
  t.hintsUsed += 1;
  t.val[h.cell] = String(t.sol[h.cell]);
  t.st[h.cell] = "ok";
  t.revealed.push(h.cell);
  t.hintStage = 0;
  return { cell: h.cell, text: "Ich habe dir ein Feld verraten. Jetzt du!" };
}

// ---------- Anpassung der Stufe ----------
export function adapt(history: number[], level: Level): { level: Level; reset: boolean; dir: "up" | "down" | null } {
  const last3 = history.slice(-3), last2 = history.slice(-2);
  if (last3.length === 3 && last3.every((s) => s === 3) && level < 3) return { level: (level + 1) as Level, reset: true, dir: "up" };
  if (last2.length === 2 && last2.every((s) => s === 1) && level > 1) return { level: (level - 1) as Level, reset: true, dir: "down" };
  return { level, reset: false, dir: null };
}
