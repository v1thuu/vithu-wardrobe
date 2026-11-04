# VITHU WARDROBE — Personal Avatar (04.11.2026)

## Grundlage
- Entwicklung **nicht** von `main/index.html`; Branch `feat/personalized-avatar-20261104` basiert auf `feat/photo-pose-tryon-20261104` (enthält Denim-Fix aus `fix/hybrid-denim-avatar-shape`).
- Preview: https://v1thuu.github.io/vithu-wardrobe/preview/personal-avatar-20261104/
- Nur Preview-Dateien auf `main` unter `preview/personal-avatar-20261104/`. Produktivdatei `main/index.html` bleibt alt und unverändert.
- Isolierte IndexedDB: `vithu_wardrobe_personal_avatar_preview_20261104`; keine automatische Übernahme aus anderen Preview-Datenbanken. Backup aus einer anderen Version kann manuell importiert werden.

## Neu
- Eigenständige, **ursprünglich entworfene SVG-2D-Figur** statt der bisherigen grauen Trapez-Silhouette.
- Dezenter neutraler Basislook und detaillierteres Gesicht, Haare und Bart.
- Fünf personalisierbare Merkmale hinter **Meinen Avatar gestalten**: Statur, Hautton, Kurzhaar/Locken/Buzzcut, Bart, Sonnenbrille.
- Default als stilisierte Orientierung an Nutzerfoto (athletisch, warmer Hautton, dunkle kurze Haare, Bart, Sonnenbrille); **keine automatische oder präzise Rekonstruktion von biometrischen Merkmalen**.
- Das alte CSS-Mannequin bleibt für einen sicheren Fallback im DOM; kein Eingriff in die vorhandenen Kleidungs-Overlay-IDs, deren Touch-Gesten, Speicherung und Schichtung.
- Profil persistiert in bestehender IndexedDB-Metadatenstruktur, im Backup enthalten; alte Backups ohne Profil bekommen Defaults.
- Bestehende Foto-Anprobe und Hybrid-Kleidungserkennung unverändert. Kein kostenpflichtiger KI-Dienst für den Avatar.

## Durchgeführte isolierte Tests
- Hauptskript und `avatar-profile.js` JavaScript-Syntax erfolgreich geparst.
- SVG-Strukturelemente und die fünf UI-Auswahlen auf Existenz geprüft.
- Mock-DOM: Erstellung des SVG, Build-Verbreiterung, Hautfarben und Anzeige der Haar/Bart/Brillen-Gruppen geprüft; fünf gültige Änderungen persistiert, ungültige abgewiesen.
- Mock-IndexedDB: Profiländerung wird nur in Metadaten gespeichert; unveränderte Jeans wird **nicht** neu geschrieben; vorhandene Avatar-Fits unverändert, State-Snapshots korrekt kopiert.
- Backup-Test mit Alt-Backup und neuen Avatar-Einstellungen, Fehlerfall alter Daten geprüft.
- Preview-Dateien nach Push direkt auf GitHub `main` erneut gelesen: einzigartige DB, zwei relative JS-Dateien vorhanden, keine private Foto-Base64 eingebettet.

## Offene Grenzen — nicht als fertig verkaufen
- Kein echter Safari-End-to-End-Durchlauf der neuen Avatar-Ansicht auf Nutzergerät.
- Kein automatischer 3D-Körperscan und **kein** realistisches Garment-Warping: freigestellte Kleidungsfotos können im Stil von der Vektorgrafik abweichen.
- Kein Nachweis, dass z.B. helle Schuhmasken ohne Hintergrundflächen überlagert werden; dafür wären neue Kleidungsmasken oder stilisierte Garment-Illustrationen erforderlich.
- Die fünf Einstellungen ermöglichen einen persönlichen Charakter, ersetzen aber keine detaillierte Figur aus dem Nutzerfoto.
- Keine stillschweigende Übernahme in `main/index.html` vor Nutzerfeedback; Backup-End-to-End auf Safari nachholen.
