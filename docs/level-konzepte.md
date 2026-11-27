# Konzepte für den Aufbau der Level

Grundlage: `docs/spielmechanik.md` (Ist-Zustand und Beobachtungen, Ticket 3). Dieses Dokument schlägt vor. Die Entscheide von Michael stehen in Abschnitt 8. Es gibt zwei Konzepte, einen Vergleich und eine Empfehlung. Die Einschätzungen zu Code und Daten sind eine erste Sicht und müssen vom Architekten bestätigt werden, bevor gebaut wird. Beobachtungen am Kind fehlen noch; Annahmen sind als Annahmen gekennzeichnet.

## 1. Ausgangslage in drei Sätzen

Die Stufen sind heute Bündel aus mehreren Stellschrauben, die sich gleichzeitig ändern, und der Aufstieg verlangt drei makellose Aufgaben in Folge. Fehlerarten wie der Zehnerfehler werden erfasst, steuern aber weder Stufe noch Aufgabenwahl. Zusätzlich fehlt ein sichtbares «Das kannst du jetzt», das echten Fortschritt zeigt.

## 2. Was jedes Konzept leisten soll

Prüffragen, an denen beide Konzepte gemessen werden:

1. **Kleine Schritte:** Ändert sich beim Weiterkommen nur **eine** Sache auf einmal?
2. **Frust:** Gibt es eine sichere Auffangbahn nach Fehlern, und fühlt sich ein Rückschritt nicht wie eine Strafe an?
3. **Langeweile:** Kommt ein Kind weiter, wenn es etwas sicher kann?
4. **Fortschritt sichtbar:** Sieht das Kind (und die Eltern), was neu gelingt?
5. **Zehnerfehler:** Kann die App gezielt dort üben lassen, wo die Fehler entstehen?
6. **Papierblatt:** Bleibt ein Blatt aus einem Code reproduzierbar?
7. **Erweiterbar:** Tragen Stufen 4 bis 6 und neue Übungstypen das Modell?
8. **Keine Dark Patterns:** Kein Druck, keine Verlustangst, keine Zufallsbelohnung.

## 3. Konzept A: Pfad mit Feinstufen

### 3.1 Idee

Die drei Stufen (Klasse 1 bis 3) bleiben als **Welten**. Innerhalb jeder Stufe gibt es **Feinstufen** (a, b, c), und zwischen zwei Feinstufen ändert sich **genau eine** Stellschraube. Der Aufstieg hängt nicht an makellosen Serien, sondern an einer **Sicherheitsregel** über die letzten Aufgaben. Das Kind sieht seinen Weg als **Pfad mit Stationen** (passend zum «Reihenpfad» und zur Mustermauer als Baustein).

### 3.2 Feinstufen (Vorschlag, noch nicht am Generator geprüft)

**Mustermauer**

| Feinstufe | Was ist neu gegenüber der vorigen | Entspricht heute |
|---|---|---|
| 1a | 3 Reihen, Zahlen bis 10, Basis gegeben, ohne Zehnerübergang | neu (Einstieg) |
| 1b | Zahlen bis 20, ohne Zehnerübergang | neu |
| 1c | Zehnerübergang erlaubt | heutige Stufe 1 |
| 2a | Zahlenraum bis 50, ohne Zehnerübergang | neu |
| 2b | Zahlenraum bis 100, ohne Zehnerübergang, eine Lücke in der Basis (Abziehen) | heutige Stufe 2 |
| 2c | Ein Zehnerübergang pro Mauer, nur addieren | neu (Brücke) |
| 3a | Zehnerübergang mit Lücke in der Basis (Abziehen) | neu (Brücke) |
| 3b | 4 Reihen, ohne Zehnerübergang | neu |
| 3c | 4 Reihen, mit Zehnerübergang, 5 bis 6 Lücken | heutige Stufe 3 |

**Reihenpfad**

