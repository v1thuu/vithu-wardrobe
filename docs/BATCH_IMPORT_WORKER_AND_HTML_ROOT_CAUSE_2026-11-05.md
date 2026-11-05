# VITHU WARDROBE – iPhone Mehrfach-Import bleibt bei B2 stehen: Ursachenfix (2026-11-05)

## Ausgangspunkt
- User testete die bisherige Preview mit 5 und 2 Bildern. Beide Male stand die UI bei `1 / N · B2`, beim Überspringen weiter auf `Foto wird übersprungen …`.
- Zuletzt gesicherter funktionaler Dev-Stand: `feat/batch-analyze-first-review-last-20261105`.
- Neuer Fix-Branch: `fix/batch-ai-worker-isolation-20261105`.
- Preview bleibt: https://v1thuu.github.io/vithu-wardrobe/preview/batch-review-20261105/
- Vorhandene Preview-IndexedDB bleibt `vithu_wardrobe_batch_review_preview_20261105`. Kein erneuter Backup-Import.
- `main/index.html` ist alt und wurde absichtlich nicht geändert.

## Tatsächlich nachgewiesener Primärfehler
Im neuesten `index.html` war die UI-Statuszeile beschädigt:
`<p id="smartImportStatus' class="notice" ...>` statt `<p id="smartImportStatus" class="notice" ...>`.
Die JavaScript-Helferfunktion `$('smartImportStatus')` konnte das Element nicht finden. `onPhoto()` führte `.style.display` auf `null` aus und brach bereits vor einem B2-Modellaufruf ab; auch der Fehlerpfad schrieb erneut auf dieses fehlende Element. Weil die Warteschlange die Überschrift `B2` bereits vor `onPhoto()` setzte, war das Label allein **kein** Beweis für tatsächlich laufende Inference. Daher die wiederholte Anzeige bei 1/N.
- Quelltext-Reparatur: korrektes `id="smartImportStatus"` inkl. `aria-live="polite"`.
- Audit aller aus dem Inline-Script über `$('...')` referenzierten statischen Element-IDs: **0 fehlend, 0 Duplikate** nach Fix.
- **Wichtig:** Die vorherige Diagnose „B2-WASM hängt sicher“ war zu stark; ein möglicher zusätzlicher WASM-Blockierer bleibt theoretisch bestehen, wurde aber aus dem Screenshot nicht bewiesen.

## Präventive Robustheitsverbesserung: echte Web-Worker-Isolation
- Neues `garment-ai-worker.js` mit unveränderten Modellen: `Xenova/segformer_b2_clothes` (B2) und `faisal-shohag/fashn-human-parser-onnx` (B4), Transformers.js 3.7.6, CPU WASM, q8.
- Neues `garment-ai-worker-client.js` für Statusmeldungen, sequenzielle Modellaufrufe, Antworten als transferierte Masken-Datenpuffer und jederzeitiges `terminate()`.
- **Nur Batchmodus:** Bild-Segmentierung läuft im eigenen Worker; Einzelbildimport verwendet weiterhin denselben Original-Parser auf dem Hauptthread (keine Regression, bis separat getestet).
- Worker pro Foto: erst B2, altes Modell entsorgen, danach B4; nach Fotoabschluss wird Worker komplett terminiert. Das begrenzt gleichzeitig gehaltene grosse Modelle, kostet dafür Initialisierungszeit beim nächsten Foto.
- `Foto jetzt überspringen`: setzt `skipRequested`, terminiert laufenden Worker und führt nicht noch B4 für das abgebrochene Foto aus. `Beenden` terminiert ebenfalls und invalidiert den Import-Serial. Mit dem echten Worker kann der UI-Thread reaktionsfähig bleiben; eine globale iOS-Speicherabschaltung ist damit nicht ausgeschlossen.
- Kein automatischer Fallback auf blockierende Hauptthread-WASM-Inferenz, falls Worker nicht startet. Stattdessen sinnvoller Hinweis, Einzelimport/Safari zu verwenden.
- Nur die nötigen Modellgewichte werden wie bisher vom CDN/Hub geladen. Nutzerbilder werden lokal im Browser verarbeitet, keine Foto-Uploads in GitHub.

## Produkt-Flow unverändert
1. Bis zu 10 Fotos auswählen.
2. Foto für Foto B2 + B4, keine parallelen Modell-Jobs.
3. Erkennbare Ausschnitte zwischenspeichern.
4. Nach letzter Analyse ein gemeinsames Prüf-Popup, jedes Teil einzeln: Speichern, Korrigieren oder Verwerfen.
5. Dauerhafte Speicherung nur nach Bestätigung in IndexedDB.

## Tests
1. Parser bestanden für App-Inline-Script, Worker-Script und Client.
2. HTML-ID-Integrity-Audit bestanden: `smartImportStatus` vorhanden, keine fehlenden statischen `$('...')`-IDs.
3. Fake-Worker-Controller: B2-Antwort, sequentielles B4 auf demselben Worker, Cancel reject + terminate, Neuerstellung nach Cancel, Worker-Ladefehler.
4. Worker-Modellstub: zwei Bildmasken transferiert, B2-Session vor B4 freigegeben, WASM-Threadlimit gesetzt.
5. Integrations-Mock mit der **echten** Batch-`onPhoto`- und `runHybridImport`-Logik: zwei Fotos B2/B4 in genauer Reihenfolge; danach vier Kandidaten zum Review; Save/Discard; blockiertes B2-Foto wird übersprungen und nächstes Foto verarbeitet, keine parallele B4-Analyse des abgebrochenen Bildes.
6. Nicht verifiziert: reale iPhone-Safari-/In-App-WebView-Ausführung, Download/Gewicht der Modelle, Worker-Kompatibilität auf diesem konkreten iPhone. Keine Behauptung vollständiger iOS-E2E-Prüfung.

## iPhone-Abnahme
- Preview-LINK unverändert, nur neu laden (ggf. Cache umgehen).
- Zuerst 2 Bilder wählen. Jetzt muss unter dem Fortschritt eine detaillierte Statusmeldung erscheinen (z. B. `B2 · KI-Modell laden`, `B2 · Kleidung freistellen`, danach B4).
- Falls verzögert: `Foto jetzt überspringen` testen. Dieses muss sofort den Worker abbrechen und mit Bild 2 fortfahren.
- Nach beiden Fotos sollte der Review-Popup erscheinen.
- Ergebnis prüfen und Garderobe neu laden. Bereits vorhandene Kleidungsstücke nicht doppelt importieren.
- Wenn Worker im In-App-Browser scheitert: Fehltext auf Screenshot zur weiteren Debug-Auswertung.
