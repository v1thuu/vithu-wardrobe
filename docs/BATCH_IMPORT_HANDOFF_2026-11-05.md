# VITHU WARDROBE – Mehrfach-Foto-Import und Einzelprüfung (2026-11-05)

## Gesicherter Stand
- Repo: `v1thuu/vithu-wardrobe`
- Branch: `feat/batch-photo-review-20261105`
- Grundlage: `feat/garment-driven-body-rig-v3-20261105`, **nicht** die alte `main/index.html`
- iPhone-Vorschau: https://v1thuu.github.io/vithu-wardrobe/preview/batch-review-20261105/
- Isolierte IndexedDB: `vithu_wardrobe_batch_review_preview_20261105`. Bestehende Daten aus Avatar V3 per Backup importieren.
- Das Haupt-`main/index.html` bleibt unberührt.

## Anforderung
Mehrere Fotos in einem Schritt auswählen. Danach vorhandene SegFormer-B2-/FASHN-B4-/Produktfoto-Importlogik **pro Foto** ausführen und jeden Vorschlag **einzeln** zu Speichern, Korrigieren oder Verwerfen anzeigen. Keine Paid-API oder öffentliche private Fotos.

## Implementierung
- `<input multiple accept=image/*>` im vorhandenen iOS-Foto-Picker. Einzelfoto-Pfad bleibt identisch.
- Bis 20 Fotos pro Durchgang (RAM-Schutz für iPhone).
- Bilddateien bleiben als `File`-Referenzen im Arbeitsspeicher und werden **sequentiell** analysiert, nicht als 20 simultane KI-Jobs.
- Wiederverwendung von `onPhoto` und `runSmartRoute`, die bestehende Auto-Erkennung zwischen Einzelprodukt-Foto und getragenem Outfit.
- Ein einzelner sichtbarer Kandidat zur Zeit, mit ursprünglichen Speichern-, Korrigieren-, Verwerfen-, Qualitäts- und Kategorie-Optionen.
- Nach Freigabe/Aussortieren des letzten Kandidaten: automatisch nächstes Foto. Bei null Kandidaten: `Nächstes Foto` über die schlanke Fortschrittsleiste.
- `Foto überspringen` fragt bei vorhandenen offenen Vorschlägen nach, `Beenden` verwirft nur noch nicht gespeicherte Kandidaten.
- Fortschritt `X / N Fotos`, Abschluss mit Anzahl gespeicherter Teile.
- Der `Alle speichern`-Button wird im Batchmodus ausgeblendet, damit jedes Teil explizit geprüft wird.
- Gültige Artikel weiterhin via bestehende `items.unshift` / `persist()` in IndexedDB; keine Daten im GitHub-Repo.

## Tatsächliche Prüfungen
- Parser für Inline-App und alle vier externen JavaScript-Dateien bestanden.
- Isolierter JavaScript-Mock: drei Fotos inklusive Foto ohne erkannte Kandidaten; zwei Kandidaten im ersten, zwei im dritten; Speichern/Verwerfen; automatische Fortsetzung und manueller Sprung beim leeren Foto; Fortschritt und Endmeldung geprüft.
- Vorhandene Hybrid-Funktionen und avatar V3 in der Quelle erhalten.
- Erkennung mit **echten Nutzerfotos** im mobilen Browser ist noch **nicht** nachgewiesen; sichtbare iPhone-End-to-End-Abnahme ausstehend.

## Wichtige Einschränkung
- Die bestehende Hybrid-Erkennung gruppiert manche Kategorien pro Bild. Mehrere **gleichartige** Kleidungsstücke im selben Foto können daher noch zu einer Maske zusammenfallen. Mehrere Fotos und mehrere **unterschiedliche** Kleidungsstücke pro Outfit funktionieren nach den Regeln der bisherigen Erkennung, nicht garantiert für jeden Input.
- Kein permanentes Speichern der **noch ungesichteten** Foto-Warteschlange. Bereits gespeicherte Kleidungsstücke bleiben in IndexedDB; die laufende Auswahl muss bei Browser-Neustart neu begonnen werden.
- Bei unbrauchbarer Maske manuelle Korrektur statt blindem Speichern.
- Kein echter In-App-Safari-Test auf iPhone ausgeführt.

## Nutzerabnahme
1. Backup aus bisheriger Avatar-V3-Version exportieren und in neue Preview importieren.
2. Unter `Hinzufügen` drei bis fünf Bilder gleichzeitig wählen, idealerweise Mix aus Produktfoto und Outfitfoto.
3. Jede Kandidatenkarte einzeln speichern, korrigieren oder verwerfen.
4. Bei einem Foto ohne Vorschläge `Nächstes Foto` prüfen; Fortschritt und anschliessende Garderobe kontrollieren.
5. Neuladen und gespeicherte Artikel kontrollieren; kein unerwarteter Datenverlust.
