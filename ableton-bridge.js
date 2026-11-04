const sendLiveButton=$('sendLive');
function quintaArrangementPayload(){
 const chords=[];let offset=0;
 state.chords.forEach(c=>{c.notes.forEach(n=>chords.push({pitch:n.pitch,start_time:offset+n.start,duration:n.len,velocity:n.velocity||90,mute:!!(n.muted||state.chordsMuted)}));offset+=c.duration});
 const channels=[{name:'QUINTA Acordes',notes:chords}];
 tracks().forEach((track,i)=>channels.push({name:track.name||'QUINTA Canal '+(i+1),notes:track.notes.map(n=>({pitch:n.pitch,start_time:n.start,duration:n.len,velocity:n.velocity||90,mute:!!(n.muted||track.muted)}))}));
 return {protocol:'quinta-live-v1',tempo:state.tempo,tracks:channels};
}
sendLiveButton.onclick=async()=>{
 if(!window.quintaDesktop?.sendToLive){toast('Abrí QUINTA con el lanzador de escritorio para enviar a Ableton.');return}
 try{const result=await window.quintaDesktop.sendToLive(quintaArrangementPayload());toast(result.message)}
 catch(error){toast('No se pudo enviar: '+error.message)}
};
