# VITHU WARDROBE – Avatar Studio mit Stoffdetails (4. November 2026)

## Aktuelle Wahrheit / korrekte Grundlage
- Neuester Arbeitsbranch: `feat/avatar-studio-texture-v3-20261104` auf Basis `feat/avatar-v2-stylized-garments-20261104`.
- Repo: https://github.com/v1thuu/vithu-wardrobe
- Neue isolierte iPhone-Vorschau: https://v1thuu.github.io/vithu-wardrobe/preview/avatar-studio-texture-20261104/
- Vorschau-Dateien auf GitHub `main` ausschließlich in `preview/avatar-studio-texture-20261104/`. **Alte `main/index.html` ist V2.9.1 und wurde nicht geändert.**
- Datenbank der neuen Preview: `vithu_wardrobe_avatar_studio_texture_20261104`. Sie übernimmt nicht automatisch Daten aus anderen Vorschauen. Der Nutzer muss sein Garderoben-Backup manuell importieren.
- Keine privaten Nutzerfotos in GitHub committed.

## Produkt-Richtung
Die bisherigen Versuche:
1. CSS-Mannequin und rohe PNGs (sichtbar aufgeklebt).
2. Lokale Pose-Foto-Anprobe (korrekt erkannt, Kleidung weiterhin darübergelegt).
3. Personalisierter SVG-Avatar mit rohen Fotos (Stilbruch).
4. V2-Illustrationsrenderer (konsistenter Cartoon, aber nur flache Farben und Marke/Denim nicht wiedererkennbar).
Nutzerfeedback: ausdrücklich eine **deutlich bessere Gesamtversion statt fünf Mini-Korrekturen**. Kostenlos, kein kostenpflichtiger Try-on-Dienst; Persönlichkeit und Produkte müssen erkennbar bleiben.

## Inspiration aus digitalen Garderoben
- Whering: `Dress Me` mit schnellen Outfitkombinationen – https://whering.co.uk/outfit-maker-apps
- Stylebook: fotografisch erkennbare Produkte und gespeicherte Outfit-Collagen / Shuffle – https://stylebookapp.com/features.html
- Acloset: einfache Erfassung und Kombination der vorhandenen Garderobe – https://www.acloset.app/
Eigene Implementierung, keine kopierten Marken-Assets oder geschützten Designs. Social/Kalender/Shopping bewusst NICHT eingeführt.

## Diese Version: Was wirklich implementiert ist
1. **Avatar-Studio** direkt unter dem Charakter: sichtbare Foto-Thumbnails für Oberteil/Hose/Schuhe/Jacke, per Tippen nächstes vorhandenes Teil, `Mixen` (Shuffle vorhandener Teile), `♡ Sichern` (bestehender Look-Save).
2. **Schnitt-Templates** aus V2 bleiben: regulär/fitted/oversized, Hoodie/Jacke, Slim/Straight/Wide, Sneaker/Chunky/Boots; optionaler Schnitt im Inventar-Detail.
3. **Stoffdetail-Illustration** statt blosser Vollflächen: nur im Browser aus dem bereits lokal gespeicherten PNG Bildpixel/Alpha-Freistellung berechnen; transparenten Ausschnitt auf eine kleine Texture-Canvas skalieren, als SVG-Pattern nur *innerhalb* der standardisierten Silhouette rendern; Gradient und Konturen bleiben sichtbar. Dadurch können z.B. Jeans-Waschung oder kleine Shirt-Prints **teilweise** erhalten bleiben. Fehlende/falsche Alpha-Daten führen zu farbigen Templates als Fallback. Opaque Screenshot-Hintergründe werden nicht ungeprüft als Stoff übernommen.
4. Profil-SVG um Licht-, Gesichts- und Haarzeichnungen ergänzt. Kein 3D-Scan, kein generativer Try-On.
5. Originalfoto-Kleidung und Drag/Scale als alternative Ansicht erhalten. Alte Looks, IndexedDB-Stores `garments_v2`/`metadata_v2`, Hybrid-Import, Jeans-Fix, Foto-Referenz und Backup bleiben im Code erhalten.
6. Mobile UI kompakt (2-spaltige Outfitbilder, wenig Actions; Original-Feinjustierung nur im Originalmodus).

## Testprotokoll
- JS-Syntax des vollständigen Inline-Skripts, `avatar-v2.js`, `avatar-profile.js` und `photo-tryon.js` geparst.
- Mock DOM Test: 3 Kategoriegruppen (top, bottom, shoes), 3 Karten, Einzeltippen zum Wechseln, Mixen, Sichern; Anzeige-/Bedienelemente in Illustration/Original/Foto korrekt umgeschaltet.
- Synthetischer Transparenztest: RGBA-Bild, lokale Texture-Canvas erzeugt, SVG-Pattern mit eingebettetem Data-URL-Bild angelegt, Form mit Pattern überlagert; kein HTTP/Upload der privaten Bilddaten.
- Bereits vorliegender V2-Backup-Test: altes Backup und neues Mode-Feld werden importiert, korrupter Import abgewiesen. Nach diesem Commit zusätzlich erneut prüfen.
- GitHub-Vorschau inklusive aller drei Skripte direkt nach Commit per `fetch_file` gelesen; einzigartige DB und relativer Pfad geprüft.
- GitHub Pages-Deploymentstatus gesondert prüfen, nicht mit iPhone-Safari-Test verwechseln.

## Nachweisgrenzen – nicht als fertig verkaufen
- **Keine echte iPhone-Safari-End-to-End-Prüfung** von Import, Alpha-Masken, Look-Export und Pose-Try-On mit Originalbildern.
- **Kein vollständig fotorealistischer oder Bitmoji-ähnlicher 3D-Avatar**. Aktueller Ansatz ist vektorbasierter, schattierter 2D-Look mit Details aus Texturen.
- Logo, Stoffmuster und Sneaker-Details bleiben nur erhalten, wenn gute transparente Bilddaten vorliegen; Pattern-Mapping kann verzerren. Keine korrekte Grössen-/Passform-Simulation.
- Nutzer muss die neue Vorschau selbst mit seinem Backup testen. Alte Vorschauen und Live-Root erst nach Freigabe ersetzen.

## Reproduzierbare iPhone-Abnahme
1. Letzte Preview öffnen und Backup exportieren (sicher aufbewahren).
2. Neues isoliertes Studio öffnen, Backup importieren; schwarzen Logo-Tee, graue Jeans, weisse Sneaker auswählen.
3. Darauf achten, ob Logo/Denim-Waschung/Schuhdetails gegenüber V2 besser erkennbar sind.
4. Auf die Thumbnail-Karte für Top/Hose tippen, `Mixen` testen, `Sichern` und Look wieder laden, Seite neu laden (Persistenz).
5. Auf `Originalfotos` zurückschalten, alten Drag/Scale-Modus kontrollieren.
6. Testweise neue Jeans importieren und überprüfen, dass B2/B4-Hybrid und gespeicherte Masken weiterhin funktionieren.

## Nächste Entscheidung
Echte Nutzer-Screenshots im iPhone-Studio zuerst kritisch beurteilen; falls Texture-Mapping visuell hässlich, nicht weitere Grössen-Slider erzeugen, sondern die Vektor-Illustrationsstrategie überdenken. Immer tatsächlichen GitHub-Branch prüfen.
