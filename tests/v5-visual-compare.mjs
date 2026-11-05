#!/usr/bin/env node
/**
 * Local visual regression snapshots for the real VITHU WARDROBE HTML app.
 * Three synthetic, non-private alpha cutouts. iPhone viewport at DPR 3.
 *
 * Prerequisites: npm install --no-save playwright && npx playwright install chromium
 * Run: node tests/v5-visual-compare.mjs
 * Set V5_BASE_REF=origin/feat/v5-cutout-fit-measurements-20261105 for A/B.
 * Set V5_SCREENSHOT_DIR=artifacts/v5-visual to change the output folder.
 */
import {createServer} from 'node:http';
import {readFile, mkdir, writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {resolve, dirname, extname, join, sep} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const out=resolve(root,process.env.V5_SCREENSHOT_DIR||'artifacts/v5-visual');
const baselineRef=process.env.V5_BASE_REF||'origin/feat/v5-cutout-fit-measurements-20261105';
let chromium;
try {({chromium}=await import('playwright'))}
catch {throw Error('Install Playwright: npm install --no-save playwright && npx playwright install chromium')}
let before;
for(const ref of [baselineRef,baselineRef.replace(/^origin\//,'')]){
 try {before=execFileSync('git',['show',ref+':avatar-body-rig-v5.js'],{cwd:root,encoding:'utf8'});break}
 catch {}
}
if(!before)throw Error('Missing baseline ref '+baselineRef+'. Fetch the base branch (git fetch --all).');
const types={'.js':'text/javascript','.html':'text/html','.css':'text/css','.png':'image/png',
 '.jpg':'image/jpeg','.webp':'image/webp','.svg':'image/svg+xml'};
const http=createServer(async (req,res)=>{
 try{
  const raw=decodeURIComponent(new URL(req.url||'/', 'http://localhost').pathname);
  const file=resolve(root,'.'+(raw==='/'?'/index.html':raw));
  if(file!==root&&!file.startsWith(root+sep))throw Error('Invalid path');
  const bytes=await readFile(file);
  res.writeHead(200,{'Content-Type':types[extname(file)]||'application/octet-stream','Cache-Control':'no-store'});
  res.end(bytes);
 }catch{res.writeHead(404);res.end('Not found')}
});
await new Promise(resolve=>http.listen(0,'127.0.0.1',resolve));
const port=http.address().port;
let browser;
const snapshots=[];
try{
 browser=await chromium.launch({
  headless:true,
  ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE
    ?{executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE}:{})
 });
 for(const mode of ['before','after']){
  const context=await browser.newContext({
   viewport:{width:390,height:844},deviceScaleFactor:3,
   isMobile:true,hasTouch:true,reducedMotion:'reduce'
  });
  const page=await context.newPage();
  if(mode==='before')await page.route('**/avatar-body-rig-v5.js*',route=>
   route.fulfill({status:200,contentType:'text/javascript',body:before}));
  const pageErrors=[];
  page.on('pageerror',err=>pageErrors.push(String(err)));
  await page.goto('http://127.0.0.1:'+port+'/index.html',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>typeof window.renderAvatarV2==='function'&&
   typeof window.__vithuBodyV5Test?.calculateRig==='function');
  for(const state of ['empty','fitted','loose']){
   const fixture=await page.evaluate(async state=>{
    function makeShirt(kind){
     const c=document.createElement('canvas');c.width=220;c.height=250;
     const ctx=c.getContext('2d');ctx.fillStyle=kind==='fitted'?'#1a2331':'#25282c';
     const end=kind==='fitted'?64:45;
     ctx.beginPath();
     ctx.moveTo(80,20);ctx.lineTo(140,20);
     ctx.lineTo(159,33);ctx.lineTo(200,58);ctx.lineTo(180,101);
     ctx.lineTo(156,87);ctx.lineTo(220-end,233);
     ctx.quadraticCurveTo(110,238,end,233);
     ctx.lineTo(64,87);ctx.lineTo(40,101);ctx.lineTo(20,58);
     ctx.lineTo(61,33);ctx.closePath();ctx.fill();
     ctx.globalCompositeOperation='destination-out';
     ctx.beginPath();ctx.ellipse(110,19,22,13,0,0,Math.PI*2);ctx.fill();
     return c.toDataURL('image/png');
    }
    const item=state==='empty'?null:{
     id:'fixture-'+state,category:'top',
     name:state==='fitted'?'Synthetic fitted shirt':'Synthetic loose shirt',
     image:makeShirt(state),source:'visual-fixture'
    };
    items=item?[item]:[];
    chosen=item?{top:item.id}:{};
    avatarRenderMode='silhouette';
    avatarBodyRigMode='joint';
    view='styled';
    document.getElementById('tab-avatar')?.click();
    window.renderCustomAvatar?.();
    window.renderAvatarV2();
    return item?.id||null;
   },state);
   if(fixture)await page.waitForFunction(id=>{
    const entry=window.__vithuNaturalV4Test?.cache?.get('top:'+id);
    return entry?.status==='ready'||entry?.status==='unusable';
   },fixture,{timeout:10000});
   await page.evaluate(()=>{
    window.renderCustomAvatar?.();
    window.renderAvatarV2();
    document.getElementById('stage')?.scrollIntoView({block:'start'});
   });
   await page.waitForTimeout(150);
   const file=join(out,mode,state+'.png');await mkdir(dirname(file),{recursive:true});
   await page.screenshot({path:file,fullPage:false,animations:'disabled'});
   const geometry=await page.evaluate(()=>window.__vithuBodyV5Test.calculateRig(null,'athletic'));
   snapshots.push({mode,state,file,geometry:{elbowX:geometry.elbowX,
    wristX:geometry.wristX,radii:geometry.radii||null}});
  }
  if(pageErrors.length)throw Error(mode+' page errors: '+pageErrors.join(' | '));
  await context.close();
 }
 await mkdir(out,{recursive:true});
 await writeFile(join(out,'manifest.json'),JSON.stringify({
  viewport:{width:390,height:844,devicePixelRatio:3},
  fixture:'synthetic garments only – not real user clothing',
  baselineRef,snapshots
 },null,2));
 console.log('PASS: 6 iPhone-size PNG snapshots and manifest at '+out);
}finally{
 if(browser)await browser.close();
 await new Promise(resolve=>http.close(resolve));
}
