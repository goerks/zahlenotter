import { describe, it, expect } from "vitest";
import * as ZO from "../src/logic";

const ALPHA = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const seedOf = (k: number) => {
  // deterministisch, damit ein Fehlschlag reproduzierbar ist
  const r = ZO.rngFrom("test" + k);
  return Array.from({ length: 5 }, () => ALPHA[Math.floor(r() * ALPHA.length)]).join("");
};
const N = 2000;
const levels: ZO.Level[] = [1, 2, 3];

describe("Zufall und Codes", () => {
  it("gleicher Text ergibt dieselbe Folge", () => {
    expect(Array.from({ length: 5 }, ZO.rngFrom("abc"))).toEqual(Array.from({ length: 5 }, ZO.rngFrom("abc")));
  });
  it("Code-Format Typ+Stufe-5 Zeichen", () => {
    expect(ZO.makeCode("M", 2)).toMatch(/^M2-[A-HJ-NP-Z2-9]{5}$/);
  });
  it("parseCode: gross/klein, Leerzeichen, ungültige Zeichen", () => {
    expect(ZO.parseCode("m2-k7p2q")).toEqual({ type: "M", level: 2, seed: "K7P2Q", code: "M2-K7P2Q" });
    expect(ZO.parseCode(" R3-ABCDE ")?.level).toBe(3);
    expect(ZO.parseCode("M2-K7P20")).toBeNull(); // 0 ist kein Zeichen des Alphabets
    expect(ZO.parseCode("M4-ABCDE")).toBeNull();
    expect(ZO.parseCode("X1-ABCDE")).toBeNull();
    expect(ZO.parseCode(null)).toBeNull();
  });
});

describe("Zahlenmauer", () => {
  for (const level of levels) {
    it(`Stufe ${level}: ${N} Aufgaben lösbar, eindeutig, reproduzierbar, im Bereich`, () => {
      let minB = 99, maxB = 0;
      for (let k = 0; k < N; k++) {
        const seed = seedOf(k);
        const t = ZO.makeTask("M", level, seed);
        const t2 = ZO.makeTask("M", level, seed);
        expect(t.sol).toEqual(t2.sol);
        expect(t.given).toEqual(t2.given);
        const known = t.sol.map((v, i) => (t.given[i] ? v : null));
        expect(ZO.propagate(t.n!, known)).toBe(true);
        expect(known).toEqual(t.sol);
        expect(t.sol.every((v) => v > 0 && v <= 100)).toBe(true);
        const nb = ZO.blanksOf(t).length;
        minB = Math.min(minB, nb); maxB = Math.max(maxB, nb);
        const cfg = ZO.MAUER_CFG[level];
        expect(nb).toBeGreaterThanOrEqual(cfg.blanks[0]);
        expect(nb).toBeLessThanOrEqual(cfg.blanks[1]);
        if (level === 1) {
          expect(t.sol[0]).toBeLessThanOrEqual(20);
          expect(ZO.blanksOf(t).every((i) => i < 3)).toBe(true); // nur oben leer
        }
        if (level === 2) expect(ZO.relations(t.n!).every(([, a, b]) => (t.sol[a] % 10) + (t.sol[b] % 10) < 10)).toBe(true);
        if (level === 3) expect(ZO.relations(t.n!).some(([, a, b]) => (t.sol[a] % 10) + (t.sol[b] % 10) >= 10)).toBe(true);
      }
      expect(minB).toBeGreaterThan(0);
    });
  }
});

describe("Zahlenreihe", () => {
  for (const level of levels) {
    it(`Stufe ${level}: ${N} Aufgaben mit 8 Feldern, im Bereich, Anker passen`, () => {
      for (let k = 0; k < N; k++) {
        const t = ZO.makeTask("R", level, seedOf(k));
        expect(t.sol).toHaveLength(8);
        expect(t.sol.every((v) => v >= 0 && v <= 100)).toBe(true);
        const nb = ZO.blanksOf(t).length;
        expect(nb).toBeGreaterThanOrEqual(4);
        expect(nb).toBeLessThanOrEqual(5);
        if (t.kind === "const") {
          const g = t.given.map((x, i) => (x ? i : -1)).filter((i) => i >= 0);
          const d = (t.sol[g[1]] - t.sol[g[0]]) / (g[1] - g[0]);
          expect(Number.isInteger(d)).toBe(true);
          expect(d).toBe(t.diffs![0]);
        }
        if (level < 3) expect(t.announced).toBe(true);
      }
    });
  }
});

