const assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs/promises'),path=require('node:path'),os=require('node:os');
(async()=>{
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'quinta-save-test-')),project=path.join(root,'song.json');let handler,folders=0,saves=0,cancel=false;
 const dialog={showOpenDialog:async()=>{folders++;return {canceled:cancel,filePaths:[root]}},showSaveDialog:async()=>{saves++;return {canceled:cancel,filePath:project}}};
 const module={exports:{}},source=await fs.readFile('desktop/project-files.cjs','utf8');
 vm.runInNewContext(source,{module,require:name=>name==='electron'?{dialog,BrowserWindow:{fromWebContents:()=>({})}}:require(name)});
 module.exports({handle:(_name,fn)=>handler=fn},{getPath:()=>root});const e={sender:{id:1},senderFrame:{url:'file:///quinta/index.html'}};
 try{
  cancel=true;assert.equal((await handler(e,{action:'save',data:'{}'})).canceled,true);assert.equal(saves,0);
  cancel=false;const saved=await handler(e,{action:'save',data:'{"tempo":110}'});assert.equal(saved.ok,true,JSON.stringify(saved));assert.equal(folders,2);assert.equal(saves,1);
  await handler(e,{action:'save',data:'{"tempo":120}'});assert.equal(saves,1);assert.equal(JSON.parse(await fs.readFile(project)).tempo,120);
  await handler(e,{action:'reset'});await handler(e,{action:'save',data:'{}'});assert.equal(folders,2);assert.equal(saves,2);
  cancel=true;assert.equal((await handler(e,{action:'saveAs',data:'{"tempo":200}'})).canceled,true);assert.equal(await fs.readFile(project,'utf8'),'{}');
  assert.equal((await handler(e,{action:'save',data:'invalid'})).ok,false);
  assert.equal((await handler({...e,senderFrame:{url:'https://example.com'}},{action:'save',data:'{}'})).ok,false);
  console.log('PASS native project save: folder persistence, repeat save without dialog, new project, Save As cancellation, invalid JSON and sender rejection.');
 }finally{await fs.rm(root,{recursive:true,force:true})}
})().catch(e=>{console.error(e);process.exitCode=1});
