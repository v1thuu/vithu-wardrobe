# VITHU WARDROBE V3.6 – Qualitätsabnahme

## Ziel
Eine optionale zweite Kleidungssegmentierung untersucht den Ausschnitt eines bereits erkannten Kleidungsstücks grösser. Der Nutzer vergleicht das bisherige Ergebnis und die neue Maske, bevor er etwas übernimmt.

## Testplan (echte iPhone-Tests noch offen)

| Fall | Eingabe | Erwartetes Verhalten |
| --- | --- | --- |
| 1 | Schwarzes Hemd und weisse Hose (Spiegelselfie) | Beide Kleidungsstücke erkannt; Präziser ausschneiden verfügbar |
| 2 | Hemd aus Fall 1 | Vorher/Nachher-Vergleich sichtbar |
| 3 | Bisherige behalten | Bisherige Maske unverändert |
| 4 | Neue übernehmen | Nur ausgewählter Vorschlag geändert |
| 5 | Siksilk-Shirt mit Model | Shirt im Normalbereich, Arm-als-Hose im Prüfbereich |
| 6 | Einzelnes Shop-Produktfoto auf weiss | Einfacher Produktfoto-Pfad weiterhin nutzbar |
| 7 | Zwei Schuhe | Beide Schuhe im Produktvorschlag |
| 8 | Verdächtiger Arm als Hose | Zweite KI-Analyse hebt Sicherheitswarnung nicht automatisch auf |
| 9 | Neues Foto während laufender Analyse | Keine Übernahme eines alten Analyseergebnisses |
| 10 | Speichern, Neuladen, Backup exportieren/importieren | Kleidungsstücke bleiben erhalten |

## Technische Prüfungen durchgeführt
- JavaScript mit V8 auf gültige Syntax geprüft.
- Synthetischer Test: plausibles Kleidungsstück akzeptiert, extrem schmale und sehr kleine Masken verworfen.
- Schutz gegen veraltete Analyse bei Foto-Wechsel eingebaut.
- Sicherheitsmarkierung bei zuvor fraglichem Vorschlag bleibt nach neuer KI-Maske bestehen.

## Grenzen
- Verwendet weiterhin das lokale SegFormer-B2-Modell. Die zweite Analyse kann durch den fokussierten Bildausschnitt genauer sein, muss aber nicht.
- Reale iPhone-Safari-Tests und ein messbarer Bildqualitätsvergleich stehen noch aus.
- Die Vorschau hat eigenen Browser-Speicher. Keine privaten Outfitbilder in ein öffentliches GitHub-Repo hochladen.

## Vorschau
https://v1thuu.github.io/vithu-wardrobe/preview/v3-6/
