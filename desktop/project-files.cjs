const {dialog,BrowserWindow}=require('electron');
const fs=require('node:fs/promises'),path=require('node:path');
module.exports=function registerProjectFiles(ipcMain,app){
 const current=new Map();let busy=false;
 const settingsPath=()=>path.join(app.getPath('userData'),'project-folders.json');
 async function settings(){try{return JSON.parse(await fs.readFile(settingsPath(),'utf8'))}catch{return {}}}
 async function folder(win){
  const previous=await settings();
  const result=await dialog.showOpenDialog(win,{title:'Elegí tu carpeta predeterminada de progresiones',defaultPath:previous.projects||app.getPath('documents'),properties:['openDirectory','createDirectory']});
  if(result.canceled)return null;
  previous.projects=result.filePaths[0];await fs.mkdir(path.dirname(settingsPath()),{recursive:true});await fs.writeFile(settingsPath(),JSON.stringify(previous));return previous.projects;
 }
 ipcMain.handle('project-files',async(event,request)=>{
  if(busy)return {ok:false,message:'Hay un diálogo de archivos abierto.'};
  busy=true;
  try{
   if(!event.senderFrame?.url.startsWith('file:'))throw Error('Origen no permitido.');
   const win=BrowserWindow.fromWebContents(event.sender),id=event.sender.id;
   if(request.action==='reset'){current.delete(id);return {ok:true}}
   if(request.action==='folder'){const directory=await folder(win);return {ok:!!directory,canceled:!directory,directory}}
   if(request.action==='open'){
    const s=await settings(),r=await dialog.showOpenDialog(win,{defaultPath:s.projects||app.getPath('documents'),properties:['openFile'],filters:[{name:'Proyecto QUINTA',extensions:['json']}]});
    if(r.canceled)return {ok:false,canceled:true};
    const file=r.filePaths[0];if((await fs.stat(file)).size>20e6)throw Error('El proyecto es demasiado grande.');
    const data=await fs.readFile(file,'utf8');JSON.parse(data);current.set(id,file);return {ok:true,data,name:path.basename(file)};
   }
   if(!['save','saveAs'].includes(request.action)||typeof request.data!=='string'||request.data.length>20e6)throw Error('Solicitud de guardado inválida.');
   JSON.parse(request.data);
   let file=request.action==='save'?current.get(id):null;
   if(!file){
    let directory=(await settings()).projects;
    if(!directory)directory=await folder(win);
    if(!directory)return {ok:false,canceled:true};
    const r=await dialog.showSaveDialog(win,{title:'Guardar progresión',defaultPath:path.join(directory,'Mi progresión.json'),filters:[{name:'Proyecto QUINTA',extensions:['json']}]});
    if(r.canceled)return {ok:false,canceled:true};file=r.filePath;
   }
   const temporary=file+'.quinta-tmp';
   try{await fs.writeFile(temporary,request.data);await fs.rename(temporary,file)}catch(e){await fs.unlink(temporary).catch(()=>{});throw e}
   current.set(id,file);return {ok:true,name:path.basename(file)};
  }catch(error){return {ok:false,message:error.message}}finally{busy=false}
 });
};
