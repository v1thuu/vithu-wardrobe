/* VITHU WARDROBE: opt-in joint-driven arm rig (V5 prototype).
   Keeps original V4 alpha cutouts and all V3 geometry untouched.
   All SVG paths are local and generated from the garment's measured placement.
   No remote services or photo uploads. */
(function(){
'use strict';
const NS='http://www.w3.org/2000/svg';
const clamp=(n,lo,hi)=>Math.max(lo,Math.min(hi,n));
const round=n=>Number(n.toFixed(2));
const getFigure=()=>document.getElementById('figure');

function calculateRig(topPlacement,build){
 const width=Number.isFinite(topPlacement?.width)?topPlacement.width:126;
 const y=Number.isFinite(topPlacement?.y)?topPlacement.y:81;
 const height=Number.isFinite(topPlacement?.height)?topPlacement.height:135;
 const shape={lean:.96,athletic:1,broad:1.055}[build]||1;
 // The sleeve opening, rather than a button-controlled sprite size, determines
 // where the visible forearm begins. These are conservative bounds for T-shirts.
 const sleeveX=clamp((90-width*.445)*shape,24,46);
 const sleeveY=clamp(y+height*.355,114,143);
 const elbowX=clamp(sleeveX-3.4,20,43);
 const elbowY=clamp(sleeveY+42,156,182);
 const wristX=clamp(elbowX-1.7,19,41);
 const wristY=clamp(elbowY+38,196,216);
 const handY=clamp(wristY+19,217,238);
 return {sleeveX:round(sleeveX),sleeveY:round(sleeveY),
  elbowX:round(elbowX),elbowY:round(elbowY),
  wristX:round(wristX),wristY:round(wristY),handY:round(handY),
  garmentWidth:round(width)};
}

function svgEl(type,attrs,parent){
 const node=document.createElementNS(NS,type);
 for(const [k,v] of Object.entries(attrs))node.setAttribute(k,String(v));
 parent.appendChild(node);
 return node;
}
function ensureRig(person){
 const upper=person.querySelector('#personaUpperBody');
 if(!upper)return null;
 let group=upper.querySelector('#personaJointRigV5');
 if(group)return group;
 group=document.createElementNS(NS,'g');
 group.setAttribute('id','personaJointRigV5');
 group.setAttribute('aria-hidden','true');
 const base=upper.querySelector('#personaBaseTop');
 upper.insertBefore(group,base||null);
 return group;
}
function buildSide(parent,side,g){
 const sub=svgEl('g',{'data-arm-side':side},parent);
 if(side==='right')sub.setAttribute('transform','translate(180 0) scale(-1 1)');
 const {sleeveX:sx,sleeveY:sy,elbowX:ex,elbowY:ey,wristX:wx,wristY:wy,handY:hy}=g;

 // Upper arm and forearm share a continuous outline at the elbow.
 // The taper and slight elbow bend avoid the previous sausage-shaped limbs.
 const arm=[
  'M',round(sx-5),sy,
  'C',round(sx-10),round(sy+14),round(ex-7),round(ey-14),round(ex-8),ey,
  'C',round(ex-9),round(ey+12),round(wx-8),round(wy-12),round(wx-7),wy,
  'Q',round(wx),round(wy+3),round(wx+7),round(wy-1),
  'C',round(wx+7),round(wy-15),round(ex+8),round(ey+12),round(ex+7),ey,
  'Q',round(ex+10),round(ey-17),round(sx+8),round(sy+8),
  'L',round(sx+6),sy,'Z'
 ].join(' ');
 svgEl('path',{d:arm,fill:'url(#personaSkin)',
  stroke:'var(--persona-shade)','stroke-opacity':'.33','stroke-width':'.8',
  'stroke-linejoin':'round'},sub);

 // Palm: three shallow fingertip separations, and a short inward thumb.
 // Unlike the discarded prototype, no deep finger branches or open claw gap.
 const h=hy-wy;
 const hand=[
  'M',round(wx-7),round(wy-2),
  'Q',round(wx),round(wy-4),round(wx+7),round(wy-2),
  'L',round(wx+8),round(wy+7),
  'Q',round(wx+11),round(wy+10),round(wx+11),round(wy+13),
  'Q',round(wx+11),round(wy+16),round(wx+8.5),round(wy+16),
  'Q',round(wx+6),round(wy+14),round(wx+5),round(wy+11),
  'L',round(wx+5),round(hy-3),
  'Q',round(wx+5),round(hy+1),round(wx+2),hy,
  'Q',round(wx),round(hy+1),round(wx-1),round(hy-2),
  'Q',round(wx-3),round(hy+2),round(wx-5),round(hy-1),
  'Q',round(wx-7),round(hy+1),round(wx-9),round(hy-3),
  'Q',round(wx-11),round(wy+12),round(wx-10),round(wy+7),
  'Z'
 ].join(' ');
 svgEl('path',{d:hand,fill:'url(#personaSkin)',
  stroke:'var(--persona-shade)','stroke-opacity':'.36','stroke-width':'.8',
  'stroke-linejoin':'round'},sub);
 // Small palm crease, not dark drawn-on fingers.
 svgEl('path',{d:'M '+round(wx-6)+' '+round(wy+5)+' Q '+round(wx)+' '+round(wy+3)+
   ' '+round(wx+4)+' '+round(wy+6),
  fill:'none',stroke:'var(--persona-shade)','stroke-opacity':'.18',
  'stroke-width':'.8','stroke-linecap':'round'},sub);
 svgEl('path',{d:'M '+round(ex-7)+' '+round(ey-1)+' Q '+round(ex)+
  ' '+round(ey+3)+' '+round(ex+5)+' '+round(ey-1),
  fill:'none',stroke:'var(--persona-shade)','stroke-opacity':'.14',
  'stroke-width':'.75'},sub);
 return sub;
}
function drawRig(person,geometry){
 const group=ensureRig(person);
 if(!group)return null;
 group.replaceChildren();
 buildSide(group,'left',geometry);
 buildSide(group,'right',geometry);
 return group;
}
function update(garments={}){
 const figure=getFigure();
 const person=figure?.querySelector('#personaDrawing');
 const oldArms=person?.querySelector('#personaArms');
 if(!person||!oldArms)return false;
 const group=ensureRig(person);
 const active=avatarRenderMode==='silhouette'&&avatarBodyRigMode==='joint';
 oldArms.style.display=active?'none':'';
 if(group)group.style.display=active?'':'none';
 if(!active)return false;
 const outer=garments.outerwear||garments.top;
 const category=garments.outerwear?'outerwear':'top';
 const placement=outer?window.getNaturalCutoutPlacementV4?.(outer,category):null;
 const geometry=calculateRig(placement,avatarProfile?.build);
 drawRig(person,geometry);
 return true;
}
function setMode(value){
 if(value!=='joint'&&value!=='classic')return;
 avatarBodyRigMode=value;
 window.renderAvatarV2?.();
 if(typeof storageReady!=='undefined'&&storageReady){
  persist().catch(e=>console.error('Körper-Rig konnte nicht gespeichert werden',e));
 }
}
window.updateWardrobeBodyRigV5=update;
window.setAvatarBodyRigMode=setMode;
window.__vithuBodyV5Test={calculateRig,drawRig};
})();