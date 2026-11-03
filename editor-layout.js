// Separate sibling buttons keep palette audition independent from insertion.
function palettePreviews(){
 Array.from($('degrees').children).forEach((card,i)=>{
  const wrap=document.createElement('div');wrap.className='degree-preview-wrap';card.before(wrap);wrap.append(card);
  const preview=document.createElement('button');preview.className='degree-preview';preview.textContent='🔊';preview.title='Escuchar '+title(degree(i));preview.setAttribute('aria-label',preview.title+' sin agregar');
  preview.onclick=e=>{e.stopPropagation();const chord=materialize(degree(i));audio();chord.notes.forEach(n=>tone(n.pitch,ctx.currentTime,.65,n.velocity,state.chordInstrument||state.sound))};wrap.append(preview);
 });
}
const renderWithPalettePreview=render;render=function(){renderWithPalettePreview();palettePreviews()};
// Retain clipboard position state for keyboard shortcuts, without visual clutter.
$('copyNotes').hidden=true;$('pasteNotes').hidden=true;$('pastePosition').closest('label').hidden=true;
globalTools.querySelector('.hint').hidden=true;duplicateAction.hidden=true;
$('rollwrap').before(controls);
$('rollwrap').addEventListener('wheel',e=>{
 if(!e.ctrlKey)return;e.preventDefault();e.stopPropagation();if(!e.deltaY)return;
 const wrap=$('rollwrap'),factor=e.deltaY<0?1.15:1/1.15;
 const notes=entries().filter(item=>picked.size?picked.has(item.n):(activeTrack===-1?item.track===-1&&item.index===selected:item.track===activeTrack));
 const beat=notes.length?(Math.min(...notes.map(item=>item.offset+item.n.start))+Math.max(...notes.map(item=>item.offset+item.n.start+item.n.len)))/2:(wrap.scrollLeft+wrap.clientWidth/2-52)/unit;
 const pitchRow=notes.length?127-(Math.min(...notes.map(item=>item.n.pitch))+Math.max(...notes.map(item=>item.n.pitch)))/2+.5:(wrap.scrollTop+wrap.clientHeight/2)/rowHeight;
 unit=Math.max(1,Math.min(480,unit*factor));
 rowHeight=Math.max(8,Math.min(36,rowHeight*factor));
 $('zoomX').max=480;$('zoomX').min=1;$('zoomX').value=unit;
 $('zoomY').value=rowHeight;drawRoll();
 wrap.scrollLeft=Math.max(0,52+beat*unit-wrap.clientWidth/2);
 wrap.scrollTop=Math.max(0,pitchRow*rowHeight-wrap.clientHeight/2);
},{passive:false});
// Capture on the persistent wrapper: drawRoll replaces individual piano keys.
const pianoZoom=$('rollwrap');
let pitchZoomPointer=null;
pianoZoom.addEventListener('pointerdown',e=>{if(e.button!==0||!e.target.closest('.key'))return;e.preventDefault();e.stopPropagation();const rect=pianoZoom.getBoundingClientRect(),y=e.clientY-rect.top;pitchZoomPointer={id:e.pointerId,x:e.clientX,y,height:rowHeight,row:(pianoZoom.scrollTop+y)/rowHeight};pianoZoom.setPointerCapture(e.pointerId)},true);
pianoZoom.addEventListener('pointermove',e=>{if(!pitchZoomPointer||pitchZoomPointer.id!==e.pointerId)return;e.preventDefault();rowHeight=Math.max(8,Math.min(36,pitchZoomPointer.height*Math.exp((e.clientX-pitchZoomPointer.x)/180)));$('zoomY').value=rowHeight;drawRoll();pianoZoom.scrollTop=Math.max(0,pitchZoomPointer.row*rowHeight-pitchZoomPointer.y);});
const endPitchZoom=()=>{pitchZoomPointer=null};pianoZoom.addEventListener('pointerup',endPitchZoom);pianoZoom.addEventListener('pointercancel',endPitchZoom);
render();

