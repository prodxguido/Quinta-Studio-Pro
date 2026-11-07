const {app,BrowserWindow,shell,Menu,ipcMain,nativeImage}=require('electron');
const {autoUpdater}=require('electron-updater');
const fs=require('node:fs');
const path=require('node:path');
const {sendToLive}=require('./live-transport.cjs');
app.setAppUserModelId('com.quinta.studio');
function createWindow(){
 const win=new BrowserWindow({width:1440,height:940,minWidth:900,minHeight:650,backgroundColor:'#141615',title:'QUINTA',autoHideMenuBar:true,webPreferences:{preload:path.join(__dirname,'preload.cjs'),nodeIntegration:false,contextIsolation:true,sandbox:true,backgroundThrottling:false}});
 Menu.setApplicationMenu(null);
 win.webContents.setWindowOpenHandler(({url})=>{if(url.startsWith('https://'))shell.openExternal(url);return {action:'deny'}});
 win.webContents.on('will-navigate',(event)=>event.preventDefault());
 win.webContents.session.setPermissionRequestHandler((contents,permission,callback)=>callback(false));
 win.loadFile(path.join(__dirname,'..','index.html'));
}
require('./project-files.cjs')(ipcMain,app);
app.whenReady().then(createWindow);
ipcMain.handle('send-to-live',(_event,payload)=>sendToLive(payload));
autoUpdater.autoDownload=false;
autoUpdater.autoInstallOnAppQuit=false;
let updateState='idle';
function sendUpdate(channel,payload={}){for(const win of BrowserWindow.getAllWindows())win.webContents.send('update-status',{channel,...payload});}
ipcMain.handle('update-check',async()=>{if(!app.isPackaged)return {ok:false,message:'Las actualizaciones están disponibles en la versión instalada.'};if(updateState==='checking'||updateState==='downloading')return {ok:false,message:'Ya hay una comprobación o descarga en curso.'};updateState='checking';try{const result=await autoUpdater.checkForUpdates();if(!result){updateState='idle';return {ok:true,available:false,version:app.getVersion()};}return {ok:true,available:result.updateInfo.version!==app.getVersion(),version:result.updateInfo.version};}catch(error){updateState='idle';return {ok:false,message:error.message};}});
ipcMain.handle('update-download',async()=>{if(updateState!=='available')return {ok:false,message:'Primero comprobá si hay una actualización disponible.'};updateState='downloading';try{await autoUpdater.downloadUpdate();return {ok:true};}catch(error){updateState='idle';return {ok:false,message:error.message};}});
autoUpdater.on('update-available',info=>{updateState='available';sendUpdate('available',{version:info.version});});
autoUpdater.on('update-not-available',info=>{updateState='idle';sendUpdate('up-to-date',{version:info.version});});
autoUpdater.on('download-progress',p=>sendUpdate('progress',{percent:Math.round(p.percent)}));
autoUpdater.on('update-downloaded',info=>{updateState='downloaded';sendUpdate('downloaded',{version:info.version});});
autoUpdater.on('error',error=>{updateState='idle';sendUpdate('error',{message:error.message});});
ipcMain.handle('update-install',()=>{if(updateState==='downloaded')autoUpdater.quitAndInstall();});
ipcMain.on('drag-midi',(event,bytes)=>{
 if(!event.senderFrame?.url.startsWith('file:')||!Array.isArray(bytes)||bytes.length>10000000||!bytes.every(n=>Number.isInteger(n)&&n>=0&&n<=255))return;
 const data=Buffer.from(bytes);if(data.subarray(0,4).toString()!=='MThd')return;
 const dir=path.join(app.getPath('temp'),'quinta-midi');fs.mkdirSync(dir,{recursive:true});
 const file=path.join(dir,'QUINTA-'+Date.now()+'.mid');fs.writeFileSync(file,data);
 const icon=nativeImage.createFromBuffer(Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=','base64'));
 event.sender.startDrag({file,icon});
});
app.on('window-all-closed',()=>app.quit());
