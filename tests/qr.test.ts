import { describe, it, expect } from "vitest";
import { encode, svg } from "../src/qr";

describe("QR-Encoder", () => {
  it("kurzer Text: Version 1 (21 Module)", () => {
    expect(encode("M2-K7P2Q").size).toBe(21);
  });
  it("Adresse mit Code: wächst mit der Länge, Matrix quadratisch", () => {
    const q = encode("https://goerks.github.io/zahlenotter/#M2-K7P2Q");
    expect(q.size).toBeGreaterThan(21);
    expect(q.modules).toHaveLength(q.size);
    expect(q.modules.every((r) => r.length === q.size)).toBe(true);
  });
  it("Suchmuster oben links vorhanden (7x7-Rahmen)", () => {
    const m = encode("Zahlenotter").modules;
    for (let i = 0; i < 7; i++) expect([m[0][i], m[6][i], m[i][0], m[i][6]]).toEqual([true, true, true, true]);
    expect(m[3][3]).toBe(true);
    expect(m[1][1]).toBe(false);
  });
  it("zu langer Text wirft", () => {
    expect(() => encode("x".repeat(500))).toThrow();
  });
  it("svg liefert ein SVG mit Beschriftung", () => {
    expect(svg("M2-K7P2Q")).toMatch(/^<svg .*aria-label="QR-Code"/);
  });
});
