/* Zahlenotter – Regeln für das Weiterkommen im Pfad (reine Logik, ohne Oberfläche).
   Siehe Ticket 7 und docs/level-konzepte.md. */
import type { ErrorKind, TaskType } from "./logic";
import { STATIONS, stationIndex } from "./logic";

export interface Result {
  /** Tag (Tage seit 1970), 0 = unbekannt (aus altem Speicher übernommen) */
  day: number;
  stars: 1 | 2 | 3;
  /** gezählte Fehler je Fehlerart */
  errs: Partial<Record<ErrorKind, number>>;
  /** ein Feld wurde aufgedeckt (Hilfe 3) */
  revealed: boolean;
  station: string;
}

/** Mindestens so viele Aufgaben einer Station müssen gelöst sein, bevor es weitergehen kann. */
export const MIN_AUFGABEN = 5;
/** Es zählen die letzten so vielen Aufgaben der Station. */
export const FENSTER = 5;
/** So viele davon müssen sicher sein. */
export const SICHER_VON = 4;

/** Sicher: 2 oder 3 Sterne und kein Feld aufgedeckt (Entscheid von Michael, 26. November 2026). */
export const sicher = (r: Pick<Result, "stars" | "revealed">): boolean => r.stars >= 2 && !r.revealed;

/** Aufstieg: mindestens 5 Aufgaben der Station gelöst, und von den letzten 5 mindestens 4 sicher. */
export function aufstieg(results: Result[], station: string): boolean {
  const own = results.filter((r) => r.station === station);
  if (own.length < MIN_AUFGABEN) return false;
  return own.slice(-FENSTER).filter(sicher).length >= SICHER_VON;
}

/** Angebot («leichtere Aufgabe oder Pause»): die letzten zwei Aufgaben der Einheit hatten je 1 Stern. */
export function angebotFaellig(stars: number[]): boolean {
  return stars.length >= 2 && stars.slice(-2).every((s) => s === 1);
}

/** Die nächste Station nach `station`, oder null bei der letzten. */
export function naechsteStation(type: TaskType, station: string): string | null {
  const i = stationIndex(type, station);
  return i >= 0 && i < STATIONS[type].length - 1 ? STATIONS[type][i + 1].id : null;
}

/** Für «Leichtere Aufgabe»: die Station davor, bei der ersten Station dieselbe. */
export function leichtereStation(type: TaskType, station: string): string {
  const i = stationIndex(type, station);
  return i > 0 ? STATIONS[type][i - 1].id : station;
}

/** Tage seit 1970 (UTC), nur das Datum, keine Uhrzeit. */
export const heute = (now: number = Date.now()): number => Math.floor(now / 86400000);
