require('./test-inspector.cjs');const {run}=require('./test-studio.cjs'),assert=require('node:assert/strict');
run('activeTrack=-1;state.mode="minor";state.chords=[0,2,3,4].map(d=>materialize(degree(d)));picked=new Set(state.chords.flatMap(c=>c.notes));selectionUI()');assert.equal(run('$("chordname").textContent'),'4 acordes seleccionados');
const timing=run('JSON.stringify(state.chords.map(c=>c.notes.map(n=>[n.start,n.len])))');
for(const inversion of [1,2,0]){run(`$('inv').onchange({target:{value:'${inversion}'}})`);assert.equal(run(`state.chords.every(c=>pc(Math.min(...c.notes.map(n=>n.pitch))-c.root)===qualities[c.q][${inversion}])`),true);assert.equal(run('JSON.stringify(state.chords.map(c=>c.notes.map(n=>[n.start,n.len])))'),timing)}
run('state.tracks=[{notes:state.chords.flatMap((c,i)=>c.notes.map(n=>({...n,start:n.start+i*4})))}];activeTrack=0;picked=new Set(tracks()[0].notes);$("inv").onchange({target:{value:"1"}})');assert.equal(run('selectedChordGroups().every(g=>pc(g.match.bass-g.match.root)===qualities[g.match.q][1])'),true);
console.log('PASS batch inversion main and extra channel, return to root and unchanged timing');

