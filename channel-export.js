// Independent SMF format 0 files share the project origin and duration.
function midiExportChannels(){
 let offset=0;const notes=[];
 for(const chord of state.chords){notes.push(...chord.notes.map(n=>({...n,start:offset+n.start})));offset+=chord.duration}
 return [{name:'Acordes',notes},...tracks().map((t,i)=>({name:t.name?.trim()||t.instrument||'Canal '+(i+1),notes:t.notes,instrument:t.instrument}))];
}
function encodeChannelMidi(channel,endBeat){
 const be=(n,size)=>Array.from({length:size},(_,i)=>(n>>>((size-i-1)*8))&255);
 const ascii=s=>Array.from(s,c=>c.charCodeAt(0));
 const vl=n=>{const bytes=[n&127];while(n=Math.floor(n/128))bytes.unshift((n&127)|128);return bytes};
 const name=Array.from(new TextEncoder().encode(channel.name));
 const data=[0,255,3,...vl(name.length),...name,0,255,81,3,...be(Math.round(60000000/state.tempo),3),0,255,88,4,4,2,24,8];
 const drum=['hat','openhat','clap','snare','kick'].includes(channel.instrument),ch=drum?9:0;
 const drumPitch={hat:42,openhat:46,clap:39,snare:38,kick:36};
 const events=[];
 channel.notes.forEach(n=>{
  const start=Math.max(0,Math.round(n.start*480)),end=Math.max(start+1,Math.round((n.start+n.len)*480));
  const pitch=drum?drumPitch[channel.instrument]:n.pitch;
  events.push({time:start,bytes:[144+ch,pitch,Math.max(1,Math.min(127,Math.round(n.velocity??90)))]},{time:end,bytes:[128+ch,pitch,0]});
 });
 events.sort((a,b)=>a.time-b.time||a.bytes[0]-b.bytes[0]);let last=0;
 events.forEach(e=>{data.push(...vl(e.time-last),...e.bytes);last=e.time});
 data.push(...vl(Math.max(last,Math.round(endBeat*480))-last),255,47,0);
 return new Uint8Array([...ascii('MThd'),0,0,0,6,0,0,0,1,1,224,...ascii('MTrk'),...be(data.length,4),...data]);
}
function channelMidiFiles(){
 const channels=midiExportChannels(),end=Math.max(state.chords.reduce((s,c)=>s+c.duration,0),...channels.flatMap(c=>c.notes.map(n=>n.start+n.len)),state.loopRegion?.end||0);
 const safe=s=>(s.normalize('NFC').replace(/[<>:"/\\|?*\x00-\x1f]/g,'-').replace(/[. ]+$/g,'').trim().slice(0,90)||'Canal');
 const used=new Set(),project=safe(state.projectName||'QUINTA');
 return channels.map(c=>{const base=safe(c.name);let prefix=base,k=2;while(used.has(prefix.toLowerCase())){prefix=base+' ('+k+')';k++}used.add(prefix.toLowerCase());return {name:prefix+' - '+project+'.mid',bytes:encodeChannelMidi(c,end),empty:!c.notes.length}});
}
const midiFilesDialog=document.createElement('dialog');midiFilesDialog.className='session-dialog';midiFilesDialog.innerHTML='<h2>MIDI por canal</h2><p>Se descarga un archivo por canal, incluidos los silenciados. Todos conservan el mismo inicio y BPM. Los loops WAV no forman parte del MIDI.</p><p class="hint">Si el navegador bloquea las descargas múltiples, permitilas o descargá cada archivo con su botón.</p><div id="midiFileList"></div><button id="closeMidiFiles">Cerrar</button>';document.body.append(midiFilesDialog);
$('closeMidiFiles').onclick=()=>midiFilesDialog.close();
$('export').onclick=()=>{
 const files=channelMidiFiles();$('midiFileList').innerHTML='';
 files.forEach(file=>{const row=document.createElement('p'),button=document.createElement('button');button.textContent=file.name+(file.empty?' · sin notas':'');button.onclick=()=>download(file.bytes,file.name,'audio/midi');row.append(button);$('midiFileList').append(row)});
 midiFilesDialog.showModal();files.forEach(file=>download(file.bytes,file.name,'audio/midi'));
};
$('export').textContent='Exportar MIDI por canal ↗';
$('export').title='Clic: un archivo MIDI por canal. Arrastrar: MIDI multipista del proyecto.';
