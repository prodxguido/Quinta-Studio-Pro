// These controls are installed after the editor; no packaging or native bridge required.
const tipsFold=document.createElement('details'),tipsSummary=document.createElement('summary');
tipsSummary.textContent='Cuaderno del productor · consejos y técnicas';tipsFold.append(tipsSummary);
while(library.firstChild)tipsFold.append(library.firstChild);library.append(tipsFold);
document.querySelector('.plugg-lab > details')?.removeAttribute('open');

const sessionButton=document.createElement('button');sessionButton.textContent='Nueva sesión';document.querySelector('header .actions').prepend(sessionButton);
const sessionDialog=document.createElement('dialog');sessionDialog.className='session-dialog';sessionDialog.innerHTML='<h2>Nueva sesión</h2><p>¿Querés guardar el proyecto actual antes de empezar de cero?</p><p class="hint">Se reinician notas, canales, tempo, tonalidad y versiones A/B. Cancelar conserva todo.</p><div class="actions"><button id="sessionCancel">Cancelar</button><button id="sessionDiscard">Empezar sin guardar</button><button id="sessionSave" class="accent">Guardar y empezar</button></div><p id="sessionStatus" role="status"></p>';document.body.append(sessionDialog);
function resetSession(){
 stop();state={key:6,mode:'minor',tempo:110,chords:[],tracks:[],chordsMuted:false,sound:'triangle'};
 history=[];future=[];version=null;selected=0;activeTrack=-1;picked.clear();
 $('sound').value='triangle';$('pattern').value='block';$('human').checked=false;$('loop').checked=true;
 $('preset').value='';$('grid').value='0.25';previewNotes=true;scaleVisible=false;
 $('previewNotes').textContent='♫ Escucha: sí';$('previewNotes').setAttribute('aria-pressed','true');$('scaleNotes').setAttribute('aria-pressed','false');
 render();fit();sessionDialog.close();toast('Nueva sesión lista.');
}
sessionButton.onclick=()=>{$('sessionStatus').textContent='';sessionDialog.showModal()};$('sessionCancel').onclick=()=>sessionDialog.close();$('sessionDiscard').onclick=resetSession;
$('sessionSave').onclick=async()=>{
 const data=JSON.stringify(state,null,2);$('sessionSave').disabled=true;$('sessionDiscard').disabled=true;
 try{
  if(typeof window.showSaveFilePicker==='function'){
   const handle=await window.showSaveFilePicker({suggestedName:'quinta-project.json',types:[{description:'Proyecto QUINTA',accept:{'application/json':['.json']}}]});
   const writable=await handle.createWritable();await writable.write(data);await writable.close();resetSession();
  }else{
   download(data,'quinta-project.json','application/json');
   $('sessionStatus').textContent='Descarga solicitada. Verificá que se haya guardado; luego pulsá “Empezar sin guardar”. Tu sesión sigue intacta.';
  }
 }catch(error){$('sessionStatus').textContent=error.name==='AbortError'?'Guardado cancelado. Se conserva tu sesión.':'No se pudo guardar. Se conserva tu sesión.'}
 finally{$('sessionSave').disabled=false;$('sessionDiscard').disabled=false}
};

