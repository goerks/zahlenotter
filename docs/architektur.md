# Architektur

Stand: Ticket 7 (Pfad mit Stationen). Diese Datei beschreibt, was im Code steht, nicht Pläne.

## Module

| Datei | Inhalt |
|---|---|
| `src/logic.ts` | Zufall, Codes, Stationen, Generator (Mustermauer und Reihenpfad), Etiketten, Prüfen, Hilfen, Sterne |
| `src/progress.ts` | Regeln fürs Weiterkommen: `sicher`, `aufstieg`, `angebotFaellig`, nächste und leichtere Station |
| `src/storage.ts` | Lokaler Speicher Version 2, Migration aus Version 1, `load` und `save` |
| `src/pfad.ts` | Pfad: Zustand der Stationen, Zeilen je Klasse, Lage auf dem Spielbrett |
| `src/qr.ts` | QR-Encoder ohne Abhängigkeiten |
| `src/ui.ts` | Oberfläche (noch ungetypt) |

## Stationen

Jedes Spiel hat Stationen je Klasse: **Mustermauer 9** (1a, 1b, 2a bis 2d, 3a bis 3c), **Reihenpfad 10** (1a bis 1c, 2a bis 2c, 3a bis 3d). Die Stationen mit `standard` entsprechen genau den früheren Stufen: Mauer `1b`, `2c`, `3c`, Reihe `1c`, `2c`, `3d`. Sie benutzen unverändert den alten Zufallsstart und den alten Reihen-Generator; ein Test vergleicht sie mit dem Prototyp (je 3000 Seeds).

Zwischen zwei aufeinanderfolgenden Stationen ändert sich höchstens eine Stellschraube (`MAUER_DIMS`, `REIHE_DIMS`). Ausnahme: der Klassenwechsel der Mauer von `1b` nach `2a` (Zahlenraum grösser, Zehnerübergang beginnt neu). Ein Test prüft das an den Tabellen.

Neue Stationen benutzen einen eigenen Zufallsstart (`Typ + Station : Seed`). Der Mauer-Generator nimmt dafür eine Konfiguration je Station (`mauerCfg`), der Reihen-Generator für neue Stationen hat eigene Parameter (`REIHE_GEN`).

Die Mauer-Stationen sind am Generator gemessen (lösbar und eindeutig in je 1500 Seeds). «Bis 20 ohne Zehnerübergang» gibt es bei drei Reihen nicht, darum beginnt Klasse 1 mit «bis 10» (`1a`) und «bis 20» (`1b`).

## Codes

`<Typ><Stufe><Station>-<5 Zeichen>`, zum Beispiel `M2B-K7P2Q`. Der Stationsbuchstabe steht gross, weil `parseCode` die Eingabe in Grossbuchstaben wandelt. Bei der Standard-Station bleibt das alte Format (`M2-K7P2Q`), und der alte Code ergibt dieselbe Aufgabe wie vorher. Der Code mit Buchstabe der Standard-Station wird auf das alte Format vereinheitlicht.

## Etiketten

Jede Aufgabe trägt Etiketten (`task.tags`), die aus der Aufgabe berechnet werden und nicht gespeichert sind. Mauer: `addieren`, `abziehen`, `abziehen-basis`, `zehneruebergang`, `zahlenraum-N`, `hoehe-N`. Reihe: `vorwaerts` oder `rueckwaerts`, `konstant`, `wechselnd` oder `wachsend`, `schritt-N`, `regel-genannt` oder `regel-entdecken`, `bogen-sichtbar`. Sie bereiten «Gezielt üben» vor und werden noch nicht ausgewertet.

## Speicher (Version 2)

Schlüssel `zahlenotter.v2`, Feld `version: 2`. Pro Spiel: aktuelle `station`, `geschafft` (Liste), `results` (letzte 200: Tag, Sterne, Fehler je Fehlerart, `revealed`, Station). Dazu `fish`, `stats`, `adaptive` («Automatisch weiterkommen») und `baseUrl`. «Vorausgesetzt» ist keine Liste, sondern ergibt sich aus der Lage: Stationen vor der aktuellen, die nicht geschafft sind.

