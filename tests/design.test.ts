// Wächter über die Stilregeln der Bedienung (Ticket 8): Markieren, Touchziele, Hover, Fokus, Kontrast.
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";

const css = readFileSync(new URL("../src/style.css", import.meta.url), "utf8").replace(/\s+/g, " ");
const ui = readFileSync(new URL("../src/ui.ts", import.meta.url), "utf8");

const token = (name: string): string => {
  const m = new RegExp("--" + name + ":\\s*(#[0-9a-fA-F]{6})").exec(css);
  if (!m) throw new Error("Farbe fehlt: --" + name);
  return m[1];
};
const lum = (hex: string) => {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
const contrast = (a: string, b: string) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
const rule = (selector: string): string => {
  const i = css.indexOf(selector + "{");
  if (i < 0) throw new Error("Regel fehlt: " + selector);
  return css.slice(i, css.indexOf("}", i));
};

describe("AK-2.1 Text ist nicht markierbar", () => {
  it("die ganze App: user-select none und kein Markierungsmenü auf dem iPad", () => {
    const r = rule("html,body,#app,#app *");
    expect(r).toContain("user-select:none");
    expect(r).toContain("-webkit-user-select:none");
    expect(r).toContain("-webkit-touch-callout:none");
  });
  it("kein Zoomen durch Doppeltippen", () => {
    expect(rule("html")).toContain("touch-action:manipulation");
  });
});

describe("AK-2.2 Eingabefelder bleiben markierbar", () => {
  it("die Ausnahme ist spezifischer als die allgemeine Regel (sonst würde sie überstimmt)", () => {
    const sel = "input,textarea,select,#app input,#app textarea,#app select";
    const r = rule(sel);
    expect(r).toContain("user-select:text");
    expect(r).toContain("-webkit-user-select:text");
    expect(css.indexOf(sel)).toBeGreaterThan(css.indexOf("html,body,#app,#app *"));
  });
});

describe("AK-1.1 Touchziele mindestens 48 px", () => {
  it("Stufen-Schalter, kleine Knöpfe, Felder, Halten-Knopf", () => {
    expect(rule(".pill")).toContain("min-height:48px");
    expect(rule(".btn.small")).toContain("min-height:48px");
    expect(rule("button.cell")).toContain("min-height:48px");
    expect(rule(".btn.holdbtn")).toContain("min-height:48px");
    expect(rule(".copybtn")).toContain("min-height:48px");
    expect(rule(".btn")).toContain("min-height:48px");
  });
  it("der Schalter «Automatisch weiterkommen» hat eine grössere Tippfläche", () => {
    expect(css).toContain(".switch button:before{content:\"\";position:absolute;inset:-9px -6px}");
  });
});

describe("AK-1.2 Maus und Tastatur", () => {
  it("jede Hover-Regel steht im Block @media (hover:hover), damit auf dem Tablet nichts «klebt»", () => {
    const start = css.indexOf("@media (hover:hover){");
    expect(start).toBeGreaterThan(-1);
    let depth = 0, end = start;
    for (let i = css.indexOf("{", start); i < css.length; i++) { if (css[i] === "{") depth++; if (css[i] === "}") { depth--; if (depth === 0) { end = i; break; } } }
    const block = css.slice(start, end);
    expect((block.match(/:hover/g) || []).length).toBe((css.match(/:hover/g) || []).length);
    expect(block).toContain(".btn:hover");
    expect(block).toContain(".btn:hover:active"); // Gedrückt gewinnt über Darüber
  });
  it("Tastatur-Fokus: dicker Ring nur bei :focus-visible", () => {
    expect(rule(":focus-visible")).toContain("outline:4px solid var(--teal)");
  });
  it("Gedrückt: Knöpfe und Stufen senken sich", () => {
    expect(css).toContain(".btn:active{transform:translateY(2px)");
    expect(css).toContain(".pill:active{transform:translateY(2px)}");
  });
});

describe("Kontrast mindestens 4,5 zu 1", () => {
  it("weisse Schrift auf Petrol", () => expect(contrast("#FFFFFF", token("teal"))).toBeGreaterThanOrEqual(4.5));
  it("graue Zusatzschrift auf Creme und auf Weiss", () => {
    expect(contrast(token("muted"), token("bg"))).toBeGreaterThanOrEqual(4.5);
    expect(contrast(token("muted"), "#FFFFFF")).toBeGreaterThanOrEqual(4.5);
  });
  it("dunkle Schrift auf Orange (Knopf und aktive Stufe)", () => {
    expect(contrast(token("ink"), token("orange"))).toBeGreaterThanOrEqual(4.5);
    expect(rule(".btn.orange")).toContain("color:var(--ink)");
    expect(rule(".pill.on")).toContain("color:var(--ink)");
  });
  it("«Kopiert!»: dunkelgrüne Schrift auf hellgrün", () => expect(contrast("#1d6b43", token("green-l"))).toBeGreaterThanOrEqual(4.5));
});

describe("AK-5.1 Das Druckblatt bleibt unverändert", () => {
  it("Code-Karte und Hinweis sind «nicht drucken»", () => {
    expect(ui).toContain('class="codecard noprint"');
    expect(ui).toContain('class="toast noprint"');
    expect(css).toContain(".noprint{display:none!important}");
  });
  it("die Tippfläche 48 px gilt nur für Knöpfe, nicht für die gedruckten Felder", () => {
    expect(css).toContain("button.cell{min-height:48px}");
    expect(css).not.toContain(".sheet .cell{min-height");
  });
});

describe("Natel: eigene Regeln nur unterhalb von 600 px (Prioritäten Tablet, Desktop, Natel)", () => {
  const start = css.indexOf("@media (max-width:600px){");
  let end = start;
  if (start >= 0) { let depth = 0; for (let i = css.indexOf("{", start); i < css.length; i++) { if (css[i] === "{") depth++; if (css[i] === "}") { depth--; if (depth === 0) { end = i; break; } } } }
  const block = css.slice(start, end);
  it("es gibt genau einen Block für das Natel", () => {
    expect(start).toBeGreaterThan(-1);
    expect(css.split("@media (max-width:600px)").length - 1).toBe(1);
  });
  it("der Titel schiebt den Fisch-Chip nicht mehr über den Rand", () => {
    expect(block).toContain(".topbar h2{flex:1;min-width:0;");
  });
  it("die Zahlenreihe rückt zusammen, die Pfad-Stationen bleiben mindestens 48 px", () => {
    expect(block).toContain(".rrow{--g:3px;");
    expect(block).toMatch(/\.tdot\{width:(4[89]|[5-9]\d)px;height:(4[89]|[5-9]\d)px/);
    expect(block).toMatch(/\.pad button\{min-height:(4[89]|[5-9]\d)px/);
  });
  it("die Natel-Regeln stehen nach den allgemeinen Regeln (sonst würden sie überstimmt)", () => {
    expect(start).toBeGreaterThan(css.indexOf(".tdot{position:absolute"));
    expect(start).toBeGreaterThan(css.indexOf(".topbar{"));
  });
});
