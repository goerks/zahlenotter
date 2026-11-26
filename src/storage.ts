/* Zahlenotter – lokaler Speicher (Version 2) mit Migration aus dem alten Format.
   Alles bleibt nur auf dem Gerät. Der alte Schlüssel (v1) wird nie verändert oder gelöscht. */
import type { ErrorKind, Level, TaskType } from "./logic";
import { STATIONS, standardStation, stationIndex } from "./logic";
import type { Result } from "./progress";

export const KEY_V2 = "zahlenotter.v2";
export const KEY_V1 = "zahlenotter.proto.v1";
export const MAX_RESULTS = 200;

export interface GameProgress {
  /** Die aktuelle (vorderste) Station */
  station: string;
  /** Stationen, die das Kind geschafft hat */
  geschafft: string[];
  results: Result[];
}
export interface Stats {
  solved: { M: number; R: number };
  errors: Record<ErrorKind, number>;
  hints: number;
}
export interface State {
  version: 2;
  /** Automatisch weiterkommen (4 von 5 sicher). Aus: nur die Eltern legen die Station fest. */
  adaptive: boolean;
  fish: number;
  stats: Stats;
  baseUrl: string;
  M: GameProgress;
  R: GameProgress;
}
export interface StorageLike { getItem(key: string): string | null; setItem(key: string, value: string): void }

const KINDS: ErrorKind[] = ["zehner", "knapp", "dreher", "andere"];
const num = (v: unknown, d = 0): number => (typeof v === "number" && Number.isFinite(v) && v >= 0 ? Math.floor(v) : d);
const isObj = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);

export const emptyStats = (): Stats => ({ solved: { M: 0, R: 0 }, errors: { zehner: 0, knapp: 0, dreher: 0, andere: 0 }, hints: 0 });
export const emptyGame = (type: TaskType): GameProgress => ({ station: STATIONS[type][0].id, geschafft: [], results: [] });
export const emptyState = (): State => ({ version: 2, adaptive: true, fish: 0, stats: emptyStats(), baseUrl: "", M: emptyGame("M"), R: emptyGame("R") });

function cleanStats(raw: unknown): Stats {
  const s = emptyStats();
  if (!isObj(raw)) return s;
  if (isObj(raw.solved)) { s.solved.M = num(raw.solved.M); s.solved.R = num(raw.solved.R); }
  if (isObj(raw.errors)) for (const k of KINDS) s.errors[k] = num(raw.errors[k]);
  s.hints = num(raw.hints);
  return s;
}
function cleanResult(raw: unknown, type: TaskType): Result | null {
  if (!isObj(raw)) return null;
  const stars = raw.stars;
  if (stars !== 1 && stars !== 2 && stars !== 3) return null;
  if (typeof raw.station !== "string" || stationIndex(type, raw.station) < 0) return null;
  const errs: Result["errs"] = {};
  if (isObj(raw.errs)) for (const k of KINDS) { const n = num(raw.errs[k]); if (n) errs[k] = n; }
  return { day: num(raw.day), stars, errs, revealed: raw.revealed === true, station: raw.station };
}
function cleanGame(raw: unknown, type: TaskType): GameProgress {
  const g = emptyGame(type);
  if (!isObj(raw)) return g;
  const ids = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string" && stationIndex(type, x) >= 0) : []);
  if (typeof raw.station === "string" && stationIndex(type, raw.station) >= 0) g.station = raw.station;
  g.geschafft = ids(raw.geschafft);
  g.results = (Array.isArray(raw.results) ? raw.results : []).map((r) => cleanResult(r, type)).filter((r): r is Result => r !== null).slice(-MAX_RESULTS);
  return g;
}

/** Prüft und bereinigt gespeicherte Daten der Version 2. Gibt null zurück, wenn es keine sind. */
export function validateV2(raw: unknown): State | null {
  if (!isObj(raw) || raw.version !== 2) return null;
  return {
    version: 2,
    adaptive: raw.adaptive !== false,
    fish: num(raw.fish),
    stats: cleanStats(raw.stats),
    baseUrl: typeof raw.baseUrl === "string" ? raw.baseUrl : "",
    M: cleanGame(raw.M, "M"),
    R: cleanGame(raw.R, "R"),
  };
}

/** Wandelt den alten Speicher (Version 1) in Version 2 um. Nichts geht verloren: Fische, Statistik,
    Einstellungen und der Verlauf bleiben, die Stufe wird zur Standard-Station. */
export function migrateV1(raw: unknown): State {
  const st = emptyState();
  if (!isObj(raw)) return st;
  st.adaptive = raw.adaptive !== false;
  st.fish = num(raw.fish);
  st.stats = cleanStats(raw.stats);
  st.baseUrl = typeof raw.baseUrl === "string" ? raw.baseUrl : "";
  const levels = isObj(raw.levels) ? raw.levels : {};
  const hist = isObj(raw.hist) ? raw.hist : {};
  for (const type of ["M", "R"] as TaskType[]) {
    const lv = num(levels[type], 1);
    const level = (lv >= 1 && lv <= 3 ? lv : 1) as Level;
    const station = isObj(raw.levels) && levels[type] !== undefined ? standardStation(type, level).id : STATIONS[type][0].id;
    const g = st[type];
    g.station = station;
    const h = Array.isArray(hist[type]) ? (hist[type] as unknown[]) : [];
    g.results = h
      .filter((s): s is 1 | 2 | 3 => s === 1 || s === 2 || s === 3)
      .slice(-5)
      .map((stars) => ({ day: 0, stars, errs: {}, revealed: false, station }));
  }
  return st;
}

const storageOrNull = (): StorageLike | null => {
  try { return typeof localStorage !== "undefined" ? localStorage : null; } catch { return null; }
};

/** Lädt den Stand: Version 2, sonst Version 1 mit Migration, sonst leer. Wirft nie. */
export function load(storage: StorageLike | null = storageOrNull()): State {
  if (!storage) return emptyState();
  try {
    const v2 = storage.getItem(KEY_V2);
    if (v2) {
      const ok = validateV2(JSON.parse(v2));
      if (ok) return ok;
    }
  } catch { /* defekte Daten: weiter mit dem alten Stand */ }
  try {
    const v1 = storage.getItem(KEY_V1);
    if (v1) return migrateV1(JSON.parse(v1));
  } catch { /* defekt oder nicht lesbar */ }
  return emptyState();
}

/** Speichert Version 2. Der alte Schlüssel bleibt unverändert. Wirft nie. */
export function save(state: State, storage: StorageLike | null = storageOrNull()): boolean {
  if (!storage) return false;
  try {
    const trimmed: State = { ...state, M: { ...state.M, results: state.M.results.slice(-MAX_RESULTS) }, R: { ...state.R, results: state.R.results.slice(-MAX_RESULTS) } };
    storage.setItem(KEY_V2, JSON.stringify(trimmed));
    return true;
  } catch { return false; }
}
