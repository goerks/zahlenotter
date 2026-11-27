import { describe, it, expect } from "vitest";
import * as ZO from "../src/logic";

const seedOf = (k: number) => "S" + k;
const reihe = ZO.STATIONS.R;
const mauer = ZO.STATIONS.M;
const task = (type: "M" | "R", id: string, seed: string) => ZO.makeTask(type, ZO.stationInfo(type, id)!.level, seed, id);
const bogenSichtbar = (t: ZO.Task) => Array.from({ length: 7 }, (_, k) => ZO.arcVisible(t, k));

describe("AK-5.1 Bögen sind nie von Anfang an sichtbar", () => {
  it("in allen Reihen-Stationen (je 200 Aufgaben)", () => {
    for (const s of reihe) for (let k = 0; k < 200; k++) {
      const t = task("R", s.id, seedOf(k));
      expect(bogenSichtbar(t).some(Boolean)).toBe(false);
      expect(t.arcsOn).toBe(false);
    }
  });
  it("auch bei alten Codes der Standard-Station 1c (früher sichtbar)", () => {
    const t = ZO.makeTask("R", 1, "K7P2Q");
    expect(bogenSichtbar(t).some(Boolean)).toBe(false);
  });
});

describe("AK-5.2 «Bögen zeigen»: gratis bis 2b, ab 2c 1 Hilfepunkt", () => {
  it("die Grenze liegt zwischen 2b und 2c", () => {
    const frei = reihe.filter((s) => ZO.REIHE_DIMS[s.id].boegen === "gratis").map((s) => s.id);
    expect(frei).toEqual(["1a", "1b", "1c", "2a", "2b"]);
  });
  for (const s of reihe) {
    it(`Station ${s.id}: Kosten, einmal je Aufgabe, ausblenden gratis`, () => {
      const t = task("R", s.id, seedOf(1));
      const soll = ["1a", "1b", "1c", "2a", "2b"].includes(s.id) ? 0 : 1;
      expect(ZO.arcsCost(t)).toBe(soll);
      const a = ZO.toggleArcs(t);
      expect(a.on).toBe(true);
      expect(a.cost).toBe(soll);
      expect(t.hintsUsed).toBe(soll);
      const b = ZO.toggleArcs(t);
      expect(b.on).toBe(false);
      expect(b.cost).toBe(0);
      expect(bogenSichtbar(t).some(Boolean)).toBe(false);
      ZO.toggleArcs(t); // wieder zeigen: kostet nicht nochmals
      expect(t.hintsUsed).toBe(soll);
      expect(ZO.arcsCost(t)).toBe(0);
    });
  }
  it("gratis Bögen kosten keinen Stern", () => {
    const t = task("R", "1a", seedOf(2));
    ZO.toggleArcs(t);
    expect(ZO.starsOf(t)).toBe(3);
  });
});

describe("AK-5.3 Bögen zeigen die Schritte, bei verdeckter Regel nur zwischen bekannten Zahlen", () => {
  it("genannte Regel: alle Bögen, mit dem richtigen Schritt", () => {
    const t = task("R", "2a", seedOf(3));
    ZO.toggleArcs(t);
    expect(bogenSichtbar(t).every(Boolean)).toBe(true);
    t.diffs!.forEach((d, k) => expect(t.sol[k + 1] - t.sol[k]).toBe(d));
  });
  it("Regel entdecken: nur zwischen zwei bekannten Zahlen, neue Bögen nach richtigen Feldern", () => {
    for (const id of ["3b", "3c", "3d"]) for (let k = 0; k < 100; k++) {
      const t = task("R", id, seedOf(k));
      if (t.announced) continue;
      ZO.toggleArcs(t);
      const known = (i: number) => t.given[i] || t.st[i] === "ok";
      bogenSichtbar(t).forEach((v, j) => expect(v).toBe(known(j) && known(j + 1)));
      const i = t.given.findIndex((g) => !g);
      t.val[i] = String(t.sol[i]); t.st[i] = "ok";
      bogenSichtbar(t).forEach((v, j) => expect(v).toBe(known(j) && known(j + 1)));
    }
  });
});

