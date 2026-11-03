# V3.8 — Fashion Parser A/B Experiment

**Status:** Experimental / not production-approved.

## Purpose

The original user test photos demonstrate two errors with the current model:
1. Black Siksilk T-shirt on a model: neck tattoos and black trousers remain attached to the black shirt; tattooed forearm can be labelled pants.
2. Black textured short-sleeve shirt and cream trousers in a bathroom mirror selfie: collar contains skin, trouser legs are truncated by the original photo.

The source photos are **not** in this repository. The second error (missing lower trouser legs) is physically not recoverable by segmentation; a generative reconstruction would invent fabric.

## Genuine alternative model

- Baseline: `Xenova/segformer_b2_clothes`, quantized ~29MB, browser already deployed.
- Optional comparison: `faisal-shohag/fashn-human-parser-onnx` (SegFormer-B4, q8, ~67MB), browser Transformers.js v3.x.
- FASHN semantic labels differ: `top, pants, arms, hands, face, legs, torso`. The parser keeps arms/hands/torso as body labels and never maps them to clothes.
- **License:** this ONNX export inherits the underlying NVIDIA SegFormer non-commercial conditions. Check permitted use before any public/commercial deployment.
- FASHN model is activated by a deliberate user click. It is **not** bundled, loaded automatically, or substituted for existing items.
- The existing mask/refinement and wardrobe image storage remain intact.
- Each garment category shows old and new extracted images. The user may accept the new mask per category, or keep the old one.
- New mask acceptance is always marked for manual review. No automatic claims of improvement.

## A/B criteria (manual visual QA on iPhone)

For each original photo, compare:
- Collar: visible skin/tattoos outside the shirt should be transparent
- Sleeves: tattoos, hands and arms should not merge into the fabric
- Hem: black trousers should not remain under a black T-shirt
- Pattern/logo: white script and the wrinkled texture must not be corrupted
- Complete garment: neither shirt nor pants should be accidentally cut off
- Inference latency, memory and model download (check whether Safari evicts page)

Keep baseline when the new output is worse; do not treat overall mask area or elapsed milliseconds as an accuracy metric.

## Verifications already run

- V8 syntax compilation: passed.
- FASHN class mapping and exclusion of body labels: passed.
- Before/after mask selection preserving the item ID while requiring review: passed.
- Stale import serial doesn't overwrite subsequent images: passed in isolated function test.
- A genuine iPhone Safari run and IoU benchmark on annotated source images: **not yet executed**.

## Release discipline

- This is a **separate preview** with its own IndexedDB name.
- Live wardrobe root `index.html` remains unchanged.
- No original personal images should be uploaded to the public GitHub repository.
- Only merge into live after positive visual A/B evidence and backup round-trip verification.

Model sources:
- https://huggingface.co/faisal-shohag/fashn-human-parser-onnx
- https://github.com/fashn-AI/fashn-human-parser
- https://huggingface.co/Xenova/segformer_b2_clothes
