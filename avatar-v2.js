/* VITHU AVATAR V2: browser-local vector clothing templates with per-item colour sampling.
   2D illustration only. No photos or pixels leave this browser. */
(function(){
'use strict';
const figure=document.getElementById('figure');
const picker=document.getElementById('v2OutfitPicker');
const modeSelect=document.getElementById('avatarRenderMode');
if(!figure||!picker||!modeSelect)return;
const NS='http://www.w3.org/2000/svg';
const svg=document.createElementNS(NS,'svg');
svg.setAttribute('id','avatarV2Garments');
svg.setAttribute('viewBox','0 0 180 365');
svg.setAttribute('width','180');
svg.setAttribute('height','365');
svg.setAttribute('aria-label','Stilisierte Kleidung auf dem Avatar');
figure.append(svg);
const FALLBACK={top:'#282a2d',bottom:'#777c83',shoes:'#e5e3dc',outerwear:'#586675'};
const cache=new Map(), textureCache=new Map(), activeTexturePatterns=new Map();
const clamp=(n,a,b)=>Math.min(b,Math.max(a,n));
const safeHex=(value,alternative)=>/^#[0-9a-f]{6}$/i.test(value||'')?value:alternative;
const hexRgb=(hex)=>[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16));
const rgbHex=(r,g,b)=>'#'+[r,g,b].map(n=>clamp(Math.round(n),0,255).toString(16).padStart(2,'0')).join('');
function tint(hex,scale){
 const [r,g,b]=hexRgb(hex);
 return rgbHex(r*scale+(scale>1?(scale-1)*13:0),g*scale+(scale>1?(scale-1)*13:0),b*scale+(scale>1?(scale-1)*13:0));
}
function element(tag,attrs={},parent=svg){
 const e=document.createElementNS(NS,tag);
 for(const [k,v] of Object.entries(attrs))e.setAttribute(k,String(v));
 parent.append(e);return e;
}
function path(parent,d,fill,stroke='#1a2027',strokeWidth=1.3){
 return element('path',{d,fill,stroke,'stroke-width':strokeWidth,'stroke-linejoin':'round','stroke-linecap':'round'},parent);
}
function accent(parent,d,stroke,opacity=.33,width=1.2){const el=path(parent,d,'none',stroke,width);el.setAttribute('stroke-opacity',opacity);return el;}
function gradient(category,base){
 const id='avatar-v2-grad-'+category;
 const defs=svg.querySelector('defs')||element('defs');
 const grad=element('linearGradient',{id,x1:'0%',x2:'100%',y1:'30%',y2:'60%'},defs);
 element('stop',{offset:'0%','stop-color':tint(base,1.19)},grad);
 element('stop',{offset:'46%','stop-color':base},grad);
 element('stop',{offset:'100%','stop-color':tint(base,.79)},grad);
 return 'url(#'+id+')';
}
function determineSubtype(item,cat){
 const user=String(item.avatarSubtype||'').toLowerCase();
 const allowed={top:['tee','fitted','oversized','hoodie'],bottom:['slim','straight','wide'],shoes:['sneaker','chunky','boot'],outerwear:['jacket','hoodie']};
 if(allowed[cat]&&allowed[cat].includes(user))return user;
 const n=(item.name||'').toLowerCase();
 if(cat==='top'){
  if(/hoodie|sweat|kapuzen/.test(n))return 'hoodie';
  if(/oversized|oversize|boxy|loose/.test(n))return 'oversized';
  if(/slim|fitted|eng|muscle/.test(n))return 'fitted';
  return 'tee';
 }
 if(cat==='bottom'){
  if(/wide|baggy|loose|relaxed/.test(n))return 'wide';
  if(/straight|regular/.test(n))return 'straight';
  return 'slim';
 }
 if(cat==='shoes')return /chunky|dad shoe|platform/.test(n)?'chunky':/boot|stiefel/.test(n)?'boot':'sneaker';
 if(cat==='outerwear')return /hoodie|sweat/.test(n)?'hoodie':'jacket';
 return 'tee';
}
function sampleOpaqueColor(data,w,h){
 if(!data||!w||!h)return null;
 const bins=new Map();
 let opaque=0;
 const at=(x,y)=>{const p=(y*w+x)*4;return [data[p],data[p+1],data[p+2]]};
 const corners=[at(0,0),at(w-1,0),at(0,h-1),at(w-1,h-1)];
 const bg=corners.map((_,i)=>corners[i]).reduce((s,c)=>s.map((n,j)=>n+c[j]),[0,0,0]).map(v=>v/4);
 for(let y=0;y<h;y+=2)for(let x=0;x<w;x+=2){if(data[(y*w+x)*4+3]>170)opaque++;}
 const avoidBackground=opaque>=(w*h/4)*.88;
 for(let y=0;y<h;y+=2)for(let x=0;x<w;x+=2){
  const p=(y*w+x)*4,alpha=data[p+3];
  if(alpha<160)continue;
  const r=data[p],g=data[p+1],b=data[p+2];
  if(avoidBackground&&Math.hypot(r-bg[0],g-bg[1],b-bg[2])<28)continue;
  const key=[r,g,b].map(v=>Math.floor(v/20)).join(',');
  const row=bins.get(key)||{n:0,r:0,g:0,b:0};
  row.n++;row.r+=r;row.g+=g;row.b+=b;bins.set(key,row);
 }
 const winners=[...bins.values()].sort((a,b)=>b.n-a.n);
 if(!winners.length)return null;
 // Combine neighbouring dominant fabric colours; never inspect personal photos.
 const top=winners[0];
 return rgbHex(top.r/top.n,top.g/top.n,top.b/top.n);
}
function garmentColor(item,cat){
 const cached=cache.get(item.id);
 if(cached&&cached.source===item.image)return cached.color||FALLBACK[cat];
 const fallback=FALLBACK[cat];
 if(!/^data:image\/(?:png|jpeg|jpg|webp);base64,/.test(item.image||''))return fallback;
 cache.set(item.id,{source:item.image,color:fallback,pending:true});
 const image=new Image();
 image.onload=()=>{
  try{
   if(!image.naturalWidth||!image.naturalHeight)return;
   const canvas=document.createElement('canvas');
   const ratio=Math.min(1,112/Math.max(image.naturalWidth,image.naturalHeight));
   canvas.width=Math.max(1,Math.round(image.naturalWidth*ratio));
   canvas.height=Math.max(1,Math.round(image.naturalHeight*ratio));
   const ctx=canvas.getContext('2d',{willReadFrequently:true});
   if(!ctx)return;
   ctx.drawImage(image,0,0,canvas.width,canvas.height);
   const color=sampleOpaqueColor(ctx.getImageData(0,0,canvas.width,canvas.height).data,canvas.width,canvas.height);
   const record=cache.get(item.id);
   if(!record||record.source!==item.image)return;
   cache.set(item.id,{source:item.image,color:safeHex(color,fallback)});
   drawAvatarV2();
  }catch(e){console.warn('V2 garment color extraction unavailable',e);}
 };
 image.onerror=()=>cache.set(item.id,{source:item.image,color:fallback});
 image.src=item.image;
 return fallback;
}

/* Per-zone texture pipeline: analyse only the saved transparent garment image.
   No user-photo uploads, no third-party API, no mutations of the original PNG.
   Each body part uses an independent crop and an independent SVG clip silhouette. */
const regionDefs={
 top:{body:[.16,.12,.68,.85],leftSleeve:[.01,.17,.33,.39],rightSleeve:[.66,.17,.33,.39]},
 outerwear:{body:[.17,.12,.66,.87],leftSleeve:[0,.20,.30,.62],rightSleeve:[.70,.20,.30,.62]},
 bottom:{waist:[.04,.015,.92,.28],leftLeg:[.02,.25,.48,.74],rightLeg:[.50,.25,.48,.74]},
 shoes:{leftShoe:[.01,.03,.48,.94],rightShoe:[.51,.03,.48,.94]}
};
function detectAlphaBounds(pixels,w,h){
 if(!pixels||!w||!h)return null;
 let minX=w,minY=h,maxX=-1,maxY=-1,n=0;
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  if(pixels[(y*w+x)*4+3]<70)continue;
  n++;if(x<minX)minX=x;if(x>maxX)maxX=x;
  if(y<minY)minY=y;if(y>maxY)maxY=y;
 }
 if(n<10||n/(w*h)>.965||maxX<minX||maxY<minY)return null;
 return {x:minX,y:minY,w:maxX-minX+1,h:maxY-minY+1};
}
function cropRegion(scan,bounds,region){
 const [rx,ry,rw,rh]=region;
 const left=Math.max(0,Math.floor(bounds.x+bounds.w*rx)),
       top=Math.max(0,Math.floor(bounds.y+bounds.h*ry));
 const width=Math.min(scan.width-left,Math.max(1,Math.round(bounds.w*rw))),
       height=Math.min(scan.height-top,Math.max(1,Math.round(bounds.h*rh)));
 if(width<=0||height<=0)return null;
 const out=document.createElement('canvas');
 out.width=112;out.height=152;
 const ctx=out.getContext('2d');if(!ctx)return null;
 ctx.filter='saturate(.93) contrast(1.10)';
 ctx.drawImage(scan,left,top,width,height,0,0,out.width,out.height);
 return out.toDataURL('image/png');
}
function texturePattern(item,cat){
 const source=item.image||'';
 const key=cat+':'+item.id;
 const existing=textureCache.get(key);
 if(existing&&existing.source===source){
  if(existing.zones)activeTexturePatterns.set(cat,existing.zones);
  return;
 }
 if(!/^data:image\/(?:png|jpeg|jpg|webp);base64,/.test(source))return;
 const record={source,zones:null,pending:true};
 textureCache.set(key,record);
 if(textureCache.size>24)textureCache.delete(textureCache.keys().next().value);
 const image=new Image();
 image.onload=()=>{
  try{
   if(!image.naturalWidth||!image.naturalHeight)return;
   const scan=document.createElement('canvas');
   const factor=Math.min(1,380/Math.max(image.naturalWidth,image.naturalHeight));
   scan.width=Math.max(1,Math.round(image.naturalWidth*factor));
   scan.height=Math.max(1,Math.round(image.naturalHeight*factor));
   const ctx=scan.getContext('2d',{willReadFrequently:true});if(!ctx)return;
   ctx.drawImage(image,0,0,scan.width,scan.height);
   const bounds=detectAlphaBounds(ctx.getImageData(0,0,scan.width,scan.height).data,scan.width,scan.height);
   if(!bounds)return;
   const zones={};
   for(const [name,region] of Object.entries(regionDefs[cat]||{})){
    const texture=cropRegion(scan,bounds,region);
    if(texture)zones[name]=texture;
   }
   const current=textureCache.get(key);
   if(!current||current.source!==source)return;
   current.zones=zones;current.pending=false;
   drawAvatarV2();
  }catch(e){console.warn('Local split texture unavailable, using colour fallback',e);}
 };
 image.onerror=()=>{const current=textureCache.get(key);if(current&&current.source===source)current.pending=false;};
 image.src=source;
}
function panel(parent,cat,part,d,base,rect,opacity=.86,stroke='#1a2027'){
 const solid=base==='none'?null:path(parent,d,base,stroke);
 if(opacity<=0)return solid;
 const zones=activeTexturePatterns.get(cat);
 const uri=zones&&zones[part];
 if(!uri)return solid;
 const id='avatar-vnext-'+cat+'-'+part;
 const defs=svg.querySelector('defs')||element('defs');
 const pattern=element('pattern',{id,x:0,y:0,width:180,height:365,patternUnits:'userSpaceOnUse'},defs);
 element('image',{x:rect[0],y:rect[1],width:rect[2],height:rect[3],href:uri,preserveAspectRatio:'none'},pattern);
 element('path',{d,fill:'url(#'+id+')','fill-opacity':opacity,stroke:'none'},parent);
 return solid;
}
function fitSettings(item){
 const fit=item.avatarFitV2&&typeof item.avatarFitV2==='object'?item.avatarFitV2:{};
 const length=['short','regular','long'].includes(fit.length)?fit.length:'regular';
 const details=['auto','smooth','detailed'].includes(fit.details)?fit.details:'auto';
 return {length,details};
}
function fabricOpacity(item,cat){
 const details=fitSettings(item).details;
 return details==='smooth'?0:details==='detailed'?1:cat==='shoes'?.9:.84;
}
function topTemplate(item,cat){
 const sub=determineSubtype(item,cat),base=garmentColor(item,cat),fabric=gradient(cat,base),opacity=fabricOpacity(item,cat);
 texturePattern(item,cat);
 const group=element('g',{'data-avatar-slot':cat});
 const build=avatarProfile&&avatarProfile.build||'athletic';
 const adaptive=window.__wardrobeRigV3?.active===true;
 const factor=adaptive?{lean:.88,athletic:1,broad:1.12}[build]:{lean:.91,athletic:1,broad:1.09}[build];
 const scale=(factor||1)*(adaptive?window.__wardrobeRigV3.topScale:1);
 group.setAttribute('transform','translate(90 0) scale('+scale+' 1) translate(-90 0)');
 if(cat==='outerwear'||sub==='hoodie'){
  const hoodie=sub==='hoodie';
  if(hoodie){
   path(group,'M73 79 Q90 60 108 79 L121 96 L104 111 L76 111 L59 96Z',tint(base,.79));
   accent(group,'M77 92 Q90 109 104 92',tint(base,1.54),.34,2);
  }
  panel(group,cat,'leftSleeve','M66 81 L44 88 Q30 95 27 109 L19 186 L36 193 L48 131 L60 104Z',tint(base,.90),[18,84,44,115],opacity);
  panel(group,cat,'rightSleeve','M114 81 L136 88 Q151 95 154 109 L161 186 L144 193 L132 131 L120 104Z',tint(base,.90),[119,84,44,115],opacity);
  if(hoodie){
   panel(group,cat,'body','M66 82 L76 98 Q90 106 104 98 L114 82 L132 98 L133 211 Q90 220 47 211 L48 98Z',fabric,[46,83,89,137],opacity);
   accent(group,'M73 184 Q90 180 107 184 L109 204 L71 204Z',tint(base,1.45),.38);
  }else{
   panel(group,cat,'body','M66 82 L77 97 L87 117 L82 213 L47 213 L48 99Z',fabric,[46,82,43,134],opacity);
   panel(group,cat,'body','M114 82 L103 97 L93 117 L98 213 L133 213 L132 99Z',fabric,[91,82,43,134],opacity);
   accent(group,'M89 116 L89 210 M100 115 L99 210',tint(base,1.5),.6,1.8);
  }
  accent(group,'M27 182 L36 183 M144 183 L153 182 M49 207 L78 207 M102 207 L132 207',tint(base,1.5),.43);
  return;
 }
 const oversized=sub==='oversized',fitted=sub==='fitted';
 const length=fitSettings(item).length, bottomY=length==='short'?194:length==='long'?219:209;
 const left=oversized?'M66 82 L37 87 L19 106 L34 139 L50 132 L60 101Z':
   fitted?'M66 82 L47 87 L31 105 L42 129 L52 123 L58 98Z':
   'M66 82 L44 87 L26 106 L38 133 L49 126 L58 98Z';
 const right=oversized?'M114 82 L143 87 L161 106 L146 139 L130 132 L120 101Z':
   fitted?'M114 82 L133 87 L149 105 L138 129 L128 123 L122 98Z':
   'M114 82 L136 87 L154 106 L142 133 L131 126 L122 98Z';
 const body=oversized?'M66 82 Q77 96 90 98 Q103 96 114 82 L136 95 L137 '+bottomY+' Q90 '+(bottomY+8)+' 43 '+bottomY+' L44 95Z':
   fitted?'M66 82 Q76 95 90 97 Q104 95 114 82 L128 95 Q124 143 131 '+bottomY+' Q90 '+(bottomY+6)+' 49 '+bottomY+' Q56 148 52 95Z':
   'M66 82 Q77 95 90 97 Q103 95 114 82 L131 95 L132 '+bottomY+' Q90 '+(bottomY+7)+' 48 '+bottomY+' L49 95Z';
 panel(group,cat,'leftSleeve',left,tint(base,.91),[18,82,48,60],opacity);
 panel(group,cat,'rightSleeve',right,tint(base,.92),[114,82,49,60],opacity);
 panel(group,cat,'body',body,fabric,[43,82,94,bottomY-79],opacity);
 // Use the actual chest pixels only once. A second logo crop created duplicate prints.
 accent(group,'M75 85 Q90 104 105 85',tint(base,.6),.64,2.5);
 accent(group,'M50 '+(bottomY-3)+' Q90 '+(bottomY+4)+' 130 '+(bottomY-3),tint(base,1.6),.44,1.6);
 accent(group,'M39 128 L48 124 M132 124 L141 128',tint(base,1.55),.36);
}
function pantsTemplate(item){
 const cat='bottom',sub=determineSubtype(item,cat),base=garmentColor(item,cat),fabric=gradient(cat,base),opacity=fabricOpacity(item,cat);
 texturePattern(item,cat);
 const group=element('g',{'data-avatar-slot':cat});
 const build=avatarProfile&&avatarProfile.build||'athletic';
 const adaptive=window.__wardrobeRigV3?.active===true;
 const factor=adaptive?{lean:.94,athletic:1,broad:1.085}[build]:{lean:.93,athletic:1,broad:1.065}[build];
 const scale=(factor||1)*(adaptive?window.__wardrobeRigV3.bottomScale:1);
 group.setAttribute('transform','translate(90 0) scale('+scale+' 1) translate(-90 0)');
 const slim=sub==='slim',wide=sub==='wide';
 const leftStart=wide?46:slim?55:51,leftEnd=wide?92:slim?86:89;
 const rightStart=wide?90:slim?96:92,rightEnd=wide?135:slim?123:129;
 const length=fitSettings(item).length,cuffY=length==='short'?325:length==='long'?341:335;
 const leftD='M50 219 L89 219 Q93 242 89 268 L'+leftEnd+' '+cuffY+' Q'+(leftStart+leftEnd)/2+' '+(cuffY+4)+' '+leftStart+' '+cuffY+' L'+(leftStart-4)+' 278 Q48 243 50 219Z';
 const rightD='M92 219 L129 219 Q132 247 '+(rightEnd+1)+' 285 L'+rightEnd+' '+cuffY+' Q'+(rightStart+rightEnd)/2+' '+(cuffY+4)+' '+rightStart+' '+cuffY+' L93 264 Q89 240 92 219Z';
 // Draw fabric at the waist first. Legs gradually blend into it rather than
 // creating two horizontal rectangles with full black borders at hip level.
 panel(group,cat,'waist','M51 206 Q90 212 129 206 L131 238 Q113 232 93 235 L90 250 L87 235 Q67 232 49 238Z',fabric,[49,205,83,46],opacity,'none');
 const defs=svg.querySelector('defs')||element('defs');
 const fade=element('linearGradient',{id:'vnext-leg-join',gradientUnits:'userSpaceOnUse',x1:0,y1:218,x2:0,y2:236},defs);
 element('stop',{offset:'0%','stop-color':'black'},fade);
 element('stop',{offset:'100%','stop-color':'white'},fade);
 const mask=element('mask',{id:'vnext-leg-mask',maskUnits:'userSpaceOnUse',x:0,y:0,width:180,height:365},defs);
 element('rect',{x:0,y:0,width:180,height:365,fill:'url(#vnext-leg-join)'},mask);
 const legs=element('g',{mask:'url(#vnext-leg-mask)'},group);
 panel(legs,cat,'leftLeg',leftD,fabric,[leftStart-6,219,leftEnd-leftStart+14,cuffY-216],opacity,'none');
 panel(legs,cat,'rightLeg',rightD,fabric,[rightStart-7,219,rightEnd-rightStart+15,cuffY-216],opacity,'none');
 // Exterior contours only; do not outline each overlapping garment panel.
 accent(group,'M51 208 Q90 213 129 208',tint(base,.62),.49,1.2);
 accent(group,'M51 219 Q47 260 '+(leftStart-4)+' 285 L'+leftStart+' '+cuffY+' Q'+(leftStart+leftEnd)/2+' '+(cuffY+3)+' '+leftEnd+' '+cuffY+' L89 268',tint(base,.62),.70,1.2);
 accent(group,'M92 268 L'+rightStart+' '+cuffY+' Q'+(rightStart+rightEnd)/2+' '+(cuffY+3)+' '+rightEnd+' '+cuffY+' Q132 254 129 219',tint(base,.62),.70,1.2);
 accent(group,'M89 224 L89 248 M58 223 Q70 226 81 222 M99 222 Q112 226 122 223',tint(base,.54),.26,1.1);
 accent(group,'M'+leftStart+' '+(cuffY-2)+' L'+leftEnd+' '+(cuffY-2)+' M'+rightStart+' '+(cuffY-2)+' L'+rightEnd+' '+(cuffY-2),tint(base,1.48),.39,1.4);
}
function shoesTemplate(item){
 const cat='shoes',base=garmentColor(item,cat),fabric=gradient(cat,base),sub=determineSubtype(item,cat),opacity=fabricOpacity(item,cat);
 texturePattern(item,cat);
 const group=element('g',{'data-avatar-slot':cat});
 const rig=window.__wardrobeRigV3;
 if(rig?.active){
  const build=avatarProfile?.build||'athletic';
  const factor={lean:.94,athletic:1,broad:1.085}[build]||1;
  group.setAttribute('transform','translate(90 0) scale('+(factor*rig.shoeScale)+' 1) translate(-90 0)');
 }
 const boot=sub==='boot',chunky=sub==='chunky';
 const left=boot?'M57 316 L84 316 L90 344 Q96 357 82 359 L36 359 Q29 353 40 345 L55 336Z':
 chunky?'M60 327 Q73 330 85 326 L92 342 Q107 347 101 355 Q98 361 86 360 L34 360 Q25 355 35 347 L56 337Z':
 'M60 327 Q72 330 85 327 L90 343 Q104 348 99 354 Q97 358 88 358 L34 358 Q26 354 36 347 L56 337Z';
 const right=boot?'M99 316 L124 316 L129 338 Q151 345 153 354 Q153 360 143 359 L99 359 Q93 354 99 316Z':
 chunky?'M100 326 Q112 329 125 326 L133 338 Q158 347 157 355 Q155 361 145 360 L100 360 Q91 357 100 326Z':
 'M100 327 Q113 332 125 328 L131 340 Q154 347 155 353 Q155 358 148 358 L100 358 Q93 354 100 327Z';
 panel(group,cat,'leftShoe',left,fabric,[33,325,69,35],opacity);
 panel(group,cat,'rightShoe',right,fabric,[98,324,60,36],opacity);
 accent(group,'M34 355 L99 355 M100 355 L154 355',tint(base,.55),.7,2.1);
 accent(group,'M60 338 L82 338 M59 342 L84 342 M105 338 L124 338 M105 342 L128 342',tint(base,.6),.55,1.35);
 // Distinct rubber outsole, sidewall and toe transitions reinforce the two
 // shoes as objects rather than flat white SVG silhouettes.
 path(group,'M34 351 Q60 354 98 351 L99 357 Q64 360 34 358Z',tint(base,.79),'none');
 path(group,'M101 352 Q126 355 154 351 L155 357 Q126 360 101 358Z',tint(base,.78),'none');
 accent(group,'M45 348 Q63 343 88 349 M108 348 Q129 344 147 351',tint(base,.62),.39,1.3);
 accent(group,'M61 336 Q68 339 82 336 M108 337 Q117 340 125 337',tint(base,.61),.53,1.4);
 accent(group,'M38 355 Q68 357 96 355 M103 355 Q129 357 153 355',tint(base,1.57),.60,1.4);
}
function refreshGarmentSubtype(){
 const categoryInput=document.getElementById('invEditCategory');
 const dropdown=document.getElementById('invEditSubtype');
 const wrapper=document.getElementById('invEditSubtypeWrap');
 if(!categoryInput||!dropdown||!wrapper)return;
 const cat=categoryInput.value;
 const variants={
  top:[['tee','T-Shirt / Regular'],['fitted','Slim / Fitted'],['oversized','Oversized'],['hoodie','Hoodie']],
  bottom:[['slim','Slim Fit'],['straight','Straight'],['wide','Wide / Baggy']],
  shoes:[['sneaker','Sneaker'],['chunky','Chunky'],['boot','Boot']],
  outerwear:[['jacket','Jacke'],['hoodie','Hoodie']]
 };
 const group=variants[cat]||[];
 dropdown.replaceChildren();
 const auto=document.createElement('option');auto.value='';auto.textContent='Automatisch';dropdown.append(auto);
 for(const [id,label] of group){const opt=document.createElement('option');opt.value=id;opt.textContent=label;dropdown.append(opt);}
 wrapper.hidden=!group.length;
 const tuning=document.getElementById('invAvatarTuning');if(tuning)tuning.hidden=!group.length;
 const item=items.find(it=>it.id===inventoryEditId);
 dropdown.value=group.some(([id])=>id===item?.avatarSubtype)?item.avatarSubtype:'';
}
window.refreshGarmentSubtype=refreshGarmentSubtype;
/* Outfit Studio: one-tap garment cards and a shuffler inspired by the fast look
   browsing workflow, not a copy of another app's art or UI. */
