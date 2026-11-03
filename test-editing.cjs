const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {sandbox,run,get,Element}=require('./test-studio.cjs');
Element.prototype.removeAttribute=function(){};Element.prototype.close=function(){};
Element.prototype.setPointerCapture=function(){};
Element.prototype.getBoundingClientRect=function(){return {left:-130,top:-80}};
sandbox.window={};
// Real selects reject values that don't exactly match an option. The old mock did not.
const html=fs.readFileSync('index.html','utf8'),gridHTML=html.match(/<select id="grid">(.*?)<\/select>/)[1];
const allowed=[...gridHTML.matchAll(/value="([^"]+)"/g)].map(m=>m[1]);let value='0.25';
Object.defineProperty(get('grid'),'value',{get:()=>value,set:v=>{value=allowed.includes(String(v))?String(v):''},configurable:true});
vm.runInContext(fs.readFileSync('harmony.js','utf8'),sandbox);vm.runInContext(fs.readFileSync('session.js','utf8'),sandbox);
run('resetSession();previewNotes=false');assert.equal(get('grid').value,'0.25');
run('[0,2,3,4].forEach(d=>add(degree(d)));selected=0;render()');
const first=run('JSON.stringify(state.chords[0])');
// Move the third of chord 2 down one semitone: A major becomes A minor.
run(`var entry=entries().find(e=>e.index===1&&e.n.pitch===61);
 var element=$('roll').children.find(el=>el._entry===undefined?false:el._entry.n===entry.n);
 noteGesture({preventDefault(){},stopPropagation(){},shiftKey:false,clientX:250,clientY:150,offsetX:10,pointerId:1},entry,element);
 element.onpointermove({clientX:250,clientY:150+rowHeight});element.onpointerup({});`);
assert.equal(run('selected'),1);assert.equal(run('state.chords[1].q'),'Menor');
assert.equal(run('state.chords[1].notes[1].pitch'),60);
assert.equal(run('state.chords[1].notes[1].start'),0);
assert.equal(run('entries().find(e=>e.index===1).offset'),4);
assert.equal(run('JSON.stringify(state.chords[0])'),first);
assert.equal(run('state.chords.every(c=>c.notes.every(n=>Number.isFinite(n.start)&&Number.isFinite(n.len)))'),true);
// Draw E over F# minor (first chord), yielding F#m7, with scrolled roll coordinates.
run(`$('roll').ondblclick({target:$('roll'),clientX:-130+52+unit*.1,clientY:-80+(topPitch-64)*rowHeight+1})`);
assert.equal(run('selected'),0);assert.equal(run('state.chords[0].q'),'m7');assert.equal(run('state.chords[0].notes.length'),4);
// Invalid grid state is repaired, not allowed to produce NaN or a rejected draw.
get('grid').value='.25';assert.equal(get('grid').value,'');
run(`$('roll').ondblclick({target:$('roll'),clientX:-130+52+unit*4.1,clientY:-80+(topPitch-67)*rowHeight+1})`);
assert.equal(get('grid').value,'0.25');assert.equal(run('selected'),1);assert.equal(run('state.chords[1].q'),'m7');
assert.equal(run('state.chords[1].notes.at(-1).start'),0);
// Notes in other channels cannot steal edits after clicking a progression card.
run(`tracks().push({name:'Melodía',notes:[],muted:false});activeTrack=0;audition=()=>{};selectChord(2)`);
assert.equal(run('activeTrack'),-1);assert.equal(run('selected'),2);
run(`$('roll').ondblclick({target:$('roll'),clientX:-130+52+unit*8.1,clientY:-80+(topPitch-69)*rowHeight+1})`);
assert.equal(run('state.chords[2].q'),'m7');assert.equal(run('tracks()[0].notes.length'),0);
run('$("undo").click()');assert.equal(run('state.chords[2].notes.length'),3);
console.log('PASS: real-select reset, second-chord drag, scrolled double-click, invalid-grid fallback, automatic chord names, active channel and undo.');
run('state.chords[1].notes[0].start=null;state.chords[1].notes[0].len=null');
assert.equal(run('repairInvalidTiming()'),1);
assert.equal(run('state.chords[1].notes[0].start'),0);assert.equal(run('state.chords[1].notes[0].len'),4);

// Inspector replacement is in-place; the seven options follow key and mode.
run('selected=2;state.chords[2].duration=8;render();previewNotes=false');
const beforeReplace=run('JSON.stringify(state)');
const untouched=run('JSON.stringify([state.chords[0],state.chords[1],state.chords[3],state.tracks])');
get('chordname').children.at(-1).value='5';get('chordname').children.at(-1).onchange();
assert.equal(run('state.chords.length'),4);assert.equal(run('selected'),2);
assert.equal(run('state.chords[2].root'),2);assert.equal(run('state.chords[2].q'),'Mayor');
assert.equal(run('state.chords[2].duration'),8);assert.equal(run('state.chords[2].notes.every(n=>n.len===8)'),true);
assert.equal(run('JSON.stringify([state.chords[0],state.chords[1],state.chords[3],state.tracks])'),untouched);
run('$("undo").click()');assert.equal(run('JSON.stringify(state)'),beforeReplace);
run('$("redo").click()');assert.equal(run('state.chords[2].root'),2);
for(const mode of ['major','minor','harmonic','melodic']){
 run(`state.mode='${mode}';state.key=0`);
 for(let d=0;d<7;d++){
  const expected=run(`JSON.stringify(degree(${d}))`);run(`replaceSelectedDegree('${d}')`);
  assert.equal(run('state.chords[2].root'),JSON.parse(expected).root);
  assert.equal(run('state.chords[2].q'),JSON.parse(expected).q);
 }
}
run('state.chords=[];render();replaceSelectedDegree("1")');assert.equal(run('state.chords.length'),0);
console.log('PASS: inspector degree replacement UI, duration, untouched siblings/tracks, undo/redo, all seven degrees in four modes and empty progression.');
run(`var heard=[];listen=n=>{if(previewNotes)heard.push(n.pitch)};previewNotes=true;
var n1={pitch:64},n2={pitch:67};var previous=new Map([[n1,64],[n2,67]]);
n1.pitch=63;n2.pitch=66;auditionPitchChanges(previous,new Set([n1,n2]));
auditionPitchChanges(previous,new Set([n1,n2]));`);
assert.equal(run('heard.join()'),'63,66');
run('heard=[];auditionSelectionEntries(new Set(),new Set([n1,n2]));auditionSelectionEntries(new Set([n1,n2]),new Set([n1,n2]))');
assert.equal(run('heard.join()'),'63,66');
run('heard=[];previewNotes=false;n1.pitch=62;auditionPitchChanges(previous,new Set([n1]));auditionSelectionEntries(new Set(),new Set([n1]))');
assert.equal(run('heard.length'),0);
console.log('PASS: live pitch audition, selection entry audition, unchanged-event suppression and mute toggle.');
