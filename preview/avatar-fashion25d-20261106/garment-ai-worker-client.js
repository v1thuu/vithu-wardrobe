/* Batch-only worker controller. Never falls back to blocking the iPhone UI thread.
   Single-image imports continue using their existing Transformers.js code path. */
(function(){
 'use strict';
 let worker=null,pending=null,serial=0;
 function supported(){return typeof Worker==='function';}
 function end(reason='Analyse abgebrochen'){
  const old=worker;worker=null;
  const job=pending;pending=null;
  if(old)old.terminate();
  if(job)job.reject(new Error(reason));
 }
 function ensure(){
  if(worker)return worker;
  if(!supported())throw new Error('Dieser Browser unterstützt keinen KI-Worker');
  worker=new Worker('./garment-ai-worker.js',{type:'module'});
  worker.onmessage=(event)=>{
   const payload=event.data||{};
   if(!pending||payload.id!==pending.id)return;
   if(payload.type==='status'||payload.type==='progress'){
    pending.onProgress?.(payload);return;
   }
   const job=pending;pending=null;
   if(payload.type==='result')job.resolve(payload.items||[]);
   else job.reject(new Error(payload.error||'KI-Worker fehlgeschlagen'));
  };
  worker.onerror=(event)=>{
   event?.preventDefault?.();
   end('KI-Worker konnte nicht geladen oder ausgeführt werden');
  };
  worker.onmessageerror=()=>end('KI-Worker lieferte eine ungültige Antwort');
  return worker;
 }
 async function analyze(engine,image,onProgress){
  if(pending)throw new Error('Es läuft bereits eine KI-Analyse');
  const runner=ensure(),id=++serial;
  return new Promise((resolve,reject)=>{
   pending={id,resolve,reject,onProgress};
   try{runner.postMessage({id,type:'analyze',engine,image});}
   catch(e){end('KI-Bild konnte nicht an den Worker übergeben werden: '+e.message);}
  });
 }
 window.vithuWorkerAI={supported,analyze,cancel:end};
})();