function harmonyLabel(match){return names[match.root]+({Mayor:'',Menor:'m',Disminuido:'dim',Aumentado:'aug'}[match.q]??match.q)+(match.bass!==match.root?'/'+names[match.bass]:'')}
function degreeLabel(match){const d=scales[state.mode].indexOf(pc(match.root-state.key));return d<0?'Cromático':((qualities[match.q][1]===3?roman[d].toLowerCase():roman[d])+(match.q==='Disminuido'?'°':''))}
const manualTitle=title;title=function(c){if(c.manualUnknown)return c.notes.length?'Notas · sin identificar':'Dibujá notas';return manualTitle(c)};
function updateManualChord(c){
 if(!c.custom)return;
 const matches=detectHarmony(c.notes,qualities,c.root),m=matches[0];
 c.manualUnknown=!m;
 if(m){c.root=m.root;c.q=m.q;c.d=Math.max(0,scales[state.mode].indexOf(pc(m.root-state.key)));c.function=degreeLabel(m);c.explain='Reconocido: '+harmonyLabel(m)+(matches.length>1?' · Lecturas alternativas: '+matches.slice(1).map(harmonyLabel).join(', '):'');}
 else{c.function='—';c.explain='No hay una coincidencia exacta con el catálogo. Agregá al menos tres notas; no se fuerzan acordes incompletos.'}
}
const recognition=document.createElement('div');recognition.className='recognized-chords';$('chords').after(recognition);
function recognizedUI(){
 recognition.innerHTML='';if(activeTrack<0)return;
 const track=tracks()[activeTrack];if(!track)return;
 const heading=document.createElement('p');heading.className='hint';heading.textContent='Acordes detectados del canal activo · ataques simultáneos (tolerancia 60 ms). Elegí un color para editar ese grupo.';recognition.append(heading);
 harmonyGroups(track.notes,state.tempo).forEach(g=>{
  const matches=detectHarmony(g.notes,qualities),m=matches[0];if(!m)return;
  const card=document.createElement('div');card.className='recognized-card';
  const selectChord=document.createElement('button');selectChord.textContent=`${harmonyLabel(m)} · ${degreeLabel(m)} · tiempo ${Number((g.start+1).toFixed(2))}`;
  selectChord.onclick=()=>{picked=new Set(g.notes);selectionUI();audition({notes:g.notes})};card.append(selectChord);
  const color=document.createElement('select');color.setAttribute('aria-label','Color de '+harmonyLabel(m));
  Object.keys(qualities).forEach(q=>color.add(new Option(q,q)));color.value=m.q;
  color.onchange=()=>{
   checkpoint();const base=12*Math.floor(Math.min(...g.notes.map(n=>n.pitch))/12)+m.root;
   const end=Math.max(...g.notes.map(n=>n.start+n.len));track.notes=track.notes.filter(n=>!g.notes.includes(n));
   const newNotes=qualities[color.value].map(v=>({pitch:Math.min(127,base+v),start:g.start,len:end-g.start,velocity:85}));
   track.notes.push(...newNotes);picked=new Set(newNotes);render();fit();
  };card.append(color);
  if(matches.length>1){const alt=document.createElement('small');alt.textContent='También: '+matches.slice(1).map(harmonyLabel).join(', ');card.append(alt)}recognition.append(card);
 });
}
const renderBeforeSession=render;render=function(){state.chords.forEach(updateManualChord);renderBeforeSession();recognizedUI()};
const channelsBeforeRecognition=channelUI;channelUI=function(){channelsBeforeRecognition();recognizedUI()};
const gestureBeforeRecognition=noteGesture;noteGesture=function(event,entry,el){
 if(entry.track===-1)selected=entry.index;
 gestureBeforeRecognition(event,entry,el);
 // Keep the note DOM alive between clicks, otherwise the browser cannot dispatch dblclick.
 // The original gesture already renders when a drag actually changes the notes.
 if(entry.track===-1){
  const chord=entry.owner;
  $('chordname').textContent=title(chord);$('notes').textContent=chord.notes.map(n=>noteName(n.pitch)).join(' · ');
  $('degreeLabel').textContent=chord.function||roman[chord.d];
  $('quality').value=chord.q;$('duration').value=chord.duration;$('inv').value=chord.inv;
  $('explain').textContent=chord.explain||'Editá las notas o elegí otro color.';
  chordDegreeSelector();
  Array.from($('chords').children).forEach((card,i)=>card.classList.toggle('active',i===selected));
 }
};
// Drawing in an empty chord lane creates an empty measure, never a hidden preset triad.
const drawNoteBeforeSession=$('roll').ondblclick;
$('roll').ondblclick=e=>{
 if(activeTrack===-1&&e.target===$('roll')){
  const r=$('roll').getBoundingClientRect(),t=(e.clientX-r.left-52)/unit;
  const length=state.chords.reduce((sum,c)=>sum+c.duration,0);
  if(t>=length&&t>=0){checkpoint();while(state.chords.reduce((s,c)=>s+c.duration,0)<=t)state.chords.push({root:state.key,q:'Menor',d:0,duration:4,inv:0,notes:[],custom:true,manualUnknown:true});
   // Original note handler checkpoints too; coalesce into a single undo action.
   const snap=history.pop();drawNoteBeforeSession(e);history[history.length-1]=snap;return;
  }
 }
 drawNoteBeforeSession(e);
};