| Feinstufe | Was ist neu gegenüber der vorigen | Entspricht heute |
|---|---|---|
| 1a | +1 und +2 bis 20, Regel genannt, Bögen gratis auf Anfrage (bis Ticket 5: sichtbar) | Teil der heutigen Stufe 1 |
| 1b | +5 und +10 bis 100 | Teil der heutigen Stufe 1 |
| 1c | alle vier Schritte gemischt | heutige Stufe 1 |
| 2a | rückwärts mit ±2, ±5, ±10 | Teil der heutigen Stufe 2 |
| 2b | ±3 und ±4 | Teil der heutigen Stufe 2 |
| 2c | Bögen kosten 1 Hilfepunkt (bis Ticket 5: verdeckt), alle Schritte vor- und rückwärts | heutige Stufe 2 |
| 3a | Regel genannt, grosse Schritte (6 bis 9) | Teil der heutigen Stufe 3 |
| 3b | Regel entdecken: gleichbleibend | Teil der heutigen Stufe 3 |
| 3c | Regel entdecken: wechselnd | Teil der heutigen Stufe 3 |
| 3d | Regel entdecken: wachsend | heutige Stufe 3 |

Die Feinstufen nutzen den vorhandenen Generator, schalten aber die Stellschrauben einzeln. Die Abgrenzungen sind ein pädagogischer Vorschlag; ob der Generator sie so hergibt, ist zu prüfen.

### 3.3 Weiterkommen

- **Sicher** heisst: 2 oder 3 Sterne (höchstens zwei Fehler oder Hilfen).
- **Aufstieg** in die nächste Feinstufe: von den **letzten 5 Aufgaben** der Feinstufe waren mindestens **4 sicher**, und es wurden mindestens 5 Aufgaben in der Feinstufe gelöst. Ein einzelner Zehnerfehler verhindert den Aufstieg nicht.
- **Auffangbahn:** Zwei Aufgaben in Folge mit 1 Stern führen **eine Feinstufe zurück** («Wir üben noch einen Schritt vorher.»). Nie über eine Welt hinaus nach unten. (Entscheid von Michael: kein automatischer Abstieg, sondern ein Angebot, siehe Abschnitt 8.)
- **Pause statt Frust:** Nach zwei Aufgaben mit 1 Stern in Folge bietet Plitsch an, eine leichtere Aufgabe zu üben oder Pause zu machen. Das Kind entscheidet.
- Das Kind kann eine Feinstufe jederzeit **wiederholen**. Eltern können eine Feinstufe festlegen.
- Annahme, nicht gemessen (Michael hat entschieden, ohne vorherigen Test mit dem Kind zu bauen): «4 von 5» ist streng genug, um Sicherheit zu zeigen, und locker genug, um bei einem einzelnen Fehlertyp weiterzukommen.

### 3.4 Sichtbar für das Kind und die Eltern

- Auf der Startseite ein **Pfad** mit Stationen je Spiel, die aktuelle Station leuchtet, geschaffte Stationen sind ausgefüllt. Beim Erreichen einer Station ein Fenster: «Neu geschafft: Zehnerübergang bis 100».
- Die Elternseite zeigt je Spiel die Station, die letzten 5 Aufgaben mit Sternen und die Fehlerarten je Station.
- Fische und Plitschs Geschenke bleiben wie heute.

### 3.5 Wirkung auf Blatt, Code und Daten (erste Sicht)

- **Papierblatt:** Der Code müsste die Feinstufe tragen, zum Beispiel `M2b-K7P2Q`. Alte Codes (`M2-K7P2Q`) bleiben gültig und bedeuten die Standard-Feinstufe (heutiges Verhalten).
- **Generator:** Jede Feinstufe ist ein Parametersatz (Zahlenraum, Reihen, Zehnerübergang, Lücken, Schritte). Die Mustermauer verwendet die vorhandene Konfiguration, erweitert um Zahlenraum bis 10 und 50 und um «genau ein Zehnerübergang».
- **Daten:** `levels` und `hist` im Speicher müssen eine Feinstufe aufnehmen. Das Format braucht eine Versionsnummer und eine Migration (heutige Stufe n wird zur Standard-Feinstufe).
- **Tests:** je Feinstufe die vorhandenen Prüfungen (lösbar, eindeutig, im Bereich) und neue für die einzelne geänderte Stellschraube.
- **Aufwand (Annahme):** mittel.

### 3.6 Prüffragen

