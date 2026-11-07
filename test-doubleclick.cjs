require('./test-editing.cjs');
const {run,get}=require('./test-studio.cjs');
const assert=require('node:assert/strict');
const {buildPlugg,pluggPresets}=require('./plugg.js');
const chords=buildPlugg(pluggPresets[6],6,110,{spread:18});let off=0,notes=[];
for(const c of chords){notes.push(...c.notes.map(n=>({...n,start:n.start+off})));off+=c.duration}
run(`state.chords=[0,2,3,4].map(d=>materialize(degree(d)));state.tracks=[{name:'Plugg · Regreso R&B',notes:${JSON.stringify(notes)},muted:false}];activeTrack=0;previewNotes=false;picked.clear();render()`);
const before=run('JSON.stringify(state.tracks[0].notes)');
run(`var targetNote=state.tracks[0].notes.find(n=>n.start>=8);var noteElement=$('roll').children.find(el=>el._entry?.n===targetNote);`);
const stableNode=run('noteElement');
for(let click=0;click<2;click++){
 run(`noteElement.onpointerdown({preventDefault(){},stopPropagation(){},shiftKey:false,clientX:400,clientY:200,offsetX:10,pointerId:1});noteElement.onpointerup({})`);
 assert(get('roll').children.includes(stableNode),'Click must preserve the DOM target until dblclick');
}
run('noteElement.ondblclick({stopPropagation(){}})');
assert.equal(run('state.tracks[0].notes.includes(targetNote)'),false);
run('localHistory.children[0].click()');assert.equal(run('JSON.stringify(state.tracks[0].notes)'),before);
run('localHistory.children[1].click()');assert.equal(run('state.tracks[0].notes.length'),notes.length-1);
run('activeTrack=-1;selected=2;render();detailDelete.click()');assert.equal(run('state.chords.length'),3);
run('localHistory.children[0].click()');assert.equal(run('state.chords.length'),4);
run("state.tracks=[{name:'Grid',notes:[]}];activeTrack=0;previewNotes=false;$('roll').getBoundingClientRect=()=>({left:0,top:0});playing=true;render()");
for(const [grid,length] of [['0.25',.25],['0.5',.5],['1',1]]){
 get('grid').value=grid;run("tracks()[0].notes=[];render();$('roll').ondblclick({target:$('roll'),clientX:53,clientY:1})");
 assert.equal(run('tracks()[0].notes[0].len'),length,`New note must fill one ${grid} grid cell`);
 assert.equal(run('playing'),true,'Drawing a note must preserve playback');
}
run("$('grid').value='.25';tracks()[0].notes[0].len=.25;render();var edited=tracks()[0].notes[0];var entry=entries().find(e=>e.n===edited);var noteNode=$('roll').children.find(el=>el._entry?.n===edited);noteNode.clientWidth=14;noteNode.setPointerCapture=()=>{};noteGesture({preventDefault(){},stopPropagation(){},shiftKey:false,clientX:100,clientY:100,offsetX:13,pointerId:1},entry,noteNode);noteNode.onpointermove({clientX:100+unit*.25,clientY:100});noteNode.onpointerup({})");
assert.equal(run('edited.len'),.5);assert.equal(run('playing'),true,'Resizing a note must preserve playback');
run('picked=new Set([edited]);transposeSelection(-1)');assert.equal(run('playing'),true,'Arrow key pitch edits must preserve playback');
console.log('PASS: stable note target across two clicks, third plugg chord note deletion, local undo/redo, inspector Delete and recovery.');
