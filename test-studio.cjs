const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
class Element{constructor(){this.value='';this.style={};this.children=[];this.clientHeight=390;this.clientWidth=1000;this.classList={toggle(){},contains(){return false}}}append(...e){this.children.push(...e)}prepend(){}after(){}add(){}insertBefore(){}setAttribute(){}addEventListener(){}querySelector(){return new Element()}querySelectorAll(){return []}set innerHTML(v){this.html=v;this.children=[]}get innerHTML(){return this.html}click(){this.onclick?.()} }
const elements=new Map(),get=id=>{if(!elements.has(id))elements.set(id,new Element());return elements.get(id)};
Element.prototype.before=function(){};
const document={getElementById:get,createElement:()=>new Element(),querySelector:()=>new Element(),querySelectorAll:()=>[],addEventListener(){},head:new Element(),body:new Element()};
let savedProject=null;
const sandbox={document,console,Option:function(){},localStorage:{getItem(){return savedProject},setItem(k,v){savedProject=v}},structuredClone,setTimeout(){},requestAnimationFrame(){},cancelAnimationFrame(){},Blob,URL};vm.createContext(sandbox);vm.runInContext(fs.readFileSync('app.js','utf8'),sandbox);get('pattern').value='block';get('grid').value='.25';vm.runInContext(fs.readFileSync('studio.js','utf8'),sandbox);
function run(s){return vm.runInContext(s,sandbox)}
assert.equal(run('state.chords.length'),4);assert.equal(run('lessons.length'),18);
run('previewNotes=false; picked=new Set(state.chords[0].notes); var pitches=state.chords[0].notes.map(n=>n.pitch); transposeSelection(-12)');
assert.equal(run('state.chords[0].notes.every((n,i)=>n.pitch===pitches[i]-12)'),true);
run("exercise('arp')");assert.equal(run('tracks().length'),1);assert.equal(run('tracks()[0].notes.length'),32);
assert.equal(run('events().length'),44);run('tracks()[0].muted=true');assert.equal(run('events().length'),12);
run('tracks()[0].muted=false; picked=new Set(tracks()[0].notes.slice(0,3)); exercise("repeat")');assert.equal(run('tracks()[0].notes.length'),35);
assert.equal(run('midi()[0]'),77);assert.equal(run('midi()[1]'),84);
run('$("undo").click()');assert.equal(run('tracks()[0].notes.length'),32);
run('picked=new Set([{pitch:3}]); transposeSelection(-12)');assert.equal(run('[...picked][0].pitch'),3);
console.log('PASS: initialization, octave group, MIDI bounds, generated arpeggio, channel mute, repetition, undo and MIDI header.');

// Regression: remove middle/active channels, keep siblings and recover via undo.
run(`state.tracks=[{name:'A',notes:[{pitch:60,start:0,len:1,velocity:80}],muted:false},{name:'B',notes:[],muted:true},{name:'C',notes:[{pitch:72,start:1,len:1,velocity:90}],muted:false}];activeTrack=2;picked=new Set(state.tracks[2].notes);render();`);
const before=run('JSON.stringify(state)');
const channelRows=get('trackList').children;
assert.equal(channelRows.length,4);
channelRows[2].children.find(e=>e.textContent==='Eliminar').click();
assert.equal(run('state.tracks.map(t=>t.name).join()'),'A,C');
assert.equal(run('activeTrack'),1);assert.equal(run('picked.size'),1);
run('$("undo").click()');assert.equal(run('JSON.stringify(state)'),before);
run('$("redo").click()');assert.equal(run('state.tracks.length'),2);
run('activeTrack=1; picked=new Set(state.tracks[1].notes); deleteChannel(1)');
assert.equal(run('state.tracks.length'),1);assert.equal(run('activeTrack'),0);assert.equal(run('picked.size'),0);
run('deleteChannel(0)');assert.equal(run('state.tracks.length'),0);assert.equal(run('activeTrack'),-1);
const historySize=run('history.length');run('deleteChannel(-1);deleteChannel(20)');assert.equal(run('history.length'),historySize);
run('$("undo").click(); clearChords()');assert.equal(run('state.chords.length'),0);assert.equal(run('tracks().length'),1);
run('$("undo").click(); activeTrack=0; playing=true; var stopped=0; timers=[{stop(){stopped++}}];');
const fullProject=run('JSON.stringify(state)');get('clear').click();
assert.equal(run('stopped'),1);assert.equal(run('playing'),false);
assert.equal(run('state.chords.length+tracks().length'),0);assert.equal(run('events().length'),0);
assert.equal(run('activeTrack'),-1);assert.equal(run('state.chordsMuted'),false);
assert.equal(JSON.parse(savedProject).tracks.length,0);assert.equal(JSON.parse(savedProject).chords.length,0);
assert.equal(get('trackList').children.length,1); // Only the fixed, empty chord lane remains.
run('$("undo").click()');assert.equal(run('JSON.stringify(state)'),fullProject);
run('$("redo").click()');assert.equal(run('events().length'),0);
// A fresh startup must respect intentionally empty saved projects.
const reloadElements=new Map();
const reloadDocument={...document,getElementById:id=>{if(!reloadElements.has(id))reloadElements.set(id,new Element());return reloadElements.get(id)}};
const reload=vm.createContext({...sandbox,document:reloadDocument});vm.runInContext(fs.readFileSync('app.js','utf8'),reload);
assert.equal(vm.runInContext('state.chords.length',reload),0);
assert.equal(vm.runInContext('state.tracks.length',reload),0);
run('newMelody("Nuevo",[{pitch:64,start:0,len:1,velocity:90}])');assert.equal(run('tracks().length'),1);assert.equal(run('events().length'),1);
console.log('PASS: per-channel UI deletion, active-channel indexing, selection cleanup, clear chords, clear all, playback stop, undo/redo, persisted empty reload and fresh channel creation.');
module.exports={sandbox,run,get,Element};