describe("AK-5.7 nach dem Lösen sind alle Bögen sichtbar", () => {
  it("showSteps gefüllt zeigt alle, auch ohne Anfrage", () => {
    const t = task("R", "3d", seedOf(4));
    t.showSteps!.fill(true);
    expect(bogenSichtbar(t).every(Boolean)).toBe(true);
  });
});

describe("AK-5.4 Rechnung an der Mauer", () => {
  it("die Rechnung ergibt die Lösung des gesuchten Steins (alle Stationen, je 200 Aufgaben)", () => {
    for (const s of mauer) for (let k = 0; k < 200; k++) {
      const t = task("M", s.id, seedOf(k));
      const e = ZO.eqTarget(t)!;
      expect(e).not.toBeNull();
      const m = e.eq.match(/^(\d+) ([+−]) (\d+) = \?$/)!;
      expect(m).not.toBeNull();
      const v = m[2] === "+" ? +m[1] + +m[3] : +m[1] - +m[3];
      expect(v).toBe(t.sol[e.cell]);
      expect(e.known).toHaveLength(2);
      e.known.forEach((i) => expect(t.given[i]).toBe(true));
      expect(t.given[e.cell]).toBe(false);
    }
  });
  it("gilt für den gewählten Stein, wenn er sich ausrechnen lässt, sonst für den nächsten möglichen", () => {
    let gewaehlt = 0, ausweich = 0;
    for (let k = 0; k < 200; k++) {
      const t = task("M", "2c", seedOf(k));
      for (const i of ZO.blanksOf(t)) {
        const e = ZO.eqTarget(t, i)!;
        if (e.cell === i) gewaehlt++;
        else { ausweich++; expect(e.cell).toBe(ZO.eqTarget(t)!.cell); }
      }
    }
    expect(gewaehlt).toBeGreaterThan(0);
    expect(ausweich).toBeGreaterThan(0);
  });
  it("kostet 1 Hilfepunkt je Stein; ausblenden und wieder zeigen kostet nicht nochmals", () => {
    const t = task("M", "2c", seedOf(5));
    const e = ZO.eqTarget(t)!;
    expect(ZO.eqCost(t, e.cell)).toBe(1);
    const r = ZO.showEquation(t, e.cell);
    expect(r.cost).toBe(1);
    expect(t.hintsUsed).toBe(1);
    expect(t.eq!.cell).toBe(e.cell);
    ZO.hideEquation(t);
    expect(t.eq).toBeNull();
    expect(ZO.showEquation(t, e.cell).cost).toBe(0);
    expect(t.hintsUsed).toBe(1);
  });
  it("verschwindet, sobald der gesuchte Stein richtig ist (Prüfen oder Aufdecken)", () => {
    const t = task("M", "2c", seedOf(6));
    const { eq } = ZO.showEquation(t);
    for (const i of ZO.blanksOf(t)) t.val[i] = String(t.sol[i] + (i === eq!.cell ? 0 : 1)); // nur der gesuchte Stein stimmt
    ZO.checkTask(t);
    expect(t.eq).toBeNull();
    const u = task("M", "2c", seedOf(7));
    ZO.showEquation(u);
    ZO.applyHint(u); ZO.applyHint(u); // markieren, aufdecken desselben Steins
    expect(u.eq).toBeNull();
  });
  it("bleibt bei einer falschen Zahl stehen", () => {
    const t = task("M", "2c", seedOf(8));
    const { eq } = ZO.showEquation(t);
    for (const i of ZO.blanksOf(t)) t.val[i] = String(t.sol[i] + (i === eq!.cell ? 1 : 0));
    ZO.checkTask(t);
    expect(t.eq!.cell).toBe(eq!.cell);
  });
  it("in der Reihe gibt es keine Rechnung", () => {
    expect(ZO.eqTarget(task("R", "2a", seedOf(1)))).toBeNull();
  });
});
