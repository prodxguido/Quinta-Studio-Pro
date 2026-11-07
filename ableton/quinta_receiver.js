autowatch=1;
outlets=1;
var incoming={},completed={},authorized={},initialized=false;
function bang(){initialized=true;post('QUINTA Receiver v2: Live API lista\n');}
function status(id,stage,detail){outlet(0,'/quinta_status',String(id),String(stage),String(detail));}
function anything(){
 var a=arrayfromargs(arguments);
 if(messagename==='/quinta_probe'&&initialized){
  var id=String(a[0]);authorized[id]=Date.now();
  status(id,'ready','quinta-live-v2');
 }else if(messagename==='/quinta')quinta.apply(this,a);
}
function quinta(id,index,total,part){
 id=String(id);index=Number(index);total=Number(total);
 if(!initialized||!authorized[id]||Date.now()-authorized[id]>120000)return;
 if(completed[id]){status(id,completed[id][0],completed[id][1]);return;}
 if(index!==Math.floor(index)||total!==Math.floor(total)||total<1||total>7813||index<0||index>=total||String(part).length>512)return;
 // Bound partial storage and expire abandoned transfers.
 for(var key in incoming)if(Date.now()-incoming[key].time>60000)delete incoming[key];
 var packet=incoming[id]||(incoming[id]={parts:[],total:total,count:0,time:Date.now()});
 if(packet.total!==total)return;
 if(packet.parts[index]===undefined){packet.parts[index]=String(part);packet.count++;}
 if(packet.count!==total)return;
 delete incoming[id];
 try{
  var project=JSON.parse(decodeURIComponent(packet.parts.join('')));
  validate(project);var count=importProject(project);
  completed[id]=['done',count+' pistas importadas en Arrangement.'];
 }catch(error){completed[id]=['error',String(error)];}
 status(id,completed[id][0],completed[id][1]);
 // Retain deduplication throughout the authorized retry window.
 for(var old in authorized)if(Date.now()-authorized[old]>120000){delete authorized[old];delete completed[old];}
}
function validate(p){
 if(p.protocol!=='quinta-live-v1'||!Array.isArray(p.tracks)||p.tracks.length>128||!isFinite(p.tempo)||p.tempo<20||p.tempo>999)throw 'Proyecto inválido';
 var notes=0;
 p.tracks.forEach(function(t){
  if(!Array.isArray(t.notes))throw 'Canal sin notas';
  notes+=t.notes.length;
  t.notes.forEach(function(n){
   if(!isFinite(n.pitch)||n.pitch%1||n.pitch<0||n.pitch>127||!isFinite(n.start_time)||n.start_time<0||!isFinite(n.duration)||n.duration<=0||n.start_time+n.duration>1576800||!isFinite(n.velocity)||n.velocity<0||n.velocity>127)throw 'Nota MIDI inválida';
  });
 });
 if(notes>100000)throw 'Demasiadas notas';
 if(!notes)throw 'El proyecto no tiene notas para importar';
}
function ids(values){var result=[];for(var i=0;i<values.length;i++)if(values[i]==='id'&&Number(values[i+1])>0)result.push(Number(values[++i]));return result;}
function importProject(project){
 var song=new LiveAPI(null,'live_set'),created=[],oldTempo=Number(song.get('tempo')),count=0;
 try{
  for(var i=0;i<project.tracks.length;i++){
   var channel=project.tracks[i];if(!channel.notes.length)continue;
   var before=Number(song.getcount('tracks'));
   song.call('create_midi_track',-1);
   if(Number(song.getcount('tracks'))!==before+1)throw 'Live no creó la pista MIDI';
   var track=new LiveAPI(null,'live_set tracks '+before);created.push(Number(track.id));
   track.set('name',String(channel.name||('QUINTA '+(i+1))));
   var end=0;channel.notes.forEach(function(n){end=Math.max(end,n.start_time+n.duration);});
   track.call('create_midi_clip',0,Math.max(1,Math.ceil(end/4)*4));
   var clips=ids(track.get('arrangement_clips'));
   if(clips.length!==1)throw 'Live no creó un único clip de Arrangement';
   var clip=new LiveAPI(null,'id '+clips[0]),dictionary=new Dict();
   try{
    dictionary.setparse('wrapper',JSON.stringify({notes:channel.notes.map(function(n){return {pitch:n.pitch,start_time:n.start_time,duration:n.duration,velocity:n.velocity,mute:n.mute?1:0};})}));
    var added=clip.call('add_new_notes',dictionary.get('wrapper'));
    var noteCount=0;for(var j=0;j<added.length;j++)if(typeof added[j]==='number')noteCount++;
    if(noteCount!==channel.notes.length)throw 'Live no confirmó todas las notas del clip';
   }finally{dictionary.clear();}
   count++;
  }
  song.set('tempo',project.tempo);
  return count;
 }catch(error){
  var failures=[];
  for(var k=created.length-1;k>=0;k--){
   try{
    var tracks=ids(song.get('tracks')),index=tracks.indexOf(created[k]);
    if(index>=0)song.call('delete_track',index);
    if(ids(song.get('tracks')).indexOf(created[k])>=0)throw 'pista '+created[k];
   }catch(e){failures.push(String(e));}
  }
  try{song.set('tempo',oldTempo);}catch(e){failures.push('tempo: '+e);}
  throw String(error)+(failures.length?' — limpieza incompleta: '+failures.join('; '):' — importación revertida');
 }
}
