/* VITHU WARDROBE: isolated, abortable inference worker for multi-photo imports.
   One job at a time. Pipeline and ONNX/WASM memory live outside the UI thread.
   No user photograph is uploaded to GitHub; model weights load from existing CDN.
   Terminating this worker interrupts a stuck model and releases its context. */
const MODELS=Object.freeze({
 legacy:'Xenova/segformer_b2_clothes',
 fashn:'faisal-shohag/fashn-human-parser-onnx'
});
let transformers=null,processor=null,loaded=null;
const notify=(id,stage,detail='')=>self.postMessage({id,type:'status',stage,detail});
async function loadModel(engine,id){
 if(!MODELS[engine])throw new Error('Unbekanntes KI-Modell');
 if(processor&&loaded===engine)return processor;
 if(processor){
  notify(id,'release');
  try{await processor.dispose()}catch(e){/* Termination remains available as fallback. */}
  processor=null;loaded=null;
 }
 notify(id,'library');
 if(!transformers){
  const mod=await import('https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.7.6/+esm');
  // Avoid WASM thread pools on memory-constrained iOS browsers.
  if(mod.env?.backends?.onnx?.wasm)mod.env.backends.onnx.wasm.numThreads=1;
  transformers=mod;
 }
 notify(id,'model');
 const instance=await transformers.pipeline('image-segmentation',MODELS[engine],{
  device:'wasm',dtype:'q8',
  progress_callback:(event)=>{
   if(event?.status==='progress'&&Number.isFinite(event.progress))
    self.postMessage({id,type:'progress',model:engine,percent:Math.round(event.progress)});
  }
 });
 processor=instance;loaded=engine;return instance;
}
self.onmessage=async event=>{
 const msg=event.data||{};
 if(msg.type!=='analyze')return;
 const id=msg.id;
 try{
  const model=await loadModel(msg.engine,id);
  notify(id,'inference');
  const result=await model(msg.image);
  const transfer=[];
  const items=(result||[]).map(entry=>{
   if(!entry?.mask)return {label:entry?.label||'',score:entry?.score||0,mask:null};
   const pixels=new Uint8Array(entry.mask.data||[]);
   transfer.push(pixels.buffer);
   return {label:entry.label,score:entry.score,mask:{
    width:entry.mask.width,height:entry.mask.height,data:pixels
   }};
  });
  self.postMessage({id,type:'result',items},transfer);
 }catch(error){
  self.postMessage({id,type:'error',error:String(error?.message||error)});
 }
};