| Frage | Einschätzung |
|---|---|
| 1 Kleine Schritte | ja, je Station eine Änderung |
| 2 Frust | gut: Auffangbahn und Pause-Angebot |
| 3 Langeweile | gut: 4 von 5 genügt |
| 4 Fortschritt sichtbar | gut: Pfad und «Neu geschafft» |
| 5 Zehnerfehler | indirekt: eigene Stationen für den Übergang, aber keine gezielte Übung aus Fehlerart |
| 6 Papierblatt | ja, mit erweitertem Code |
| 7 Erweiterbar | ja: neue Stationen und Welten anhängen |
| 8 Dark Patterns | keine |

## 4. Konzept B: Fähigkeiten-Profil

### 4.1 Idee

Statt fester Stufen gibt es **Fähigkeiten**, zum Beispiel «Addieren bis 20», «Zehnerübergang bis 100», «Abziehen in der Mauer», «Reihe rückwärts», «Wachsende Reihe». Jede Fähigkeit hat eine **Sicherheit** von 0 bis 4 Sternen. Jede gelöste Aufgabe verändert die Sicherheit der Fähigkeiten, die sie braucht, und **Fehlerarten wirken direkt**: ein Zehnerfehler senkt «Zehnerübergang», ein Zahlendreher eine Schreib-Fähigkeit. Die App wählt die nächste Aufgabe aus den Fähigkeiten, die gerade am meisten Übung brauchen.

### 4.2 Aufgabenwahl

- **Aufbau (etwa 60 %):** eine Fähigkeit, die wackelt (Sicherheit 1 bis 2).
- **Festigen (etwa 30 %):** eine Fähigkeit, die schon sitzt (Sicherheit 3 bis 4), damit nichts verlernt wird.
- **Neues (etwa 10 %):** eine Fähigkeit, die gerade freigeschaltet wurde.
- Eine Fähigkeit wird freigeschaltet, wenn ihre Voraussetzung (zum Beispiel «Addieren bis 20» auf Sicherheit 3) erfüllt ist. So bleibt die Reihenfolge pädagogisch gebaut.
- Die Prozente sind Annahmen und gehören in einen Test mit dem Kind.

### 4.3 Sichtbar für das Kind und die Eltern

- **Fähigkeitenkarte** («Lernkarte» aus der Ideensammlung): jede Fähigkeit eine Kachel mit Sternen, neu Geschaffte leuchten kurz auf.
- Die Elternseite zeigt je Fähigkeit Sicherheit und Verlauf über die Zeit («Zehnerübergang: vor zwei Wochen 1 Stern, jetzt 3»). Das ist der klarste Beleg für Lernfortschritt.
- Die Klassenstufe (1 bis 3) bleibt als Gruppierung der Fähigkeiten, nicht als Schalter.

### 4.4 Wirkung auf Blatt, Code und Daten (erste Sicht)

- **Papierblatt:** Der Code müsste die Zusammenstellung beschreiben, zum Beispiel einen Fähigkeiten-Mix in der Stufe oder die Zielfähigkeit (`M-ZUE-K7P2Q`). Ein Blatt bleibt reproduzierbar, ist aber nicht mehr «Stufe 2», sondern «Übung für Zehnerübergang».
- **Generator:** Jede Aufgabe trägt Etiketten (zum Beispiel `addieren`, `zehnerübergang`, `lücke-basis`). Der Generator muss gezielt Aufgaben mit einem Etikett erzeugen können, auch das ist neu.
- **Daten:** Sicherheit je Fähigkeit mit Zeitverlauf, Format versioniert, Migration aus `levels` und `hist`.
- **Tests:** Die Aufgabenwahl ist zufallsabhängig und schwerer zu testen; nötig sind feste Seeds und Prüfung der Auswahlregeln.
- **Aufwand (Annahme):** gross.

### 4.5 Prüffragen

| Frage | Einschätzung |
|---|---|
| 1 Kleine Schritte | ja, jede Aufgabe zielt auf eine Fähigkeit |
| 2 Frust | gut, wenn die Auswahl wackelige Fähigkeiten nicht zu schwer macht; Risiko bei zu vielen «Aufbau»-Aufgaben in Folge |
| 3 Langeweile | gut: «Festigen» und «Neues» mischen |
| 4 Fortschritt sichtbar | sehr gut: Sterne je Fähigkeit und Verlauf |
| 5 Zehnerfehler | sehr gut: wirkt direkt auf die nächste Aufgabe |
| 6 Papierblatt | möglich, aber der Code wird komplexer |
| 7 Erweiterbar | sehr gut: neue Fähigkeiten statt neuer Stufen |
| 8 Dark Patterns | keine, wenn «Sicherheit» nie abgebaut wird, nur durch Fehler schwankt und nie als Strafe dargestellt wird |

