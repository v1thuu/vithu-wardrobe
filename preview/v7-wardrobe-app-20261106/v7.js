/* VITHU WARDROBE V7 — screen-first app shell.
 * This file builds an independent interface over the proven local wardrobe.
 * It NEVER changes the original cutouts, importer, or IndexedDB schema.
 */
(()=>{
'use strict';
const $=id=>document.getElementById(id);
const el=(tag,cls='',text='')=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text)e.textContent=text;return e;};
const labels={top:'Oberteile',bottom:'Hosen',shoes:'Schuhe',outerwear:'Jacken',
 cap:'Caps',hat:'Hüte',watch:'Uhren',bracelet:'Armbänder',necklace:'Ketten',glasses:'Brillen',
 belt:'Gürtel',bag:'Taschen',ring:'Ringe'};
const groupFor=cat=>['top','bottom','shoes','outerwear'].includes(cat)?cat:'accessories';
const core=()=>({items:typeof items!=='undefined'?items:[],
 chosen:typeof chosen!=='undefined'?chosen:{},
 looks:typeof looks!=='undefined'?looks:[]});
const safeText=(v,fallback)=>typeof v==='string'&&v.trim()?v:fallback;
const state={screen:'wardrobe',category:'all',createCategory:'all',search:'',createSearch:'',
 selectedStyle:'fashion',mobile:true,modal:null};
let root, wardrobeGrid, createPicker, bottomNav, screenNodes={},renders=0;
const validScreens=['wardrobe','create','avatar','looks','import'];

function button(text,cls,onclick,aria){
 const b=el('button',cls,text);b.type='button';if(aria)b.setAttribute('aria-label',aria);
 if(onclick)b.addEventListener('click',onclick);return b;
}
function img(src,alt){
 const image=el('img');image.src=src||'';image.alt=alt||'Kleidungsstück';
 image.loading='lazy';image.decoding='async';return image;
}
function countSelected(){return Object.values(core().chosen).filter(Boolean).length;}
function chosenPieces(){const {items,chosen}=core();return Object.entries(chosen)
 .filter(([,id])=>id).map(([category,id])=>({category,item:items.find(i=>i.id===id)}))
 .filter(x=>x.item);}
