# VITHU WARDROBE – VNext iPhone Screenshot Feedback / Hotfix (2026-11-05)

## Source / scope
- User's screenshot confirms preview `https://v1thuu.github.io/vithu-wardrobe/preview/avatar-vnext-split-20261104/` is loading.
- Development branch `fix/avatar-texture-seams-and-shoes-20261105` based on `feat/avatar-vnext-split-textures-20261104`, **not** old `main/index.html`.
- Published as a *hotfix to the same preview's `avatar-v2.js`*, keeping the unique IndexedDB and saved wardrobe; not a separate version requiring backup.
- Old Netlify version and `main/index.html` unchanged; private images never committed.

## Observed from screenshot
1. Black T-shirt has duplicated logo: source chest texture already included the print; additional cropped `logo` overlay drew another copy.
2. Gray jeans show an artificial horizontal seam: previously waist panel and legs carried independent black SVG strokes and overlapped abruptly.
3. White sneakers remain visibly schematic; texturing alone is insufficient for a believable silhouette.
4. Shoulder/arm anatomy still stylized and stiff; **not addressed in this hotfix**.

## Changes
- Removed the redundant top logo crop and its overlay. Single original shirt print remains in the body texture.
- Jeans: waist first, legs afterwards with SVG vertical fade mask (218–236), internal strokes removed; outlines applied only along external edges and cuffs.
- Shoes: distinct rubber outsoles, toe/side contours, collar/shoe-lace details; left and right image samples remain independent.
- No changes to import/segmentation, garment records, avatar/fit settings, backup schema, or photo mode.

## Tests actually run
- Four scripts syntactically parsed: `index.html` inline, `avatar-v2.js`, `avatar-profile.js`, `photo-tryon.js`.
- Synthetic DOM/alpha-mask image simulation: eight unique texture patterns (3 top, 3 pants, 2 shoes), zero duplicated logo patterns, SVG seam-fade and masked jeans legs present, zero interior panel dark-strokes, separate shoe geometry, and opaque-image detection unchanged.
- GitHub preview module uploaded and expected source SHA verified.
- Pending: current GitHub Pages build/deployment success, genuine visual Safari regression using actual garments, and user confirmation.

## Limitations / next larger rendering move
- Shoes still cannot be photorealistic using only SVG shapes and texture crops from front/angled product shots.
- Whole-avatar proportions still need a design overhaul; do not claim Bitmoji quality.
- If user remains dissatisfied, prototype a calibrated sprite-layer garment system with region-specific asset anchoring instead of repeated SVG decoration.
