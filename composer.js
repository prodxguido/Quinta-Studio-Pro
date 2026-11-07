function sourceHarmony(){
 if(activeTrack>=0)return harmonyGroups(tracks()[activeTrack].notes,state.tempo).map(g=>{const m=detectHarmony(g.notes,qualities)[0];return m?{root:m.root,start:g.start,len:Math.max(...g.notes.map(n=>n.start+n.len))-g.start,pitches:g.notes.map(n=>n.pitch)}:null}).filter(Boolean);
 let offset=0;return state.chords.map(c=>{const h={root:c.root,start:offset,len:c.duration,pitches:c.notes.map(n=>n.pitch)};offset+=c.duration;return h});
}
const progressionDestination=document.createElement('dialog');progressionDestination.className='session-dialog';
progressionDestination.innerHTML='<h2>Cargar progresión de reguetón</h2><p id="progressionDestinationName"></p><p>Reemplazar cambia sólo los acordes principales y ajusta el loop a la nueva progresión. Los demás canales se conservan. Podés deshacer.</p><div class="actions"><button id="progressionReplace" class="accent">Reemplazar acordes principales</button><button id="progressionSeparate">Agregar como canal aparte</button><button id="progressionCancel">Cancelar</button></div>';
 document.body.append(progressionDestination);let pendingReggaeton=null;
