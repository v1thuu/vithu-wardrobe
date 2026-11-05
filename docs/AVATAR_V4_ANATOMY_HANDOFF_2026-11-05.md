# VITHU WARDROBE — Original-Schnitt V4, anatomische Anprobe (2026-11-05)

## Screenshot-Befund
- Vergleichs-Screens vom iPhone: **Echter Schnitt V4 ist gegenüber Illustrator V3 deutlich besser**: echtes Shirt-Logo, Kragen/Ärmel, reale Jeans mit Waschung, echte Schuhbilder und längere Proportionen.
- Verbleibende sichtbare Schwächen: cartoonhafte Arme ohne Hände, leicht grosser Kopf, nicht am Fuss ausgerichtete Paar-Sneaker und Restübergänge bei Ärmel/Jeans.
- **Keine Rückkehr zur schablonenbasierten V3-Stoffaufteilung.**

## Gesicherter Entwicklungsstand
- Repository `v1thuu/vithu-wardrobe`.
- Basis: `feat/avatar-natural-cutout-v4-20261105` (funktionsfähige V4-Beta mit erfolgreichem Mehrfach-Import aus `fix/batch-ai-worker-isolation-20261105`).
- Neuer Entwicklungsbranch: `feat/avatar-v4-anatomy-garment-fit-20261105`, nicht von der veralteten `main/index.html` neu gestartet.
- Preview: https://v1thuu.github.io/vithu-wardrobe/preview/avatar-v4-anatomy-20261105/
- Separate IndexedDB: `vithu_wardrobe_avatar_v4_anatomy_20261105`. Backup aus der Batch- oder V4-Vorschau importieren.
- Ältere Vorschauen, Netlify und `main/index.html` unverändert; keine privaten Fotos im Repository.

## Neue Architektur / Codeänderungen
Nur `avatar-natural-v4.js` wurde in diesem Entwicklungsblock angepasst. Alle Import-, Backup-, Avatar-V3- und Foto-Module bleiben erhalten.

1. `ensureAnatomy`: SVG-Unterarme und **eigenständige Hand-/Fingersilhouette** mit kleinen Fingerfalten, beim V4-Modus hinter den originalen Shirt-Ärmeln. Alte V3-Armformen werden nur unsichtbar geschaltet und beim Rückwechsel **vollständig restauriert**.
2. `applyNaturalAnatomy`: Gesicht/Haar/Bart/Brille in V4 um 6 % gleichmässig verkleinert, als subtile Verbesserung des Kopf-/Körperverhältnisses. Gespeicherte Avatar-Profile bleiben erhalten; vorherige SVG-Transforms werden beim Rückschalten wiederhergestellt.
3. Bei fertig verarbeitetem Oberteil/Jacke bestimmt die echte freigestellte Silhouettenbreite geringfügig den Abstand der Unterarme (konservativ auf 0.94–1.095 begrenzt). Die Person reagiert stärker auf den Kleidungsumriss, ohne dass Kleidung verzerrt wird.
4. `findShoeParts`: erkennt zwei transparente, seitlich getrennte Schuh-Teile im **Original-Cutout** anhand zentraler Alpha-Lücke, mit Mindestflächen- und Abstandsvorgaben. Falls zwei Teile robust erkannt werden, speichert die lokale V4-Texturcache-Pipeline zwei unabhängig zugeschnittene PNG-Bilder und verankert sie an getrennten Fusspunkten auf einer Bodenlinie. Falls **nur ein** Schuh oder untrennbares Paar vorhanden ist, wird das komplette bisherige Schuh-Cutout weiterverwendet.
5. Die bereits bessere V4-Grundfigur (450 virtuelle Pixel, längere Beine) und das Originalbild als ein zusammenhängendes 2D-Kleidungsstück bleiben Basis. Kein 3D-/Physikversprechen.

## Getestet
- JavaScript-Syntax des vollständigen 8-Dateien-App-Pakets bestand.
- Mock-SVG-Anatomie: V4-Persona/Handformen und Face-Skalierung aktiv; der Umschalter in V3 stellt ursprünglichen Arm-Layer, Gesichtstransforms, 365px-ViewBox und Stagehöhe wieder her.
- Synthetische transparente Schuhmaske mit zwei getrennten Alpha-Inseln erzeugt korrekt 2 Schuhe; durchgehende Einzelmaske bleibt bei 1 Bild.
- Schuh-Renderer: 2 unabhängige PNG-Bilder mit eigenständiger Breite/Höhe und gleicher Standlinie; Originalaspekte bleiben erhalten.
- Früherer V4-Test: transparente Oberteile/Hosen und opake Bilder (Fallback), korrektes Rendering pro Kategorie.
- **Noch nicht real getestet:** visuelle Qualität auf dem iPhone/Safari mit echten Wardrobe-Bildern, die heuristische Erkennung verschiedener Foto-Perspektiven und wiederholte Safari-Speichern/Laden-Regressionsprüfung. Keine Qualität behaupten, die nicht bestätigt wurde.

## Weiteres Vorgehen
1. Originale funktionierende Batch-Vorschau öffnen, Backup exportieren.
2. Neue V4-Anatomie-Vorschau öffnen, Backup importieren, Avatar → Echter Schnitt.
3. Schwarzes T-Shirt + graue Jeans + zwei weisse Sneaker vergleichen; Screenshot von ganzem Körper.
4. Bei einem einzelnen Schuhbild oder ungewöhnlicher Perspektive überprüfen, ob der klassische Einzelbild-Fallback sinnvoll bleibt.
5. Illustration kurz testen (vorheriger Körper vollständig wiederhergestellt) und Garderobe/Import prüfen.
6. Nur nach iPhone-Abnahme in stabile Version übernehmen. Keine weiteren fünf kosmetischen Mini-Fixes.

## Grenzen
- 2D-Figur bleibt stilisiert, keine reale 3D-Anprobe oder Aussage über Kleidergrössen; Originalfoto-Perspektiven beeinflussen Darstellung.
- Alpha-getrennte Schuhe sind nur bei geeignetem Pair-Cutout erkennbar; keine garantierte Linke/Rechte-Schuhklassifikation aus schrägem Shopfoto.
- Bereits vorhandene App-IDs/IndexedDB unverändert auf alter Preview; neue Preview importiert eigene Datenbank.
