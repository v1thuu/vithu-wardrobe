# VITHU WARDROBE – Stabilitätsplan vor neuem Avatar-Modell (2026-11-05)

## Nutzerentscheid
Lieber langsam und **verlässlich** als fünf kosmetische Updates hintereinander. Die Mehrfach-Import-Pipeline ist auf dem iPhone real bestätigt (5 Vorschläge; 2 gespeichert / 3 verworfen). Bei den Avatar-Screens gewinnt `Echter Schnitt` V4 gegen V3, aber die neue Anatomie aus PR #28 hat zangenartige Hände und ist **nicht** freigabereif.

## Verifizierter Entwicklungs-Startpunkt
- Repo: `v1thuu/vithu-wardrobe`
- **Stabiler V4-Quellbranch:** `feat/avatar-natural-cutout-v4-20261105` (ohne experimentelle Zangen-Hände).
- **Stabiler Mehrfach-Import:** `fix/batch-ai-worker-isolation-20261105`; die erfolgreiche Batch-Pipeline liegt bereits in der V4-Basis.
- Nicht von `main/index.html` (veraltete 2.9.1) neu starten.
- Separate stabil nutzbare Vorschau für echten Schnitt: https://v1thuu.github.io/vithu-wardrobe/preview/avatar-natural-v4-20261105/
- Mehrfach-Import mit bestätigtem iPhone-Erfolg: https://v1thuu.github.io/vithu-wardrobe/preview/batch-review-20261105/
- Alte Netlify-App: https://peaceful-souffle-f3f53a.netlify.app/
- PR #28 `feat/avatar-v4-anatomy-garment-fit-20261105` bleibt **experimentell**. Nicht mergen.

## Was in diesem Schritt tatsächlich geändert wurde
- Branch `chore/stable-v4-regression-gates-20261105`, vom stabilen V4-Branch abgezweigt.
- NEU: `tests/v4-stability.mjs`: wiederholbare, lokale Node-Regressionstests ohne Nutzerfotos oder Netzwerk.
- Keine Änderung an `index.html`, `avatar-natural-v4.js`, B2/B4, Worker, Importlogik, Avatar, IndexedDB, Backups oder GitHub-Pages-Preview.
- Test prüft JS-Syntax aller acht Skripte; einzigartige/vorhandene DOM-IDs (inkl. historischem `smartImportStatus`-Bug); Batch-Mehrfachpicker/Review-Popup/Worker/B4-Aufrufe; V4-Originalcutout aus synthetisch transparenten Pixeln; Ablehnung opaker Bilder; Rückschalten V4↔V3 und ursprüngliche 365px-Geometrie.
- Test wurde mit dem tatsächlich geladenen GitHub-Quellcode über einen synthetischen V8/DOM-Harness ausgeführt: **PASS**. Der Node-CLI-Einsatz auf einem Nutzergerät oder in CI ist noch nicht separat ausgeführt.

## Klare Meilensteine (keine weiteren Schnellschüsse)
1. **Sicherer Stand:** funktionsfähige Import- und V4-Basis eingefroren; Regressionstests für jede nächste Änderung verpflichtend. Keine neuen Preview-URLs allein für Tests.
2. **Neuer Body-Rig als unabhängiges Modul:** Gelenkanker (Schulter, Ellbogen, Handgelenk, Hüfte, Knie, Fuss), natürliche Hände, saubere Ärmelabdeckung. Originale Kleidungs-Silhouetten bleiben vollständig. Der neue Körper ist nur per Opt-in aktiv; V4 als immer verfügbare Rückfalloption.
3. **Visuelle Prüfung mit gleichen Outfits:** schwarzes Logo-Shirt, graue Slim-Jeans, weisse Sneakers und das weisse Hemd. Vorher/Nachher vergleichbar. Kein Merge, solange Hände, Schultern oder Schuhe offensichtlich schlechter sind.
4. **Regression und Backup-Test:** echter iPhone-WebView-Durchlauf, mindestens zwei Fotos B2/B4, Freigabe/Korrektur/Verwerfen, Garderobe nach Neuladen, Backup exportieren/importieren, V4-Rückschalten. Erst dann Release-Pfad aktualisieren.

## Abnahmekriterien für neue Avatar-Vorschau
- **Kein** Verlust gespeicherter Teile, Looks, Profile, Personalfotos oder bestehender Avatar-Fits.
- Im funktionierenden Batch-Import keine Codeänderungen, solange nicht durch einen konkreten Fehler begründet.
- Originalschnitt / Stofftexturen nicht wieder schablonenhaft in vorgezeichnete SVG-Shirts zwingen.
- Natürliche Hände und Schultern ohne sichtbare Hautlücken oder „Zangen“-Form.
- Keine verheimlichten Paid APIs oder privaten Nutzerfotos im öffentlichen Repo.
- Neues iPhone-Testlink nur nach reproduzierbaren Tests und erfolgreichem GitHub-Pages-Deployment. Jede Vorschau erhält eigene IndexedDB.

## Grenzen
Stabilitätstests und synthetische Bilder sind keine Bestätigung für optisch realistische Anprobe auf dem iPhone; diese Bewertung benötigt den realen Nutzer-Test. 2D-Avatar bleibt für Stofffall/Grössenvorhersage technisch beschränkt. 