function chooseReggaetonDestination(name,degrees,style='Reguetón',mode='minor'){pendingReggaeton={name,degrees:[...degrees],style,mode};progressionDestination.querySelector('h2').textContent='Cargar progresión de '+style.toLowerCase();$('progressionDestinationName').textContent=name;progressionDestination.showModal()}
function applyReggaetonProgression(destination){
 if(!pendingReggaeton)return;
 const {name,degrees,style='Reguetón',mode='minor'}=pendingReggaeton;
 const chords=degrees.map(spec=>{const [d,q]=Array.isArray(spec)?spec:[spec,null];const c=degree(d,mode);if(q)c.q=q;return materialize(c)});
 stop();
 if(destination==='main'){
  checkpoint();state.chords=chords;state.mode=mode;state.chordsMuted=false;
  state.loopRegion={start:0,end:chords.reduce((sum,c)=>sum+c.duration,0)};
  activeTrack=-1;selected=0;picked.clear();render();fit();
 }else{
  let offset=0;const notes=[];chords.forEach(c=>{notes.push(...c.notes.map(n=>({...n,start:n.start+offset})));offset+=c.duration});
  newMelody(style+' '+name,notes);
 }
 pendingReggaeton=null;progressionDestination.close();
}
$('progressionReplace').onclick=()=>applyReggaetonProgression('main');
$('progressionSeparate').onclick=()=>applyReggaetonProgression('separate');
$('progressionCancel').onclick=()=>{pendingReggaeton=null;progressionDestination.close()};
progressionDestination.addEventListener('cancel',()=>{pendingReggaeton=null});
function composeChannel(kind){
 const harmony=sourceHarmony();if(!harmony.length)return toast('Elegí un canal con acordes reconocibles.');const notes=[];
 harmony.forEach(h=>{if(kind==='bass'||kind==='pedal'){notes.push({pitch:kind==='bass'?36+h.root:72+state.key,start:h.start,len:h.len,velocity:90});return}
 const pitches=[...new Set(h.pitches)].sort((a,b)=>a-b);if(!pitches.length)return;
 const rhythm=kind==='arp'?[0,.5,1,1.5,2,2.5,3,3.5]:[0,.75,1.5,3];
 rhythm.filter(t=>t<h.len).forEach((t,i)=>notes.push({pitch:pitches[(kind==='arp'?i:[0,0,1,0][i])%pitches.length],start:h.start+t,len:Math.min(.5,h.len-t),velocity:i===0?92:78}));
 });checkpoint();tracks().push({name:kind,notes,muted:false,instrument:kind==='bass'?'punch':'glass',volume:.8});activeTrack=tracks().length-1;picked.clear();render();fit();
}
const createMenu=document.createElement('select');createMenu.id='createMenu';createMenu.setAttribute('aria-label','Crear canal');
[['','Crear canal…'],['arp','Arpegio'],['melody','Motivo melódico'],['pedal','Pedal'],['bass','Bajo automático'],['hat','Hi-hat'],['openhat','Hi-hat abierto'],['clap','Clap'],['snare','Snare'],['kick','Kick']].forEach(([v,l])=>createMenu.add(new Option(l,v)));channels.prepend(createMenu);
createMenu.onchange=()=>{const k=createMenu.value;if(['hat','openhat','clap','snare','kick'].includes(k)){checkpoint();tracks().push({name:k,notes:[],instrument:k});activeTrack=tracks().length-1;render()}else if(k)composeChannel(k);createMenu.value=''};
bassButton.onclick=()=>composeChannel('bass');
const optionsBeforeDrums=instrumentOptions;instrumentOptions=function(){return [...optionsBeforeDrums(),...['hat','openhat','clap','snare','kick'].map(k=>[k,'Drums · '+k])]};
const pitchedTone=tone;tone=function(p,t,len,v,instrument){
 if(!['hat','openhat','clap','snare','kick'].includes(instrument))return pitchedTone(p,t,len,v,instrument);
 const gain=ctx.createGain(),duration=instrument==='openhat'?.38:instrument==='hat'?.04:instrument==='kick'?.16:.12;gain.connect(voiceOutput());
 gain.gain.setValueAtTime(.0001,t);gain.gain.exponentialRampToValueAtTime(.16*(v||90)/127,t+.002);gain.gain.exponentialRampToValueAtTime(.0001,t+duration);
 let source,filter;if(instrument==='kick'){source=ctx.createOscillator();source.frequency.setValueAtTime(145,t);source.frequency.exponentialRampToValueAtTime(48,t+.06);source.connect(gain)}else{
 source=ctx.createBufferSource();const buffer=ctx.createBuffer(1,Math.ceil(ctx.sampleRate*duration),ctx.sampleRate),data=buffer.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=Math.random()*2-1;source.buffer=buffer;filter=ctx.createBiquadFilter();filter.type=['hat','openhat'].includes(instrument)?'highpass':'bandpass';filter.frequency.value=['hat','openhat'].includes(instrument)?7500:instrument==='clap'?1500:2500;source.connect(filter);filter.connect(gain);
 if(instrument==='clap')for(const dt of [.015,.03]){gain.gain.setValueAtTime(.12,t+dt);gain.gain.exponentialRampToValueAtTime(.0001,t+dt+.012)}}
 source.start(t);source.stop(t+duration+.01);timers.push(source);source.onended=()=>{source.disconnect();filter?.disconnect();gain.disconnect();timers=timers.filter(x=>x!==source)};
};
const reggaeton=document.createElement('details');reggaeton.className='library';reggaeton.innerHTML='<summary>Reguetón · progresiones para explorar</summary><p>Ejercicios originales en menor natural, no transcripciones ni garantía de hits. El dembow y la melodía también definen el resultado. <a href="https://www.berklee.edu/berklee-now/news/what-is-dembow-tracing-the-roots-of-a-global-phenomenon" target="_blank" rel="noopener">Lectura: Berklee sobre el dembow</a>.</p>';
for(const [name,ds] of [['i–VI–III–VII',[0,5,2,6]],['i–iv–v–i',[0,3,4,0]],['VI–VII–i–i',[5,6,0,0]],['i–VII',[0,6]]]){const b=document.createElement('button');b.textContent=name;b.onclick=()=>chooseReggaetonDestination(name,ds);reggaeton.append(b)}library.after(reggaeton);render();
const afroProgressions=[
 ['i–VII · groove abierto',[0,6],'minor'],
 ['i–VI · cálido',[0,5],'minor'],
 ['i–VII–VI–VII · circular',[0,6,5,6],'minor'],
 ['i–iv–VII–i · regreso',[0,3,6,0],'minor'],
 ['VI–VII–i–i · subida',[5,6,0,0],'minor'],
 ['i–VI–iv–VII · melódico',[0,5,3,6],'minor'],
 ['I–V–vi–IV · luminoso',[0,4,5,3],'major'],
 ['vi–IV–I–V · afro pop',[5,3,0,4],'major']
];
const afro=document.createElement('details');afro.className='library';afro.innerHTML='<summary>Afro Dancehall · progresiones</summary><p>Ocho puntos de partida con tríadas y recorridos de dos o cuatro acordes. El cierre se escucha al volver al primer acorde del ciclo. El groove, el bajo y la melodía dan el carácter; probá tocar los acordes en contratiempo. Si querés un color extra, agregá una séptima o novena sólo donde la melodía lo pida. <a href="https://www.native-instruments.com/blogs/blog/emotional-chord-progressions" target="_blank" rel="noopener">Referencia de armonía</a>.</p>';
for(const [name,ds,mode] of afroProgressions){const b=document.createElement('button');b.textContent=name;b.onclick=()=>chooseReggaetonDestination(name,ds,'Afro Dancehall',mode);afro.append(b)}reggaeton.after(afro);
// Keyboard history shortcuts do not intercept text editing.
document.addEventListener('keydown',e=>{
 if(!(e.ctrlKey||e.metaKey)||e.altKey||/INPUT|TEXTAREA|SELECT/.test(e.target.tagName)||e.target.isContentEditable)return;
 if(!['KeyZ','KeyI','KeyY'].includes(e.code))return;
 e.preventDefault();e.stopImmediatePropagation();if(!e.repeat)$(e.code==='KeyZ'&&!e.shiftKey?'undo':'redo').click();
},true);
const fillMenu=document.createElement('select');fillMenu.id='fillMenu';fillMenu.setAttribute('aria-label','Rellenar ritmo');
[['','Rellenar ritmo…'],['hat16','Hi-hat · semicorcheas'],['hat8','Hi-hat · corcheas'],['clap24','Clap · tiempos 2 y 4'],['clap3','Clap · tiempo 3 (half-time)'],['open8','Hi-hat abierto · contratiempos'],['kick4','Kick · negras']].forEach(([v,l])=>fillMenu.add(new Option(l,v)));channels.prepend(fillMenu);
function fillDrumPattern(kind){
 const presets={hat16:['hat',42,.25,0],hat8:['hat',42,.5,0],clap24:['clap',39,2,1],clap3:['clap',39,4,2],open8:['openhat',46,1,.5],kick4:['kick',36,1,0]};
 const spec=presets[kind];if(!spec)return;const [instrument,pitch,step,offset]=spec,region=loopRegion();const start=region.start,end=region.end>start?region.end:start+4;
 const notes=[];for(let t=start+offset;t<end-1e-8;t+=step)notes.push({pitch,start:t,len:Math.min(instrument==='openhat'?.35:.1,end-t),velocity:instrument==='hat'?(Math.round((t-start)*4)%4===0?94:72):100});
 checkpoint();let track=tracks()[activeTrack];
 if(!track||track.instrument!==instrument){track={name:fillMenu.options?Array.from(fillMenu.options).find(o=>o.value===kind)?.textContent||kind:kind,instrument,notes:[]};tracks().push(track);activeTrack=tracks().length-1}
 track.notes=track.notes.filter(n=>n.start<start||n.start>=end);track.notes.push(...notes);picked=new Set(notes);render();fit();toast('Ritmo aplicado al tramo del loop. Podés deshacer.');
}
fillMenu.onchange=()=>{fillDrumPattern(fillMenu.value);fillMenu.value=''};
const playbackFooter=document.querySelector('.editor footer');playbackFooter.querySelector('label:has(#human)').after(fillMenu,createMenu);
