# VITHU WARDROBE – Avatar VNext Split Textures / Handoff
Date: 2026-11-04

## Gesicherter Stand und Quellen
- Entwicklungsbranch: `feat/avatar-vnext-split-textures-20261104`.
- Basis: `feat/avatar-studio-texture-v3-20261104` (niemals alte `main/index.html` als Entwicklungsbasis verwenden).
- Testlink: https://v1thuu.github.io/vithu-wardrobe/preview/avatar-vnext-split-20261104/
- Preview in `main` ausschliesslich unter `preview/avatar-vnext-split-20261104/`; `main/index.html` und Netlify unverändert.
- Isolierte IndexedDB: `vithu_wardrobe_vnext_split_preview_20261104`.
- Kein Upload privater Bilder ins GitHub; die Bildverarbeitung für diese Texturen läuft ausschliesslich im Browser und verwendet gespeicherte Cutout-Data-URLs.

## Neue Funktionen
1. **Split-Textur-Mapping für Oberteile:** Stoffbild getrennt für linken Ärmel, rechten Ärmel, Brust/Hauptteil, rechten Brust-Print (falls dort vorhanden). Jede Zone besitzt ein eigenes SVG-Pattern und wird nur innerhalb ihrer Avatar-Kleidungsform gezeichnet.
2. **Split-Textur-Mapping für Hosen:** Bund, linkes Hosenbein und rechtes Hosenbein bekommen separate Ausschnitte. Slim/Straight/Wide bleiben als Silhouette.
3. **Split-Textur-Mapping für Schuhe:** Linke und rechte Hälfte des Original-Cutouts werden getrennt verarbeitet und an jeweils eine Avatarschuhform gebunden. Limitierung: Es wird aus dem Materialbild segmentiert, *nicht* eine echte 3D-Seitenansicht berechnet.
4. **Fit-Daten je Kleidungsstück:** `avatarFitV2: {length: 'short'|'regular'|'long', details: 'auto'|'smooth'|'detailed'}`, zusätzlich zum vorhandenen `avatarSubtype`. Nur im aufgeklappten Detail-Editor unter **Avatar-Feinschliff**, nie als zusätzliche Hauptbildschirmregler.
5. **Fallback und Privatsphäre:** Opaque Hintergrundfotos werden nicht blind als Stofftextur verwendet; bei fehlender/verzerrter Alpha-Maske bleibt das bisherige farbige SVG-Kleidungsmodell. Der Originalfoto-Modus bleibt erreichbar.
6. **Korrekte Kategorie-Caches:** Texturausschnitte sind pro Kategorie und Kleidungsstück indexiert und werden bei Bildwechsel neu berechnet.

## Bestehende Basis, die erhalten bleiben muss
- Garderobe, Einzelimport und Hybrid SegFormer B2/FASHN B4, Ablehnung falscher Fragmente, graue Slim Jeans, IndexedDB pro Artikel, Outfit-Looks, Fotoansicht, manuelle Fit-Positionen, persönlicher Avatar.
- V3 Outfit Studio mit Miniaturbildern, Auswahl, Mixen (bei genügend Teilen), Sichern.
- Backup-Export/Import enthält Artikeldaten, somit auch `avatarFitV2`.
- Keine Paid API.

## Isoliert tatsächlich getestet
- Syntax der Haupt-App und aller drei externen Skripte bestanden.
- Künstlicher alpha-transparenter Bildinput: neun einzigartige SVG-Texturzonen über T-Shirt (4), Hose (3), Schuhe (2); jedes Pattern gehört zur betreffenden Körperpartie, keine ganze gestreckte Fotoebene.
- Vollständig deckendes synthetisches Bild wird als ungeeignete Alpha-Freistellung erkannt.
- Änderungen von `length` wirken auf Hose; `details` fällt bei fehlendem Profil auf `auto` zurück.
- Kleidungsdetail-Editor im simulierten DOM: Standardwerte, Änderung, Speicherung und erneutes Laden des spezifischen Artikels geprüft, bestehende Outfit-Auswahl bleibt intakt.
- Backup-Import: Altformat ohne neue Fit-Felder, neues Format mit Fit-Feldern, invalides Backup abgelehnt; alter Avatar-Modus/AvatarFits bleiben kompatibel.
- `main`-Vorschau und Entwicklungsbranch über verbundenes GitHub erneut lesen, Page-Deploy separat bestätigen.

## Grenzen / keine falschen Behauptungen
- Kein echtes Generative Virtual Try-On, keine realistischen Stofffalten, kein Bitmoji-Qualitätsversprechen.
- Das Logo wird nur dann aus der richtigen Region übertragen, wenn es im gewählten Bild im erwarteten rechten Brustbereich liegt. Andernfalls kann es fehlen oder verzerrt wirken.
- Zwei Fotos von Schuhen mit unterschiedlicher Orientierung werden nicht geometrisch umgerechnet; splitten schützt mehr Details, garantiert keine perfekten Schuhe.
- Noch kein echter Safari-End-to-End-Test mit Nutzerbildern; visuellen Eindruck auf dem iPhone abnehmen, bevor irgendetwas in das Produktiv-Root übernommen wird.
- Es wurden keine Nutzerfotos in irgendeinem Preview-Commit aufgenommen.

## Testcheckliste iPhone
1. Neues isoliertes Preview öffnen. Backup der Garderobe importieren.
2. Avatar öffnen, schwarzes Logo-Shirt + graue Slim-Jeans + weisse Sneaker wählen.
3. Besonders auf rechte Brust, Denim links/rechts und Schuhe einzeln achten.
4. Garderobe → Jeans → Details → Avatar-Feinschliff: `Mehr Details` und `Kürzer/Länger` testen.
5. Outfit speichern, neu laden, prüfen; Originalfotos auswählen und zurück.
6. Test mit beschädigter Freistellung: keine Verwandlung in Vollbildhintergrund, lieber farbiger Fallback.

## Nächster sinnvoller Schritt
Nicht blind fünf kleine Patches. Zuerst reale iPhone-Screenshots bewerten. Falls trotz Split die Geometrie verzerrt: echtes semantisches Warp- oder lokal generiertes Avatar-Garment-System designen, mit klarer Kosten-/Datenschutzabwägung.