const synthPresets={
 velvet:{label:'Velvet · pad analógico',wave:'sawtooth',voices:3,detune:9,attack:.16,release:.35,cutoff:1700},
 glass:{label:'Glass · pluck brillante',wave:'triangle',voices:2,detune:4,attack:.006,release:.12,cutoff:6000},
 brass:{label:'Brass · polysynth',wave:'sawtooth',voices:2,detune:7,attack:.025,release:.14,cutoff:2600},
 hollow:{label:'Hollow · pulse keys',wave:'square',voices:1,detune:0,attack:.01,release:.1,cutoff:1200},
 shimmer:{label:'Shimmer · octavas',wave:'sine',voices:2,detune:0,attack:.04,release:.3,cutoff:6500}
};
Object.entries(synthPresets).forEach(([id,p])=>$('sound').add(new Option(p.label,id)));
const plainTone=tone;tone=function(p,t,len,v=90){
 const preset=synthPresets[$('sound').value];if(!preset)return plainTone(p,t,len,v);
 const filter=ctx.createBiquadFilter(),amp=ctx.createGain();filter.type='lowpass';filter.Q.value=.7;
 filter.frequency.setValueAtTime(preset.cutoff,t);filter.frequency.exponentialRampToValueAtTime(Math.max(250,preset.cutoff*.35),t+Math.max(.03,len));filter.connect(amp);amp.connect(voiceOutput());
 const peak=.055*Math.max(0,Math.min(127,v))/127/preset.voices,attack=Math.min(preset.attack,len/2),end=t+len+preset.release;
 amp.gain.setValueAtTime(0,t);amp.gain.linearRampToValueAtTime(peak,t+attack);amp.gain.exponentialRampToValueAtTime(Math.max(.0001,peak*.45),t+Math.max(attack+.01,len));amp.gain.exponentialRampToValueAtTime(.0001,end);
 let remaining=preset.voices;
 for(let i=0;i<preset.voices;i++){const o=ctx.createOscillator();o.type=preset.wave;o.frequency.value=440*2**((p-69)/12)*(preset===synthPresets.shimmer&&i?2:1);o.detune.value=(i-(preset.voices-1)/2)*preset.detune;o.connect(filter);o.start(t);o.stop(end+.02);timers.push(o);o.onended=()=>{o.disconnect();timers=timers.filter(x=>x!==o);if(!--remaining){filter.disconnect();amp.disconnect()}}}
};
$('sound').onchange=()=>{stop();state.sound=$('sound').value;localStorage.setItem('quinta',JSON.stringify(state))};
if(state.sound)$('sound').value=state.sound;

// Browser drag payload is best-effort, not a native OS file promise.
$('export').draggable=true;$('export').title='Clic: descargar MIDI. Arrastre web experimental; para Ableton usá el archivo descargado.';
$('export').ondragstart=e=>{
 try{const file=new File([midi()],'quinta-progression.mid',{type:'audio/midi'});e.dataTransfer.items.add(file);e.dataTransfer.effectAllowed='copy';toast('Arrastre web experimental. Si Ableton no acepta, descargá el MIDI y arrastrá el archivo.')}catch{e.preventDefault();toast('Usá clic para descargar el MIDI.')}
};
// Older versions could persist NaN timing as JSON null after the empty-grid bug.
// Preserve the complete original before repairing only invalid timing fields.
function repairInvalidTiming(){
 const invalid=entries().filter(e=>!Number.isFinite(e.n.start)||e.n.start<0||!Number.isFinite(e.n.len)||e.n.len<=0);
 if(!invalid.length)return 0;
 try{localStorage.setItem('quinta-timing-recovery-'+Date.now(),JSON.stringify(state))}catch{return 0}
 invalid.forEach(e=>{
  if(!Number.isFinite(e.n.start)||e.n.start<0)e.n.start=0;
  if(!Number.isFinite(e.n.len)||e.n.len<=0)e.n.len=e.track===-1?Math.max(.25,e.owner.duration-e.n.start):1;
 });
 return invalid.length;
}
const repairedTiming=repairInvalidTiming();render();fit();
if(repairedTiming)toast(`Se reparó el timing inválido de ${repairedTiming} nota(s). Se conservó una copia local del proyecto anterior.`);

