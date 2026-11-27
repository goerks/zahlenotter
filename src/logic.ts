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
  // Station im Pfad (zum Beispiel "2c") und Etiketten: welche Fähigkeiten die Aufgabe verlangt
  station: string;
  tags: string[];
  // Mauer
  n?: number;
  // Reihe
  diffs?: number[];
  kind?: ReiheKind;
  announced?: boolean;
  /** Reihe: Bögen auf Anfrage gratis (bis Station 2b) oder für 1 Hilfepunkt (ab 2c) */
  arcsFree?: boolean;
  /** Reihe: Bögen gerade eingeblendet bzw. schon bezahlt (in dieser Aufgabe nur einmal) */
  arcsOn?: boolean;
  arcsPaid?: boolean;
  /** Mauer: Rechnung auf Anfrage, die gerade gezeigt wird, und die Steine, für die sie schon bezahlt ist */
  eq?: EqHint | null;
  eqPaid?: number[];
  text?: string;
  rule?: string;
}
export interface Sheet { code: string; type: TaskType; level: Level; station: string; tasks: Task[]; }
export interface ParsedCode { type: TaskType; level: Level; station: string; seed: string; code: string; }
export interface Hint { cell: number; eq: string | null; kind?: "add" | "sub"; }
/** Rechnung an der Mauer: gesuchter Stein, Rechnung («21 + 20 = ?») und die zwei bekannten Steine */
export interface EqHint { cell: number; eq: string; known: number[]; }
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
// ---------- Stationen (der Pfad) ----------
// Jede Klasse (Stufe 1 bis 3) hat Stationen a, b, c ... Die mit «standard» entsprechen genau
// dem Verhalten der früheren Stufen: Aufgaben und Codes bleiben dieselben wie vorher.
export interface StationInfo { id: string; level: Level; name: string; standard: boolean }
const mk = (rows: [string, string, boolean?][]): StationInfo[] =>
  rows.map(([id, name, standard]) => ({ id, level: +id[0] as Level, name, standard: !!standard }));
export const STATIONS: Record<TaskType, StationInfo[]> = {
  M: mk([
    ["1a", "Zusammenzählen bis 10"],
    ["1b", "Zusammenzählen bis 20", true],
    ["2a", "Zehner und Einer bis 50"],
    ["2b", "Abziehen bis 50"],
    ["2c", "Abziehen bis 100", true],
    ["2d", "Einmal über den Zehner rechnen"],
    ["3a", "Über den Zehner rechnen"],
    ["3b", "Höhere Mauer mit 4 Reihen"],
    ["3c", "Abziehen auf zwei Ebenen", true],
  ]),
  R: mk([
    ["1a", "Vorwärts: +1 und +2"],
    ["1b", "Vorwärts: +5 und +10"],
    ["1c", "Schritte gemischt", true],
    ["2a", "Vorwärts und rückwärts"],
    ["2b", "Mehr Schrittgrössen"],
    ["2c", "Bögen für 1 Punkt", true],
    ["3a", "Grosse Schritte"],
    ["3b", "Regel entdecken"],
    ["3c", "Wechselnde Schritte"],
    ["3d", "Wachsende Schritte", true],
  ]),
};
export const stationInfo = (type: TaskType, id: string): StationInfo | undefined => STATIONS[type].find((s) => s.id === id);
export const standardStation = (type: TaskType, level: Level): StationInfo => STATIONS[type].find((s) => s.standard && s.level === level)!;
export const stationIndex = (type: TaskType, id: string): number => STATIONS[type].findIndex((s) => s.id === id);

