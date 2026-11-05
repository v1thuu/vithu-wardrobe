# VITHU WARDROBE – iPhone Batch-Import hängt bei Foto 1 von 7 (2026-11-05)

## Quelle, Fehlerbild
- Screenshot: Mehrfach-Import 1/7, Anzeige `Foto wird analysiert …`, keine Kandidaten, `Nächstes Foto` deaktiviert, `Geeignete Teile speichern` noch eingeblendet.
- Root: Auf dem Batchpfad lief weiterhin die vollständige B2→B4-Hybridanalyse **pro Foto**. Auf iPhone verursacht das potenziell lange Modelldownloads, hohe Speichernutzung und WebAssembly-Inference. Zusätzlich sperrte die UI `Nächstes Foto` während laufender Analyse und bot keine Recovery.
- Ein Screenshot allein beweist nicht, welcher konkrete Modellaufruf blockierte; diese Code-Feststellungen sind begründet, aber keine Laufzeitdiagnose.

## Umsetzung im Branch
- Branch: `fix/batch-import-iphone-stall-20261105` ab `feat/batch-photo-review-20261105`.
- **Nur im Mehrfach-Import:** Einmal SegFormer B2 statt B2 + FASHN B4 automatisch für jedes Outfitfoto. B4 bleibt für Einzelbild/gezielte Nachanalyse weiterhin im bestehenden Code verfügbar.
- Bildgrössenbegrenzung beim Batch auf maximal 640px statt 850px; der bisherige Einzelimport bleibt bei 850px.
- Fortschritt im Batch auf iPhone mit Zustand `KI arbeitet ungewöhnlich lange` nach 65s (Watchdog zeigt Problem, bricht WebAssembly **nicht** ab).
- `Nach Analyse überspringen` während laufender Inference verfügbar; Überspringen wird vorgemerkt und erst nach dem tatsächlichen Abschluss durchgeführt, um keine parallelen Modelle zu erzeugen.
- `Beenden` auch während laufender Analyse möglich: erhöht `importSerial`, beendet logisch die Warteschlange und verhindert, dass spätere veraltete Kandidaten geladen werden. Eine bereits laufende synchrone CPU-/WASM-Berechnung ist nicht sicher abbrechbar.
- Versteckt `Alle speichern` in allen Batchzuständen, damit Einzelprüfung wirklich verbindlich bleibt.
- Erkennungsfehler und nicht lesbare Bilder behalten ihre Fehlermeldung; bei fehlgeschlagener B2-Erkennung öffnet sich der vorhandene manuelle Korrekturbereich.
- Bereits persistierte Kleidungsstücke bleiben in der Preview-IDB erhalten. **Noch nicht geprüfte File-Warteschlange wird nicht gespeichert und muss beim Neuladen neu gewählt werden.**

## Testnachweise
- Inline-App-JavaScript syntaktisch geprüft.
- Isolierter Mock-Test mit laufender Analyse und zwei Dateien: Skip während `busy` wird nicht parallel ausgeführt, sondern vorgemerkt; nach Abschluss geht es zu Bild 2; Beenden verhindert veraltete Ergebnisse. `saveAll` im Batch ausgeblendet.
- Mock-Hybrid-Test: Batch ruft ausschliesslich B2 auf; Einzelimport nutzt weiter B2+B4.
- Bisheriger Batch-Review-Queue-Test: mehrere Kandidaten und Leerfoto werden sequenziell verarbeitet.
- Safari-Realtest mit Nutzerdaten bleibt ausdrücklich offen. Keine iOS-Speicher-/Laufzeitgarantie.

## Veröffentlichung
- Update auf **bestehendem** Testpfad: https://v1thuu.github.io/vithu-wardrobe/preview/batch-review-20261105/
- **Gleiche** IndexedDB `vithu_wardrobe_batch_review_preview_20261105`; keine Backups neu importieren nötig.
- `main/index.html`, Netlify, Avatar-/Foto-Module und andere Vorschauen bleiben unangetastet.
- Kein Upload der privaten Fotos in GitHub.

## Nutzerabnahme
1. Link frisch öffnen / Browser neu laden, zunächst zwei bis drei Bilder testen.
2. Prüfen, ob B2-Erkennung Kandidaten liefert; nach jedem Teil Speichern/Korrigieren/Verwerfen, dann nächstes Foto.
3. Bei langer Analyse `Nach Analyse überspringen` oder `Beenden`; falls die Seite selbst nicht reagiert, iOS-Tab neu laden (nicht gespeicherte Batch-Auswahl verloren).
4. Prüfen, ob Garderobe bereits gespeicherte Artikel behalten hat.
5. Bleibt schon B2 hängen, nächste Architekturentscheidung: echte Worker-Isolation mit Abbruch / Speicherbegrenzung statt immer weitere UI-Timer.
