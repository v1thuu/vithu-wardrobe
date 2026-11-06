# VITHU WARDROBE V6.1 – Premium UI Sprint (2026-11-06)

## Objective
UI first, realistic avatar later. Match the approved luxury dark fashion-app inspiration through a functional interface, without presenting photo mockups as code results.

## Scope: UI only
- New isolated path /preview/v6-premium-ui-20261106/ based on the tested V6 route.
- Existing V6 files (avatar, renderer, import, garments, worker, CSS, JS) are byte-identical to the working V6 preview. Only index.html has two additive CSS/JS tags and a versioned title.
- v61-premium.css: premium masthead with VITHU branding/navigation/settings; better spacing, calm charcoal gradients, subtle lime accents, improved action hierarchy, stage treatment, catalog and outfit cards. Desktop stays three-column.
- v61-premium.js: rearranges original header, nav and settings into one sticky masthead; on iPhone moves actual existing mode buttons above the stage, never duplicates handlers. Replaces a confusing fallback-only Zentrieren control with a functional navigation button to the original garment picker. No new API/storage calls.
- iPhone: compact two-row brand/nav, minimal Studio heading, immediately accessible model choice, preview card, then real outfit selection. The import and wardrobe screens still use the original functional code.
- All aesthetic changes are CSS/DOM; no modifications to body measurements, arm geometry, garments, mask measurements, original photos, IndexedDB schema/data, B2/B4, backup, or model services.

## Free and data safety
- No paid model or subscription. Original imports remain as they were.
- Same DBNAME 'vithu_wardrobe_avatar_v5_joints_20261105', same Github Pages origin. Garments show in the same mobile browser, with shared preview outfits. Netlify is a different origin; no automatic sync across origins/devices.
- Production Netlify https://peaceful-souffle-f3f53a.netlify.app/ and older GitHub preview paths remain untouched.
- The realistic human shown in the visual mockups is NOT implemented in Phase 1. After UI acceptance, Phase 2 must prove two real garment cutouts on the same new body before any release.

## Testing and release
- Node Playwright smoke for 390x844 DPR3 and 1440x900 desktop, synthetic in-memory clothing; same original renderer, tab functions, live style toggles, import, backup, no duplicate buttons, masthead and mobile quick modes, no overflow, functional outfit navigation.
- Screenshots and standalone Netlify ZIP/HTML collected as CI artifacts.
- Keep as Draft PR; merge only with manual Mobile Safari review.
- Rollback: go back to /preview/v6-fashion-studio-20261106/ or stable Netlify. No database migrations.
