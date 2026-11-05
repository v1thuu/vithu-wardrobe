#!/usr/bin/env node
// Baseline acceptance gates for VITHU WARDROBE V4.
// Run from repository root: node tests/v4-stability.mjs
// Synthetic pixels only — no personal photos or network access required.
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const read = name => fs.readFileSync(new URL('../'+name,import.meta.url),'utf8');
const html=read('index.html');
const inline=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(inline,'main inline script exists');
for(const [name,code] of Object.entries({
  app:inline,
  'photo-tryon.js':read('photo-tryon.js'),
  'avatar-profile.js':read('avatar-profile.js'),
  'avatar-v2.js':read('avatar-v2.js'),
  'avatar-rig-v3.js':read('avatar-rig-v3.js'),
  'avatar-natural-v4.js':read('avatar-natural-v4.js'),
  'garment-ai-worker-client.js':read('garment-ai-worker-client.js'),
  'garment-ai-worker.js':read('garment-ai-worker.js')
}))assert.doesNotThrow(()=>new vm.Script(code,{filename:name}),name+' parses');

const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
const refs=[...inline.matchAll(/\$\('([^']+)'\)/g)].map(m=>m[1]);
assert.equal(new Set(ids).size,ids.length,'all HTML IDs are unique');
assert.deepEqual([...new Set(refs.filter(ref=>!ids.includes(ref)))],[],'all static $() IDs exist');
assert.ok(ids.includes('smartImportStatus'),'batch AI status element exists');
assert.ok(html.includes('multiple onchange="onPhoto(event)"'),'multiple upload remains available');
assert.ok(html.includes('id="batchReviewDialog"'),'end-of-batch review remains available');
assert.ok(html.includes('function batchStartReview()'),'queue review phase remains available');
assert.ok(inline.includes("const second=await smartImportBeta('fashn',{silent:true});"),'B4 remains enabled');
assert.ok(inline.includes('window.vithuWorkerAI.analyze(engine,jpeg'),'batch models use isolated worker');
assert.ok(html.includes('avatarRenderMode'), 'avatar mode is still present');
assert.ok(html.includes('avatarMorphMode'), 'original V3 rig setting preserved');

class Node {
  constructor(tag,id){this.tag=tag;this.id=id;this.attrs={};this.children=[];this.style={};}
  setAttribute(k,v){this.attrs[k]=String(v)}
  removeAttribute(k){delete this.attrs[k]}
  getAttribute(k){return this.attrs[k]??null}
  append(item){this.children.push(item)}
  querySelector(q){
    const id=q.slice(1);
    if(this.id===id)return this;
    for(const child of this.children){const found=child.querySelector(q);if(found)return found;}
    return null;
  }
  getContext(){
    const canvas=this;
    return {
      drawImage(image){canvas.source=image},
      getImageData(){
        const pixels=new Uint8ClampedArray(canvas.width*canvas.height*4);
        for(let y=0;y<canvas.height;y++)for(let x=0;x<canvas.width;x++){
          const within=(x>3&&x<canvas.width-4&&y>3&&y<canvas.height-4);
          pixels[(y*canvas.width+x)*4+3]=(canvas.source?.kind==='opaque'||within)?255:0;
        }
        return {data:pixels};
      }
    };
  }
  toDataURL(){return 'data:image/png;base64,SYNTHETIC'}
}
let redraws=0;
const figure=new Node('div','figure');
const person=new Node('svg','personaDrawing'),lower=new Node('g','personaLowerBody');
const garmentSvg=new Node('svg','avatarV2Garments'),stage=new Node('div','stage');
person.append(lower);figure.append(person);
const classNames=new Set();
figure.classList={toggle(name,yes){if(yes)classNames.add(name);else classNames.delete(name)}};
const document={
  createElement:tag=>new Node(tag),
  createElementNS:(_,tag)=>new Node(tag),
  getElementById:id=>({figure,stage,avatarV2Garments:garmentSvg})[id]||null
};
const dimensions={top:[180,160],bottom:[90,230],shoes:[180,65],opaque:[120,120]};
class Image {
  set src(value){
    this.kind=value.split(',')[1];
    [this.naturalWidth,this.naturalHeight]=dimensions[this.kind];
    Promise.resolve().then(()=>this.onload?.());
  }
}
const sandbox={
  document,Image,Uint8ClampedArray,
  console:{warn(){}},
  window:{renderAvatarV2(){redraws++}},
  chosen:{top:'shirt',bottom:'jeans',shoes:'sneakers'},
  avatarProfile:{build:'athletic'},
  avatarRenderMode:'silhouette',view:'styled'
};
vm.runInNewContext(read('avatar-natural-v4.js'),sandbox,{filename:'avatar-natural-v4.js'});
const item=(id,category,kind)=>({id,category,image:'data:image/png;base64,'+kind});
const clothes=[item('shirt','top','top'),item('jeans','bottom','bottom'),item('sneakers','shoes','shoes')];
const canvas=new Node('svg');
for(const piece of clothes)
 assert.equal(sandbox.window.renderNaturalCutoutV4(piece,piece.category,canvas),false,'async first render');
await Promise.resolve();
await Promise.resolve();
for(const piece of clothes)
 assert.equal(sandbox.window.renderNaturalCutoutV4(piece,piece.category,canvas),true,'real alpha cutout rendered');
assert.equal(canvas.children.length,3,'three real garment layers');
for(const group of canvas.children){
 const image=group.children[0],w=Number(image.attrs.width),h=Number(image.attrs.height);
 assert.ok(w>0&&h>0&&Number.isFinite(w/h),'uniform image geometry valid');
 assert.equal(image.attrs.preserveAspectRatio,'xMidYMid meet','garment dimensions preserved');
 assert.equal(group.attrs['data-renderer'],'original-silhouette-v4','not illustration template');
}
const transparentItem=item('opaque-test','top','opaque');
sandbox.window.renderNaturalCutoutV4(transparentItem,'top',canvas);
await Promise.resolve();await Promise.resolve();
assert.equal(sandbox.window.renderNaturalCutoutV4(transparentItem,'top',canvas),false,'opaque image rejected');
sandbox.window.setNaturalAvatarGeometryV4(true);
assert.equal(person.attrs.viewBox,'0 0 180 450','longer legs only in V4');
assert.equal(garmentSvg.attrs.viewBox,'0 0 180 450','same coordinate space');
assert.ok(classNames.has('avatar-v4-tall'));
sandbox.window.setNaturalAvatarGeometryV4(false);
assert.equal(person.attrs.viewBox,'0 0 180 365','V3 body restored');
assert.ok(!classNames.has('avatar-v4-tall'),'V4 styling fully removed');
sandbox.avatarRenderMode='stylized';
assert.equal(sandbox.window.renderNaturalCutoutV4(clothes[0],'top',canvas),false,'V3 mode remains separate');
assert.ok(redraws>=3,'asynchronous real-cutout load requests redraw');
console.log('PASS: syntax, IDs, batch workflow, original silhouette, fallback, V4/V3 restoration');
