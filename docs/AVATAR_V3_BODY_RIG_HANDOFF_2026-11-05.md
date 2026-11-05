# VITHU WARDROBE – Garment-driven Avatar V3, Hand-off 2026-11-05

## Warum
Der Nutzer hat anhand des letzten iPhone-Screenshots angeregt, den Avatar-Körper **der Form der vorhandenen Kleidung** anzupassen, statt Produktbilder auf eine starre Figur aufzuspannen. Ziel: ein besser zusammenhängender, kostenloser 2D-/2.5D-Charakter; kein 3D-Scan, keine bezahlte API.

## Gesicherter Stand
- Repository: `v1thuu/vithu-wardrobe`
- Base: `fix/avatar-texture-seams-and-shoes-20261105` (inklusiv letztem Screenshot-Hotfix und funktionsfähiger Garderobe).
- Dev: `feat/garment-driven-body-rig-v3-20261105`; **NICHT** das veraltete `main/index.html`.
- V3-Preview: https://v1thuu.github.io/vithu-wardrobe/preview/body-aware-v3-20261105/
- Getrennte Preview-Datenbank: `vithu_wardrobe_body_aware_v3_preview_20261105`; keine automatische Datenübernahme. Bestehende Looks per Backup importieren.
- Nur Dateien innerhalb dieses Preview-Ordners werden nach `main` veröffentlicht. Produktive Root-/Netlify-Dateien bleiben unverändert.

## Technische Architektur
1. **Beibehalten:** `avatar-profile.js` = ursprünglicher SVG-Charakter (Personalisierung, Haut, Gesicht, neutraler Körper), `avatar-v2.js` = lokales Split-Texture-Kleidungsrendering, `photo-tryon.js` = separate Foto-Ansicht.
2. **Neu:** `avatar-rig-v3.js` = kontrollierter Körper-Rig mit `computeRig()`. Der ausgewählte Garment-Subtyp (Fitted/Regular/Oversized/Jacke, Slim/Straight/Wide, Sneaker/Chunky/Boot) bestimmt Schulterbreite/Arme, Bein- und Fuss-Skalierung; Werte werden auf sichere Bereiche begrenzt. Die Illustration und der Körper verwenden **dieselben Morphfaktoren**. Kleidung bestimmt also den Körperanker, nicht umgekehrt.
3. **Eigene Schnittkontur aus Cutouts:** falls ein gespeichertes Bild tatsächlich transparente Pixel besitzt, wird lokal auf max. 160 px skaliert und der Alpha-Bereich gemessen. Schulter-/Brust-, Oberschenkel-/Knöchel-Verhältnis und Schuh-Bildseitenverhältnis modulieren den Rig geringfügig. Opaque Screenshots oder defekte Bilder: konservativer Subtyp-Fallback. Cache pro Kleidungsstück+Kategorie und Bildversion; nur Bilddaten aus lokaler IndexedDB im Browser. Keine Netzwerkschnittstelle.
4. **Arme überarbeitet:** bisherige Schulter-Hautdreiecke beginnen auf y=86 vor dem Shirt. Im adaptiven Modus neue, an den Ärmeln innen ansetzende SVG-Arm- und Handformen ab y=116; sichtbare Konturen, kleine Finger- und Ellenbogendetails. Strikte 2D-Schichtung.
5. **Vergleichs- und Rückfallmodi:** `Meinen Avatar gestalten → Körper an Kleidung anpassen → Automatisch (V3) / Klassisch (V2)`; `Outfit-Darstellung → Originalfotos` unverändert. V3-Modus im bisherigen IndexedDB-Metadatenstore und Backup-Export/Import als `avatarMorphMode` gesichert.
6. **Unterstützt:** Outfit-Wechsel, Saved Looks, Photo-View, Hybrid-Import B2/B4, Jeans-Fix, vorhandene Kleidungsbilder/Textures und alle manuell gespeicherten Avatar-Fits unverändert. Keine neue UI-Steuerung am Avatar-Hauptscreen.

## Tatsächlich durchgeführte Tests
- Syntax aller 5 Scripts geprüft: main inline, Avatar-V2, Persona, Rig V3, Photo Try-On.
- Simulierter SVG-DOM: dynamische Schulter-/Armform aktiv, Figur und gezeichnete Kleidung nutzen Rig-Skalen.
- Vergleich: Oversized Tee / Wide Jeans modifizieren Rig gegenüber Regular/Slim; Chunky Footwear verändert Foot-Scale.
- Wechsel in Classic, Originalfoto und Photo-View stellt alte Pfade und Transformationsmatrix zurück; danach V3 erneut aktivierbar.
- Künstliche transparente Bildmaske: Alpha-Silhouettenmessung tatsächlich in Rig-Faktor berücksichtigt. Vollständig opake Cutouts abgelehnt, Fallback ohne Bildanalyse.
- Legacy-Backup ohne neues V3-Feld wiederhergestellt (Default adaptive); V3-Backup mit Klassisch-Einstellung und Fit-Daten wiederhergestellt; beschädigtes Backup ohne Überschreiben verworfen.
- Offen bis iPhone-Review: physische Darstellung im tatsächlichen Safari/Instagram-In-App-Browser, visuelle Vergleichsfotos mit Kleidung und längerer Persistenz-/Importtest auf Nutzergerät.

## Ehrliche Grenzen
- Dies ist **kein KI-3D-Avatar**, kein echtes Warping einer beliebigen Jeans und keine korrekte Grössenvorhersage; Körperveränderungen sind nur konservative 2D-Silhouettenanpassungen.
- Ein unbrauchbarer Bild-Hintergrund kann Konturerkennung verhindern; Metadaten-Fallback greift. Schuhe können weiterhin geometrisch vereinfacht sein.
- Avatar-Statur ist eine stilisierte Annäherung, keine automatische Körpermessung.
- Nicht mergen vor iPhone-Test und Backup-Roundtrip. Beim Review zuerst die Schulterhautlücken und die Übergänge Shirt/Bund/Schuhe vergleichen.

## Reproduzierbarer iPhone-Test
1. Vorherige VNext-Preview öffnen, Backup exportieren und sicher aufbewahren.
2. Neue V3-Preview öffnen, Backup importieren (separate DB).
3. Schwarzes T-Shirt, graue Slim-Jeans, weisse Sneaker auswählen; Foto von Avatar machen.
4. Unter `Meinen Avatar gestalten` den Körper von Automatisch V3 auf Klassisch V2 umschalten, dieselben Teile unverändert vergleichen. Zurück auf V3.
5. Optional in Garderobe pro Teil den Schnitt (z.B. Oversized oder Wide) ändern; Schulter-/Beinbreite soll sofort mitgehen.
6. Gespeicherten Look laden und Safari-Seite neu öffnen; erneut prüfen.
