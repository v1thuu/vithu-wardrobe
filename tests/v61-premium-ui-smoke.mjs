#!/usr/bin/env node
/* VITHU WARDROBE V6 – interactive dashboard regressions.
 * Runs entirely in CI with synthetic garments and isolated browser storage.
 * No real wardrobe photos, tokens or private files.
 * Requires: npm install --no-save playwright && npx playwright install chromium
 */
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {readFileSync} from 'node:fs';
import {resolve,dirname,extname,join,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const path='preview/v6-premium-ui-20261106';
const html=readFileSync(join(root,path,'index.html'),'utf8');
const ui=readFileSync(join(root,path,'v6-ui.js'),'utf8');
const css=readFileSync(join(root,path,'v6-ui.css'),'utf8');
const premiumCss=readFileSync(join(root,path,'v61-premium.css'),'utf8');
const premiumJs=readFileSync(join(root,path,'v61-premium.js'),'utf8');
assert.doesNotThrow(()=>new vm.Script(premiumJs),'premium UI shell parses');
assert.match(premiumCss,/v61-masthead/,'premium visual shell has new masthead styles');
assert.doesNotThrow(()=>new vm.Script(ui),'new V6 shell parses');
assert.match(html,/DBNAME='vithu_wardrobe_avatar_v5_joints_20261105'/,
 'V6 uses the existing GitHub Pages V5 preview database (not a new migration)');
assert.match(html,/id="batchReviewDialog"/,'existing batch importer is retained');
assert.match(html,/id="upload" type="file" accept="image\/\*" multiple/,'multi-photo upload remains');
assert.match(html,/src="\.\/avatar-natural-v4\.js/,'old cutout renderer retained');
assert.match(html,/src="\.\/avatar-fashion25d\.js/,'existing fashion body retained');
assert.match(html,/src="\.\/v6-ui\.js/,'V6 layout uses progressive enhancement');
assert.match(html,/src="\.\/v61-premium\.js/,'premium JS loads after stable V6 UI');
assert.match(html,/href="\.\/v61-premium\.css/,'premium CSS is additive');
assert.match(css,/max-width:790px/,'mobile layout responsive');
assert.doesNotMatch(premiumJs,/indexedDB\.open|localStorage|\.put\(|\.delete\(|\bfetch\(/,'premium shell has no storage or network calls');
assert.doesNotMatch(ui,/indexedDB\.open|localStorage|\.put\(|\.delete\(|\bfetch\(/,
 'V6 shell contains no storage or external model writes');
let chromium;
try{({chromium}=await import('playwright'))}
catch{throw Error('Install Playwright + chromium via npm install --no-save playwright && npx playwright install chromium')}
const server=createServer(async(req,res)=>{
 try{
  const route=decodeURIComponent(new URL(req.url||'/', 'http://localhost').pathname);
  const target=resolve(root,'.'+(route==='/'?'/'+path+'/index.html':route));
  if(!target.startsWith(root+sep))throw Error('Invalid requested path');
  const buf=await readFile(target);
  const mime={'.js':'text/javascript','.html':'text/html','.css':'text/css','.svg':'image/svg+xml','.wasm':'application/wasm'};
  res.writeHead(200,{'Content-Type':mime[extname(target)]||'application/octet-stream',
   'Cache-Control':'no-store'});
  res.end(buf);
 }catch{res.writeHead(404);res.end('Not Found')}
});
await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
const browser=await chromium.launch({headless:true});
const resultDir=resolve(root,'artifacts/v61-premium-ui');
const captures=[];
try{
 for(const [label,width,height,dpr] of [['iphone',390,844,3],['desktop',1440,900,1]]){
  const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:dpr,
   isMobile:label==='iphone',hasTouch:label==='iphone',reducedMotion:'reduce'});
  const page=await context.newPage();
  const pageErrors=[];
  page.on('pageerror',err=>pageErrors.push(String(err)));
  await page.goto('http://127.0.0.1:'+server.address().port+'/'+path+'/index.html',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.__vithuV6?.inspect()?.layout&&window.__vithuV61?.inspect()?.active&&
    window.__vithuFashion25dTest?.getMode&&!!document.getElementById('tab-avatar'),
    {timeout:15000});
  const doc=await page.evaluate(()=>({
   version:document.documentElement.dataset.wardrobeVersion,
   multi:document.querySelector('#upload')?.multiple,
   batch:!!document.querySelector('#batchReviewDialog'),
   db:document.documentElement.outerHTML.includes("vithu_wardrobe_avatar_v5_joints_20261105"),
   activeTab:document.querySelector('#tab-wardrobe')?.getAttribute('aria-selected')
  }));
  assert.equal(doc.version,'v6-preview','new V6 UI loaded');
  assert.equal(doc.multi,true,'multi-file upload preserved');
  assert.equal(doc.batch,true,'batch review preserved');
  assert.equal(doc.db,true,'same local database name');
  assert.equal(doc.activeTab,'true','wardrobe is initial tab');
  await page.click('#tab-avatar');
  await page.waitForFunction(()=>!document.getElementById('avatarPanel').hidden);
  let layout=await page.evaluate(()=>{
    const space=document.querySelector('.studio.v6-workspace');
    const style=getComputedStyle(space);
    return{
     display:style.display,
     direction:style.flexDirection,
     columns:style.gridTemplateColumns,
     stageParent:document.getElementById('stage')?.closest('#v6-center')?.id,
     pickerParent:document.getElementById('v2OutfitPicker')?.closest('#v6-right')?.id,
     ctrlParent:document.querySelector('.fashion25d-picker')?.closest('#v6-left')?.id,
     original:!!document.getElementById('avatarV2Garments'),
     firstTitle:document.querySelector('#v6-topbar h2')?.textContent
    };
  });
  assert.equal(layout.stageParent,'v6-center','stage moved to center column');
  assert.equal(layout.pickerParent,'v6-right','real outfit picker moved to right');
  if(label==='desktop')assert.equal(layout.ctrlParent,'v6-left','desktop controls live in sidebar');
  else assert.equal(layout.ctrlParent,undefined,'mobile controls moved above stage, not sidebar');
  assert.equal(layout.original,true,'unchanged original-cutout SVG present');
  const premium=await page.evaluate(()=>{
   const mast=document.getElementById('v61-masthead');
   const quick=document.getElementById('v61-quickbar');
   const body=document.body;
   const info=window.__vithuV61.inspect();
   return {
    masthead:mast?.contains(document.querySelector('.wardrobe-header'))&&
      mast?.contains(document.querySelector('.wardrobe-tabs')),
    backup:mast?.querySelector('.app-settings button[onclick*="exportBackup"]')!==null,
    sticky:getComputedStyle(mast).position,
    navCount:mast?.querySelectorAll('button[role="tab"]').length,
    quickParent:document.querySelector('.fashion25d-picker')?.parentElement?.id,
    horizontalOverflow:document.documentElement.scrollWidth-window.innerWidth,
    originalModeButtons:info.originalTabs,
    jumper:!!document.querySelector('.v61-outfit-jump'),
    ui:document.documentElement.dataset.wardrobeUi,
    bodyClass:body.classList.contains('v61-ready')
   };
  });
  assert.equal(premium.masthead,true,'brand and existing navigation live in one premium masthead');
  assert.equal(premium.backup,true,'original backup actions moved without cloning');
  assert.equal(premium.sticky,'sticky','premium navigation stays visible on scroll');
  assert.equal(premium.navCount,3,'all original navigation tabs retained');
  assert.equal(premium.originalModeButtons,3,'V6 mode selection intact');
  assert.equal(premium.jumper,true,'functional link to outfit picker available');
  assert.equal(premium.ui,'premium-v6-1','premium build identified');
  assert.equal(premium.bodyClass,true,'scoped UI styles activated');
  assert.ok(premium.horizontalOverflow<=2,'no mobile/desktop horizontal overflow');
  if(label==='iphone')assert.equal(premium.quickParent,'v61-quickbar','all modes above avatar on iPhone');
  if(label==='iphone'){
   const modeRows=await page.locator('.v61-quickbar .fashion25d-picker button')
    .evaluateAll(nodes=>nodes.map(n=>Math.round(n.getBoundingClientRect().top)));
   assert.equal(modeRows.length,3,'three genuine style buttons');
   assert.equal(new Set(modeRows).size,1,'all iPhone avatar choices align on one compact row');
  }
  else assert.notEqual(premium.quickParent,'v61-quickbar','desktop controls stay in sidebar');
  await page.evaluate(()=>{
   window.__v61Jumped=false;
   const target=document.getElementById('v6-right');
   target.scrollIntoView=()=>{window.__v61Jumped=true;};
  });
  await page.click('.v61-outfit-jump');
  assert.equal(await page.evaluate(()=>window.__v61Jumped),true,
   'Outfit wählen button opens real garment selection');
  if(label==='iphone'){
   await page.click('#view-photo');
   await page.waitForTimeout(20);
   assert.equal(await page.evaluate(()=>document.getElementById('v61-quickbar').hidden),true,
    'fashion modes hide when photo view is selected');
   await page.click('#view-styled');
   await page.waitForTimeout(20);
   assert.equal(await page.evaluate(()=>document.getElementById('v61-quickbar').hidden),false,
    'fashion modes return for avatar view');
  }

  if(label==='desktop')assert.equal(layout.display,'grid','three-column desktop dashboard');
  else{
   assert.equal(layout.display,'flex','compact mobile view');
   assert.equal(layout.direction,'column','mobile stacks stage first');
  }

  // Real app functions render entirely with synthetic memory-only clothing.
  await page.evaluate(()=>{
   const make=(color,category)=>{
    const c=document.createElement('canvas');c.width=160;c.height=180;
    const x=c.getContext('2d');x.fillStyle=color;
    if(category==='top'){
     x.beginPath();x.moveTo(55,19);x.lineTo(105,19);x.lineTo(135,33);
     x.lineTo(157,65);x.lineTo(132,88);x.lineTo(121,74);
     x.lineTo(122,167);x.lineTo(38,167);x.lineTo(39,74);
     x.lineTo(28,88);x.lineTo(3,65);x.lineTo(26,33);x.closePath();x.fill();
     x.globalCompositeOperation='destination-out';x.beginPath();
     x.ellipse(80,18,17,9,0,0,Math.PI*2);x.fill();
    }else{x.fillRect(26,16,109,148)}
    return c.toDataURL('image/png');
   };
   items=[
    {id:'v6-shirt-fitted',name:'Synthetic Slim Shirt',category:'top',image:make('#1a2028','top')},
    {id:'v6-shirt-loose',name:'Synthetic Loose Shirt',category:'top',image:make('#2b3439','top')},
    {id:'v6-jeans',name:'Synthetic Denim',category:'bottom',image:make('#7b95af','bottom')}
   ];
   chosen={top:'v6-shirt-fitted',bottom:'v6-jeans'};
   avatarRenderMode='silhouette';
   avatarBodyRigMode='joint';
   window.render?.();
   window.renderAvatarV2?.();
  });
  await page.waitForFunction(()=>!!document.querySelector(
   '#avatarV2Garments [data-avatar-slot="top"][data-renderer="original-silhouette-v4"]'),
   {timeout:15000});
  await page.waitForFunction(()=>document.querySelectorAll('.v3-garment-card').length>=2,
   {timeout:15000});
  await mkdir(resultDir,{recursive:true});
  // A sticky header captured at a scrolled position can appear halfway
  // down a full-page PNG even when the real UI is correct.
  await page.evaluate(()=>window.scrollTo({top:0,left:0,behavior:'instant'}));
  await page.waitForTimeout(120);
  const filename=join(resultDir,label+'-premium-dashboard.png');
  await page.screenshot({path:filename,fullPage:true,animations:'disabled'});
  captures.push({label,filename,viewport:{width,height,dpr}});

  await page.click('#fashionStudioChoice');
  assert.equal(await page.evaluate(()=>window.__vithuFashion25dTest.getMode()),'studio',
   'neutral fashion body still selectable through V6');
  await page.click('#fashion25dChoice');
  assert.equal(await page.evaluate(()=>window.__vithuFashion25dTest.getMode()),'fashion',
   'personalized fashion body remains available');
  await page.click('#fashionV5Choice');
  assert.equal(await page.evaluate(()=>window.__vithuFashion25dTest.getMode()),'v5',
   'V5 fallback remains available');
  await page.click('#fashion25dChoice');
  await page.click('#tab-add');
  assert.equal(await page.evaluate(()=>!document.getElementById('importPanel').hidden),true,
   'unmodified importer reachable from redesigned navigation');
  await page.click('#tab-wardrobe');
  assert.equal(await page.evaluate(()=>!document.getElementById('closetShelf').hidden),true,
   'unmodified wardrobe remains reachable');
  assert.deepEqual(pageErrors,[],'no browser exceptions');
  await context.close();
 }
 await writeFile(join(resultDir,'manifest.json'),JSON.stringify({captures,
  fixtures:'Synthetic memory-only garments; no user images and no published photos',
  originalImport:'byte-identical',data:'shared preview IndexedDB name, no schema changes'
 },null,2));
 console.log('PASS: V6.1 premium responsive UI, working navigation/outfit jump, preserved core and V5 rollback.');
}finally{
 await browser.close();
 await new Promise(ok=>server.close(ok));
}