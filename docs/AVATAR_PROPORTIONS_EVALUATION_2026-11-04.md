# VITHU WARDROBE — Avatar-Proportionen & Kleidung (04.11.2026)

Basis: `feat/personalized-avatar-20261104`. **Nicht** vom alten `main/index.html` weiterentwickelt.

## Nutzerfeedback anhand iPhone-Screenshots
- Outfit (schwarzes Shirt, graue Jeans, weisse Sneaker) wird auf dem Avatar korrekt ausgewählt und angezeigt.
- Figur hat unnatürlich lange, breite Arme und breite Schultern; neutraler SVG-Körper hinter ausgewählten Kleidungsstücken sichtbar.
- Fotorealistische Anprobe ist ausdrücklich **nicht** Ziel; Nutzer bevorzugt kostenlosen, personalisierbaren Charakter.

## Änderung
- Neutraler SVG-Körper in Arme, Standardoberteil, Standardhose und Standardschuhe aufgeteilt.
- Standardkleidung unter eingesetzten Kleidungsstücken wird pro Kategorie versteckt, der Körper (Arme/Kopf) bleibt sichtbar.
- Arme näher an den Körper und kürzer gezeichnet, hand- und Schulterlinien angepasst.
- Keine Änderungen an Garderoben-Import, Jeansmasken-Regeln, IndexedDB-Schema, Fit-Gesten, Outfit-Auswahl oder Foto-Modus.
- Keine bezahlte API, kein Foto-Upload.

## Tatsächlich getestete Dinge
- JS-Parse von `avatar-profile.js` erfolgreich.
- Mock-DOM: Standardoberteil, -hose und -schuhe verschwinden nur bei getragenen Artikeln der entsprechenden Kategorie; beim Ablegen erscheinen sie wieder.
- Mock-DOM: Die Arm-Gruppe bleibt erhalten, auch wenn ein Oberteil getragen wird.
- `main`-Preview-Dateien erneut von GitHub gelesen und einzigartige DB sowie beide externen Skripte bestätigt.

## Noch offen
- Visuelle Qualität auf echtem iPhone ist nicht getestet; SVG-Integration im tatsächlichen mobilen Browser noch nicht end-to-end bestätigt.
- PNG-Freistellungen können stilistisch stärker fotorealistisch sein als der Charakter. Der nächste substanzielle Entwicklungsschritt wäre stilisierte Garment-Silhouetten passend zum Avatar, nicht zusätzliche Skalierungsschieber.

## Vorschau
https://v1thuu.github.io/vithu-wardrobe/preview/character-fit-20261104/

Eigene Datenbank `vithu_wardrobe_character_fit_preview_20261104`; vorhandene Vorschauen bleiben unverändert. Vorherige Garderobe per Backup importieren.
