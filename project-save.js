if(window.quintaDesktop?.projectFiles){
 const files=window.quintaDesktop.projectFiles;
 async function saveProject(as=false){
  const result=await files({action:as?'saveAs':'save',data:JSON.stringify(state,null,2)});
  toast(result.ok?'Guardado: '+result.name:result.canceled?'Guardado cancelado.':result.message);return result.ok;
 }
 $('save').onclick=()=>saveProject();
 const saveAs=document.createElement('button');saveAs.textContent='Guardar como…';saveAs.onclick=()=>saveProject(true);$('save').after(saveAs);
 const folder=document.createElement('button');folder.textContent='Carpeta de progresiones';folder.onclick=async()=>{const r=await files({action:'folder'});if(r.ok)toast('Carpeta predeterminada: '+r.directory);else if(!r.canceled)toast(r.message)};saveAs.after(folder);
 const oldReset=resetSession;resetSession=function(){files({action:'reset'});oldReset()};$('sessionDiscard').onclick=resetSession;
 $('sessionSave').onclick=async()=>{const buttons=[$('sessionSave'),$('sessionDiscard'),$('sessionCancel')];buttons.forEach(b=>b.disabled=true);try{if(await saveProject())resetSession()}finally{buttons.forEach(b=>b.disabled=false)}};
 const loadProject=$('file').onchange;$('file').onchange=async e=>{await loadProject(e);await files({action:'reset'})};
 $('load').onclick=async()=>{const r=await files({action:'open'});if(!r.ok){if(!r.canceled)toast(r.message);return}const ok=await loadProject({target:{files:[{text:async()=>r.data}],value:''}});if(!ok)await files({action:'reset'});else toast('Abierto: '+r.name)};
}
