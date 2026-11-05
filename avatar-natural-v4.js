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
// Locate actual short-sleeve tips in the transparent garment, rather than
// estimating an arm's origin from the overall product-image rectangle.
// If a convincing bilateral inward step cannot be found, use V5's old anchor.
function detectSleeveContour(pixels,width,height){
 if(!pixels||width<42||height<45)return null;
 const edges=[];
 for(let y=0;y<height;y++){
  let left=width,right=-1,ink=0;
  for(let x=0;x<width;x++)if(pixels[(y*width+x)*4+3]>=90){
   if(x<left)left=x;if(x>right)right=x;ink++;
  }
  edges.push(ink>=Math.max(6,width*.08)?{left,right}:null);
 }
 const delta=Math.max(3,Math.round(height*.047));
 let best=null;
 for(let y=Math.round(height*.24);y<Math.round(height*.61);y++){
  const before=edges[y-delta],after=edges[y+delta];
  if(!before||!after)continue;
  const leftJump=after.left-before.left;
  const rightJump=before.right-after.right;
  const threshold=Math.max(4,width*.055);
  if(leftJump<threshold||rightJump<threshold)continue;
  // Require BOTH sleeve ends to retreat. A trouser crease or tilted edge
  // is not enough to establish a shirt sleeve.
  const score=Math.min(leftJump,rightJump)/width;
  if(!best||score>best.score)best={
   left:(before.left+after.left)/(2*width),
   right:(before.right+after.right)/(2*width),
   y:y/height,score
  };
 }
 if(!best||best.left>=.45||best.right<=.55||best.right-best.left<.40)return null;
 return best;
}

// Measure only the alpha of the user's saved, unmodified garment cutout.
// All dimensions are image-space estimates, never real-world centimetres.
function measureOriginalTopMask(pixels,width,height){
 if(!pixels||width<48||height<48||pixels.length<width*height*4)return null;
 const bounds=alphaBounds(pixels,width,height);
 if(!bounds||bounds.coverage>.95)return null;
 const left=bounds.x,top=bounds.y,right=left+bounds.width,bottom=top+bounds.height;
 const center=Math.round((left+right)*.5);
 const inside=(x,y)=>x>=0&&x<width&&y>=0&&y<height&&pixels[(y*width+x)*4+3]>=100;
 const at=(fraction)=>Math.min(height-1,Math.max(0,Math.round(top+bounds.height*fraction)));
 function torsoSpan(fraction){
  const found=[];
  for(let dy=-2;dy<=2;dy++){
   const yy=at(fraction)+dy;
   if(!inside(center,yy))continue;
   let x0=center,x1=center;
   // Include one-pixel alpha holes, but never bridge the gap to a sleeve tip.
   let gaps=0;
   for(let x=center-1;x>=left;x--){
    if(inside(x,yy)){x0=x;gaps=0;}
    else if(++gaps>2)break;
   }
   gaps=0;
   for(let x=center+1;x<right;x++){
    if(inside(x,yy)){x1=x;gaps=0;}
    else if(++gaps>2)break;
   }
   const span=x1-x0+1;
   if(span>bounds.width*.24)found.push({left:x0,right:x1,width:span});
  }
  if(found.length<2)return null;
  found.sort((a,b)=>a.width-b.width);
  return found[Math.floor(found.length/2)];
 }
 const sleeves=detectSleeveContour(pixels,width,height);
 const chest=torsoSpan(.49),waist=torsoSpan(.70),hem=torsoSpan(.90);
 const shoulder=torsoSpan(sleeves?Math.min(.54,Math.max(.41,sleeves.y+.08)):.43);
 if(!chest||!waist||!hem||!shoulder)return null;
 const centered=Math.abs((chest.left+chest.right)*.5-center)/bounds.width;
 if(centered>.13||chest.width<bounds.width*.28)return null;
 const waistRatio=waist.width/chest.width,hemRatio=hem.width/chest.width;
 if(!Number.isFinite(waistRatio+hemRatio)||waistRatio<.45||waistRatio>1.6||hemRatio<.45||hemRatio>1.7)return null;

 // Sleeves are often diagonal: approximate their width by vertical alpha
 // thickness in the sleeve region, rather than the image's full bounding box.
 function sleeveThickness(x){
  if(!Number.isFinite(x))return null;
  const xx=Math.max(0,Math.min(width-1,Math.round(x)));
  let min=height,max=-1,count=0;
  for(let y=top;y<bottom;y++)if(inside(xx,y)){
   if(y<min)min=y;if(y>max)max=y;count++;
  }
  return count>=4&&max>=min?max-min+1:null;
 }
 let sleeveUpper=null,sleeveLower=null,sleeveLength=null;
 if(sleeves){
  const sleeveTip=sleeves.left*width;
  const upperX=sleeveTip*.25+shoulder.left*.75;
  const lowerX=sleeveTip*.70+shoulder.left*.30;
  sleeveUpper=sleeveThickness(upperX);
  sleeveLower=sleeveThickness(lowerX);
  sleeveLength=Math.max(0,(sleeves.y*height-(top+bounds.height*.12)));
 }
 // Detect a collar dip near the middle of the top edge, if visible.
 function firstOpaqueY(x){
  for(let y=top;y<Math.min(bottom,top+bounds.height*.32);y++)if(inside(x,y))return y;
  return null;
 }
 const neckLeft=firstOpaqueY(Math.round(left+bounds.width*.39));
 const neckRight=firstOpaqueY(Math.round(left+bounds.width*.61));
 const neckCenter=firstOpaqueY(center);
 let neckline=null;
 if(neckLeft!==null&&neckRight!==null&&neckCenter!==null){
  const shoulderY=Math.min(neckLeft,neckRight);
  const dip=neckCenter-shoulderY;
  if(dip>bounds.height*.018&&dip<bounds.height*.25){
   let count=0;
   for(let x=Math.round(left+bounds.width*.32);x<=Math.round(left+bounds.width*.68);x++){
    const yy=firstOpaqueY(x);
    if(yy!==null&&yy>=shoulderY+dip*.55)count++;
   }
   neckline=count>=3?count:null;
  }
 }
 const straightness=waistRatio*.57+hemRatio*.43;
 const fitScore=Math.max(0,Math.min(1,(straightness-.77)/.29));
 const confidence=Math.max(0,Math.min(1,.67+(sleeves?.score>.055?.13:0)+(neckline?.06:0)-centered));
 return {
  shoulderWidth:shoulder.width,chestWidth:chest.width,
  waistWidth:waist.width,hemWidth:hem.width,
  sleeveLength,sleeveWidthUpper:sleeveUpper,sleeveWidthLower:sleeveLower,
  totalLength:bounds.height,necklineWidth:neckline,
  fitScore,fitClass:fitScore<.33?'fitted':fitScore>.72?'loose':'regular',
  confidence,aspect:bounds.width/bounds.height,
  // Keep normalised measures available for later viewport-independent mapping.
  ratios:{shoulder:shoulder.width/bounds.width,chest:chest.width/bounds.width,
   waist:waistRatio,hem:hemRatio,sleeveLength:sleeveLength===null?null:sleeveLength/bounds.height,
   sleeveUpper:sleeveUpper===null?null:sleeveUpper/bounds.height,
   sleeveLower:sleeveLower===null?null:sleeveLower/bounds.height,
   neckline:neckline===null?null:neckline/bounds.width}
 };
}

