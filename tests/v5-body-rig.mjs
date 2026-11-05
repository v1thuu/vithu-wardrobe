#!/usr/bin/env node
// Non-network regression gate for the optional V5 body joints.
// Run from repo root: node tests/v5-body-rig.mjs
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const read=name=>fs.readFileSync(new URL('../'+name,import.meta.url),'utf8');
const app=read('index.html');
const rig=read('avatar-body-rig-v5.js');
const silhouette=read('avatar-natural-v4.js');
const renderer=read('avatar-v2.js');
for(const [name,code] of [['index.html',app.match(/<script>([\s\S]*?)<\/script>/)?.[1]],['v5',rig],['v4',silhouette],['avatar-v2',renderer]]){
 assert.ok(code,name+' exists');
 assert.doesNotThrow(()=>new vm.Script(code),name+' parses');
}
assert.match(renderer,/window\.updateWardrobeBodyRigV5\?\.\(\{top,outerwear:coat\}\)/,'V5 applied after garments');
assert.match(silhouette,/function getNaturalCutoutPlacementV4\(item,category\)/,'V4 shares real placement with rig');
assert.match(app,/id="avatarBodyRigMode"/,'control is inside existing avatar editor');
assert.match(app,/avatarBodyRigMode:legacy\.avatarBodyRigMode/,'legacy storage migration');
assert.match(app,/avatarMorphMode,avatarBodyRigMode\}\)/,'metadata stored');
assert.match(app,/avatarMorphMode,avatarBodyRigMode\}/,'backup exports preference');
assert.match(app,/avatarBodyRigMode=d\.avatarBodyRigMode/,'backup imports preference');
assert.match(app,/src="\.\/avatar-body-rig-v5\.js"/,'joint module loaded');
assert.match(app,/id="batchReviewDialog"/,'multi-photo approval remains');
assert.match(app,/window\.vithuWorkerAI\.analyze\(engine,jpeg/,'existing B2/B4 worker remains');
class FakeElement {
 constructor(tag,id=null){this.tag=tag;this.id=id;this.attrs={};this.children=[];this.style={};}
 setAttribute(k,v){this.attrs[k]=String(v);if(k==='id')this.id=String(v)}
 getAttribute(k){return this.attrs[k]??null}
 removeAttribute(k){delete this.attrs[k]}
 appendChild(n){this.children.push(n);return n}
 insertBefore(n,before){const i=before?this.children.indexOf(before):-1;this.children.splice(i<0?this.children.length:i,0,n);return n}
 replaceChildren(...n){this.children=n}
 querySelector(sel){
  const id=sel.startsWith('#')?sel.slice(1):null;
  if(this.id===id)return this;
  for(const child of this.children){const match=child.querySelector(sel);if(match)return match;}
  return null;
 }
}
const base=new FakeElement('g','personaBaseTop');
const oldArms=new FakeElement('g','personaArms');
const upper=new FakeElement('g','personaUpperBody');
upper.appendChild(oldArms);upper.appendChild(base);
const person=new FakeElement('svg','personaDrawing');
person.appendChild(upper);
const figure=new FakeElement('div','figure');
figure.appendChild(person);
const document={
 getElementById:id=>id==='figure'?figure:null,
 createElementNS:(_ns,type)=>new FakeElement(type)
};
let draws=0,saves=0,width=126;
const sandbox={
 document,
 window:{
  renderAvatarV2(){draws++;this.updateWardrobeBodyRigV5?.({top:{id:'shirt'}})},
  getNaturalCutoutPlacementV4(){return {x:90-width/2,y:80,width,height:138}}
 },
 avatarRenderMode:'silhouette',avatarBodyRigMode:'joint',
 avatarProfile:{build:'athletic'},
 storageReady:true,persist:async()=>{saves++},
 console:{error(){}}
};
vm.runInNewContext(rig,sandbox,{filename:'avatar-body-rig-v5.js'});
const group=upper.querySelector('#personaJointRigV5');
assert.ok(group,'dedicated body rig group exists');
assert.equal(oldArms.style.display,'none','old arms hidden in V5');
assert.equal(group.children.length,2,'left and right arms attached once');
assert.equal(group.children[0].children.length,4,'arm, palm, and two understated marks');
assert.equal(group.children[1].attrs.transform,'translate(180 0) scale(-1 1)','mirror arms symmetrically');
const compute=sandbox.window.__vithuBodyV5Test.calculateRig;
const narrow=compute({width:100,y:80,height:132},'athletic');
const loose=compute({width:148,y:80,height:132},'athletic');
assert.ok(narrow.sleeveX>loose.sleeveX+10,'sleeve-dependent shoulder width');
assert.ok(loose.wristY>loose.elbowY&&loose.handY>loose.wristY,'anatomical landmark ordering');
const extreme=compute({width:10000,y:-10000,height:1},'broad');
assert.ok(extreme.sleeveX>=24&&extreme.sleeveY>=114&&extreme.handY<=238,'large garment values clamped');
const count=upper.children.length;
sandbox.window.setAvatarBodyRigMode('classic');
assert.equal(sandbox.avatarBodyRigMode,'classic');
assert.equal(oldArms.style.display,'','V4 arms returned');
assert.equal(group.style.display,'none','test rig hidden');
sandbox.window.setAvatarBodyRigMode('joint');
assert.equal(oldArms.style.display,'none');
assert.equal(upper.children.length,count,'no extra groups on rerender');
sandbox.avatarRenderMode='stylized';sandbox.window.renderAvatarV2();
assert.equal(oldArms.style.display,'','V3 illustration untouched');
sandbox.avatarRenderMode='original';sandbox.window.renderAvatarV2();
assert.equal(oldArms.style.display,'','photo mode untouched');
sandbox.avatarRenderMode='silhouette';width=148;sandbox.window.renderAvatarV2();
assert.equal(oldArms.style.display,'none','V5 resumes');
assert.equal(saves,2,'only explicit mode selection saves');
assert.ok(draws>=5,'mode changes and initial mount redraw');
console.log('PASS: V5 2D body joints, shirt fit, rollback, persistence hooks, unchanged batch path');
