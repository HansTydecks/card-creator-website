# Card Creator

Eine moderne, webbasierte Anwendung zur Erstellung von professionellen Lernkarten für den Unterricht.

## Features

### ✅ Implementiert (Version 1.0)
- **Projekteinrichtung**: Papierformat (A4/A3) und Kartenlayout auswählen
- **Masterkarte-Design**: Vorder- und Rückseite getrennt gestalten
- **Hintergrund-Gestaltung**: Farben und Texturen (Linien, Punkte, Raster)
- **Text- und Bildfelder**: Einfaches Hinzufügen und Positionieren
- **Einzelkarten-Bearbeitung**: Accordion-Interface für individuelle Karteninhalte
- **PDF-Export**: Grundlegende PDF-Generierung mit jsPDF
- **PWA-Funktionalität**: Offline-fähig nach dem ersten Laden
- **Responsive Design**: Funktioniert auf Desktop und Tablet

### 🔄 In Entwicklung (Nächste Versionen)
- **Erweiterte Positionierung**: Drag & Drop für Elemente
- **Bildupload und -verarbeitung**: Lokale Bildverarbeitung
- **Erweiterte PDF-Layouts**: Professionelle Drucklayouts mit Schnittmarken
- **Vorlagen-System**: Vordefinierte Kartenvorlagen
- **Export-Optionen**: Word-Export und erweiterte PDF-Optionen

## Technologie-Stack

- **Frontend**: Vanilla JavaScript (ES6+), HTML5, CSS3
- **Canvas**: HTML5 Canvas für Kartenvorschau
- **PDF-Generierung**: jsPDF Library
- **PWA**: Service Worker für Offline-Funktionalität
- **Responsive**: CSS Grid und Flexbox

## Installation und Start

1. **Repository klonen oder herunterladen**
```bash
git clone <repository-url>
cd card-creator
```

2. **Lokal starten**
Da es sich um eine reine Client-Side-Anwendung handelt, können Sie sie direkt im Browser öffnen:
- Öffnen Sie `index.html` in einem modernen Browser
- Oder verwenden Sie einen lokalen Server:

```bash
# Mit Python
python -m http.server 8000

# Mit Node.js (http-server)
npx http-server .

# Mit PHP
php -S localhost:8000
```

3. **Im Browser öffnen**
Navigieren Sie zu `http://localhost:8000`

## Workflow

### 1. Projekt einrichten
- Papierformat wählen (A4 oder A3)
- Kartenlayout auswählen (2×2, 2×4, 3×3)
- Anzahl der Karten festlegen

### 2. Masterkarte gestalten
- **Vorderseite designen**: Hintergrundfarbe, Textur, Text- und Bildfelder
- **Rückseite designen**: Separate Gestaltung für die Kartenrückseite
- **Optionen setzen**: Schnittmarken, Kartennummern, Wasserzeichen

### 3. Einzelne Karten bearbeiten
- Für jede Karte individuelle Inhalte eingeben
- Textfelder ausfüllen
- Bilder hochladen (geplant)

### 4. Export
- Vorschau generieren
- PDF herunterladen
- Word-Export (geplant)

## Projektstruktur

```
card-creator/
├── index.html          # Haupt-HTML-Datei
├── styles.css          # Stylesheet
├── app.js              # Hauptanwendungslogik
├── manifest.json       # PWA-Manifest
├── sw.js              # Service Worker
├── README.md          # Diese Datei
└── prompts.md         # Ursprüngliche Anforderungen
```

## Browser-Unterstützung

- Chrome/Edge 80+
- Firefox 75+
- Safari 13+
- Mobile Browser (mit Einschränkungen)

## Entwicklung

### Geplante Erweiterungen

1. **Erweiterte Canvas-Funktionalität**
   - Drag & Drop für Elementpositionierung
   - Visuelle Elementbearbeitung
   - Raster-Snapping

2. **Professionelle PDF-Generierung**
   - Exakte DPI-Berechnung
   - Professionelle Schnittmarken
   - Druckoptimierung

3. **Template-System**
   - Vordefinierte Kartenvorlagen
   - Community-Templates
   - Template-Import/Export

4. **Erweiterte Bildbearbeitung**
   - Bildgrößenanpassung
   - Filter und Effekte
   - Bildoptimierung

### Bekannte Limitationen

- Canvas-Klicks für Positionierung noch nicht vollständig implementiert
- Bildupload funktioniert nur als Platzhalter
- PDF-Layout ist noch vereinfacht
- Keine Drag & Drop-Funktionalität

## Lizenz

MIT License - Siehe LICENSE.md für Details

## Mitwirkende

Entwickelt für den Bildungsbereich - Feedback und Beiträge sind willkommen!
