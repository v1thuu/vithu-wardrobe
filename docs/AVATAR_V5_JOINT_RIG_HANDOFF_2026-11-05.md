# VITHU WARDROBE – V5 Gelenkarm-Prototyp und Freigabegates (2026-11-05)

## Ausgangslage
- Nutzerrückmeldung: Entwicklung soll **langsam, stabil und funktionierend** fortgesetzt werden, keine fünf Mini-Korrekturen.
- Bestätigter Mehrfach-Import mit B2+B4 und abschliessender Einzelprüfung: Nutzer hat fünf Vorschläge geprüft, zwei gespeichert und drei verworfen. **Nicht ändern.**
- Avatar: Original-Schnitt V4 ist besser als V3, aber Körperproportionen und Handformen bleiben stark stilisiert. Der letzte Anatomie-PR #28 hat zangenartige Hände und wurde ausdrücklich **nicht** als Basis genommen.

## Verifizierte Quellbasis
- Repository: `v1thuu/vithu-wardrobe`.
- Ausgangsbranch: `chore/stable-v4-regression-gates-20261105`, der die funktionierende `feat/avatar-natural-cutout-v4-20261105`-App unverändert übernimmt.
- Neuer Branch: `feat/avatar-v5-joint-rig-safe-prototype-20261105`. Nicht von der veralteten `main/index.html` starten.
- iPhone-Vorschau: https://v1thuu.github.io/vithu-wardrobe/preview/avatar-v5-joints-20261105/
- Separater Datenbankname in diesem Testpfad: `vithu_wardrobe_avatar_v5_joints_20261105`. Export/Import des bisherigen Backups notwendig.
- Funktionierender Batch-Teststand bleibt https://v1thuu.github.io/vithu-wardrobe/preview/batch-review-20261105/ und die V4-Vorschau bleibt https://v1thuu.github.io/vithu-wardrobe/preview/avatar-natural-v4-20261105/.
- Netlify `https://peaceful-souffle-f3f53a.netlify.app/` und produktive `main/index.html` nicht ändern. Keine privaten Nutzerfotos ins Repository.

## Umfang dieses Entwicklungsblocks
- `avatar-body-rig-v5.js` NEU. Eigenständiges SVG-Unterkörper-unabhängiges Armgerüst mit je einer zusammenhängenden Ober-/Unterarmform, geschlossener Handfläche, dezent skizzierten Ellbogen- und Handlinien. Zweite Seite gespiegelt. **Keine** Änderung an Portrait, Jeans, Füssen oder Schuhen.
- Die Form wird aus realer Oberteil-Platzierung abgeleitet: Ärmelbreite und effektive Oberteilhöhe legen sichtbaren Armansatz fest; Ellenbogen, Handgelenk und Hand werden davon mit begrenzten anatomischen Distanzen positioniert. Extremwerte werden geklemmt.
- `avatar-natural-v4.js`: minimale, mathematisch äquivalente Refaktorierung der vorhandenen Original-Cutout-Platzierung. Stellt `window.getNaturalCutoutPlacementV4` bereit. **Kein** Warp, keine andere Freistellungsqualität und keine Änderungen an Bilddaten.
- `avatar-v2.js`: ruft V5 optional nach dem bestehenden Kleidungsrendering auf. Das Gerüst liegt unter den echten Kleidungs-SVG-Bildern. Ursprüngliche V4-Arme bleiben als unveränderte SVG-Ebene vorhanden.
- `index.html`: nur im eingeklappten `Meinen Avatar gestalten` ein Auswahlfeld `Armform (Test)`: Neue Armform (V5) / Bisherige Arme (V4). Der Test-Default ist V5, damit die neue Vorschau sofort getestet werden kann. Sobald V4 gewählt wird, werden die ursprünglichen Arme wieder angezeigt. V3-Illustration/Fotoansicht deaktivieren V5 automatisch.
- `avatarBodyRigMode` in der bestehenden IndexedDB-Metadatenstruktur, Backup-Export/-Import und Legacy-Migration; kein neuer Store, kein Löschen.
- `tests/v5-body-rig.mjs`: separates Node-Regressionstestskript.
- `tests/v4-stability.mjs`: **unverändert**, muss weiterhin bestehen.
- `.github/workflows/wardrobe-regression.yml`: echte GitHub-Actions-Gates mit Node 22 für beide Tests.

## Teststand
- Quellcode aller App-Scripts geparst, statische HTML-IDs geprüft: 0 fehlend.
- JavaScript-V8-Harness: V4-Regressionen bestanden (Alpha-Cutout, opakes Bild, Wechsel zurück auf V3, Mehrfachimport-UI-/Worker-Hooks).
- JavaScript-V8-Harness für V5 bestanden: Anfangsrender, spiegelgleiche Arme, pro Seite 4 SVG-Elemente, Oberteilbreiten 100 vs 148 ändern Armansatz, Extremwerte werden geklemmt, Moduswechsel V5→V4→V5, V3-Illustration/Fotoansicht restauriert alte Arme, nur explizites Umschalten löst Speicherung aus.
- Ein isoliertes synthetisches SVG-Bild wurde lokal gerendert und auf überdeckte Schultern/geschlossene Handform geprüft. Kein realer iPhone-End-to-End-Test mit Garderobebildern.
- **Offen:** echtes iOS-Safari-/In-App-Browser-Rendering, Pixelgenauigkeit bei unterschiedlichen Oberteilen/Jacken, Persistenz nach Reload und Backup-Roundtrip am Nutzergerät. Freigabe nur nach Screenshot.

## Grenzen / Risiken
- Dies ist **kein** realistischer 3D-Avatar: Hände bleiben abstrahierte geschlossene Formen, keine Fingergelenksteuerung.
- V5 ändert nur die Arme, nicht Gesicht/Beine/Schuhe. Proportionen bleiben ansonsten V4.
- Die Ableitung erfolgt aus dem realen **Gesamtbild-Rechteck** des Cutouts; keine automatisch erkannten Ärmel-Nahtpunkte oder Textilverformung.
- Falls V5 optisch nicht überzeugt, per `Armform (Test) → Bisherige Arme (V4)` zurückschalten oder die bereits separate V4-Vorschau verwenden. Nicht direkt in die stabile Version mergen.
- Die Hybrid-Modelle SegFormer B2 und FASHN B4 bleiben technisch unverändert; Modell-Lizenzen (insbesondere nicht-kommerzielle Nutzung) müssen vor etwaiger kommerzieller Produktnutzung unabhängig geprüft werden.

## Nächster Test auf iPhone
1. In der funktionierenden Batch-Version zuerst ein Backup exportieren.
2. Neue V5-Vorschau öffnen, Backup importieren, Avatar → Mein Avatar → Echter Schnitt.
3. `Meinen Avatar gestalten` öffnen und `Armform (Test)` von V5 auf V4 und zurück schalten, gleiches Outfit beibehalten.
4. Fotos/Screens von schwarzem Logo-Shirt, hellgrauer Slim-Jeans und weissen Sneakers sowie weissem Hemd vergleichen. Besonders auf Anschluss an Ärmel, Handform und natürliche Position am Körper achten.
5. Page Reload + gespeicherte Looks und Garderobe prüfen. Optional Mehrfachimport mit zwei Fotos prüfen. Erst nach dieser realen Abnahme entscheiden, ob die Grundform den V4-Stand ersetzt.
