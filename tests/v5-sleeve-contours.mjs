#!/usr/bin/env node
// Tests the real silhouette-based sleeve anchors while preserving V4 renderer
// when optional alpha readback fails. Synthetic garment masks only.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const read=name=>fs.readFileSync(new URL('../'+name,import.meta.url),'utf8');
const natural=read('avatar-natural-v4.js');
const body=read('avatar-body-rig-v5.js');
assert.doesNotThrow(()=>new vm.Script(natural));
assert.doesNotThrow(()=>new vm.Script(body));
const sandbox={
 window:{renderAvatarV2(){}},
 document:{},chosen:{},console:{warn(){}},
 avatarRenderMode:'silhouette',avatarBodyRigMode:'joint',
 avatarProfile:{build:'athletic'},storageReady:false,
 persist:async()=>{},view:'styled'
};
vm.runInNewContext(natural,sandbox);
vm.runInNewContext(body,sandbox);
const {detectSleeveContour,cache}=sandbox.window.__vithuNaturalV4Test;
const geometry=sandbox.window.__vithuBodyV5Test.calculateRig;
const WIDTH=160,HEIGHT=180;
function mask(hasSleeves){
 const p=new Uint8ClampedArray(WIDTH*HEIGHT*4);
 for(let y=10;y<171;y++)for(let x=0;x<WIDTH;x++){
  const torso=x>=45&&x<=115;
  const sleeves=hasSleeves&&y>=32&&y<=73&&x>=6&&x<=154;
  if(torso||sleeves)p[(y*WIDTH+x)*4+3]=255;
 }
 return p;
}
const measured=detectSleeveContour(mask(true),WIDTH,HEIGHT);
assert.ok(measured,'bilateral short sleeves identified');
assert.ok(measured.score>.06,'strong contour evidence');
assert.ok(measured.left<.25&&measured.right>.75,'positions near sleeve openings');
assert.equal(detectSleeveContour(mask(false),WIDTH,HEIGHT),null,'no sleeves: fallback');
assert.equal(detectSleeveContour(null,0,0),null,'bad mask: fallback');
const item={id:'tee',image:'data:image/png;base64,dGVzdA=='};
cache.set('top:tee',{status:'ready',source:item.image,url:item.image,aspect:160/180,sleeves:measured});
const fit=sandbox.window.getNaturalSleeveFitV4(item,'top');
assert.ok(fit&&fit.left<fit.right&&fit.y>100,'sleeve bounds transform into avatar coordinates');
const placement=sandbox.window.getNaturalCutoutPlacementV4(item,'top');
const classic=geometry(placement,'athletic');
const aligned=geometry(placement,'athletic',fit);
assert.ok(aligned.sleeveX>classic.sleeveX+2,'real sleeve span changes the joint position');
assert.ok(aligned.sleeveY>=114&&aligned.sleeveY<=143,'sleeve Y is kept within safe limits');
assert.deepEqual(
 JSON.stringify(geometry(placement,'athletic',null)),
 JSON.stringify(classic),'null measurement returns same geometry'
);
assert.ok(geometry(placement,'athletic',{left:300,right:-1,y:NaN}).sleeveX===classic.sleeveX,
 'invalid measurements cannot corrupt the rig');
// Simulate Canvas that can paint garments but whose optional second
// getImageData() is unavailable, as may occur in restrictive iOS contexts.
const painted={width:0,height:0,getContext(){
 const ctx={
  drawImage(){},
  getImageData(){if(this===painted._sourceCtx)return {data:mask(true)};
   throw new Error('Readback blocked');}
 };
 if(!painted._sourceCtx)painted._sourceCtx=ctx;
 return ctx;
},toDataURL(){return item.image}};
const document={
 createElement(tag){
  if(tag!=='canvas')throw Error('Only canvas expected');
  const next=Object.create(painted);
  next.width=160;next.height=180;next.getContext=function(){
   if(!this._ctx){this._ctx={
    drawImage(){},getImageData(){
     if(next._readbackBad)throw Error('Readback blocked');
     return {data:mask(true)};
    }
   }}
   return this._ctx;
  };
  if(++document.created===2)next._readbackBad=true;
  next.toDataURL=()=>item.image;
  return next;
 },
 created:0,
 createElementNS(_ns,tag){return {tag,attrs:{},children:[],
   setAttribute(k,v){this.attrs[k]=v},append(n){this.children.push(n)}}}
};
class Image {
 constructor(){this.naturalWidth=160;this.naturalHeight=180}
 set src(_url){Promise.resolve().then(()=>this.onload?.())}
}
sandbox.document=document;sandbox.Image=Image;
const secondItem={id:'blocked-readback',image:'data:image/png;base64,bmV3'};
assert.equal(sandbox.window.getNaturalCutoutPlacementV4(secondItem,'top'),null,'initial asynchronous decode');
await Promise.resolve();
await Promise.resolve();
const retained=cache.get('top:blocked-readback');
assert.equal(retained?.status,'ready','optional contour readback must not discard cutout');
assert.equal(retained?.sleeves,null,'no false sleeve measurement');
const svg={children:[],append(node){this.children.push(node)}};
assert.equal(sandbox.window.renderNaturalCutoutV4(secondItem,'top',svg),true,'V4 clothing still renders');
assert.equal(svg.children.length,1,'real cutout rendered after optional scan failure');
console.log('PASS: real sleeve tips, fallback, iOS optional-readback guard, V4 original garment');
