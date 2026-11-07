// Channel routing is independent of preset identity. Settings live in the project.
const studioVoices={
 neon:{name:'Neon · lead suave',category:'Synths',wave:'sawtooth',voices:2,spread:5,attack:.012,decay:.3,sustain:.65,release:.18,cutoff:3200},
 orbit:{name:'Orbit · poly ancho',category:'Synths',wave:'sawtooth',voices:4,spread:7,attack:.025,decay:.4,sustain:.5,release:.3,cutoff:2400},
 dusk:{name:'Dusk · keys cálidos',category:'Synths',wave:'triangle',voices:2,spread:3,attack:.008,decay:.7,sustain:.28,release:.22,cutoff:4200},
 reed:{name:'Reed · pulse lead',category:'Synths',wave:'square',voices:2,spread:2,attack:.018,decay:.2,sustain:.55,release:.15,cutoff:1500},
 pearl:{name:'Pearl · pluck redondo',category:'Plucks',wave:'triangle',voices:2,spread:4,attack:.004,decay:.24,sustain:.025,release:.12,cutoff:5000},
 bamboo:{name:'Bamboo · madera',category:'Plucks',partials:[1,2.01,3.98],weights:[1,.3,.12],attack:.003,decay:.2,sustain:.015,release:.08,cutoff:4500},
 prism:{name:'Prism · pluck estéreo',category:'Plucks',wave:'sawtooth',voices:3,spread:8,attack:.004,decay:.18,sustain:.02,release:.16,cutoff:6500},
 droplets:{name:'Droplets · gotas',category:'Plucks',partials:[1,2,3],weights:[1,.18,.08],attack:.006,decay:.35,sustain:.015,release:.2,cutoff:7200},
 celeste:{name:'Celeste · campana cálida',category:'Bells',partials:[1,2,2.76,5.4],weights:[1,.32,.14,.05],attack:.004,decay:1.3,sustain:.01,release:.8,cutoff:8200},
 crystal:{name:'Crystal · campana de vidrio',category:'Bells',partials:[1,2.01,3.99,6.12],weights:[1,.3,.16,.07],attack:.002,decay:1.8,sustain:.008,release:1.1,cutoff:11000},
 musicbox:{name:'Music Box · caja musical',category:'Bells',partials:[1,3,5.03,7.02],weights:[1,.18,.07,.02],attack:.002,decay:.8,sustain:.005,release:.5,cutoff:7500},
 bronze:{name:'Bronze · campana oscura',category:'Bells',partials:[1,1.48,2.09,2.87],weights:[1,.2,.18,.08],attack:.005,decay:2.2,sustain:.008,release:1.2,cutoff:4800},
 cloud:{name:'Cloud · pad envolvente',category:'Pads',wave:'sawtooth',voices:4,spread:6,attack:.7,decay:1,sustain:.7,release:1.6,cutoff:1300},
 aurora:{name:'Aurora · pad luminoso',category:'Pads',wave:'triangle',voices:4,spread:9,attack:.5,decay:1,sustain:.65,release:2,cutoff:5200},
 deepSpace:{name:'Deep Space · pad oscuro',category:'Pads',wave:'sawtooth',voices:3,spread:4,attack:1.1,decay:1,sustain:.8,release:2.4,cutoff:650},
 silk:{name:'Silk · strings sintéticos',category:'Strings',wave:'sawtooth',voices:5,spread:5,attack:.25,decay:.8,sustain:.8,release:.9,cutoff:2600},
 ensemble:{name:'Ensemble · string machine',category:'Strings',wave:'sawtooth',voices:6,spread:7,attack:.35,decay:1,sustain:.75,release:1.2,cutoff:3600},
 chamber:{name:'Chamber · cuerdas oscuras sintéticas',category:'Strings',wave:'sawtooth',voices:3,spread:3,attack:.18,decay:.6,sustain:.7,release:.6,cutoff:1500}
};
const fxDefaults={cutoff:18000,resonance:.7,slope:12,amount:0,decay:2,predelay:20,lowCut:180,highCut:8000,size:.65,attack:.02,type:'Hall'};
function channelSettings(index){return index===-2?(state.loopMixer??={}):index===-1?state:tracks()[index]}
function fxSettings(index){const raw=channelSettings(index)?.audioFX||{},v={...fxDefaults};for(const key of Object.keys(v))if(typeof v[key]==='number'&&Number.isFinite(raw[key]))v[key]=raw[key];v.slope=v.slope===24?24:12;if(['Room','Hall','Plate','Ambient'].includes(raw.type))v.type=raw.type;return v}
const arpDefaults={enabled:false,rate:'1/8',steps:0,offset:0,style:'Up',gate:.8};
const arpStyles=['Up','Down','UpDown','DownUp','Up & Down','Down & Up','Converge','Diverge','Con & Diverge','Pink Up','Pink UpDown','Thumb Up','Thumb UpDown','Play Order','Chord Trigger','Random','Random Other','Random Once'];
const arpRates=['1/1','1/2','1/2T','1/4','1/4T','1/8','1/8T','1/16','1/16T','1/32','1/32T'];
function arpSettings(owner){return {...arpDefaults,...(owner?.arpeggiator||{})}}
function arpeggiate(notes,owner){const a=arpSettings(owner);if(!a.enabled||!notes.length)return notes;const byStart=new Map();for(const note of notes){const key=note.start.toFixed(5);if(!byStart.has(key))byStart.set(key,[]);byStart.get(key).push(note)}const beat={'1/1':4,'1/2':2,'1/2T':4/3,'1/4':1,'1/4T':2/3,'1/8':.5,'1/8T':1/3,'1/16':.25,'1/16T':1/6,'1/32':.125,'1/32T':1/12}[a.rate]||.5;const result=[];let stepIndex=0;for(const chord of byStart.values()){const pitches=chord.map(n=>n.pitch).sort((x,y)=>x-y),count=Math.max(1,Math.min(32,Number(a.steps)||pitches.length)),sequence=[];for(let i=0;i<count;i++){let j=i%pitches.length;if(a.style==='Down')j=pitches.length-1-j;else if(a.style==='UpDown'||a.style==='Up & Down')j=(i%(pitches.length*2-2||1));else if(a.style==='DownUp'||a.style==='Down & Up')j=pitches.length-1-(i%(pitches.length*2-2||1));else if(a.style==='Pink Up')j=(i*7)%pitches.length;else if(a.style==='Pink UpDown')j=(i*7)%(pitches.length*2-2||1);else if(a.style==='Diverge'||a.style==='Con & Diverge')j=Math.min(pitches.length-1,Math.floor(i/2));else if(a.style==='Converge'||a.style==='Con & Diverge')j=Math.floor((pitches.length-1)/2)+(i%2?Math.ceil(i/2):-Math.floor(i/2));else if(a.style==='Random'||a.style==='Random Other')j=Math.floor(Math.random()*pitches.length);sequence.push(pitches[Math.max(0,Math.min(pitches.length-1,j))])}const duration=Math.max(.04,chord[0].len||beat*count);sequence.forEach((pitch,i)=>{const start=chord[0].start+Number(a.offset||0)+i*beat;if(start<chord[0].start+duration)result.push({...chord[0],pitch,start,len:Math.min(beat*(Number(a.gate)||.8),chord[0].start+duration-start)})});stepIndex+=1}return result}
const audioBuses=new Map(),reverbBuffers=new Map();let routingChannel=-1;
let outputContext,outputLimiter;
function studioOutput(){if(outputContext!==ctx){outputContext=ctx;outputLimiter=ctx.createDynamicsCompressor();outputLimiter.threshold.value=-6;outputLimiter.knee.value=6;outputLimiter.ratio.value=12;outputLimiter.attack.value=.003;outputLimiter.release.value=.12;outputLimiter.connect(ctx.destination)}return outputLimiter}
function rememberFX(){history.push(JSON.stringify(state));future=[];if(history.length>100)history.shift()}
function changeFX(index,key,value,finish=false){
 const owner=channelSettings(index);owner.audioFX={...fxSettings(index),[key]:value};localStorage.setItem('quinta',JSON.stringify(state));
 const bus=audioBuses.get(index);if(!bus)return;
 const [input,volume,dry,wet,pre,low,high,reverb]=bus.nodes,s=fxSettings(index),now=ctx.currentTime;
 input.frequency.setTargetAtTime(Math.max(40,Math.min(ctx.sampleRate*.45,s.cutoff)),now,.02);input.Q.setTargetAtTime(s.resonance,now,.02);
 bus.input24.frequency.setTargetAtTime(Math.max(40,Math.min(ctx.sampleRate*.45,s.cutoff)),now,.02);bus.input24.Q.setTargetAtTime(s.resonance,now,.02);
 if(key==='slope'){input.disconnect();input.connect(s.slope===24?bus.input24:volume)}
 wet.gain.setTargetAtTime(s.amount*.6,now,.03);pre.delayTime.setTargetAtTime(s.predelay/1000,now,.03);low.frequency.setTargetAtTime(s.lowCut,now,.02);high.frequency.setTargetAtTime(Math.max(s.lowCut+100,s.highCut),now,.02);
 if(finish&&['decay','size','attack','type'].includes(key))reverb.buffer=reverbImpulse(s);
}
function changeChannelVolume(index,gain){const bus=audioBuses.get(index);if(bus&&ctx)bus.volume.gain.setTargetAtTime(Math.max(0,gain),ctx.currentTime,.015)}
// Reserve most of the cutoff travel for the frequencies used most often.
function cutoffPosition(hz){return hz<=2000?(hz-40)/1960*.55:.55+(hz-2000)/16000*.45}
function cutoffFrequency(position){const p=Math.max(0,Math.min(1,position));return Math.round(p<=.55?40+p/.55*1960:2000+(p-.55)/.45*16000)}
function exactFXValue(output,index,key,min,max,read,write,paint){
 output.title='Doble clic para escribir el valor exacto';
 output.ondblclick=e=>{e.preventDefault();e.stopPropagation();const input=document.createElement('input');input.type='number';input.className='fx-exact-value';input.min=min;input.max=max;input.step='any';input.value=read();output.replaceWith(input);input.focus();input.select();let done=false;
  const finish=commit=>{if(done)return;done=true;const number=Number(input.value);if(commit&&input.value.trim()!==''&&Number.isFinite(number)){const next=Math.max(min,Math.min(max,number));if(next!==read()){rememberFX();changeFX(index,key,write(next),true)}}input.replaceWith(output);paint()};
  input.onkeydown=event=>{if(event.key==='Enter')finish(true);else if(event.key==='Escape')finish(false)};input.onblur=()=>finish(true);
 };
}
function reverbKnob(index){
 const label=document.createElement('label');label.className='reverb-knob-label';label.textContent='Reverb';
 const dial=document.createElement('div'),value=document.createElement('output');dial.className='reverb-knob';dial.tabIndex=0;dial.setAttribute('role','slider');dial.setAttribute('aria-label','Cantidad de reverb del canal '+(index===-2?'Loops':index<0?'Acordes':tracks()[index].name));dial.setAttribute('aria-valuemin','0');dial.setAttribute('aria-valuemax','100');
 const paint=()=>{const percent=Math.round(fxSettings(index).amount*100);dial.style.setProperty('--angle',(percent*2.7-135)+'deg');dial.setAttribute('aria-valuenow',percent);value.textContent=percent+'%'};paint();exactFXValue(value,index,'amount',0,100,()=>Math.round(fxSettings(index).amount*100),n=>n/100,paint);
 dial.onpointerdown=e=>{e.preventDefault();rememberFX();const y=e.clientY,initial=fxSettings(index).amount;dial.setPointerCapture(e.pointerId);dial.onpointermove=ev=>{changeFX(index,'amount',Math.max(0,Math.min(1,initial+(y-ev.clientY)/140)));paint()};dial.onpointerup=dial.onpointercancel=()=>{dial.onpointermove=null}};
 dial.onkeydown=e=>{if(!['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();rememberFX();const next=e.key==='Home'?0:e.key==='End'?1:fxSettings(index).amount+(['ArrowUp','ArrowRight'].includes(e.key)?.01:-.01);changeFX(index,'amount',Math.max(0,Math.min(1,next)));paint()};
 label.append(dial,value);return label;
}
function filterKnob(index){
 const label=document.createElement('label');label.className='filter-knob-label';label.textContent='Filtro';
 const dial=document.createElement('div'),value=document.createElement('output');dial.className='reverb-knob';dial.tabIndex=0;dial.setAttribute('role','slider');dial.setAttribute('aria-label','Cutoff del filtro del canal '+(index===-2?'Loops':index<0?'Acordes':tracks()[index].name));dial.setAttribute('aria-valuemin','40');dial.setAttribute('aria-valuemax','18000');
 const paint=()=>{const hz=fxSettings(index).cutoff;dial.style.setProperty('--angle',(cutoffPosition(hz)*270-135)+'deg');dial.setAttribute('aria-valuenow',Math.round(hz));dial.setAttribute('aria-valuetext',Math.round(hz)+' Hz');value.textContent=hz>=1000?(hz/1000).toFixed(1)+' kHz':Math.round(hz)+' Hz';const slider=dial.closest('.channel-row')?.querySelector('.fx-controls input[aria-label^="Cutoff"]');if(slider){slider.value=Math.round(cutoffPosition(hz)*1000);slider.nextElementSibling.textContent=hz}};dial.paint=paint;paint();exactFXValue(value,index,'cutoff',40,18000,()=>fxSettings(index).cutoff,n=>n,paint);
 dial.onpointerdown=e=>{e.preventDefault();rememberFX();const y=e.clientY,initial=cutoffPosition(fxSettings(index).cutoff);dial.setPointerCapture(e.pointerId);dial.onpointermove=ev=>{changeFX(index,'cutoff',cutoffFrequency(initial+(y-ev.clientY)/140));paint()};dial.onpointerup=dial.onpointercancel=()=>{dial.onpointermove=null}};
 dial.onkeydown=e=>{if(!['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();rememberFX();const next=e.key==='Home'?0:e.key==='End'?1:cutoffPosition(fxSettings(index).cutoff)+(['ArrowUp','ArrowRight'].includes(e.key)?.01:-.01);changeFX(index,'cutoff',cutoffFrequency(next));paint()};
 label.append(dial,value);return label;
}
function reverbImpulse(settings){
 const decay=Math.max(.2,Math.min(8,settings.decay)),size=Math.max(.1,Math.min(1,settings.size)),attack=Math.max(0,Math.min(1,settings.attack));
 const key=[ctx.sampleRate,decay,size,attack,settings.type].join(':');if(reverbBuffers.has(key))return reverbBuffers.get(key);
 const frames=Math.ceil(ctx.sampleRate*(decay+attack)),buffer=ctx.createBuffer(2,frames,ctx.sampleRate);
 let seed=53129;const noise=()=>{seed=(Math.imul(seed,1664525)+1013904223)|0;return (seed>>>0)/2147483648-1};
 for(let channel=0;channel<2;channel++){
  const data=buffer.getChannelData(channel);let smooth=0;
  for(let i=0;i<frames;i++){
   const time=i/ctx.sampleRate,rise=attack?Math.min(1,time/attack):1;
   const damping=settings.type==='Room'?.7:settings.type==='Plate'?.2:settings.type==='Ambient'?.62:.45;
   smooth=damping*smooth+(1-damping)*noise();
   const density=settings.type==='Plate'?1:Math.min(1,time/(.012+size*.05));
   data[i]=smooth*rise*density*Math.exp(-6.908*Math.max(0,time-attack)/decay)*.16;
  }
  if(settings.type!=='Ambient')for(let tap=1;tap<=7;tap++){const time=(.006+size*.026)*tap*(1+channel*.09),i=Math.floor(time*ctx.sampleRate);if(i<frames)data[i]+=.25*Math.exp(-tap*.5)*Math.min(1,time/Math.max(.001,attack))}
 }
 if(reverbBuffers.size>=12)reverbBuffers.delete(reverbBuffers.keys().next().value);reverbBuffers.set(key,buffer);return buffer;
}
function channelAudioOutput(){
 if(audioBuses.has(routingChannel))return audioBuses.get(routingChannel).input;
 const s=fxSettings(routingChannel),input=ctx.createBiquadFilter(),input24=ctx.createBiquadFilter(),volume=ctx.createGain(),dry=ctx.createGain(),wet=ctx.createGain(),pre=ctx.createDelay(.5),low=ctx.createBiquadFilter(),high=ctx.createBiquadFilter(),reverb=ctx.createConvolver();
 input.type='lowpass';input.frequency.value=Math.max(40,Math.min(ctx.sampleRate*.45,s.cutoff));input.Q.value=Math.max(.1,Math.min(12,s.resonance));
 input24.type='lowpass';input24.frequency.value=input.frequency.value;input24.Q.value=input.Q.value;
 volume.gain.value=routingChannel===-2?1:routingChannel<0?state.chordVolume??1:tracks()[routingChannel]?.volume??1;
 dry.gain.value=1;wet.gain.value=Math.max(0,Math.min(1,s.amount))*.6;
 pre.delayTime.value=Math.max(0,Math.min(.5,s.predelay/1000));low.type='highpass';low.frequency.value=Math.max(20,Math.min(2000,s.lowCut));high.type='lowpass';high.frequency.value=Math.max(low.frequency.value+100,Math.min(ctx.sampleRate*.45,s.highCut));
 reverb.buffer=reverbImpulse(s);input.connect(s.slope===24?input24:volume);input24.connect(volume);volume.connect(dry);dry.connect(studioOutput());volume.connect(pre);pre.connect(reverb);reverb.connect(low);low.connect(high);high.connect(wet);wet.connect(studioOutput());
 audioBuses.set(routingChannel,{input,input24,volume,nodes:[input,volume,dry,wet,pre,low,high,reverb,input24]});return input;
}
function loopAudioOutput(){const previous=routingChannel;routingChannel=-2;try{return channelAudioOutput()}finally{routingChannel=previous}}
const stopBeforeSoundDesign=stop;
stop=function(){stopBeforeSoundDesign();for(const bus of audioBuses.values())bus.nodes.forEach(n=>n.disconnect());audioBuses.clear()};
const toneBeforeSoundDesign=tone;
tone=function(p,t,len,v=90,instrument,channel=-1){
 const previous=routingChannel;routingChannel=Number.isInteger(channel)?channel:-1;
 try{
  const preset=studioVoices[instrument||state.sound||$('sound').value];
  if(!preset)return toneBeforeSoundDesign(p,t,len,v,instrument);
  const frequency=440*2**((p-69)/12),release=preset.release,end=t+Math.max(.04,len),attack=Math.min(preset.attack,len*.6),parts=preset.partials||Array(preset.voices).fill(1);
  const filter=ctx.createBiquadFilter();filter.type='lowpass';filter.Q.value=.65;
  filter.frequency.setValueAtTime(preset.cutoff,t);filter.frequency.exponentialRampToValueAtTime(Math.max(250,preset.cutoff*(preset.category==='Plucks'?.2:.7)),t+Math.max(.03,preset.decay));filter.connect(channelAudioOutput());
  let remaining=parts.length;parts.forEach((ratio,i)=>{
   if(frequency*ratio>=ctx.sampleRate*.45){if(!--remaining)filter.disconnect();return}
   const osc=ctx.createOscillator(),gain=ctx.createGain(),pan=ctx.createStereoPanner();osc.type=preset.wave||'sine';osc.frequency.value=frequency*ratio;
   osc.detune.value=preset.partials?0:(i-(parts.length-1)/2)*(preset.spread||0);pan.pan.value=parts.length===1?0:(i/(parts.length-1)*2-1)*.55;
   const peak=.12*Math.max(0,Math.min(127,v))/127*(preset.weights?.[i]||1)/Math.sqrt(parts.length);
   const decay=preset.decay/(1+i*(preset.partials?.18:0)),sustain=peak*preset.sustain;
   gain.gain.setValueAtTime(0,t);gain.gain.linearRampToValueAtTime(peak,t+attack);gain.gain.setTargetAtTime(Math.max(.00001,sustain),t+attack,decay/4);
   const atEnd=sustain+(peak-sustain)*Math.exp(-Math.max(0,len-attack)/(decay/4));gain.gain.cancelScheduledValues(end);gain.gain.setValueAtTime(Math.max(.00001,atEnd),end);gain.gain.exponentialRampToValueAtTime(.00001,end+release);
   osc.connect(gain);gain.connect(pan);pan.connect(filter);osc.start(t);osc.stop(end+release+.02);timers.push(osc);
   osc.onended=()=>{osc.disconnect();gain.disconnect();pan.disconnect();timers=timers.filter(x=>x!==osc);if(!--remaining)filter.disconnect()};
  });
 }finally{routingChannel=previous}
};
events=function(){return [...(state.chordsMuted?[]:arpeggiate(baseEvents().map(n=>({...n,instrument:state.chordInstrument,channel:-1})),state)),...tracks().flatMap((track,index)=>track.muted?[]:arpeggiate(track.notes.map(n=>({...n,instrument:track.instrument,channel:index})),track))].filter(n=>n.velocity>0)};
listen=function(n){if(previewNotes&&!n.muted){audio();tone(n.pitch,ctx.currentTime,.4,n.velocity||90,channelInstrument(),activeTrack)}};
audition=function(c){if(playing)return;audio();c.notes.forEach(n=>tone(n.pitch,ctx.currentTime,.65,n.velocity||90,channelInstrument(),activeTrack))};
const soundOptionsBefore=instrumentOptions;instrumentOptions=function(){return [...soundOptionsBefore(),...Object.entries(studioVoices).map(([id,p])=>[id,p.name])]};
Object.entries(studioVoices).forEach(([id,p])=>$('sound').add(new Option(p.name,id)));
function soundCategory(id){if(studioVoices[id])return studioVoices[id].category;if(bassPresets[id])return 'Bajos';if(['velvet'].includes(id))return 'Pads';if(id==='glass')return 'Plucks';if(['hat','openhat','clap','snare','kick'].includes(id))return 'Batería';return 'Synths'}
let favoriteSounds;try{favoriteSounds=new Set(JSON.parse(localStorage.getItem('quinta-favorite-sounds')||'[]'))}catch{favoriteSounds=new Set()}
let presetPreview=false;
function dismissMixerPanel(panel){
 panel.addEventListener('pointerleave',()=>{panel.open=false});
 panel.addEventListener('toggle',()=>{if(!panel.open)return;document.querySelectorAll('.preset-browser[open],.channel-arp[open],.channel-fx[open],.loop-choice[open]').forEach(other=>{if(other!==panel)other.open=false})});
}
function presetMenu(value,onChoose,global=false,index=-1){
 const menu=document.createElement('details');menu.className='preset-browser';const summary=document.createElement('summary');summary.textContent=instrumentOptions().find(([id])=>id===value)?.[1]||'Sonido global';menu.append(summary);
 dismissMixerPanel(menu);
 const panel=document.createElement('div');panel.className='preset-categories';menu.append(panel);
 const preview=document.createElement('label'),previewCheck=document.createElement('input');previewCheck.type='checkbox';previewCheck.checked=presetPreview;previewCheck.onchange=()=>{presetPreview=previewCheck.checked};preview.append(previewCheck,document.createTextNode(' Preescuchar al elegir'));panel.append(preview);
 function makeChoice(id,name){const line=document.createElement('div'),b=document.createElement('button'),star=document.createElement('button');line.className='preset-choice';b.type='button';b.textContent=name;b.setAttribute('aria-pressed',String(value===id));b.onclick=()=>{menu.open=false;onChoose(id);if(presetPreview){audio();tone(60+state.key,ctx.currentTime,.7,85,id,index)}};star.textContent=favoriteSounds.has(id)?'★':'☆';star.setAttribute('aria-label','Favorito: '+name);star.onclick=()=>{if(favoriteSounds.has(id))favoriteSounds.delete(id);else favoriteSounds.add(id);localStorage.setItem('quinta-favorite-sounds',JSON.stringify([...favoriteSounds]));star.textContent=favoriteSounds.has(id)?'★':'☆';refreshFavorites()};line.append(b,star);return line}
 function refreshFavorites(){const items=panel.querySelector('.preset-items');if(items){items.innerHTML='';instrumentOptions().filter(([id])=>favoriteSounds.has(id)).forEach(([id,name])=>items.append(makeChoice(id,name)))}}
 menu.addEventListener('toggle',()=>{if(menu.open)refreshFavorites()});
 for(const category of ['Favoritos','Synths','Plucks','Bells','Bajos','Pads','Strings','Batería']){
  const group=document.createElement('details');group.className='preset-category';group.onpointerenter=()=>{group.open=true};group.onpointerleave=()=>{if(!group.contains(document.activeElement))group.open=false};const heading=document.createElement('summary');heading.textContent=category;group.append(heading);const items=document.createElement('div');items.className='preset-items';
  instrumentOptions().filter(([id])=>id&&(category==='Favoritos'?favoriteSounds.has(id):soundCategory(id)===category)).forEach(([id,name])=>items.append(makeChoice(id,name)));
  group.append(items);panel.append(group);
 }
 if(!global){const inherit=document.createElement('button');inherit.textContent='Usar sonido global';inherit.onclick=()=>onChoose('');panel.append(inherit)}
 menu.addEventListener('keydown',e=>{if(e.key==='Escape'){menu.open=false;summary.focus()}});return menu;
}
const channelUIBeforeSoundDesign=channelUI;
channelUI=function(){
 channelUIBeforeSoundDesign();Array.from($('trackList').children).forEach((row,k)=>{
  const index=k-1,owner=channelSettings(index),selector=row.querySelector('select');
  const choose=id=>{checkpoint();if(index===-1)state.chordInstrument=id;else owner.instrument=id;render()};
  const menu=presetMenu(index===-1?state.chordInstrument||'':owner.instrument||'',choose,false,index);if(selector)selector.replaceWith(menu);else row.append(menu);
  row.append(filterKnob(index),reverbKnob(index));
  const makePanel=(letter,name)=>{const panel=document.createElement('details');panel.className='channel-fx channel-fx-'+name;dismissMixerPanel(panel);const heading=document.createElement('summary');heading.textContent=name.toUpperCase();heading.title=name;heading.setAttribute('aria-label','Opciones de '+name+' del canal '+(index<0?'Acordes':owner.name));panel.append(heading);const controls=document.createElement('div');controls.className='fx-controls';panel.append(controls);return {panel,controls}};
  const filterPanel=makePanel('F','filtro'),reverbPanel=makePanel('R','reverb');
  const arp=arpSettings(owner),arpBox=document.createElement('details');arpBox.className='channel-arp';dismissMixerPanel(arpBox);const arpHead=document.createElement('summary');arpHead.textContent='ARP';arpHead.setAttribute('aria-label','Opciones del arpegiador MIDI');arpBox.append(arpHead);const enabled=document.createElement('input');enabled.type='checkbox';enabled.checked=arp.enabled;enabled.setAttribute('aria-label','Activar arpegiador');const enableLabel=document.createElement('label');enableLabel.append(enabled,document.createTextNode(' Activar'));arpBox.append(enableLabel);
  const arpControl=(label,tag,options,key)=>{const l=document.createElement('label');l.textContent=label;const el=document.createElement(tag);if(tag==='select')options.forEach(v=>el.add(new Option(v,v)));else{el.type='number';el.min=options[0];el.max=options[1];el.step=options[2]}el.value=arp[key];el.onchange=()=>{checkpoint();owner.arpeggiator={...arpSettings(owner),[key]:tag==='select'?el.value:Number(el.value)};render()};l.append(el);arpBox.append(l)};
  enabled.onchange=()=>{checkpoint();owner.arpeggiator={...arpSettings(owner),enabled:enabled.checked};render()};arpControl('Rate','select',arpRates,'rate');arpControl('Steps','input',[0,32,1],'steps');arpControl('Offset · pasos','input',[-32,32,1],'offset');arpControl('Gate','input',[.05,1,.05],'gate');arpControl('Style','select',arpStyles,'style');row.append(arpBox,filterPanel.panel,reverbPanel.panel);
  const values=fxSettings(index);
  const slopeLabel=document.createElement('label'),slopeSelect=document.createElement('select');slopeLabel.textContent='Pendiente';slopeSelect.setAttribute('aria-label','Pendiente del filtro del canal '+(index<0?'Acordes':owner.name));[[12,'12 dB/oct'],[24,'24 dB/oct']].forEach(([value,text])=>slopeSelect.add(new Option(text,String(value))));slopeSelect.value=String(values.slope);slopeSelect.onchange=()=>{rememberFX();changeFX(index,'slope',Number(slopeSelect.value))};slopeLabel.append(slopeSelect);filterPanel.controls.append(slopeLabel);
  for(const [key,label,min,max,step] of [['cutoff','Cutoff · Hz',40,18000,10],['resonance','Resonancia',.1,12,.1],['decay','Decay · s',.2,8,.1],['predelay','Predelay · ms',0,500,1],['lowCut','Low cut · Hz',20,2000,10],['highCut','High cut · Hz',1000,18000,100],['size','Tamaño',.1,1,.01],['attack','Ataque · s',0,1,.01]]){
   const controls=(key==='cutoff'||key==='resonance'?filterPanel:reverbPanel).controls;
   const labelEl=document.createElement('label'),input=document.createElement('input'),output=document.createElement('output');labelEl.textContent=label;input.type='range';input.min=key==='cutoff'?0:min;input.max=key==='cutoff'?1000:max;input.step=key==='cutoff'?1:step;input.value=key==='cutoff'?Math.round(cutoffPosition(values[key])*1000):values[key];input.setAttribute('aria-label',label+' del canal '+(k===0?'Acordes':owner.name));output.textContent=values[key];
   const paint=()=>{const value=fxSettings(index)[key];input.value=key==='cutoff'?Math.round(cutoffPosition(value)*1000):value;output.textContent=value;if(key==='cutoff')row.querySelector('.filter-knob-label .reverb-knob')?.paint()};
   let changing=false;input.oninput=()=>{if(!changing){rememberFX();changing=true}changeFX(index,key,key==='cutoff'?cutoffFrequency(Number(input.value)/1000):Number(input.value));paint()};input.onchange=()=>{if(!changing)rememberFX();changeFX(index,key,key==='cutoff'?cutoffFrequency(Number(input.value)/1000):Number(input.value),true);changing=false;paint()};labelEl.append(input,output);controls.append(labelEl);exactFXValue(output,index,key,min,max,()=>fxSettings(index)[key],n=>n,paint);
  }
  const label=document.createElement('label');label.textContent='Tipo de reverb';const type=document.createElement('select');type.setAttribute('aria-label','Tipo de reverb');['Room','Hall','Plate','Ambient'].forEach(name=>type.add(new Option(name,name)));type.value=values.type;type.onchange=()=>{rememberFX();changeFX(index,'type',type.value,true)};label.append(type);reverbPanel.controls.append(label);
  const arpControls=document.createElement('div');arpControls.className='arp-controls';while(arpHead.nextSibling)arpControls.append(arpHead.nextSibling);arpBox.append(arpControls);
  const header=row.querySelector(':scope > .channel-select'),mute=row.querySelector(':scope > button[aria-label^="Silenciar"],:scope > button[aria-label^="Activar"]'),rename=row.querySelector(':scope > button:not(.channel-select):not(.channel-delete):not([aria-label])'),renameInput=row.querySelector(':scope > input[hidden]'),remove=row.querySelector(':scope > .channel-delete'),volume=row.querySelector(':scope > .mixer-volume');
  const knobs=document.createElement('div');knobs.className='mixer-knobs';knobs.append(row.querySelector('.filter-knob-label'),row.querySelector('.reverb-knob-label'));
  const actions=document.createElement('div');actions.className='mixer-actions';actions.append(mute);if(rename)actions.append(rename);if(renameInput)actions.append(renameInput);actions.append(remove);
  row.classList.add('mixer-strip');row.replaceChildren(header,menu,arpBox,filterPanel.panel,reverbPanel.panel,knobs,volume,actions);
 });
};
const globalMenu=presetMenu(state.sound||$('sound').value,id=>{checkpoint();state.sound=id;$('sound').value=id;globalMenu.querySelector('summary').textContent=instrumentOptions().find(([key])=>key===id)[1];render()},true);
$('sound').hidden=true;$('sound').after(globalMenu);
const renderBeforeSoundDesign=render;render=function(){renderBeforeSoundDesign();const id=state.sound||'triangle';$('sound').value=id;globalMenu.querySelector('summary').textContent=instrumentOptions().find(([key])=>key===id)?.[1]||id};
const soundStyle=document.createElement('link');soundStyle.rel='stylesheet';soundStyle.href='sound-design.css';document.head.append(soundStyle);render();
const mixerStyle=document.createElement('link');mixerStyle.rel='stylesheet';mixerStyle.href='mixer.css';document.head.append(mixerStyle);
function setupLoopMixer(){
 if(!document.getElementById('drumLoop')||!document.getElementById('afroLoop')||typeof regBassTools==='undefined'){setTimeout(setupLoopMixer,50);return}
const mixerFrame=document.createElement('div'),mixerScroll=document.createElement('div'),loopStrip=document.createElement('div');
mixerFrame.className='mixer-frame';mixerScroll.className='mixer-scroll';loopStrip.className='loop-strip mixer-strip';
$('trackList').before(mixerFrame);mixerFrame.append(loopStrip,mixerScroll);mixerScroll.append($('trackList'));
const loopHeader=document.createElement('div');loopHeader.className='loop-strip-header';loopHeader.textContent='LOOPS';loopStrip.append(loopHeader);
for(const [name,id] of [['REGUETÓN','drumLoop'],['AFRO','afroLoop']]){
 const choice=document.createElement('details'),heading=document.createElement('summary'),popup=document.createElement('div'),selector=$(id);choice.className='loop-choice';heading.textContent=name;popup.className='loop-choice-popup';popup.append(selector);choice.append(heading,popup);dismissMixerPanel(choice);selector.addEventListener('change',()=>{choice.open=false});loopStrip.append(choice);
}
for(let i=0;i<2;i++){const slot=document.createElement('button');slot.className='loop-future';slot.type='button';slot.disabled=true;slot.setAttribute('aria-label','Espacio para un futuro tipo de loop');loopStrip.append(slot)}
const loopKnobs=document.createElement('div');loopKnobs.className='mixer-knobs';loopKnobs.append(filterKnob(-2),reverbKnob(-2));loopStrip.append(loopKnobs);
const loopVolume=document.createElement('label'),loopOutput=document.createElement('output'),loopFader=document.createElement('div'),loopSlider=document.createElement('input'),loopScale=document.createElement('div');loopVolume.className='mixer-volume';loopVolume.textContent='Volumen';loopSlider.type='range';loopSlider.min='-61';loopSlider.max='6';loopSlider.step='.1';loopSlider.value=String(channelVolumeDb(state.drumLevel??.65));loopSlider.setAttribute('aria-label','Volumen de loops en dB');loopScale.className='mixer-volume-scale';loopScale.innerHTML='<span>+6</span><span>0</span><span>−12</span><span>−24</span><span>−36</span><span>−48</span><span>−∞</span>';loopFader.className='mixer-fader';loopFader.append(loopSlider,loopScale);loopVolume.append(loopOutput,loopFader);loopStrip.append(loopVolume);
const paintLoopVolume=()=>{const db=Number(loopSlider.value);loopOutput.textContent=db<=-60.5?'−∞':(db>0?'+':'')+db.toFixed(1)+' dB';loopSlider.setAttribute('aria-valuetext',loopOutput.textContent)};paintLoopVolume();let loopVolumeChanging=false;
const applyLoopVolume=()=>{state.drumLevel=channelVolumeGain(Number(loopSlider.value));if(drumGain&&ctx)drumGain.gain.setTargetAtTime(state.drumLevel,ctx.currentTime,.015);localStorage.setItem('quinta',JSON.stringify(state));syncLoopControls();paintLoopVolume()};
loopSlider.oninput=()=>{if(!loopVolumeChanging){rememberFX();loopVolumeChanging=true}applyLoopVolume()};loopSlider.onchange=()=>{if(!loopVolumeChanging)rememberFX();applyLoopVolume();loopVolumeChanging=false};
const loopFooter=document.createElement('div');loopFooter.className='loop-strip-footer';loopFooter.textContent='AUDIO';loopStrip.append(loopFooter);
const bassToolsPanel=document.createElement('details'),bassToolsHeading=document.createElement('summary');bassToolsPanel.className='library';bassToolsHeading.textContent='Bajo de reguetón';bassToolsPanel.append(bassToolsHeading,regBassTools,regBassHelp);channels.after(bassToolsPanel);loopAudioPanel.style.display='none';afroPanel.style.display='none';
}
setupLoopMixer();
