# VITHU WARDROBE V3.7 — Technische Modell- und Qualitätsprüfung

Stand: 2026-11-03. **Keine erfundenen Genauigkeitswerte oder iPhone-Benchmarks.**

## Vorhandene Optionen

| Methode | Zweck | Modelltauglichkeit | Stand |
|---|---|---|---|
| SegFormer B2 `Xenova/segformer_b2_clothes` | Hemd/Hose/Schuhe aus angezogener Kleidung getrennt erkennen | Browser/WASM bereits im Projekt vorhanden | **Aktiv** |
| SegFormer B2 — fokussierter Zweitlauf | Einzelnes Teil erneut verarbeiten | Gleiche Gewichte, ggf. andere Maske | Optionales Experiment, Vorher/Nachher; **nicht** neuer Modelltyp |
| Lokale randverbundene Hintergrundmaske | Einzelnes freistehendes Produkt vor neutralem Hintergrund | Ohne Modelldownload; scheitert bei komplexen Shopscreenshots | **Aktiv** |
| `Xenova/modnet` | Menschen/Portraits freistellen | Apache-2.0, Browser-Support vorhanden; kein separates Kleidungsmodell | Nicht für Hemd-/Hosen-Trennung integriert |
| `briaai/RMBG-1.4` | Allgemeine Vordergrundfreistellung | 44,4 MB quantisierte ONNX-Gewichte; Quelle nennt Nutzungsbeschränkungen | Wegen Lizenz und unvalidierter iPhone-Laufzeit nicht integriert |
| BiRefNet / BiRefNet-lite | Detailreiche Vordergrundmaske | Als Browserprojekt BG0 erprobt, Gerätelast/Modellgewichte erheblich | Kandidat für gesonderten, beaufsichtigten iPhone-Leistungstest, nicht Release-Abhängigkeit |

## Vergleichbarkeit
Die App protokolliert beim lokalen Import die *Laufzeit* der SegFormer-Gesamtbild- und optionalen Fokus-Analyse sowie des Produktmaskenpfads. Dieser Vergleich misst **nicht** Segmentierungsgenauigkeit.

Für eine Aussage „bessere Bildqualität“ werden mindestens dieselben Originale und manuell geprüfte Referenzmasken benötigt. Zu erfassen:
- Precision / Recall / IoU nach Kleidungsart
- Erhalt von Kragen, Ärmeln, Bündchen, Hosenenden, Schuhpaaren
- Verunreinigung durch Haut/Tattoos/Shop-UI
- Laufzeit, RAM-/Abbruchverhalten auf iPhone Safari
- Lizenzen und Downloadgrösse

Keine allgemeine Behauptung von „mehr Genauigkeit“ ohne diese Validierung.

## V3.7 Qualitätsentscheidung
`Bereit`: keine derzeit bekannten offensichtlichen Form- und Bildrandprobleme.
`Prüfen`: am Bildrand abgeschnitten, Shop-Kategorie unbestätigt, Modell-/Körperüberschneidung.
`Ungeeignet`: eindeutiges armförmiges Fehlsegment als Hose erkannt.
Die Schwellen sind **Heuristiken**, keine Wahrscheinlichkeiten. Fehlklassifikationen bleiben möglich; keine Erkennung ersetzt die Sichtprüfung.

## IndexedDB Migration
Altes Format: `data/state` enthält alle Bilder gemeinsam.
Neues Format (DB-Version 2): `garments_v2` (ein Teil pro Key), `metadata_v2/app` (Looks/Avatar-Fits).
- Migration von `data/state` zu neuen Stores in einer einzigen Readwrite-Transaktion.
- Altes `data/state` bleibt **unangetastet** als Rollback.
- `metadata_v2/app.migrated` wird erst mit erfolgreichen Garment-Writes committed.
- Spätere Persistierung vergleicht kleinere Metadaten und Bild-Referenzen und schreibt nur geänderte Teile.
- Löschungen löschen einzelne Keys.
- Export-/Import-JSON-Format bleibt kompatibel mit V3.6.
- Die Preview verwendet einen isolierten Datenbanknamen.

## Manuelle iPhone-Abnahme (noch ausstehend)
1. V3.6 Backup exportieren, in V3.7 Preview importieren. Stückzahl, Bilder, Favoriten und Looks vergleichen.
2. T-Shirt am Model: vermeintliche Arm-Hose sollte als ungeeignet separat erscheinen.
3. Vollbild-Spiegelselfie: Hemd und abgeschnittene Hose separat prüfen, Hose nicht als Haut deklarieren.
4. Einfache Shop-Produktaufnahme vor neutralem Hintergrund: Kategorie prüfen, speichern.
5. Zwei Schuhe aus demselben Bild: beide im ausgeschnittenen Produkt enthalten.
6. Mindestens 30 Teile importieren, 10 Favoriten/Name-Bearbeitungen und ein Löschen. Backup exportieren und auf frischer Datenbank wieder importieren.
7. Modellvergleich mit Originalen nur bei deutlich sichtbarem Vorher/Nachher-Gewinn als bessere Bildqualität bewerten.

**Live-App bleibt unberührt. Keine produktive Migration ohne erfolgreiches Backup- und Safari-Testing.**
