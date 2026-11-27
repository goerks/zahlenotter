import { describe, it, expect } from "vitest";
import { copyText, copiedMessage } from "../src/copy";

const ok = () => ({ calls: [] as string[], writeText(t: string) { this.calls.push(t); return Promise.resolve(); } });

describe("AK-3.1 Kopieren in die Zwischenablage", () => {
  it("Zwischenablage nimmt den Text an: «ok», genau der Text wird geschrieben", async () => {
    const cb = ok();
    expect(await copyText("M2-K7P2Q", { clipboard: cb })).toBe("ok");
    expect(cb.calls).toEqual(["M2-K7P2Q"]);
  });
  it("Zwischenablage abgelehnt, Notbehelf klappt: «ersatz»", async () => {
    const seen: string[] = [];
    const res = await copyText("M2-K7P2Q", { clipboard: { writeText: () => Promise.reject(new Error("nicht erlaubt")) }, legacy: (t) => (seen.push(t), true) });
    expect(res).toBe("ersatz");
    expect(seen).toEqual(["M2-K7P2Q"]);
  });
  it("keine Zwischenablage, Notbehelf klappt: «ersatz»", async () => {
    expect(await copyText("x", { clipboard: null, legacy: () => true })).toBe("ersatz");
    expect(await copyText("x", { legacy: () => true })).toBe("ersatz");
  });
  it("AK-3.2 nichts klappt: «fehler» (die Oberfläche zeigt das Feld zum Kopieren von Hand)", async () => {
    expect(await copyText("x", { clipboard: { writeText: () => Promise.reject(new Error("nein")) }, legacy: () => false })).toBe("fehler");
    expect(await copyText("x", { clipboard: null, legacy: () => { throw new Error("kaputt"); } })).toBe("fehler");
    expect(await copyText("x", {})).toBe("fehler");
  });
  it("wirft nie, auch wenn die Zwischenablage nicht wie erwartet gebaut ist", async () => {
    expect(await copyText("x", { clipboard: {} as never })).toBe("fehler");
    expect(await copyText("x", { clipboard: { writeText: () => { throw new Error("sofort"); } } as never })).toBe("fehler");
  });
  it("Der Notbehelf wird nicht gebraucht, wenn die Zwischenablage klappt", async () => {
    let used = false;
    await copyText("x", { clipboard: ok(), legacy: () => { used = true; return true; } });
    expect(used).toBe(false);
  });
  it("Hinweis nach dem Kopieren nennt den Code oder die Adresse", () => {
    expect(copiedMessage("code", "M2-K7P2Q")).toBe("Code M2-K7P2Q kopiert");
    expect(copiedMessage("task", "R1-ABCDE")).toBe("Code R1-ABCDE kopiert");
    expect(copiedMessage("addr", "https://goerks.github.io/zahlenotter/")).toBe("Adresse kopiert");
  });
});