function availableGarments(cat){return items.filter(it=>it.category===cat&&it.image);}
function cycleOutfit(cat,step=1){
 const available=availableGarments(cat), ids=['',...available.map(it=>it.id)];
 if(ids.length<2)return;
 const current=ids.indexOf(chosen[cat]||''),index=(current+step+ids.length)%ids.length;
 choose(cat,ids[index]).catch(e=>console.error('Switch outfit garment failed',e));
}
async function shuffleOutfit(){
 const updates={};let changed=false;
 for(const cat of ['top','bottom','shoes','outerwear']){
  const available=availableGarments(cat);if(!available.length)continue;
  const options=available.map(it=>it.id);
  if(cat==='outerwear')options.unshift('');
  const others=options.filter(x=>x!==(chosen[cat]||''));
  if(!others.length)continue;
  const next=others[Math.floor(Math.random()*others.length)];
  updates[cat]=next;
  if(next!==(chosen[cat]||''))changed=true;
 }
 if(!changed)return toast('Für neue Kombinationen weitere Teile hinzufügen');
 for(const [cat,id] of Object.entries(updates)){
  if(!id)delete chosen[cat];
  else {chosen[cat]=id;await ensureDefaultFit(cat,id);}
 }
 try{await persist();render();toast('Neuer Look aus deiner Garderobe');}
 catch(e){console.error('Shuffle outfit failed',e);}
}
window.shuffleAvatarOutfit=shuffleOutfit;
function quickPicker(){
 picker.replaceChildren();
 const head=document.createElement('div');head.className='v3-studio-head';
 const titles=document.createElement('div');
 const overline=document.createElement('span');overline.className='v3-studio-kicker';overline.textContent='DEIN LOOK';
 const caption=document.createElement('p');caption.className='v3-studio-caption';caption.textContent='Teil antippen und wechseln';
 titles.append(overline,caption);
 const actions=document.createElement('div');actions.className='v3-studio-actions';
 const shuffle=document.createElement('button');shuffle.type='button';shuffle.className='secondary v3-shuffle';
 shuffle.textContent='⤨ Mixen';shuffle.setAttribute('aria-label','Neuen Look aus meiner Kleidung kombinieren');
 shuffle.onclick=()=>shuffleOutfit();
 const canMix=['top','bottom','shoes'].some(cat=>availableGarments(cat).length>1)||availableGarments('outerwear').length>0;
 shuffle.disabled=!canMix;
 shuffle.title=canMix?'Neue Kombination aus deiner Garderobe':'Für neue Kombinationen mindestens zwei Teile einer Kategorie speichern';
 const save=document.createElement('button');save.type='button';save.className='secondary v3-save';
 save.textContent='♡ Sichern';save.setAttribute('aria-label','Aktuelles Outfit speichern');
 save.onclick=()=>saveOutfit();
 actions.append(shuffle,save);head.append(titles,actions);picker.append(head);
 const content=document.createElement('div');content.className='v3-garment-grid';
 let availableSlots=0;
 for(const [cat,label] of [['top','Oberteil'],['bottom','Hose'],['shoes','Schuhe'],['outerwear','Jacke']]){
  const available=availableGarments(cat);
  if(!available.length&&!chosen[cat])continue;
  availableSlots++;
  const selected=available.find(it=>it.id===chosen[cat]);
  const card=document.createElement('button');card.type='button';card.className='v3-garment-card';
  card.dataset.category=cat;
  const thumb=document.createElement('span');thumb.className='v3-garment-thumb';
  if(selected){
   const img=document.createElement('img');img.src=selected.shopImage&&selected.showShop?selected.shopImage:selected.image;
   img.alt='';img.loading='lazy';thumb.append(img);
  }else{
   const icon=document.createElement('span');icon.className='v3-empty-icon';icon.textContent=({top:'♟',bottom:'▥',shoes:'◡',outerwear:'▣'})[cat]||'◇';thumb.append(icon);
  }
  const info=document.createElement('span');info.className='v3-garment-info';
  const category=document.createElement('span');category.className='v3-garment-type';category.textContent=label;
  const name=document.createElement('span');name.className='v3-garment-name';name.textContent=selected?.name||'Nichts gewählt';
  info.append(category,name);
  const change=document.createElement('span');change.className='v3-garment-next';change.textContent='↻';
  card.append(thumb,info,change);
  card.setAttribute('aria-label',label+': '+(selected?.name||'Nichts')+'. Antippen für nächstes Teil');
  card.onclick=()=>cycleOutfit(cat,1);
  content.append(card);
 }
 if(!availableSlots){
  const empty=document.createElement('p');empty.className='v3-studio-empty';
  empty.textContent='Deine Garderobe ist noch leer. Füge zuerst Kleidung hinzu.';content.append(empty);
  shuffle.disabled=true;save.disabled=true;
 }
 picker.append(content);
 picker.hidden=false;
}
function syncAvatarMode(){
 const mode=avatarRenderMode==='original'?'original':avatarRenderMode==='silhouette'?'silhouette':'stylized';
 modeSelect.value=mode;
 for(const [id,active] of [['avatarV4Natural',mode==='silhouette'],['avatarV4Illustrated',mode==='stylized']]){
  const button=document.getElementById(id);
  if(button){button.classList.toggle('active',active);button.classList.toggle('secondary',!active);}
 }
 const useStyle=view==='styled'&&mode!=='original';
 figure.classList.toggle('avatar-v2-stylized',useStyle);
 document.getElementById('avatarPanel')?.classList.toggle('v3-studio-mode',useStyle);
 const edit=document.getElementById('avatar-adjust');
 if(edit)edit.hidden=view==='photo'||useStyle;
 svg.style.display=useStyle?'':'none';
}
function drawAvatarV2(){
 svg.replaceChildren();activeTexturePatterns.clear();
 const active=c=>{const id=chosen[c];return id?items.find(it=>it.id===id&&it.category===c&&it.image):null};
 const bottom=active('bottom'),top=active('top'),shoe=active('shoes'),coat=active('outerwear');
 window.renderGarmentDrivenRig?.({top,bottom,shoes:shoe,outerwear:coat});
 // Original silhouette uses the actual local alpha cutout; a failed alpha crop
 // falls back individually to the previous stylized garment renderer.
 const natural=avatarRenderMode==='silhouette';
 const draw=(item,cat,fallback)=>{
  if(!item)return;
  if(!natural||!window.renderNaturalCutoutV4?.(item,cat,svg))fallback();
 };
 draw(bottom,'bottom',()=>pantsTemplate(bottom));
 draw(top,'top',()=>topTemplate(top,'top'));
 draw(coat,'outerwear',()=>topTemplate(coat,'outerwear'));
 draw(shoe,'shoes',()=>shoesTemplate(shoe));
 syncAvatarMode();
}
function renderAvatarV2(){
 quickPicker();drawAvatarV2();
}
function setAvatarRenderMode(value){
 if(value!=='original'&&value!=='stylized'&&value!=='silhouette')return;
 avatarRenderMode=value;
 renderAvatarV2();
 if(storageReady)persist().catch(e=>console.error('Avatar mode save failed',e));
}
window.setAvatarRenderMode=setAvatarRenderMode;
window.renderAvatarV2=renderAvatarV2;
const previousRender=render;
render=function(){const result=previousRender();renderAvatarV2();return result;};
const previousSetView=setView;
setView=function(v){const result=previousSetView(v);renderAvatarV2();return result;};
const previousProfileChange=window.updateAvatarProfile;
window.updateAvatarProfile=function(k,v){previousProfileChange?.(k,v);renderAvatarV2();};
renderAvatarV2();
})();