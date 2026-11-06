#!/usr/bin/env node
/* VITHU WARDROBE V7: Screen-first MVP regression suite.
 * Synthetic in-memory clothing only; user photos, wardrobes and backups are
 * never read, written, uploaded or referenced by this test.
 *
 * Install: npm install --no-save playwright && npx playwright install chromium
 * Run: node tests/v7-app-smoke.mjs
 */
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {readFileSync} from 'node:fs';
import {resolve,dirname,join,extname,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const folder='preview/v7-wardrobe-app-20261106';
const html=readFileSync(join(root,folder,'index.html'),'utf8');
const app=readFileSync(join(root,folder,'v7.js'),'utf8');
const css=readFileSync(join(root,folder,'v7.css'),'utf8');
assert.doesNotThrow(()=>new vm.Script(app),'V7 application parses');
assert.match(html,/DBNAME='vithu_wardrobe_avatar_v5_joints_20261105'/,'same local IndexedDB');
assert.match(html,/id="batchReviewDialog"/,'batch-review preserved');
assert.match(html,/id="upload" type="file" accept="image\/\*" multiple/,'existing multi-file upload preserved');
assert.match(html,/src="\.\/avatar-natural-v4\.js/,'real original-cutout renderer remains');
assert.match(html,/src="\.\/avatar-fashion25d\.js/,'old avatar family remains');
assert.match(html,/src="\.\/v7\.js/,'new V7 app shell loaded');
assert.doesNotMatch(html,/src="\.\/v6-ui\.js|src="\.\/v61-premium\.js/,'not another patched V6 shell');
assert.match(css,/\.v7-bottom-nav/,'native-feeling mobile bottom navigation');
assert.match(css,/\.v7-avatar-layout/,'independent desktop studio layout');
assert.doesNotMatch(app,/indexedDB\.open|localStorage|\.deleteDatabase\(|\bfetch\(/,
 'V7 frontend creates no new persistence or external network path');
let chromium;
try{({chromium}=await import('playwright'))}
catch{throw Error('Install test browser: npm install --no-save playwright && npx playwright install chromium')}
const server=createServer(async(req,res)=>{
 try{
  const route=decodeURIComponent(new URL(req.url||'/','http://localhost').pathname);
  const target=resolve(root,'.'+(route==='/'?'/'+folder+'/index.html':route));
  if(!target.startsWith(root+sep))throw Error('Bad path');
  const data=await readFile(target);
  const types={'.html':'text/html','.css':'text/css','.js':'text/javascript','.svg':'image/svg+xml','.wasm':'application/wasm'};
  res.writeHead(200,{'Content-Type':types[extname(target)]||'application/octet-stream',
   'Cache-Control':'no-store'});res.end(data);
 }catch{res.writeHead(404);res.end('Not Found');}
});
await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
const browser=await chromium.launch({headless:true});
const artifacts=resolve(root,'artifacts/v7-app');
let screenshots=[];
try{
 for(const [kind,width,height,dpr] of [
  ['iphone',390,844,3],['desktop',1440,900,1]
 ]){
  const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:dpr,
   isMobile:kind==='iphone',hasTouch:kind==='iphone',reducedMotion:'reduce'});
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  await page.goto('http://127.0.0.1:'+server.address().port+'/'+folder+'/index.html',{
   waitUntil:'domcontentloaded'
  });
  await page.waitForFunction(()=>window.__vithuV7?.inspect()?.stageMoved,{timeout:20000});
  await page.waitForFunction(()=>document.getElementById('v7-wardrobe-screen')&&!document.getElementById('v7-wardrobe-screen').hidden);
  const initial=await page.evaluate(()=>{
   const data=window.__vithuV7.inspect();
   return {...data,multi:document.getElementById('upload').multiple,
    oldHidden:getComputedStyle(document.querySelector('body > .layout')).display,
    bottom:getComputedStyle(document.querySelector('.v7-bottom-nav')).display,
    overflow:document.documentElement.scrollWidth-window.innerWidth
   };
  });
  assert.equal(initial.sharedDB,'vithu_wardrobe_avatar_v5_joints_20261105');
  assert.equal(initial.multi,true,'legacy batch importer reused');
  assert.equal(initial.oldHidden,'none','old layout is not displayed as another dashboard');
  assert.equal(initial.screen,'wardrobe');
  assert.ok(initial.overflow<=3,'no horizontal overflow');
  assert.equal(initial.bottom,kind==='iphone'?'grid':'none','mobile-only bottom navigation');

  // Synthetic test fixtures never enter the user's browser or account.
  await page.evaluate(()=>{
   function garment(color){
    const canvas=document.createElement('canvas');canvas.width=150;canvas.height=180;
    const g=canvas.getContext('2d');g.fillStyle=color;g.beginPath();
    g.moveTo(55,16);g.lineTo(96,16);g.lineTo(125,32);g.lineTo(145,67);
    g.lineTo(121,85);g.lineTo(112,75);g.lineTo(112,165);g.lineTo(38,165);
    g.lineTo(38,75);g.lineTo(29,85);g.lineTo(7,67);g.lineTo(25,32);g.closePath();g.fill();
    return canvas.toDataURL('image/png');
   }
   items=[
    {id:'v7-slim',name:'Synthetic Slim Shirt',category:'top',image:garment('#20242a')},
    {id:'v7-loose',name:'Synthetic Loose Shirt',category:'top',image:garment('#44454a')},
    {id:'v7-jeans',name:'Synthetic Jeans',category:'bottom',image:garment('#8ca5b9')},
    {id:'v7-shoes',name:'Synthetic Sneakers',category:'shoes',image:garment('#f0efed')}
   ];
   chosen={};looks=[];avatarRenderMode='silhouette';view='styled';render();
  });
  await page.waitForFunction(()=>document.querySelectorAll('#v7-wardrobe-grid .v7-item-card').length===4);
  await page.screenshot({path:await (async()=>{await mkdir(artifacts,{recursive:true});return join(artifacts,kind+'-wardrobe.png')})(),
   animations:'disabled',fullPage:true});
  screenshots.push(kind+'-wardrobe.png');
  await page.locator('#v7-wardrobe-grid .v7-additem').first().click();
  await page.waitForFunction(()=>window.__vithuV7.inspect().selected===1);
  await page.evaluate(()=>window.__vithuV7.go('create'));
  assert.equal(await page.evaluate(()=>document.querySelectorAll('#v7-board-slots .has-item').length),1,
   'selected original shirt is present in Create board');
  await page.locator('#v7-create-picker .v7-additem').nth(2).click();
  await page.waitForFunction(()=>window.__vithuV7.inspect().selected>=2);
  await page.screenshot({path:join(artifacts,kind+'-create.png'),animations:'disabled',fullPage:true});
  screenshots.push(kind+'-create.png');
  await page.evaluate(()=>window.__vithuV7.go('avatar'));
  assert.equal(await page.evaluate(()=>document.getElementById('v7-stage-host').contains(document.getElementById('stage'))),true);
  assert.equal(await page.evaluate(()=>document.getElementById('v7-modes-host').contains(document.querySelector('.fashion25d-picker'))),true);
  await page.waitForFunction(()=>document.querySelector('#avatarV2Garments [data-avatar-slot="top"]'),{timeout:12000});
  await page.screenshot({path:join(artifacts,kind+'-avatar.png'),animations:'disabled',fullPage:true});
  screenshots.push(kind+'-avatar.png');
  await page.click('#fashionStudioChoice');
  assert.equal(await page.evaluate(()=>window.__vithuFashion25dTest?.getMode()),'studio','studio fallback works');
  await page.click('#fashionV5Choice');
  assert.equal(await page.evaluate(()=>window.__vithuFashion25dTest?.getMode()),'v5','V5 rollback works');
  await page.click('#fashion25dChoice');
  await page.evaluate(()=>window.__vithuV7.go('import'));
  assert.equal(await page.evaluate(()=>!document.getElementById('importPanel').hidden),true,
   'full original import in V7 screen');
  assert.equal(await page.evaluate(()=>document.getElementById('v7-import-host').contains(document.getElementById('importPanel'))),true);
  await page.evaluate(()=>window.__vithuV7.go('avatar'));
  await page.evaluate(()=>document.querySelector('.v7-head-cta')?.click());
  // Save uses the native new V7 dialog, not a browser prompt.
  await page.evaluate(()=>window.__vithuV7.go('avatar'));
  await page.getByRole('button',{name:'Look speichern',exact:true}).first().click();
  await page.locator('#v7-save-name').fill('V7 Synthetic Test');
  await page.locator('#v7-save-dialog .v7-primary').click();
  await page.waitForFunction(()=>window.__vithuV7.inspect().looks===1&&window.__vithuV7.inspect().screen==='looks');
  assert.equal(await page.locator('.v7-saved-look').count(),1,'new Look stored in existing data structure');
  await page.screenshot({path:join(artifacts,kind+'-looks.png'),animations:'disabled',fullPage:true});
  screenshots.push(kind+'-looks.png');
  await page.getByRole('button',{name:'Anziehen',exact:true}).first().click();
  await page.waitForFunction(()=>window.__vithuV7.inspect().screen==='avatar');
  assert.deepEqual(errors,[],'no uncaught browser errors on new screens');
  await context.close();
 }
 await writeFile(join(artifacts,'manifest.json'),JSON.stringify({
  screens:['wardrobe','create','avatar','looks'],
  viewports:['390x844@3x','1440x900@1x'],screenshots,
  fixtures:'Synthetic in-memory clothing only',dataSafety:'Same existing preview IndexedDB schema'
 },null,2));
 console.log('PASS: V7 real screens, create, avatar original cutouts, import, saved looks, mobile+desktop');
}finally{
 await browser.close();await new Promise(ok=>server.close(ok));
}
