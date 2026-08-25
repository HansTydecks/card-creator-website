# Card Creator

Ein kostenloses Werkzeug, um Lernkarten für den Unterricht zu gestalten und zu drucken – direkt im Browser, ohne Konto, ohne Server.

## Konzept

1. **Format wählen**: Papiergröße (A4/A3) und Kartenraster (2×2, 2×4, 3×3 oder eigene Kartengröße).
2. **Masterkarte gestalten**: Hintergrund, Textur, Rahmen, Wasserzeichen, Kartennummer und Textfelder/Bildfelder für Vorder- und Rückseite einmal festlegen – das Layout gilt für alle Karten.
3. **Inhalte eingeben**: Jede Karte einzeln ausfüllen, oder eine Tabelle (aus Excel/Sheets kopiert) importieren.
4. **Exportieren**: Als druckfertiges PDF, als Word-Dokument, als PNG-Bilder (ZIP) oder die Masterkarte als SVG.

Alle Daten bleiben lokal im Browser (localStorage + Autospeicherung) oder in Dateien, die du selbst herunterlädst – es gibt keinen Server und kein Tracking (siehe [Datenschutzerklärung](datenschutz.html)).

## Features

- Masterkarten-Editor mit Maus-, Touch- und Tastatursteuerung (Ziehen, Ecken-Handles zum Skalieren, Pfeiltasten zum Nudge)
- Barrierefreiheit: Tastaturbedienbarkeit, sichtbare Fokus-Stile, Screenreader-Ankündigungen, `prefers-reduced-motion`
- Undo/Redo, Autospeicherung im Browser, Projekt als JSON speichern/laden
- Karteninhalte einzeln oder per Tabellen-Import (CSV/aus Excel eingefügt) befüllen
- Export als PDF (mit Schnittmarken, automatisch kontrastierender Farbe, Duplex-Spiegelung für Vorder-/Rückseiten-Druck), Word, PNG-ZIP und SVG
- Optionale Kartennummer im Rand und Seriennummer-Wasserzeichen
- Helles und dunkles Farbschema (folgt den Systemeinstellungen)
- Installierbar als PWA, funktioniert offline nach dem ersten Laden

## Technologie

- Vanilla TypeScript (keine UI-Framework-Abhängigkeit), gebaut mit [Vite](https://vitejs.dev/)
- Eine zentrale Rendering-Engine (`src/render/scene.ts`) erzeugt eine geräteunabhängige "Szene" aus Zeichenbefehlen, die von der Live-Vorschau, dem PDF-Export (`jsPDF`), dem Bild-Export (Canvas) und dem SVG-Export identisch interpretiert wird – Layout und Vorschau können also nie auseinanderlaufen.
- `docx` für Word-Export, `jszip` für ZIP-Bündelung, `vite-plugin-pwa` für Offline-Unterstützung

## Entwicklung

```bash
npm install
npm run dev        # Entwicklungsserver
npm run typecheck  # TypeScript prüfen
npm run build       # Produktions-Build nach dist/
npm run preview     # Produktions-Build lokal testen
```

Wird automatisch per GitHub Actions (`.github/workflows/deploy.yml`) auf GitHub Pages veröffentlicht, sobald auf `main` gepusht wird.

## Projektstruktur

```
src/
├── state/     Projekt-Datenmodell, Store, Undo/Redo, Autospeicherung, Speichern/Laden
├── render/    Gemeinsame Rendering-Engine + Ziel-Adapter (Canvas/PDF/SVG)
├── export/    PDF-, Word-, Bild- und SVG-Export
├── import/    Tabellen-Import (CSV/TSV)
├── ui/        Bedienoberfläche (Tabs, Masterkarten-Editor, Karteninhalte, Export)
├── utils/     Farb-, Bild- und DOM-Hilfsfunktionen
└── styles/    Design-Tokens und Komponenten-Styles
```

## Lizenz

MIT
