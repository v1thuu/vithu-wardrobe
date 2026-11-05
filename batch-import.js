/* VITHU WARDROBE – sequential multi-photo import review.
   Processes ONE photo at a time with existing product / SegFormer / FASHN routing.
   Unsaved files remain only in this page's memory, never in GitHub or app backups. */
(function(){
'use strict';
const MAX_PHOTOS=12;
const $=id=>document.getElementById(id);
let batch=null,serial=0;
const validImage=file=>!!file&&(String(file.type||'').startsWith('image/')||/\.(?:jpe?g|png|webp|heic|heif)$/i.test(file.name||''));
const countSuffix=(n,a,b)=>n===1?a:b;
const isActive=()=>!!batch&&batch.active;
function statusLine(){
 if(!batch)return;
 const label=$('batchImportBar'),progress=$('batchProgress'),detail=$('batchCounts');
 if(!label||!progress||!detail)return;
 label.hidden=!batch.active;
 if(!batch.active)return;
 const number=Math.max(1,batch.current+1);
 progress.textContent='Foto '+number+' von '+batch.files.length+(batch.processing?' · KI analysiert …':' · '+(batch.fileName||''));
 detail.textContent=batch.saved+' gespeichert · '+batch.discarded+' verworfen'+(batch.skipped?' · '+batch.skipped+' übersprungen':'');
}
function candidateIndex(){
 if(!smartSuggestions.length)return -1;
 const order={ready:0,review:1,reject:2};
 return smartSuggestions.map((s,i)=>({i,rank:order[s.grade]??3})).sort((a,b)=>a.rank-b.rank||a.i-b.i)[0].i;
}
function button(label,style,onClick){
 const b=document.createElement('button');b.type='button';b.textContent=label;
 if(style)b.className=style;b.onclick=onClick;return b;
}
function buildReview(){
 if(!isActive())return false;
 const grid=$('smartImportGrid');if(!grid)return false;
 grid.replaceChildren();
 $('smartImportBox').style.display='block';
 $('saveAllSuggestions').style.display='none';
 statusLine();
 if(batch.processing){
  const p=document.createElement('p');p.className='batch-loading';p.textContent='Bitte die Erkennung abschliessen lassen. Danach erscheint jedes Teil einzeln.';
  grid.append(p);return true;
 }
 const i=candidateIndex();
 if(i<0){
  const panel=document.createElement('div');panel.className='batch-empty';
  const title=document.createElement('strong');title.textContent='Keine weiteren erkannten Teile auf diesem Foto';
  const note=document.createElement('p');note.textContent=batch.currentHasSuggestions?
   'Dieses Foto ist geprüft. Du kannst mit dem nächsten weitermachen.':
   'Die KI hat hier keinen brauchbaren Vorschlag geliefert. Du kannst manuell zuschneiden oder das Foto überspringen.';
  const controls=document.createElement('div');controls.className='btnrow';
  controls.append(button('Nächstes Foto','',skipCurrent));
  controls.append(button('✏ Manuell ausschneiden','secondary',()=>{
   showManualTools();$('cropbox').style.display='block';
   $('batchNotice').textContent='Manuell bearbeiten und speichern. Anschliessend „Nächstes Foto“ wählen.';
  }));
  panel.append(title,note,controls);grid.append(panel);
  $('smartImportStatus').style.display='block';
  $('smartImportStatus').textContent='Foto '+(batch.current+1)+' von '+batch.files.length+' · kein offener KI-Vorschlag';
  return true;
 }
 const s=smartSuggestions[i],grade=s.grade;
 batch.currentHasSuggestions=true;
 const card=document.createElement('article');card.className='batch-candidate';
 const heading=document.createElement('div');heading.className='batch-candidate-top';
 const step=document.createElement('strong');step.textContent='Teil '+(batch.reviewedInPhoto+1)+' · '+(cats[s.category]||'Kleidungsstück');
 const info=document.createElement('span');info.className='batch-candidate-badge '+(grade==='ready'?'good':grade==='reject'?'bad':'warning');
 info.textContent=grade==='ready'?'✓ Bereit':grade==='reject'?'⛔ Prüfen oder verwerfen':'⚠ Bitte prüfen';
 heading.append(step,info);
 const image=document.createElement('img');image.src=s.image;image.alt='Erkanntes Kleidungsstück: '+(s.name||s.category);image.className='batch-candidate-photo';
 const fields=document.createElement('div');fields.className='batch-edit-row';
 const nameLabel=document.createElement('label');nameLabel.textContent='Name';
 const name=document.createElement('input');name.id='sg-name-'+i;name.value=s.name||cats[s.category]||'Kleidungsstück';
 name.oninput=()=>{s.name=name.value};nameLabel.append(name);
 const typeLabel=document.createElement('label');typeLabel.textContent='Kategorie';
 const category=document.createElement('select');category.id='sg-cat-'+i;category.innerHTML=categoryOptions(s.category);
 category.onchange=()=>{s.category=category.value;refreshCandidateTiers();buildReview()};
 typeLabel.append(category);fields.append(nameLabel,typeLabel);
 const reason=document.createElement('p');reason.className='batch-candidate-hint';
 reason.textContent=s.grade==='reject'?
  (s.hybridReason||s.qualityReason||'Diese Freistellung sieht nicht wie ein vollständiges Kleidungsstück aus.'):
  (s.warning||s.hybridReason||'Prüfe Stoffkanten, Schuhe und mögliche Körperreste.');
 const actions=document.createElement('div');actions.className='batch-actions';
 const save=button(grade==='ready'?'✓ Speichern':grade==='review'?'Nach Prüfung speichern':'Nicht speicherbar','batch-primary',async()=>{
  if(!isActive()||batch.saving)return;
  const owner=batch;owner.saving=true;save.disabled=true;
  try{await saveSuggestion(i)}
  finally{if(owner===batch){owner.saving=false;buildReview()}}
 });
 if(grade==='reject')save.disabled=true;
 const fix=button('✏ Korrigieren','secondary',()=>refineSuggestion(i));
 const reject=button('Verwerfen','secondary batch-reject',()=>dropSuggestion(i));
 actions.append(save,fix,reject);
 const more=document.createElement('details');more.className='batch-more';
 const summary=document.createElement('summary');summary.textContent='Erkennung verbessern';
 const explain=document.createElement('p');explain.className='muted';
 explain.textContent='Falls ein Teil fehlt, kannst du die Maske erneut prüfen. Die ursprüngliche Freistellung bleibt erhalten, bis du die neue bestätigst.';
 const inspect=button('Erneut analysieren','secondary',()=>compareFocusedCutout(i));
 if(!s.frame||!s.bounds)inspect.disabled=true;
 more.append(summary,explain,inspect);
 card.append(heading,image,reason,fields,actions,more);grid.append(card);
 $('smartImportStatus').style.display='block';
 $('smartImportStatus').textContent='Foto '+(batch.current+1)+'/'+batch.files.length+' · '+smartSuggestions.length+' Teil'+countSuffix(smartSuggestions.length,'','e')+' noch zu prüfen';
 return true;
}
async function nextPhoto(){
 if(!isActive()||batch.processing)return;
 const current=batch;
 current.processing=true;
 const task=++serial;
 current.current++;
 current.currentHasSuggestions=false;current.reviewedInPhoto=0;current.manualSavedThisPhoto=false;
 if(current.current>=current.files.length){
  finish();return;
 }
 const file=current.files[current.current];
 current.fileName=file.name||'Foto';
 current.files[current.current]=null; // discard file reference after this image was queued for decoding
 smartSuggestions=[];clearFashionComparison();
 $('smartImportBox').style.display='block';
 $('smartImportStatus').style.display='block';
 $('smartImportStatus').textContent='Foto '+(current.current+1)+' von '+current.files.length+' wird analysiert …';
 statusLine();buildReview();
 try{
  // Reuses the *unchanged* one-photo parser and conservative B2/B4 quality gates.
  await onPhoto({target:{files:[file]}});
 }catch(error){
  console.error('Batch import image failed',error);
  if(task===serial&&isActive())$('smartImportStatus').textContent='Dieses Foto konnte nicht verarbeitet werden. Überspringen oder manuell zuschneiden.';
 }
 if(!isActive()||current!==batch||task!==serial)return;
 current.processing=false;
 refreshCandidateTiers();
 current.currentHasSuggestions=smartSuggestions.length>0;
 buildReview();
}
function skipCurrent(){
 if(!isActive()||batch.processing)return;
 if(smartSuggestions.length&&!confirm('Verbleibende Vorschläge dieses Fotos verwerfen und fortfahren?'))return;
 batch.skipped+=smartSuggestions.length||batch.currentHasSuggestions||batch.manualSavedThisPhoto?0:1;
 smartSuggestions=[];renderSmartSuggestions();
 nextPhoto().catch(error=>console.error('Next batch photo',error));
}
function onDecision(kind){
 if(!isActive()||batch.processing)return;
 if(kind==='saved')batch.saved++;
 else batch.discarded++;
 batch.reviewedInPhoto++;
 if(smartSuggestions.length){
  refreshCandidateTiers();buildReview();
 }else{
  nextPhoto().catch(error=>console.error('Next batch photo',error));
 }
}
function onManualSave(){
 if(!isActive())return;
 batch.saved++;batch.manualSavedThisPhoto=true;statusLine();
}
function finish(){
 if(!batch)return;
 const done=batch;
 done.active=false;done.processing=false;done.files.length=0;serial++;
 $('batchImportBar').hidden=true;
 $('smartImportBox').style.display='block';
 $('smartImportGrid').replaceChildren();
 const article=document.createElement('div');article.className='batch-finished';
 const title=document.createElement('h3');title.textContent='Import abgeschlossen';
 const count=document.createElement('p');
 count.textContent=done.saved+' Teil'+countSuffix(done.saved,'','e')+' gespeichert · '+done.discarded+' verworfen · '+done.skipped+' Foto'+countSuffix(done.skipped,'','s')+' übersprungen';
 const actions=document.createElement('div');actions.className='btnrow';
 actions.append(button('Zur Garderobe','',()=>switchWardrobeTab('wardrobe')));
 actions.append(button('Weitere Fotos wählen','secondary',()=>$('upload')?.click()));
 article.append(title,count,actions);$('smartImportGrid').append(article);
 $('smartImportStatus').textContent='Alle ausgewählten Fotos geprüft.';
 batch=null;toast('Mehrfachimport abgeschlossen');
}
function stop(ask=true){
 if(!isActive())return true;
 if(ask&&!confirm('Mehrfachimport beenden? Noch nicht gespeicherte Vorschläge gehen verloren.'))return false;
 serial++;importSerial++;
 batch.active=false;batch.files.length=0;batch=null;
 smartSuggestions=[];clearFashionComparison();
 $('batchImportBar').hidden=true;
 $('smartImportStatus').textContent='Mehrfachimport beendet. Bereits gespeicherte Kleidung bleibt in deiner Garderobe.';
 renderSmartSuggestions();
 return true;
}
function begin(files){
 const valid=Array.from(files||[]).filter(validImage).slice(0,MAX_PHOTOS);
 if(!valid.length){toast('Bitte Bilddateien auswählen');return;}
 if(valid.length===1){onPhoto({target:{files:valid}}).catch(e=>console.error('Single import',e));return;}
 if(isActive()&&!stop())return;
 batch={active:true,files:valid,current:-1,processing:false,fileName:'',saved:0,discarded:0,skipped:0,reviewedInPhoto:0,currentHasSuggestions:false,manualSavedThisPhoto:false,saving:false};
 switchWardrobeTab('add',{scroll:false});$('closetAdvancedOptions').open=false;
 $('batchImportBar').hidden=false;
 if(files.length>MAX_PHOTOS)toast('Maximal '+MAX_PHOTOS+' Fotos pro Durchgang');
 nextPhoto().catch(error=>{console.error('Batch import failed',error);if(isActive()){batch.processing=false;buildReview()}});
}
function handleUploadSelection(event){
 const selected=Array.from(event.target.files||[]);
 event.target.value=''; // allow the same image selection again after a completed batch
 if(!selected.length)return;
 if(isActive()&&!stop())return;
 begin(selected);
}
window.handleUploadSelection=handleUploadSelection;
window.batchImportController={get active(){return isActive()},begin,stop,render:buildReview,onDecision,onManualSave,skipCurrent};
})();
