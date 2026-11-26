import { describe, it, expect } from "vitest";
import { aufstieg, sicher, angebotFaellig, naechsteStation, leichtereStation, heute, type Result } from "../src/progress";

const r = (stars: 1 | 2 | 3, o: Partial<Result> = {}): Result => ({ day: 1, stars, errs: {}, revealed: false, station: "2c", ...o });
const reihe = (...s: (1 | 2 | 3)[]) => s.map((x) => r(x));

describe("AK-3.1 Aufstieg: 4 von den letzten 5 sicher, mindestens 5 gelöst", () => {
  it("weniger als 5 Aufgaben: nie, auch wenn alle makellos sind", () => {
    expect(aufstieg(reihe(3), "2c")).toBe(false);
    expect(aufstieg(reihe(3, 3, 3, 3), "2c")).toBe(false);
  });
  it("5 Aufgaben mit 4 sicheren: Aufstieg", () => {
    expect(aufstieg(reihe(3, 3, 3, 3, 3), "2c")).toBe(true);
    expect(aufstieg(reihe(1, 3, 2, 3, 3), "2c")).toBe(true);
    expect(aufstieg(reihe(3, 3, 3, 3, 1), "2c")).toBe(true);
  });
  it("5 Aufgaben mit nur 3 sicheren: kein Aufstieg", () => {
    expect(aufstieg(reihe(3, 1, 2, 1, 3), "2c")).toBe(false);
    expect(aufstieg(reihe(1, 1, 3, 3, 3), "2c")).toBe(false);
  });
  it("AK-3.1 ein einzelner Zehnerfehler (2 Sterne) verhindert den Aufstieg nicht", () => {
    expect(aufstieg([r(3), r(3), r(2, { errs: { zehner: 1 } }), r(3), r(3)], "2c")).toBe(true);
  });
  it("es zählen nur die letzten 5: ältere Aufgaben fallen heraus", () => {
    expect(aufstieg(reihe(1, 1, 1, 3, 3, 3, 3, 3), "2c")).toBe(true);
    expect(aufstieg(reihe(3, 3, 3, 3, 3, 1, 1), "2c")).toBe(false);
  });
  it("es zählen nur Aufgaben der Station", () => {
    const fremd = [r(3, { station: "2b" }), r(3, { station: "2b" }), r(3, { station: "2b" }), r(3, { station: "2b" }), r(3, { station: "2b" })];
    expect(aufstieg(fremd, "2c")).toBe(false);
    expect(aufstieg([...fremd, ...reihe(3, 3, 3, 3)], "2c")).toBe(false);
    expect(aufstieg([...fremd, ...reihe(3, 3, 3, 3, 2)], "2c")).toBe(true);
  });
});

describe("AK-3.2 aufgedeckte Aufgaben zählen nicht als sicher", () => {
  it("2 oder 3 Sterne, aber aufgedeckt: nicht sicher", () => {
    expect(sicher({ stars: 3, revealed: false })).toBe(true);
    expect(sicher({ stars: 2, revealed: false })).toBe(true);
    expect(sicher({ stars: 1, revealed: false })).toBe(false);
    expect(sicher({ stars: 2, revealed: true })).toBe(false);
    expect(sicher({ stars: 3, revealed: true })).toBe(false);
  });
  it("vier sichere und eine aufgedeckte: genügt, zwei aufgedeckte: nicht", () => {
    expect(aufstieg([r(3), r(3), r(2, { revealed: true }), r(3), r(3)], "2c")).toBe(true);
    expect(aufstieg([r(3), r(2, { revealed: true }), r(2, { revealed: true }), r(3), r(3)], "2c")).toBe(false);
  });
});

describe("AK-5.1 Angebot nach zwei Aufgaben mit 1 Stern", () => {
  it("zwei Aufgaben mit 1 Stern in Folge: Angebot", () => {
    expect(angebotFaellig([1, 1])).toBe(true);
    expect(angebotFaellig([3, 1, 1])).toBe(true);
  });
  it("sonst kein Angebot", () => {
    expect(angebotFaellig([])).toBe(false);
    expect(angebotFaellig([1])).toBe(false);
    expect(angebotFaellig([1, 2, 1])).toBe(false);
    expect(angebotFaellig([1, 1, 3])).toBe(false);
    expect(angebotFaellig([2, 2])).toBe(false);
  });
});

describe("AK-5.2 Stationen vor und zurück", () => {
  it("nächste Station, bei der letzten keine", () => {
    expect(naechsteStation("M", "1a")).toBe("1b");
    expect(naechsteStation("M", "1b")).toBe("2a");
    expect(naechsteStation("M", "3c")).toBeNull();
    expect(naechsteStation("R", "3c")).toBe("3d");
    expect(naechsteStation("R", "3d")).toBeNull();
    expect(naechsteStation("M", "zz")).toBeNull();
  });
  it("leichtere Station: die davor, bei der ersten dieselbe", () => {
    expect(leichtereStation("M", "2c")).toBe("2b");
    expect(leichtereStation("M", "2a")).toBe("1b");
    expect(leichtereStation("M", "1a")).toBe("1a");
    expect(leichtereStation("R", "1a")).toBe("1a");
  });
  it("heute ist ein Tag ohne Uhrzeit", () => {
    expect(heute(0)).toBe(0);
    expect(heute(86400000 * 3 + 5)).toBe(3);
  });
});
