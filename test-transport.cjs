const {sandbox,run,get}=require('./test-studio.cjs');
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
let pump;sandbox.setTimeout=fn=>{pump=fn;return 1};sandbox.clearTimeout=()=>{};
vm.runInContext(fs.readFileSync('transport.js','utf8'),sandbox);
run(`state.chords=[materialize(degree(0))];state.tracks=[];state.tempo=120;ctx={currentTime:0};audio=()=>{};var scheduledAudio=[];tone=(p,t,len)=>{scheduledAudio.push({p,t,len});timers.push({stop(){}})};$('loop').checked=true;$('human').checked=false;`);
run('activeTrack=-1');assert.equal(run('loopBeats()'),4);assert.equal(run('timeline()'),4);
for(const [snap,count] of [['0.25',17],['0.5',9],['1',5]]){
 get('grid').value=snap;get('grid').onchange();
 assert.equal(get('roll').children.filter(el=>el.className?.startsWith('beatline')).length,count);
}
run('play()');assert.equal(run('scheduledAudio.length'),3);
const oldPitch=run('state.chords[0].notes[0].pitch');run('state.chords[0].notes[0].pitch+=1');
run('ctx.currentTime=1.9');pump();assert.equal(run('scheduledAudio.length'),6);
assert.equal(run('scheduledAudio[3].p'),oldPitch+1);
assert(Math.abs(run('scheduledAudio[3].t-scheduledAudio[0].t')-2)<1e-9);
run('ctx.currentTime=3.9');pump();assert.equal(run('scheduledAudio.length'),9);
assert(Math.abs(run('scheduledAudio[6].t-scheduledAudio[3].t')-2)<1e-9);
run('stop();scheduledAudio=[];ctx.currentTime=0;$("loop").checked=false;play();ctx.currentTime=2.05');pump();
assert.equal(run('playing'),false);assert.equal(run('scheduledAudio.length'),3);
run('state.chords=[];state.tracks=[{notes:[{start:0,len:7.88,pitch:60,velocity:90}]}]');assert.equal(run('loopBeats()'),8);
console.log('PASS: 1/16, 1/8 and 1/4 grid line counts, short loop extent, exact consecutive audio timestamps, one-shot stop and channel bar boundary.');
run('state.tracks[0].notes[0].len=6.12');assert.equal(run('loopBeats()'),6.25);
run('state.loopRegion={start:2,end:6};ctx.currentTime=0;scheduledAudio=[];$("loop").checked=true;play()');
assert.equal(run('scheduledAudio.length'),1);assert.equal(run('scheduledAudio[0].len'),2);
assert(Math.abs(run('scheduledAudio[0].t')-.04)<1e-9);
run('ctx.currentTime=1.9');pump();assert(Math.abs(run('scheduledAudio[1].t-scheduledAudio[0].t')-2)<1e-9);
run('ensureRange();drawRoll()');assert.equal(run('topPitch'),127);assert.equal(run('bottomPitch'),0);
assert.equal(get('roll').children.filter(e=>e.className?.startsWith('key ')).length,128);
console.log('PASS: no full-bar padding, custom loop start/end and clipped notes, exact subregion repetition, all 128 MIDI rows.');
