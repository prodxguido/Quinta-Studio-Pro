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
console.log('PASS: stable note target across two clicks, third plugg chord note deletion, local undo/redo, inspector Delete and recovery.');
