# Zahlenotter

Kleine Web-App zum Üben von Zahlenmustern (Zahlenmauern, Zahlenreihen), Klasse 1 bis 3, gedacht für das Tablet. Läuft ohne Konto und ohne Server, der Fortschritt bleibt auf dem Gerät.

Eine Aufgabe ist vollständig durch **Typ + Stufe + Seed** beschrieben (Code zum Beispiel `M2-K7P2Q`). Daraus entstehen Aufgabe, Oberfläche und Druckblatt aus demselben Code.

## Entwickeln

```bash
npm install
npm test          # Vitest: Logik und QR
npm run typecheck
npm run dev
npm run build     # Basispfad /zahlenotter/ (GitHub Pages), lokal: BASE=/ npm run build
```

Ein Pull Request läuft durch Typcheck, Tests und Build (`.github/workflows/pages.yml`). Auf `main` wird zusätzlich auf GitHub Pages veröffentlicht (einmalig: Repo-Einstellungen, Pages, Source «GitHub Actions»).

## Aufbau

- `src/logic.ts` Generator, Solver, Prüfung, Hilfen, Anpassung der Stufe (reine Logik)
- `src/qr.ts` eigener QR-Encoder ohne Abhängigkeiten
- `src/ui.ts`, `src/style.css` Oberfläche (aus dem Prototyp übernommen, noch ungetypt)
- `tests/` Vitest; `prototype-gleich.test.ts` belegt, dass die Logik wie der Prototyp arbeitet
- `prototype/src/logic.js` Auszug der ursprünglichen Prototyp-Logik, nur für diesen Vergleich
