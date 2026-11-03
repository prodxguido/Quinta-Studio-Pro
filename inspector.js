// A channel selection is an edit target, not a second copy of the main progression.
function channelChordTarget(){
 if(activeTrack<0)return null;
 const track=tracks()[activeTrack];if(!track)return null;
 const selectedNotes=track.notes.filter(n=>picked.has(n));if(!selectedNotes.length)return null;
 const notes=harmonyGroups(selectedNotes,state.tempo)[0].notes;
 const matches=detectHarmony(notes,qualities),match=matches[0];if(!match)return null;
 const start=Math.min(...notes.map(n=>n.start)),end=Math.max(...notes.map(n=>n.start+n.len));
 const intervals=qualities[match.q].map(pc),bassInterval=pc(match.bass-match.root);
 const chord={root:match.root,q:match.q,d:Math.max(0,scales[state.mode].indexOf(pc(match.root-state.key))),duration:end-start,inv:Math.max(0,intervals.indexOf(bassInterval)),function:degreeLabel(match),notes:notes.map(n=>({...n,start:n.start-start}))};
 return {track,notes,start,chord,match};
}
function inspectorChord(){return activeTrack<0?state.chords[selected]:channelChordTarget()?.chord}
const inspectorControls=['quality','inv','duration','bass','openvoicing','omit','duplicate','delete'];
function syncChannelInspector(){
 const target=channelChordTarget();
 inspectorControls.forEach(id=>$(id).disabled=activeTrack>=0?!target:!state.chords[selected]);
 // These act on a whole progression, not a selected group of channel notes.
 ['voice','insert'].forEach(id=>$(id).disabled=activeTrack>=0);
 if(activeTrack<0){
  const indices=entries().filter(e=>e.track===-1&&picked.has(e.n)).map(e=>e.index);
  if(indices.length)selected=Math.min(...indices);
  const c=state.chords[selected];if(!c)return;
  $('chordname').textContent=title(c);$('notes').textContent=c.notes.map(n=>noteName(n.pitch)).join(' · ');
  $('degreeLabel').textContent=c.function||roman[c.d];$('quality').value=c.q;$('inv').value=String(c.inv);$('duration').value=String(c.duration);
  $('explain').textContent=c.explain||'Editando el acorde seleccionado en el piano roll.';
  chordDegreeSelector();Array.from($('chords').children).forEach((card,i)=>card.classList.toggle('active',i===selected));return;
 }
 if(!target){$('chordname').textContent='Seleccioná un acorde';$('degreeLabel').textContent='';$('notes').textContent='Seleccioná sus notas con el rectángulo o Shift + clic.';$('explain').textContent='El detalle edita sólo las notas seleccionadas del canal activo. Se requieren al menos tres alturas reconocibles.';return}
 const {chord,match}=target;
 $('chordname').textContent=harmonyLabel(match);$('degreeLabel').textContent=chord.function;
 $('notes').textContent=target.notes.map(n=>noteName(n.pitch)).join(' · ');
 $('quality').value=chord.q;$('inv').value=String(chord.inv);$('duration').value=String(chord.duration);$('bass').value='';
 $('explain').textContent='Editando selección en '+target.track.name+'. Las otras notas del canal se conservan.';
 chordDegreeSelector();
}
function commitChannelEdit(fn){
 const target=channelChordTarget();if(!target)return;
 checkpoint();fn(target.chord);
 target.track.notes=target.track.notes.filter(n=>!target.notes.includes(n));
 const updated=target.chord.notes.map(n=>({...n,start:n.start+target.start}));
 target.track.notes.push(...updated);picked=new Set(updated);render();
}
const progressionEdit=edit;edit=function(fn){if(activeTrack>=0)commitChannelEdit(fn);else progressionEdit(fn)};
const originalInversion=$('inv').onchange;
$('inv').onchange=event=>{
 if(activeTrack<0)return originalInversion(event);
 const desired=Number(event.target.value);
 commitChannelEdit(chord=>{
  let delta=desired-chord.inv;
  while(delta!==0){
   chord.notes.sort((a,b)=>a.pitch-b.pitch);
   const note=delta>0?chord.notes[0]:chord.notes[chord.notes.length-1];
   const pitch=note.pitch+(delta>0?12:-12);
   if(pitch<0||pitch>127)break;
   note.pitch=pitch;delta+=delta>0?-1:1;
  }
 });
};
for(const id of ['duplicate','delete']){
 const original=$(id).onclick;
 $(id).onclick=()=>{
  if(activeTrack<0)return original();
  const target=channelChordTarget();if(!target)return;
  checkpoint();
  if(id==='delete'){target.track.notes=target.track.notes.filter(n=>!target.notes.includes(n));picked.clear()}
  else{const copies=target.notes.map(n=>({...n,start:n.start+target.chord.duration}));target.track.notes.push(...copies);picked=new Set(copies)}
  render();
 };
}
const originalReplaceDegree=replaceSelectedDegree;
replaceSelectedDegree=function(value){
 if(activeTrack<0)return originalReplaceDegree(value);
 if(value===''||!Number.isInteger(Number(value))||Number(value)<0||Number(value)>6)return;
 commitChannelEdit(c=>{const next=degree(Number(value));next.duration=c.duration;materialize(next);Object.assign(c,next)})
};
const selectionBeforeInspector=selectionUI;
selectionUI=function(){selectionBeforeInspector();syncChannelInspector()};
const channelsBeforeInspector=channelUI;
channelUI=function(){channelsBeforeInspector();syncChannelInspector()};
const renderBeforeUnifiedInspector=render;
render=function(){renderBeforeUnifiedInspector();syncChannelInspector()};
render();
// Batch inversion targets complete chords, never an accidental fragment.
function selectedChordGroups(){
 const groups=activeTrack<0?state.chords.map(c=>({notes:c.notes,owner:c,root:c.root})):harmonyGroups(tracks()[activeTrack]?.notes||[],state.tempo);
 return groups.filter(g=>g.notes.length&&g.notes.every(n=>picked.has(n))).map(g=>{const match=detectHarmony(g.notes,qualities,g.root)[0];return match?{...g,match}:null}).filter(Boolean);
}
const syncBeforeBatch=syncChannelInspector;
syncChannelInspector=function(){
 syncBeforeBatch();const groups=selectedChordGroups();if(groups.length<2)return;
 $('chordname').textContent=groups.length+' acordes seleccionados';$('degreeLabel').textContent='Edición múltiple';
 $('notes').textContent=groups.map(g=>harmonyLabel(g.match)).join(' · ');
 $('explain').textContent='La inversión se aplica a cada acorde completo seleccionado. Conserva notas, tiempos y duraciones. Tercera inversión requiere acordes de cuatro alturas o más.';
 for(const id of ['quality','duration','bass','openvoicing','omit','insert'])$(id).disabled=true;
 $('inv').disabled=false;
 const inversions=groups.map(g=>qualities[g.match.q].map(pc).indexOf(pc(g.match.bass-g.match.root)));
 $('inv').value=inversions.every(i=>i===inversions[0])?String(inversions[0]):'';
 if($('inv').options)Array.from($('inv').options).forEach(o=>o.disabled=groups.some(g=>Number(o.value)>=qualities[g.match.q].length));
};
const invertSingle=$('inv').onchange;
$('inv').onchange=event=>{
 const groups=selectedChordGroups();if(groups.length<2)return invertSingle(event);
 const desired=Number(event.target.value);if(!Number.isInteger(desired)||desired<0)return;
 const plans=[];
 for(const g of groups){const intervals=qualities[g.match.q];if(desired>=intervals.length)return toast('Esa inversión requiere más notas en todos los acordes seleccionados.');
  const target=pc(g.match.root+intervals[desired]);const notes=g.notes.map(n=>({note:n,pitch:n.pitch})).sort((a,b)=>a.pitch-b.pitch);
  const current=intervals.map(pc).indexOf(pc(notes[0].pitch-g.match.root));
  let tries=0;while(pc(notes[0].pitch)!==target&&tries++<notes.length*2){if(desired>=current){const n=notes.shift();while(n.pitch<=notes.at(-1).pitch)n.pitch+=12;notes.push(n)}else{const n=notes.pop();while(n.pitch>=notes[0].pitch)n.pitch-=12;notes.unshift(n)}}
  if(notes.some(n=>n.pitch<0||n.pitch>127)||pc(notes[0].pitch)!==target)return toast('No se puede aplicar la inversión dentro del rango MIDI.');plans.push({g,notes});
 }
 checkpoint();plans.forEach(({g,notes})=>{notes.forEach(n=>n.note.pitch=n.pitch);if(g.owner){g.owner.inv=desired;g.owner.custom=true}});render();
};
const syncBatchOptions=syncChannelInspector;
syncChannelInspector=function(){if($('inv').options)Array.from($('inv').options).forEach(o=>o.disabled=false);syncBatchOptions()};
