#!/usr/bin/env node
// Verify garment alpha fitting without touching real customer photos or storage.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const read=n=>fs.readFileSync(new URL('../'+n,import.meta.url),'utf8');
const v4=read('avatar-natural-v4.js'),v5=read('avatar-body-rig-v5.js');
const app=read('index.html'),renderer=read('avatar-v2.js');
const sandbox={window:{renderAvatarV2(){}},document:{getElementById(){return null}},
 chosen:{},view:'styled',avatarRenderMode:'silhouette',avatarBodyRigMode:'joint',
 avatarProfile:{build:'athletic'},console:{warn(){}}};
vm.runInNewContext(v4,sandbox);
vm.runInNewContext(v5,sandbox);
const {measureOriginalTopMask}=sandbox.window.__vithuNaturalV4Test;
const {mapGarmentFitV5,getAdaptiveCutoutPlacementV5}=sandbox.window.__vithuBodyV5Test;
const W=180,H=200;
function shirt(type){
 const pixels=new Uint8ClampedArray(W*H*4);
 for(let y=27;y<190;y++){
  const t=Math.max(0,Math.min(1,(y-92)/95));
  const chest=type==='fitted'?60:50,waist=type==='fitted'?72:40;
  const left=Math.round(chest*(1-t)+waist*t);
  for(let x=left;x<W-left;x++)pixels[(y*W+x)*4+3]=255;
 }
 // Sleeves end above the chest rows; a centered collar dip remains visible.
 for(let y=39;y<83;y++)for(let x=12;x<169;x++){
  if(x<73||x>106)pixels[(y*W+x)*4+3]=255;
 }
 for(let y=27;y<41;y++)for(let x=78;x<102;x++)pixels[(y*W+x)*4+3]=0;
 return pixels;
}
const fitted=measureOriginalTopMask(shirt('fitted'),W,H);
const loose=measureOriginalTopMask(shirt('loose'),W,H);
assert.ok(fitted&&loose,'both original alpha cutouts measured');
for(const x of [fitted,loose]){
 for(const key of ['shoulderWidth','chestWidth','waistWidth','hemWidth','totalLength'])
  assert.ok(Number.isFinite(x[key])&&x[key]>0,key+' is a real mask measurement');
 assert.ok(x.sleeveLength!==null&&x.sleeveWidthUpper>0&&x.sleeveWidthLower>0,'sleeve length and widths measured');
 assert.ok(x.confidence>=.64,'synthetic clean cutout passes confidence threshold');
}
assert.equal(fitted.fitClass,'fitted','slim shirt detected');
assert.equal(loose.fitClass,'loose','wide hem and waist detected');
assert.ok(loose.fitScore>fitted.fitScore+.4,'fit classes visibly different');
const thin=mapGarmentFitV5(fitted),wide=mapGarmentFitV5(loose);
assert.ok(thin.garmentScale<.97&&wide.garmentScale>1.04,'nonidentical garment rendering scale');
assert.equal(mapGarmentFitV5(null).garmentScale,1,'no garment -> neutral');
assert.equal(mapGarmentFitV5({fitScore:NaN,confidence:1,chestWidth:70}).garmentScale,1,'corrupt scores -> neutral');
assert.equal(mapGarmentFitV5({fitScore:999,confidence:1,chestWidth:70}).garmentScale,1.09,'extreme high score capped');
assert.equal(mapGarmentFitV5({fitScore:-999,confidence:1,chestWidth:70}).garmentScale,.91,'extreme low score capped');
assert.equal(measureOriginalTopMask(null,0,0),null,'empty mask rejected');
assert.equal(measureOriginalTopMask(new Uint8ClampedArray(W*H*4),W,H),null,'transparent mask rejected');
const opaque=new Uint8ClampedArray(W*H*4);
for(let i=3;i<opaque.length;i+=4)opaque[i]=255;
assert.equal(measureOriginalTopMask(opaque,W,H),null,'opaque background rejected');
const base={x:30,y:80,width:120,height:125};
const originalGet=sandbox.window.getNaturalCutoutPlacementV4;
sandbox.window.getNaturalCutoutPlacementV4=()=>({...base});
sandbox.window.getOriginalTopMaskMetricsV5=item=>item?.fit;
const fittedItem={id:'slim',fit:fitted},looseItem={id:'loose',fit:loose};
const pThin=getAdaptiveCutoutPlacementV5(fittedItem),pWide=getAdaptiveCutoutPlacementV5(looseItem);
assert.ok(pThin.width<pWide.width,'real alpha measurements influence overlay width');
assert.ok(Math.abs(pThin.height/pThin.width-base.height/base.width)<.0002,'fitted image aspect ratio preserved');
assert.ok(Math.abs(pWide.height/pWide.width-base.height/base.width)<.0002,'loose image aspect ratio preserved');
assert.equal(getAdaptiveCutoutPlacementV5(null),null,'blank avatar keeps standard geometry');
assert.equal(getAdaptiveCutoutPlacementV5({id:'bad',fit:null}),null,'invalid mask uses old V4 placement');
sandbox.window.getNaturalCutoutPlacementV4=originalGet;
assert.match(renderer,/getAdaptiveCutoutPlacementV5/,'V5-only overlay mapping linked');
assert.match(renderer,/avatarBodyRigMode==='joint'/,'V4 classic branch unchanged');
assert.match(app,/id="batchReviewDialog"/,'original batch approvals intact');
assert.match(app,/Stoffdetails/,'detail setting retained');
assert.match(app,/Länge/,'length setting retained');
console.log('PASS: original alpha garment metrics, fitted vs loose, neutral fallback, aspect ratio, existing controls');
