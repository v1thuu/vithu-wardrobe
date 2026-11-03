# VITHU WARDROBE — Hybrid Import v3.10

Stand: 3. November 2026. Experimentelle Preview, Live-Garderobe bleibt unverändert.

## Ziel
Nach einem Foto werden für getragene Kleidung die beiden bereits im Browser verfügbaren Kleidungsparser **SegFormer B2** (Xenova) und **FASHN Human Parser B4** (q8) nacheinander ausgeführt. Auswahl erfolgt **pro Kleidungsart**, nicht pro ganzem Foto.

**Die Auswahl basiert auf heuristischen Regeln, nicht gemessener IoU oder einer dritten KI.**

## Routing
- Transparente / einfache Produktfotografie vor einheitlichem Hintergrund: bisherige schnelle Freistellung ohne Modell.
- Shopfoto am Model (erkannt an neutraler Kulisse oder weissen Screenshot-Kopf-/Fussbalken): B4 für Oberteile bevorzugen.
- Spiegelselfie/Outfit: B2 für Oberteile, B4 für Hosen bevorzugen.
- Bei ungültiger Maske fällt die Auswahl auf die andere plausible Modellmaske zurück.
- Manuelle Überschreibung der Fotoart unter **Bildtyp ändern**.

## Qualitätsregeln (heuristisch)
- Hose mit Breite/Höhe unter 0.30: mögliche Armmaske → nicht automatisch speichern.
- Hose unter 16% Bildhöhe: zu kleines Fragment → unbrauchbar.
- Breiter, flacher Hosenstreifen (Breite/Höhe über 2.2 und unter 30% Bildhöhe) → unbrauchbar.
- Abgeschnittene, aber ausreichend grosse Hose: **Prüfen**, nicht verwerfen.
- Unbrauchbares Teil: Speichern-Button gesperrt; manuelle Korrektur möglich, danach **Prüfen**.
- A/B-Vergleich nur, wenn beide Modelle für diese Kategorie plausible Masken haben. Er ist in **Weitere Werkzeuge** versteckt.
- Kein generatives Ergänzen der im Foto fehlenden unteren Hosenbeine.

## Bildtyp-Prüfung auf bereitgestellten Originalfotos
Die zwei Bilder wurden lokal geprüft, ohne Upload ins öffentliche Repo:
- Siksilk Produkt-Screenshot, 706×1536: weisse Kopf-/Fussbereiche ⇒ **Shop am Model**.
- Spiegelselfie, 1152×1536: gemischte Fliesen-/Raumkulisse ⇒ **Outfitfoto**.
Die Bildtypprüfung ist keine Prüfung der tatsächlichen Maskenqualität.

## Testmatrix (synthetische Kandidaten, JavaScript-Code)
Bestanden: Shop-Oberteil B4, Selfie-Oberteil B2, Selfie-Hose B4, Arm-Erkennung abgelehnt, flacher Hosenstreifen abgelehnt, zwei ungültige Masken nicht als Vergleich angeboten, abgeschnittene lange Hose im Prüfstatus, B4-Ausfall mit B2-Fallback, leere Modellantwort ohne erfundene Teile, Vergleich nur plausibler Masken, bestehende Einzelteil-Datenbank, Reparatur-Review, Invalid-Save gesperrt, stale photo guard, sequentielle Importwarteschlange, JavaScript-Kompilierung und HTML-Struktur. 19 Prüfungen in der Entwicklungsumgebung bestanden.

## Nicht getestet
- iPhone-Safari-Performance und Speicherverhalten von zwei Parsern nacheinander in der neuen Vorschau.
- Pixelgenauigkeit/IoU gegen annotierte Referenzmasken.
- Vollständiger Browser-UI-End-to-End- und Backup-Import-/Export-Test auf dem iPhone.
- Alle Kleidungsarten und übrigen Shop-Bildtypen.

## Sicherheits- und Produktgrenzen
- Keine Originalfotos in GitHub committet.
- FASHN Human Parser hat nicht-kommerzielle Lizenzbedingungen; kommerziellen Einsatz separat klären.
- Testvorschau hat eigenen IndexedDB-Namen. Keine automatische Migration aus produktiven Preview-Daten.
- Live-Root auf `main` bleibt unberührt.
