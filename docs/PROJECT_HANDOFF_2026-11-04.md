# Übergabe VITHU WARDROBE — 4. November 2026

## Verifizierte Ausgangslage
- Repo: https://github.com/v1thuu/vithu-wardrobe
- **Neuester Entwicklungsbranch:** `fix/hybrid-denim-avatar-shape`, `index.html`.
- **Neueste isolierte iPhone-Vorschau auf main:** https://v1thuu.github.io/vithu-wardrobe/preview/denim-avatar-fix/
- **Preview-Pfad:** `preview/denim-avatar-fix/index.html`.
- Live-Root `main/index.html` ist eine alte Version (2.9.1), NICHT ungeprüft überschreiben.
- Die Vorschau verwendet eigene Datenbank `vithu_wardrobe_denim_avatar_preview`; die persönliche Garderobe in anderen Preview-URLs wird nicht übernommen.

## Funktionalität
- 3 Haupt-Tabs: Garderobe / Hinzufügen / Avatar.
- Lokale Hybrid-KI: SegFormer B2 und FASHN Human Parser B4 (nicht-kommerzielle Modelllizenz beachten); Auswahl pro Kleidungsart mit Fehlmasken-Prüfung.
- Bei erkannter Fehlmaske direkte Option **Verwerfen**; nützliche Vorschläge manuell korrigierbar.
- Einzelteil-Speicherung über IndexedDB v2 `garments_v2` / `metadata_v2`, Backup unterstützt.
- Avatar bleibt ein **2D-Overlay**, keine virtuelle 3D-Anprobe. Drag, Pinch, Grösse, Zentrierung, Ebenen und Kategorie-Defaults.
- Die neuesten Änderungen im Branch beheben zu strenge Slim-Jeans-Maskenprüfung und verbessern die CSS-Silhouette/Anker leicht. Keine tiefgreifende Avatar-Rekonstruktion.

## Nutzer-Testfälle
1. Siksilk schwarzes Logo-Shirt am tätowierten Model: B4 zeigt sauberere Shirtmaske und verhindert angehängten schwarzen Hosenbereich; Tattoo-Arm kann unter Fehl-Erkennung landen und soll direkt verworfen werden.
2. Spiegelselfie: schwarzes strukturiertes Kurzarmhemd (am Kragen noch Hautreste), weisse/creme Hose, am unteren Bildrand abgeschnitten.
3. Shopping-Screenshot graue Slim-Fit-Jeans, weisser Hoodie und weisse Sneaker: Jeansmaske teils gut, aber bisher als ungeeignet markiert; neuer Branch mildert Regeln für langes, zusammenhängendes schmal geschnittenes Hosenobjekt. 
4. Avatar-Test: schwarzes T-Shirt, graue Jeans, weisse Sneaker sichtbar übereinander gelegt; unnatürlicher grauer Torso und starre Arme. Nur CSS-Grundverbesserung, nicht realistischer Fit.

## Tests / Grenzen
- Neun isolierte JS-/Plausibilitätstests bestanden: schmale Jeans erlaubt, Tattoo-Arm und flacher Hosenstreifen abgelehnt, Hybrid-Auswahl, UI-Funktionen und Storage-Präsenz.
- JS kompiliert; Preview-Datei auf GitHub main verifiziert.
- **Keine vollständigen iPhone-Safari-End-to-End-Tests, keine quantitativ annotierte Masken-IoU und kein realer Avatar-Fit.** Nutzer soll neueste Preview am iPhone testen.
- Original-Nutzerfotos NICHT in öffentliches GitHub hochladen.

## Nächste Prioritäten
1. iPhone-Rückmeldung zur Jeans-Klassifizierung in neuer Preview.
2. Falls fehlerhaft: Metriken aus echten Masken/Bildkoordinaten statt weiterer unbelegter Heuristiken; keine fälschliche Bereit-Markierung.
3. Avatar-Strategie ausdrücklich entscheiden: 2D-Overlay realistischer gestalten ODER technisch neue Photo-/Try-on-Technologie evaluieren, statt nur wiederholt Position/Skala zu verschieben.
4. UI maximal schlank halten; keine neue Version bloss wegen Kosmetik.
5. Backup-Migration/Export-End-to-End testen vor Live-Rollout.

## Arbeitsweise
- Nutzer möchte direkte GitHub-Codeänderungen und separate iPhone-Testlinks; keine handschriftlichen Code-Upload-Schritte.
- Immer exakten Branch und Pfad fetch_file, konservativ editieren, JS syntaktisch prüfen, fallbezogen testen, Preview mit isoliertem DBNAME auf main veröffentlichen und danach fetch_file verifizieren.
- Bei neuem Chat die Screenshots oder Originalfotos bei Bedarf erneut hochladen, da nicht alle Anhänge garantiert übergreifend verfügbar sind.
