# Spielmechanik von Zahlenotter

Stand: Verhalten der App auf `main` (Commit `a401555`). Alle Zahlen zu den Stufen sind **gemessen**: je 5000 Aufgaben pro Spiel und Stufe aus dem Generator in `src/logic.ts`. Beschrieben wird, was die App heute tut, nicht, was sie tun sollte; Beobachtungen stehen am Ende (Abschnitt 8).

Die zwei Spiele:

- **Mustermauer** (Zahlenmauern): Jeder Stein ist die Summe der zwei Steine direkt darunter.
- **Reihenpfad** (Zahlenreihen): Acht Felder, ein Teil ist vorgegeben, das Kind setzt die Reihe fort.

## 1. Gemeinsamkeiten

### 1.1 Eine Aufgabe ist Typ + Stufe + Seed

- Typ `M` (Mauer) oder `R` (Reihe), Stufe 1 bis 3, Seed aus fünf Zeichen. Der Zufall ist deterministisch (`xmur3` und `mulberry32`): gleicher Typ, gleiche Stufe und gleicher Seed ergeben immer dieselbe Aufgabe.
- Der **Code** hat die Form `<Typ><Stufe>-<5 Zeichen>`, zum Beispiel `M2-K7P2Q`. Das Alphabet lässt verwechselbare Zeichen weg (kein I, O, 0, 1).
- Aus demselben Code entstehen Aufgabe, Oberfläche und Druckblatt.

### 1.2 Aufbau jeder Aufgabe

Jede Aufgabe hat eine vollständige Lösung (`sol`) und eine Liste, welche Felder vorgegeben sind (`given`). Alle anderen Felder sind **Lücken**, die das Kind füllt. Der Generator setzt eine Lücke nur, wenn die Aufgabe dadurch lösbar bleibt (Mauer: Solver prüft Eindeutigkeit; Reihe: feste Ankerfelder, siehe 3.3).

### 1.3 Eingabe

- Ziffernblock auf dem Bildschirm (0 bis 9, Löschen, Feld zurück und vor). Am Desktop gehen auch Zifferntasten, Rücktaste, Pfeile, Tab und Enter.
- Höchstens drei Ziffern je Feld. Eine führende Null wird ersetzt.
- Tippt das Kind in ein **falsches** (orangefarbenes) Feld, wird die alte Zahl ersetzt, nicht erweitert.
- Das aktive Feld ist orange umrandet. Beim Start ist es das erste offene Feld, nach einer falschen Prüfung das erste falsche Feld.

### 1.4 Prüfen

- «Prüfen» wertet erst, wenn **alle** Lücken ausgefüllt sind. Sonst sagt Plitsch: «Fülle erst alle leeren Felder aus, dann prüfe ich.»
- Richtige Felder werden grün und gesperrt. Falsche werden **orange**, nie rot, und bleiben bearbeitbar.
- Ein Fehler zählt einmal je Paar aus Feld und eingetragener Zahl. Dieselbe falsche Zahl im selben Feld zählt beim zweiten Prüfen nicht nochmals.
- Jeder gezählte Fehler wird einer **Fehlerart** zugeordnet (Reihenfolge der Prüfung):
  1. **Zehnerfehler**: Abstand zur Lösung ist ein Vielfaches von 10, aber nicht 0 (zum Beispiel 27 statt 17).
  2. **Knapp daneben**: Abstand genau 1.
  3. **Zahlendreher**: Ziffern vertauscht (61 statt 16).
  4. **Andere**.
- Die Fehlerarten werden in der Statistik gezählt und fliessen in den Hinweistext («Schau bei den Zehnern nochmal genau hin.»), aber **nicht** in die Stufenanpassung.

### 1.5 Hilfen nur auf Anfrage (Ticket 5)

Keine Hilfe ist von Anfang an sichtbar. Das Kind hat zwei Knöpfe; ein Schild am Knopf sagt vorher, ob die Hilfe «gratis» ist oder «1 Hilfepunkt» kostet.

**Knopf «Hilfe»** (zwei Stufen, die Zählung beginnt nach jeder Prüfung neu):

| Stufe | Was passiert | Kostet |
|---|---|---|
| 1 | Das nächste sinnvolle Feld wird markiert und pulsiert, Plitsch sagt, dass ein zweiter Druck die Zahl verrät | nichts |
| 2 | Das Feld wird aufgedeckt und gilt als richtig | 1 Hilfepunkt |

