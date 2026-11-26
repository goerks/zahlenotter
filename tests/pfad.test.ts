import { describe, it, expect } from "vitest";
import { stationStatus, stationLabel, zeilen, nummer, plaetze, flussPfad, tippHinweis, SLOT_X, ZEILE_Y } from "../src/pfad";
import { emptyGame } from "../src/storage";

describe("AK-4.1 Pfad: Zustand und Lage der Stationen", () => {
  it("Zeilen je Klasse: Mauer 2, 4, 3 Stationen, Reihe 3, 3, 4 (höchstens 4 je Zeile)", () => {
    expect(zeilen("M").map((z) => z.length)).toEqual([2, 4, 3]);
    expect(zeilen("R").map((z) => z.length)).toEqual([3, 3, 4]);
  });
  it("Zustand: geschafft, aktuell, vorausgesetzt (davor), noch nicht freigeschaltet (danach)", () => {
    const g = { ...emptyGame("M"), station: "2d", geschafft: ["2c"] };
    const s = (id: string) => stationStatus("M", g, id);
    expect(s("1a")).toBe("vor");
    expect(s("2b")).toBe("vor");
    expect(s("2c")).toBe("done");
    expect(s("2d")).toBe("now");
    expect(s("3a")).toBe("todo");
    expect(s("3c")).toBe("todo");
  });
  it("Genau eine Station ist aktuell", () => {
    for (const t of ["M", "R"] as const) {
      const g = { ...emptyGame(t), station: t === "M" ? "2b" : "3a" };
      const all = zeilen(t).flat().map((x) => stationStatus(t, g, x.id));
      expect(all.filter((x) => x === "now")).toHaveLength(1);
    }
  });
  it("Beschriftung nennt Nummer, Name und Zustand, nicht nur Farbe", () => {
    expect(stationLabel("M", "2b", "done")).toBe("Station 4 von 9, Abziehen bis 50: geschafft");
    expect(stationLabel("R", "3d", "todo")).toBe("Station 10 von 10, Wachsende Schritte: noch nicht freigeschaltet");
    expect(nummer("M", "1a")).toBe(1);
    expect(nummer("M", "3c")).toBe(9);
  });
  it("Plätze liegen innerhalb des Bretts und überlappen nicht", () => {
    for (const t of ["M", "R"] as const) {
      const p = plaetze(t);
      expect(p).toHaveLength(t === "M" ? 9 : 10);
      p.forEach((a) => { expect(a.x).toBeGreaterThan(0); expect(a.x).toBeLessThan(100); expect(ZEILE_Y).toContain(a.y); expect(SLOT_X).toContain(a.x); });
      const keys = p.map((a) => a.x + "/" + a.y);
      expect(new Set(keys).size).toBe(p.length);
    }
  });
  it("Fluss beginnt bei der ersten und endet bei der letzten Station", () => {
    const d = flussPfad("M");
    expect(d.startsWith(`M ${SLOT_X[0]} ${ZEILE_Y[0]}`)).toBe(true);
    expect(d.endsWith(`L ${SLOT_X[2]} ${ZEILE_Y[2]}`)).toBe(true);
    expect(flussPfad("R").endsWith(`L ${SLOT_X[3]} ${ZEILE_Y[2]}`)).toBe(true);
  });
  it("AK-4.2 Hinweis nur bei noch nicht freigeschalteten Stationen", () => {
    expect(tippHinweis("todo")).toBe("Das kommt bald!");
    expect(tippHinweis("done")).toBeNull();
    expect(tippHinweis("now")).toBeNull();
    expect(tippHinweis("vor")).toBeNull();
  });
});
