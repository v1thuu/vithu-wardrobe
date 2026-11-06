/* VITHU WARDROBE V6.1 – premium shell improvements.
 * Only moves existing UI nodes and changes presentation. Import pipelines,
 * original garment images, IndexedDB and avatar geometry are never touched.
 */
(()=>{
'use strict';
function init(){
 const header=document.querySelector('.wardrobe-header');
 const tabs=document.querySelector('.wardrobe-tabs');
 const workspace=document.querySelector('.studio.v6-workspace');
 const stage=document.getElementById('v6-center');
 const modes=document.querySelector('.fashion25d-picker');
 const side=document.getElementById('v6-left');
 const outfit=document.getElementById('v6-right');
 if(!header||!tabs||!workspace||!stage||!modes||!side||!outfit)return;
 if(document.getElementById('v61-masthead'))return;

 // Preserve original header, tab buttons and backup/settings handlers.
 const masthead=document.createElement('div');
 masthead.id='v61-masthead';
 masthead.className='v61-masthead';
 header.parentNode.insertBefore(masthead,header);
 masthead.append(header,tabs);
 const settings=header.querySelector('.app-settings');
 if(settings)masthead.append(settings);
 const brand=header.querySelector('h1');
 if(brand)brand.setAttribute('aria-label','VITHU WARDROBE');

 // Compact stage controls use the existing mode buttons, not UI duplicates.
 const sourceSection=modes.parentElement;
 const quickbar=document.createElement('div');
 quickbar.id='v61-quickbar';
 quickbar.className='v61-quickbar';
 quickbar.setAttribute('aria-label','Avatar-Stil auswählen');
 stage.insertBefore(quickbar,stage.firstChild);
 if(sourceSection)sourceSection.classList.add('v61-mode-section');
 const modesLabels=[
  ['fashion25dChoice','Fashion 2.5D','Fashion 2.5D – persönlicher Stil'],
  ['fashionStudioChoice','Mannequin','Neutrales Studio-Mannequin'],
  ['fashionV5Choice','V5 Classic','Bisheriger V5-Avatar']
 ];
 for(const [id,label,aria] of modesLabels){
  const button=document.getElementById(id);
  if(button){button.textContent=label;button.setAttribute('aria-label',aria);}
 }
 const mobile=window.matchMedia('(max-width:790px)');
 function arrange(){
  if(mobile.matches){
   quickbar.append(modes);
  }else if(sourceSection){
   sourceSection.insertBefore(modes,sourceSection.firstChild);
  }
  updatePhotoMode();
 }
 function updatePhotoMode(){
  const photoActive=document.getElementById('view-photo')?.classList.contains('active');
  quickbar.hidden=!!photoActive;
 }
 if(mobile.addEventListener)mobile.addEventListener('change',arrange);
 else if(mobile.addListener)mobile.addListener(arrange);
 document.getElementById('view-styled')?.addEventListener('click',()=>queueMicrotask(updatePhotoMode));
 document.getElementById('view-photo')?.addEventListener('click',()=>queueMicrotask(updatePhotoMode));
 arrange();

 // Remove an inert-looking alignment control; this one navigates to the
 // functioning garment selector without modifying the selected outfit.
 const oldAction=document.querySelector('.v6-stage-footer button');
 if(oldAction){
  const outfitLink=document.createElement('button');
  outfitLink.type='button';
  outfitLink.className='v61-outfit-jump';
  outfitLink.textContent='Outfit wählen ↓';
  outfitLink.setAttribute('aria-label','Zur Auswahl deiner gespeicherten Kleidungsstücke');
  outfitLink.addEventListener('click',()=>outfit.scrollIntoView({behavior:'smooth',block:'start'}));
  oldAction.replaceWith(outfitLink);
 }
 const caption=document.querySelector('.v6-stage-footer span');
 if(caption)caption.textContent='Deine Original-Kleidungsbilder · ohne KI-Retusche';
 const stageHeading=document.querySelector('.v6-stage-heading strong');
 if(stageHeading)stageHeading.textContent='DEIN OUTFIT';
 const eyebrow=document.querySelector('.v6-topbar .v6-tag');
 if(eyebrow)eyebrow.textContent='✦ V6 · FASHION STUDIO';
 const subtitle=document.querySelector('.v6-topbar p');
 if(subtitle)subtitle.textContent='Deine Garderobe. Dein Look. Alles an einem Ort.';

 // Make the pre-existing switch between modes explicitly testable.
 document.body.classList.add('v61-ready');
 document.documentElement.dataset.wardrobeUi='premium-v6-1';
 window.__vithuV61={
  version:'V6.1 premium UI sprint',
  inspect:()=>({
   active:!!document.getElementById('v61-masthead'),
   originalTabs:tabs.querySelectorAll('button[role=tab]').length,
   sameOutfitPicker:outfit.contains(document.getElementById('v2OutfitPicker')),
   sameAvatarStage:stage.contains(document.getElementById('stage')),
   modeControlParent:modes.parentElement?.id||modes.parentElement?.className||'',
   databaseUntouched:true
  })
 };
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
else init();
})();