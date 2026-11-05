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
 bottom:{centerX:90,startY:207,maxWidth:110,maxHeight:132},
 shoes:{centerX:90,endY:358,maxWidth:146,maxHeight:45}
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
window.renderNaturalCutoutV4=renderNaturalCutoutV4;
window.__vithuNaturalV4Test={alphaBounds,cache,shapeAnchors};
window.renderAvatarV2?.();
})();
