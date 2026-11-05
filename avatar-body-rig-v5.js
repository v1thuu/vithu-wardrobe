/* VITHU WARDROBE: opt-in joint-driven arm rig (V5 prototype).
   Keeps original V4 alpha cutouts and all V3 geometry untouched.
   All SVG paths are local and generated from the garment's measured placement.
   No remote services or photo uploads. */
(function(){
'use strict';
const NS='http://www.w3.org/2000/svg';
const clamp=(n,lo,hi)=>Math.max(lo,Math.min(hi,n));

// Fixed anatomical skeleton in the 180px avatar coordinate system.
// Clothing may alter sleeveX/sleeveY only; it never changes these joints.
const RIG_LANDMARKS=Object.freeze({
 shoulder:Object.freeze({x:40,y:108}),
 upperArm:Object.freeze({x:32,y:145}),
 elbow:Object.freeze({x:25,y:169}),
 forearm:Object.freeze({x:28,y:190}),
 wrist:Object.freeze({x:32,y:211}),
 handLength:19
});
const RIG_RADII=Object.freeze({
 sleeve:7.1,upperArm:7.6,elbow:6.3,forearm:5.2,wrist:4.3
});
const BUILD_RADIUS_SCALE=Object.freeze({lean:.90,athletic:1,broad:1.13});
const BODY_CENTER_X=90;
const BODY_VIEW_WIDTH=180;
const round=(n)=>Number(n.toFixed(2));

const getFigure=()=>document.getElementById('figure');


function mapGarmentFitV5(metrics){
 const valid=!!metrics&&Number.isFinite(metrics.fitScore)&&Number.isFinite(metrics.confidence)
  &&metrics.confidence>=.64&&Number.isFinite(metrics.chestWidth)&&metrics.chestWidth>4;
 const score=valid?clamp(metrics.fitScore,0,1):.5;
 return {reliable:valid,fitScore:score,fitClass:valid?metrics.fitClass:'regular',
  garmentScale:valid?clamp(.91+.18*score,.91,1.09):1};
}
function getAdaptiveCutoutPlacementV5(item,category='top'){
 if(!item||category!=='top')return null;
 const base=window.getNaturalCutoutPlacementV4?.(item,category);
 if(!base||!base.width)return null;
 const fit=mapGarmentFitV5(window.getOriginalTopMaskMetricsV5?.(item));
 if(!fit.reliable)return null;
 const width=clamp(base.width*fit.garmentScale,base.width*.90,Math.min(154,base.width*1.11));
 const height=base.height*width/base.width;
 if(!Number.isFinite(height)||height<=0)return null;
 return {x:round(90-width/2),y:base.y,width:round(width),height:round(height)};
}
function calculateRig(topPlacement,build,sleeveFit=null){
 const width=Number.isFinite(topPlacement?.width)?topPlacement.width:126;
 const y=Number.isFinite(topPlacement?.y)?topPlacement.y:81;
 const height=Number.isFinite(topPlacement?.height)?topPlacement.height:135;
 const shape={lean:.96,athletic:1,broad:1.055}[build]||1;
 const measured=sleeveFit&&Number.isFinite(sleeveFit.left)&&Number.isFinite(sleeveFit.right)
   &&Number.isFinite(sleeveFit.y)&&sleeveFit.right>sleeveFit.left;
 const measuredX=measured?(sleeveFit.left+BODY_VIEW_WIDTH-sleeveFit.right)*.5:null;
 // A shirt affects where bare skin starts, not the arm's actual skeleton.
 const sleeveX=clamp((measured?measuredX:BODY_CENTER_X-width*.445)*shape,24,46);
 const sleeveY=clamp(measured?sleeveFit.y:y+height*.355,114,143);
 const scale=BUILD_RADIUS_SCALE[build]||1;
 const radii=Object.fromEntries(Object.entries(RIG_RADII).map(([key,r])=>[
  key,round(clamp(r*scale,3.75,9.2))
 ]));
 const joints={
  shoulder:{...RIG_LANDMARKS.shoulder},
  upperArm:{...RIG_LANDMARKS.upperArm},
  elbow:{...RIG_LANDMARKS.elbow},
  forearm:{...RIG_LANDMARKS.forearm},
  wrist:{...RIG_LANDMARKS.wrist}
 };
 return {
  sleeveX:round(sleeveX),sleeveY:round(sleeveY),
  shoulderX:joints.shoulder.x,shoulderY:joints.shoulder.y,
  upperArmX:joints.upperArm.x,upperArmY:joints.upperArm.y,
  elbowX:joints.elbow.x,elbowY:joints.elbow.y,
  forearmX:joints.forearm.x,forearmY:joints.forearm.y,
  wristX:joints.wrist.x,wristY:joints.wrist.y,
  handY:joints.wrist.y+RIG_LANDMARKS.handLength,
  joints,radii,garmentWidth:round(width)
 };
}

function tangentNormal(points,index){
 const from=points[Math.max(0,index-1)],to=points[Math.min(points.length-1,index+1)];
 const dx=to.x-from.x,dy=to.y-from.y;
 const len=Math.hypot(dx,dy)||1;
 return {x:-dy/len,y:dx/len};
}
function offsetArmSide(points,sign){
 return points.map((p,i)=>{
  const n=tangentNormal(points,i);
  return {x:p.x+n.x*p.radius*sign,y:p.y+n.y*p.radius*sign};
 });
}
function catmullRomSegmentPaths(points){
 const segments=[];
 for(let i=0;i<points.length-1;i++){
  const p0=points[Math.max(0,i-1)],p1=points[i],p2=points[i+1],
   p3=points[Math.min(points.length-1,i+2)];
  const c1={x:p1.x+(p2.x-p0.x)/6,y:p1.y+(p2.y-p0.y)/6};
  const c2={x:p2.x-(p3.x-p1.x)/6,y:p2.y-(p3.y-p1.y)/6};
  segments.push(['C',round(c1.x),round(c1.y),round(c2.x),round(c2.y),
    round(p2.x),round(p2.y)].join(' '));
 }
 return segments.join(' ');
}
function createArmOutlineV5(g){
 const points=[
  {x:g.sleeveX,y:g.sleeveY,radius:g.radii.sleeve},
  {x:g.upperArmX,y:g.upperArmY,radius:g.radii.upperArm},
  {x:g.elbowX,y:g.elbowY,radius:g.radii.elbow},
  {x:g.forearmX,y:g.forearmY,radius:g.radii.forearm},
  {x:g.wristX,y:g.wristY,radius:g.radii.wrist}
 ];
 const exterior=offsetArmSide(points,1);
 const interior=offsetArmSide(points,-1).reverse();
 return ['M',round(exterior[0].x),round(exterior[0].y),
  catmullRomSegmentPaths(exterior),
  'Q',round(g.wristX),round(g.wristY+1),round(interior[0].x),round(interior[0].y),
  catmullRomSegmentPaths(interior),
  'Q',round(g.sleeveX),round(g.sleeveY-2),round(exterior[0].x),round(exterior[0].y),
  'Z'].join(' ');
}
function createHandOutlineV5(g){
 const wx=g.wristX,wy=g.wristY,hy=g.handY;
 const r=clamp(g.radii.wrist*.97,3.6,5.3);
 // Continuous relaxed fist silhouette: no separate fingertip zigzags.
 // On the left arm the thumb faces inward (positive x); right is mirrored.
 return ['M',round(wx-r),round(wy-1),
  'C',round(wx-r-1),round(wy+4),round(wx-r-.7),round(hy-4),round(wx-r+.3),round(hy-1),
  'Q',round(wx),round(hy+1),round(wx+r-.4),round(hy-1),
  'C',round(wx+r+.4),round(hy-3),round(wx+r-.5),round(wy+11),round(wx+r),round(wy+9),
  'C',round(wx+r+2.5),round(wy+12),round(wx+r+4),round(wy+10),
  round(wx+r+2.4),round(wy+7),
  'Q',round(wx+r+.5),round(wy+4),round(wx+r-.3),round(wy+2),
  'L',round(wx+r-.5),round(wy-1),
  'Q',round(wx),round(wy-2),round(wx-r),round(wy-1),'Z'].join(' ');
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
 svgEl('path',{d:createArmOutlineV5(g),fill:'url(#personaSkin)',
  stroke:'var(--persona-shade)','stroke-opacity':'.19','stroke-width':'.65',
  'stroke-linecap':'round','stroke-linejoin':'round'},sub);
 svgEl('path',{d:createHandOutlineV5(g),fill:'url(#personaSkin)',
  stroke:'var(--persona-shade)','stroke-opacity':'.20','stroke-width':'.55',
  'stroke-linecap':'round','stroke-linejoin':'round'},sub);
 // Two low-contrast, continuous highlights. No knuckles or wrist seams.
 svgEl('path',{d:['M',round(g.upperArmX+2.2),round(g.upperArmY-3),
  'Q',round(g.elbowX+3),round(g.elbowY-5),
  round(g.forearmX+2),round(g.forearmY+1)].join(' '),
  fill:'none',stroke:'var(--persona-light)','stroke-opacity':'.08',
  'stroke-width':'1.2','stroke-linecap':'round'},sub);
 svgEl('path',{d:['M',round(g.elbowX+3),round(g.elbowY),
  'Q',round(g.elbowX+4),round(g.elbowY+4),
  round(g.elbowX+3),round(g.elbowY+6)].join(' '),
  fill:'none',stroke:'var(--persona-shade)','stroke-opacity':'.10',
  'stroke-width':'.55','stroke-linecap':'round'},sub);
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
 const placement=outer?(getAdaptiveCutoutPlacementV5(outer,category)||window.getNaturalCutoutPlacementV4?.(outer,category)):null;
 const sleeveFit=outer&&category==='top'?window.getNaturalSleeveFitV4?.(outer,category,placement):null;
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
window.getAdaptiveCutoutPlacementV5=getAdaptiveCutoutPlacementV5;
window.updateWardrobeBodyRigV5=update;
window.setAvatarBodyRigMode=setMode;
window.__vithuBodyV5Test={calculateRig,drawRig,mapGarmentFitV5,getAdaptiveCutoutPlacementV5,createArmOutlineV5,createHandOutlineV5,RIG_LANDMARKS,RIG_RADII,BUILD_RADIUS_SCALE};
window.renderAvatarV2?.(); // First visual render after the new module is available.
})();