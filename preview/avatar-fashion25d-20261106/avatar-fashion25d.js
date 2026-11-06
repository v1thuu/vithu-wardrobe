/* VITHU WARDROBE – Fashion 2.5D experiment (free, browser-local).
 * Creates an independent, layered fashion mannequin. All garment images,
 * outfit selection, storage, import and existing V5/ V4 renderers are untouched.
 * No cloud service, no downloaded model, and no paid dependency.
 */
(()=>{
'use strict';
const NS='http://www.w3.org/2000/svg';
const figure=document.getElementById('figure');
const garmentLayer=document.getElementById('avatarV2Garments');
if(!figure||!garmentLayer)return;

const skins={
 light:{light:'#f2c7ab',base:'#dca487',shade:'#ae765c',deep:'#7f4b3a'},
 warm:{light:'#dfaf8a',base:'#bc8666',shade:'#895739',deep:'#603a29'},
 medium:{light:'#c48e6c',base:'#9a6248',shade:'#683f2f',deep:'#462a23'},
 deep:{light:'#aa7858',base:'#80503c',shade:'#553429',deep:'#34231f'}
};
const radii={lean:.94,athletic:1,broad:1.075};
let mode='fashion'; // Preview-local comparison; never stored in IndexedDB.
let lastSignature='';
const svg=(id,z)=>{
 const el=document.createElementNS(NS,'svg');
 el.setAttribute('id',id);
 el.setAttribute('viewBox','0 0 180 450');
 el.setAttribute('width','180');
 el.setAttribute('height','450');
 el.setAttribute('aria-hidden','true');
 el.setAttribute('focusable','false');
 el.style.zIndex=String(z);
 return el;
};
const base=svg('fashion25dBase',2),front=svg('fashion25dForeground',9);
figure.prepend(base);
figure.append(front);
function currentProfile(){
 const src=typeof avatarProfile==='object'&&avatarProfile?avatarProfile:{};
 const allowed=(key,values,fallback)=>values.includes(src[key])?src[key]:fallback;
 return {
  build:allowed('build',['lean','athletic','broad'],'athletic'),
  skin:allowed('skin',['light','warm','medium','deep'],'warm'),
  hair:allowed('hair',['short','curly','buzz'],'short'),
  beard:allowed('beard',['full','stubble','none'],'full'),
  glasses:allowed('glasses',['on','off'],'on')
 };
}
function wearing(category){
 if(typeof chosen!=='object'||!chosen||typeof items==='undefined')return false;
 const id=chosen[category];
 return Boolean(id&&items.some(item=>item.id===id&&item.category===category&&item.image));
}
function gradientDefs(c){
 return '<defs>'+
 '<linearGradient id="f25-skin" x1="0" y1="0" x2="1" y2=".15" gradientUnits="objectBoundingBox">'+
 '<stop offset="0" stop-color="'+c.shade+'"/><stop offset=".24" stop-color="'+c.base+'"/>'+
 '<stop offset=".62" stop-color="'+c.light+'"/><stop offset="1" stop-color="'+c.shade+'"/></linearGradient>'+
 '<linearGradient id="f25-arm" x1="0" y1="0" x2="1" y2=".1">'+
 '<stop offset="0" stop-color="'+c.deep+'"/><stop offset=".25" stop-color="'+c.shade+'"/>'+
 '<stop offset=".61" stop-color="'+c.base+'"/><stop offset=".9" stop-color="'+c.light+'"/><stop offset="1" stop-color="'+c.shade+'"/></linearGradient>'+
 '<linearGradient id="f25-head" x1="0" y1="0" x2="1" y2=".25">'+
 '<stop offset="0" stop-color="'+c.shade+'"/><stop offset=".40" stop-color="'+c.base+'"/>'+
 '<stop offset=".75" stop-color="'+c.light+'"/><stop offset="1" stop-color="'+c.shade+'"/></linearGradient>'+
 '<linearGradient id="f25-tee" x1="0" y1="0" x2="1" y2=".20">'+
 '<stop stop-color="#1e2730"/><stop offset=".43" stop-color="#414a55"/>'+
 '<stop offset=".67" stop-color="#515b65"/><stop offset="1" stop-color="#252d37"/></linearGradient>'+
 '<linearGradient id="f25-denim" x1="0" y1="0" x2="1" y2=".14">'+
 '<stop stop-color="#202832"/><stop offset=".30" stop-color="#3b4654"/>'+
 '<stop offset=".62" stop-color="#59626c"/><stop offset="1" stop-color="#26313e"/></linearGradient>'+
 '<linearGradient id="f25-shoe" x1="0" y1="0" x2="0" y2="1">'+
 '<stop stop-color="#414b58"/><stop offset=".79" stop-color="#1f2834"/><stop offset="1" stop-color="#75808a"/></linearGradient>'+
 '<radialGradient id="f25-faceLight" cx=".54" cy=".27" r=".75">'+
 '<stop stop-color="#fff" stop-opacity=".23"/><stop offset=".7" stop-color="#fff" stop-opacity="0"/>'+
 '<stop offset="1" stop-color="#16110e" stop-opacity=".2"/></radialGradient>'+
 '<linearGradient id="f25-beard" x1="0" y1="0" x2=".95" y2="1">'+
 '<stop stop-color="#2a2425"/><stop offset=".6" stop-color="#1f1e22"/><stop offset="1" stop-color="#373033"/></linearGradient>'+
 '</defs>';
}
function armPath(){
 return 'M 49 91 C 43 94 36 105 34 119 '+
 'C 30 133 26 153 26 169 '+
 'C 24 178 26 188 29 197 '+
 'C 29 203 30 211 30 216 '+
 'C 34 218 39 218 42 214 '+
 'C 42 209 41 201 40 193 '+
 'C 39 180 43 165 45 151 '+
 'C 47 139 52 121 55 105 Z';
}
function armMarkup(){
 const path=armPath();
 const arm='<path d="'+path+'" fill="url(#f25-arm)" stroke="#301e17" stroke-width=".45" stroke-opacity=".16"/>'+
 '<path d="M 43 115 C 36 131 32 151 32 170 Q 30 186 34 196" fill="none" stroke="#f8d8be" stroke-opacity=".20" stroke-width="1.35" stroke-linecap="round"/>'+
 '<path d="M 39 168 C 38 177 37 184 38 193" fill="none" stroke="#583322" stroke-opacity=".14" stroke-width="1"/>';
 return '<g id="fashion25dArms">'+
 '<g>'+arm+'</g>'+
 '<g transform="translate(180 0) scale(-1 1)">'+arm+'</g></g>';
}
function pantsMarkup(){
 return '<g id="fashion25dPants">'+
 '<path d="M 52 201 Q 70 205 88 205 L 90 235 Q 87 255 86 276 '+
 'L 84 405 Q 71 410 56 404 L 53 307 Q 49 270 48 243 Z" fill="url(#f25-denim)"/>'+
 '<path d="M 91 205 Q 111 204 129 202 L 132 245 Q 129 272 127 311 '+
 'L 126 406 Q 113 411 100 405 L 96 273 Q 90 250 91 205 Z" fill="url(#f25-denim)"/>'+
 '<path d="M 52 207 Q 90 216 128 207" fill="none" stroke="#aeb7c2" stroke-opacity=".20" stroke-width="1"/>'+
 '<path d="M 56 245 Q 67 258 78 246 M 102 245 Q 114 256 125 245" fill="none" stroke="#e4e9e9" stroke-opacity=".12" stroke-width="1.2"/>'+
 '<path d="M 81 269 Q 79 329 78 397 M 107 274 Q 111 338 114 398" fill="none" stroke="#d9e0e6" stroke-opacity=".18" stroke-width="1.2"/>'+
 '<path d="M 57 403 Q 70 407 84 403 M 100 404 Q 113 408 126 404" fill="none" stroke="#15202b" stroke-width="2"/>'+
 '</g>';
}
function shoesMarkup(){
 return '<g id="fashion25dShoes">'+
 '<path d="M 57 399 Q 70 408 84 400 L 88 424 Q 99 429 101 438 '+
 'Q 102 444 94 446 L 40 446 Q 32 444 35 437 L 54 421 Z" fill="url(#f25-shoe)"/>'+
 '<path d="M 101 400 Q 113 410 125 400 L 130 421 Q 153 430 155 439 '+
 'Q 155 445 147 446 L 104 446 Q 95 442 99 432 Z" fill="url(#f25-shoe)"/>'+
 '<path d="M 35 439 Q 65 441 100 438 M 100 438 Q 126 442 153 440" stroke="#929ea9" stroke-width="2.3" stroke-opacity=".82" fill="none"/>'+
 '<path d="M 60 425 L 82 426 M 58 430 L 83 430 M 105 426 L 123 429 M 105 432 L 125 434" fill="none" stroke="#cad3d9" stroke-opacity=".36" stroke-width="1.4"/>'+
 '</g>';
}
function neutralTop(){
 return '<g id="fashion25dTop">'+
 '<path d="M 70 79 Q 90 84 110 79 L 132 85 Q 146 94 147 105 '+
 'L 139 125 Q 131 132 126 132 L 126 204 Q 89 211 54 204 '+
 'L 53 133 Q 44 131 40 125 L 33 105 Q 34 92 49 85 Z" fill="url(#f25-tee)" stroke="#101820" stroke-opacity=".28" stroke-width=".7"/>'+
 '<path d="M 71 79 Q 90 96 109 79" fill="none" stroke="#101a20" stroke-opacity=".5" stroke-width="2"/>'+
 '<path d="M 48 101 Q 44 113 42 120 M 133 100 Q 137 111 139 120" stroke="#b2bdc5" stroke-opacity=".20" stroke-width="1.4" fill="none"/>'+
 '<path d="M 55 201 Q 90 206 126 201" stroke="#c4cdd5" stroke-opacity=".18" stroke-width="1.2" fill="none"/>'+
 '<path d="M 60 106 C 59 132 58 165 60 191 M 120 107 Q 122 150 120 191" stroke="#d8e0e6" stroke-opacity=".14" stroke-width="1.5" fill="none"/>'+
 '</g>';
}
function headMarkup(profile,c){
 const face='<path d="M 72 36 Q 72 19 89 19 Q 108 18 110 36 '+
 'L 108 52 Q 107 69 93 77 Q 88 80 81 73 '+
 'Q 71 65 70 50 Z" fill="url(#f25-head)"/>'+
 '<path d="M 72 36 Q 72 19 89 19 Q 108 18 110 36 L 108 52 Q 107 70 92 77 '+
 'Q 79 76 73 60 Z" fill="url(#f25-faceLight)"/>'+
 '<path d="M 72 46 Q 67 42 67 50 Q 67 57 72 57 M 109 46 Q 114 41 114 49 Q 114 56 108 57" fill="url(#f25-skin)" stroke="'+c.shade+'" stroke-width=".55" stroke-opacity=".35"/>'+
 '<path d="M 81 45 Q 85 43 88 45 M 96 45 Q 99 43 102 45" fill="none" stroke="#3b2d2b" stroke-width="1.4" stroke-linecap="round" stroke-opacity=".70"/>'+
 '<path d="M 90 48 Q 89 56 92 58" fill="none" stroke="'+c.shade+'" stroke-width="1.1" stroke-linecap="round" stroke-opacity=".62"/>'+
 '<path d="M 84 65 Q 91 67 98 64" fill="none" stroke="'+c.deep+'" stroke-opacity=".58" stroke-width="1.3" stroke-linecap="round"/>';
 const beard=profile.beard==='none'?'':profile.beard==='full'?
 '<path d="M 72 54 Q 76 63 80 66 Q 81 73 91 76 Q 100 72 102 66 Q 109 57 109 53 '+
 'Q 108 70 100 79 Q 91 84 83 79 Q 72 72 72 54 Z" fill="url(#f25-beard)" opacity=".91"/>'+
 '<path d="M 84 69 Q 91 71 97 68" fill="none" stroke="'+c.light+'" stroke-opacity=".34" stroke-width=".8"/>':
 '<path d="M 72 59 Q 77 72 91 75 Q 104 72 108 59 Q 106 74 91 79 Q 76 76 72 59 Z" fill="#292528" opacity=".26"/>';
 const hair=profile.hair==='buzz'?
 '<path d="M 71 36 Q 68 18 88 17 Q 109 16 111 35 Q 97 26 72 37" fill="#28282a"/>':
 profile.hair==='curly'?
 '<path d="M 70 41 Q 64 21 79 17 Q 90 8 101 16 Q 118 18 110 42 L 108 31 Q 91 27 73 35 Z" fill="#211f22"/>'+
 '<circle cx="76" cy="23" r="6" fill="#211f22"/><circle cx="88" cy="19" r="7" fill="#292527"/><circle cx="101" cy="21" r="6" fill="#242225"/>':
 '<path d="M 70 43 Q 67 25 77 19 Q 86 13 101 19 Q 113 24 111 42 '+
 'L 108 34 Q 97 28 85 30 Q 77 30 72 36 Z" fill="#242326"/>'+
 '<path d="M 77 23 Q 90 18 101 23" fill="none" stroke="#777075" stroke-opacity=".30" stroke-width="1.1"/>'+
 '<path d="M 70 40 L 70 50 M 110 39 L 110 50" stroke="#363234" stroke-width="3"/>';
 const glasses=profile.glasses==='on'?
 '<path d="M 75 45 Q 81 43 89 45 L 89 52 Q 84 57 78 53 Z '+
 'M 93 45 Q 101 43 107 45 L 105 53 Q 98 57 93 51 Z" fill="#202a32" fill-opacity=".83" stroke="#1d2129" stroke-width="1.3"/>'+
 '<path d="M 89 47 Q 91 45 93 47 M 75 47 L 71 46 M 106 47 L 110 46" fill="none" stroke="#171a22" stroke-width="1.3"/>'+
 '<path d="M 78 46 L 84 46 M 96 46 L 102 46" fill="none" stroke="#c4cbd1" stroke-opacity=".24" stroke-width=".8"/>':'';
 return '<g id="fashion25dHead">'+
 '<path d="M 82 67 L 82 83 Q 90 88 98 83 L 98 67 Z" fill="url(#f25-skin)" stroke="'+c.deep+'" stroke-opacity=".15" stroke-width=".5"/>'+
 face+beard+hair+glasses+'</g>';
}
function handMarkup(){
 const path='<path d="M 31 210 C 34 207 40 208 43 211 '+
 'L 44 219 Q 47 223 45 226 Q 43 229 42 226 '+
 'L 42 230 Q 42 235 38 236 Q 34 237 31 234 '+
 'Q 29 232 29 227 L 29 217 Z" fill="url(#f25-skin)" stroke="#452a22" stroke-opacity=".16" stroke-width=".55"/>'+
 '<path d="M 33 219 Q 37 218 40 219" fill="none" stroke="#fff0df" stroke-opacity=".22" stroke-width=".6"/>';
 return '<g id="fashion25dHands"><g>'+path+'</g>'+
 '<g transform="translate(180 0) scale(-1 1)">'+path+'</g></g>';
}
function renderPerson(){
 const p=currentProfile(),c=skins[p.skin];
 const build=radii[p.build],profileScale='translate(90 0) scale('+build+' 1) translate(-90 0)';
 // The real garment overlay remains its own unmodified SVG above this base.
 base.innerHTML=gradientDefs(c)+
 '<g id="fashion25dLower" transform="translate(90 0) scale('+({lean:.96,athletic:1,broad:1.05}[p.build])+' 1) translate(-90 0)">'+
 (!wearing('bottom')?pantsMarkup():'')+
 (!wearing('shoes')?shoesMarkup():'')+
 '</g>'+
 '<g id="fashion25dUpper" transform="'+profileScale+'">'+
 armMarkup()+
 // No neutral torso may show through or around imported garment cutouts.
 (!wearing('top')&&!wearing('outerwear')?neutralTop():'')+
 '</g>';
 front.innerHTML=gradientDefs(c)+
 '<g transform="'+profileScale+'">'+handMarkup()+'</g>'+headMarkup(p,c);
 const root=figure;
 root.dataset.fashionBuild=p.build;
}
function sync(){
 const active=mode==='fashion'&&typeof avatarRenderMode!=='undefined'
  &&avatarRenderMode==='silhouette'&&typeof view!=='undefined'&&view==='styled';
 figure.classList.toggle('fashion25d-enabled',active);
 const primary=document.getElementById('fashion25dChoice');
 const fallback=document.getElementById('fashionV5Choice');
 if(primary){primary.classList.toggle('active',mode==='fashion');primary.classList.toggle('secondary',mode!=='fashion');primary.setAttribute('aria-pressed',String(mode==='fashion'));}
 if(fallback){fallback.classList.toggle('active',mode==='v5');fallback.classList.toggle('secondary',mode!=='v5');fallback.setAttribute('aria-pressed',String(mode==='v5'));}
 if(!active)return;
 const p=currentProfile();
 const sig=[p.build,p.skin,p.hair,p.beard,p.glasses,
  wearing('top'),wearing('outerwear'),wearing('bottom'),wearing('shoes')].join('|');
 if(sig!==lastSignature){lastSignature=sig;renderPerson();}
}
function selectMode(next){
 if(next!=='fashion'&&next!=='v5')return;
 mode=next;lastSignature='';
 sync();
}
window.setFashionAvatarMode=selectMode;
window.__vithuFashion25dTest={currentProfile,selectMode,sync,renderPerson,hasLocalStorageWrites:false};
const previousRender=window.renderAvatarV2;
if(typeof previousRender==='function'){
 window.renderAvatarV2=function(...args){
  const result=previousRender.apply(this,args);
  sync();
  return result;
 };
}
const observer=new MutationObserver(()=>sync());
observer.observe(garmentLayer,{childList:true});
// Outfit selection can redraw without invoking window.renderAvatarV2.
// A harmless observe-only hook keeps the new body in sync with existing UI.
document.addEventListener('change',ev=>{
 if(ev.target?.id?.startsWith('persona-'))queueMicrotask(()=>{lastSignature='';sync();});
});
sync();
})();