**Knopf «Bögen zeigen»** (Reihe): Die Bögen mit den Schritten erscheinen und lassen sich mit «Bögen ausblenden» wieder wegnehmen. Bei verdeckter Regel erscheinen sie nur zwischen zwei bekannten Zahlen (vorgegeben oder richtig gelöst). In den Stationen 1a bis 2b gratis, ab 2c 1 Hilfepunkt, je Aufgabe nur einmal.

**Knopf «Rechnung zeigen»** (Mauer): Über der Mauer erscheint eine Karte mit der Rechnung für den gewählten Stein, zum Beispiel «21 + 20 = ?» oder «32 − 21 = ?». Die zwei beteiligten Steine leuchten, der gesuchte ist orange umrandet. Lässt sich der gewählte Stein noch nicht ausrechnen, gilt die Rechnung für den nächsten möglichen, und dieser wird gewählt. Kostet 1 Hilfepunkt je Stein (ausblenden und wieder zeigen kostet nichts). Ist der Stein richtig gelöst, verschwindet die Karte. Der Platz für die Karte bleibt frei, damit die Mauer nicht springt.

Im Prüfmodus (Papierblatt prüfen) gibt es keine Hilfen.

Die Statistik «Hilfen genutzt» zählt jeden Druck auf «Hilfe» und jedes Einblenden von Bögen oder Rechnung, auch die kostenlosen.

### 1.6 Sterne und Fische

- Pro gelöster Aufgabe: `Fehler + Hilfepunkte`. 0 ergibt **3 Sterne**, 1 bis 2 ergibt **2 Sterne**, 3 oder mehr ergibt **1 Stern**. Die Zeit zählt nicht.
- **Sterne = Fische.** Fische sind die Währung für den Begleiter.

### 1.7 Begleiter «Plitsch» und Geschenke

- Plitsch wächst mit den gesammelten Fischen: ab 6 Fischen ein Schal, ab 15 eine Brille, ab 30 eine Krone. Auf der Startseite steht, wie viele Fische bis zum nächsten Geschenk fehlen.
- Plitsch reagiert mit Stimmung (froh, nachdenklich, «oops», jubelnd) und kurzen Sätzen.

### 1.8 Übungseinheit

- Eine Einheit hat **5 Aufgaben** (Punkte oben zeigen den Stand). Danach kommt eine Zusammenfassung mit den Sternen und dem Satz «Zeit für eine kleine Pause?». «Noch 5 Aufgaben» startet eine neue Einheit.
- Nach jeder gelösten Aufgabe erscheint ein Fenster mit Sternen, Fischen und gegebenenfalls Hinweis auf neue Stufe oder neues Geschenk.
- Jede Aufgabe verwendet die **aktuelle** Stufe des Spiels. Ändert sich die Stufe mitten in der Einheit, gilt sie ab der nächsten Aufgabe.

### 1.9 Papierblatt und Prüfmodus

- Ein Blatt hat **4 Mauern** oder **6 Reihen**. Aufgabe *i* hat den Seed `<Code>/<i>`. Auf dem Blatt stehen Code und QR-Code (`<Basisadresse>#<Code>`).
- Am Tablet trägt das Kind die Zahlen vom Papier ein (Code tippen oder QR scannen) und prüft alle Aufgaben mit «Alles prüfen». Es gibt dort keine Hilfen.
- Sind alle Aufgaben richtig, bekommt das Kind **einmal je Blatt** die Fische (Summe der Sterne aller Aufgaben) und die Aufgaben zählen als gelöst.

### 1.10 Stufen, Anpassung und Speicher

- Beide Spiele haben **je eine eigene Stufe** (1 bis 3, Klassen 1 bis 3). Das Kind wählt sie auf der Startseite (dabei wird der Verlauf geleert) oder die App passt sie an (Abschnitt 4).
- Die Elternseite zeigt gelöste Aufgaben, Fische, Hilfen, Fehlerarten und eine Empfehlung nach der häufigsten Fehlerart.
- Alles liegt nur lokal im `localStorage` (Schlüssel `zahlenotter.proto.v1`): Stufen, Verlauf der Sterne, Fische, Statistik, Einstellung «automatisch anpassen» und Basisadresse. Fällt der Speicher aus, läuft die App ohne Fortschritt weiter.

