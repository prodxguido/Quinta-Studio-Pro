const dgram=require('node:dgram');
const {randomUUID}=require('node:crypto');
function oscString(s){const b=Buffer.from(String(s)+'\0');return Buffer.concat([b,Buffer.alloc((4-b.length%4)%4)])}
function packet(address,types,args){return Buffer.concat([oscString(address),oscString(','+types),...args.map((v,i)=>{if(types[i]==='s')return oscString(v);const b=Buffer.alloc(4);b.writeInt32BE(v);return b})])}
let busy=false;
async function sendToLive(payload,{bootstrapPort=9010,receiverPort=9009,ackWait=10000}={}){
 if(busy)throw Error('Ya hay un envío a Live en curso.');
 if(!payload||payload.protocol!=='quinta-live-v1'||!Array.isArray(payload.tracks)||payload.tracks.length>128)throw Error('Proyecto QUINTA inválido.');
 const data=encodeURIComponent(JSON.stringify(payload));if(data.length>4000000)throw Error('Proyecto demasiado grande.');
 busy=true;
 const socket=dgram.createSocket('udp4'),id='q'+randomUUID(),chunks=data.match(/.{1,512}/g),statuses=[];
 let socketError;
 socket.on('error',e=>{socketError=e});
 socket.on('message',(b,r)=>{if(r.address!=='127.0.0.1'||r.port!==bootstrapPort)return;try{const m=JSON.parse(b);if(m.id===id)statuses.push(m)}catch{}});
 const pause=ms=>new Promise(r=>setTimeout(r,ms));
 const send=(b,port)=>new Promise((resolve,reject)=>socket.send(b,port,'127.0.0.1',e=>e?reject(e):resolve()));
 const check=()=>{if(socketError)throw socketError;let m;while((m=statuses.shift())){if(m.stage==='error')throw Error(m.detail);if(m.stage==='done'||m.stage==='ready')return m}return null};
 try{
  await new Promise((resolve,reject)=>{socket.once('error',reject);socket.bind(0,'127.0.0.1',resolve)});
  let ready=false;
  for(let i=0;i<80&&!ready;i++){
   if(i%4===0)await send(packet('/quinta_bootstrap','ss',[id,'2']),bootstrapPort);
   await pause(250);const m=check();ready=m?.stage==='ready';
  }
  if(!ready)throw Error('Sin confirmación del receptor en 20 s. Revisá Control Surface QUINTA y Log.txt de Live.');
  // Retry the same transaction: Max caches terminal results and never imports it twice.
  for(let attempt=0;attempt<3;attempt++){
   for(let i=0;i<chunks.length;i++){await send(packet('/quinta','siis',[id,i,chunks.length,chunks[i]]),receiverPort);await pause(2)}
   for(let i=0;i<Math.ceil(ackWait/250);i++){await pause(250);const m=check();if(m?.stage==='done')return {ok:true,message:m.detail}}
  }
  throw Error('Live no confirmó el resultado. No vuelvas a enviar sin revisar Arrangement: el resultado es desconocido.');
 }finally{socket.close();busy=false}
}
module.exports={sendToLive,packet};
