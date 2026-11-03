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
 const wrap=$('rollwrap'),rect=wrap.getBoundingClientRect(),y=e.clientY-rect.top;
 const pitchRow=(wrap.scrollTop+y)/rowHeight;
 rowHeight=Math.max(8,Math.min(36,rowHeight+(e.deltaY<0?2:-2)));
 $('zoomY').value=rowHeight;drawRoll();wrap.scrollTop=pitchRow*rowHeight-y;
},{passive:false});
render();

