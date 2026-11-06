#!/usr/bin/env node
/* Free, local smoke/visual test of Fashion 2.5D on mobile viewport.
 * Requires: npm install --no-save playwright && npx playwright install chromium
 * Run: node tests/fashion25d-smoke.mjs
 * Uses synthetic fixture clothing, never real user wardrobe photos.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,dirname,extname,join,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const dir='preview/avatar-fashion25d-20261106';
const html=fs.readFileSync(join(root,dir,'index.html'),'utf8');
const fashion=fs.readFileSync(join(root,dir,'avatar-fashion25d.js'),'utf8');
assert.doesNotThrow(()=>new vm.Script(fashion),'2.5D module parses');
assert.match(html,/vithu_wardrobe_avatar_v5_joints_20261105/,'same browser wardrobe DB as V5 preview');
assert.match(html,/id="batchReviewDialog"/,'multi-photo review unchanged');
assert.match(html,/src="\.\/avatar-fashion25d\.js/,'new module loaded');
assert.match(html,/fashion25dChoice/,'reversible new-vs-old comparison control');
assert.doesNotMatch(fashion,/indexedDB\.open|\.put\(|\.delete\(|\bfetch\(/,
 'fashion layer has no storage mutations or remote fetch calls');
const urls=fashion.match(/https?:\/\/[^\s'"]+/g)||[];
assert.deepEqual(urls.filter(url=>url!=='http://www.w3.org/2000/svg'),[],
 'Only the standard local SVG namespace URI is allowed');
let chromium;
try {({chromium}=await import('playwright'))}
catch {throw Error('Install: npm install --no-save playwright && npx playwright install chromium')}
const types={'.html':'text/html','.js':'application/javascript','.css':'text/css',
 '.png':'image/png','.svg':'image/svg+xml','.wasm':'application/wasm'};
const server=createServer(async(req,res)=>{
 try{
  const raw=decodeURIComponent(new URL(req.url||'/', 'http://localhost').pathname);
  const file=resolve(root,'.'+(raw==='/'?'/'+dir+'/index.html':raw));
  if(!file.startsWith(root+sep))throw Error('Invalid path');
  const data=await readFile(file);
  res.writeHead(200,{'Content-Type':types[extname(file)]||'application/octet-stream',
   'Cache-Control':'no-store'});res.end(data);
 }catch{res.writeHead(404);res.end('Not found')}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const browser=await chromium.launch({headless:true});
const out=resolve(root,'artifacts/fashion25d-iphone');
const screenshots=[];
try{
 const context=await browser.newContext({
  viewport:{width:390,height:844},deviceScaleFactor:3,isMobile:true,
  hasTouch:true,reducedMotion:'reduce'
 });
 const page=await context.newPage();
 const pageErrors=[];
 page.on('pageerror',err=>pageErrors.push(String(err)));
 await page.goto('http://127.0.0.1:'+server.address().port+'/'+dir+'/index.html',
  {waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>window.__vithuFashion25dTest &&
  document.getElementById('fashion25dBase') &&
  document.getElementById('fashion25dForeground'),{timeout:15000});
 await page.click('#tab-avatar');
 async function fixture(state){
  return page.evaluate((kind)=>{
   function shirt(mode){
    const canvas=document.createElement('canvas');canvas.width=220;canvas.height=230;
    const ctx=canvas.getContext('2d');
    ctx.fillStyle=mode==='fitted'?'#15171d':'#20272e';
    const left=mode==='fitted'?67:48,right=220-left;
    ctx.beginPath();ctx.moveTo(83,22);ctx.lineTo(137,22);
    ctx.lineTo(154,32);ctx.lineTo(198,63);ctx.lineTo(180,103);
    ctx.lineTo(right-5,87);ctx.lineTo(right,211);
    ctx.quadraticCurveTo(110,220,left,211);
    ctx.lineTo(left+5,87);ctx.lineTo(40,103);ctx.lineTo(22,63);
    ctx.lineTo(66,32);ctx.closePath();ctx.fill();
    ctx.globalCompositeOperation='destination-out';ctx.beginPath();
    ctx.ellipse(110,20,23,13,0,0,Math.PI*2);ctx.fill();
    return canvas.toDataURL('image/png');
   }
   // Data URLs here are test-only in-memory fixtures; nothing enters IndexedDB.
   items=kind==='empty'?[]:[{id:'synthetic-'+kind,category:'top',
     name:'Synthetic '+kind+' T-shirt',image:shirt(kind)}];
   chosen=kind==='empty'?{}:{top:'synthetic-'+kind};
   avatarRenderMode='silhouette';avatarBodyRigMode='joint';view='styled';
   window.renderCustomAvatar?.();window.renderAvatarV2?.();
   return chosen.top||'';
  },state);
 }
 for(const state of ['empty','fitted','loose']){
  const id=await fixture(state);
  if(id){
   await page.waitForFunction(id=>
     !!document.querySelector('#avatarV2Garments [data-avatar-slot="top"][data-renderer="original-silhouette-v4"]'),
      id,{timeout:10000});
  }
  await page.evaluate(()=>window.__vithuFashion25dTest.sync());
  const actual=await page.evaluate(()=>({
   fashion:document.getElementById('figure').classList.contains('fashion25d-enabled'),
   front:!!document.getElementById('fashion25dForeground').querySelector('#fashion25dHead'),
   hands:!!document.getElementById('fashion25dForeground').querySelector('#fashion25dHands'),
   oldHidden:getComputedStyle(document.getElementById('personaDrawing')).display==='none',
   neutralTop:!!document.getElementById('fashion25dBase').querySelector('#fashion25dTop')
  }));
  assert.equal(actual.fashion,true,'Fashion 2.5D enabled');
  assert.equal(actual.front,true,'head rendered in foreground');
  assert.equal(actual.hands,true,'hands rendered in foreground');
  assert.equal(actual.oldHidden,true,'old SVG body is hidden');
  assert.equal(actual.neutralTop,state==='empty','neutral shirt hides behind real garment');
  await mkdir(out,{recursive:true});
  const target=join(out,state+'.png');
  await page.screenshot({path:target,fullPage:false,animations:'disabled'});
  screenshots.push({state,path:target});
 }

 const garmentBefore=await page.evaluate(()=>Array.from(document.querySelectorAll('#avatarV2Garments image')).map(el=>el.getAttribute('href')));
 const fashionStage=await page.locator('#stage').screenshot({animations:'disabled'});
 await page.click('#fashionStudioChoice');
 const studioState=await page.evaluate(()=>({
  mode:window.__vithuFashion25dTest?.getMode(),
  enabled:document.getElementById('figure').classList.contains('fashion25d-studio'),
  head:!!document.querySelector('#fashion25dStudioHead'),
  hands:!!document.querySelector('#fashion25dStudioHands'),
  cartoonHead:!!document.querySelector('#fashion25dHead'),
  skinVisible:getComputedStyle(document.getElementById('fashion25dForeground')).display,
  wornImages:Array.from(document.querySelectorAll('#avatarV2Garments image')).map(el=>el.getAttribute('href'))
 }));
 assert.equal(studioState.mode,'studio','studio selection active');
 assert.equal(studioState.enabled,true,'studio figure class visible');
 assert.equal(studioState.head,true,'faceless studio head rendered');
 assert.equal(studioState.hands,true,'neutral studio hands rendered');
 assert.equal(studioState.cartoonHead,false,'cartoon face suppressed only in studio');
 assert.equal(studioState.skinVisible,'block','studio layer visible');
 assert.deepEqual(studioState.wornImages,garmentBefore,'original garment image URLs unchanged by body style');
 const studioStage=await page.locator('#stage').screenshot({animations:'disabled'});
 assert.notEqual(Buffer.compare(studioStage,fashionStage),0,'studio and personalized fashion must render differently');
 const studioImage=join(out,'studio-mannequin.png');
 await page.screenshot({path:studioImage,fullPage:false,animations:'disabled'});
 screenshots.push({state:'studio-mannequin',path:studioImage});

 await page.click('#fashionV5Choice');
 assert.equal(await page.evaluate(()=>
  document.getElementById('figure').classList.contains('fashion25d-enabled')),false,
  'V5 fallback remains selectable');
 const v5Stage=await page.locator('#stage').screenshot({animations:'disabled'});
 assert.notEqual(Buffer.compare(fashionStage,v5Stage),0,
  'Switching Fashion/V5 must visibly alter stage pixels, not only toggle button styling');
 const visibility=await page.evaluate(()=>({
  old:getComputedStyle(document.querySelector('#personaDrawing')).display,
  base:getComputedStyle(document.querySelector('#fashion25dBase')).display,
  front:getComputedStyle(document.querySelector('#fashion25dForeground')).display
 }));
 assert.equal(visibility.old,'block','fallback SVG visible');
 assert.equal(visibility.base,'none','2.5D base hidden on fallback');
 assert.equal(visibility.front,'none','2.5D head/hands hidden on fallback');
 const legacy=join(out,'v5-rollback.png');
 await page.screenshot({path:legacy,fullPage:false,animations:'disabled'});
 screenshots.push({state:'v5-rollback',path:legacy});
 await page.click('#fashion25dChoice');
 assert.equal(await page.evaluate(()=>
  document.getElementById('figure').classList.contains('fashion25d-enabled')),true,
  'Fashion 2.5D can be restored');
 assert.equal(await page.evaluate(()=>
  window.__vithuFashion25dTest?.getMode()),'fashion',
  'personalized fashion can be restored without changing saved data');
 assert.deepEqual(pageErrors,[],'no uncaught browser errors');
 await writeFile(join(out,'manifest.json'),JSON.stringify({
  viewport:{width:390,height:844,devicePixelRatio:3},
  photos:'Synthetic cutouts, no real user photos',screenshots
 },null,2));
 console.log('PASS: Studio head/hands, original cutouts preserved, Fashion/V5 rollback and mobile PNG fixtures');
 await context.close();
}finally{
 await browser.close();
 await new Promise(resolve=>server.close(resolve));
}