import { describe, it, expect } from "vitest";
import * as ZO from "../src/logic";

const ALPHA = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const seedOf = (k: number) => {
  const r = ZO.rngFrom("st" + k);
  return Array.from({ length: 5 }, () => ALPHA[Math.floor(r() * ALPHA.length)]).join("");
};
const N = 1500;
const mauer = ZO.STATIONS.M, reihe = ZO.STATIONS.R;

describe("AK-2.1 Mauer: jede Station erzeugt gültige Aufgaben", () => {
  for (const s of mauer) {
    it(`Mauer ${s.id} (${s.name}): lösbar, eindeutig, reproduzierbar, im Raum, Lücken und Übergang wie vorgesehen`, () => {
      const d = ZO.MAUER_DIMS[s.id], cfg = ZO.mauerCfg(s.id);
      for (let k = 0; k < N; k++) {
        const seed = seedOf(k);
        const t = ZO.makeTask("M", s.level, seed, s.id), t2 = ZO.makeTask("M", s.level, seed, s.id);
        expect(t.station).toBe(s.id);
        expect(t.sol).toEqual(t2.sol);
        expect(t.given).toEqual(t2.given);
        expect(t.n).toBe(d.hoehe);
        const known = t.sol.map((v, i) => (t.given[i] ? v : null));
        expect(ZO.propagate(t.n!, known)).toBe(true);
        expect(known).toEqual(t.sol);
        expect(t.sol.every((v) => v > 0)).toBe(true);
        expect(t.sol[0]).toBeLessThanOrEqual(d.raum);
        const nb = ZO.blanksOf(t).length;
        expect(nb).toBeGreaterThanOrEqual(cfg.blanks[0]);
        expect(nb).toBeLessThanOrEqual(cfg.blanks[1]);
        const baseStart = ZO.mid(t.n! - 1, 0);
        const baseBlanks = ZO.blanksOf(t).filter((i) => i >= baseStart).length;
        if (s.standard) expect(baseBlanks).toBeLessThanOrEqual(d.basis);
        else expect(baseBlanks).toBe(d.basis);
        const carries = ZO.relations(t.n!).filter(([, a, b]) => (t.sol[a] % 10) + (t.sol[b] % 10) >= 10).length;
        if (d.ueb === "keine") expect(carries).toBe(0);
        if (d.ueb === "einer") expect(carries).toBe(1);
        if (d.ueb === "mind1") expect(carries).toBeGreaterThanOrEqual(1);
      }
    });
  }
});

describe("AK-2.1 Reihe: jede Station erzeugt gültige Aufgaben", () => {
  for (const s of reihe) {
    it(`Reihe ${s.id} (${s.name}): 8 Felder, im Raum, Schritte, Richtung, Regel und Bögen wie vorgesehen`, () => {
      const d = ZO.REIHE_DIMS[s.id];
      const steps = d.schritte.split(",").map(Number);
      for (let k = 0; k < N; k++) {
        const seed = seedOf(k);
        const t = ZO.makeTask("R", s.level, seed, s.id), t2 = ZO.makeTask("R", s.level, seed, s.id);
        expect(t.sol).toEqual(t2.sol);
        expect(t.sol).toHaveLength(8);
        expect(t.sol.every((v) => v >= 0 && v <= 100)).toBe(true);
        const nb = ZO.blanksOf(t).length;
        expect(nb).toBeGreaterThanOrEqual(4);
        expect(nb).toBeLessThanOrEqual(5);
        if (t.kind === "const") {
          expect(steps).toContain(Math.abs(t.diffs![0]));
          if (d.richtung === "vor") expect(t.diffs![0]).toBeGreaterThan(0);
          const g = t.given.map((x, i) => (x ? i : -1)).filter((i) => i >= 0);
          const step = (t.sol[g[1]] - t.sol[g[0]]) / (g[1] - g[0]);
          expect(step).toBe(t.diffs![0]); // Anker legen den Schritt fest
        }
        if (d.regel === "genannt") expect(t.announced).toBe(true);
        if (d.regel === "entdecken" && s.id !== "3d") expect(t.announced).toBe(false);
        if (d.art === "konstant") expect(t.kind).toBe("const");
        if (s.id === "1a") expect(t.sol[7]).toBeLessThanOrEqual(20);
        if (!s.standard) expect(t.showSteps!.every((x) => x === (d.boegen === "sichtbar"))).toBe(true);
      }
    });
  }
});

describe("AK-2.2 genau eine Stellschraube je Schritt", () => {
  const diffs = (a: object, b: object) => Object.keys(a).filter((k) => (a as any)[k] !== (b as any)[k]);
  it("Mauer: zwischen zwei aufeinanderfolgenden Stationen ändert sich höchstens eine Stellschraube (Ausnahme Klassenwechsel 1b nach 2a)", () => {
    for (let i = 1; i < mauer.length; i++) {
      const prev = mauer[i - 1].id, cur = mauer[i].id;
      const n = diffs(ZO.MAUER_DIMS[prev], ZO.MAUER_DIMS[cur]);
      if (prev === "1b" && cur === "2a") expect(n.sort()).toEqual(["raum", "ueb"]); // Klassenwechsel: Raum grösser, Übergang beginnt neu
      else expect(n.length, `${prev} nach ${cur}: ${n}`).toBe(1);
    }
  });
  it("Reihe: zwischen zwei aufeinanderfolgenden Stationen ändert sich genau eine Stellschraube", () => {
    for (let i = 1; i < reihe.length; i++) {
      const n = diffs(ZO.REIHE_DIMS[reihe[i - 1].id], ZO.REIHE_DIMS[reihe[i].id]);
      expect(n.length, `${reihe[i - 1].id} nach ${reihe[i].id}: ${n}`).toBe(1);
    }
  });
  it("Jede Station hat Stellschrauben, und die Zahl der Stationen stimmt (Mauer 9, Reihe 10)", () => {
    expect(mauer).toHaveLength(9);
    expect(reihe).toHaveLength(10);
    mauer.forEach((s) => expect(ZO.MAUER_DIMS[s.id]).toBeDefined());
    reihe.forEach((s) => expect(ZO.REIHE_DIMS[s.id]).toBeDefined());
  });
});

