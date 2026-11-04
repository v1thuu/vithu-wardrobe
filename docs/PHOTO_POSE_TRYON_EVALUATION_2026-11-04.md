# VITHU WARDROBE — Photo / Pose Try-On Spike (04.11.2026)

## Ausgangslage und Scope
Basis: `fix/hybrid-denim-avatar-shape` (nicht `main/index.html`). Neuer Entwicklungsbranch: `feat/photo-pose-tryon-20261104`.
Diese Änderung ersetzt **nicht** den bestehenden 2D-Avatar. Sie erweitert nur den schon vorhandenen Foto-Tab um einen separaten, auf dem Gerät arbeitenden Pose-Alignment-Prototyp.

## Implementiert
- Pose-Landmark-Erkennung auf dem vom Nutzer gewählten Ganzkörperfoto via MediaPipe Pose Landmarker (im Browser, erst nach explizitem Klick).
- Kleidungs-Overlays im Foto-Tab mit Positionen aus Schultern, Hüften und Knöcheln. Pinch/Drag separat; ursprüngliche Avatar-Fits bleiben erhalten.
- Automatischer Fallback auf grobe Default-Positionen, falls die Pose nicht erkannt wird, inkl. sichtbarem Fehlerstatus.
- Photo-Fits und Landmark-Koordinaten in IndexedDB-Metadaten, Aufnahme in Backup-Export/Import.
- Bei Foto-Wechsel werden bisherige Landmarken und Foto-Fits verworfen.
- Originalfunktionen für Garderobe, Hybrid-Erkennung, Original-Avatar, Looks bleiben unberührt, ausser restaurative State/Backup-Erweiterungen und Render-Hooks.
- Preview auf `main` **nur** unter `preview/photo-pose-20261104/` mit `DBNAME='vithu_wardrobe_photo_pose_preview_20261104'`, ohne Import aus gemeinsamem Legacy-localStorage.

## Ausgeführte programmatische Tests
- Inline-Hauptskript: JavaScript-Parse erfolgreich.
- `photo-tryon.js`: JavaScript-Parse erfolgreich.
- DOM-Stubs: Overlay aus vorhandener Hose erstellt, Pose-Geometrie aus synthetischen Landmarken erkannt und fehlerhafte Landmarken abgelehnt.
- Gesten-Stubs: Pointer-Drag verändert x/y, Pinch verändert Scale, Release startet Persistierung.
- IndexedDB-Stubs: Foto-Fit-Metadaten und Pose-Felder persistieren, Deep Copy verhindert versehentliche Mutation, unveränderte Kleidungsstücke nicht erneut geschrieben, Löschungen verarbeitet.
- GitHub `main`-Vorschau und Entwicklungsdateien erneut abgerufen, Datenbankname und relativer Skript-Pfad verifiziert.
- Keine echten privaten Nutzerbilder in GitHub committed.

## Noch **nicht** nachgewiesen
- Keine Safari-iPhone-End-to-End-Messung, kein echter Modell-Download in Safari und kein Live-Pose-Erkennungstest auf Originalfoto.
- Keine realistische Stoffsimulation; 2D-Overlays können sichtbar aufgeklebt wirken, darunterliegende Originalkleidung bleibt sichtbar.
- Kein Grösse-/Passformversprechen; die Technik ist kein 3D-Scan und keine KI-VTON (Virtual Try-On).
- Die graue Slim-Fit-Jeans wurde ohne die Originalmaske nicht neu geprüft. Kein Nachweis, dass der Fehler behoben ist.
- Nochmaliger Regressionstest mit realem Import/Backup auf iPhone und Windows notwendig vor Produktivübernahme.

## Produktentscheidung für nächsten Schritt
Photo-Pose Alignment ist ein risikoarmes Zwischenexperiment, kein finales Avatar-Design. Wenn optisch weiterhin unbefriedigend: nicht weitere Skalierungsbuttons bauen, sondern echte Virtual-Try-On-Modelle (Bildgenerierung, Occlusion, warping, datenschutzkonforme Verarbeitung und Lizenz) separat evaluieren und erst nach Qualitätsvergleich entscheiden.
