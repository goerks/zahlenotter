# Bereit und fertig

Zwei Listen mit festen Nummern. Der Koordinator prüft sie vor dem jeweiligen Tor und nennt offene Punkte. Nur Michael kann einen offenen Punkt bewusst übergehen; das steht dann mit Datum und seinen Worten im Ticket. Nachweise werden nie erfunden.

## Bereit zum Bauen (Tor 1)

| Nr. | Prüfpunkt | Nachweis |
|---|---|---|
| DoR-1 | Das Ticket nennt, was sich für das Kind ändert (eine Zeile, in Michaels Worten) | Ticket |
| DoR-2 | Lernziel, Fehlerbilder und Frustgrenzen sind geklärt | Kommentar «Pädagogin: Einschätzung» |
| DoR-3 | Bei Oberfläche: Entwurf für iPad und Desktop, Vorhandenes wiederverwendet | Kommentar «UX: Entwurf» |
| DoR-4 | Technischer Entwurf inklusive Datenformat, Migration, Datenschutz, Grösse und Risiko | Kommentar «Architekt: Technischer Entwurf» |
| DoR-5 | Abnahmekriterien sind nummeriert (AK-n.m) und prüfbar | Ticket |
| DoR-6 | Testfälle zu jedem Kriterium | Kommentar «Tester: Testfälle» |
| DoR-7 | Offene Fragen an Michael sind beantwortet | Ticket |
| DoR-8 | **Michael hat freigegeben** (Datum, seine Worte) | Kommentar «Koordinator: Freigabe» |

## Fertig (Stufen)

### Stufe 1: gebaut (vor der Abnahme)

| Nr. | Prüfpunkt | Nachweis |
|---|---|---|
| DoD-1.1 | Pull Request als Entwurf, Beschreibung deutsch, Verweis auf das Ticket | Pull Request |
| DoD-1.2 | Typcheck, Tests und Build sind grün in der Pipeline | Lauf der Pipeline |
| DoD-1.3 | Zu jedem Abnahmekriterium gibt es einen Test, dessen Name die Nummer trägt | Tests |
| DoD-1.4 | Datenformat: Migration und Test mit alten Daten, App läuft ohne Speicher | Tests |
| DoD-1.5 | Keine Dark Patterns, kein Datenabfluss, keine neuen Abhängigkeiten ohne Begründung | Review Architekt und Pädagogin |
| DoD-1.6 | Tester: Prüfbericht liegt vor, alle Kriterien bestanden oder als offene Handprüfung genannt | Kommentar «Tester: Prüfbericht» |
| DoD-1.7 | UX und Pädagogin haben das Ergebnis gesehen, Befunde sind eingearbeitet oder von Michael entschieden | Review |
| DoD-1.8 | Offene Handprüfungen (echtes iPad, Kind-Test) sind benannt | Pull Request |

### Stufe 2: abgenommen

| Nr. | Prüfpunkt | Nachweis |
|---|---|---|
| DoD-2.1 | Michael hat die Funktion probiert, wenn es das Kind betrifft: **mit dem Kind** (Beobachtungen notiert) | Kommentar «Koordinator: Abnahme» |
| DoD-2.2 | Michaels Worte und Datum stehen im Ticket, Vorbehalte sind benannt | Ticket |

### Stufe 3: abgeschlossen

| Nr. | Prüfpunkt | Nachweis |
|---|---|---|
| DoD-3.1 | Pull Request gemergt, Pipeline auf `main` grün, Veröffentlichung auf Pages erfolgreich | Lauf auf `main` |
| DoD-3.2 | Docs nachgeführt (`docs/lernziele.md`, `docs/architektur.md` bei Bedarf) | Commit |
| DoD-3.3 | Ticket geschlossen mit Verweis auf den Pull Request | Ticket |
