# VITHU WARDROBE V5 – Anatomischere Arme (iPhone-Test 2026-11-05)

## Ausgangslage
Drei echte iPhone-Screenshots: Avatar ohne Outfit, lockereres schwarzes Shirt mit originaler grauer Jeans/weißen Schuhen und enges Tommy 1985 Shirt. Der Benutzer bestätigt realistische Kleidungsbilder, aber statische, senkrechte Hautarme und kleine fäustlingsartige Hände. Schon ohne ausgewähltes Shirt ist das Problem sichtbar.

## Ursache
Der bisherige Arm-Rig leitete Ellbogen-X mit `sleeveX-3.4` und Handgelenk-X mit `elbowX-1.7` ab. Diese drei nahezu kollinearen Punkte erzeugten trotz SVG-Bezierkurven den Eindruck gerader Rohre. Gesonderte Handkontur zeigte wenig Fingerdifferenzierung und harte Gelenkkanten.

## Isolierter Versuch
Branch `feat/v5-anatomic-limbs-20261105`, basiert auf PR #31. Nur `avatar-body-rig-v5.js` und der gezielte Regressionstest wurden geändert:
- Delta zum Ellbogen nach **außen** und vom Ellbogen zum Handgelenk nach **innen**: leichte, entspannte natürliche Pose statt statischer Säulen.
- Oberarm zu Unterarm zu Handgelenk kontinuierlich und dezent verjüngt; schwächere Konturen, keine dunklen Manschetten.
- Kleine, weniger fäustlingsartige Handfläche mit angedeuteten einzelnen Fingerkuppen. Gleichbleibende symmetrische Spiegelung.
- Keine Änderungen an echter T-Shirt-, Jeans- oder Schuhgrafik, B2/B4, Mehrfach-Import, IndexedDB, Backup, KI-Modellen oder GitHub-Root.
- Die bisherige V4-Armform bleibt als Rückfall-Option nutzbar. PR #31 und alte Render-Module bleiben erhalten.

## Prüfungen und Grenzen
Tests prüfen blanken Avatar, enges/weites Shirt, Gelenk-Winkel, Handlänge, sicheren Fallback, SVG-Pfade, Moduswechsel und weiterhin funktionierenden Mehrfachimport. Regressionstests ersetzen **keinen visuellen iPhone-Test**.
Ein flaches SVG-Modell mit stilisiertem Gesicht ist weiterhin **kein fotorealistischer personalisierter 3D-Körper**. Für echten Fotorealismus später personenspezifisches Ganzkörperfoto oder weiterführende Try-on-Lösung evaluieren. Keine erfundenen 3D-Fähigkeiten.

## Nächste Prüfung
1. Einziger bestehender V5-Testpfad unter `/preview/avatar-v5-joints-20261105/` erst nach erfolgreichem CI-Test aktualisieren; die vorhandene lokale Garderobe bleibt auf demselben Origin und IndexedDB-Namen.
2. Erst neutralen Avatar, dann das lockerere schwarze Shirt und das enge Tommy-Shirt vergleichen.
3. Insbesondere Ellbogenknick, Handkontur und Übergang am realen Ärmel prüfen.
4. Falls immer noch zu comicartig: **nicht** mit winzigen weiteren Pfadkorrekturen weitermachen, sondern eine neue Avatar-Architektur planen.