### 1.11 Was beide Spiele unterscheidet

| | Mustermauer | Reihenpfad |
|---|---|---|
| Denkaufgabe | Summen und Differenzen in einer Pyramide | Muster erkennen und fortsetzen |
| Hilfe auf Anfrage | Rechnung über der Mauer (1 Hilfepunkt) | Bögen mit den Schritten (bis 2b gratis, ab 2c 1 Hilfepunkt) |
| Regel | immer dieselbe (oben = links + rechts) | genannt oder zu entdecken (Stufe 3) |
| Blatt | 4 Aufgaben | 6 Aufgaben |
| Eindeutigkeit | genau eine Lösung, vom Solver geprüft | genau eine Lösung nur über Anker abgesichert |

## 2. Mustermauer

### 2.1 Regeln

Jeder Stein ist die Summe der zwei Steine direkt darunter. Das Kind rechnet von unten nach oben (addieren) oder von oben nach unten (abziehen). Der Solver nutzt `oben = links + rechts` und füllt so lange Lücken, bis alles bestimmt ist. Eine Lücke wird nur gesetzt, wenn die Mauer danach noch vollständig und eindeutig lösbar ist.

### 2.2 Stufen (gemessen)

| | Stufe 1 (Klasse 1) | Stufe 2 (Klasse 2) | Stufe 3 (Klasse 3) |
|---|---|---|---|
| Reihen | 3 (6 Steine) | 3 (6 Steine) | 4 (10 Steine) |
| Zahlenraum (Spitze) | 4 bis 20 | 19 bis 100 | 26 bis 100 |
| Zahlen der Basis | 1 bis 7 | 3 bis 40 | 3 bis 28 |
| Anzahl Lücken | 2 (50 %) oder 3 (50 %) | immer 3 | 5 (35 %) oder 6 (65 %) |
| Lücken in der Basis | nie (Basis immer gegeben) | höchstens 1; in 94 % genau 1 | höchstens 2; in 84 % genau 2 |
| Rechenart | nur addieren | meist auch abziehen (94 %) | abziehen nötig (99 %) |
| Zehnerübergang | in 88 % mindestens eine Addition mit Übergang (zum Beispiel 7 + 6) | nie, in keiner Beziehung | immer mindestens einer, meist 3 |

Hinweis zum Zehnerübergang: Gemeint ist, dass die Einerziffern zweier Steine zusammen 10 oder mehr ergeben. Bei Stufe 3 zählt jede Beziehung der Mauer, auch zwischen vorgegebenen Steinen; das Kind muss den Übergang nicht in jeder Aufgabe selbst rechnen.

## 3. Reihenpfad

### 3.1 Regeln

Eine Reihe hat **8 Felder**. Einzelne Felder sind vorgegeben, den Rest füllt das Kind. Zwischen zwei Feldern zeigt ein Bogen den **Schritt** (+2, −5 …). Der Text sagt entweder die Regel («Zähle rückwärts in 3er-Schritten.») oder fordert dazu auf, sie zu finden («Finde die Regel und setze die Reihe fort.»). Nach dem Lösen werden alle Bögen sichtbar, und bei verdeckter Regel nennt Plitsch sie («Die Regel war: +2, +3, +2, +3 …»).

### 3.2 Stufen (gemessen)

| | Stufe 1 (Klasse 1) | Stufe 2 (Klasse 2) | Stufe 3 (Klasse 3) |
|---|---|---|---|
| Schritte | +1, +2, +5, +10 (je 25 %) | ±2, ±3, ±4, ±5, ±10 (je etwa 10 %) | gleichbleibend 50 %, wechselnd 25 %, wachsend 25 % |
| Richtung | nur vorwärts | 50 % rückwärts | 31 % rückwärts |
| Zahlenraum | +1 und +2 bis 20, +5 bis 50, +10 bis 100; Start 0 bis 30 | bis 100, Start 0 bis 100 | bis 100, Start 0 bis 100 |
| Regel | immer genannt | immer genannt | nur in 20 % genannt, 80 % zu entdecken |
| Bögen | auf Anfrage, gratis (bis Ticket 5 von Anfang an sichtbar) | auf Anfrage für 1 Hilfepunkt, nach dem Lösen alle | wie Stufe 2 |
| Vorgegebene Felder | 3 (Felder 1, 2 und 5, 6 oder 8) | 3 an wechselnden Stellen | 3 oder 4 |
| Lücken | immer 5 | immer 5 | 4 (50 %) oder 5 (50 %) |