function icon(category){
 return ({top:'◈',bottom:'Ⅱ',shoes:'⌁',outerwear:'▱',accessories:'✦'})[category]||'✦';
}
function makeHeader(){
 const header=el('header','v7-header');
 const brand=el('div','v7-brand');
 brand.append(el('strong','','VITHU'),el('span','','WARDROBE'));
 const tools=el('div','v7-headtools');
 tools.append(button('＋','v7-head-add',()=>navigate('import'),'Kleidung hinzufügen'),
  button('⋯','v7-head-settings',()=>showSettings(),'Weitere Einstellungen'));
 const nav=el('nav','v7-desktop-nav');nav.setAttribute('aria-label','Hauptnavigation');
 const tabs=[['wardrobe','Garderobe'],['create','Create'],['avatar','Avatar'],['looks','Looks']];
 tabs.forEach(([key,title])=>{const b=button(title,'v7-navbutton',()=>navigate(key));b.dataset.screen=key;nav.append(b);});
 header.append(brand,nav,tools);return header;
}
function makeBottomNav(){
 const nav=el('nav','v7-bottom-nav');nav.setAttribute('aria-label','Mobile Hauptnavigation');
 [['wardrobe','▦','Garderobe'],['create','✦','Create'],['avatar','♙','Avatar'],['looks','♡','Looks']]
 .forEach(([key,glyph,label])=>{
  const b=button('', 'v7-bottom-link',()=>navigate(key),label);
  b.dataset.screen=key;b.append(el('span','v7-nav-icon',glyph),el('span','',label));nav.append(b);
 });
 return nav;
}
function page(title,kicker){
 const outer=el('section','v7-screen');
 const head=el('div','v7-pagehead');
 const left=el('div');left.append(el('span','v7-eyebrow',kicker),el('h1','',title));
 head.append(left);outer.append(head);return {outer,head};
}
function makeWardrobe(){
 const {outer,head}=page('Meine Garderobe','DEINE KOLLEKTION');
 const count=el('span','v7-count');count.id='v7-wardrobe-count';
 head.append(count);
 const top=el('div','v7-toolbar');
 const search=el('input','v7-search');search.id='v7-search';search.type='search';
 search.placeholder='Kleidung durchsuchen';search.setAttribute('aria-label','Garderobe durchsuchen');
 search.addEventListener('input',()=>{state.search=search.value.toLocaleLowerCase('de');renderWardrobe();});
 top.append(search,button('＋ Hinzufügen','v7-action-outline',()=>navigate('import')));
 const bar=el('div','v7-chips');bar.id='v7-wardrobe-categories';
 wardrobeGrid=el('div','v7-wardrobe-grid');wardrobeGrid.id='v7-wardrobe-grid';
 const empty=el('div','v7-empty');
 empty.id='v7-wardrobe-empty';
 empty.append(el('div','v7-empty-art','◈'),el('h3','','Noch keine Kleidungsstücke'),
  el('p','','Importiere dein erstes Foto. Deine Garderobe wird lokal in diesem Browser gespeichert.'),
  button('Kleidung hinzufügen','v7-primary',()=>navigate('import')));
 outer.append(top,bar,wardrobeGrid,empty);
 const sticky=el('div','v7-selectionbar');sticky.id='v7-wardrobe-selection';
 sticky.append(el('span','v7-selection-label','0 Teile im Look'),
 button('Outfit erstellen','v7-primary',()=>navigate('create')));
 outer.append(sticky);return outer;
}
function makeCreate(){
 const {outer,head}=page('Outfit erstellen','MIX & MATCH');
 head.append(button('Zur Anprobe','v7-head-cta',()=>navigate('avatar')));
 const board=el('section','v7-create-board');
 const boardHead=el('div','v7-boardhead');
 boardHead.append(el('div','','DEIN AKTUELLER LOOK'),el('span','v7-boardcount'));
 const slots=el('div','v7-board-slots');slots.id='v7-board-slots';
 board.append(boardHead,slots);
 const actions=el('div','v7-create-actions');
 actions.append(button('✕ Leeren','v7-soft',async()=>{await clearOutfit();updateAll();}),
 button('♡ Look sichern','v7-soft',showSave),
 button('Anprobieren ↗','v7-primary',()=>navigate('avatar')));
 board.append(actions);
 const picker=el('section','v7-choose-panel');
 const title=el('div','v7-picker-title');title.append(el('h2','','Aus deiner Garderobe'),
 el('p','','Tippe auf ein Teil, um es zum Outfit hinzuzufügen.'));
 const filters=el('div','v7-chips');filters.id='v7-create-categories';
 const search=el('input','v7-search');search.type='search';search.placeholder='Suche nach Kleidungsstücken';
 search.setAttribute('aria-label','Kleidung für Outfit suchen');
 search.addEventListener('input',()=>{state.createSearch=search.value.toLocaleLowerCase('de');renderCreatePicker();});
 createPicker=el('div','v7-create-picker');createPicker.id='v7-create-picker';
 picker.append(title,filters,search,createPicker);
 outer.append(board,picker);return outer;
}
function makeAvatar(){
 const {outer,head}=page('Anprobe','DEIN FASHION STUDIO');
 head.append(button('Look speichern','v7-head-cta',showSave));
 const shell=el('div','v7-avatar-layout');
 const sidebar=el('aside','v7-avatar-sidebar');
 const studio=el('div','v7-avatar-stage');
 const sideRight=el('aside','v7-look-sidebar');
 const card=el('div','v7-studio-card');
 const cardTop=el('div','v7-card-top');
 cardTop.append(el('strong','','OUTFIT-VORSCHAU'),el('span','v7-stage-status','Fashion 2.5D'));
 card.append(cardTop);
 const stageHolder=el('div','v7-stage-host');stageHolder.id='v7-stage-host';
 card.append(stageHolder);
 const footer=el('div','v7-stage-actions');
 footer.append(el('span','','Original-Cutouts · Lokale Vorschau'),
 button('Outfit wechseln','v7-action-outline',()=>navigate('create')));
 card.append(footer);
 studio.append(card);
 const sidebarHead=el('div','v7-panel-heading','AVATAR-STIL');
 const modesHost=el('div','v7-actual-modes');modesHost.id='v7-modes-host';
 const bodyHead=el('div','v7-panel-heading','KÖRPER & PASSFORM');
 const controlHost=el('div','v7-actual-controls');controlHost.id='v7-controls-host';
 sidebar.append(sidebarHead,modesHost,bodyHead,controlHost);
 const lookHead=el('div','v7-panel-heading','DEIN LOOK');
 const lookCards=el('div','v7-current-look');lookCards.id='v7-current-look';
 const buttons=el('div','v7-side-actions');
 buttons.append(button('Mixen','v7-soft',mixLook),button('♡ Speichern','v7-primary',showSave));
 sideRight.append(lookHead,lookCards,buttons);
 shell.append(sidebar,studio,sideRight);
 outer.append(shell);
 return outer;
}
function makeLooks(){
 const {outer,head}=page('Meine Looks','DEINE GESPEICHERTEN OUTFITS');
 head.append(button('＋ Neuer Look','v7-head-cta',()=>navigate('create')));
 const grid=el('div','v7-looks-grid');grid.id='v7-looks-grid';outer.append(grid);
 return outer;
}
function makeImport(){
 const {outer,head}=page('Kleidung hinzufügen','DEINE GARDEROBE WÄCHST');
 head.append(button('Schliessen','v7-action-outline',()=>navigate('wardrobe')));
 const note=el('p','v7-import-note','Dein bisheriger kostenloser Mehrfach-Import bleibt vollständig erhalten. Prüfe die erkannten Teile und speichere sie wie gewohnt.');
 const slot=el('div','v7-import-host');slot.id='v7-import-host';
 outer.append(note,slot);return outer;
}
function makeSettings(){
 const dlg=el('dialog','v7-dialog');dlg.id='v7-settings';
 const heading=el('div','v7-dialog-head');heading.append(el('h2','','Einstellungen'),
  button('✕','v7-icon-button',()=>dlg.close(),'Schliessen'));
 const desc=el('p','','Daten werden im Browser dieses Geräts gespeichert. Der Export eignet sich als Sicherung oder zum Wechseln zwischen Geräten.');
 dlg.append(heading,desc,button('Backup exportieren','v7-primary',()=>exportBackup()),
 button('Backup importieren','v7-action-outline',()=>{
  dlg.close();const file=$('importBackupInput')||document.querySelector('input[type=file][onchange*="importBackup"]');
  if(file)file.click();
 }),button('Schliessen','v7-soft',()=>dlg.close()));return dlg;
}
function makeSaveDialog(){
 const dlg=el('dialog','v7-dialog');dlg.id='v7-save-dialog';
 const title=el('h2','','Look speichern');
 const p=el('p','','Gib deinem Outfit einen Namen. Es bleibt in deiner lokalen Garderobe.');
 const input=el('input','v7-save-input');input.id='v7-save-name';input.maxLength=80;
 input.placeholder='z. B. Weekend Fit';input.setAttribute('aria-label','Name des Looks');
 const actions=el('div','v7-modal-actions');
 actions.append(button('Abbrechen','v7-soft',()=>dlg.close()),
 button('Look speichern','v7-primary',async()=>{await saveNamedLook(input.value);dlg.close();}));
 dlg.append(title,p,input,actions);return dlg;
}
function showSettings(){$('v7-settings')?.showModal();}
function showSave(){
 if(!countSelected()){navigate('create');return;}
 const input=$('v7-save-name');input.value='Look '+(core().looks.length+1);
 $('v7-save-dialog').showModal();input.focus();input.select();
}
async function saveNamedLook(name){
 const selected=core().chosen;
 if(!Object.values(selected).some(Boolean))return;
 looks.unshift({id:uid(),name:safeText(name,'Mein Look').slice(0,80),chosen:{...selected}});
 await persist();render();updateAll();
 navigate('looks');
}
function catKeys(category){const all=core().items;return category==='all'?all:
 category==='favorites'?all.filter(it=>it.favorite):
 category==='accessories'?all.filter(it=>groupFor(it.category)==='accessories'):
 all.filter(it=>it.category===category);}
