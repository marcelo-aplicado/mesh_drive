"use strict";
module.exports.meshdrive = function (parent) {
    var fs = require('fs'), path = require('path'), crypto = require('crypto');
    var obj = {}; obj.parent = parent; obj.meshServer = parent.parent; obj.debug = obj.meshServer.debug;
    obj.exports = ['onWebUIStartupEnd','goPageEnd','onDeviceRefreshEnd','copyDetectedAddress','injectMeshDriveLauncher','injectDeviceMeshDrive','openDriveOnAgent','mapDriveOnAgent'];
    var settings = ((obj.meshServer || {}).config || {}).settings || {};
    var cfg = Object.assign({ enabled:true, route:'/drive', publicUrl:'https://mesh.aplicado.com.br/drive', meshFilesRoot:'/opt/meshcentral/meshcentral-files', meshDomainFolder:'domain', userFolderPrefix:'user-', defaultUserSubFolder:'', readOnly:false, allowPublic:false, passwordIterations:12000 }, settings.meshDrive || settings.meshdrive || {});
    function log(m){ try{obj.debug('PLUGIN','Mesh Drive',m);}catch(e){} try{console.log('PLUGIN: Mesh Drive: '+m);}catch(e){} }
    function safe(v){return String(v||'').replace(/[^a-zA-Z0-9._-]/g,'_').slice(0,160)||'_';}
    function norm(u){u=String(u||'').trim(); if(u.indexOf('\\')>=0)u=u.split('\\').pop(); if(u.indexOf('/')>=0)u=u.split('/').pop(); if(u.indexOf('@')>=0)u=u.split('@')[0]; if(u.toLowerCase().indexOf('user-')===0)u=u.substring(5); return safe(u.toLowerCase());}
    function mkdir(d){fs.mkdirSync(d,{recursive:true});}
    function parseBasic(req){var h=req.headers.authorization||''; if(h.toLowerCase().indexOf('basic ')!==0)return null; var raw=''; try{raw=Buffer.from(h.substring(6),'base64').toString('utf8');}catch(e){return null;} var i=raw.indexOf(':'); if(i<0)return null; return {username:raw.substring(0,i),password:raw.substring(i+1)};}
    function dbGet(id){return new Promise(function(resolve){var db=obj.meshServer&&(obj.meshServer.db||(obj.meshServer.webserver&&obj.meshServer.webserver.db)); if(!db||typeof db.Get!=='function')return resolve(null); try{db.Get(id,function(err,docs){if(err)return resolve(null); if(Array.isArray(docs))return resolve(docs[0]||null); resolve(docs||null);});}catch(e){resolve(null);}});}
    function tseq(a,b){a=String(a||'');b=String(b||'');var ab=Buffer.from(a),bb=Buffer.from(b); if(ab.length!==bb.length)return false; try{return crypto.timingSafeEqual(ab,bb);}catch(e){return false;}}
    function hashLen(h){try{var b=Buffer.from(String(h||''),'base64'); if(b&&b.length>0)return b.length;}catch(e){} return 64;}
    function pbkdf2(pw,salt,stored){return new Promise(function(resolve){try{crypto.pbkdf2(pw,salt,cfg.passwordIterations,hashLen(stored),'sha384',function(err,h){if(err){log('pbkdf2 error: '+err);return resolve(null);} resolve(h.toString('base64'));});}catch(e){log('pbkdf2 exception: '+e);resolve(null);}});}
    async function findUser(username){var u=norm(username),c=['user//'+u,'user/'+cfg.meshDomainFolder+'/'+u,'user//user-'+u,'user/'+cfg.meshDomainFolder+'/user-'+u]; for(var i=0;i<c.length;i++){var d=await dbGet(c[i]); if(d)return {id:c[i],doc:d,username:u};} return {id:'user//'+u,doc:null,username:u};}
    async function validate(username,password){if(cfg.allowPublic===true)return {id:'public',username:'public'}; var f=await findUser(username),d=f.doc; if(!d)return null; if(d.locked||d.siteadmin===-1)return null; var salt=d.salt,stored=d.hash||d.passhash||d.pwhash||d.passwordhash; if(!salt||!stored)return null; var computed=await pbkdf2(password,salt,stored); if(!computed)return null; if(!tseq(stored,computed)&&!tseq(String(stored).toLowerCase(),String(computed).toLowerCase()))return null; return {id:d._id||f.id,username:f.username,doc:d};}
    function authReq(res){res.writeHead(401,{'WWW-Authenticate':'Basic realm="Mesh Drive"','Content-Type':'text/plain; charset=utf-8'});res.end('Authentication required');}
    async function auth(req,res){var b=parseBasic(req); if(!b&&cfg.allowPublic!==true){authReq(res);return null;} var u=await validate(b?b.username:'public',b?b.password:''); if(!u){authReq(res);return null;} return u;}
    function rootDomain(){return path.resolve(path.join(cfg.meshFilesRoot,cfg.meshDomainFolder));}
    function userRoot(u){var r=path.join(rootDomain(),cfg.userFolderPrefix+norm(u.username||u.id||'user')); if(cfg.defaultUserSubFolder)r=path.join(r,safe(cfg.defaultUserSubFolder)); mkdir(r); return path.resolve(r);}
    function reqPath(req){var u=req.url||'/';var q=u.indexOf('?'); if(q>=0)u=u.substring(0,q); try{u=decodeURIComponent(u);}catch(e){} if(u.indexOf(cfg.route)===0)u=u.substring(cfg.route.length); if(u.indexOf('/')!==0)u='/'+u; return u;}
    function full(u,rel){var r=userRoot(u),clean=path.normalize('/'+rel).replace(/^([/\\])+/,'');var p=path.resolve(path.join(r,clean)); if(p!==r&&p.indexOf(r+path.sep)!==0)return null; return p;}
    function x(s){return String(s).replace(/[<>&'"]/g,function(c){return {'<':'&lt;','>':'&gt;','&':'&amp;',"'":'&apos;','"':'&quot;'}[c];});}
    function href(rel){var r=rel||'/'; if(r.indexOf('/')!==0)r='/'+r; return cfg.route.replace(/\/$/,'')+encodeURI(r).replace(/#/g,'%23');}
    function prop(f,rel){var st=fs.statSync(f),isD=st.isDirectory(),display=path.basename(f)||'/'; return '<D:response><D:href>'+x(href(rel+(isD&&!rel.endsWith('/')?'/':'')))+'</D:href><D:propstat><D:prop><D:displayname>'+x(display)+'</D:displayname><D:getlastmodified>'+st.mtime.toUTCString()+'</D:getlastmodified><D:creationdate>'+st.birthtime.toISOString()+'</D:creationdate>'+(isD?'<D:resourcetype><D:collection/></D:resourcetype>':'<D:resourcetype/>')+(!isD?'<D:getcontentlength>'+st.size+'</D:getcontentlength>':'')+'<D:getetag>"'+st.size+'-'+Number(st.mtimeMs).toString(16)+'"</D:getetag></D:prop><D:status>HTTP/1.1 200 OK</D:status></D:propstat></D:response>';}
    function xml(res,code,body,h){res.writeHead(code,Object.assign({'Content-Type':'application/xml; charset=utf-8'},h||{}));res.end(body);}
    function copyRec(s,d){var st=fs.statSync(s); if(st.isDirectory()){mkdir(d); fs.readdirSync(s).forEach(function(f){copyRec(path.join(s,f),path.join(d,f));});}else{fs.copyFileSync(s,d);}}
    async function dav(req,res){var u=await auth(req,res); if(!u)return; var rel=reqPath(req),fp=full(u,rel); if(!fp){res.writeHead(403);return res.end();} try{switch((req.method||'GET').toUpperCase()){case 'OPTIONS':res.writeHead(200,{'DAV':'1, 2','Allow':'OPTIONS, PROPFIND, GET, HEAD, PUT, DELETE, MKCOL, MOVE, COPY, LOCK, UNLOCK, PROPPATCH','MS-Author-Via':'DAV'});res.end();break;case 'PROPFIND':{if(!fs.existsSync(fp)){res.writeHead(404);return res.end();}var depth=req.headers.depth||'1',out=prop(fp,rel),st=fs.statSync(fp); if(depth!=='0'&&st.isDirectory())fs.readdirSync(fp).forEach(function(n){out+=prop(path.join(fp,n),path.posix.join(rel,n));}); xml(res,207,'<?xml version="1.0" encoding="utf-8"?><D:multistatus xmlns:D="DAV:">'+out+'</D:multistatus>');break;}case 'GET':case 'HEAD':{if(!fs.existsSync(fp)){res.writeHead(404);return res.end();}var st2=fs.statSync(fp);if(st2.isDirectory()){res.writeHead(403);return res.end();}res.writeHead(200,{'Content-Length':st2.size});if(req.method.toUpperCase()==='HEAD')res.end();else fs.createReadStream(fp).pipe(res);break;}case 'PUT':if(cfg.readOnly){res.writeHead(405);return res.end();}mkdir(path.dirname(fp));req.pipe(fs.createWriteStream(fp)).on('finish',function(){res.writeHead(201);res.end();});break;case 'MKCOL':if(cfg.readOnly){res.writeHead(405);return res.end();}if(fs.existsSync(fp)){res.writeHead(405);return res.end();}mkdir(fp);res.writeHead(201);res.end();break;case 'DELETE':if(cfg.readOnly){res.writeHead(405);return res.end();}if(!fs.existsSync(fp)){res.writeHead(404);return res.end();}fs.rmSync(fp,{recursive:true,force:true});res.writeHead(204);res.end();break;case 'MOVE':case 'COPY':{if(cfg.readOnly){res.writeHead(405);return res.end();}var dh=req.headers.destination;if(!dh){res.writeHead(400);return res.end();}var du=new URL(dh,cfg.publicUrl),dr=decodeURIComponent(du.pathname);if(dr.indexOf(cfg.route)===0)dr=dr.substring(cfg.route.length)||'/';var dest=full(u,dr);if(!dest){res.writeHead(403);return res.end();}mkdir(path.dirname(dest));if(req.method.toUpperCase()==='MOVE')fs.renameSync(fp,dest);else copyRec(fp,dest);res.writeHead(201);res.end();break;}case 'LOCK':{var token='opaquelocktoken:'+crypto.randomUUID();xml(res,200,'<?xml version="1.0" encoding="utf-8"?><D:prop xmlns:D="DAV:"><D:lockdiscovery><D:activelock><D:locktype><D:write/></D:locktype><D:lockscope><D:exclusive/></D:lockscope><D:depth>infinity</D:depth><D:owner>Mesh Drive</D:owner><D:timeout>Second-3600</D:timeout><D:locktoken><D:href>'+token+'</D:href></D:locktoken></D:activelock></D:lockdiscovery></D:prop>',{'Lock-Token':'<'+token+'>'});break;}case 'UNLOCK':res.writeHead(204);res.end();break;case 'PROPPATCH':xml(res,207,'<?xml version="1.0" encoding="utf-8"?><D:multistatus xmlns:D="DAV:"><D:response><D:href>'+x(href(rel))+'</D:href><D:propstat><D:prop/><D:status>HTTP/1.1 200 OK</D:status></D:propstat></D:response></D:multistatus>');break;default:res.writeHead(405);res.end();}}catch(e){log('handler error: '+(e.stack||e));try{res.writeHead(500);res.end();}catch(ex){}}}
    function sendAgent(nodeid,action){try{var wsagents=obj.meshServer&&obj.meshServer.webserver&&obj.meshServer.webserver.wsagents;if(!nodeid||!wsagents||!wsagents[nodeid])return false;wsagents[nodeid].send(JSON.stringify({action:'plugin',plugin:'meshdrive',pluginaction:action}));return true;}catch(e){log('sendAgent error: '+(e.stack||e));return false;}}
    obj.serveraction=function(command,myparent){try{if(!command||command.plugin!=='meshdrive')return;if(command.pluginaction==='openDriveOnAgent'){log('OPEN -> '+command.nodeid);var ok=sendAgent(command.nodeid,'openDrive');if(myparent&&myparent.send)myparent.send(JSON.stringify({action:'plugin',plugin:'meshdrive',pluginaction:'agentCommandResult',ok:ok,requested:'open'}));return;}if(command.pluginaction==='mapDriveOnAgent'){log('MAP -> '+command.nodeid);var ok2=sendAgent(command.nodeid,'mapDrive');if(myparent&&myparent.send)myparent.send(JSON.stringify({action:'plugin',plugin:'meshdrive',pluginaction:'agentCommandResult',ok:ok2,requested:'map'}));return;}}catch(e){log('serveraction error: '+(e.stack||e));}};
    function app(){var c=[obj.meshServer&&obj.meshServer.webserver&&obj.meshServer.webserver.app,obj.meshServer&&obj.meshServer.app,parent&&parent.app,parent&&parent.webserver&&parent.webserver.app];for(var i=0;i<c.length;i++)if(c[i]&&typeof c[i].use==='function')return c[i];return null;}
    obj.hook_setupHttpHandlers=function(){if(cfg.enabled===false)return;var a=app();if(!a){log('Express app not found');return;}mkdir(rootDomain());a.use(cfg.route,function(req,res){dav(req,res);});log('registered route '+cfg.route+' -> '+rootDomain()+'/'+cfg.userFolderPrefix+'<username>');};
    obj.server_startup=function(){log('loaded for '+cfg.publicUrl+', root='+rootDomain());};
    obj.copyDetectedAddress=function(){var ua=navigator.userAgent||'',address='https://mesh.aplicado.com.br/drive/';if(/Windows/i.test(ua))address=String.raw`\\mesh.aplicado.com.br@SSL\drive`;else if(/Macintosh|Mac OS|Linux/i.test(ua))address='davs://mesh.aplicado.com.br/drive/';if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(address).then(function(){alert('Endereco copiado:\n\n'+address);},function(){prompt('Copie o endereco abaixo:',address);});else prompt('Copie o endereco abaixo:',address);};
    function getNodeIdInline(){try{if(typeof currentNode!=='undefined'&&currentNode&&currentNode._id)return currentNode._id;}catch(e){}try{if(typeof currentNodeId!=='undefined'&&currentNodeId)return currentNodeId;}catch(e){}return null;}
    obj.openDriveOnAgent=function(){var n=null;try{if(typeof currentNode!=='undefined'&&currentNode&&currentNode._id)n=currentNode._id;}catch(e){}try{if(!n&&typeof currentNodeId!=='undefined'&&currentNodeId)n=currentNodeId;}catch(e){}console.log('MeshDrive OPEN nodeid:',n);if(!n){alert('Selecione um dispositivo para abrir o Mesh Drive.');return;}meshserver.send({action:'plugin',plugin:'meshdrive',pluginaction:'openDriveOnAgent',nodeid:n});};
    obj.mapDriveOnAgent=function(){var n=null;try{if(typeof currentNode!=='undefined'&&currentNode&&currentNode._id)n=currentNode._id;}catch(e){}try{if(!n&&typeof currentNodeId!=='undefined'&&currentNodeId)n=currentNodeId;}catch(e){}console.log('MeshDrive MAP nodeid:',n);if(!n){alert('Selecione um dispositivo para mapear o Mesh Drive.');return;}meshserver.send({action:'plugin',plugin:'meshdrive',pluginaction:'mapDriveOnAgent',nodeid:n});};
    obj.injectMeshDriveLauncher=function(){try{if(document.getElementById('plugin_meshDriveLauncher'))return;var b='<span id="plugin_meshDriveLauncher" style="display:inline-flex;align-items:center;gap:6px;margin-left:auto;white-space:nowrap;"><button onclick="pluginHandler.meshdrive.copyDetectedAddress();" style="padding:5px 9px;border-radius:6px;border:1px solid #57606a;background:#f6f8fa;color:#24292f;cursor:pointer;font-size:12px;line-height:16px;">Copiar endereco Mesh Drive</button></span>';var t=null,hs=document.querySelectorAll('h1,h2,h3,div,span');for(var i=0;i<hs.length;i++){var txt=(hs[i].innerText||hs[i].textContent||'').trim().toLowerCase();if(txt==='meus arquivos'||txt==='my files'){t=hs[i];break;}}if(t){t.style.display='flex';t.style.alignItems='center';t.style.flexWrap='nowrap';t.style.width='100%';t.insertAdjacentHTML('beforeend',b);}}catch(e){console.log('Mesh Drive My Files injection failed',e);}};
    obj.injectDeviceMeshDrive=function(){
        try{
            var existing=document.getElementById('plugin_meshDriveDeviceActions');
            var html='<span id="plugin_meshDriveDeviceActions" style="float:right;display:inline-flex;align-items:center;gap:6px;margin-left:auto;white-space:nowrap;font-size:13px;font-weight:400;">'+
                '<span style="font-size:13px;font-weight:600;color:#24292f;">&#128193; Mesh Drive</span>'+
                '<button onclick="pluginHandler.meshdrive.openDriveOnAgent();" style="padding:5px 9px;border-radius:6px;border:1px solid #1f6feb;background:#1f6feb;color:white;cursor:pointer;font-size:12px;line-height:16px;">Abrir Drive</button>'+
                '<button onclick="pluginHandler.meshdrive.mapDriveOnAgent();" style="padding:5px 9px;border-radius:6px;border:1px solid #16803c;background:#16803c;color:white;cursor:pointer;font-size:12px;line-height:16px;">Mapear Drive</button>'+
                '</span>';
            var title=null,candidates=[],els=document.querySelectorAll('h1,h2,h3,div,span,td');
            for(var i=0;i<els.length;i++){
                var txt=(els[i].innerText||els[i].textContent||'').replace(/\s+/g,' ').trim();
                var low=txt.toLowerCase();
                if((low.indexOf('em geral -')>=0||low.indexOf('general -')>=0)&&txt.length<220){
                    candidates.push(els[i]);
                }
            }
            if(candidates.length>0){
                candidates.sort(function(a,b){
                    var at=(a.innerText||a.textContent||'').length;
                    var bt=(b.innerText||b.textContent||'').length;
                    return at-bt;
                });
                title=candidates[0];
            }
            if(title){
                if(existing && existing.parentNode){ existing.parentNode.removeChild(existing); }
                title.style.display='flex';
                title.style.alignItems='center';
                title.style.flexWrap='nowrap';
                title.style.gap='8px';
                title.style.width='100%';
                title.insertAdjacentHTML('beforeend',html);
                return;
            }
            if(existing) return;
            var target=document.getElementById('p10html3')||document.getElementById('p10')||document.body;
            target.insertAdjacentHTML('afterbegin','<div style="margin:8px 0;text-align:right;">'+html+'</div>');
        }catch(e){console.log('Mesh Drive device action injection failed',e);}
    };
    obj.onWebUIStartupEnd=function(){setTimeout(pluginHandler.meshdrive.injectMeshDriveLauncher,500);setTimeout(pluginHandler.meshdrive.injectMeshDriveLauncher,2000);setTimeout(pluginHandler.meshdrive.injectDeviceMeshDrive,1000);};
    obj.goPageEnd=function(){setTimeout(pluginHandler.meshdrive.injectMeshDriveLauncher,300);setTimeout(pluginHandler.meshdrive.injectDeviceMeshDrive,400);};
    obj.onDeviceRefreshEnd=function(){setTimeout(pluginHandler.meshdrive.injectDeviceMeshDrive,300);};
    return obj;
};