Stufe 3 im Einzelnen:

- **Gleichbleibend:** Schritte 3, 4, 6, 7, 8 oder 9, vorwärts oder rückwärts, in 40 % davon wird die Regel genannt.
- **Wechselnd:** zwei Schritte im Wechsel, zum Beispiel +2, +3, +2, +3 oder +5, −2, +5, −2. Vier Felder sind vorgegeben (Felder 1, 2, 3 und 8).
- **Wachsend:** Schritte, die jedes Mal grösser werden (+1, +2, +3 …, +1, +3, +5 …, +2, +4, +6 …), in 25 % rückwärts. Vier Felder sind vorgegeben (Felder 1 bis 4).

### 3.3 Eindeutigkeit

Die Prüfung erwartet genau die gespeicherte Lösung. Dass keine zweite sinnvolle Fortsetzung möglich ist, sichern nur die festen Ankerfelder ab, es gibt keinen Regel-Solver. Eine Folge, die das Kind anders, aber sinnvoll fortsetzt, würde als falsch gewertet.

## 4. Wie das Level vorwärts kommt

Nach **jeder gelösten Aufgabe** werden die Sterne in den Verlauf des Spiels eingetragen (Mauer und Reihe haben je einen eigenen Verlauf). Ist «Stufe automatisch anpassen» eingeschaltet (Standard), prüft die App:

| Bedingung | Folge |
|---|---|
| Die letzten **3** Aufgaben alle mit **3 Sternen** und Stufe unter 3 | **Eine Stufe höher**. Hinweis: «Stufe 2 freigeschaltet!» |
| Die letzten **2** Aufgaben beide mit **1 Stern** und Stufe über 1 | **Eine Stufe tiefer**. Hinweis: «Wir üben noch ein bisschen auf Stufe 1.» |
| sonst | Stufe bleibt |

Nach jedem Stufenwechsel wird der Verlauf des Spiels geleert. Wählt man die Stufe von Hand, wird der Verlauf ebenfalls geleert. Es gibt keine feste Mindestzahl an Aufgaben pro Stufe, keinen Abschluss einer Stufe und keine Stufe über 3.

### 4.1 Beispielverläufe

Die App schaut nur auf die **letzten** Aufgaben des Verlaufs, die seit dem letzten Stufenwechsel gelöst wurden.

| Verlauf der Sterne (Mauer, Stufe 2) | Ergebnis |
|---|---|
| 3, 3, 3 | Stufe 3 |
| 3, 3, 2 | bleibt auf Stufe 2: Die letzte Aufgabe hatte nur 2 Sterne |
| 3, 3, 2, 3, 3 | bleibt auf Stufe 2: Die letzten drei sind 2, 3, 3, also nicht alle makellos. Erst mit einer weiteren 3 wären die letzten drei 3, 3, 3 |
| 2, 1, 1 | Stufe 1 |
| 1, 2, 1 | bleibt auf Stufe 2 (nur direkt aufeinanderfolgende 1-Stern-Aufgaben zählen) |
| 3, 3, 1, 1 | Stufe 1 (die letzten zwei sind 1 Stern) |

## 5. Der Schweregrad entsteht aus diesen Stellschrauben

| Stellschraube | Mustermauer | Reihenpfad |
|---|---|---|
| Zahlenraum | bis 20, bis 100 | bis 20, 50 oder 100 (je nach Schritt) |
| Grösse | 3 oder 4 Reihen | immer 8 Felder |
| Rechenart | nur addieren, abziehen in der Basis, abziehen oben | vorwärts, rückwärts, wechselnd, wachsend |
| Zehnerübergang | Stufe 1 meist ja (88 %), Stufe 2 nie, Stufe 3 immer | nicht gesteuert |
| Anzahl und Ort der Lücken | 2 bis 6, Basis-Lücken ab Stufe 2 | feste 5 (Stufe 1 und 2), 4 oder 5 (Stufe 3) |
| Schrittgrösse | nicht vorhanden | 1 bis 10 |
| Regel sichtbar oder verdeckt | nicht vorhanden | Stufe 1 und 2 genannt, Stufe 3 meist verdeckt |
| Hilfsmittel | Hilfe wie überall, Rechnung auf Anfrage | Bögen auf Anfrage, gratis oder für 1 Hilfepunkt |

