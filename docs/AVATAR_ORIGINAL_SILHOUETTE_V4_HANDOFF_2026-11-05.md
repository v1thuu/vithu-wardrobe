# VITHU WARDROBE – Avatar Original-Schnitt V4 Beta / Hand-off 2026-11-05

## Ausgangslage
- Nutzer bestätigt auf dem iPhone: **Mehrfach-Foto-Import läuft und Popup funktioniert**, Testfall mit 5 Vorschlägen, davon 2 gespeichert / 3 verworfen. Erkennung ist wertvoll, derzeit nicht weiter umbauen.
- Avatar-Screenshot: weisses Hemd und graue Jeans sichtbar, aber Hemd wirkt wie eine flache, vorgezeichnete Schablone; Figur unverändert cartoonartig. Das ist keine relevante Verbesserung gegenüber V2/V3.
- Gesicherter neuer Entwicklungsstand: Branch `feat/avatar-natural-cutout-v4-20261105` basiert auf `fix/batch-ai-worker-isolation-20261105` (letzte funktionierende Batch-Version inkl. HTML-ID- und Worker-Fix).
- **Nie** von altem `main/index.html` entwickeln.

## Neues Rendering-Experiment, keine weitere kosmetische SVG-Korrektur
1. `avatar-natural-v4.js`: nutzt lokal das **originale freigestellte Produktbild** `item.image`; alpha-gesteuerter Crop, danach **uniforme Skalierung**, sodass die tatsächliche Silhouette, Nahtführung, Stoffstruktur, Logos und Schuhe erhalten bleiben.
2. Keine individuellen Texturmuster pro Ärmel/Bein und keine vorgegebenen Hosen-/Shirt-Schablonen. Anders als V3 bleibt das gesamte Kleidungsbild ein echtes zusammenhängendes Objekt.
3. Nutzer-Idee umgesetzt: **Körper passt sich der Kleidung an**. Die V3-Persona bekommt im V4-Modus 1.5× längere Beine, der Unterkörper reicht bis ca. y435 statt y359, Oberkörper/Kopf behalten Abmessungen. Hosen erhalten bis 223 px Höhe, Schuhe liegen bei y404–448. V3 wird beim Umschalten exakt wiederhergestellt.
4. Wenn Cutout keine brauchbare Transparenz hat (vollständig opakes Foto, leere/verzerrte Maske), fällt nur dieses Teil auf den bestehenden V3-Renderer zurück. Das Originalfoto wird nicht mutiert.
5. A/B-Schalter im Avatar-Screen: **Echter Schnitt** / **Illustration**. Darunter im eingeklappten Persona-Editor zusätzlich `Original-Schnitt (V4 Beta)` sowie bisherige V3-Illustration und manuelle Originalfoto-Ansicht.
6. `avatarRenderMode='silhouette'` kann in Metadata-IndexedDB und Backups gespeichert/importiert werden. Alte Backups behalten ihre bisherigen Einstellungen, der Modus kann direkt oben umgestellt werden. Keine Paid API, kein Upload privater Bilder.

## Dateien im Entwicklungsbranch
- NEU `avatar-natural-v4.js`
- MODIFIZIERT `avatar-v2.js` (nur Render-Hook, andere Modi bleiben identisch, Rückfall pro Teil)
- MODIFIZIERT `index.html` (A/B-Schalter, Persistenz, CSS, Modul-Link, frischer Default V4)
- UNVERÄNDERT `avatar-profile.js`, `avatar-rig-v3.js`, `photo-tryon.js`, `garment-ai-worker-client.js`, `garment-ai-worker.js`, die Import-/Speicherlogik und Produktiv-Root.

## Verifizierte Tests
- JS-Syntax des neuen Renderers und der aktualisierten App-Scripts bestanden.
- Mock-Canvas mit vier unterschiedlich proportionierten freigestellten Kleidungsstücken: vier separate Originalbild-SVG-Gruppen, korrekte uniform skalierte Breite/Höhe, intakte Originalaspectratio, fallback für opakes Bild, keine V4-Darstellung im V3-Modus.
- Mock-SVG-Persona: V4 schaltet Lower-Body und Figure auf 450px um, streckt *nur die Beine* 1.5×; V3/Original stellt ursprüngliche 365px-Transformation und Stagehöhe wieder her.
- Vergleich/Backup-Modus wird serialisiert, bestehender Avatar und Fotos bleiben unverändert in der alten Variante.
- **Offen:** echte Safari-/iPhone-End-to-End-Darstellung mit Nutzerbildern. Unterschiedliche freigestellte Produktbilder können weiterhin perspektivische Probleme oder falsche Ärmellängen zeigen. Keine Behauptung einer realistischen Anprobe oder physikalischen Stoffsimulation.

## Preview
- https://v1thuu.github.io/vithu-wardrobe/preview/avatar-natural-v4-20261105/
- Eigenständiger IndexedDB-Name: `vithu_wardrobe_avatar_natural_v4_20261105`.
- Alte Batch-Vorschau: https://v1thuu.github.io/vithu-wardrobe/preview/batch-review-20261105/ bleibt unberührt.
- Alte Netlify: https://peaceful-souffle-f3f53a.netlify.app/ bleibt unberührt.
- Keine privaten Nutzerfotos in GitHub-Commits.

## iPhone-Abnahme
1. Backup aus funktionierender Batch-Version exportieren, in V4-Preview importieren.
2. Avatar → **Echter Schnitt** wählen (nach Backup-Import kann bisherige Illustration aktiv bleiben).
3. Einmal mit weissem Hemd und grauen Slim Jeans, dann schwarzem T-Shirt und Sneakern testen.
4. Auf Originalkragen, Ärmel, Jeansbein-Silhouette, Proportionen und eventuell verbleibende weiße Produktbild-Hintergründe achten.
5. **Illustration** wählen: alter V3-Körper muss wiederhergestellt sein. Fotoansicht und Garderobe danach prüfen.
6. Entscheidung erst anhand iPhone-Screens: wenn V4 durch stark unterschiedliche Produktbildperspektiven unbrauchbar, weiteren Avatar-Ausbau stoppen und die Garderobe/Outfit-Planung priorisieren.
