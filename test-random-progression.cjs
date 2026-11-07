const {run,get}=require('./test-studio.cjs');
const assert=require('node:assert/strict');
const templates=[[0,4,5,3],[0,5,3,4],[5,3,0,4],[0,3,5,4],[0,2,3,4],[5,4,3,0],[0,5,2,6],[0,6,5,6],[5,6,0,0],[0,3,4,0],[0,1,4,0],[0,5,1,4]];
const modes=['major','minor','harmonic','melodic'];
run('Math.random=()=>0');
for(let key=0;key<12;key++)for(const mode of modes){
 run(`state.key=${key};state.mode=${JSON.stringify(mode)};state.tempo=123;state.chords=[materialize(degree(0))];state.tracks=[{name:'Drums',notes:[{pitch:36,start:0,len:1,velocity:90}],muted:false}];state.loopRegion={start:2,end:9};activeTrack=-1;selected=0;picked=new Set(state.chords[0].notes);lastRandomProgression=null;history=[];future=[];render()`);
 const expected=run(`templatesDummy=0;${JSON.stringify(templates)}.map(ds=>ds.map(d=>degree(d,state.mode))).filter(cs=>cs.every(c=>c.q==='Mayor'||c.q==='Menor')).length`);
 assert.ok(expected>0,`${mode} key ${key} has compatible templates`);
 get('randomProgression').click();
 assert.equal(run('state.chords.length'),4);assert.equal(run('state.chords.reduce((s,c)=>s+c.duration,0)'),16);
 assert.equal(run("state.chords.every(c=>(c.q==='Mayor'||c.q==='Menor')&&c.notes.every(n=>n.pitch>=0&&n.pitch<=127&&scales[state.mode].some(x=>pc(state.key+x)===pc(n.pitch))))"),true,`${mode} key ${key} triads are in scale and MIDI range`);
 assert.equal(run('state.tracks.length'),1);assert.equal(run("state.tracks[0].name==='Drums'&&state.tracks[0].notes[0].pitch===36"),true);
 assert.equal(run('state.loopRegion.end'),16);
 if(mode==='major'){assert.ok(run('degree(1).q')==='Mayor'||run('degree(1).q')==='Menor','major second degree is a major/minor triad');assert.ok(templates.some(ds=>ds.includes(1)&&run(`${JSON.stringify(ds)}.map(d=>degree(d,state.mode)).every(c=>c.q==='Mayor'||c.q==='Menor')`)),'major second degree appears in a compatible template')}
 const seq1=run('lastRandomProgression');get('randomProgression').click();assert.notEqual(run('lastRandomProgression'),seq1,'consecutive sequence differs');
 run('$\u0028"undo"\u0029.click()');assert.equal(run('state.chords.length'),4);run('$\u0028"undo"\u0029.click()');assert.equal(run('state.chords.length'),1);run('$\u0028"redo"\u0029.click()');assert.equal(run('state.chords.length'),4);
}
// An empty compatible candidate set leaves both project state and history untouched.
run('randomChordCountButton.click()');assert.equal(run('randomChordCount'),2);
get('randomProgression').click();assert.equal(run('state.chords.length'),2);assert.equal(run('state.chords.map(c=>c.duration).join()'),'8,8');assert.equal(run('state.chords.every(c=>c.notes.every(n=>n.len===c.duration))'),true);
run('randomChordCountButton.click()');assert.equal(run('randomChordCount'),3);
get('randomProgression').click();assert.equal(run('state.chords.length'),3);assert.equal(run('state.chords.map(c=>c.duration).join()'),'4,4,8');
run('randomChordCountButton.click()');assert.equal(run('randomChordCount'),4);
run('state.key=0;state.mode="major";history=[];future=[];state.chords=[materialize(degree(0))];activeTrack=-1;render()');
const before=run('JSON.stringify(state)'),hist=run('history.length');assert.equal(run('generateRandomProgression([])'),false);assert.equal(run('JSON.stringify(state)'),before);assert.equal(run('history.length'),hist);
console.log('PASS random progression: 48 key/mode combinations, diatonic major/minor triads, 16 beats, MIDI bounds, preserved channels, consecutive variety and undo/redo/no-candidate behavior.');
