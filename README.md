# Card Creator - Vollversion 3.0

Eine professionelle, webbasierte Anwendung zur Erstellung von hochwertigen Lernkarten für den Unterricht.

## 🎯 Features - Vollversion 3.0

### ✅ **Core-Funktionalität**
- **🎨 Erweiterte Element-Bearbeitung**: Vollständiges Properties Panel mit allen Formatierungsoptionen
- **↩️ Undo/Redo System**: Unbegrenzte Rückgängig/Wiederholen-Funktionen
- **💾 Projekt Speichern/Laden**: JSON-basierte Projektverwaltung
- **📤 Erweiterte Export-Optionen**: PDF, PNG, SVG, Word, Bilder-ZIP
- **🎭 6 Professionelle Templates**: Blank, Karteikarte, Quiz, Vokabel, Mathe, Timeline

### ✨ **Erweiterte Design-Tools**
- **🖱️ Drag & Drop**: Intuitive Elementpositionierung
- **⌨️ Keyboard-Shortcuts**: Präzise Steuerung mit Pfeiltasten
- **📐 Raster-System**: Automatische Ausrichtung und Snapping
- **🎨 Vollständige Textformatierung**: Schriftarten, Stile, Farben, Effekte
- **🖼️ Erweiterte Bildbearbeitung**: Upload, Resize, Border-Radius, Transparenz
- **🔄 Transformationen**: Rotation und Transparenz für alle Elemente

### 🏗️ **Layer-Management**
- **📊 Z-Index Kontrolle**: Elemente nach vorne/hinten verschieben
- **👁️ Visuelle Selektion**: Handles und Highlighting
- **🎯 Präzise Positionierung**: Pixel-genaue Kontrolle
- **📏 Ausrichtungs-Tools**: Links, zentriert, rechts ausrichten

### 📄 **Professionelle PDF-Generierung**
- **📐 Exakte Layouts**: Korrekte DPI und Seitenverhältnisse
- **✂️ Schnittmarken**: Professionelle Druckmarkierungen
- **🔄 Automatische Spiegelung**: Rückseiten korrekt für Doppelseitendruck
- **📊 Metadaten**: Vollständige PDF-Eigenschaften

### 🎨 **Template-System**
1. **📝 Karteikarte**: Klassisches Frage/Antwort-Format
2. **❓ Quiz**: Multiple Choice mit Antworten
3. **🌍 Vokabel**: Zweisprachig mit Bildunterstützung
4. **🧮 Mathe**: Mathematische Aufgaben und Lösungen
5. **📅 Timeline**: Historische Ereignisse mit Daten
6. **⚪ Blanko**: Völlig freie Gestaltung

## 🚀 **Technologie-Stack**

- **Frontend**: Vanilla JavaScript (ES6+), HTML5 Canvas, CSS3 Grid/Flexbox
- **PDF-Export**: jsPDF mit erweiterten Layouts
- **Bildverarbeitung**: Canvas-basierte Optimierung
- **PWA**: Service Worker für Offline-Funktionalität
- **Responsive**: Touch-optimiert für Mobile und Tablet

## 📱 **Browser-Unterstützung**

- ✅ Chrome/Edge 90+
- ✅ Firefox 88+  
- ✅ Safari 14+
- ✅ Mobile Browser (Touch-optimiert)

## 🎮 **Bedienung - Vollversion**

### **Maus-Steuerung:**
- **Einfach-Klick**: Element auswählen
- **Drag & Drop**: Element verschieben mit visueller Rückmeldung
- **Hover**: Cursor-Feedback für interaktive Elemente

### **Tastatur-Shortcuts:**
- **Pfeiltasten**: Element verschieben (Shift = Pixel-genau)
- **Entf**: Ausgewähltes Element löschen
- **Strg+Z**: Rückgängig (mit vollständiger History)
- **Strg+Y**: Wiederholen
- **Tab**: Zwischen Elementen wechseln

### **Properties Panel:**
- **Position & Größe**: Exakte numerische Eingabe
- **Textformatierung**: Schriftart, Größe, Stil, Ausrichtung
- **Farben**: Text, Hintergrund, Rahmen mit Color-Picker
- **Effekte**: Rotation, Transparenz, Schatten
- **Layer-Kontrolle**: Z-Index Management

### **Export-Optionen:**
- **📄 PDF**: Professionelle Drucklayouts
- **🖼️ PNG**: Hochauflösende Einzelkarten
- **📐 SVG**: Vektorbasierte Grafiken
- **📄 Word**: Dokumentenformat (geplant)
- **📦 ZIP**: Alle Karten als Bilder

