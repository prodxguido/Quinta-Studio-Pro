autowatch=1;
var incoming={};
function anything(){if(messagename==="/quinta")quinta.apply(this,arrayfromargs(arguments));}
function quinta(id,index,total,part){
 id=String(id);index=Number(index);total=Number(total);
 if(index!==Math.floor(index)||total!==Math.floor(total)||total<1||total>10000||index<0||index>=total)return;
 var packet=incoming[id]||(incoming[id]={parts:[],total:total,count:0});
 if(packet.total!==total)return;
 if(packet.parts[index]===undefined){packet.parts[index]=String(part);packet.count++}
 if(packet.count!==total)return;
 delete incoming[id];
 try{var project=JSON.parse(decodeURIComponent(packet.parts.join('')));if(project.protocol!=="quinta-live-v1")throw "Protocolo incompatible";importProject(project)}
 catch(error){post("QUINTA Receiver: "+error+"\n")}
}
function importProject(project){
 var song=new LiveAPI(null,"live_set");song.set("tempo",Number(project.tempo)||120);
 for(var i=0;i<project.tracks.length;i++){
  var channel=project.tracks[i];song.call("create_midi_track",-1);
  var index=Number(song.getcount("tracks"))-1,track=new LiveAPI(null,"live_set tracks "+index);
  track.set("name",String(channel.name||("QUINTA "+(i+1))));
  var end=0;channel.notes.forEach(function(note){end=Math.max(end,Number(note.start_time)+Number(note.duration))});
  track.call("create_midi_clip",0,Math.max(1,Math.ceil(end/4)*4));
  var clips=track.get("arrangement_clips"),clipId=0;
  for(var j=0;j<clips.length;j++)if(Number(clips[j])>0)clipId=Number(clips[j]);
  if(!clipId)throw "No se creó el clip de Arrangement";
  var clip=new LiveAPI(null,"id "+clipId),dictionary=new Dict();
  dictionary.setparse("wrapper",JSON.stringify({notes:channel.notes.map(function(note){return {pitch:Number(note.pitch),start_time:Number(note.start_time),duration:Number(note.duration),velocity:Number(note.velocity)||90,mute:note.mute?1:0}})}));
  if(channel.notes.length)clip.call("add_new_notes",dictionary.get("wrapper"));
 }
 post("QUINTA Receiver: "+project.tracks.length+" pistas importadas.\n");
}
