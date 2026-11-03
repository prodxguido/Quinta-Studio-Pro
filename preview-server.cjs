const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const root=__dirname,mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.wav':'audio/wav'};
http.createServer((req,res)=>{let file;
 const pathname=new URL(req.url,'http://localhost').pathname;
 try{file=path.resolve(root,'.'+decodeURIComponent(pathname==='/'?'/index.html':pathname));if(!file.startsWith(root+path.sep)||!mime[path.extname(file)])throw Error();res.setHeader('Content-Type',mime[path.extname(file)]);res.setHeader('Cache-Control','no-store');fs.createReadStream(file).on('error',()=>{res.statusCode=404;res.end()}).pipe(res)}catch{res.statusCode=404;res.end()}
}).listen(5173,'127.0.0.1',()=>console.log('QUINTA: http://127.0.0.1:5173'));
