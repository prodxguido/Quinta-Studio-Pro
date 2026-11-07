// Space is transport, except while editing text/numeric values.
document.addEventListener('keydown',e=>{
 if(e.code!=='Space'||e.altKey||e.ctrlKey||e.metaKey)return;
 if(/INPUT|TEXTAREA|SELECT/.test(e.target.tagName)||e.target.isContentEditable)return;
 e.preventDefault();e.stopImmediatePropagation();if(!e.repeat)$('play').click();
},true);
const webDrag=$('export').ondragstart;
$('export').ondragstart=e=>{if(window.quintaDesktop){e.preventDefault();window.quintaDesktop.dragMidi(midi())}else webDrag(e)};
if(window.quintaDesktop)$('export').title='Arrastrar archivo MIDI al DAW · clic para guardar';
for(const [value,label] of [['0.125','1/32'],['0.0625','1/64'],['0.03125','1/128']])$('grid').add(new Option('Rejilla '+label,value));
gridStep=function(){const v=Number($('grid').value);return [1,.5,.25,.125,.0625,.03125].includes(v)?v:.25};
const priorGesture=noteGesture;
noteGesture=function(e,entry,el){
 if(e.offsetX>7||e.shiftKey)return priorGesture(e,entry,el);
 e.preventDefault();e.stopPropagation();picked=new Set([entry.n]);selectionUI();listen(entry.n);
 const start=entry.n.start,end=start+entry.n.len,x=e.clientX;let changed=false;
 el.setPointerCapture(e.pointerId);
 el.onpointermove=ev=>{
  const next=Math.max(0,Math.min(end-gridStep(),start+Math.round((ev.clientX-x)/unit/gridStep())*gridStep()));
  if(next===entry.n.start)return;
  if(!changed){checkpointNoteEdit();changed=true}
  entry.n.start=next;entry.n.len=end-next;
  el.style.left=52+(entry.offset+next)*unit+'px';el.style.width=entry.n.len*unit-2+'px';
 };
 el.onpointerup=el.onpointercancel=()=>{el.onpointermove=null;if(changed){if(entry.track===-1){entry.owner.custom=true;selected=entry.index}render()}};
};
const volumeChannels=channelUI;
function channelVolumeDb(gain){return gain<=0?-61:Math.max(-60,Math.min(6,20*Math.log10(gain)))}
function channelVolumeGain(db){return db<=-60.5?0:10**(db/20)}
function rememberChannelVolume(){history.push(JSON.stringify(state));future=[];if(history.length>100)history.shift()}
channelUI=function(){volumeChannels();Array.from($('trackList').children).forEach((row,k)=>{
 const label=document.createElement('label'),slider=document.createElement('input'),output=document.createElement('output'),fader=document.createElement('div'),scale=document.createElement('div');label.className='mixer-volume';label.textContent='Volumen';slider.type='range';slider.min='-61';slider.max='6';slider.step='.1';slider.value=String(channelVolumeDb(k===0?state.chordVolume??1:tracks()[k-1].volume??1));slider.setAttribute('aria-label','Volumen del canal en dB');
 const paint=()=>{const db=Number(slider.value);output.textContent=db<=-60.5?'−∞':(db>0?'+':'')+db.toFixed(1)+' dB';slider.setAttribute('aria-valuetext',output.textContent)};paint();
 scale.className='mixer-volume-scale';scale.innerHTML='<span>+6</span><span>0</span><span>−12</span><span>−24</span><span>−36</span><span>−48</span><span>−∞</span>';fader.className='mixer-fader';fader.append(slider,scale);let changing=false;
 const apply=()=>{const gain=channelVolumeGain(Number(slider.value));if(k===0)state.chordVolume=gain;else tracks()[k-1].volume=gain;if(typeof changeChannelVolume==='function')changeChannelVolume(k-1,gain);localStorage.setItem('quinta',JSON.stringify(state));paint()};
 slider.oninput=()=>{if(!changing){rememberChannelVolume();changing=true}apply()};
 slider.onchange=()=>{if(!changing)rememberChannelVolume();apply();changing=false};label.append(output,fader);row.append(label);
})};
// Assign gain at source rather than by instrument: two tracks can share a preset.
events=function(){return [...(state.chordsMuted?[]:baseEvents().map(n=>({...n,instrument:state.chordInstrument,velocity:n.velocity*(state.chordVolume??1)}))),...tracks().filter(t=>!t.muted).flatMap(t=>t.notes.map(n=>({...n,instrument:t.instrument,velocity:n.velocity*(t.volume??1)})))].filter(n=>n.velocity>0)};
render();
const drumScript=document.createElement('script');drumScript.src='drum-loops.js';document.body.append(drumScript);
const composerScript=document.createElement('script');composerScript.src='composer.js';document.body.append(composerScript);
const editingScript=document.createElement('script');editingScript.src='editing-tools.js';document.body.append(editingScript);

composerScript.onload=()=>{const design=document.createElement('script');design.src='sound-design.js';document.body.append(design)};
const projectSaveScript=document.createElement('script');projectSaveScript.src='project-save.js';document.body.append(projectSaveScript);
