/* VITHU WARDROBE V6 shell.
 * Reorganises existing DOM only. Original garment cutouts, IndexedDB schema,
 * import/crop, image models, backup and previous body renderers are untouched.
 * This file never persists anything itself.
 */
(()=>{
'use strict';
if(document.getElementById('v6-topbar'))return;

const elt=(tag,classes='',content='')=>{
 const node=document.createElement(tag);
 if(classes)node.className=classes;
 if(content)node.textContent=content;
 return node;
};
const q=(sel,from=document)=>from.querySelector(sel);
function build(){
 const panel=document.getElementById('avatarPanel');
 const fold=document.getElementById('avatarFold');
 const workspace=q(':scope > .studio',fold||document);
 const viewTabs=q(':scope > .tabs',fold||document);
 if(!panel||!fold||!workspace||!viewTabs)return false;
 const stage=document.getElementById('stage');
 const picker=document.getElementById('v2OutfitPicker');
 const persona=document.getElementById('personaEditor');
 const fit=document.getElementById('avatar-adjust');
 const natural=q('.avatar-v4-switch',workspace);
 const modes=q('.fashion25d-picker',workspace);
 const note=document.getElementById('fashion25dInfo');
 if(!stage||!picker||!persona||!fit||!natural||!modes||!note)return false;

 // Top bar. The original photo/person view controls retain their handlers.
 const topbar=elt('div','v6-topbar');
 topbar.id='v6-topbar';
 const brand=elt('div');
 const badge=elt('span','v6-tag','✦ V6 FASHION STUDIO · BETA');
 const title=elt('h2','','Dein Outfit. Dein Style.');
 const sub=elt('p','','Originalkleidung kombinieren – kostenlos und lokal im Browser.');
 brand.append(badge,title,sub);
 const rightTitle=elt('div');
 const version=elt('div','v6-version-note');
 const led=elt('i','v6-dot');
 version.append(led,document.createTextNode('Original-Cutouts · Kein bezahlter KI-Dienst'));
 viewTabs.classList.add('v6-view-tabs');
 rightTitle.append(viewTabs,version);
 topbar.append(brand,rightTitle);
 fold.prepend(topbar);

 // Three columns on desktop, stage → outfit → body settings on mobile.
 workspace.classList.add('v6-workspace');
 const left=elt('aside','v6-side v6-left');
 left.id='v6-left';
 const center=elt('main','v6-center');
 center.id='v6-center';
 const right=elt('aside','v6-right');
 right.id='v6-right';
 const section=(parent,heading)=>{
  const wrapper=elt('section','v6-sidebar-section');
  const h=elt('div','v6-side-heading',heading);
  wrapper.append(h);parent.append(wrapper);
  return wrapper;
 };

 left.append(elt('h3','','Avatar-Studio'));
 const sourceSection=section(left,'Kleiderdarstellung');
 sourceSection.append(natural);
 const modeSection=section(left,'Avatar-Stil');
 modeSection.append(modes,note);
 const shapeSection=section(left,'Körper & Erscheinung');
 const form=elt('div','v6-appearance');
 const shapeLabel=elt('label','','Statur');
 const shape=elt('select');
 shape.id='v6Build';
 shape.setAttribute('aria-label','Statur für die Avatar-Ansicht');
 for(const [val,label] of [['lean','Schlank'],['athletic','Athletisch'],['broad','Kräftig']]){
  const option=document.createElement('option');option.value=val;option.textContent=label;shape.append(option);
 }
 const srcSelect=document.getElementById('persona-build');
 shape.value=srcSelect?.value||'athletic';
 shape.addEventListener('change',()=>{
  const original=document.getElementById('persona-build');
  if(!original)return;
  original.value=shape.value;
  original.dispatchEvent(new Event('change',{bubbles:true}));
 });
 if(srcSelect)srcSelect.addEventListener('change',()=>{shape.value=srcSelect.value;});
 shapeLabel.append(shape);form.append(shapeLabel);
 const tip=elt('div','v6-tip');
 tip.append(elt('strong','','Was dieser Prototyp kann'));
 const text=elt('p','','Er kombiniert deine echten Kleidungsbilder auf einem 2D-/2.5D-Körper. Ein fotorealistischer Anprobe-Algorithmus ist noch nicht integriert.');
 text.style.cssText='font-size:11px;line-height:1.55;margin:7px 0 0;color:inherit';
 tip.append(text);
 shapeSection.append(form,tip);
 const expand=section(left,'Weitere Personalisierung');
 expand.append(persona);

 const stagePanel=elt('div','v6-stage-panel');
 const head=elt('div','v6-stage-heading');
 const heading=elt('strong','','OUTFIT-VORSCHAU');
 const state=elt('span','','Fashion 2.5D');
 state.id='v6ActiveStyle';
 head.append(heading,state);
 stagePanel.append(head,stage);
 const stageFooter=elt('div','v6-stage-footer');
 stageFooter.append(elt('span','','Das Kleidungsfoto bleibt unverändert – keine erfundene Stoffsimulation.'));
 const restore=elt('button','secondary','⊙ Zentrieren');
 restore.type='button';
 restore.addEventListener('click',()=>{
  if(typeof window.centerAvatarItem==='function')window.centerAvatarItem();
  else if(typeof window.resetFit==='function')window.resetFit();
  else document.querySelector('#avatar-adjust button[onclick*="centerAvatarItem"]')?.click();
 });
 stageFooter.append(restore);
 stagePanel.append(stageFooter);
 center.append(stagePanel);
 const mobileHint=elt('p','v6-mobile-hint','Outfits auswählen, darunter den Avatar-Stil anpassen.');
 center.append(mobileHint);

 const rightHead=elt('div','v6-look-head');
 rightHead.append(elt('h3','','Dein Look'),elt('small','','ECHTE KLEIDUNG'));
 right.append(rightHead,picker);
 const adjust=elt('details','v6-adjust-box');
 adjust.id='v6-adjust-box';
 const adjustSummary=elt('summary','','Passform bearbeiten');
 adjust.append(adjustSummary,fit);
 right.append(adjust);
 const originalOutfit=q('.avatar-outfit',workspace);
 const originalOutfitHolder=originalOutfit?.parentElement;
 if(originalOutfit){
  const old=elt('details','v6-more-settings');
  const summary=elt('summary','','Weitere Outfit-Einstellungen');
  old.append(summary,originalOutfit);
  right.append(old);
 }
 // Remove the now-empty legacy wrapper to avoid an extra grid column.
 if(originalOutfitHolder?.parentElement===workspace&&originalOutfitHolder.children.length===0)originalOutfitHolder.remove();
 const photoControls=document.getElementById('photoControls');
 if(photoControls){
  const photos=elt('div','v6-secondary-area');
  photos.append(photoControls);
  right.append(photos);
 }
 const info=elt('div','v6-info-card');
 info.append(elt('strong','','100 % kostenloser V6-Test'));
 info.append(document.createTextNode(
  'Keine neue Datenbank und kein Cloud-Avatar. Deine Kleidung liegt weiterhin lokal in der bestehenden GitHub-Pages-Vorschaugarderobe. Auf anderen Geräten werden Daten nicht automatisch synchronisiert.'
 ));
 right.append(info);
 const oldDesc=Array.from(workspace.children).find(node=>
  node.tagName==='P'&&node.classList.contains('muted'));
 if(oldDesc){oldDesc.classList.add('v6-old-description');right.append(oldDesc);}
 workspace.append(left,center,right);

 // Update a status label only; never remount the working avatar or clothing.
 function syncBadge(){
  const pressed=id=>document.getElementById(id)?.getAttribute('aria-pressed')==='true';
  state.textContent=pressed('fashionStudioChoice')?'Studio-Mannequin'
   :pressed('fashionV5Choice')?'V5 (Vergleich)':'Fashion 2.5D';
  state.title='Avatar-Rendering; kein fotorealistischer KI-Try-On';
 }
 modes.addEventListener('click',()=>queueMicrotask(syncBadge));
 syncBadge();
 document.body.classList.add('v6-ready');
 document.documentElement.dataset.wardrobeVersion='v6-preview';
 window.__vithuV6={
  version:'V6 interface preview',
  inspect:()=>({layout:!!document.getElementById('v6-center'),
   originalCutoutRenderer:!!document.getElementById('avatarV2Garments'),
   wardrobeDatabaseInHTML:document.documentElement.dataset.wardrobeVersion,
   selectedStyle:state.textContent,importsUnmodified:true})
 };
 return true;
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',build,{once:true});
else build();
})();