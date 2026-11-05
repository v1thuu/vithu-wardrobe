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

function calculateRig(topPlacement,build,sleeveFit=null){
 const width=Number.isFinite(topPlacement?.width)?topPlacement.width:126;
 const y=Number.isFinite(topPlacement?.y)?topPlacement.y:81;
 const height=Number.isFinite(topPlacement?.height)?topPlacement.height:135;
 const shape={lean:.96,athletic:1,broad:1.055}[build]||1;
 // Garment alpha is only allowed to position the sleeve opening. It must
 // never dictate the person's skeleton, arm thickness or hand anatomy.
 const measured=sleeveFit&&Number.isFinite(sleeveFit.left)&&Number.isFinite(sleeveFit.right)
  &&Number.isFinite(sleeveFit.y)&&sleeveFit.right>sleeveFit.left;
 const measuredX=measured?(sleeveFit.left+180-sleeveFit.right)*.5:null;
 const sleeveX=clamp((measured?measuredX:90-width*.445)*shape,24,46);
 const sleeveY=clamp(measured?sleeveFit.y:y+height*.355,114,143);
 // Real joints are not collinear: elbow naturally rests slightly outside
 // the sleeve and the relaxed wrist returns inward toward the hip.
 // Keep vertical landmarks broadly stable when switching fitted/loose tees.
 const elbowX=clamp(sleeveX-8.4,16,42);
 const elbowY=clamp(168+(sleeveY-124)*.32,160,177);
 const wristX=clamp(elbowX+6.1,22,48);
 const wristY=clamp(208+(sleeveY-124)*.22,201,216);
 const handY=clamp(wristY+19,220,238);
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
 // A single continuous tapered skin silhouette beneath the original shirt.
 // The outer contour swells near the upper arm, narrows at the elbow and
 // tapers towards the wrist. No horizontal elbow/wrist cuff or segmented pipe.
 const arm=[
  'M',round(sx-6.8),round(sy-1.5),
  'C',round(sx-10.5),round(sy+12),round(ex-8.2),round(ey-16),round(ex-7.3),ey,
  'C',round(ex-7.8),round(ey+11),round(wx-5.4),round(wy-14),round(wx-4.8),wy,
  'Q',wx,round(wy+2.2),round(wx+4.5),round(wy-.5),
  'C',round(wx+5),round(wy-13),round(ex+6.8),round(ey+12),round(ex+6),round(ey-1),
  'C',round(ex+6.4),round(ey-16),round(sx+6.8),round(sy+7),round(sx+6),round(sy-1.5),
  'Q',sx,round(sy-3),round(sx-6.8),round(sy-1.5),'Z'
 ].join(' ');
 svgEl('path',{d:arm,fill:'url(#personaSkin)',
  stroke:'var(--persona-shade)','stroke-opacity':'.21','stroke-width':'.72',
  'stroke-linejoin':'round','stroke-linecap':'round'},sub);

 // Relaxed hand: narrow palm, visible thumb on the body's inner side and
 // three shallow fingertip contours. Scale stays proportional to the wrist.
 const hand=[
  'M',round(wx-4.6),round(wy-1),
  'C',round(wx-4.8),round(wy+3),round(wx-4.5),round(wy+7),round(wx-4.3),round(wy+10),
  'L',round(wx-4),round(hy-3.8),
  'Q',round(wx-3.8),round(hy-.3),round(wx-2.6),round(hy-.1),
  'Q',round(wx-1.4),round(hy+.1),round(wx-1.2),round(hy-2.3),
  'Q',round(wx-.9),round(hy+.9),round(wx+.7),round(hy+.9),
  'Q',round(wx+2.3),round(hy+.7),round(wx+2.2),round(hy-2),
  'Q',round(wx+2.6),round(hy+.4),round(wx+3.8),round(hy-.2),
  'Q',round(wx+5.3),round(hy-1),round(wx+4.9),round(hy-3.5),
  'L',round(wx+4.2),round(wy+10.5),
  'Q',round(wx+5.2),round(wy+12.2),round(wx+7),round(wy+10.5),
  'Q',round(wx+7.5),round(wy+9),round(wx+6.5),round(wy+7.2),
  'Q',round(wx+4.5),round(wy+5),round(wx+4.2),round(wy+2.5),
  'L',round(wx+4.3),round(wy-1),
  'Q',wx,round(wy-3),round(wx-4.6),round(wy-1),'Z'
 ].join(' ');
 svgEl('path',{d:hand,fill:'url(#personaSkin)',
  stroke:'var(--persona-shade)','stroke-opacity':'.24','stroke-width':'.6',
  'stroke-linejoin':'round','stroke-linecap':'round'},sub);
 // Very faint finger lines; avoid wrist bands and drawn-on cartoon knuckles.
 svgEl('path',{d:[
  'M',round(wx-.9),round(hy-5),'L',round(wx-.9),round(hy-2.4),
  'M',round(wx+2.1),round(hy-5.1),'L',round(wx+2.1),round(hy-2.1)
 ].join(' '),fill:'none',stroke:'var(--persona-shade)',
  'stroke-opacity':'.13','stroke-width':'.55','stroke-linecap':'round'},sub);
 // Short elbow shadow (not a horizontal seam across the limb).
 svgEl('path',{d:[
  'M',round(ex+1),round(ey+3),
  'Q',round(ex+3.5),round(ey+1.3),round(ex+4),round(ey-1)
 ].join(' '),fill:'none',stroke:'var(--persona-shade)',
  'stroke-opacity':'.11','stroke-width':'.7','stroke-linecap':'round'},sub);
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
 const sleeveFit=outer&&category==='top'?window.getNaturalSleeveFitV4?.(outer,category):null;
 const geometry=calculateRig(placement,avatarProfile?.build,sleeveFit);
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
window.renderAvatarV2?.(); // First visual render after the new module is available.
})();