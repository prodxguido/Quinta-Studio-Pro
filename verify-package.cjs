const asar=require('@electron/asar');
const assert=require('node:assert/strict');
const archive='release/win-unpacked/resources/app.asar';
const files=asar.listPackage(archive).map(name=>name.replaceAll('\\','/'));
for(const name of ['index.html','app.js','studio.js','session.js','harmony.js','plugg.js','instruments.js','inspector.js','transport.js','loop-editor.js','style.css','studio.css','desktop/main.cjs']){
 assert(files.includes('/'+name),'Missing packaged file: '+name);
 if(name.endsWith('.js')||name.endsWith('.cjs'))new (require('node:vm').Script)(asar.extractFile(archive,name).toString(),{filename:name});
}
assert(!files.some(name=>name.includes('test-')));
console.log('PASS: packaged HTML, styles and all modules present; JavaScript parses; tests excluded.');
