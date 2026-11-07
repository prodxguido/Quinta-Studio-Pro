// Bass voices retain an independent clean fundamental; detuning affects upper layers only.
const bassPresets={
 reese:{name:'Reese · ancho y oscuro',wave:'sawtooth',detune:14,cutoff:1200,decay:.65,sustain:.65,release:.12,sub:.55,body:.25},
 reeseDeep:{name:'Reese · deep',wave:'sawtooth',detune:7,cutoff:650,decay:.8,sustain:.8,release:.16,sub:.7,body:.17},
 punch:{name:'Punch · corto y gordo',wave:'square',detune:0,cutoff:2000,decay:.12,sustain:.12,release:.045,sub:.7,body:.22,bend:2},
 rubber:{name:'Rubber · pluck',wave:'sawtooth',detune:0,cutoff:2800,decay:.2,sustain:.16,release:.06,sub:.6,body:.3,bend:.6},
 sub:{name:'Sub · redondo',wave:'triangle',detune:0,cutoff:420,decay:.3,sustain:.8,release:.08,sub:.85,body:.1},
 finger:{name:'Eléctrico · finger (síntesis)',wave:'triangle',detune:0,cutoff:2400,decay:.5,sustain:.22,release:.09,sub:.5,body:.4,pluck:true},
 pickedBass:{name:'Eléctrico · púa (síntesis)',wave:'sawtooth',detune:0,cutoff:3800,decay:.3,sustain:.18,release:.055,sub:.6,body:.24,pluck:true},
 mutedBass:{name:'Eléctrico · palm mute (síntesis)',wave:'triangle',detune:0,cutoff:900,decay:.1,sustain:.04,release:.035,sub:.7,body:.3,pluck:true}
};
function instrumentOptions(){return [['','Sonido global'],['triangle','Keys suaves'],['sine','Seno cálido'],['sawtooth','Synth básico'],...Object.entries(synthPresets).map(([k,v])=>[k,v.label]),...Object.entries(bassPresets).map(([k,v])=>[k,v.name])];}
function channelInstrument(){return activeTrack===-1?state.chordInstrument:tracks()[activeTrack]?.instrument}
const previousChannelUI=channelUI;
channelUI=function(){
 previousChannelUI();
 Array.from($('trackList').children).forEach((row,k)=>{
  const selector=document.createElement('select'),index=k-1;
  selector.setAttribute('aria-label','Instrumento de '+(index===-1?'Acordes':tracks()[index].name));
  instrumentOptions().forEach(([id,name])=>selector.add(new Option(name,id)));
  selector.value=(index===-1?state.chordInstrument:tracks()[index].instrument)||'';
  selector.onchange=()=>{checkpoint();if(index===-1)state.chordInstrument=selector.value;else tracks()[index].instrument=selector.value;render()};row.append(selector);
 });
};
events=function(){return [...(state.chordsMuted?[]:baseEvents().map(n=>({...n,instrument:state.chordInstrument}))),...tracks().filter(t=>!t.muted).flatMap(t=>t.notes.map(n=>({...n,instrument:t.instrument})))];};
listen=function(n){if(previewNotes){audio();tone(n.pitch,ctx.currentTime,.4,n.velocity||90,channelInstrument())}};
audition=function(c){if(playing)return;audio();c.notes.forEach(n=>tone(n.pitch,ctx.currentTime,.65,n.velocity||90,channelInstrument()))};
const beforeInstrumentTone=tone;
tone=function(p,t,len,v=90,instrument){
 const id=instrument||$('sound').value,preset=bassPresets[id];
 if(!preset){const old=$('sound').value;try{$('sound').value=id;beforeInstrumentTone(p,t,len,v)}finally{$('sound').value=old}return}
 const freq=440*2**((p-69)/12),velocity=Math.max(1,Math.min(127,v))/127;
 const env=ctx.createGain(),filter=ctx.createBiquadFilter();
 const end=t+Math.max(.04,len),releaseEnd=end+preset.release;
 filter.type='lowpass';filter.Q.value=.7;
 filter.frequency.setValueAtTime(preset.cutoff*(.65+.35*velocity),t);
 filter.frequency.exponentialRampToValueAtTime(Math.max(180,preset.cutoff*.25),t+Math.min(preset.decay,len));
 filter.connect(env);env.connect(voiceOutput());
 const peak=.12*velocity;
 env.gain.setValueAtTime(0,t);env.gain.linearRampToValueAtTime(peak,t+.004);
 env.gain.exponentialRampToValueAtTime(Math.max(.0001,peak*preset.sustain),t+Math.max(.008,Math.min(preset.decay,len)));
 env.gain.setTargetAtTime(.0001,end,preset.release/4);
 const layers=[{wave:'sine',gain:preset.sub,detune:0,clean:true},
  {wave:preset.wave,gain:preset.body,detune:-preset.detune},
  ...(preset.detune?[{wave:preset.wave,gain:preset.body,detune:preset.detune}]:[])];
 if(preset.pluck)layers.push({wave:'sine',gain:.12,detune:0,harmonic:3,attack:true});
 let remaining=layers.length;
 layers.forEach(layer=>{
  const osc=ctx.createOscillator(),gain=ctx.createGain();osc.type=layer.wave;osc.detune.value=layer.detune;
  osc.frequency.setValueAtTime(freq*(layer.harmonic||1)*2**((preset.bend||0)/12),t);
  if(preset.bend)osc.frequency.exponentialRampToValueAtTime(freq*(layer.harmonic||1),t+.025);
  gain.gain.setValueAtTime(layer.gain,t);if(layer.attack)gain.gain.exponentialRampToValueAtTime(.0001,t+.055);
  osc.connect(gain);gain.connect(layer.clean?env:filter);osc.start(t);osc.stop(releaseEnd+.02);timers.push(osc);
  osc.onended=()=>{osc.disconnect();gain.disconnect();timers=timers.filter(o=>o!==osc);if(!--remaining){filter.disconnect();env.disconnect()}};
 });
};
Object.entries(bassPresets).forEach(([id,p])=>$('sound').add(new Option(p.name,id)));
const bassButton=document.createElement('button');bassButton.textContent='＋ Canal de bajo';bassButton.onclick=()=>{
 checkpoint();tracks().push({name:'Bajo '+(tracks().length+1),notes:[],muted:false,instrument:'punch'});activeTrack=tracks().length-1;picked.clear();render();
 ensureRange();rowHeight=10;drawRoll();$('rollwrap').scrollTop=(127-60)*rowHeight;
 toast('Canal de bajo listo. Dibujá entre C1 y C3 y elegí su preset en el canal.');
};channels.append(bassButton);
render();
