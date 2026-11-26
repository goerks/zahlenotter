import { describe, it, expect } from "vitest";
import { load, save, migrateV1, validateV2, emptyState, KEY_V1, KEY_V2, MAX_RESULTS, type StorageLike, type State } from "../src/storage";

const mem = (init: Record<string, string> = {}): StorageLike & { data: Record<string, string> } => {
  const data = { ...init };
  return { data, getItem: (k) => (k in data ? data[k] : null), setItem: (k, v) => { data[k] = v; } };
};
const v1 = (o: object = {}) => JSON.stringify({ levels: { M: 2, R: 1 }, adaptive: true, hist: { M: [3, 2, 1], R: [] }, fish: 12, stats: { solved: { M: 14, R: 9 }, errors: { zehner: 5, knapp: 1, dreher: 0, andere: 2 }, hints: 6 }, baseUrl: "https://goerks.github.io/zahlenotter/", ...o });

describe("AK-1.1 Speicherformat Version 2 und Migration", () => {
  it("v1 mit Mauer Stufe 2 und Reihe Stufe 1: Stationen 2c und 1c, Fische, Statistik und Einstellungen bleiben", () => {
    const s = migrateV1(JSON.parse(v1()));
    expect(s.version).toBe(2);
    expect(s.M.station).toBe("2c");
    expect(s.R.station).toBe("1c");
    expect(s.fish).toBe(12);
    expect(s.stats).toEqual({ solved: { M: 14, R: 9 }, errors: { zehner: 5, knapp: 1, dreher: 0, andere: 2 }, hints: 6 });
    expect(s.baseUrl).toBe("https://goerks.github.io/zahlenotter/");
    expect(s.adaptive).toBe(true);
    expect(s.M.geschafft).toEqual([]);
  });
  it("AK-1.2 alle Stufen 1 bis 3 beider Spiele landen auf der Standard-Station", () => {
    const M = { 1: "1b", 2: "2c", 3: "3c" } as const, R = { 1: "1c", 2: "2c", 3: "3d" } as const;
    for (const l of [1, 2, 3] as const) {
      const s = migrateV1({ levels: { M: l, R: l } });
      expect(s.M.station).toBe(M[l]);
      expect(s.R.station).toBe(R[l]);
    }
  });
  it("der Verlauf der Sterne wird zu den letzten Ergebnissen der Station (höchstens 5)", () => {
    const s = migrateV1(JSON.parse(v1({ hist: { M: [1, 1, 3, 2, 3, 3, 2], R: [] } })));
    expect(s.M.results.map((r) => r.stars)).toEqual([3, 2, 3, 3, 2]); // die letzten 5 von 7
    expect(s.M.results.every((r) => r.station === "2c" && !r.revealed && r.day === 0)).toBe(true);
  });
  it("leere, kaputte und fremde Daten ergeben Standardwerte, nie einen Fehler", () => {
    for (const bad of [null, undefined, 5, "x", [], {}, { levels: 7 }, { levels: { M: 99, R: -3 } }, { hist: { M: ["a", 9, null] } }, { fish: -4, stats: "kaputt" }]) {
      const s = migrateV1(bad);
      expect(s.version).toBe(2);
      expect(s.fish).toBeGreaterThanOrEqual(0);
      expect(["1a", "1b", "2c", "3c"]).toContain(s.M.station);
      expect(["1a", "1c", "2c", "3d"]).toContain(s.R.station);
    }
  });
  it("unbekannte Zusatzfelder werden ignoriert", () => {
    const s = migrateV1(JSON.parse(v1({ geheim: "x", extra: { a: 1 } })));
    expect(s.fish).toBe(12);
    expect(JSON.stringify(s)).not.toContain("geheim");
  });
});

describe("AK-1.1 laden und speichern", () => {
  it("leerer Speicher: Standardwerte, Pfad beginnt bei Station 1a", () => {
    const s = load(mem());
    expect(s).toEqual(emptyState());
    expect(s.M.station).toBe("1a");
    expect(s.R.station).toBe("1a");
  });
  it("nur der alte Schlüssel: wird migriert, der alte Schlüssel bleibt unverändert", () => {
    const m = mem({ [KEY_V1]: v1() });
    const before = m.data[KEY_V1];
    const s = load(m);
    expect(s.M.station).toBe("2c");
    expect(save(s, m)).toBe(true);
    expect(m.data[KEY_V1]).toBe(before);
    expect(m.data[KEY_V2]).toBeDefined();
  });
  it("Rundlauf: speichern und laden ergibt denselben Stand, zweimal laden und speichern ändert nichts", () => {
    const m = mem();
    const s = migrateV1(JSON.parse(v1()));
    s.M.geschafft = ["1b"];
    s.M.results.push({ day: 20000, stars: 2, errs: { zehner: 1 }, revealed: true, station: "2c" });
    save(s, m);
    const a = load(m);
    expect(a).toEqual(s);
    save(a, m);
    expect(load(m)).toEqual(a);
  });
  it("Version 2 hat Vorrang vor dem alten Schlüssel", () => {
    const m = mem({ [KEY_V1]: v1() });
    const s = emptyState(); s.fish = 99; s.M.station = "3a";
    save(s, m);
    const l = load(m);
    expect(l.fish).toBe(99);
    expect(l.M.station).toBe("3a");
  });
  it("kaputtes JSON in Version 2: Rückfall auf den alten Stand, sonst leer", () => {
    expect(load(mem({ [KEY_V2]: "{kaputt", [KEY_V1]: v1() })).M.station).toBe("2c");
    expect(load(mem({ [KEY_V2]: "{kaputt" }))).toEqual(emptyState());
    expect(load(mem({ [KEY_V2]: "{kaputt", [KEY_V1]: "auch kaputt" }))).toEqual(emptyState());
  });
  it("Speicher wirft beim Lesen und Schreiben: keine Ausnahme, Standardwerte", () => {
    const bose: StorageLike = { getItem: () => { throw new Error("gesperrt"); }, setItem: () => { throw new Error("voll"); } };
    expect(load(bose)).toEqual(emptyState());
    expect(save(emptyState(), bose)).toBe(false);
    expect(load(null)).toEqual(emptyState());
    expect(save(emptyState(), null)).toBe(false);
  });
  it("ungültige Stationen und Ergebnisse in Version 2 werden bereinigt", () => {
    const s = validateV2({ version: 2, M: { station: "9z", geschafft: ["1a", "zz", 5], results: [{ stars: 3, station: "1a" }, { stars: 7, station: "1a" }, { stars: 2, station: "nix" }, "x"] }, R: { station: "1c" }, fish: -1 })!;
    expect(s.M.station).toBe("1a");
    expect(s.M.geschafft).toEqual(["1a"]);
    expect(s.M.results).toHaveLength(1);
    expect(s.R.station).toBe("1c");
    expect(s.fish).toBe(0);
    expect(validateV2({ version: 1 })).toBeNull();
    expect(validateV2(null)).toBeNull();
  });
  it("die Liste der Ergebnisse ist begrenzt", () => {
    const m = mem();
    const s: State = emptyState();
    for (let i = 0; i < MAX_RESULTS + 50; i++) s.M.results.push({ day: i, stars: 3, errs: {}, revealed: false, station: "1a" });
    save(s, m);
    const l = load(m);
    expect(l.M.results).toHaveLength(MAX_RESULTS);
    expect(l.M.results[MAX_RESULTS - 1].day).toBe(MAX_RESULTS + 49);
  });
});