function replaceSelectedDegree(value){
 if(value===''||value===null)return;
 const d=Number(value),current=state.chords[selected];
 if(!current||!Number.isInteger(d)||d<0||d>6)return;
 checkpoint();
 const replacement=degree(d);
 replacement.duration=current.duration;
 replacement.function=degreeLabel(replacement);
 replacement.explain='Acorde de la escala. Podés agregar séptimas, novenas u otras variantes con Color.';
 state.chords[selected]=materialize(replacement);
 activeTrack=-1;picked.clear();$('bass').value='';
 render();
 if(previewNotes)audition(state.chords[selected]);
}
function chordDegreeSelector(){
 const current=typeof inspectorChord==='function'?inspectorChord():state.chords[selected];
 if(!current)return;
 const selector=document.createElement('select');
 selector.id='replaceChordDegree';selector.className='chord-degree-select';
 selector.setAttribute('aria-label','Reemplazar acorde seleccionado por un grado de la escala');
 selector.title='Reemplazar en esta posición. Mantiene la duración y usa la tríada del grado elegido.';
 const candidates=Array.from({length:7},(_,d)=>degree(d));
 const match=current.manualUnknown?-1:candidates.findIndex(c=>c.root===current.root&&c.q===current.q);
 if(match<0){const present=new Option(title(current)+' · actual','');present.disabled=true;selector.add(present)}
 candidates.forEach((c,d)=>selector.add(new Option(`${title(c)} · ${degreeLabel(c)}`,String(d))));
 selector.value=match<0?'':String(match);
 selector.onchange=()=>replaceSelectedDegree(selector.value);
 $('chordname').textContent='';$('chordname').append(selector);
}
const renderBeforeDegreeSelector=render;
render=function(){renderBeforeDegreeSelector();chordDegreeSelector()};
render();

const localHistory=document.createElement('div');localHistory.className='local-history';
for(const [target,label] of [['undo','↶ Deshacer'],['redo','↷ Rehacer']]){
 const button=document.createElement('button');button.textContent=label;
 button.onclick=() => $(target).click();localHistory.append(button);
}
editor.querySelector('.sectiontitle').append(localHistory);
const detailDelete=$('delete');
detailDelete.textContent='Delete';detailDelete.title='Eliminar el acorde seleccionado de la progresión';
const detailHeading=document.createElement('div');detailHeading.className='detail-heading';
$('chordname').before(detailHeading);detailHeading.append($('chordname'),detailDelete);
const renderBeforeDeleteState=render;
render=function(){renderBeforeDeleteState();detailDelete.disabled=!state.chords[selected]};
render();

// Audition only changes caused by a gesture, not every pointer event.
function auditionPitchChanges(previous,notes){
 const heard=new Set();
 for(const note of notes){
  if(previous.has(note)&&previous.get(note)!==note.pitch&&!heard.has(note.pitch)){
   listen(note);heard.add(note.pitch);
  }
  previous.set(note,note.pitch);
 }
}
function auditionSelectionEntries(previous,current){
 const heard=new Set();
 for(const note of current)if(!previous.has(note)&&!heard.has(note.pitch)){
  listen(note);heard.add(note.pitch);
 }
}
const gestureBeforeLiveAudition=noteGesture;
const instrumentScript=document.createElement('script');instrumentScript.src='instruments.js';document.body.append(instrumentScript);
instrumentScript.onload=()=>{const inspectorScript=document.createElement('script');inspectorScript.src='inspector.js';inspectorScript.onload=()=>{const workflowScript=document.createElement('script');workflowScript.src='workflow.js';document.body.append(workflowScript)};document.body.append(inspectorScript)};
noteGesture=function(event,entry,element){
 gestureBeforeLiveAudition(event,entry,element);
 if(event.shiftKey)return;
 const move=element.onpointermove;
 const previous=new Map([...picked].map(n=>[n,n.pitch]));
 if(move)element.onpointermove=e=>{
  move(e);
  auditionPitchChanges(previous,picked);
 };
};
const marqueeBeforeLiveAudition=$('roll').onpointerdown;
$('roll').onpointerdown=event=>{
 marqueeBeforeLiveAudition(event);
 if(event.target!==$('roll'))return;
 const move=$('roll').onpointermove;
 let previous=new Set(picked);
 if(move)$('roll').onpointermove=e=>{
  move(e);
  auditionSelectionEntries(previous,picked);
  previous=new Set(picked);
 };
};
