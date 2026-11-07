// Run with: node_modules/electron/dist/electron.exe test-sound-design.cjs
const {app,BrowserWindow}=require('electron'),assert=require('node:assert/strict'),path=require('node:path');
app.setPath('userData',require('node:fs').mkdtempSync(path.join(require('node:os').tmpdir(),'quinta-audio-profile-')));
app.whenReady().then(async()=>{
 const win=new BrowserWindow({show:false,width:1440,height:940,webPreferences:{contextIsolation:true}}),errors=[];
 win.webContents.on('console-message',(_e,level,message)=>{if(level>=3)errors.push(message)});
 try{
  await win.loadFile(path.join(__dirname,'index.html'));
  const result=await win.webContents.executeJavaScript(`(async()=>{
   for(let i=0;i<100&&typeof studioVoices==='undefined';i++)await new Promise(r=>setTimeout(r,50));
   if(typeof studioVoices==='undefined')throw Error('Sound design did not load');
   const results=[];
   for(const id of Object.keys(studioVoices)){
    stop();ctx=new OfflineAudioContext(2,44100*4,44100);state.audioFX={amount:.35,decay:1.5};tone(60,0,1,100,id,-1);tone(64,0,1,100,id,-1);tone(67,0,1,100,id,-1);
    const buffer=await ctx.startRendering();let peak=0,energy=0;for(const value of buffer.getChannelData(0)){if(!Number.isFinite(value))throw Error(id+' non-finite audio');peak=Math.max(peak,Math.abs(value));energy+=value*value}
    if(peak>1||energy<.001)throw Error(id+' clipping/silent: '+peak);
    results.push({id,peak,energy});
   }
   stop();ctx=new OfflineAudioContext(2,44100,44100);state.tracks=[{name:'A',instrument:'neon',notes:[{pitch:60,start:0,len:1,velocity:90}],audioFX:{cutoff:500}},{name:'B',instrument:'neon',notes:[{pitch:64,start:0,len:1,velocity:90}],audioFX:{cutoff:8000}}];state.chords=[];render();
   tone(60,0,.3,90,'neon',0);tone(64,0,.3,90,'neon',1);
   if(audioBuses.get(0).input===audioBuses.get(1).input||audioBuses.get(0).input.frequency.value!==500||audioBuses.get(1).input.frequency.value!==8000)throw Error('Shared channel effects');
   if(!audioBuses.get(0).input24||fxSettings(0).slope!==12)throw Error('Default filter slope');
   changeFX(0,'slope',24);if(fxSettings(0).slope!==24||!document.querySelector('.channel-fx-filter select[aria-label^="Pendiente"]'))throw Error('Selectable 24 dB filter slope');
   if(events().map(n=>n.channel).join()!=='0,1')throw Error('Transport lost channel routing');
   const liveVelocity=events()[0].velocity;state.tracks[0].volume=.25;changeChannelVolume(0,.25);if(!audioBuses.get(0).volume||events()[0].velocity!==liveVelocity)throw Error('Channel volume is still baked into note velocity');
   const before=JSON.stringify(state);rememberFX();changeFX(0,'amount',.6);const after=JSON.stringify(state);$('undo').click();if(JSON.stringify(state)!==before)throw Error('FX undo');$('redo').click();if(JSON.stringify(state)!==after)throw Error('FX redo');
   if(document.querySelectorAll('.reverb-knob-label .reverb-knob').length!==4||document.querySelectorAll('.filter-knob-label .reverb-knob').length!==4)throw Error('Missing filter or reverb knobs');
   if(document.querySelectorAll('.channel-fx-filter').length!==3||document.querySelectorAll('.channel-fx-reverb').length!==3)throw Error('Missing separate FX panels');
   if(document.querySelectorAll('.channel-row.mixer-strip').length!==3||!document.querySelector('.mixer-strip .mixer-volume input[type=range]'))throw Error('Vertical mixer controls missing');
   if(!document.querySelector('.loop-strip #drumLoop')||!document.querySelector('.loop-strip #afroLoop')||!document.querySelector('.mixer-scroll #trackList'))throw Error('Loop strip or horizontal mixer viewport missing');
   for(const selector of ['.mixer-strip .preset-browser','.mixer-strip .channel-arp','.mixer-strip .channel-fx-filter','.mixer-strip .channel-fx-reverb']){const panel=document.querySelector(selector);panel.open=true;panel.dispatchEvent(new PointerEvent('pointerleave'));if(panel.open)throw Error('Panel stays open after pointer leaves: '+selector)}
   if(Math.abs(cutoffPosition(2000)-.55)>.00001||Math.abs(cutoffFrequency(.55)-2000)>1)throw Error('Cutoff control scale');
   if(getComputedStyle($('sound')).display!=='none')throw Error('Old sound selector is visible');
   if(getComputedStyle(document.querySelector('.preset-categories')).position==='fixed'||getComputedStyle(document.querySelector('.fx-controls')).position==='fixed')throw Error('Floating controls remain fixed');
   if(document.querySelectorAll('.preset-category').length<7)throw Error('Missing categories');
   const category=document.querySelector('.preset-category');category.dispatchEvent(new PointerEvent('pointerenter'));if(!category.open)throw Error('Hover menu did not open');category.dispatchEvent(new PointerEvent('pointerleave'));if(category.open)throw Error('Hover menu did not close');
   return results;
  })()`);
  assert.deepEqual(errors,[]);console.log('PASS real Electron startup, 18 rendered stereo chord presets, finite/non-silent audio without clipping, isolated channel effects, routing, undo/redo and controls.',JSON.stringify(result.map(r=>({id:r.id,peak:+r.peak.toFixed(3)}))));require('node:fs').writeFileSync(path.join(require('node:os').tmpdir(),'quinta-sound-test.json'),JSON.stringify({ok:true,result,errors}));app.exit(0);
 }catch(error){console.error(error,errors);require('node:fs').writeFileSync(path.join(require('node:os').tmpdir(),'quinta-sound-test.json'),JSON.stringify({ok:false,error:String(error),errors}));app.exit(1)}
});