## 5. Vergleich

| | Konzept A: Pfad mit Feinstufen | Konzept B: Fähigkeiten-Profil |
|---|---|---|
| Verständlich für das Kind | sehr: ein Weg mit Stationen | gut: Kacheln mit Sternen |
| Vorhersagbar | ja | weniger: Aufgabenwahl ist adaptiv |
| Fortschritt belegbar | gut (Station und Verlauf) | sehr gut (je Fähigkeit) |
| Wirkt auf Zehnerfehler | indirekt | direkt |
| Papierblatt und Code | einfach (Feinstufe im Code) | komplexer (Mix oder Zielfähigkeit) |
| Tests | ähnlich wie heute | aufwendiger |
| Aufwand (Annahme) | mittel | gross |
| Risiko | niedrig | mittel: Auswahlregeln müssen am Kind abgestimmt werden |
| Trägt Stufen 4 bis 6 | ja, Welten anhängen | ja, Fähigkeiten ergänzen |

## 6. Empfehlung

**Konzept A zuerst, mit einem Baustein aus Konzept B vorbereitet.**

1. **Pfad mit Feinstufen und neue Aufstiegsregel (4 von 5)** lösen die zwei Hauptprobleme (Bündelung der Stellschrauben, zu strenger Aufstieg) mit überschaubarem Aufwand und bleiben für das Kind leicht verständlich.
2. Jede Aufgabe bekommt schon jetzt **Etiketten** (welche Fähigkeit sie verlangt). Das kostet wenig, macht die Fehlerauswertung je Fähigkeit möglich und lässt Konzept B später als Auswertung und als Knopf «Gezielt üben» aufsetzen, ohne den Aufbau umzubauen.
3. **«Gezielt üben» als erste Erweiterung:** Häufen sich Zehnerfehler (zum Beispiel drei in einer Einheit), bietet Plitsch fünf Aufgaben mit einer Stufe darunter an, nur mit Zehnerübergang. Das Kind kann ablehnen.
4. Vor dem Bau ein **Test mit der Tochter** an einem Prototyp der Aufstiegsregel: Wie viele Aufgaben braucht sie je Station, und kippt sie in Frust oder Langeweile? (Michael hat entschieden, darauf zu verzichten und gleich zu bauen, siehe Abschnitt 8.)

## 7. Was nicht geklärt ist

- Wie viele Aufgaben ein Kind pro Station tatsächlich löst, ohne zu ermüden (Annahme: 5 bis 10).
- Ob «4 von 5 sicher» für die Tochter passt (Annahme, nicht gemessen).
- Ob der Generator die Feinstufen so hergibt, besonders «Zahlenraum bis 10» und «genau ein Zehnerübergang» in der Mauer (Architekt prüft).
- Wie Stufen 4 bis 6 in dieses Modell passen (nur grob geplant).

## 8. Entscheide von Michael (26. November 2026)

Michael hat die Fragen per Auswahl beantwortet. Die Antworten stehen auch als Kommentare «Koordinator: Entscheid» in Ticket 3.

| Frage | Entscheid |
|---|---|
| Welches Konzept? | **A mit Etiketten und «Gezielt üben»**, wie in Abschnitt 6 empfohlen |
| Soll das Kind den Pfad sehen? | **Ja**, Pfad mit Stationen; die Feinstufen stehen auch auf der Elternseite |
| Wer darf die Feinstufe wählen? | **App und Eltern** entscheiden über das Weiterkommen, das **Kind darf eine geschaffte Station wiederholen** |
| Abstieg automatisch? | **Nein, Angebot statt Automatik**: Nach zwei Aufgaben mit 1 Stern bietet Plitsch eine leichtere Aufgabe oder Pause an, das Kind entscheidet |
| Aufstiegsregel zuerst mit der Tochter testen? | **Nein, gleich bauen** |

Das ist ein Konzept- und Vorgehens-Entscheid und keine Freigabe zum Bauen. Die Umsetzung läuft in Ticket 7. Gebaut wird erst nach dem Dossier (Pädagogin, UX, Architekt, Tester) und Michaels ausdrücklicher Freigabe.
