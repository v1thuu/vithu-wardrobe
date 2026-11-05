# VITHU WARDROBE — V5 Ärmelkonturen & kompaktere Hände (2026-11-05)

## Anlass: echte iPhone-Screenshots
Nutzer testete den isolierten V5-Joint-Rig mit (1) schwarzem Tommy 1985 Slim-Shirt und (2) schwarzem T-Shirt, grauer Slim-Jeans und weißen Sneakers. Echte Produktbilder sehen klar besser aus als V3; die Arme sind jedoch röhrenförmig und die Hände wirken wie überdimensionierte Fäustlinge. Vor allem ein enges und ein weites T-Shirt liefern verschiedene Ärmelpositionen.

## Entwicklung
- Repo: `v1thuu/vithu-wardrobe`.
- Basis: `feat/avatar-v5-joint-rig-safe-prototype-20261105` (der auf stabilem `chore/stable-v4-regression-gates-20261105` aufbaut).
- Fix-Branch: `fix/v5-sleeve-contours-and-hand-proportions-20261105`.
- Reine Produktiv-`main/index.html` und die funktionierende Batch-Import-Vorschau bleiben unverändert.
- Bereits existierende V5-Testvorschau wird **unter derselben URL und IndexedDB** aktualisiert: https://v1thuu.github.io/vithu-wardrobe/preview/avatar-v5-joints-20261105/ . IndexedDB: `vithu_wardrobe_avatar_v5_joints_20261105`. **Kein neuer Backup-Import nötig.**

## Fehlerursache und gezielter Fix
Bisher V5: Der Schulter-/Ärmelansatz kam ausschließlich aus der Breite des Rechtecks um das T-Shirt: `(90 - width * .445)` und `y + height * .355`. Dadurch wurde die echte Ärmelform nicht berücksichtigt.
- `avatar-natural-v4.js`: neue **optionale** Alpha-Maskenmessung `detectSleeveContour`, die zwischen 24 % und 61 % der Kleidungsbildhöhe nach einem gleichzeitigen deutlichen Einwärtswechsel an der linken und rechten Außenkante sucht. Wird ein plausibles Ärmelsignal erkannt, ist die Position im Avatar als `getNaturalSleeveFitV4` abrufbar. Unklare/undurchsichtige Bilder → null; V4-Cutout, Einzelartikel- und B2/B4-Erkennung bleiben unverändert. Ein getImageData-Lesefehler bei optionalem Scan wird bewusst abgefangen und darf **nie** das Kleidungsstück verwerfen.
- `avatar-body-rig-v5.js`: `calculateRig` verwendet Messwerte nur bei gültiger Kontur; ansonsten exakt die alte Breitenheuristik mit den alten Bereichsgrenzen. Keine zusätzlichen UI-Buttons. Hände sind nun etwas kompakter und weniger aufgeschwollen (kleinere Daumen-/Handflächenkontur), weiterhin bewusst stilisiert.
- Keine Änderungen an der Personageometrie, dem Kopf, den Jeans, den Schuhen, dem vorhandenen Import-Worker oder der Speicherung.
- Die ursprünglichen V4-Arme können weiterhin unter `Meinen Avatar gestalten → Armform (Test) → Bisherige Arme (V4)` gewählt werden; V3-Illustration und Foto-Ansicht bleiben separat.

## Automatisierte Prüfungen
- Bestehender `tests/v4-stability.mjs`: originale Cutouts, opaker Fallback, V4↔V3, DOM-IDs, Mehrfach-Import-Hooks.
- Bestehender `tests/v5-body-rig.mjs`: Joint-Anker, Armspiegelung, V5↔V4, V3/Foto-Modus, Geometriegrenzen.
- NEU `tests/v5-sleeve-contours.mjs`: künstliche Alpha-Silhouette mit T-Shirt-Ärmeln, schlichte Rechtecksilhouette ohne Ärmel, Messung im Stage-Koordinatenraum, Fallback für ungültige Werte, simulierter Canvas-Readback-Ausfall bei weiterhin intaktem Original-Cutout.
- GitHub Actions Node-22-Gates (alle drei) auf Fix-Branch: **SUCCESS**. Workflow: https://github.com/v1thuu/vithu-wardrobe/actions/runs/42037380022
- Nicht behaupten, dass die Qualität mit Nutzershirts schon am iPhone verifiziert wurde; der nächste reale A/B-Screenshot ist noch offen.

## Nächste Nutzerabnahme
1. Bestehenden V5-Link **neu laden** (dieselbe lokale Garderobe wird wiederverwendet).
2. Enges Tommy-Shirt + graue Slim-Jeans auswählen, Vergleich mit bisheriger V5-Anatomie: besonders freier Armansatz unter Ärmel und kompaktere Hände.
3. Schwarzes weiteres T-Shirt ebenfalls prüfen; wenn Ärmelmessung ausfällt, muss sich die alte V5-Fallback-Darstellung zeigen und **kein** Kleidungsstück verschwinden.
4. `Meinen Avatar gestalten → Armform (Test) → Bisherige Arme (V4)`, zurück zu V5, danach Seite neu laden. Erwartet: Outfit und Modus gespeichert.
5. Wenn die Arme weiterhin unnatürlich wirken, keine weitere Mini-Korrektur; dann Planung eines voll neu gezeichneten Körpergrundgerüsts, das sich auf die Original-Kleidungsbilder abstützt.

## Sicherheit
- Keine echten privaten Produkt-/Nutzerbilder in GitHub gespeichert.
- Keine kostenpflichtigen APIs.
- Haupt-Branch `main/index.html`, Netlify und alte Preview-Pfade werden nicht überschrieben.
