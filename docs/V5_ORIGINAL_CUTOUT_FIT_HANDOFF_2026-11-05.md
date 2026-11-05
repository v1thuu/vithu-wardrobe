# VITHU WARDROBE V5 – Original-Cutout-Messung und visuelle Passform (05.11.2026)

## Zweck
Weiterentwicklung auf PR #32, ohne den stabilen Import oder die bestehende lokale Garderobe zu verändern. Aufgrund der iPhone-Tests: lockeres schwarzes Shirt und enges Tommy-Shirt sehen trotz guter Original-Cutouts zu ähnlich aus; Arme/Hände bleiben stilisiert.

## Was jetzt implementiert ist
- `avatar-natural-v4.js`: optionale Messung des bereits gespeicherten `item.image`-Original-Cutouts (Alpha), **nicht** von `shopImage`, `showShop` oder einem rekonstruierten Bild.
- Messgrössen in **Bildpixeln bzw. dimensionslosen Verhältnissen**: Schulternäherung, Brustweite, Taille, Saum, Ärmellänge, Ärmelweite innen/aussen, Gesamthöhe, soweit zuverlässig sichtbar Halsausschnitt. Ein fehlender Halsausschnitt kann null sein. Keine Angabe in cm oder verlässliche Aussage über tatsächliche Grössen.
- `getOriginalTopMaskMetricsV5()` macht die nur flüchtig im Render-Cache gehaltenen Daten verfügbar. Ist der optionale Canvas-Readback blockiert, bleiben die intakten gespeicherten Original-Cutouts unverändert und der Renderer fällt auf V4 zurück.
- `avatar-body-rig-v5.js`: `mapGarmentFitV5` ordnet die normalisierte Taillen-/Saumweite vorsichtig einem `fitted/regular/loose`-Score zu. `getAdaptiveCutoutPlacementV5` variiert **uniform** die Grösse des Kleidungsbildes mit Schranken. Der Körper selbst wird durch das Shirt **nicht** breiter oder schmaler.
- `avatar-v2.js`: Die neue Platzierung wird ausschliesslich bei `avatarBodyRigMode === 'joint'`, `avatarRenderMode === 'silhouette'` und Kategorie `top` benutzt. Der klassische V4-Arm- und Renderpfad bleibt bestehen. Die V5-Ärmelanker verwenden dieselbe berechnete Position wie das Originalbild.
- `index.html` unverändert, daher bestehende Optionen Länge, Stoffdetails und gespeicherte Auswahl unverändert.

## Grenzen
- Die Angabe `fitClass` ist eine **Heuristik** und kein gemessener Sitz auf dem Körper. Flach hingelegte, schräg fotografierte, schlecht freigestellte und stark geknitterte Shirts können die Verhältnisse verfälschen.
- Keine Retusche, Formkrümmung, Deformation oder physikalische Stoffs Simulation. Keine pixelgenauen 3D-Anproben versprechen.
- Die neuen Armgeometrien stammen weiterhin aus PR #32 und bleiben optisch auf echten iPhones zu prüfen.

## Tests
`node tests/v4-stability.mjs`
`node tests/v5-body-rig.mjs`
`node tests/v5-sleeve-contours.mjs`
`node tests/v5-fit-metrics.mjs`

Neuer Test: zwei synthetische Alpha-Shirts (fitted und loose), Schulter/Brust/Taille/Saum, Ärmelpositionen, Fallback auf leerem/undurchsichtigem Bild, unzulässige/negative Scores, Render-Skalierung innerhalb von Schranken, Seitenverhältnis unverändert, vorhandene Länge/Stoffdetails-Felder, bestehende Batch-Dialoge.

## Sichere Freigabe/Rollback
1. Nicht in `main` mergen oder bestehende Netlify-Root verändern, bis echte iPhone-Screenshots geprüft wurden.
2. Am besten separate isolierte V5-Vorschau aus diesem Branch bereitstellen, ohne fremden IndexedDB-Namen anzufassen.
3. Für Rückfall im aktuellen V5-Editor `Armform (Test) -> Bisherige Arme (V4)` auswählen. Für komplette Rücknahme PR/Commit aus dem isolierten Branch nicht übernehmen; bereits veröffentlichte V5-Vorschau unter `main/preview` wird von dieser PR **nicht** verändert.
4. Original-Cutouts und gespeicherte Garberoben-Daten bleiben unangetastet; kein Backup-Import notwendig.
