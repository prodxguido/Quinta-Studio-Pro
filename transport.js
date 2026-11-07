// Schedule audio against AudioContext time; rendering never determines loop boundaries.
let transportTimer=null,transportGeneration=0;
const stopBeforeTransport=stop;
stop=function(){transportGeneration++;if(transportTimer!==null)clearTimeout(transportTimer);transportTimer=null;stopBeforeTransport()};
$('grid').onchange=()=>{gridStep();drawRoll()};
play=function(){
 stop();const region=loopRegion();
 const currentNotes=()=>events().filter(n=>Number.isFinite(n.start)&&Number.isFinite(n.len)&&n.len>0&&n.start<region.end&&n.start+n.len>region.start).map(n=>({...n,start:Math.max(n.start,region.start)-region.start,len:Math.min(n.start+n.len,region.end)-Math.max(n.start,region.start)}));
 const notes=currentNotes();
 const beats=loopBeats();if((!notes.length&&!state.drumLoop)||!beats)return;
 audio();playing=true;$('play').textContent='■ Detener';
 const generation=transportGeneration,beat=60/state.tempo;
 started=ctx.currentTime+.04;totalTime=beats*beat;
 let nextCycle=0;const scheduled=[];
 function pump(){
  if(!playing||generation!==transportGeneration)return;
  const now=ctx.currentTime;
  if(!$('loop').checked){
   for(const cycle of scheduled)if(cycle.index>0&&cycle.start>=now){cycle.voices.forEach(o=>{try{o.stop()}catch{}});cycle.cancelled=true}
  }
  while(started+nextCycle*totalTime<now+.18&&(nextCycle===0||$('loop').checked)){
   const start=started+nextCycle*totalTime,index=nextCycle++;
   if(start+totalTime<now)continue;
   const from=timers.length;
   currentNotes().forEach(n=>{
    const time=start+n.start*beat;
    if(time<now)return;
    tone(n.pitch,time+($('human').checked?Math.random()*.012:0),n.len*beat,$('human').checked?n.velocity-8+Math.random()*16:n.velocity,n.instrument,n.channel);
   });scheduled.push({index,start,voices:timers.slice(from)});
  }
  const live=scheduled.filter(c=>!c.cancelled);
  const end=live.length?live[live.length-1].start+totalTime:started+totalTime;
  if(!$('loop').checked&&now>=end){stop();return}
  // Discard historical bookkeeping while allowing natural release tails.
  while(scheduled.length>2&&scheduled[0].start+totalTime<now)scheduled.shift();
  transportTimer=setTimeout(pump,25);
 }
 function draw(){
  if(!playing||generation!==transportGeneration)return;
  const elapsed=Math.max(0,ctx.currentTime-started),position=(elapsed%totalTime)/beat;
  const head=$('playhead');head.hidden=false;head.style.left=52+(region.start+position)*unit+'px';
  $('position').textContent='COMPÁS '+(Math.floor((region.start+position)/4)+1);raf=requestAnimationFrame(draw);
 }
 pump();draw();
};
