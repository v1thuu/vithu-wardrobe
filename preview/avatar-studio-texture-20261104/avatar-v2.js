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
 const base=element('path',{d,fill,stroke,'stroke-width':strokeWidth,'stroke-linejoin':'round','stroke-linecap':'round'},parent);
 const match=typeof fill==='string'&&fill.match(/^url\(#avatar-v2-grad-(top|bottom|shoes|outerwear)\)$/);
 if(match&&activeTexturePatterns.has(match[1])){
  const pattern=activeTexturePatterns.get(match[1]);
  element('path',{d,fill:'url(#'+pattern.id+')','fill-opacity':pattern.opacity,stroke:'none'},parent);
 }
 return base;
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

/* Retain details of the owner's actual garment, but clip them inside a consistent
   illustrated silhouette. No network, no original image changes and no external API. */
function texturePattern(item,cat){
 const cached=textureCache.get(item.id);
 if(cached&&cached.source===item.image){
  if(!cached.texture)return;
  const id='avatar-v3-texture-'+cat;
  const defs=svg.querySelector('defs')||element('defs');
  const pattern=element('pattern',{id,patternUnits:'userSpaceOnUse',width:180,height:365,x:0,y:0},defs);
  const box={top:[26,80,128,135],outerwear:[20,78,140,144],bottom:[48,208,85,129],shoes:[32,324,126,35]}[cat];
  element('image',{x:box[0],y:box[1],width:box[2],height:box[3],preserveAspectRatio:'none',href:cached.texture},pattern);
  activeTexturePatterns.set(cat,{id,opacity:cat==='shoes'?.58:cat==='bottom'?.84:.83});
  return;
 }
 if(!/^data:image\/(?:png|jpeg|jpg|webp);base64,/.test(item.image||''))return;
 const record={source:item.image,texture:null};
 textureCache.set(item.id,record);
 // Cap the cache: clear old sessions; one item is processed once per app session.
 if(textureCache.size>32)textureCache.delete(textureCache.keys().next().value);
 const image=new Image();
 image.onload=()=>{
  try{
   if(!image.naturalWidth||!image.naturalHeight)return;
   const scan=document.createElement('canvas'),limit=360,ratio=Math.min(1,limit/Math.max(image.naturalWidth,image.naturalHeight));
   scan.width=Math.max(1,Math.round(image.naturalWidth*ratio));
   scan.height=Math.max(1,Math.round(image.naturalHeight*ratio));
   const ctx=scan.getContext('2d',{willReadFrequently:true});if(!ctx)return;
   ctx.drawImage(image,0,0,scan.width,scan.height);
   const rgba=ctx.getImageData(0,0,scan.width,scan.height).data;
   let minX=scan.width,minY=scan.height,maxX=-1,maxY=-1,total=0;
   const count=scan.width*scan.height;
   for(let y=0;y<scan.height;y++)for(let x=0;x<scan.width;x++){
    if(rgba[(y*scan.width+x)*4+3]<55)continue;
    total++;minX=Math.min(minX,x);maxX=Math.max(maxX,x);
    minY=Math.min(minY,y);maxY=Math.max(maxY,y);
   }
   // Opaque screenshot backgrounds are unsuitable as garment textures.
   if(total<count*.965||total<1){
    if(maxX<minX||maxY<minY)return;
    const output=document.createElement('canvas');
    output.width=144;output.height=192;
    const out=output.getContext('2d');if(!out)return;
    out.filter='saturate(.88) contrast(.96)';
    out.drawImage(scan,minX,minY,maxX-minX+1,maxY-minY+1,0,0,output.width,output.height);
    const current=textureCache.get(item.id);
    if(!current||current.source!==item.image)return;
    current.texture=output.toDataURL('image/png');
    drawAvatarV2();
   }
  }catch(e){console.warn('V3 local textile detail extraction skipped',e);}
 };
 image.onerror=()=>{};
 image.src=item.image;
}

function topTemplate(item,cat){
 const sub=determineSubtype(item,cat),base=garmentColor(item,cat),fabric=gradient(cat,base);
 texturePattern(item,cat);
 const group=element('g',{'data-avatar-slot':cat});
 const build=avatarProfile&&avatarProfile.build||'athletic';
 const bodyFactor={lean:.91,athletic:1,broad:1.09}[build]||1;
 group.setAttribute('transform','translate(90 0) scale('+bodyFactor+' 1) translate(-90 0)');
 if(cat==='outerwear'){
  if(sub==='hoodie'){
   path(group,'M72 78 Q90 62 108 78 L118 97 L104 112 L76 112 L62 97Z',tint(base,.8));
   path(group,'M65 80 L42 87 L26 108 L20 188 L36 194 L46 128 L49 213 Q90 221 131 213 L134 128 L144 194 L160 188 L154 108 L138 87 L115 80 L104 99 L90 105 L76 99Z',fabric);
   accent(group,'M83 110 L83 203 M97 110 L97 203',tint(base,1.5),.45);
  }else{
   path(group,'M70 80 L42 86 L25 105 L18 184 L35 191 L47 127 L48 211 L81 211 L89 123 L99 123 L100 211 L132 211 L133 127 L145 191 L162 184 L155 105 L137 86 L110 80 L98 102 L89 115 L81 102Z',fabric);
   accent(group,'M89 115 L89 211 M99 123 L100 210',tint(base,1.5),.58,1.8);
  }
  accent(group,'M33 180 L19 177 M147 180 L161 177 M51 206 L78 206 M105 206 L127 206',tint(base,1.55),.45);
  return;
 }
 if(sub==='hoodie'){
  path(group,'M72 77 Q90 61 109 77 L120 98 L105 112 L76 112 L61 97Z',tint(base,.82));
  path(group,'M65 82 L41 87 L25 107 L20 187 L36 192 L46 132 L46 212 Q90 219 134 212 L134 132 L144 192 L160 187 L155 107 L139 87 L115 82 L104 96 L76 96Z',fabric);
  accent(group,'M67 105 Q90 122 113 105 M69 185 Q90 179 111 185 L112 202 L69 202Z',tint(base,1.5),.4);
 }else if(sub==='oversized'){
  path(group,'M65 83 L37 87 L19 106 L34 137 L45 133 L43 211 Q90 219 137 211 L135 133 L146 137 L161 106 L143 87 L115 83 Q104 95 90 97 Q76 95 65 83Z',fabric);
  accent(group,'M35 133 L44 130 M136 130 L145 133 M45 208 Q89 215 135 208',tint(base,1.55),.43);
 }else if(sub==='fitted'){
  path(group,'M66 82 L47 87 L31 105 L42 128 L52 124 Q47 166 50 205 Q90 211 130 205 Q133 166 128 124 L138 128 L149 105 L133 87 L114 82 Q104 95 90 96 Q76 95 66 82Z',fabric);
  accent(group,'M43 124 L51 121 M129 121 L137 124 M52 204 Q90 210 128 204',tint(base,1.55),.40);
 }else{
  path(group,'M65 82 L44 87 L26 106 L38 132 L49 127 L48 208 Q90 214 132 208 L131 127 L142 132 L154 106 L136 87 L115 82 Q104 95 90 96 Q76 95 65 82Z',fabric);
  accent(group,'M39 127 L48 123 M132 123 L141 127 M50 206 Q90 213 130 206',tint(base,1.55),.4);
 }
 // Neckline follows body geometry, including a subtle contrast inner rim.
 accent(group,'M75 84 Q90 104 105 84',tint(base,.55),.72,2.4);
 accent(group,'M75 86 Q90 104 105 86',tint(base,1.5),.25,1.1);
}
function pantsTemplate(item){
 const cat='bottom',sub=determineSubtype(item,cat),base=garmentColor(item,cat),fabric=gradient(cat,base);
 texturePattern(item,cat);
 const group=element('g',{'data-avatar-slot':cat});
 const build=avatarProfile&&avatarProfile.build||'athletic',shapeScale={lean:.93,athletic:1,broad:1.065}[build]||1;
 group.setAttribute('transform','translate(90 0) scale('+shapeScale+' 1) translate(-90 0)');
 const slim=sub==='slim',wide=sub==='wide';
 const cuffLeft=wide?49:slim?60:54,cuffRight=wide?90:slim?86:89;
 const rightLeft=wide?90:slim?96:92,rightRight=wide?132:slim?121:128;
 path(group,'M51 206 Q90 211 129 206 L131 241 Q127 277 '+rightRight+' 334 L'+rightLeft+' 336 Q94 299 90 261 Q86 300 '+cuffRight+' 336 L'+cuffLeft+' 335 Q53 282 49 244Z',fabric);
 accent(group,'M51 212 Q90 217 129 212 M90 213 L89 253 M60 227 Q71 232 81 226 M100 226 Q111 232 122 227',tint(base,.64),.58,1.6);
 accent(group,'M'+cuffLeft+' 332 L'+cuffRight+' 333 M'+rightLeft+' 333 L'+rightRight+' 332',tint(base,1.6),.42,2);
 accent(group,'M60 242 Q65 285 '+(cuffLeft+4)+' 315 M117 240 Q113 285 '+(rightRight-4)+' 316',tint(base,.6),.22);
}
function shoesTemplate(item){
 const cat='shoes',base=garmentColor(item,cat),fabric=gradient(cat,base),sub=determineSubtype(item,cat);
 texturePattern(item,cat);
 const group=element('g',{'data-avatar-slot':cat});
 if(sub==='boot'){
  path(group,'M57 315 L85 315 L89 348 Q89 358 81 358 L36 358 Q31 352 41 344 L55 335Z',fabric);
  path(group,'M98 315 L124 315 L129 338 Q151 345 153 354 Q153 359 143 359 L99 359 Q94 354 98 315Z',fabric);
 }else{
  path(group,'M60 327 Q72 330 85 327 L90 343 Q104 348 99 354 Q97 358 88 358 L34 358 Q26 354 36 347 L56 337Z',fabric);
  path(group,'M100 327 Q113 332 125 328 L131 340 Q154 347 155 353 Q155 358 148 358 L100 358 Q93 354 100 327Z',fabric);
 }
 path(group,'M33 355 L98 355 M99 355 L154 355','none',tint(base,.55),2);
 accent(group,'M60 339 L82 339 M59 343 L84 343 M103 338 L123 338 M103 342 L127 342',tint(base,.6),.62,1.35);
 accent(group,'M35 351 L95 351 M100 351 L150 351',tint(base,1.65),.55,1.4);
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
 const mode=avatarRenderMode==='original'?'original':'stylized';
 modeSelect.value=mode;
 const useStyle=view==='styled'&&mode==='stylized';
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
 if(bottom)pantsTemplate(bottom);
 if(top)topTemplate(top,'top');
 if(coat)topTemplate(coat,'outerwear');
 if(shoe)shoesTemplate(shoe);
 syncAvatarMode();
}
function renderAvatarV2(){
 quickPicker();drawAvatarV2();
}
function setAvatarRenderMode(value){
 if(value!=='original'&&value!=='stylized')return;
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