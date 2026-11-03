const globalTools=document.createElement('div');globalTools.className='studio-controls';globalTools.innerHTML='<label>Transponer todo <input id="transposeAllAmount" type="number" min="-48" max="48" step="1" value="-2" aria-label="Semitonos para todo el proyecto"></label><button id="transposeAll">Aplicar semitonos</button><button id="copyNotes">Copiar notas</button><button id="pasteNotes">Pegar notas</button><label>Pegar en tiempo <input id="pastePosition" type="number" min="1" step="0.25" value="1"></label><span class="hint">Ctrl+C / Ctrl+V · clic en el fondo para ubicar el pegado</span>';controls.after(globalTools);
function transposeProject(delta){
 if(!Number.isInteger(delta)||delta===0||Math.abs(delta)>48)return false;
 const tonalTracks=tracks().filter(t=>!['hat','openhat','clap','snare','kick'].includes(t.instrument));
 const notes=[...state.chords.flatMap(c=>c.notes),...tonalTracks.flatMap(t=>t.notes)];
 if(notes.some(n=>n.pitch+delta<0||n.pitch+delta>127)){toast('No se transpuso: alguna nota saldría del rango MIDI.');return false}
 checkpoint();notes.forEach(n=>n.pitch+=delta);state.key=pc(state.key+delta);
 state.chords.forEach(c=>{c.root=pc(c.root+delta);c.custom=true});render();fit();
 toast('Transposición global: '+(delta>0?'+':'')+delta+' semitonos. Drums y loops WAV no cambian.');return true;
}
$('transposeAll').onclick=()=>transposeProject(Number($('transposeAllAmount').value));
let noteClipboard=null;
function copyNotes(){
 const selectedNotes=entries().filter(e=>e.track===activeTrack&&picked.has(e.n));
 if(!selectedNotes.length){toast('Seleccioná notas para copiar.');return false}
 const start=Math.min(...selectedNotes.map(e=>e.offset+e.n.start));
 const end=Math.max(...selectedNotes.map(e=>e.offset+e.n.start+e.n.len));
 noteClipboard={span:end-start,notes:selectedNotes.map(e=>({...e.n,start:e.offset+e.n.start-start}))};
 $('pastePosition').value=1+Math.ceil((end-1e-8)/gridStep())*gridStep();toast('Notas copiadas. Elegí dónde pegarlas.');return true;
}
function pasteNotes(){
 if(!noteClipboard)return toast('Primero copiá una selección.');
 const position=Number($('pastePosition').value)-1;if(!Number.isFinite(position)||position<0)return;
 if(activeTrack>=0&&!tracks()[activeTrack])return;
 checkpoint();const added=[];
 if(activeTrack>=0){const track=tracks()[activeTrack];noteClipboard.notes.forEach(n=>{const clone={...n,start:position+n.start};track.notes.push(clone);added.push(clone)})}
 else{
  let end=state.chords.reduce((s,c)=>s+c.duration,0),required=position+noteClipboard.span;
  while(end<required-1e-8){state.chords.push({root:state.key,q:'Menor',d:0,duration:4,inv:0,custom:true,notes:[]});end+=4}
  // Split sustained notes at chord-block boundaries; no note can escape its owner.
  noteClipboard.notes.forEach(n=>{const begin=position+n.start,finish=begin+n.len;let offset=0;
   state.chords.forEach(c=>{const a=Math.max(begin,offset),b=Math.min(finish,offset+c.duration);if(b>a+1e-8){const clone={...n,start:a-offset,len:b-a};c.notes.push(clone);c.custom=true;added.push(clone)}offset+=c.duration});
  });
 }
 picked=new Set(added);$('pastePosition').value=1+position+noteClipboard.span;render();toast('Notas pegadas. Podés deshacer.');
}
$('copyNotes').onclick=copyNotes;$('pasteNotes').onclick=pasteNotes;
$('roll').addEventListener('pointerdown',e=>{if(e.target!==$('roll'))return;const r=$('roll').getBoundingClientRect();const beat=Math.max(0,Math.floor((e.clientX-r.left-52)/unit/gridStep())*gridStep());$('pastePosition').value=beat+1});
document.addEventListener('keydown',e=>{
 if(!(e.ctrlKey||e.metaKey)||e.altKey||(e.repeat&&e.code!=='KeyD')||/INPUT|TEXTAREA|SELECT/.test(e.target.tagName)||e.target.isContentEditable)return;
 if(!['KeyC','KeyV','KeyD','KeyX'].includes(e.code))return;
 e.preventDefault();e.stopImmediatePropagation();if(e.code==='KeyC')copyNotes();else if(e.code==='KeyV')pasteNotes();else if(e.code==='KeyD')duplicateSelection();else cutSelection();
},true);

function cutSelection(){if(!copyNotes())return;checkpoint();entries().filter(e=>e.track===activeTrack&&picked.has(e.n)).forEach(e=>{e.owner.notes.splice(e.owner.notes.indexOf(e.n),1);if(e.track===-1)e.owner.custom=true});picked.clear();render()}
function duplicateSelection(){
 if(!picked.size&&activeTrack===-1&&state.chords[selected])picked=new Set(state.chords[selected].notes);
 const chosen=entries().filter(e=>e.track===activeTrack&&picked.has(e.n));if(!chosen.length)return;
 const clipboardBefore=noteClipboard;
 if(!copyNotes())return;
 let start=Math.min(...chosen.map(e=>e.offset+e.n.start)),end=Math.max(...chosen.map(e=>e.offset+e.n.start+e.n.len));
 if(activeTrack===-1&&chosen.every(e=>e.owner.notes.every(n=>picked.has(n)))){
  start=Math.min(...chosen.map(e=>e.offset));end=Math.max(...chosen.map(e=>e.offset+e.owner.duration));
  noteClipboard={span:end-start,notes:chosen.map(e=>({...e.n,start:e.offset+e.n.start-start}))};
 }
 $('pastePosition').value=1+end;pasteNotes();noteClipboard=clipboardBefore;
}
const workflowRefinement=document.createElement('script');workflowRefinement.src='editor-refinements.js';document.body.append(workflowRefinement);
