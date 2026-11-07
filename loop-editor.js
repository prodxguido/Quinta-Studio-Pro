const loopPanel=document.createElement('div');loopPanel.className='loop-panel';
loopPanel.innerHTML='<div class="loop-controls"><strong>Tramo del loop</strong><label>Desde tiempo <input id="loopFrom" type="number" min="1" step="0.25"></label><label>Hasta tiempo <input id="loopTo" type="number" min="1.25" step="0.25"></label><button id="loopAuto">Ajustar al canal activo</button><button id="loopExtend">＋ 1 compás</button><span id="loopLength"></span></div><div id="loopRulerViewport"><div id="loopRuler" aria-label="Arrastrá para seleccionar el tramo del loop"></div></div>';
$('rollwrap').before(loopPanel);
function setLoopRegion(start,end){
 if(!Number.isFinite(start)||!Number.isFinite(end)||start<0||end<=start)return false;
 checkpoint();state.loopRegion={start,end};render();return true;
}
function drawLoopRuler(){
 const r=loopRegion();$('loopFrom').value=r.start+1;$('loopTo').value=r.end+1;
 $('loopLength').textContent=((r.end-r.start)/4)+' compases · fin exclusivo';
 const ruler=$('loopRuler');ruler.innerHTML='';ruler.style.width=52+timeline()*unit+'px';
 for(let t=0;t<=timeline();t+=4){const label=document.createElement('span');label.className='loop-measure';label.textContent=String(t/4+1);label.style.left=52+t*unit+'px';ruler.append(label)}
 const band=document.createElement('div');band.className='loop-bracket';band.style.left=52+r.start*unit+'px';band.style.width=(r.end-r.start)*unit+'px';band.textContent='LOOP';
 for(const side of ['start','end']){const handle=document.createElement('span');handle.className='loop-handle '+side;handle.dataset.side=side;handle.title=side==='start'?'Mover inicio':'Mover final';band.append(handle)}ruler.append(band);
 $('loopRulerViewport').scrollLeft=$('rollwrap').scrollLeft;
}
$('loopFrom').onchange=$('loopTo').onchange=()=>{if(!setLoopRegion(Number($('loopFrom').value)-1,Number($('loopTo').value)-1))drawLoopRuler()};
$('loopAuto').onclick=()=>{checkpoint();delete state.loopRegion;render()};
$('loopExtend').onclick=()=>{const r=loopRegion();setLoopRegion(r.start,r.end+4)};
$('loopRuler').onpointerdown=e=>{
 if(!e.target.dataset?.side){const ruler=$('loopRuler'),beat=Math.max(0,Math.min(timeline(),(e.clientX-ruler.getBoundingClientRect().left-52)/unit));if(typeof playFromBeat==='function')playFromBeat(beat);return}
 e.preventDefault();const ruler=$('loopRuler'),r=loopRegion(),side=e.target.dataset?.side;
 const time=ev=>Math.max(0,Math.round((ev.clientX-ruler.getBoundingClientRect().left-52)/unit/gridStep())*gridStep());
 const origin=time(e);let start=r.start,end=r.end;ruler.setPointerCapture(e.pointerId);
 ruler.onpointermove=ev=>{const pos=time(ev);if(side==='start')start=Math.min(pos,end-gridStep());else if(side==='end')end=Math.max(pos,start+gridStep());else{start=Math.min(origin,pos);end=Math.max(origin+gridStep(),pos)}
  $('loopFrom').value=start+1;$('loopTo').value=end+1;
  const band=ruler.querySelector('.loop-bracket');band.style.left=52+start*unit+'px';band.style.width=(end-start)*unit+'px';
 };
 ruler.onpointerup=()=>{ruler.onpointermove=null;setLoopRegion(start,end)};
 ruler.onpointercancel=()=>{ruler.onpointermove=null;drawLoopRuler()};
};
$('rollwrap').addEventListener('scroll',()=>{$('loopRulerViewport').scrollLeft=$('rollwrap').scrollLeft});
const rollBeforeLoopEditor=drawRoll;drawRoll=function(){ensureRange();rollBeforeLoopEditor();drawLoopRuler()};
drawRoll();
