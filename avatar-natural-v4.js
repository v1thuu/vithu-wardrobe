/* VITHU WARDROBE – Avatar Silhouette V4 (experimental).
   Unlike the old split SVG fabric mapping, this renders the original alpha
   garment silhouette with a uniform scale and its authentic fabric details.
   It does not attempt fake fold reconstruction or 3D fitting.
   All processing stays on-device.  Never upload garment images. */
(function(){
'use strict';
const cache=new Map();
const MAX_CACHE=28;
const shapeAnchors={
 top:{centerX:90,startY:80,maxWidth:138,maxHeight:142},
 outerwear:{centerX:90,startY:78,maxWidth:148,maxHeight:154},
 bottom:{centerX:90,startY:208,maxWidth:124,maxHeight:223},
 shoes:{centerX:90,endY:448,maxWidth:146,maxHeight:45}
};
const svgNS='http://www.w3.org/2000/svg';
function alphaBounds(pixels,width,height){
 if(!pixels||!width||!height)return null;
 let minX=width,minY=height,maxX=-1,maxY=-1,opaque=0;
 for(let y=0;y<height;y++){
  for(let x=0;x<width;x++){
   if(pixels[(y*width+x)*4+3]<60)continue;
   opaque++;
   if(x<minX)minX=x;if(x>maxX)maxX=x;
   if(y<minY)minY=y;if(y>maxY)maxY=y;
  }
 }
 // Solid-background pictures are not safe to overlay onto a cartoon avatar.
 if(opaque<24||opaque/(width*height)>.967||minX>maxX)return null;
 const regionWidth=maxX-minX+1,regionHeight=maxY-minY+1;
 if(regionWidth<6||regionHeight<6)return null;
 return {x:minX,y:minY,width:regionWidth,height:regionHeight,coverage:opaque/(width*height)};
}
function analyze(item,category){
 if(!item||!/^data:image\/(?:png|webp|jpe?g);base64,/i.test(item.image||''))return null;
 const key=category+':'+item.id,seen=cache.get(key);
 if(seen&&seen.source===item.image)return seen;
 const entry={source:item.image,status:'loading',url:null,aspect:null};
 cache.set(key,entry);
 if(cache.size>MAX_CACHE)cache.delete(cache.keys().next().value);
 const img=new Image();
 img.onload=()=>{
  try{
   const width=img.naturalWidth,height=img.naturalHeight;
   if(!width||!height)throw Error('Kein Bild');
   const maxScan=380,ratio=Math.min(1,maxScan/Math.max(width,height));
   const sample=document.createElement('canvas');
   sample.width=Math.max(1,Math.round(width*ratio));
   sample.height=Math.max(1,Math.round(height*ratio));
   const sc=sample.getContext('2d',{willReadFrequently:true});
   if(!sc)throw Error('Canvas nicht verfügbar');
   sc.drawImage(img,0,0,sample.width,sample.height);
   const bounds=alphaBounds(sc.getImageData(0,0,sample.width,sample.height).data,sample.width,sample.height);
   if(!bounds){entry.status='unusable';return;}
   // The crop is taken from the original full-resolution garment, not
   // from the low-resolution alpha scan.
   const scaleX=width/sample.width,scaleY=height/sample.height;
   const sourceX=Math.max(0,Math.floor(bounds.x*scaleX)-2);
   const sourceY=Math.max(0,Math.floor(bounds.y*scaleY)-2);
   const cropWidth=Math.min(width-sourceX,Math.ceil(bounds.width*scaleX)+4);
   const cropHeight=Math.min(height-sourceY,Math.ceil(bounds.height*scaleY)+4);
   const maxOutput=660;
   const outScale=Math.min(1,maxOutput/Math.max(cropWidth,cropHeight));
   const out=document.createElement('canvas');
   out.width=Math.max(1,Math.round(cropWidth*outScale));
   out.height=Math.max(1,Math.round(cropHeight*outScale));
   out.getContext('2d').drawImage(img,sourceX,sourceY,cropWidth,cropHeight,0,0,out.width,out.height);
   const latest=cache.get(key);
   if(latest!==entry||latest.source!==item.image)return;
   entry.url=out.toDataURL('image/png');
   entry.aspect=out.width/out.height;
   entry.status='ready';
   if(chosen[category]===item.id&&view==='styled'&&avatarRenderMode==='silhouette')
    window.renderAvatarV2?.();
  }catch(err){
   entry.status='unusable';
   console.warn('Avatar Original-Schnitt: unbrauchbares Cutout, Illustration als Ersatz',err);
  }
 };
 img.onerror=()=>{entry.status='unusable';};
 img.src=item.image;
 return entry;
}

/* V4-only anatomy pass. Attach natural shoulder-to-forearm contours and
   separate visible fingers underneath real garment sleeves, not capsule hands.
   The original V3 arm paths are untouched and restored when switching modes. */
const portraitIds=['personaHead','personaHairShort','personaHairCurly','personaHairBuzz','personaBeardFull','personaBeardStubble','personaGlasses'];
function ensureAnatomy(person){
 const upper=person.querySelector('#personaUpperBody');
 if(!upper)return null;
 let group=upper.querySelector('#personaAnatomyV4');
 if(group)return group;
 group=document.createElementNS(svgNS,'g');
 group.setAttribute('id','personaAnatomyV4');
 const path=(d,fill,extra={})=>{
  const p=document.createElementNS(svgNS,'path');
  p.setAttribute('d',d);p.setAttribute('fill',fill);
  for(const [key,value] of Object.entries(extra))p.setAttribute(key,value);
  group.append(p);return p;
 };
 const leftHand='M39 116 C34 121 30 129 30 139 C30 153 26 165 25 177 L22 197 '+
 'C21 204 19 214 22 219 Q24 222 27 219 L29 208 Q30 205 31 210 '+
 'L31 222 Q34 226 36 220 L37 209 Q38 206 39 211 L39 218 '+
 'Q42 220 44 216 L47 199 Q50 184 49 172 L54 143 L52 124Z';
 const arm=path(leftHand,'url(#personaSkin)',{'stroke':'var(--persona-shade)','stroke-opacity':'.43','stroke-width':'1.05','stroke-linejoin':'round'});
 arm.setAttribute('id','v4-arm-left');
 const right=path(leftHand,'url(#personaSkin)',{'stroke':'var(--persona-shade)','stroke-opacity':'.43','stroke-width':'1.05','stroke-linejoin':'round'});
 right.setAttribute('id','v4-arm-right');
 right.setAttribute('transform','translate(180 0) scale(-1 1)');
 const crease='M25 177 Q31 183 42 177 M28 201 Q34 198 41 200 M29 215 L30 219 M36 216 L35 221';
 const leftCrease=path(crease,'none',{'stroke':'var(--persona-shade)','stroke-opacity':'.28','stroke-width':'1.1','stroke-linecap':'round'});
 leftCrease.setAttribute('id','v4-creases-left');
 const rightCrease=path(crease,'none',{'stroke':'var(--persona-shade)','stroke-opacity':'.28','stroke-width':'1.1','stroke-linecap':'round'});
 rightCrease.setAttribute('id','v4-creases-right');
 rightCrease.setAttribute('transform','translate(180 0) scale(-1 1)');
 upper.insertBefore(group,upper.firstChild);
 return group;
}
function applyNaturalAnatomy(enabled,person){
 const legacy=person.querySelector('#personaArms'),anatomy=ensureAnatomy(person);
 if(legacy)legacy.style.display=enabled?'none':'';
 if(anatomy)anatomy.style.display=enabled?'':'none';
 const portraitScale='translate(90 50) scale(.94 .94) translate(-90 -50)';
 for(const id of portraitIds){
  const element=person.querySelector('#'+id);
  if(!element)continue;
  if(!element.dataset.v4OldTransform)
   element.dataset.v4OldTransform=element.getAttribute('transform')||'__none__';
  if(enabled)element.setAttribute('transform',portraitScale);
  else{
   const original=element.dataset.v4OldTransform;
   if(original==='__none__')element.removeAttribute('transform');
   else element.setAttribute('transform',original);
  }
 }
}
function setNaturalAvatarGeometryV4(enabled){
 const figure=document.getElementById('figure');
 const person=figure?.querySelector('#personaDrawing');
 const lower=person?.querySelector('#personaLowerBody');
 if(person)applyNaturalAnatomy(enabled,person);
 const garments=document.getElementById('avatarV2Garments');
 if(!figure||!person||!lower||!garments)return;
 // The previous 365 px avatar had disproportionately short legs. In the
 // natural-cutout mode the lower body is 1.5x longer, while the face and
 // entire upper body keep their original dimensions.
 const build=avatarProfile?.build||'athletic';
 const widthScale={lean:.94,athletic:1,broad:1.085}[build]||1;
 const horizontal='translate(90 0) scale('+widthScale+' 1) translate(-90 0)';
 lower.setAttribute('transform',enabled?horizontal+' translate(0 -104) scale(1 1.5)':horizontal);
 const height=enabled?450:365;
 const box='0 0 180 '+height;
 person.setAttribute('viewBox',box);person.setAttribute('height',height);
 garments.setAttribute('viewBox',box);garments.setAttribute('height',height);
 figure.classList.toggle('avatar-v4-tall',enabled);
 const stage=document.getElementById('stage');if(stage)stage.style.minHeight=enabled?'490px':'';
}
function renderNaturalCutoutV4(item,category,svg){
 if(avatarRenderMode!=='silhouette')return false;
 const entry=analyze(item,category),shape=shapeAnchors[category];
 if(!entry||entry.status!=='ready'||!entry.url||!shape)return false;
 // Uniform scaling: garment aspect ratio and precise outline remain intact.
 // Unlike the V3 renderer, there is no body/leg/sleeve texture stretching.
 const aspect=entry.aspect;
 let width=Math.min(shape.maxWidth,shape.maxHeight*aspect);
 let height=width/aspect;
 if(height>shape.maxHeight){height=shape.maxHeight;width=height*aspect;}
 const x=shape.centerX-width/2;
 const y=shape.endY!=null?shape.endY-height:shape.startY;
 if(!Number.isFinite(x+y+width+height)||width<2||height<2)return false;
 const group=document.createElementNS(svgNS,'g');
 group.setAttribute('data-avatar-slot',category);
 group.setAttribute('data-renderer','original-silhouette-v4');
 const image=document.createElementNS(svgNS,'image');
 image.setAttribute('x',x.toFixed(2));image.setAttribute('y',y.toFixed(2));
 image.setAttribute('width',width.toFixed(2));image.setAttribute('height',height.toFixed(2));
 image.setAttribute('href',entry.url);
 image.setAttribute('preserveAspectRatio','xMidYMid meet');
 image.setAttribute('aria-hidden','true');
 group.append(image);svg.append(group);
 return true;
}
window.setNaturalAvatarGeometryV4=setNaturalAvatarGeometryV4;
window.renderNaturalCutoutV4=renderNaturalCutoutV4;
window.__vithuNaturalV4Test={alphaBounds,cache,shapeAnchors};
window.renderAvatarV2?.();
})();
