require('./test-editing.cjs');
const {sandbox,run,get}=require('./test-studio.cjs');const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
vm.runInContext(fs.readFileSync('instruments.js','utf8'),sandbox);
vm.runInContext(fs.readFileSync('workflow.js','utf8'),sandbox);
vm.runInContext(fs.readFileSync('composer.js','utf8'),sandbox);
run('state.chords=[materialize(degree(0)),materialize(degree(3))];state.tracks=[];activeTrack=-1;composeChannel("bass")');
assert.equal(run('tracks()[0].notes.length'),2);assert.equal(run('tracks()[0].notes[0].len'),4);assert.equal(run('tracks()[0].instrument'),'punch');
assert.equal(run('tracks()[0].notes.every(n=>n.pitch>=36&&n.pitch<=47)'),true);
run('state.tracks[0].volume=0');assert.equal(run('events().some(n=>n.instrument==="punch")'),false);
assert.equal(run('channelVolumeDb(1)'),0);assert.equal(run('channelVolumeGain(0)'),1);assert.equal(run('channelVolumeGain(-61)'),0);
run('state.chords=[materialize(degree(0))];activeTrack=-1;render();playing=true');
const mixerRow=get('trackList').children[0],volumeLabel=mixerRow.children.find(e=>e.className==='mixer-volume'),volumeSlider=volumeLabel.children[1].children[0];
volumeSlider.value='-12';volumeSlider.oninput();volumeSlider.onchange();
assert.equal(run('playing'),true);assert.equal(get('trackList').children[0],mixerRow);assert(Math.abs(run('state.chordVolume')-10**(-12/20))<1e-9);
run('playing=false');
for(const v of ['0.125','0.0625','0.03125']){Object.defineProperty(get('grid'),'value',{value:v,writable:true,configurable:true});assert.equal(run('gridStep()'),Number(v))}
run('activeTrack=-1;picked.clear();render();var leftEntry=entries()[0],leftEl=$("roll").children.find(el=>el._entry?.n===leftEntry.n);var oldEnd=leftEntry.n.start+leftEntry.n.len;noteGesture({offsetX:2,shiftKey:false,clientX:100,pointerId:1,preventDefault(){},stopPropagation(){}},leftEntry,leftEl);leftEl.onpointermove({clientX:100+unit*.5});leftEl.onpointerup()');
assert.equal(run('leftEntry.n.start'),.5);assert.equal(run('leftEntry.n.start+leftEntry.n.len'),4);
console.log('PASS: automatic bass, channel mute-volume, fine grids, left trim preserves right edge.');
