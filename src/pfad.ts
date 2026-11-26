/* Zahlenotter – Pfad: Zustand der Stationen und Lage auf dem Spielbrett (reine Logik, ohne Oberfläche). */
import type { StationInfo, TaskType } from "./logic";
import { STATIONS, stationIndex } from "./logic";
import type { GameProgress } from "./storage";

export type StationStatus = "done" | "vor" | "now" | "todo";

/** geschafft, aktuell, vorausgesetzt (liegt vor der aktuellen und ist nicht geschafft) oder noch nicht freigeschaltet */
export function stationStatus(type: TaskType, g: GameProgress, id: string): StationStatus {
  if (g.geschafft.includes(id)) return "done";
  if (id === g.station) return "now";
  return stationIndex(type, id) < stationIndex(type, g.station) ? "vor" : "todo";
}

const WORT: Record<StationStatus, string> = { done: "geschafft", vor: "vorausgesetzt", now: "aktuell", todo: "noch nicht freigeschaltet" };

/** Beschriftung für Screenreader und Tooltip, zum Beispiel «Station 3 von 9, Abziehen bis 50: geschafft» */
export function stationLabel(type: TaskType, id: string, status: StationStatus): string {
  const i = stationIndex(type, id);
  return `Station ${i + 1} von ${STATIONS[type].length}, ${STATIONS[type][i].name}: ${WORT[status]}`;
}

/** Stationen je Klasse (Stufe 1 bis 3), jede Klasse eine Zeile */
export function zeilen(type: TaskType): StationInfo[][] {
  return [1, 2, 3].map((k) => STATIONS[type].filter((s) => s.level === k));
}

/** Nummer der Station im Pfad, ab 1 */
export const nummer = (type: TaskType, id: string): number => stationIndex(type, id) + 1;

/** Waagrechte Lage der Plätze in Prozent der Brettbreite (höchstens 4 Stationen je Zeile) */
export const SLOT_X = [12, 37, 63, 88];
export const ZEILE_Y = [110, 280, 450];
export const BRETT_HOEHE = 560;

export interface Platz { id: string; x: number; y: number }
export function plaetze(type: TaskType): Platz[] {
  const out: Platz[] = [];
  zeilen(type).forEach((z, r) => z.forEach((s, k) => out.push({ id: s.id, x: SLOT_X[k], y: ZEILE_Y[r] })));
  return out;
}

/** Fluss als Pfad im Koordinatensystem 0 bis 100 (Breite) mal Brettthöhe in Pixeln */
export function flussPfad(type: TaskType): string {
  const rows = zeilen(type);
  const pos = plaetze(type);
  let d = "";
  let prev: Platz | null = null;
  rows.forEach((z) => {
    const first = pos.find((p) => p.id === z[0].id)!;
    const last = pos.find((p) => p.id === z[z.length - 1].id)!;
    d += prev
      ? ` C ${prev.x + 14} ${prev.y + 80}, ${first.x - 14} ${first.y - 80}, ${first.x} ${first.y}`
      : `M ${first.x} ${first.y}`;
    d += ` L ${last.x} ${last.y}`;
    prev = last;
  });
  return d;
}

/** Hinweis beim Tippen auf eine Station */
export function tippHinweis(status: StationStatus): string | null {
  return status === "todo" ? "Das kommt bald!" : null;
}