## 🏆 **Anwendungsfälle**

### **Bildungsbereich:**
✅ **Grundschule**: Mathematik, Deutsch, Sachkunde  
✅ **Weiterführende Schulen**: Fremdsprachen, Geschichte, Naturwissenschaften  
✅ **Berufsbildung**: Fachbegriffe, Prozesse, Sicherheitsregeln  
✅ **Hochschule**: Definitionen, Formeln, Konzepte  

### **Training & Entwicklung:**
✅ **Unternehmen**: Produktschulung, Compliance, Onboarding  
✅ **Coaching**: Soft Skills, Leadership, Kommunikation  
✅ **Zertifizierung**: Prüfungsvorbereitung, Standards  

### **Privat:**
✅ **Eltern**: Lernhilfen für Kinder  
✅ **Studenten**: Prüfungsvorbereitung  
✅ **Hobbys**: Sprachen lernen, Wissenssammlung  

## 📁 **Projektstruktur - Vollversion**

```
card-creator/
├── index.html          # Haupt-HTML mit erweiterten UI-Komponenten
├── styles.css          # Vollständiges Stylesheet (1000+ Zeilen)
├── app.js              # Erweiterte Anwendungslogik (2000+ Zeilen)
├── manifest.json       # PWA-Manifest
├── sw.js              # Service Worker für Offline-Funktionalität
├── README.md          # Vollständige Dokumentation
└── prompts.md         # Ursprüngliche Anforderungen
```

## 🔧 **Installation & Start**

### **Lokale Entwicklung:**
```bash
# Repository klonen
git clone <repository-url>
cd card-creator

# Lokalen Server starten (empfohlen)
python -m http.server 8000
# Oder mit Node.js
npx http-server .

# Im Browser öffnen
http://localhost:8000
```

### **Production Deployment:**
- Direkt auf Webserver deployen (statische Dateien)
- CDN-Unterstützung für bessere Performance
- HTTPS erforderlich für PWA-Features

## 📋 **Workflow - Vollversion**

### **1. Projekt Setup (30 Sekunden)**
- Papierformat wählen (A4/A3)
- Layout auswählen (2×2, 2×4, 3×3)
- Template wählen oder blanko starten
- Kartenzahl festlegen

### **2. Masterkarte Design (2-5 Minuten)**
- **Vorderseite gestalten**: Template anpassen oder von Grund auf designen
- **Rückseite gestalten**: Separates Design oder gespiegelt
- **Elemente hinzufügen**: Text- und Bildfelder positionieren
- **Formatierung**: Schriftarten, Farben, Effekte anwenden

### **3. Inhalt eingeben (5-10 Minuten)**
- **Accordion-Interface**: Jede Karte einzeln bearbeiten
- **Batch-Import**: Inhalte aus Textdateien (geplant)
- **Bildupload**: Fotos und Grafiken einbinden
- **Vorschau**: Live-Update während der Bearbeitung

### **4. Export & Nutzung (1 Minute)**
- **Vorschau generieren**: Vollständige PDF-Ansicht
- **Export wählen**: PDF für Druck, PNG für Digital
- **Projekt speichern**: Für spätere Bearbeitung
- **Drucken**: Direkt oder über Druckerei

## 🔮 **Roadmap - Zukünftige Versionen**

### **Version 3.1 (Geplant)**
- **📊 Batch-Import**: CSV/Excel-Import für Massenerstellung
- **🎨 Erweiterte Templates**: Fachspezifische Vorlagen
- **🔤 Font-Upload**: Eigene Schriftarten verwenden
- **📱 Mobile App**: Native iOS/Android Apps

### **Version 3.2 (Geplant)**
- **☁️ Cloud-Sync**: Projekte online speichern und teilen
- **👥 Kollaboration**: Gemeinsames Bearbeiten von Projekten
- **🎯 AI-Unterstützung**: Automatische Inhaltsvorschläge
- **📈 Analytics**: Nutzungsstatistiken und Optimierungen

## 📄 **Lizenz**

MIT License - Kostenlos für Bildungszwecke und kommerzielle Nutzung

## 🤝 **Mitwirkende**

Entwickelt für den Bildungsbereich - **Feedback und Beiträge sind herzlich willkommen!**

### **Support & Community:**
- 🐛 **Bug Reports**: GitHub Issues
- 💡 **Feature Requests**: GitHub Discussions  
- 📧 **Support**: E-Mail Support für Bildungseinrichtungen
- 🎓 **Workshops**: Schulungen für Lehrkräfte verfügbar

---

**Card Creator 3.0** - *Professionelle Lernkarten in wenigen Minuten erstellen* 🎯
