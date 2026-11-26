// Beweis für «Verhalten unverändert»: Die TypeScript-Logik liefert für viele Seeds
// genau dieselben Aufgaben wie der Prototyp (prototype/src/logic.js).
import { describe, it, expect } from "vitest";
import { createRequire } from "node:module";
import * as ZO from "../src/logic";

const OLD = createRequire(import.meta.url)("../prototype/src/logic.js");
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