describe("Blatt", () => {
  it("gleicher Code ergibt dasselbe Blatt, Grösse je Typ", () => {
    const a = ZO.makeSheet("m2-k7p2q")!, b = ZO.makeSheet("M2-K7P2Q")!;
    expect(a.tasks.map((x) => x.sol)).toEqual(b.tasks.map((x) => x.sol));
    expect(a.tasks).toHaveLength(4);
    expect(ZO.makeSheet("R1-ABCDE")!.tasks).toHaveLength(6);
    expect(ZO.makeSheet("kaputt")).toBeNull();
  });
  it("Aufgabe i hat den Seed <Code>/<i>", () => {
    const s = ZO.makeSheet("M2-K7P2Q")!;
    expect(s.tasks[1].sol).toEqual(ZO.makeTask("M", 2, "M2-K7P2Q/2").sol);
  });
});

describe("Prüfen, Fehlerarten, Sterne", () => {
  it("Fehlerarten", () => {
    expect(ZO.classifyError(27, 17)).toBe("zehner");
    expect(ZO.classifyError(20, 30)).toBe("zehner");
    expect(ZO.classifyError(16, 17)).toBe("knapp");
    expect(ZO.classifyError(61, 16)).toBe("dreher");
    expect(ZO.classifyError(5, 17)).toBe("andere");
  });
  it("richtig gelöst: 3 Sterne", () => {
    const t = ZO.makeTask("M", 2, "ABCDE");
    ZO.blanksOf(t).forEach((i) => (t.val[i] = String(t.sol[i])));
    expect(ZO.checkTask(t)).toEqual({ status: "ok", errs: [] });
    expect(ZO.starsOf(t)).toBe(3);
  });
  it("unvollständig wird nicht gewertet", () => {
    const t = ZO.makeTask("M", 2, "ABCDE");
    expect(ZO.checkTask(t).status).toBe("incomplete");
  });
  it("falsche Eingabe zählt einmal je Zahl und Feld, Sterne sinken", () => {
    const t = ZO.makeTask("M", 2, "ABCDE");
    const blanks = ZO.blanksOf(t);
    blanks.forEach((i) => (t.val[i] = String(t.sol[i])));
    t.val[blanks[0]] = String(t.sol[blanks[0]] + 10);
    expect(ZO.checkTask(t)).toEqual({ status: "wrong", errs: ["zehner"] });
    expect(t.st[blanks[0]]).toBe("bad");
    ZO.checkTask(t); // dieselbe falsche Zahl nochmals: nicht doppelt zählen
    expect(t.errors).toBe(1);
    expect(ZO.starsOf(t)).toBe(2);
  });
  it("Sterne: 0 = 3, bis 2 = 2, sonst 1", () => {
    const t = ZO.makeTask("R", 1, "ABCDE");
    const at = (e: number, h: number) => ((t.errors = e), (t.hintsUsed = h), ZO.starsOf(t));
    expect([at(0, 0), at(1, 1), at(2, 0), at(2, 1), at(5, 0)]).toEqual([3, 2, 2, 1, 1]);
  });
});

describe("Hilfen", () => {
  it("drei Stufen: markieren (gratis), Rechenweg (1 Punkt), aufdecken (1 weiterer Punkt)", () => {
    const t = ZO.makeTask("M", 2, "ABCDE");
    const h1 = ZO.applyHint(t);
    expect(t.hintsUsed).toBe(0);
    const h2 = ZO.applyHint(t);
    expect(t.hintsUsed).toBe(1);
    expect(h2.text).toMatch(/^Rechne: /);
    expect(h2.cell).toBe(h1.cell);
    const h3 = ZO.applyHint(t);
    expect(t.hintsUsed).toBe(2);
    expect(t.st[h3.cell!]).toBe("ok");
    expect(t.val[h3.cell!]).toBe(String(t.sol[h3.cell!]));
    expect(t.revealed).toEqual([h3.cell]);
    expect(t.hintStage).toBe(0);
  });
});

describe("Stufenanpassung", () => {
  it("3x drei Sterne: eine Stufe höher", () => {
    expect(ZO.adapt([3, 3, 3], 1)).toEqual({ level: 2, reset: true, dir: "up" });
    expect(ZO.adapt([3, 3, 3], 3).reset).toBe(false);
  });
  it("2x ein Stern: eine Stufe tiefer", () => {
    expect(ZO.adapt([2, 1, 1], 2)).toEqual({ level: 1, reset: true, dir: "down" });
    expect(ZO.adapt([1, 1], 1).reset).toBe(false);
  });
  it("sonst keine Änderung", () => {
    expect(ZO.adapt([3, 2, 3], 2)).toEqual({ level: 2, reset: false, dir: null });
  });
});
