require('./test-studio.cjs');const {run,sandbox}=require('./test-studio.cjs');
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');sandbox.TextEncoder=TextEncoder;
vm.runInContext(fs.readFileSync('channel-export.js','utf8'),sandbox);
run(`state.tempo=80;state.projectName='Tema';state.chords=[{duration:4,notes:[{pitch:60,start:1,len:2,velocity:70}]}];state.tracks=[{name:'Bajo',muted:true,notes:[{pitch:36,start:4,len:4,velocity:100}]},{name:'Bajo',notes:[]},{name:'Kick',instrument:'kick',notes:[{pitch:60,start:0,len:.25,velocity:90}]}];state.loopRegion={start:0,end:16}`);
const files=run('channelMidiFiles()');assert.equal(files.length,4);assert.equal(files[1].name,'Bajo - Tema.mid');assert.equal(files[2].name,'Bajo (2) - Tema.mid');
function parse(bytes){const b=Buffer.from(bytes);assert.equal(b.toString('ascii',0,4),'MThd');assert.equal(b.readUInt16BE(8),0);assert.equal(b.readUInt16BE(10),1);assert.equal(b.readUInt16BE(12),480);assert.equal(b.readUInt32BE(18),b.length-22);let i=22,time=0,events=[];const vl=()=>{let n=0,x;do{x=b[i++];n=n*128+(x&127)}while(x&128);return n};while(i<b.length){time+=vl();const status=b[i++];if(status===255){const type=b[i++],len=vl(),data=[...b.subarray(i,i+len)];i+=len;events.push({time,type,data});}else events.push({time,status,pitch:b[i++],velocity:b[i++]})}return events}
const parsed=files.map(f=>parse(f.bytes));
assert.equal(parsed[0].find(e=>e.status===144).time,480);assert.equal(parsed[1].find(e=>e.status===144).time,1920);assert.equal(parsed[1].find(e=>e.status===144).pitch,36);
assert.equal(parsed[3].find(e=>e.status===153).pitch,36);
parsed.forEach(events=>{assert.equal(events.at(-1).time,7680);assert.equal(events.at(-1).type,47);const tempo=events.find(e=>e.type===81).data;assert.equal(tempo[0]*65536+tempo[1]*256+tempo[2],750000)});
assert.equal(parsed[2].filter(e=>e.status).length,0);
console.log('PASS independent MIDI parsing: names, muted/empty channels, tempo, absolute timing, drum mapping and shared end');
