# VITHU WARDROBE – Batch-Analyse zuerst, gemeinsamer Prüf-Popup am Ende (2026-11-05)

## Nutzerziel
Mehrere Fotos gleichzeitig wählen, **jedes Foto einzeln mit der bisherigen Automatik** analysieren, geschnittene Kleidungsstücke zunächst sammeln; **erst nach der Analyse aller Fotos** eine gemeinsame Popup-Prüfung beginnen. Dort erscheint immer nur **ein** Teil mit Speichern/Korrigieren/Verwerfen. Die vorherige Version zeigte Kandidaten während der laufenden Analyse an und konnte bei Foto 1/7 blockieren.

## GitHub-Stand
- Repo: `v1thuu/vithu-wardrobe`
- Branch: `feat/batch-analyze-first-review-last-20261105`
- Base: `fix/batch-import-iphone-stall-20261105`, seinerseits ab `feat/batch-photo-review-20261105`. Bitte nicht von der veralteten `main/index.html` ausgehen.
- **Gleicher bestehender Previewpfad:** https://v1thuu.github.io/vithu-wardrobe/preview/batch-review-20261105/
- Isolierte IndexedDB **unverändert:** `vithu_wardrobe_batch_review_preview_20261105`. Kein erneuter Backup-Import erforderlich.
- Produktiv-`main/index.html`, bestehende Avatar- und Foto-Module und Netlify unverändert; keine Nutzerbilder committed.

## Pipeline
1. Fotoauswahl `multiple`, neu max. 10 Fotos pro Durchgang zur Begrenzung von Speicher und Laufzeit auf iPhone.
2. `phase='scan'`: Dateien strikt nacheinander verarbeiten, die bestehende `onPhoto`- und Auto-Route behalten. Für als Outfit/model erkannte Fotos weiterhin `smartImportBeta('legacy')` (SegFormer B2) und danach `smartImportBeta('fashn')` (FASHN B4); pro Foto konservative Hybrid-Maskenwahl. Einfaches Produktfoto behält den bisherigen automatischen Produkt-Freisteller (ohne unnötige Outfitmodelle).
3. Während der Analyse: Fortschritt X/N + B2/B4; **keine Karten, kein Speichern**, keine gleichzeitigen Modellaufrufe. Wenn ein Foto unbrauchbar ist, später zusammenfassen; `Nach Analyse überspringen` merkt die Aktion vor, ohne in WASM-Pipeline einzugreifen.
4. Nach jedem Foto Kandidaten inklusive `originalCrop` zwischenspeichern, grosse Quelldaten/File-Referenzen freigeben, nur maximal 60 Vorschläge im RAM halten; keine persistente Foto-Warteschlange.
5. Erst nach dem letzten Foto `phase='review'`: `batchReviewDialog` als responsiver modal overlay, `smartImportGrid` aus der vorhandenen UI dorthin verschieben. Ein Kandidat zur Zeit, Dateiname + Nummer, direkte Aktionen **Speichern, Korrigieren, Verwerfen**; bestehende Qualitätsprüfung und Bestätigungsdialog bleiben erhalten.
6. Korrigieren: Popup vorübergehend ausblenden und vorhandenen Freistellungseditor öffnen. Bei `closeCutout()` wird die Popup-Prüfung fortgesetzt. Save/Discard greifen auf bestehende IndexedDB-Speicherroutine zu.
7. Am Ende Rückkehr in normalen Importbereich und Abschluss mit Anzahl gespeicherter/verwerfener Stücke.

## Tests
- JavaScript-Parser: Inline-App + Avatar-, Rig-, Profil- und Foto-Module ohne Syntaxfehler.
- Simulierter Sequenztest: 3 Fotos, erste 2 Kandidaten, zweites leer, drittes 1 Kandidat. Der Review-Popup öffnet sich **erst nach 3/3**, zeigt drei Teile nacheinander und schliesst nach Freigabe/Ablehnung mit korrektem Summenzähler.
- Reale Renderer-Funktion im Mock-DOM: pro Review genau eine Karte, direkte Speichern-/Korrigieren-/Verwerfen-Aktionen, kein Massen-Speichern.
- B2/B4-Router-Stub: sowohl Batch als auch Einzelbild rufen beide Modelle sequenziell.
- Abbruch während in-flight scan: Warteschlange wird logisch ungültig, keine Popup-Anzeige mit alten Kandidaten.
- Correction pause/resume um bestehenden Editor simuliert.
- Vollständiger iPhone-Safari-/WebView-Test mit echten Nutzerfotos **noch offen**.

## Wichtige ehrliche Grenzen
- Bereits laufende WebAssembly-Inference lässt sich auf dem Hauptthread nicht garantiert beenden. Hängt B2 oder B4, kann die gesamte Analyse trotzdem stehen; die neue Reihenfolge löst dieses Grundproblem **nicht automatisch**. Für zuverlässigen harten Abbruch braucht es später einen Worker-Ansatz mit Modell-Isolation.
- Das erstmalige Laden der beiden Modelle kann Daten und Zeit beanspruchen, besonders auf iOS. Sieben Bilder × B2/B4 sind ressourcenintensiv; 2–3 zum ersten Test empfohlen.
- Wenn Safari während der Scan-Phase neu lädt/abstürzt, gehen noch nicht geprüfte **temporäre Vorschläge** verloren. Bereits gespeicherte Garderobenartikel bleiben in IndexedDB.
- Mehrere identische Kategorien in einem einzigen Foto können durch den vorhandenen Hybrid-Parser zusammenfallen; mehrere Fotos werden dennoch separat ausgewertet.
- Keine kostenpflichtige API, keine privaten Fotos im GitHub.

## Reale iPhone-Abnahme
1. Vorhandene Batch-Preview aktualisieren (gleiche IndexedDB), 2–3 Fotos gleichzeitig wählen.
2. Fortschritt muss B2 und B4 für Outfitfotos anzeigen; vor dem letzten Foto noch **kein** Prüf-Popup.
3. Nach dem letzten Foto prüfen, ob nur ein Kandidat auf einmal zu sehen ist; Speichern, Korrigieren mit anschliessender Rückkehr und Verwerfen testen.
4. Garderobe auf gespeicherte Stücke prüfen und Seite neu laden.
5. Danach mit 7 Fotos erneut testen; falls die KI wieder hängt, Laufzeit und ob B2/B4-Phase betroffen melden. Dann Worker-/Abbruchplanung.