describe("AK-2.3 alte Codes und Standard-Stationen", () => {
  it("Genau eine Standard-Station je Stufe und Spiel", () => {
    for (const t of ["M", "R"] as const) for (const l of [1, 2, 3] as const) expect(ZO.STATIONS[t].filter((s) => s.standard && s.level === l)).toHaveLength(1);
    expect(["M", "R"].map((t) => [1, 2, 3].map((l) => ZO.standardStation(t as "M" | "R", l as 1 | 2 | 3).id))).toEqual([["1b", "2c", "3c"], ["1c", "2c", "3d"]]);
  });
  it("makeTask ohne Station ist dasselbe wie mit der Standard-Station", () => {
    for (const t of ["M", "R"] as const) for (const l of [1, 2, 3] as const) for (let k = 0; k < 200; k++) {
      const seed = seedOf(k);
      const a = ZO.makeTask(t, l, seed), b = ZO.makeTask(t, l, seed, ZO.standardStation(t, l).id);
      expect(a.sol).toEqual(b.sol);
      expect(a.given).toEqual(b.given);
    }
  });
  it("Alter Code M2-K7P2Q und Schreibweise mit Stationsbuchstabe M2C-K7P2Q ergeben dasselbe Blatt", () => {
    const a = ZO.makeSheet("M2-K7P2Q")!, b = ZO.makeSheet("m2c-k7p2q")!;
    expect(b.code).toBe("M2-K7P2Q");
    expect(a.tasks.map((x) => x.sol)).toEqual(b.tasks.map((x) => x.sol));
  });
  it("Codes mit Station: lesen, schreiben, ungültige Stationen ablehnen", () => {
    expect(ZO.parseCode("M2B-K7P2Q")).toEqual({ type: "M", level: 2, station: "2b", seed: "K7P2Q", code: "M2B-K7P2Q" });
    expect(ZO.parseCode("r3d-abcde")?.station).toBe("3d");
    expect(ZO.parseCode("R3D-ABCDE")?.code).toBe("R3-ABCDE"); // Standard-Station: altes Format
    expect(ZO.parseCode("M1C-ABCDE")).toBeNull(); // Mauer hat in Klasse 1 nur a und b
    expect(ZO.parseCode("M2E-ABCDE")).toBeNull();
    for (const s of mauer) expect(ZO.parseCode(ZO.makeCode("M", s.level, s.id))?.station).toBe(s.id);
    for (const s of reihe) expect(ZO.parseCode(ZO.makeCode("R", s.level, s.id))?.station).toBe(s.id);
    expect(ZO.makeCode("M", 2)).toMatch(/^M2-[A-HJ-NP-Z2-9]{5}$/);
    expect(ZO.makeCode("M", 2, "2b")).toMatch(/^M2B-[A-HJ-NP-Z2-9]{5}$/);
  });
  it("Blatt einer neuen Station hat dieselbe Grösse und ist reproduzierbar", () => {
    const a = ZO.makeSheet("M2B-K7P2Q")!, b = ZO.makeSheet("M2B-K7P2Q")!;
    expect(a.station).toBe("2b");
    expect(a.tasks).toHaveLength(4);
    expect(a.tasks.map((x) => x.sol)).toEqual(b.tasks.map((x) => x.sol));
    expect(ZO.makeSheet("R2B-K7P2Q")!.tasks).toHaveLength(6);
  });
});

describe("AK-6.1 Etiketten", () => {
  it("Mauer: abziehen-basis, zehneruebergang, Zahlenraum und Höhe", () => {
    let basis = 0, ueb = 0;
    for (let k = 0; k < 300; k++) {
      const t = ZO.makeTask("M", 3, seedOf(k), "3c");
      expect(t.tags).toContain("zahlenraum-100");
      expect(t.tags).toContain("hoehe-4");
      if (t.tags.includes("abziehen-basis")) basis++;
      if (t.tags.includes("zehneruebergang")) ueb++;
      const baseStart = ZO.mid(3, 0);
      expect(t.tags.includes("abziehen-basis")).toBe(ZO.blanksOf(t).some((i) => i >= baseStart));
    }
    expect(basis).toBeGreaterThan(0);
    expect(ueb).toBeGreaterThan(0);
    expect(ZO.makeTask("M", 1, seedOf(1), "1a").tags).not.toContain("abziehen-basis");
  });
  it("Reihe: Richtung, Art, Schritt und Regel", () => {
    const t = ZO.makeTask("R", 2, seedOf(3), "2a");
    expect(t.tags).toContain(t.diffs![0] < 0 ? "rueckwaerts" : "vorwaerts");
    expect(t.tags).toContain("konstant");
    expect(t.tags).toContain("schritt-" + Math.abs(t.diffs![0]));
    expect(t.tags).toContain("regel-genannt");
    expect(t.tags).toContain("bogen-sichtbar");
    const kinds = new Set<string>();
    for (let k = 0; k < 400; k++) ZO.makeTask("R", 3, seedOf(k), "3d").tags.forEach((x) => ["konstant", "wechselnd", "wachsend"].includes(x) && kinds.add(x));
    expect([...kinds].sort()).toEqual(["konstant", "wachsend", "wechselnd"]);
  });
});
