# VITHU AVATAR V2 – Übergabe / Qualitätsstand (2026-11-04)

## Gesicherte Ausgangslage
- Branch: `feat/avatar-v2-stylized-garments-20261104`.
- Abzweigung: `fix/character-proportions-nov04`, nicht die veraltete `main/index.html`.
- Testversion: https://v1thuu.github.io/vithu-wardrobe/preview/avatar-v2-20261104/
- Preview pflegt eine **eigene** IndexedDB: `vithu_wardrobe_avatar_v2_preview_20261104`. Andere Vorschauen verlieren keine Daten, aber hier ist die Garderobe zunächst leer. Backup manuell übertragen.
- Live-Root `main/index.html` wurde **nicht** ersetzt.

## V2-Inhalt (neues Modul avatar-v2.js)
- SVG-Kleidungsillustrationen pro Kategorie an denselben 180 × 365 Koordinaten wie der SVG-Avatar; im Default-Modus werden Foto-PNG-Overlays der vier Basiskategorien **nur ausgeblendet**, nicht gelöscht.
- T-Shirt regular/fitted/oversized, Hoodie, Jacke, Slim/Straight/Wide Hosen, Sneaker/Chunky/Boots.
- Vorrangig manuell gespeicherter `avatarSubtype`, ansonsten einfache Namensheuristik mit konservativen Defaults. Garment-Details enthalten nur dort das optionale Feld `Schnitt am Avatar`.
- Lokale Farbe aus verkleinertem Canvas des gespeicherten freigestellten Bilds: Alpha-Filter und optionale Hintergrund-Ausschlussregel. Farben sind Näherungen, Muster/Logos werden **nicht** automatisch rekonstruiert.
- Kompakte Kleiderauswahl direkt unter Avatar für vorhandene Oberteile, Hosen, Schuhe, Jacken.
- Unter `Meinen Avatar gestalten`: `Illustration (V2)` oder `Originalfotos (manuell)`. Alter Drag/Scale-Editor bleibt in der Originalansicht verfügbar.
- `avatarRenderMode` in IndexedDB-Metadaten, Export, Import und Legacy-Fallback ergänzt. Persönliche Fotos **nicht** ins GitHub committed.
- Originale Foto-Anprobe, SegFormer/FASHN-Hybrid, Garderobe, bisherige Avatar-Fits, Outfit- und Backup-Funktionen bleiben im Code bestehen.

## Durchgeführte Prüfungen
- Haupt-JS und Modul syntaxgeprüft.
- Synthetische DOM-Tests für SVG-Overlays: drei gewählte Kleidungsstücke erzeugen drei Illustrator-Gruppen; Auswahlfelder werden aufgebaut; Körperbreite reagiert auf den Avatar-Staturwert.
- Szenarien für Original-Modus, Foto-Modus, zurück zu Illustration und keine ausgewählten Kleidungsstücke getestet; Editor-Sichtbarkeit überprüft.
- Synthetische RGBA-Maske: aus einer deckenden grauen Fläche auf transparentem Hintergrund wird die erwartete HEX-Farbe `#78828c` berechnet.
- Kategorie-/Subtype-Heuristik (Slim Jeans) getestet.
- Backup-Import mit Legacy-Datensatz, neuem V2-Modus, Schnittfeld, alten Fitwerten und ungültiger Importdatei getestet.
- GitHub-Skriptdateien und isolierte Vorschau auf `main` nach Veröffentlichung per `fetch_file` überprüft.

## Noch **nicht** als nachgewiesen darstellen
- Optische Qualität im echten iPhone-Safari-Browser mit Nutzerfotos noch nicht bestätigt. Kein End-to-End Safari-Test.
- Keine ausgereifte Vektorisierung von Kleidungslogos/Prints, Materialtexturen, echten Falten, Sock- und Ärmel-Occlusion. V2 ist eine konsistente stilisierte **Interpretation**, kein Bitmoji-, Meta-Avatar- oder photorealistischer Try-On-Klon.
- Keine manuelle Bewertung sämtlicher Farbmasken und Lichtverhältnisse; bei Weiss/transparenten Bildern kann die automatische Farbe falsch sein.
- Kein vollständiger Backup-Download-und-Reimport-Test auf iOS. Nicht in produktive Root-Version mergen, bis Nutzerergebnis und Backup verifiziert sind.

## Nutzerabnahme
1. Backup der vorherigen Preview exportieren, in V2 importieren.
2. Avatar auf **Illustration (V2)** stellen und schwarzes Shirt, graue Jeans, weisse Sneaker anziehen.
3. Optik / Farbähnlichkeit / Proportionen prüfen, dann zwischen Original und Illustration wechseln.
4. Ein Kleidungsstück ablegen und wieder anziehen (Pants/Base-Layer-Regressionskontrolle).
5. Im Garderoben-Detail `Schnitt am Avatar` (z.B. Straight/Wide) ändern und prüfen, ob das SVG sofort wechselt.
6. Danach Seite neu laden, Persistenz und gespeicherte Looks prüfen.

## Nächste Entscheidung
Nur wenn Illustration mit echten Nutzerstücken visuell deutlich besser ist: UI weiter vereinfachen und mehr präzise SVG-Schablonen hinzufügen. Andernfalls ehrlich entscheiden, ob ein neu entworfener 2.5D-Avatar notwendig ist. Keine teure API ohne ausdrückliche Zustimmung.