export function makeCode(type: TaskType, level: Level, station?: string): string {
  const info = (station && stationInfo(type, station)) || standardStation(type, level);
  // Die Standard-Station behält das alte Format (M2-K7P2Q), die anderen tragen den Stationsbuchstaben (M2B-K7P2Q).
  return type + info.level + (info.standard ? "" : info.id[1].toUpperCase()) + "-" + newSeed(5);
}
export function parseCode(raw: unknown): ParsedCode | null {
  const m = /^([MR])([1-3])([A-D]?)-([A-HJ-NP-Z2-9]{5})$/.exec(String(raw || "").toUpperCase().replace(/\s+/g, ""));
  if (!m) return null;
  const type = m[1] as TaskType, level = +m[2] as Level;
  const info = m[3] ? stationInfo(type, m[2] + m[3].toLowerCase()) : standardStation(type, level);
  if (!info) return null;
  const code = type + level + (info.standard ? "" : info.id[1].toUpperCase()) + "-" + m[4];
  return { type, level, station: info.id, seed: m[4], code };
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
// Stellschrauben je Station. Zwischen zwei aufeinanderfolgenden Stationen ändert sich höchstens eine
// (Ausnahme: Klassenwechsel, dort wird der Zahlenraum grösser und der Zehnerübergang beginnt neu).
export type Uebergang = "egal" | "keine" | "einer" | "mind1";
export interface MauerDims { raum: 10 | 20 | 50 | 100; hoehe: 3 | 4; ueb: Uebergang; basis: 0 | 1 | 2 }
export const MAUER_DIMS: Record<string, MauerDims> = {
  "1a": { raum: 10, hoehe: 3, ueb: "egal", basis: 0 },
  "1b": { raum: 20, hoehe: 3, ueb: "egal", basis: 0 },
  "2a": { raum: 50, hoehe: 3, ueb: "keine", basis: 0 },
  "2b": { raum: 50, hoehe: 3, ueb: "keine", basis: 1 },
  "2c": { raum: 100, hoehe: 3, ueb: "keine", basis: 1 },
  "2d": { raum: 100, hoehe: 3, ueb: "einer", basis: 1 },
  "3a": { raum: 100, hoehe: 3, ueb: "mind1", basis: 1 },
  "3b": { raum: 100, hoehe: 4, ueb: "mind1", basis: 1 },
  "3c": { raum: 100, hoehe: 4, ueb: "mind1", basis: 2 },
};
export interface MauerCfg { n: number; max: number; lo: number; hi: number; ueb: Uebergang; blanks: [number, number]; baseBlank: number; baseExact: boolean }
export function mauerCfg(station: string): MauerCfg {
  const d = MAUER_DIMS[station];
  const std = STATIONS.M.find((s) => s.id === station)!.standard;
  const n = d.hoehe;
  const [lo, hi] = n === 4 ? [3, 28] : d.raum === 10 ? [1, 3] : d.raum === 20 ? [1, 7] : d.raum === 50 ? [3, 20] : [3, 40];
  const blanks: [number, number] = n === 4 ? [5, 7] : d.raum <= 20 ? [2, 3] : [3, 4];
  // Die Standard-Stationen zählen Basis-Lücken wie früher als Höchstwert, die neuen genau.
  return { n, max: d.raum, lo, hi, ueb: d.ueb, blanks, baseBlank: d.basis, baseExact: !std };
}
// Frühere Form der Konfiguration je Stufe (für Tests und Anzeige), abgeleitet von den Standard-Stationen.
const oldCfg = (c: MauerCfg) => ({ n: c.n, max: c.max, lo: c.lo, hi: c.hi, noCarry: c.ueb === "keine", needCarry: c.ueb === "mind1", blanks: c.blanks, baseBlank: c.baseBlank });
export const MAUER_CFG: Record<Level, { n: number; max: number; lo: number; hi: number; noCarry: boolean; needCarry: boolean; blanks: [number, number]; baseBlank: number }> = {
  1: oldCfg(mauerCfg("1b")),
  2: oldCfg(mauerCfg("2c")),
  3: oldCfg(mauerCfg("3c")),
};
function genMauer(rng: Rng, C: MauerCfg) {
  const n = C.n, total = (n * (n + 1)) / 2, baseStart = mid(n - 1, 0);
  const rel = relations(n);
  for (let attempt = 0; attempt < 400; attempt++) {
    const sol = new Array(total).fill(0);
    for (let i = 0; i < n; i++) sol[baseStart + i] = ri(rng, C.lo, C.hi);
    for (let r = n - 2; r >= 0; r--) for (let i = 0; i <= r; i++) sol[mid(r, i)] = sol[mid(r + 1, i)] + sol[mid(r + 1, i + 1)];
    if (sol[0] > C.max) continue;
    const carries = rel.map(([, a, b]) => (sol[a] % 10) + (sol[b] % 10) >= 10);
    const nCarry = carries.filter(Boolean).length;
    if (C.ueb === "keine" && nCarry > 0) continue;
    if (C.ueb === "mind1" && nCarry === 0) continue;
    if (C.ueb === "einer" && nCarry !== 1) continue;
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
    if (C.baseExact && baseBlanks !== C.baseBlank) continue;
    return { n, sol, given: sol.map((_, i) => !blanks.includes(i)) };
  }
  throw new Error("Mauer-Generator: keine Aufgabe gefunden");
}

// ---------- Zahlenreihe ----------
const fmtStep = (d: number) => (d < 0 ? "−" : "+") + Math.abs(d);
// Stellschrauben der Reihen-Stationen (nur zum Prüfen der Regel «eine Änderung je Station»;
// die Standard-Stationen erzeugt weiter der unveränderte Generator genReiheStandard).
export interface ReiheDims { schritte: string; richtung: "vor" | "beide"; regel: "genannt" | "entdecken"; boegen: "gratis" | "kostet"; art: "konstant" | "konstant+wechselnd" | "alle" }
export const REIHE_DIMS: Record<string, ReiheDims> = {
  "1a": { schritte: "1,2", richtung: "vor", regel: "genannt", boegen: "gratis", art: "konstant" },
  "1b": { schritte: "5,10", richtung: "vor", regel: "genannt", boegen: "gratis", art: "konstant" },
  "1c": { schritte: "1,2,5,10", richtung: "vor", regel: "genannt", boegen: "gratis", art: "konstant" },
  "2a": { schritte: "1,2,5,10", richtung: "beide", regel: "genannt", boegen: "gratis", art: "konstant" },
  "2b": { schritte: "2,3,4,5,10", richtung: "beide", regel: "genannt", boegen: "gratis", art: "konstant" },
  "2c": { schritte: "2,3,4,5,10", richtung: "beide", regel: "genannt", boegen: "kostet", art: "konstant" },
  "3a": { schritte: "3,4,6,7,8,9", richtung: "beide", regel: "genannt", boegen: "kostet", art: "konstant" },
  "3b": { schritte: "3,4,6,7,8,9", richtung: "beide", regel: "entdecken", boegen: "kostet", art: "konstant" },
  "3c": { schritte: "3,4,6,7,8,9", richtung: "beide", regel: "entdecken", boegen: "kostet", art: "konstant+wechselnd" },
  "3d": { schritte: "3,4,6,7,8,9", richtung: "beide", regel: "entdecken", boegen: "kostet", art: "alle" },
};
interface ReiheGen { steps: number[]; back: boolean; announced: boolean; arcsFree: boolean; kinds: ReiheKind[]; limit: (s: number) => number; max: number; anchors: number[][] }
const A1 = [[0, 1, 7], [0, 1, 4], [0, 1, 5]], A2 = [[0, 2, 5], [0, 1, 7], [1, 4, 7], [0, 3, 7]], A3 = [[0, 1, 7], [0, 2, 6], [1, 4, 7]];
const REIHE_GEN: Record<string, ReiheGen> = {
  "1a": { steps: [1, 2], back: false, announced: true, arcsFree: true, kinds: ["const"], limit: () => 20, max: 20, anchors: A1 },
  "1b": { steps: [5, 10], back: false, announced: true, arcsFree: true, kinds: ["const"], limit: (s) => (s === 5 ? 50 : 100), max: 100, anchors: A1 },
  "2a": { steps: [1, 2, 5, 10], back: true, announced: true, arcsFree: true, kinds: ["const"], limit: () => 100, max: 100, anchors: A2 },
  "2b": { steps: [2, 3, 4, 5, 10], back: true, announced: true, arcsFree: true, kinds: ["const"], limit: () => 100, max: 100, anchors: A2 },
  "3a": { steps: [3, 4, 6, 7, 8, 9], back: true, announced: true, arcsFree: false, kinds: ["const"], limit: () => 100, max: 100, anchors: A3 },
  "3b": { steps: [3, 4, 6, 7, 8, 9], back: true, announced: false, arcsFree: false, kinds: ["const"], limit: () => 100, max: 100, anchors: A3 },
  "3c": { steps: [3, 4, 6, 7, 8, 9], back: true, announced: false, arcsFree: false, kinds: ["const", "alt"], limit: () => 100, max: 100, anchors: A3 },
};
function genReiheStation(rng: Rng, station: string) {
  const C = REIHE_GEN[station];
  const LEN = 8;
  for (let attempt = 0; attempt < 400; attempt++) {
    const kind: ReiheKind = C.kinds.length > 1 ? pick(rng, C.kinds) : C.kinds[0];
    let diffs: number[], start: number, announced: boolean;
    if (kind === "const") {
      const s = pick(rng, C.steps);
      const back = C.back && rng() < 0.5;
      const lim = C.limit(s);
      diffs = new Array(LEN - 1).fill(back ? -s : s);
      start = back ? ri(rng, 7 * s, lim) : s >= 5 ? ri(rng, 0, Math.floor((lim - 7 * s) / s)) * s : ri(rng, 0, lim - 7 * s);
      announced = C.announced;
    } else {
      const p = pick(rng, [[1, 2], [2, 1], [2, 3], [3, 2], [5, 1], [1, 5], [10, 5], [5, 10], [5, -2], [3, -1]]);
      diffs = Array.from({ length: LEN - 1 }, (_, i) => p[i % 2]);
      start = ri(rng, 10, 40);
      announced = false;
    }
    const sol = [start];
    diffs.forEach((d) => sol.push(sol[sol.length - 1] + d));
    if (sol.some((v) => v < 0 || v > C.max)) continue;
    const anchors = kind === "alt" ? [0, 1, 2, 7] : pick(rng, C.anchors);
    const s0 = Math.abs(diffs[0]);
    const text = announced
      ? `Zähle ${diffs[0] < 0 ? "rückwärts" : "vorwärts"} in ${s0}er-Schritten.`
      : "Finde die Regel und setze die Reihe fort.";
    const rule = diffs.slice(0, 4).map(fmtStep).join(", ") + " …";
    return { sol, diffs, kind, announced, arcsFree: C.arcsFree, text, rule, given: sol.map((_, i) => anchors.includes(i)) };
  }
  throw new Error("Reihen-Generator: keine Aufgabe gefunden (" + station + ")");
}
function genReiheStandard(rng: Rng, level: Level) {
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
// Etiketten: welche Fähigkeiten verlangt die Aufgabe? Sie werden aus der Aufgabe berechnet, nicht gespeichert.
function tagsOfMauer(station: string, n: number, sol: number[], given: boolean[]): string[] {
  const tags: string[] = [];
  const known: (number | null)[] = sol.map((v, i) => (given[i] ? v : null));
  const rel = relations(n);
  let add = false, sub = false, changed = true;
  while (changed) {
    changed = false;
    for (const [t, a, b] of rel) {
      if (known[t] != null && known[a] != null && known[b] == null) { known[b] = sol[b]; sub = true; changed = true; }
      else if (known[t] != null && known[b] != null && known[a] == null) { known[a] = sol[a]; sub = true; changed = true; }
      else if (known[a] != null && known[b] != null && known[t] == null) { known[t] = sol[t]; add = true; changed = true; }
    }
  }
  if (add) tags.push("addieren");
  if (sub) tags.push("abziehen");
  const baseStart = mid(n - 1, 0);
  if (sol.some((_, i) => i >= baseStart && !given[i])) tags.push("abziehen-basis");
  if (rel.some(([t, a, b]) => (sol[a] % 10) + (sol[b] % 10) >= 10 && [t, a, b].some((i) => !given[i]))) tags.push("zehneruebergang");
  tags.push("zahlenraum-" + MAUER_DIMS[station].raum, "hoehe-" + n);
  return tags;
}
function tagsOfReihe(diffs: number[], kind: ReiheKind, announced: boolean, arcsFree: boolean): string[] {
  const tags = [diffs[0] < 0 ? "rueckwaerts" : "vorwaerts", kind === "const" ? "konstant" : kind === "alt" ? "wechselnd" : "wachsend"];
  if (kind === "const") tags.push("schritt-" + Math.abs(diffs[0]));
  tags.push(announced ? "regel-genannt" : "regel-entdecken");
  tags.push(arcsFree ? "bogen-gratis" : "bogen-kostet");
  return tags;
}

export function makeTask(type: TaskType, level: Level, seed: string, station?: string): Task {
  const info = (station && stationInfo(type, station)) || standardStation(type, level);
  const lvl = info.level;
  // Standard-Stationen behalten den alten Zufallsstart (alte Codes ergeben dieselbe Aufgabe wie früher).
  const rng = rngFrom(info.standard ? type + lvl + ":" + seed : type + info.id + ":" + seed);
  const base: Partial<Task> & { sol: number[]; given: boolean[] } =
    type === "M" ? genMauer(rng, mauerCfg(info.id)) : info.standard ? genReiheStandard(rng, lvl) : genReiheStation(rng, info.id);
  const total = base.sol.length;
  // Bögen sind nie von Anfang an sichtbar (Ticket 5); in Klasse 1 und bis Station 2b sind sie auf Anfrage gratis.
  const arcsFree = base.arcsFree ?? lvl === 1;
  const tags = type === "M"
    ? tagsOfMauer(info.id, base.n!, base.sol, base.given)
    : tagsOfReihe(base.diffs!, base.kind!, base.announced!, arcsFree);
  return Object.assign(base, {
    type, level: lvl, seed, station: info.id, tags,
    val: new Array(total).fill(""),
    st: base.given.map((g) => (g ? "given" : "")),
    errors: 0, hintsUsed: 0, hintStage: 0, seen: {}, errLog: [], solved: false,
    showSteps: type === "R" ? new Array(7).fill(false) : null,
    revealed: [],
    ...(type === "R" ? { arcsFree, arcsOn: false, arcsPaid: false } : { eq: null, eqPaid: [] }),
  }) as Task;
}
export const makeSheet = (code: string): Sheet | null => {
  const c = parseCode(code);
  if (!c) return null;
  const count = c.type === "M" ? 4 : 6;
  return { code: c.code, type: c.type, level: c.level, station: c.station, tasks: Array.from({ length: count }, (_, i) => makeTask(c.type, c.level, c.code + "/" + (i + 1), c.station)) };
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
  clearEq(t);
  return { status: bad ? "wrong" : "ok", errs };
}
export const starsOf = (t: Task): 1 | 2 | 3 => { const s = t.errors + t.hintsUsed; return s === 0 ? 3 : s <= 2 ? 2 : 1; };

// ---------- Hilfen ----------
const isKnown = (t: Task, i: number) => t.given[i] || t.st[i] === "ok";
/** Rechnung für den Stein `cell`, wenn er der einzige unbekannte Stein einer Dreiergruppe ist */
function eqFor(t: Task, cell: number): EqHint | null {
  for (const [top, a, b] of relations(t.n!)) {
    const grp = [top, a, b];
    if (!grp.includes(cell) || isKnown(t, cell)) continue;
    if (!grp.every((i) => i === cell || isKnown(t, i))) continue;
    const eq = cell === top ? `${t.sol[a]} + ${t.sol[b]} = ?` : `${t.sol[top]} − ${t.sol[cell === a ? b : a]} = ?`;
    return { cell, eq, known: grp.filter((i) => i !== cell) };
  }
  return null;
}
function nextHint(t: Task): Hint | null {
  if (t.type === "M") {
    for (const [top, a, b] of relations(t.n!)) {
      const k = [top, a, b].map((i) => isKnown(t, i));
      if (k.filter(Boolean).length === 2) {
        const miss = [top, a, b][k.indexOf(false)];
        return { cell: miss, eq: eqFor(t, miss)!.eq, kind: miss === top ? "add" : "sub" };
      }
    }
    return null;
  }
  const i = t.sol.findIndex((_, j) => !isKnown(t, j));
  if (i < 0) return null;
  return { cell: i, eq: null };
}

/** Hilfe-Knopf (Ticket 5): 1. Feld markieren (gratis), 2. Feld aufdecken (1 Hilfepunkt). Bögen und Rechnung haben eigene Knöpfe. */
export function applyHint(t: Task): HintResult {
  const h = nextHint(t);
  if (!h) return { text: "Du bist schon fertig – drücke Prüfen.", cell: null };
  if (t.hintStage === 0) {
    t.hintStage = 1;
    return { cell: h.cell, text: (t.type === "M" ? "Hier kannst du anfangen. Die orange Umrandung zeigt das Feld." : "Als Nächstes fehlt diese Zahl.") + " Drückst du nochmals «Hilfe», verrate ich die Zahl." };
  }
  t.hintsUsed += 1;
  t.val[h.cell] = String(t.sol[h.cell]);
  t.st[h.cell] = "ok";
  t.revealed.push(h.cell);
  t.hintStage = 0;
  clearEq(t);
  return { cell: h.cell, text: "Ich habe dir ein Feld verraten. Jetzt du!" };
}

// Reihe: Bögen auf Anfrage
/** Darf der Bogen k (zwischen Zahl k und k+1) gezeigt werden? Bei verdeckter Regel nur zwischen zwei bekannten Zahlen. */
export const arcAllowed = (t: Task, k: number): boolean => t.level === 1 || !!t.announced || (isKnown(t, k) && isKnown(t, k + 1));
/** Ist der Bogen k zu sehen? Nach dem Lösen alle (showSteps), sonst nur auf Anfrage. */
export const arcVisible = (t: Task, k: number): boolean => !!t.showSteps?.[k] || (!!t.arcsOn && arcAllowed(t, k));
/** Was kostet «Bögen zeigen» jetzt? 0 bis Station 2b oder wenn in dieser Aufgabe schon bezahlt, sonst 1 */
export const arcsCost = (t: Task): 0 | 1 => (t.arcsFree || t.arcsPaid ? 0 : 1);
export function toggleArcs(t: Task): { on: boolean; cost: 0 | 1; text: string } {
  if (t.arcsOn) {
    t.arcsOn = false;
    return { on: false, cost: 0, text: "Die Bögen sind weg. Du kannst sie wieder zeigen, wenn du willst." };
  }
  const cost = arcsCost(t);
  if (cost) { t.hintsUsed += 1; t.arcsPaid = true; }
  t.arcsOn = true;
  const any = Array.from({ length: t.sol.length - 1 }, (_, k) => arcAllowed(t, k)).some(Boolean);
  return { on: true, cost, text: any ? "Die Bögen zeigen den Schritt zwischen zwei Zahlen." : "Bögen erscheinen zwischen zwei Zahlen, die du schon kennst." };
}

// Mauer: Rechnung auf Anfrage
/** Für welchen Stein gilt die Rechnung? Der gewählte Stein, wenn er sich schon ausrechnen lässt, sonst der nächste mögliche. */
export function eqTarget(t: Task, prefer?: number | null): EqHint | null {
  if (t.type !== "M") return null;
  if (prefer != null) { const e = eqFor(t, prefer); if (e) return e; }
  const h = nextHint(t);
  return h ? eqFor(t, h.cell) : null;
}
/** Was kostet «Rechnung zeigen» für diesen Stein? 1 Hilfepunkt, für einen schon bezahlten Stein 0 */
export const eqCost = (t: Task, cell: number): 0 | 1 => (t.eqPaid?.includes(cell) ? 0 : 1);
export function showEquation(t: Task, prefer?: number | null): { eq: EqHint | null; cost: 0 | 1; text: string } {
  const e = eqTarget(t, prefer);
  if (!e) return { eq: null, cost: 0, text: "Du bist schon fertig – drücke Prüfen." };
  const cost = eqCost(t, e.cell);
  if (cost) { t.hintsUsed += 1; t.eqPaid = [...(t.eqPaid || []), e.cell]; }
  t.eq = e;
  return { eq: e, cost, text: "Rechne die Rechnung über der Mauer. Die hellen Steine gehören dazu." };
}
export const hideEquation = (t: Task): void => { t.eq = null; };
/** Ist der gesuchte Stein gelöst, verschwindet die Rechnung. */
function clearEq(t: Task): void { if (t.eq && isKnown(t, t.eq.cell)) t.eq = null; }

// ---------- Anpassung der Stufe ----------
export function adapt(history: number[], level: Level): { level: Level; reset: boolean; dir: "up" | "down" | null } {
  const last3 = history.slice(-3), last2 = history.slice(-2);
  if (last3.length === 3 && last3.every((s) => s === 3) && level < 3) return { level: (level + 1) as Level, reset: true, dir: "up" };
  if (last2.length === 2 && last2.every((s) => s === 1) && level > 1) return { level: (level - 1) as Level, reset: true, dir: "down" };
  return { level, reset: false, dir: null };
}