function analyze(item,category){
 if(!item||!/^data:image\/(?:png|webp|jpe?g);base64,/i.test(item.image||''))return null;
 const key=category+':'+item.id,seen=cache.get(key);
 if(seen&&seen.source===item.image)return seen;
 const entry={source:item.image,status:'loading',url:null,aspect:null,sleeves:null,maskMetrics:null};
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
   if(category==='top'){
    // This optional measurement must NEVER discard a valid clothing cutout.
    try{
     const cropPixels=out.getContext('2d',{willReadFrequently:true})?.getImageData(0,0,out.width,out.height)?.data;
     entry.sleeves=cropPixels?detectSleeveContour(cropPixels,out.width,out.height):null;
     entry.maskMetrics=cropPixels?measureOriginalTopMask(cropPixels,out.width,out.height):null;
    }catch{entry.sleeves=null;entry.maskMetrics=null;}
   }
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
function setNaturalAvatarGeometryV4(enabled){
 const figure=document.getElementById('figure');
 const person=figure?.querySelector('#personaDrawing');
 const lower=person?.querySelector('#personaLowerBody');
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
function calculateNaturalPlacementV4(category,aspect){
 const shape=shapeAnchors[category];
 if(!shape||!Number.isFinite(aspect)||aspect<=0)return null;
 let width=Math.min(shape.maxWidth,shape.maxHeight*aspect);
 let height=width/aspect;
 if(height>shape.maxHeight){height=shape.maxHeight;width=height*aspect;}
 const x=shape.centerX-width/2;
 const y=shape.endY!=null?shape.endY-height:shape.startY;
 if(!Number.isFinite(x+y+width+height)||width<2||height<2)return null;
 return {x,y,width,height};
}
function getNaturalCutoutPlacementV4(item,category){
 const entry=analyze(item,category);
 if(entry?.status!=='ready'||!entry.url)return null;
 return calculateNaturalPlacementV4(category,entry.aspect);
}
function getOriginalTopMaskMetricsV5(item){
 const entry=analyze(item,'top');
 return entry?.status==='ready'?entry.maskMetrics||null:null;
}
function getNaturalSleeveFitV4(item,category,placementOverride=null){
 if(category!=='top')return null;
 const entry=analyze(item,category);
 if(entry?.status!=='ready'||!entry.sleeves)return null;
 const place=placementOverride||calculateNaturalPlacementV4(category,entry.aspect);
 if(!place)return null;
 const {left,right,y,score}=entry.sleeves;
 return {left:place.x+place.width*left,
  right:place.x+place.width*right,
  y:place.y+place.height*y,confidence:score};
}
function renderNaturalCutoutV4(item,category,svg,placementOverride=null){
 if(avatarRenderMode!=='silhouette')return false;
 const entry=analyze(item,category),shape=shapeAnchors[category];
 if(!entry||entry.status!=='ready'||!entry.url||!shape)return false;
 // Uniform scaling: garment aspect ratio and precise outline remain intact.
 // Unlike the V3 renderer, there is no body/leg/sleeve texture stretching.
 const position=placementOverride||calculateNaturalPlacementV4(category,entry.aspect);
 if(!position)return false;
 const {x,y,width,height}=position;
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
window.getNaturalCutoutPlacementV4=getNaturalCutoutPlacementV4;
window.getNaturalSleeveFitV4=getNaturalSleeveFitV4;
window.getOriginalTopMaskMetricsV5=getOriginalTopMaskMetricsV5;
window.__vithuNaturalV4Test={alphaBounds,cache,shapeAnchors,detectSleeveContour,measureOriginalTopMask};
window.renderAvatarV2?.();
})();