**Migration:** Fehlt Version 2, wird der alte Schlüssel `zahlenotter.proto.v1` gelesen. Die Stufe wird zur Standard-Station, Fische, Statistik, Einstellungen und der Verlauf der Sterne (letzte 5) bleiben erhalten. Der alte Schlüssel wird nie verändert oder gelöscht, damit man zurückgehen kann. Defekte oder fehlende Daten ergeben Standardwerte, `load` und `save` werfen nie. Ohne Speicher läuft die App ohne Fortschritt weiter. Ein neues Kind beginnt bei Station 1a.

## Weiterkommen

Aufstieg: mindestens 5 Aufgaben der Station gelöst und von den letzten 5 mindestens 4 sicher. Sicher heisst 2 oder 3 Sterne und kein Feld aufgedeckt. Es gibt keinen automatischen Abstieg. Nach zwei Aufgaben mit 1 Stern in Folge erscheint einmal je Einheit ein Angebot (leichtere Aufgabe, Pause, weiter). Papierblätter zählen nicht für den Aufstieg, nur für die Fische. Beim Wiederholen einer früheren Station gibt es Fische, der Pfad bleibt unberührt. Auf der Elternseite lässt sich die Station festlegen; der Knopf muss 2 Sekunden gehalten werden.

## Bedienung: Markieren, Kopieren, Maus und Tastatur (Ticket 8)

- **Nicht markierbar:** In `style.css` gilt `user-select: none` und `-webkit-touch-callout: none` für die ganze App. Ausnahme sind Eingabefelder (`input`, `textarea`, `select`); die Ausnahme steht spezifischer und nach der allgemeinen Regel, sonst würde sie überstimmt. `touch-action: manipulation` verhindert Zoomen durch Doppeltippen.
- **Kopieren:** `src/copy.ts` (`copyText`) probiert die Zwischenablage (`navigator.clipboard`, braucht https), dann den Notbehelf `document.execCommand("copy")`, sonst meldet es «fehler». Die Oberfläche zeigt dann ein Fenster mit dem Text markiert in einem Feld. Auf dem Papierblatt steht über dem Blatt eine Code-Karte mit «Code kopieren» und «Adresse kopieren» (die Adresse der App, wie im Feld eingestellt); in der Aufgabenansicht gibt es einen kleinen Knopf neben dem Code. Karte und Hinweis sind `noprint`.
- **Maus und Tastatur:** Hover-Regeln stehen nur in `@media (hover:hover)`, damit auf dem Tablet nichts «klebt». Gedrückt gewinnt über Darüber (`.btn:hover:active`). Der Fokusring (4 px, Petrol) gilt für `:focus-visible`.
- **Touchziele:** Knöpfe, Auswahlfelder und die bedienbaren Felder sind mindestens 48 px hoch; der Schalter «Automatisch weiterkommen» hat eine grössere Tippfläche über `::before`. Die gedruckten Felder des Blatts bleiben unverändert (`button.cell`, nicht `.cell`).
- **Kontrast:** Weisse Schrift auf Petrol, graue Zusatzschrift und dunkle Schrift auf Orange kommen auf mindestens 4,5 zu 1. `tests/design.test.ts` prüft die Stilregeln und die Farben.

## Datenschutz

Nichts wird übertragen, es gibt keine Drittanbieter und kein Konto. Das Datum je Aufgabe ist ein Tag ohne Uhrzeit.

## Offen

- Die Reihen-Stationen sind getestet (1500 Aufgaben je Station, gültig, im Zahlenraum, Anker passen), die Eindeutigkeit der Reihen bleibt wie bisher nur über die Anker abgesichert.
- Die Oberfläche (`ui.ts`) ist weiter ungetypt; die Bedienung ist im Browser geprüft, nicht am echten iPad.
- Maus- und Touch-Bedienung, nicht markierbarer Text und Kopier-Knöpfe: Ticket 8.