function filterList(category,search){return catKeys(category).filter(it=>
  !search||(it.name||'').toLocaleLowerCase('de').includes(search)
  ||(labels[it.category]||'').toLocaleLowerCase('de').includes(search));}
function renderFilters(host,selected,handler,includeFavorites=false){
 host.replaceChildren();
 const all=core().items;
 const options=[['all','Alle'],['top','Oberteile'],['bottom','Hosen'],['shoes','Schuhe'],
  ['outerwear','Jacken'],['accessories','Accessoires'],...(includeFavorites?[['favorites','♡ Favoriten']]:[])];
 for(const [key,name] of options){
  const amount=catKeys(key).length;
  if(key!=='all'&&key!=='favorites'&&!amount&&selected!==key)continue;
  const b=button(name+(amount?' · '+amount:''),'v7-filter'+(selected===key?' is-active':''),()=>handler(key));
  b.setAttribute('aria-pressed',String(selected===key));host.append(b);
 }
}
function itemCard(item){
 const article=el('article','v7-item-card');
 const photo=el('div','v7-item-photo');
 photo.append(img(item.shopImage&&item.showShop?item.shopImage:item.image,item.name));
 const favorite=button(item.favorite?'♥':'♡','v7-heart',async e=>{
  await toggleFavorite(item.id);updateAll();
 },item.favorite?'Favorit entfernen':'Als Favorit speichern');
 photo.append(favorite);
 const desc=el('div','v7-item-caption');
 desc.append(el('span','',labels[item.category]||'Kleidungsstück'),
 el('strong','',safeText(item.name,labels[item.category]||'Kleidungsstück')));
 const act=button(core().chosen[item.category]===item.id?'✓ Im Look':'＋ Outfit',
  'v7-additem'+(core().chosen[item.category]===item.id?' is-selected':''),
  async()=>{await choose(item.category,item.id);updateAll();},
  item.name+' zum Outfit hinzufügen');
 article.append(photo,desc,act);return article;
}
function renderWardrobe(){
 const all=core().items,matching=filterList(state.category,state.search);
 $('v7-wardrobe-count').textContent=all.length+' Teile';
 renderFilters($('v7-wardrobe-categories'),state.category,key=>{state.category=key;renderWardrobe();},true);
 wardrobeGrid.replaceChildren();
 matching.forEach(it=>wardrobeGrid.append(itemCard(it)));
 const empty=$('v7-wardrobe-empty');
 empty.hidden=all.length>0;
 if(!all.length)wardrobeGrid.replaceChildren();
 if(all.length&&!matching.length)wardrobeGrid.append(el('p','v7-no-results','Keine Treffer. Suche oder Filter anpassen.'));
 $('v7-wardrobe-selection').querySelector('.v7-selection-label').textContent=countSelected()+' Teile im Look';
}
function renderSlots(){
 const slots=$('v7-board-slots');slots.replaceChildren();
 const categories=[['top','Oberteil'],['bottom','Hose'],['shoes','Schuhe'],['outerwear','Jacke']];
 const {items,chosen}=core();
 for(const [key,title] of categories){
  const item=items.find(it=>it.id===chosen[key]);
  const card=el('button','v7-board-slot'+(item?' has-item':''));
  card.type='button';card.dataset.category=key;
  const thumb=el('div','v7-slot-thumb');
  if(item)thumb.append(img(item.image,item.name));else thumb.append(el('span','',icon(key)));
  const text=el('div','v7-slot-text');text.append(el('small','',title),
   el('strong','',item?safeText(item.name,title):'Teil hinzufügen'));
  card.append(thumb,text,el('span','v7-slot-action',item?'↻':'＋'));
  card.addEventListener('click',()=>{state.createCategory=key;renderCreatePicker();
   $('v7-create-picker').scrollIntoView({block:'start',behavior:'smooth'});});
  slots.append(card);
 }
 $('v7-board-slots').parentElement.querySelector('.v7-boardcount').textContent=countSelected()+' Teile ausgewählt';
}
function renderCreatePicker(){
 const list=filterList(state.createCategory,state.createSearch);
 renderFilters($('v7-create-categories'),state.createCategory,key=>{state.createCategory=key;renderCreatePicker();});
 createPicker.replaceChildren();
 list.forEach(it=>createPicker.append(itemCard(it)));
 if(!list.length){
  const e=el('div','v7-create-empty');e.append(el('p','','Noch keine passenden Teile.'),
   button('Kleidung importieren','v7-action-outline',()=>navigate('import')));
  createPicker.append(e);
 }
}
function renderCurrentLook(){
 const host=$('v7-current-look');host.replaceChildren();
 const selected=chosenPieces();
 if(!selected.length)host.append(el('p','v7-muted','Noch keine Kleidung gewählt.'),
  button('Outfit zusammenstellen','v7-action-outline',()=>navigate('create')));
 for(const {category,item} of selected){
  const row=button('','v7-look-piece',()=>{state.createCategory=category;navigate('create');});
  row.append(img(item.image,item.name));
  const data=el('div');data.append(el('small','',labels[category]||category),
   el('strong','',safeText(item.name,labels[category]||'Kleidungsstück')));
  row.append(data,el('span','','↻'));host.append(row);
 }
 const status=$('v7-avatar-status');
 if(status)status.textContent=document.getElementById('fashionStudioChoice')?.getAttribute('aria-pressed')==='true'
  ?'Studio-Mannequin':document.getElementById('fashionV5Choice')?.getAttribute('aria-pressed')==='true'
   ?'V5 Classic':'Fashion 2.5D';
}
function renderLooks(){
 const host=$('v7-looks-grid');host.replaceChildren();
 const {looks,items}=core();
 if(!looks.length){
  const empty=el('div','v7-looks-empty');empty.append(el('div','v7-empty-art','♡'),
   el('h3','','Dein erster Look wartet'),
   el('p','','Stelle ein Outfit zusammen und speichere es mit einem Namen.'),
   button('Outfit erstellen','v7-primary',()=>navigate('create')));
  host.append(empty);return;
 }
 looks.forEach(look=>{
  const card=el('article','v7-saved-look');
  const collage=el('div','v7-saved-collage');
  const candidates=Object.entries(look.chosen||{}).map(([,id])=>items.find(it=>it.id===id))
   .filter(Boolean).slice(0,4);
  if(!candidates.length)collage.append(el('span','v7-empty-art','◈'));
  candidates.forEach(it=>collage.append(img(it.image,it.name)));
  const details=el('div','v7-saved-info');
  details.append(el('h3','',safeText(look.name,'Gespeicherter Look')),
  el('p','',candidates.length+' Teile'));
  const actions=el('div','v7-saved-actions');
  actions.append(button('Anziehen','v7-primary',async()=>{await loadLook(look.id);updateAll();navigate('avatar');}),
   button('Löschen','v7-soft',async()=>{
    if(!window.confirm('Diesen gespeicherten Look löschen?'))return;
    await deleteLook(look.id);updateAll();
   }));
  card.append(collage,details,actions);host.append(card);
 });
}
async function mixLook(){
 const {items}=core();const groups=['top','bottom','shoes'];
 if(!items.length){navigate('wardrobe');return;}
 for(const category of groups){
  const candidates=items.filter(it=>it.category===category);
  if(candidates.length){
   const item=candidates[Math.floor(Math.random()*candidates.length)];
   await choose(category,item.id);
  }
 }
 updateAll();
}
function updateAll(){
 renders++;
 renderWardrobe();renderSlots();renderCreatePicker();renderCurrentLook();renderLooks();
}
function navigate(target){
 if(!validScreens.includes(target))target='wardrobe';
 state.screen=target;
 for(const [key,node] of Object.entries(screenNodes)){node.hidden=key!==target;}
 for(const b of root.querySelectorAll('.v7-navbutton,.v7-bottom-link')){
  const route=b.dataset.screen||b.textContent.trim().toLowerCase();
  const active=route===target;
  b.classList.toggle('is-active',active);
  if(b.matches('.v7-bottom-link'))b.setAttribute('aria-current',active?'page':'false');
 }
 if(target==='import'){
  switchWardrobeTab('add',{scroll:false});
  $('v7-import-host').append($('importPanel'));
 }else{
  // Keeping the old avatar initialized preserves the real SVG renderer,
  // even though the old V6 layout is completely hidden from the V7 user.
  switchWardrobeTab('avatar',{scroll:false});
 }
 if(target==='avatar')renderCurrentLook();
 updateAll();
 window.scrollTo({top:0,left:0,behavior:'instant'});
}
function syncLegacy(){
 if(root&&document.body.classList.contains('v7-active'))queueMicrotask(updateAll);
}
function init(){
 if($('v7-app'))return;
 const stage=$('stage'),importPanel=$('importPanel'),
  styles=document.querySelector('.fashion25d-picker'),cuts=document.querySelector('.avatar-v4-switch'),
  tabs=$('avatarFold')?.querySelector(':scope > .tabs');
 if(!stage||!importPanel||!styles||!cuts)return;
 root=el('div','v7-app');root.id='v7-app';
 const header=makeHeader();root.append(header);
 const main=el('main','v7-main');main.id='v7-main';
 const pages={wardrobe:makeWardrobe(),create:makeCreate(),avatar:makeAvatar(),
  looks:makeLooks(),import:makeImport()};
 for(const [key,node] of Object.entries(pages)){
  node.id='v7-'+key+'-screen';node.dataset.screen=key;node.hidden=true;
  screenNodes[key]=node;main.append(node);
 }
 root.append(main);
 root.append(makeBottomNav(),makeSettings(),makeSaveDialog());
 document.body.append(root);
 const avatarStage=$('v7-stage-host');
 avatarStage.append(stage);
 const controls=$('v7-controls-host');
 controls.append(cuts);
 if(tabs){tabs.classList.add('v7-photo-tabs');controls.append(tabs);}
 const persona=$('personaEditor');if(persona)controls.append(persona);
 const photoControls=$('photoControls');if(photoControls)controls.append(photoControls);
 const adjust=$('avatar-adjust');if(adjust){
  const details=el('details','v7-details');
  details.append(el('summary','','Feinjustierung'),adjust);controls.append(details);
 }
 $('v7-modes-host').append(styles);
 const status=main.querySelector('.v7-stage-status');if(status)status.id='v7-avatar-status';
 styles.addEventListener('click',()=>queueMicrotask(renderCurrentLook));
 const originalRender=window.render;
 if(typeof originalRender==='function'){
  window.render=function(...args){const value=originalRender.apply(this,args);syncLegacy();return value;};
 }
 document.body.classList.add('v7-active');
 document.documentElement.dataset.vithuVersion='v7';
 navigate('wardrobe');
 window.__vithuV7={
  go:navigate,update:updateAll,
  inspect:()=>({screen:state.screen,items:core().items.length,
   looks:core().looks.length,selected:countSelected(),renders,
   sharedDB:typeof DBNAME!=='undefined'?DBNAME:'',
   stageMoved:$('v7-stage-host')?.contains($('stage')),
   importMoved:$('v7-import-host')?.contains($('importPanel')),
   originalOutfits:true})
 };
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
else init();
})();