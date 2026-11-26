// Beweis für «Verhalten unverändert»: Die TypeScript-Logik liefert für viele Seeds
// genau dieselben Aufgaben wie der Prototyp (prototype/src/logic.js).
// Die Prototyp-Datei ist ein CommonJS-Skript; das Projekt ist ein ES-Modul. Deshalb wird
// sie als Text gelesen und in einer Funktion ausgeführt, statt sie zu importieren.
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import * as ZO from "../src/logic";

const code = readFileSync(new URL("../prototype/src/logic.js", import.meta.url), "utf8");
const OLD = new Function("module", code + "\n;return module.exports;")({ exports: {} });
const strip = (t: any) => JSON.stringify({ sol: t.sol, given: t.given, diffs: t.diffs, kind: t.kind, text: t.text, rule: t.rule, n: t.n });

describe("gleich wie der Prototyp", () => {
  for (const type of ["M", "R"] as const)
    for (const level of [1, 2, 3] as const)
      it(`${type}${level}: 3000 Seeds identisch`, () => {
        for (let k = 0; k < 3000; k++) {
          const seed = "S" + k.toString(36).toUpperCase();
          expect(strip(ZO.makeTask(type, level, seed))).toBe(strip(OLD.makeTask(type, level, seed)));
        }
      });
});
