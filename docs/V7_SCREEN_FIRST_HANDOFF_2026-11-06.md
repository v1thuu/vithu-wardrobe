# VITHU WARDROBE V7 – screen-first fashion app

## Why V7 (6 November 2026)
The user compared working V6.1 iPhone screenshots with three reference images: a clean mobile wardrobe grid, an outfit builder / Create flow, a try-on result view, and a premium desktop studio. V6.1 is still a long web dashboard even after CSS polishing. **V7 must be a separate UI system**, not a V6 CSS layer.

## Actual V7 work
- New route: /preview/v7-wardrobe-app-20261106/
- Four interactive screens on mobile: Garderobe → Create → Avatar → Looks. Bottom tab bar on iPhone, top nav on desktop.
- Wardrobe: searchable two-column garment grid, category chips and favorite toggles, select existing garment to current look; 2D item images from local IndexedDB.
- Create: item composition board with top/bottom/shoes/outerwear, filtered garment picker, clear, save named look, and Try-On action.
- Avatar: preserved original SVG garment overlay and original cutout renderer, existing 2.5D / Studio-Mannequin / V5 selection; original fine-adjust controls remain accessible; no claims about photorealism.
- Looks: save/load/delete using the current data structure and the existing IndexedDB persistence, with a V7 inline dialog instead of a prompt.
- Import: existing, complete multiple-image and B2/B4 import page mounted unchanged inside V7 screen. Existing backup handlers are accessible through Settings.
- Desktop: 3-column actual outfit studio (controls – center stage – selected look); mobile: 1 screen at a time.
- New frontend files: v7.js and v7.css. The old V6 UI files are **not loaded**, unlike V6.1's progressive CSS layers.
- Legacy HTML/script still contains original app as fallback, hidden when V7 shell is loaded successfully.

## Data safety
- Same DBNAME 'vithu_wardrobe_avatar_v5_joints_20261105' as prior GitHub previews on v1thuu.github.io; no schema migrations, different browsers/devices do not sync.
- Shared preview data: when a user selects or saves a look in V7, this also changes corresponding V5/V6 preview data on the same origin. A separate backup is recommended before substantive editing.
- Root app, existing V5/V6 links and stable Netlify at https://peaceful-souffle-f3f53a.netlify.app/ remain unchanged.
- The existing original clothing Cutout is the source used by the Avatar (not a generated AI remix).
- No paid model, no cloud API. The optional existing free import model may download locally.
- The photorealistic avatar from user reference images has not been implemented. Phase 2 is gated by manual validation of two shirt variants on the same body.

## Quality gate
- Playwright: iPhone 390x844 DPR3 and desktop 1440x900. Validate full flow: wardrobe grid, add items to Create, 2D existing avatar, mode toggles, importer, save/load look, navigation, no crashes. Photos in GitHub Actions are synthetic only.
- Manual iPhone review with two existing black shirts, jeans and sneakers. Do not merge without approval.
- Rollback: return to https://v1thuu.github.io/vithu-wardrobe/preview/v6-premium-ui-20261106/ or original Netlify.
