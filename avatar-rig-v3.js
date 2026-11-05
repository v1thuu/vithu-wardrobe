/* VITHU AVATAR V3 – garment-driven body rig. Pure browser JS; local garment-alpha analysis.
   The base person stays consistent. Outfit silhouette influences shoulder/arm, hip/leg
   and foot anchors within conservative limits. No photos sent to any server. */
(function(){
'use strict';
const figure=document.getElementById('figure');
if(!figure)return;
const person=figure.querySelector('#personaDrawing');
const rigArmGroup=person&&person.querySelector('#personaArms');
const lowerBody=person&&person.querySelector('#personaLowerBody');
const basePants=person&&person.querySelector('#personaBasePants');
const baseShoes=person&&person.querySelector('#personaBaseShoes');
if(!person||!rigArmGroup||!lowerBody||!basePants||!baseShoes)return;
const armPaths=[...rigArmGroup.querySelectorAll('path')];
if(armPaths.length<3)return;
const originals=armPaths.map(path=>path.getAttribute('d'));
const storedTrans={
 arms:rigArmGroup.getAttribute('transform'),
 pants:basePants.getAttribute('transform'),
 shoes:baseShoes.getAttribute('transform')
};
const clamp=(value,low,high)=>Math.max(low,Math.min(high,value));
const measurements=new Map();
const maxCache=48;
const regular=Object.freeze({topScale:1,bottomScale:1,shoeScale:1,sleeve:'short',shoulder:40,hand:215,active:false});
let current={...regular};
function selected(cat){
 const id=chosen[cat];
 return id?items.find(it=>it.id===id&&it.category===cat&&it.image):null;
}
function classFor(item,cat){
 if(!item)return '';
 const text=((item.avatarSubtype||'')+' '+(item.name||'')).toLowerCase();
 if(cat==='top'||cat==='outerwear'){
  if(/hoodie|jacket|jacke|coat|mantel|sweat|kapuzen/.test(text))return 'longSleeve';
  if(/oversized|oversize|loose|boxy/.test(text))return 'loose';
  if(/slim|fitted|muscle/.test(text))return 'fitted';
  return 'regular';
 }
 if(cat==='bottom'){
  if(/wide|baggy|relaxed|loose/.test(text))return 'wide';
  if(/straight|regular/.test(text))return 'straight';
  return 'slim';
 }
 if(cat==='shoes'){
  if(/chunky|platform|dad shoe/.test(text))return 'chunky';
  if(/boot|stiefel/.test(text))return 'boot';
  return 'regular';
 }
 return '';
}
function rowWidth(rgba,w,h,row){
 const y=clamp(Math.round(row*(h-1)),0,h-1);
 let min=w,max=-1;
 for(let dy=-2;dy<=2;dy++){
  const yy=clamp(y+dy,0,h-1);
  for(let x=0;x<w;x++)if(rgba[(yy*w+x)*4+3]>130){min=Math.min(min,x);max=Math.max(max,x);}
 }
 return max>=min?(max-min+1)/w:null;
}
function alphaContour(data,w,h){
 let opaque=0,minX=w,minY=h,maxX=-1,maxY=-1;
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  if(data[(y*w+x)*4+3]<125)continue;
  opaque++;minX=Math.min(minX,x);maxX=Math.max(maxX,x);
  minY=Math.min(minY,y);maxY=Math.max(maxY,y);
 }
 if(opaque<25||opaque/(w*h)>.96||maxX<minX||maxY<minY)return null;
 const width=maxX-minX+1,height=maxY-minY+1,rows={};
 // Use the clothing extent instead of the full uploaded photograph canvas.
 const local=new Uint8ClampedArray(width*height*4);
 for(let y=0;y<height;y++)
  for(let x=0;x<width;x++){
   const from=((minY+y)*w+minX+x)*4,to=(y*width+x)*4;
   local[to+3]=data[from+3];
  }
 for(const [name,y] of [['shoulder',.21],['chest',.43],['hip',.28],['thigh',.51],['ankle',.85]]){
  rows[name]=rowWidth(local,width,height,y);
 }
 return {aspect:width/height,rows};
}
function measure(item,cat){
 if(!item||!/^data:image\/(?:png|jpeg|jpg|webp);base64,/.test(item.image||''))return null;
 const key=cat+':'+item.id,seen=measurements.get(key);
 if(seen&&seen.image===item.image)return seen.contour;
 measurements.set(key,{image:item.image,contour:null});
 if(measurements.size>maxCache)measurements.delete(measurements.keys().next().value);
 const image=new Image();
 image.onload=()=>{
  try{
   const scale=Math.min(1,160/Math.max(image.naturalHeight||0,image.naturalWidth||0));
   if(!Number.isFinite(scale)||scale<=0)return;
   const canvas=document.createElement('canvas');
   canvas.width=Math.max(1,Math.round(image.naturalWidth*scale));
   canvas.height=Math.max(1,Math.round(image.naturalHeight*scale));
   const ctx=canvas.getContext('2d',{willReadFrequently:true});
   if(!ctx)return;
   ctx.drawImage(image,0,0,canvas.width,canvas.height);
   const contour=alphaContour(ctx.getImageData(0,0,canvas.width,canvas.height).data,canvas.width,canvas.height);
   const record=measurements.get(key);
   if(record&&record.image===item.image){
    record.contour=contour;
    if(typeof window.renderAvatarV2==='function')window.renderAvatarV2();
   }
  }catch(error){console.warn('Body rig garment contour fallback',error);}
 };
 image.onerror=()=>{};
 image.src=item.image;
 return null;
}
function computeRig(garments,profile,contours={}){
 const top=garments.outerwear||garments.top;
 const bottom=garments.bottom,shoes=garments.shoes;
 const topType=classFor(top,garments.outerwear?'outerwear':'top');
 const pantsType=classFor(bottom,'bottom'),shoeType=classFor(shoes,'shoes');
 const topDefault={fitted:.96,regular:1,loose:1.08,longSleeve:1.07,'':1}[topType];
 const pantsDefault={slim:.96,straight:1,wide:1.09,'':1}[pantsType];
 const footDefault={regular:1,chunky:1.075,boot:1.025,'':1}[shoeType];
 const t=garments.outerwear?contours.outerwear:contours.top, p=contours.bottom,sh=contours.shoes;
 // Extracted garment contours refine the subtype slightly, but never define
 // real-world body measurements or allow extreme warping.
 const shirtRatio=t&&t.rows.chest&&t.rows.shoulder?t.rows.shoulder/t.rows.chest:1;
 const hemRatio=p&&p.rows.thigh&&p.rows.ankle?p.rows.ankle/p.rows.thigh:1;
 const footRatio=sh?sh.aspect:1.5;
 const topScale=clamp(topDefault+clamp((shirtRatio-1)*.12,-.04,.055),.92,1.14);
 const bottomScale=clamp(pantsDefault+clamp((hemRatio-1)*.08,-.035,.035),.92,1.15);
 const shoeScale=clamp(footDefault+clamp((footRatio-1.5)*.018,-.025,.035),.96,1.13);
 const sleeve=topType==='longSleeve'?'long':topType==='loose'?'wide':'short';
 const shoulder=clamp(41+Math.round((topScale-1)*34),38,46);
 const hand=clamp(213+(profile?.build==='broad'?2:0),211,218);
 return {topScale,bottomScale,shoeScale,sleeve,shoulder,hand,active:true,
   source:{top:topType||'none',bottom:pantsType||'none',shoes:shoeType||'none'}};
}
function shoulderArms(rig){
 // Arms begin *inside* sleeves, eliminating the exposed skin triangles at y~90.
 // Smooth elbow taper and actual small finger creases replace capsule hands.
 const sx=rig.shoulder,hand=rig.hand;
 const out=(x)=>180-x;
 const left='M'+sx+' 116 Q'+(sx-9)+' 119 '+(sx-13)+' 135 Q'+(sx-15)+' 150 '+(sx-19)+' 172 L'+(sx-20)+' '+(hand-14)+
 ' Q'+(sx-21)+' '+(hand+2)+' '+(sx-14)+' '+(hand+5)+' Q'+(sx-5)+' '+(hand+5)+' '+(sx-5)+' '+(hand-9)+
 ' L'+(sx-4)+' 177 Q'+(sx-1)+' 159 '+(sx+6)+' 137 L'+(sx+8)+' 121Z';
 const mirrorLeft=()=>{
  // Mirror the left arm path reliably using a group transform on its own path.
  armPaths[1].setAttribute('transform','translate(180 0) scale(-1 1)');
 };
 armPaths[0].setAttribute('d',left);
 armPaths[0].removeAttribute('transform');
 armPaths[1].setAttribute('d',left);
 mirrorLeft();
 armPaths[2].setAttribute('d',
 'M'+(sx-15)+' 174 Q'+(sx-17)+' 180 '+(sx-15)+' 186'+
 ' M'+(sx-19)+' '+(hand-11)+' l2 6 m1 -4 l2 6'+
 ' M'+(out(sx-15))+' 174 Q'+(out(sx-17))+' 180 '+(out(sx-15))+' 186'+
 ' M'+(out(sx-19))+' '+(hand-11)+' l-2 6 m-1 -4 l-2 6');
}
function restoreClassic(){
 armPaths.forEach((p,i)=>{p.setAttribute('d',originals[i]);p.removeAttribute('transform');});
 const groups=[[rigArmGroup,storedTrans.arms],[basePants,storedTrans.pants],[baseShoes,storedTrans.shoes]];
 for(const [g,t] of groups){if(t==null)g.removeAttribute('transform');else g.setAttribute('transform',t);}
 current={...regular};
 window.__wardrobeRigV3=current;
}
function applyRig(rig){
 shoulderArms(rig);
 rigArmGroup.setAttribute('transform','translate(90 0) scale('+rig.topScale+' 1) translate(-90 0)');
 basePants.setAttribute('transform','translate(90 0) scale('+rig.bottomScale+' 1) translate(-90 0)');
 baseShoes.setAttribute('transform','translate(90 0) scale('+rig.shoeScale+' 1) translate(-90 0)');
 current=rig;window.__wardrobeRigV3=rig;
}
function renderGarmentDrivenRig(garments){
 const dropdown=document.getElementById('avatarMorphMode');
 if(dropdown&&dropdown.value!==avatarMorphMode)dropdown.value=avatarMorphMode;
 if(view!=='styled'||avatarRenderMode==='original'||avatarMorphMode==='classic'){
  restoreClassic();return current;
 }
 const contours={};
 for(const [cat,item] of Object.entries(garments)){
  if(item){contours[cat]=measure(item,cat);}
 }
 const next=computeRig(garments,avatarProfile,contours);
 applyRig(next);
 return next;
}
function setAvatarMorphMode(value){
 if(!['adaptive','classic'].includes(value))return;
 avatarMorphMode=value;
 const input=document.getElementById('avatarMorphMode');
 if(input)input.value=value;
 window.renderAvatarV2?.();
 if(storageReady)persist().catch(e=>console.error('Avatar rig preference failed to save',e));
}
window.renderGarmentDrivenRig=renderGarmentDrivenRig;
window.setAvatarMorphMode=setAvatarMorphMode;
window.__wardrobeRigV3=current;
window.__vithuRigHelpers={alphaContour,computeRig};
const dropdown=document.getElementById('avatarMorphMode');
if(dropdown)dropdown.value=avatarMorphMode;
window.renderAvatarV2?.();
})();
