require('./test-workflow.cjs');
const {run}=require('./test-studio.cjs'),assert=require('node:assert/strict');
run('progressionDestination.close=()=>{};activeTrack=-1;var existingTracks=JSON.stringify(tracks());pendingReggaeton={name:"Test",degrees:[0,5,2,6]};applyReggaetonProgression("main")');
assert.equal(run('state.chords.length'),4);assert.equal(run('JSON.stringify(tracks())'),run('existingTracks'));assert.equal(run('activeTrack'),-1);
run('pendingReggaeton={name:"Test2",degrees:[0,6]};applyReggaetonProgression("main")');assert.equal(run('state.chords.length'),2);assert.equal(run('state.loopRegion.end'),8);
run('$("undo").click()');assert.equal(run('state.chords.length'),4);
const count=run('tracks().length');run('pendingReggaeton={name:"Separate",degrees:[0,6]};applyReggaetonProgression("separate")');assert.equal(run('tracks().length'),count+1);assert.equal(run('state.chords.length'),4);
console.log('PASS replace repeatedly without new channels, preserve other tracks, undo and separate destination');
