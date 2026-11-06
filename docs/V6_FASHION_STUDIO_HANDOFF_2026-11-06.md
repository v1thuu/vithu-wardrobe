# VITHU WARDROBE V6 – Fashion Studio Preview (2026-11-06)

## Goal
Create the premium, responsive wardrobe dashboard style approved through visual mockups: dark charcoal interface, lime accents, left styling controls, central garment viewport, and right outfit cards. Use the existing functioning wardrobe and garment fitting logic; preserve a free workflow without paid AI APIs or subscriptions. Responsive desktop and iPhone views.

## Architecture
- New isolated GitHub Pages route: /preview/v6-fashion-studio-20261106/
- Standalone v6-ui.css restyles layout, inventory cards, stage and control panel. It cannot change originals, storage, models or crop/segmentation.
- Standalone v6-ui.js progressively rearranges the existing DOM nodes for controls, original garment SVG stage, outfit picker and fit sliders. No duplicated import or renderer logic.
- Existing ten preview files from preview/avatar-fashion25d-20261106/ are copied unchanged except for index.html (new stylesheet/script links and browser title). V5, fashion 2.5D and Studio-Mannequin remain selectable. This is the V6 UI milestone, NOT photorealistic virtual try-on.
- Legacy CSS/HTML remains fully functional if V6 JavaScript fails: progressive enhancement with body.v6-ready CSS scope.
- UI includes only functional controls already in the app (body build selection, fit adjustment, Mixen, Sichern, mode switches, upload, photo mode). Does not add cosmetic-only height/weight sliders.

## Data isolation & limitations
- IMPORTANT: same DBNAME vithu_wardrobe_avatar_v5_joints_20261105 as existing V5 GitHub Pages previews and same origin v1thuu.github.io, so previously saved Github V5 garments appear automatically on the same browser. Outfit changes in V6 also update V5 preview state. This is intentionally shared, not a new IndexedDB migration.
- Stable Netlify site at https://peaceful-souffle-f3f53a.netlify.app/ is different origin and NOT automatically synced. No scripts or database in stable Netlify have been changed. Backup import only when moving data across origins/devices.
- All real cutouts remain original stored item.image; shopImage/Clean images are never substituted for avatar.
- No paid cloud generative API. Original optional segmentation workflows may download a model on first use, as before.
- The rendered avatar is still the preexisting 2D/2.5D body. The photorealistic anatomy pictured in the design mockups is not implemented or claimed. New body realism remains a separate explicit feasibility gate: first demonstrate slim and loose shirts on the same anatomical base with original cutouts, then integrate if convincing.

## Automated acceptance
node tests/v6-fashion-studio-smoke.mjs (CI)
- Loads full real HTML app under local HTTP without altering user data.
- iPhone 390x844 @3x and desktop 1440x900 @1x, captures PNGs.
- Checks V6 layout, real original-cutout renderer, in-memory synthetic outfit rendering, all original app tabs, preserved multi-file/batch import, 3 avatar style options and V5 fallback, no uncaught exceptions.
- Only synthetic in-memory garments in CI; no private wardrobes or user uploads.

## Rollback
- In V6 use existing Fashion/Studio/V5 mode toggles.
- Return to fully unchanged GitHub Pages V5 preview:
  https://v1thuu.github.io/vithu-wardrobe/preview/avatar-v5-joints-20261105/
- Or the unchanged stable Netlify app:
  https://peaceful-souffle-f3f53a.netlify.app/
- Do not merge V6 without iPhone screenshots confirming the UI and both Tommy and black loose shirts in actual Safari. No body photo/try-on claim.
