# VITHU WARDROBE — Fashion 2.5D Preview (2026-11-06)

## Anlass
Mehrere echte iPhone-Tests haben gezeigt: Importierte Original-Kleidung sieht besser aus, der bisherige V5-Avatar mit SVG-Armen/Cartoon-Kopf bleibt aber optisch unglaubwürdig. Der Fotomodus ist nur eine Bild-Überlagerung und führt zu alten Shirts/Shorts darunter. Kein weiterer Versuch, das V5-Armskelett kosmetisch zu verändern.

## Ziel
Ein **kostenloser** lokaler 2.5D-Fashion-Avatar mit natürlich wirkenderem, kleinerem Kopf, massstäblicher Statur, sanfter Schattierung, Armen hinter echter Kleidung und Händen vor dem Hosenbund.

## Isolation und Daten
- Neue Vorschau: \`preview/avatar-fashion25d-20261106/\`, getrennt vom existierenden V5-Link.
- Auf \`v1thuu.github.io\` **derselbe Origin und dieselbe IndexedDB-Datenbank** wie V5: \`vithu_wardrobe_avatar_v5_joints_20261105\`. Die existierenden Kleidungsstücke werden ohne neuen Backup-Import angezeigt. Test und V5 haben geteilte Daten; Änderungen an Outfits/Speichern wirken deshalb auf dieselbe Vorschaugarderobe.
- Keine Änderung an \`main/index.html\`, dem V5-Vorschauordner, Netlify oder den importierten Originalbildern.
- Die alten JS-Dateien für V4, V5, Foto und B2/B4 werden unverändert als identische Blobs in den isolierten Testordner kopiert.
- Neues Modul \`avatar-fashion25d.js\`: nur zwei neue SVG-Ebenen. Kein Cloud-Modell, keine externen API-Aufrufe, keine Pakete und keine Speicherung von Designmodus; nur Frontend-Runtime.
- Bei \`Echter Schnitt\` ist Fashion 2.5D voreingestellt; \`Bisheriger V5\` lässt sich direkt daneben einschalten. V4-Armform im alten Avatar-Editor bleibt nutzbar.

## Grenzen
- Es handelt sich ausdrücklich um ein stilisiertes 2.5D-Modell, nicht um fotorealistisches oder physikalisch korrektes Virtual Try-On.
- Haut/Arm/Hand-Geometrie ist vereinfacht. Echte Stofffalten, präzise Ärmel-Anpassung und automatische Grössenbestimmung aus einzelnen Produktbildern sind damit **nicht** gelöst.
- Fotos und Kleidungsstücke werden nicht extern verarbeitet. Vorhandener optionaler KI-Import kann wie vorher Modelle von Drittanbieter-CDNs laden; der neue Avatar selbst benötigt keine.

## Abnahme
- Node/Playwright im Browser mit iPhone 390×844, DPR3: leer, synthetisches Slim-Shirt, synthetisches Loose-Shirt, und V5-Rollback.
- Entscheidend bleiben echte iPhone-Screenshots mit den beiden bestehenden schwarzen Shirts, Jeans und Sneakers.
- Den neuen 2.5D-Avatar nur dann weiterentwickeln, wenn Nutzer den grundsätzlichen Stil gegenüber V5 bevorzugt. Sonst Strategie überdenken.

## Rollback
- Im neuen Vorschau-UI \`Bisheriger V5\` wählen oder alten unveränderten Pfad \`/preview/avatar-v5-joints-20261105/\` öffnen.
- Die sichere Netlify-App bleibt separat unverändert.
