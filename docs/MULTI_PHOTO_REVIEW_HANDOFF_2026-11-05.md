# VITHU WARDROBE – Multi-Foto-KI-Import & Einzelprüfung
Stand: 2026-11-05

## Code-Quelle / keine ältere Version
- Base: `feat/garment-driven-body-rig-v3-20261105`.
- Entwicklung: `feat/multi-photo-review-queue-20261105`, **nicht** `main/index.html` (alte Produktivversion).
- Neue Testvorschau: https://v1thuu.github.io/vithu-wardrobe/preview/multi-photo-review-20261105/
- Separater IndexedDB-Name: `vithu_wardrobe_multi_photo_review_20261105`; vorherige Looks/Artikel nur nach manuellem Backup-Import sichtbar.
- Kein Foto, Screenshot, privates Nutzerbild oder Backupdatei wurde in GitHub committed.
- Neue AI-Dienste/Bezahl-APIs: **keine**. Vorhandene B2-/B4-Modelldownloads unverändert.

## Implementierung
- Native `<input type=file accept=image/* multiple>` im bestehenden Tab **Hinzufügen**; maximal 12 Bilder je Durchgang. Die Auswahl bleibt im Browser im Arbeitsspeicher und wird sequentiell verarbeitet, **nie alle Fotos gleichzeitig decodiert**.
- `batch-import.js` ergänzt eine kleine Warteschlange. Alle Fotos werden nacheinander durch den vorhandenen `onPhoto → runSmartRoute → smartProductImport / runHybridImport` Prozess geschickt. Kein Ersatz der eigentlichen Hybrid-KI, Qualitätsgrenzen, Denim-Fixes oder der Product-Route.
- Für jedes vom bestehenden Parser erkannte Teil **eine grosse Einzelvorschau** mit Name und editierbarer Kategorie, plus drei direkte Aktionen: **Speichern, Korrigieren, Verwerfen**. Für problematische Teile bleibt Speichern gesperrt, bis sie korrigiert sind; für unsichere Teile greift die bestehende Bestätigungsabfrage.
- Nach Speichern oder Verwerfen wird direkt das nächste noch offene Teil desselben Fotos gezeigt; wenn fertig, wird das nächste Foto geladen. Kein Auto-Save.
- Bei einem Foto ohne Treffer bleibt die Originalaufnahme zur manuellen Korrektur verfügbar, oder man kann sie überspringen. Eine fehlgeschlagene Bild-Decodierung wird nicht fälschlich mit dem vorherigen Bild korrigiert.
- Bei manuell gespeicherten Teilen wird die Batch-Statistik aktualisiert. Die Warteschlange bleibt bestehen, bis die Nutzerin/der Nutzer **Nächstes Foto** wählt.
- **Einzelbild bleibt im bisherigen Workflow**. Ein erneuter Import während einer aktiven Batch fragt vor dem Verwerfen der nicht gespeicherten Vorschläge. `Beenden` beendet nur die aktuelle Warteschlange, nicht die gespeicherte Garderobe.
- Kein neues IndexedDB-Schema. `saveSuggestion` bestätigt einen Artikel **erst nach erfolgreichem `persist()`** und behält bei Fehler den Kandidaten zur Korrektur. Alle bisherigen Looks, Avatare, Outfits und Backups bleiben erhalten.

## Konkrete Tests ausgeführt
1. Parse: aktuelles `index.html` Inline-JS und `batch-import.js` bestehen `new Function()`; V3-Avatar-/Foto-Module weiter vorhanden.
2. Synthetisches DOM: Drei Foto-Dateien, 2 Kandidaten auf Foto 1, keine Treffer auf Foto 2, 1 Kandidat auf Foto 3. Erster Kandidat gespeichert, zweiter verworfen, Foto 2 übersprungen, letzter Kandidat gespeichert. Auswertung: **2 gespeichert, 1 verworfen, 1 Foto übersprungen**.
3. Test der Korrigieren-Schaltfläche, Kategorie-/Namensfelder und des Übergangs von Batch- zu Einzelbildimport. Die alte Einzelbildroute bleibt aktiv.
4. Echter `saveSuggestion`-Code separat mit Speicher-Mock ausgeführt: erfolgreicher Save, abgebrochene Prüfung, abgewiesene Fehl-Erkennung, `persist`-Fehler mit Rollback; **kein Kandidatenverlust bei Fehler**.
5. Noch offen: echter iPhone-Safari-/In-App-Browser-Test mit iPhone-HEIC/JPEG/PNG und vollständigem B2/B4-Modell-Download über mehrere Fotos; echte IndexedDB-Transaktionstests mit Nutzerbildern; Battery/Memory-Stresstest.

## Grenzen ehrlich benennen
- Die vorhandene KI erzeugt je Foto mehrere **verschiedene Kategorien** (etwa Oberteil/Hose/Schuhe), fasst aber weiterhin häufig gleichartige Stücke einer Kategorie zu einer Maske zusammen. Zwei T-Shirts nebeneinander im selben Foto werden derzeit **nicht zuverlässig als zwei getrennte Artikel** erkannt. Das erfordert später Instance-Segmentation oder kontrollierte Komponentenaufteilung.
- Es werden höchstens 12 Fotos pro Durchgang angenommen, damit ein iPhone nicht unnötig viele Dateireferenzen hält.
- Die Warteschlange enthält ungespeicherte File-Objekte **nur im Tab-Speicher**. Nach einem vollständigen Seiten-Neuladen muss man diese Fotos erneut auswählen; bereits gespeicherte Kleidungsstücke bleiben in IndexedDB.
- Unvollständige/verdächtige Kleidungsstücke bleiben unsicher; keine angebliche KI-Erkennungsqualität versprechen.
- Der alte produktive `main/index.html` bleibt unberührt; alles nur auf isoliertem Vorschaupfad testen.

## iPhone-Abnahme
1. Aus der bisherigen V3-Preview ein **Backup** exportieren, neues Mehrfachimport-Preview öffnen und Backup importieren.
2. Unter **Hinzufügen → Fotos auswählen** 3–6 Bilder aus der Fotogalerie gleichzeitig markieren (z.B. zwei Shopbilder, ein Outfitfoto mit Jeans/T-Shirt/Sneakern).
3. Verifizieren: Foto 1/…; ein Kleidungsstück pro Prüfung, kategorisieren/umbenennen, Speichern, Korrigieren, Verwerfen.
4. Bei leerem Foto „Manuell ausschneiden“ oder „Nächstes Foto“. Gespeicherte Stücke erscheinen in der Garderobe.
5. Fotos erneut auswählen, eine einzelne Datei wählen und alten Workflow vergleichen.
6. Seite schliessen/öffnen: gespeicherte Artikel weiter vorhanden, ungespeicherte Foto-Warteschlange erwartungsgemäss nicht.
7. Avatar (Klassisch/V3) und Einzel-/Hybrid-Import mit der grauen Slim-Jeans regressionsprüfen.

## Entscheidend für künftige Version
Erst diesen Workflow mit echten iPhone-Bildern abnehmen. Danach ggf. Mehrfacherkennung gleichartiger Kleidungsstücke im selben Foto verbessern; nicht stillschweigend ein anderes Segmentierungsmodell einsetzen oder öffentliche Uploads verlangen.
