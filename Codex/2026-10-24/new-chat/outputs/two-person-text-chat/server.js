const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=__dirname,rooms=new Map(),port=process.env.PORT||8080,types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8'};
function json(res,x,status=200){res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(x))}
function body(req){return new Promise((ok,no)=>{let s='';req.on('data',d=>{s+=d;if(s.length>20000)no(Error('large'))});req.on('end',()=>{try{ok(JSON.parse(s||'{}'))}catch(e){no(e)}})})}
function getRoom(c){let r=rooms.get(c);if(!r){r={people:new Map(),msgs:[],updated:Date.now()};rooms.set(c,r)}r.updated=Date.now();return r}
const server=http.createServer(async(req,res)=>{const u=new URL(req.url,'http://localhost');
if(req.method==='POST'&&u.pathname.startsWith('/api/')){try{const d=await body(req),c=String(d.code||''),id=String(d.id||'');if(!/^[A-Z2-9]{10}$/.test(c)||!/^[a-f0-9-]{20,50}$/i.test(id))return json(res,{error:'Invalid room'},400);const r=getRoom(c);
if(u.pathname==='/api/join'){if(!r.people.has(id)&&r.people.size>=2)return json(res,{error:'Room is full'},409);r.people.set(id,Date.now());return json(res,{count:r.people.size,peer:r.people.size===2})}
if(!r.people.has(id))return json(res,{error:'Join the room first'},403);
if(u.pathname==='/api/send'){if(typeof d.iv!=='string'||typeof d.ciphertext!=='string'||d.ciphertext.length>12000)return json(res,{error:'Message too long'},400);r.msgs.push({from:id,iv:d.iv,ciphertext:d.ciphertext,at:Date.now()});r.msgs=r.msgs.slice(-100);return json(res,{ok:true})}
if(u.pathname==='/api/poll'){r.people.set(id,Date.now());return json(res,{msgs:r.msgs.filter(m=>m.from!==id&&m.at>(d.after||0)),peer:r.people.size>1})}
if(u.pathname==='/api/leave'){r.people.delete(id);if(!r.people.size)rooms.delete(c);return json(res,{ok:true})}
return json(res,{error:'Not found'},404)}catch{return json(res,{error:'Invalid request'},400)}}
if(req.method!=='GET'){res.writeHead(405).end();return}let p=decodeURIComponent(u.pathname),f=path.resolve(root,p==='/'?'index.html':'.'+p);if(!f.startsWith(root+path.sep)&&f!==path.join(root,'index.html')){res.writeHead(403).end();return}fs.readFile(f,(e,d)=>{if(e){res.writeHead(404).end('Not found');return}res.writeHead(200,{'Content-Type':types[path.extname(f)]||'application/octet-stream','Cache-Control':'no-store','Content-Security-Policy':"default-src 'self'; style-src 'self'; script-src 'self'; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'"}).end(d)})});
setInterval(()=>{for(const[c,r]of rooms){for(const[id,t]of r.people)if(Date.now()-t>120000)r.people.delete(id);if(!r.people.size||Date.now()-r.updated>1800000)rooms.delete(c)}},30000).unref();
server.listen(port,'0.0.0.0',()=>console.log('Open http://localhost:'+port));