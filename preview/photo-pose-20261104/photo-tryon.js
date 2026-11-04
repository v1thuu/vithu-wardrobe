/* VITHU WARDROBE photo try-on prototype. Images stay in this browser.
 * Experimental 2D photo registration, NOT generative virtual try-on. */
(function(){
'use strict';
const photoImage=document.getElementById('personPhoto');
const frame=document.getElementById('photoTryOn');
const layer=document.getElementById('photoWearLayer');
const alignButton=document.getElementById('photoAutoAlign');
const photoStatus=document.getElementById('photoTryOnStatus');
if(!photoImage||!frame||!layer||!alignButton||!photoStatus)return;
const finite=(n)=>typeof n==='number'&&Number.isFinite(n);
const within=(n,a,b)=>Math.max(a,Math.min(b,n));
function average(a,b){return {x:(a.x+b.x)/2,y:(a.y+b.y)/2};}
function validLandmark(p){return p&&finite(p.x)&&finite(p.y)&&p.x>=-.1&&p.x<=1.1&&p.y>=-.1&&p.y<=1.1&&(p.visibility===undefined||p.visibility>=.45);}
function bodyGeometry(points){
 if(!Array.isArray(points)||![11,12,23,24,27,28].every(i=>validLandmark(points[i])))return null;
 const shoulder=average(points[11],points[12]),hip=average(points[23],points[24]),ankle=average(points[27],points[28]);
 const shoulderSpan=Math.abs(points[11].x-points[12].x),hipSpan=Math.abs(points[23].x-points[24].x);
 const torso=hip.y-shoulder.y,legs=ankle.y-hip.y;
 if(shoulderSpan<.065||shoulderSpan>.8||hipSpan<.045||torso<.10||torso>.5||legs<.18||legs>.65)return null;
 return {shoulder,hip,ankle,shoulderSpan,hipSpan,torso,legs,points};
}
function fallbackGeometry(){
 return {shoulder:{x:.5,y:.245},hip:{x:.5,y:.53},ankle:{x:.5,y:.90},shoulderSpan:.25,hipSpan:.205,torso:.285,legs:.37,points:[]};
}
function photoBox(cat){
 const g=bodyGeometry(photoPose&&photoPose.landmarks)||fallbackGeometry();
 const top={x:g.shoulder.x,y:g.shoulder.y+g.torso*.50,w:within(g.shoulderSpan*1.55,.19,.67),h:within(g.torso*1.20,.15,.42)};
 const pants={x:g.hip.x,y:g.hip.y+g.legs*.49,w:within(g.hipSpan*1.52,.16,.55),h:within(g.legs*1.12,.23,.67)};
 const feet={x:g.ankle.x,y:within(g.ankle.y+.015,0,.98),w:within(g.hipSpan*1.9,.18,.62),h:within(g.legs*.17,.045,.12)};
 const head={x:g.shoulder.x,y:within(g.shoulder.y-g.torso*.32,.05,.85),w:within(g.shoulderSpan*.70,.09,.30),h:within(g.torso*.24,.045,.13)};
 const wrist=(i)=>validLandmark(g.points[i])?g.points[i]:{x:g.shoulder.x+(i===15?-.28:.28),y:g.hip.y-.06};
 const out={
  top,outerwear:{...top,w:top.w*1.20,h:top.h*1.15,y:top.y+.015},
  bottom:pants,shoes:feet,cap:{...head,y:head.y-.04,h:head.h*.6},hat:{...head,y:head.y-.04},
  glasses:{...head,y:head.y+.065,h:head.h*.33},necklace:{x:top.x,y:g.shoulder.y+.06,w:top.w*.37,h:top.h*.27},
  belt:{x:pants.x,y:g.hip.y+.013,w:pants.w*.96,h:within(pants.h*.13,.027,.09)},
  watch:{...wrist(16),w:.09,h:.055},bracelet:{...wrist(15),w:.09,h:.055},
  ring:{...wrist(16),w:.045,h:.032},
  bag:{x:within(g.hip.x+.28,.15,.87),y:top.y+.065,w:top.w*.5,h:top.h*.8}
 };
 return out[cat]||top;
}
function photoFitFor(id){
 const f=photoFits&&photoFits[id];
 return f&&finite(f.dx)&&finite(f.dy)&&finite(f.scale)?f:{dx:0,dy:0,scale:1};
}
function renderPhotoTryOn(){
 const shown=view==='photo'&&!!personPhoto;
 frame.hidden=!personPhoto;
 photoStatus.textContent=!personPhoto?'Ganzkörperfoto auswählen':photoPose?'Körperpunkte erkannt · Kleidungsstücke lassen sich ziehen.':'Kleidung grob platziert · für genauere Position einmal automatisch ausrichten.';
 const active=new Set();
 if(shown){
  for(const [cat,id] of Object.entries(chosen)){
   if(!id)continue;
   const item=items.find(it=>it.id===id);if(!item||!item.image)continue;
   active.add(id);
   let img=[...layer.children].find(el=>el.dataset.garmentId===id);
   if(!img){img=document.createElement('img');img.className='photo-wear';img.alt=item.name||cats[cat];img.draggable=false;img.dataset.garmentId=id;layer.append(img);}
   if(img.src!==item.image)img.src=item.image;
   img.dataset.category=cat;
   const b=photoBox(cat),f=photoFitFor(id);
   img.style.left=(b.x+f.dx)*100+'%';
   img.style.top=(b.y+f.dy)*100+'%';
   img.style.width=b.w*100+'%';
   img.style.height=b.h*100+'%';
   img.style.transform='translate(-50%, -50%) rotate('+(f.rot||0)+'deg) scale('+within(f.scale,.45,2.5)+')';
   img.style.zIndex=String((defaultAvatarLayers[cat]||6)+2);
  }
 }
 for(const el of [...layer.children])if(!active.has(el.dataset.garmentId))el.remove();
}
const oldRenderPerson=renderPerson;
renderPerson=function(){oldRenderPerson();renderPhotoTryOn();};
const oldSetView=setView;
setView=function(v){
 oldSetView(v);
 document.getElementById('avatar-adjust').hidden=v==='photo';
 renderPhotoTryOn();
};
const oldOnPersonPhoto=onPersonPhoto;
onPersonPhoto=async function(e){
 const prior=personPhoto;
 await oldOnPersonPhoto(e);
 if(personPhoto!==prior){photoPose=null;photoFits={};await persist();renderPhotoTryOn();}
};
const oldRemoveItem=removeItem;
removeItem=async function(id){
 await oldRemoveItem(id);
 if(!items.some(it=>it.id===id)&&photoFits&&photoFits[id]){delete photoFits[id];await persist();}
 renderPhotoTryOn();
};
async function autoAlignPhoto(){
 if(!personPhoto||!photoImage.complete||!photoImage.naturalWidth)return toast('Zuerst Ganzkörperfoto laden');
 if(alignButton.disabled)return;
 alignButton.disabled=true;
 alignButton.textContent='Körperpunkte erkennen …';
 photoStatus.textContent='Das Modell wird geladen. Die Bildanalyse erfolgt im Browser.';
 try{
  const visionModule=await import('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.2.0/vision_bundle.mjs');
  const vision=await visionModule.FilesetResolver.forVisionTasks('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.2.0/wasm');
  const detector=await visionModule.PoseLandmarker.createFromOptions(vision,{
   baseOptions:{modelAssetPath:'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',delegate:'CPU'},
   runningMode:'IMAGE',numPoses:1,minPoseDetectionConfidence:.5,minPosePresenceConfidence:.5
  });
  let points;
  try{points=detector.detect(photoImage).landmarks?.[0];}
  finally{detector.close();}
  if(!bodyGeometry(points))throw new Error('Ganzkörper nicht eindeutig erkannt. Foto frontal mit Schultern, Hüfte und Füssen aufnehmen.');
  // Store only the coordinates required for fitting. Photo pixels are never transferred.
  const keep=[11,12,15,16,23,24,27,28];
  const landmarks=Array.from({length:33},(_,i)=>keep.includes(i)?{x:points[i].x,y:points[i].y,visibility:points[i].visibility}:null);
  photoPose={landmarks,photoWidth:photoImage.naturalWidth,photoHeight:photoImage.naturalHeight};
  photoFits={};
  await persist();
  renderPhotoTryOn();
  toast('Körperpunkte erkannt · Outfit ausgerichtet');
 }catch(e){
  console.error('Photo try-on pose fit failed',e);
  photoStatus.textContent='Automatische Ausrichtung nicht möglich: '+(e?.message||'Modell nicht verfügbar')+' · Kleidung bleibt manuell verschiebbar.';
 }finally{
  alignButton.disabled=false;alignButton.textContent='✨ Automatisch ausrichten';
 }
}
window.autoAlignPhoto=autoAlignPhoto;
// Only the new photo overlays receive these gestures. Original avatar events are untouched.
const pointerStates=new Map();
let gesture=null,selectedId=null;
function restartGesture(){
 if(!selectedId||!pointerStates.size){gesture=null;return;}
 gesture={base:{...photoFitFor(selectedId)},start:[...pointerStates.values()].map(p=>({...p}))};
}
layer.addEventListener('pointerdown',e=>{
 const el=e.target.closest('.photo-wear');if(!el||view!=='photo')return;
 const id=el.dataset.garmentId;
 if(selectedId!==id){pointerStates.clear();selectedId=id;}
 pointerStates.set(e.pointerId,{x:e.clientX,y:e.clientY});
 restartGesture();
 try{el.setPointerCapture(e.pointerId);}catch(_){}
 e.preventDefault();
});
layer.addEventListener('pointermove',e=>{
 if(!gesture||!pointerStates.has(e.pointerId))return;
 pointerStates.set(e.pointerId,{x:e.clientX,y:e.clientY});
 const current=[...pointerStates.values()],initial=gesture.start;
 const x0=initial.reduce((s,p)=>s+p.x,0)/initial.length,y0=initial.reduce((s,p)=>s+p.y,0)/initial.length;
 const x1=current.reduce((s,p)=>s+p.x,0)/current.length,y1=current.reduce((s,p)=>s+p.y,0)/current.length;
 const rect=frame.getBoundingClientRect(),base=gesture.base;
 let scale=base.scale;
 if(initial.length>1&&current.length>1){
  const d0=Math.hypot(initial[0].x-initial[1].x,initial[0].y-initial[1].y)||1;
  const d1=Math.hypot(current[0].x-current[1].x,current[0].y-current[1].y);
  scale=within(base.scale*d1/d0,.45,2.5);
 }
 photoFits[selectedId]={...base,dx:within(base.dx+(x1-x0)/Math.max(1,rect.width),-.7,.7),dy:within(base.dy+(y1-y0)/Math.max(1,rect.height),-.7,.7),scale};
 renderPhotoTryOn();
 e.preventDefault();
});
function releasePointer(e){
 if(!pointerStates.has(e.pointerId))return;
 pointerStates.delete(e.pointerId);
 if(pointerStates.size)restartGesture();
 else{gesture=null;selectedId=null;persist().catch(err=>console.error('Photo fit save failed',err));}
}
layer.addEventListener('pointerup',releasePointer);
layer.addEventListener('pointercancel',releasePointer);
photoImage.addEventListener('load',renderPhotoTryOn);
renderPhotoTryOn();
})();
