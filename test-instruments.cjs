require('./test-editing.cjs');
const {sandbox,run}=require('./test-studio.cjs');
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const param=()=>({setValueAtTime(){},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){},setTargetAtTime(){}});
const node=()=>({frequency:param(),gain:param(),detune:param(),Q:{},connect(){},disconnect(){},start(){},stop(){}});
sandbox.bassTestContext={createOscillator:node,createGain:node,createBiquadFilter:node,destination:{}};
vm.runInContext(fs.readFileSync('instruments.js','utf8'),sandbox);
run('ctx=bassTestContext;timers=[]');
for(const preset of run('Object.keys(bassPresets)')){
 run(`tone(36,1,.25,100,'${preset}')`);
 assert(run('timers.length')>0);run('stop()');
}
run(`state.chords=[];state.tracks=[{name:'Sub',instrument:'sub',notes:[{pitch:36,start:0,len:1,velocity:90}]},{name:'Reese',instrument:'reese',notes:[{pitch:40,start:0,len:1,velocity:90}]}]`);
assert.equal(run('events().map(n=>n.instrument).join()'),'sub,reese');
run('bassButton.onclick()');assert.equal(run('tracks().at(-1).instrument'),'punch');
run('$("undo").click()');assert.equal(run('tracks().length'),2);
console.log('PASS: eight bass voices schedule, independent channel routing, bass channel creation and undo. Audio quality requires listening.');
