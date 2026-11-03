// Selection-driven edits keep note elements alive during marquee and double-click.
function voiceGroups(){
 if(activeTrack<0){const chosen=state.chords.filter(c=>c.notes.some(n=>picked.has(n)));return (chosen.length?chosen:state.chords).filter(c=>c.notes.length).map(c=>({notes:c.notes,owner:c}))}
 const notes=tracks()[activeTrack]?.notes.filter(n=>picked.has(n))||[];
 return harmonyGroups(notes,state.tempo).filter(g=>detectHarmony(g.notes,qualities).length);
}
const previousInspectorSync=syncChannelInspector;
syncChannelInspector=function(){previousInspectorSync();const count=voiceGroups().length;$('voice').disabled=count<2;$('voice').title=count<2?'Seleccioná al menos dos acordes para conducir sus voces.':'Aplica a la secuencia seleccionada; conserva tiempos y duraciones.'};
$('voice').onclick=()=>{
 const groups=voiceGroups();if(groups.length<2)return;checkpoint();let previous;
 for(const group of groups){const notes=[...group.notes].sort((a,b)=>a.pitch-b.pitch);
  if(previous)notes.forEach((n,i)=>{
   if(($('lockbass').checked&&i===0)||($('locktop').checked&&i===notes.length-1))return;
   let target=previous[Math.min(i,previous.length-1)],movement=$('movement').value;
   if(movement==='Ascendente')target+=4;if(movement==='Descendente')target-=4;
   if(movement==='Contrario')target+=i<notes.length/2?-5:5;if(movement==='Saltos amplios')target+=i%2?12:-12;
   // Octave displacement preserves chord identity, including pedal mode.
   if(movement==='Bajo pedal'&&i===0)target=previous[0];
   const candidates=Array.from({length:11},(_,k)=>n.pitch+(k-5)*12).filter(p=>p>=0&&p<=127);
   n.pitch=candidates.sort((a,b)=>Math.abs(a-target)-Math.abs(b-target)||Math.abs(a-n.pitch)-Math.abs(b-n.pitch))[0];
  });
  previous=notes.map(n=>n.pitch).sort((a,b)=>a-b);if(group.owner)group.owner.custom=true;
 }render();
};
const duplicateAction=document.createElement('button');duplicateAction.textContent='Duplicar selección · Ctrl+D';duplicateAction.title='Copia a continuación del tramo seleccionado. No reemplaza ni desplaza notas existentes; si el destino está ocupado, las notas se superponen.';duplicateAction.onclick=duplicateSelection;globalTools.append(duplicateAction);
$('duplicate').onclick=duplicateSelection;
// Less frequent harmonic tools remain available in a closed disclosure.
const advanced=document.createElement('details'),advancedTitle=document.createElement('summary');advanced.className='advanced-harmony';advancedTitle.textContent='Armonía avanzada';advanced.append(advancedTitle);
$('prepare').closest('label').before(advanced);
advanced.append($('prepare').closest('label'),$('insert'),$('borrow').closest('label'),$('addborrow'));
$('voice').after($('bass').closest('label'));

const saveNameDialog=document.createElement('dialog');saveNameDialog.className='session-dialog';saveNameDialog.innerHTML='<form method="dialog"><h2>Guardar progresión</h2><label>Nombre del proyecto<input id="projectName" maxlength="100" required autocomplete="off"></label><div class="actions"><button value="cancel" formnovalidate>Cancelar</button><button id="confirmProjectSave" type="button" class="accent">Guardar archivo</button></div><p id="saveNameStatus" role="status"></p></form>';document.body.append(saveNameDialog);
let saveForNewSession=false;
function openNamedSave(forNewSession=false){saveForNewSession=forNewSession;$('projectName').value=state.projectName||'Mi progresión';$('saveNameStatus').textContent='';saveNameDialog.showModal();$('projectName').focus();$('projectName').select()}
$('save').onclick=()=>openNamedSave();$('sessionSave').onclick=()=>openNamedSave(true);
$('confirmProjectSave').onclick=async()=>{
 const name=$('projectName').value.trim().replace(/[<>:"/\\|?*\x00-\x1f]/g,'-');if(!name){$('saveNameStatus').textContent='Escribí un nombre.';return}
 const data=JSON.stringify({...state,projectName:name},null,2);$('confirmProjectSave').disabled=true;
 try{if(typeof window.showSaveFilePicker==='function'){
  const handle=await window.showSaveFilePicker({suggestedName:name+'.json',types:[{description:'Proyecto QUINTA',accept:{'application/json':['.json']}}]});const file=await handle.createWritable();await file.write(data);await file.close();
  state.projectName=name;saveNameDialog.close();if(saveForNewSession)resetSession();else render();
 }else{download(data,name+'.json','application/json');state.projectName=name;saveNameDialog.close();render();if(saveForNewSession)$('sessionStatus').textContent='Descarga solicitada. Verificá el archivo y elegí Empezar sin guardar para continuar.'}
 }catch(error){$('saveNameStatus').textContent=error.name==='AbortError'?'Guardado cancelado.':'No se pudo guardar. Tu sesión sigue intacta.'}finally{$('confirmProjectSave').disabled=false}
};
saveNameDialog.querySelector('form').addEventListener('submit',e=>{if(e.submitter?.value!=='cancel'){e.preventDefault();$('confirmProjectSave').click()}});

const bpm=$('tempo');bpm.title='Arrastrá hacia arriba o abajo para ajustar BPM. También podés escribir el valor.';bpm.style.touchAction='none';
bpm.addEventListener('pointerdown',e=>{
 if(e.button!==0)return;const startY=e.clientY,start=state.tempo;let dragging=false;bpm.setPointerCapture(e.pointerId);
 const move=event=>{const delta=Math.round((startY-event.clientY)/3);if(!dragging&&Math.abs(startY-event.clientY)<4)return;if(!dragging){checkpoint();dragging=true;bpm.setPointerCapture(e.pointerId);if(playing)stop()}event.preventDefault();state.tempo=Math.max(30,Math.min(260,start+delta));bpm.value=state.tempo};
 const end=()=>{bpm.removeEventListener('pointermove',move);bpm.removeEventListener('pointerup',end);bpm.removeEventListener('pointercancel',end);if(dragging)render()};
 bpm.addEventListener('pointermove',move);bpm.addEventListener('pointerup',end);bpm.addEventListener('pointercancel',end);
});
render();
const channelExportScript=document.createElement('script');channelExportScript.src='channel-export.js';document.body.append(channelExportScript);
const layoutScript=document.createElement('script');layoutScript.src='editor-layout.js';document.body.append(layoutScript);
