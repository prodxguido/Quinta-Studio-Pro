const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),dgram=require('node:dgram'),{spawnSync}=require('node:child_process');
const {packet,sendToLive}=require('./desktop/live-transport.cjs');
const vectors=[['/quinta_bootstrap','ss',['q-test','2']],['/quinta','siis',['q-test',0,1,'acentos%20%C3%B1']],['/quinta_status','sss',['q-test','error','Error con ñ']],['/quinta_probe','s',['q-test']]];
const py=spawnSync('python',['-X','utf8','-B','ableton/test_remote.py'],{input:JSON.stringify(vectors.map(([address,types,args])=>({address,tags:','+types,args,hex:packet(address,types,args).toString('hex')}))),encoding:'utf8'});
process.stdout.write(py.stdout);process.stdout.write(py.stderr);assert.equal(py.status,0);
function decode(b){let p=0;function str(){let e=b.indexOf(0,p);assert(e>=p);let s=b.toString('utf8',p,e);p=(e+4)&~3;return s}const address=str(),tags=str();return {address,args:[...tags.slice(1)].map(t=>{if(t==='s')return str();assert.equal(t,'i');let n=b.readInt32BE(p);p+=4;return n})}}
function receiver(fail=false){
 const tracks=[{id:1,name:'Existing',clips:[]}],clips=new Map();let next=2,tempo=120;
 const dictionary={};
 function LiveAPI(_,path){this.obj=path==='live_set'?null:path.startsWith('id ')?[...tracks,...clips.values()].find(t=>t.id===+path.slice(3)):tracks[+path.split(' ').pop()];this.id=this.obj?.id;
 this.getcount=()=>tracks.length;
 this.get=k=>k==='tempo'?[tempo]:k==='tracks'?tracks.flatMap(t=>['id',t.id]):this.obj.clips.flatMap(t=>['id',t.id]);
 this.set=(k,v)=>{if(k==='tempo')tempo=v;else this.obj[k]=v};
 this.call=(method,...a)=>{
  if(method==='create_midi_track'){tracks.push({id:next++,clips:[]});return undefined}
  if(method==='delete_track'){tracks.splice(a[0],1);return}
  if(method==='create_midi_clip'){if(fail&&tracks.length===3)throw Error('injected failure');let c={id:next++};clips.set(c.id,c);this.obj.clips.push(c);return}
  if(method==='add_new_notes'){this.obj.notes=a[0].notes;return a[0].notes.map(()=>next++)}
  throw Error(method);
 };
 }
 const messages=[];const c={LiveAPI,Dict:function(){this.setparse=(k,s)=>dictionary[k]=JSON.parse(s);this.get=k=>dictionary[k];this.clear=()=>{}},outlet:(_, ...a)=>messages.push(a),post:()=>{},arrayfromargs:a=>Array.from(a)};
 vm.createContext(c);vm.runInContext(fs.readFileSync('ableton/quinta_receiver.js','utf8'),c);c.bang();
 function dispatch(address,args){c.messagename=address;c.anything(...args)}
 return {tracks,messages,dispatch};
}
const project={protocol:'quinta-live-v1',tempo:130,tracks:[{name:'Ñ',notes:[{pitch:60,start_time:0,duration:4,velocity:90,mute:false}]},{name:'Empty',notes:[]}]};
function importDirect(r,id,p){r.dispatch('/quinta_probe',[id]);r.dispatch('/quinta',[id,0,1,encodeURIComponent(JSON.stringify(p))])}
const r=receiver();importDirect(r,'q-test',project);assert.equal(r.tracks.length,2);assert.equal(r.messages.at(-1)[2],'done');importDirect(r,'q-test',project);assert.equal(r.tracks.length,2);
const f=receiver(true);importDirect(f,'q-fail',{...project,tracks:[project.tracks[0],project.tracks[0]]});assert.equal(f.tracks.length,1);assert.equal(f.messages.at(-1)[2],'error');
const reorder=receiver(),encoded=encodeURIComponent(JSON.stringify(project)),parts=encoded.match(/.{1,100}/g);reorder.dispatch('/quinta_probe',['q-order']);
for(let i=parts.length-1;i>0;i--){reorder.dispatch('/quinta',['q-order',i,parts.length,parts[i]]);reorder.dispatch('/quinta',['q-order',i,parts.length,parts[i]])}
assert.equal(reorder.tracks.length,1);reorder.dispatch('/quinta',['q-order',0,parts.length,parts[0]]);assert.equal(reorder.tracks.length,2);
const invalid=receiver();importDirect(invalid,'q-invalid',{...project,tempo:0});assert.equal(invalid.tracks.length,1);
const patch=fs.readFileSync('ableton/QUINTA Receiver.amxd');assert.equal(patch.readUInt32LE(28),patch.length-32);assert.deepEqual(JSON.parse(patch.subarray(32,-1)),JSON.parse(fs.readFileSync('ableton/QUINTA Receiver.maxpat')));
(async()=>{
 const remote=dgram.createSocket('udp4'),max=dgram.createSocket('udp4'),r=receiver();let peer,identifier,dropped=false;
 await Promise.all([new Promise((ok,no)=>{remote.once('error',no);remote.bind(0,'127.0.0.1',ok)}),new Promise((ok,no)=>{max.once('error',no);max.bind(0,'127.0.0.1',ok)})]);
 remote.on('message',(b,p)=>{const m=decode(b);peer=p;identifier=m.args[0];remote.send(JSON.stringify({id:identifier,stage:'ready',detail:'2'}),peer.port,'127.0.0.1');r.dispatch('/quinta_probe',[identifier])});
 max.on('message',b=>{const m=decode(b);r.dispatch(m.address,m.args);const last=r.messages.at(-1);if(last?.[2]==='done'){
  // Drop the first success ACK: transport retries the same ID; receiver must not duplicate.
  if(!dropped){dropped=true;return}
  remote.send(JSON.stringify({id:identifier,stage:last[2],detail:last[3]}),peer.port,'127.0.0.1');
 }});
 try{const result=await sendToLive(project,{bootstrapPort:remote.address().port,receiverPort:max.address().port,ackWait:500});assert(result.ok);assert.equal(r.tracks.length,2);assert(dropped);console.log('Ableton offline: OSC cross-language, receiver rollback/dedup, AMXD parity, real UDP + lost ACK: OK');}
 finally{remote.close();max.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
