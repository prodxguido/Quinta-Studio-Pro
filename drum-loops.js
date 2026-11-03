const loopAudioPanel=document.createElement('details');loopAudioPanel.className='library';loopAudioPanel.innerHTML='<summary>Loops de reguetón · audio sincronizado</summary><select id="drumLoop"><option value="">Sin loop</option></select><label>BPM original <input id="drumBpm" type="number" min="40" max="200" value="91"></label><label>Volumen <input id="drumLevel" type="range" min="0" max="100" value="65"></label><p class="hint">Resampling del motor original: tempo del proyecto / tempo original. Sin cambio automático a doble tempo. La afinación cambia con la velocidad.</p>';channels.after(loopAudioPanel);
for(let i=1;i<=8;i++)$('drumLoop').add(new Option('Reguetón '+i,String(i)));
// Source files are padded to 16 beats; use their actual musical phrase lengths.
const drumPhraseBeats={1:16,2:8,3:4,4:8,5:8,6:8,7:16,8:16};
function drumLoopDuration(id,buffer){return Math.min(buffer.duration,drumPhraseBeats[id]*60/91)}
const drumBuffers=new Map();let drumSource,drumGain;
async function loadDrumLoop(id){if(!id)return null;if(!drumBuffers.has(id)){audio();const bytes=await (await fetch('assets/loops/'+id+'.wav')).arrayBuffer();drumBuffers.set(id,await ctx.decodeAudioData(bytes))}return drumBuffers.get(id)}
$('drumLoop').onchange=async()=>{stop();state.drumLoop=$('drumLoop').value;render();try{await loadDrumLoop(state.drumLoop)}catch{toast('No se pudo cargar el audio.')}};
$('drumBpm').onchange=()=>{stop();state.drumBpm=Math.max(40,Math.min(200,Number($('drumBpm').value)||91));render()};
$('drumLevel').oninput=()=>{state.drumLevel=Number($('drumLevel').value)/100;if(drumGain)drumGain.gain.value=state.drumLevel;localStorage.setItem('quinta',JSON.stringify(state))};
const stopWithDrums=stop;stop=function(){if(drumSource){try{drumSource.stop()}catch{}drumSource=null}stopWithDrums()};
const playWithDrums=play;play=function(){
 if(!loopBeats()&&state.drumLoop&&drumBuffers.has(state.drumLoop))state.loopRegion={start:0,end:drumLoopDuration(state.drumLoop,drumBuffers.get(state.drumLoop))*(state.drumBpm||91)/60};
 playWithDrums();if(!playing||!state.drumLoop)return;
 const buffer=drumBuffers.get(state.drumLoop);if(!buffer){toast('El loop aún está cargando; volvé a reproducir.');loadDrumLoop(state.drumLoop);return}
 drumSource=ctx.createBufferSource();drumGain=ctx.createGain();drumGain.gain.value=state.drumLevel??.65;
 drumSource.buffer=buffer;drumSource.loop=true;drumSource.loopStart=0;drumSource.loopEnd=drumLoopDuration(state.drumLoop,buffer);drumSource.playbackRate.value=state.tempo/(state.drumBpm||91);drumSource.connect(drumGain);drumGain.connect(ctx.destination);
 const offset=(loopRegion().start*60/(state.drumBpm||91))%drumLoopDuration(state.drumLoop,buffer);drumSource.start(started,offset);
};
$('drumLoop').value=state.drumLoop||'';$('drumBpm').value=state.drumBpm||91;$('drumLevel').value=(state.drumLevel??.65)*100;
if(state.drumLoop)loadDrumLoop(state.drumLoop).catch(()=>toast('No se pudo cargar el loop guardado.'));
const quickChannels=document.createElement('nav');quickChannels.className='quick-channels';quickChannels.setAttribute('aria-label','Cambiar canal');document.querySelector('aside').append(quickChannels);
function refreshQuickChannels(){quickChannels.innerHTML='';[{name:'Acordes'},...tracks()].forEach((track,i)=>{const b=document.createElement('button');b.textContent=track.name||'Canal '+i;b.title=b.textContent;b.setAttribute('aria-pressed',String(activeTrack===i-1));b.onclick=()=>{activeTrack=i-1;picked.clear();render();fit()};quickChannels.append(b)})}
const channelsWithQuickAccess=channelUI;channelUI=function(){channelsWithQuickAccess();refreshQuickChannels()};refreshQuickChannels();
const regBassTools=document.createElement('div');regBassTools.className='studio-controls';
const regBassPattern=document.createElement('select');regBassPattern.setAttribute('aria-label','Patrón de bajo de reguetón');[['root','Fundamental sostenida'],['fifth','Fundamental → quinta inferior'],['octave','Fundamental → octava'],['332','Síncopa 3–3–2 · fundamental, tercera, quinta']].forEach(([v,l])=>regBassPattern.add(new Option(l,v)));
const regBassAdd=document.createElement('button');regBassAdd.textContent='Agregar bajo de reguetón';regBassTools.append(regBassPattern,regBassAdd);loopAudioPanel.append(regBassTools);
const regBassHelp=document.createElement('p');regBassHelp.className='hint';regBassHelp.textContent='Usa los acordes del canal activo; si no tiene armonía reconocible, usa la progresión principal. La quinta inferior está 5 semitonos debajo de la fundamental, no 3 o 4. Se adapta a la quinta real del acorde.';loopAudioPanel.append(regBassHelp);
function reggaetonBassNotes(harmony,pattern){const result=[];for(const h of harmony){const root=36+pc(h.root),pcs=[...new Set(h.pitches.map(p=>pc(p-h.root)))];const third=pcs.includes(3)?3:pcs.includes(4)?4:0,fifth=pcs.includes(7)?7:pcs.includes(6)?6:pcs.includes(8)?8:0;
 const push=(t,p,len)=>{if(t<h.len)result.push({pitch:p,start:h.start+t,len:Math.min(len,h.len-t),velocity:100})};
 if(pattern==='root')push(0,root,h.len);else if(pattern==='fifth'||pattern==='octave'){push(0,root,h.len/2);push(h.len/2,pattern==='octave'?root+12:root+(fifth?fifth-12:0),h.len/2)}else for(let t=0;t<h.len;t+=4){push(t,root,1.3);push(t+1.5,root+third,1.3);push(t+3,root+fifth,.8)}
 }return result}
regBassAdd.onclick=()=>{let harmony=sourceHarmony();if(!harmony.length){let offset=0;harmony=state.chords.map(c=>{const h={root:c.root,start:offset,len:c.duration,pitches:c.notes.map(n=>n.pitch)};offset+=c.duration;return h}).filter(h=>h.pitches.length)}if(!harmony.length)return toast('Agregá acordes para generar el bajo.');checkpoint();tracks().push({name:'Bajo reguetón · '+regBassPattern.options[regBassPattern.selectedIndex].text,instrument:'sine',volume:.8,notes:reggaetonBassNotes(harmony,regBassPattern.value)});activeTrack=tracks().length-1;picked.clear();render();fit()};