Die Stufe ist heute ein **Bündel** dieser Stellschrauben. Beim Wechsel von einer Stufe zur nächsten ändern sich mehrere gleichzeitig.

## 6. Ein Durchlauf in Schritten

1. Das Kind wählt ein Spiel und eine Stufe (oder lässt die Voreinstellung).
2. Die App erzeugt einen neuen Code und daraus die Aufgabe.
3. Das Kind füllt die Lücken, bei Bedarf mit Hilfe.
4. «Prüfen»: grün, orange oder «fülle erst alle Felder aus».
5. Gelöst: Sterne, Fische, Fenster mit Rückmeldung. Gegebenenfalls Stufenwechsel oder neues Geschenk.
6. Nach 5 Aufgaben Zusammenfassung und Pausenhinweis.

## 7. Quellen im Code

- `src/logic.ts`: Generator, Solver, Prüfung, Fehlerarten, Hilfen, Sterne, Anpassung
- `src/ui.ts`: Ablauf, Einheit, Fische, Begleiter, Elternseite, Speicher
- `tests/logic.test.ts`: die Regeln als Tests (Lösbarkeit, Bereiche, Hilfen, Anpassung)

## 8. Beobachtungen und Lücken

Keine Beschlüsse, sondern Beobachtungen, die in `docs/level-konzepte.md` aufgegriffen werden.

1. **Die Stufen sind Bündel.** Von Mauer Stufe 2 nach 3 ändern sich Höhe (3 auf 4 Reihen), Zehnerübergang (nie auf immer), Anzahl Lücken (3 auf 5 bis 6) und Basis-Lücken (1 auf 2) auf einmal. Wer in Stufe 3 scheitert, weiss nicht, woran es liegt.
2. **Die Reihenfolge ist nicht durchgehend steigend.** Mauer Stufe 1 hat in 88 % der Aufgaben einen Zehnerübergang, Stufe 2 nie. Das ist plausibel (anderer Zahlenraum), aber nicht einfacher.
3. **Der Aufstieg ist streng.** Dreimal makellos hintereinander ist nötig. Ein einziger Zehnerfehler macht aus 3 Sternen 2 Sterne und unterbricht die Serie. Ein Kind, das wenig, aber immer denselben Fehler macht, bleibt so lange auf der Stufe, bis es zufällig dreimal fehlerfrei bleibt.
4. **Abstieg und Aufstieg schauen nur auf Sterne.** Die Fehlerart (Zehnerfehler) wird gezählt, steuert aber weder Stufe noch Aufgaben.
5. **Es gibt keine Sicherheit pro Fähigkeit.** Die Stufe sagt nichts darüber, ob das Kind Zehnerübergänge sicher kann.
6. **Keine Mindestzahl, kein Abschluss.** Die Stufe kann nach drei Aufgaben wechseln und es gibt kein «Stufe geschafft».
7. **Nur drei Stufen.** Stufe 3 ist die Obergrenze, Stufen 4 bis 6 sind geplant und nicht gebaut.
8. **Mauer Stufe 2 hat immer genau 3 Lücken.** Die Konfiguration erlaubt 3 bis 4, ausgeschöpft wird nur 3.
9. **Reihe: Eindeutigkeit nur über Anker.** Siehe 3.3. Ein Regel-Solver fehlt.
10. **Reihe Stufe 1 hat immer 5 Lücken und nie rückwärts**, Stufe 2 immer 5. Die Anzahl Lücken ändert sich bis Stufe 3 kaum.
11. **Das Speicherformat hat keine Versionsnummer.** Der Schlüssel enthält `v1`, die gespeicherten Daten tragen kein Versionsfeld. Jede Änderung an Stufen oder Verlauf braucht eine Migration (Regel in `CLAUDE.md`).
12. **Das Papierblatt kennt nur die Stufe.** Der Code trägt eine einstellige Stufe; feinere Abstufungen bräuchten ein neues Codeformat.
13. **Nicht gemessen:** wie oft Kinder die Hilfe nutzen, wie lange eine Aufgabe dauert, wie sich die Stufen in der Praxis anfühlen. Das zeigt nur ein Test mit dem Kind.
