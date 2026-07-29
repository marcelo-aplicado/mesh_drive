"use strict";

module.exports.meshdrive = function (parent) {
  const fs = require('fs');
  const path = require('path');
  const crypto = require('crypto');

  const obj = { parent, meshServer: parent.parent };
  obj.debug = obj.meshServer.debug;
  obj.exports = ['onWebUIStartupEnd','goPageEnd','copyDetectedAddress','copyMapCommand','openMeshDriveAdmin','injectMeshDriveLauncher'];

  const serverConfig = (obj.meshServer || {}).config || {};
  const settings = serverConfig.settings || {};
  const pluginDir = __dirname;
  const cfg = Object.assign({
    enabled: true,
    debug: false,
    route: '/drive',
    carddavRoute: '/carddav',
    adminRoute: '/meshdrive',
    meshFilesRoot: '/opt/meshcentral/meshcentral-files',
    meshDomainFolder: 'domain',
    userFolderPrefix: 'user-',
    passwordIterations: 12000,
    maxCardDavItems: 500,
    hostDomainMap: {},
    readOnly: false
  }, settings.meshDrive || settings.meshdrive || {});

  function log(){}
  function safe(v){ return String(v||'').replace(/[^a-zA-Z0-9._ -]/g,'_').trim().slice(0,160)||'_'; }
  function slug(v){ return safe(v).replace(/ /g,'_'); }
  function safePath(v){ return String(v||'').replace(/^[\\/]+/,'').replace(/\.\./g,'_'); }
  function norm(u){ u=String(u||'').trim(); if(u.indexOf('\\')>=0)u=u.split('\\').pop(); if(u.indexOf('/')>=0)u=u.split('/').pop(); if(u.indexOf('@')>=0)u=u.split('@')[0]; if(u.toLowerCase().indexOf('user-')===0)u=u.substring(5); return slug(u.toLowerCase()); }
  function mkdir(d){ fs.mkdirSync(d,{recursive:true}); }
  function addUnique(a,v){ if(v && a.indexOf(v)<0) a.push(v); }
  function normalizeHost(h){ h=String(h||'').split(',')[0].trim().toLowerCase(); if(h.indexOf('://')>=0){ try{h=new URL(h).hostname;}catch(e){} } return h.split(':')[0]; }
  function rootDomainForFolder(folder){ return path.resolve(path.join(cfg.meshFilesRoot, folder || 'domain')); }
  function fsDomainExists(folder){ try{return fs.existsSync(rootDomainForFolder(folder));}catch(e){return false;} }
  function domainFolderFromId(id){ id=String(id||'').trim().toLowerCase(); if(!id || id==='domain' || id==='default') return 'domain'; if(id.indexOf('domain-')===0) return slug(id); return 'domain-'+slug(id); }
  function domainIdFromFolder(folder){ folder=String(folder||'domain').toLowerCase(); if(folder==='domain') return ''; if(folder.indexOf('domain-')===0) return folder.substring(7); return folder; }
  function tenantKey(ctx){ const id=((ctx&&ctx.id)||'').toLowerCase(); return id?slug(id):'domain'; }
  function sharesFileForContext(ctx){ return path.join(pluginDir,'shares.json'); }
  function defaultShareList(){ return [{ name:'Contatos', path:'contatos', readUsers:['*'], writeUsers:['marcelo'], readGroups:[], writeGroups:['TI'], anonymousAccess:'read', carddav:true }]; }
  function defaultShares(){
    const domains={};
    ['domain','crsbrands','mhs','fastcopy'].forEach(k=>{ domains[k]={ shares: defaultShareList() }; });
    return { domains };
  }
  function ensureSharesFile(ctx){ const f=sharesFileForContext(ctx); if(!fs.existsSync(f)){ mkdir(pluginDir); fs.writeFileSync(f,JSON.stringify(defaultShares(),null,2)); } return f; }
  function loadSharesStore(){
    const f=ensureSharesFile();
    try{
      const d=JSON.parse(fs.readFileSync(f,'utf8'));
      if(d && Array.isArray(d.shares)) return { domains:{ domain:{ shares:d.shares } } };
      if(d && d.domains && typeof d.domains==='object') return d;
    }catch(e){}
    return defaultShares();
  }
  function saveSharesStore(store){ fs.writeFileSync(sharesFileForContext(),JSON.stringify(store,null,2)); }
  function readSharesConfig(ctx){
    const store=loadSharesStore();
    const key=tenantKey(ctx);
    if(!store.domains) store.domains={};
    if(!store.domains[key]){ store.domains[key]={ shares: defaultShareList() }; saveSharesStore(store); }
    return store.domains[key];
  }
  function listField(v){ return Array.isArray(v)?v.map(String).map(x=>x.trim()).filter(Boolean):[]; }
  function anonMode(v){ v=String(v||'none').toLowerCase(); return (v==='read'||v==='write')?v:'none'; }
  function normalizeShare(s){
    let readUsers=listField(s.readUsers), writeUsers=listField(s.writeUsers), readGroups=listField(s.readGroups), writeGroups=listField(s.writeGroups);
    if((readUsers.length+writeUsers.length+readGroups.length+writeGroups.length)===0 && (Array.isArray(s.users)||Array.isArray(s.groups))){
      if(String(s.access||'read').toLowerCase()==='write'){ writeUsers=listField(s.users); writeGroups=listField(s.groups); }
      else { readUsers=listField(s.users); readGroups=listField(s.groups); }
    }
    return { name:safe(s.name||'Share'), path:safePath(s.path||('shares/'+safe(s.name||'Share'))), readUsers, writeUsers, readGroups, writeGroups, anonymousAccess:anonMode(s.anonymousAccess), carddav:!!s.carddav };
  }
  function writeSharesConfig(ctx,data){
    if(!data||!Array.isArray(data.shares)) throw new Error('shares must be an array');
    const names={};
    const clean={shares:data.shares.map(normalizeShare).filter(s=>s.name&&s.path).map(s=>{ const k=s.name.toLowerCase(); if(names[k]) throw new Error('Nome duplicado: '+s.name); names[k]=true; return s; })};
    const store=loadSharesStore(); if(!store.domains) store.domains={}; store.domains[tenantKey(ctx)]=clean; saveSharesStore(store); return clean;
  }

  function findDomainIdByHost(host){ host=normalizeHost(host); const domains=serverConfig.domains||{}; for(const key in domains){ const d=domains[key]||{}; if(normalizeHost(d.dns)===host || normalizeHost(d.certUrl)===host){ const k=String(key||'').trim(); return (!k||k==='_')?'':k.toLowerCase(); } } return null; }
  function resolveDomainContext(req){
    const host=normalizeHost((req&&req.headers&&(req.headers.host||req.headers['x-forwarded-host']))||'');
    let domainId=cfg.hostDomainMap&&(cfg.hostDomainMap[host]||cfg.hostDomainMap['*']);
    if(domainId) domainId=String(domainId).toLowerCase(); else domainId=findDomainIdByHost(host);
    const cand=[]; if(domainId!==null) addUnique(cand,domainFolderFromId(domainId));
    if(host){ const p=host.split('.').filter(Boolean); if(p[0]==='mesh'&&p[1]) addUnique(cand,domainFolderFromId(p[1])); if(p[0]) addUnique(cand,domainFolderFromId(p[0])); if(p[1]) addUnique(cand,domainFolderFromId(p[1])); }
    addUnique(cand,cfg.meshDomainFolder||'domain');
    let folder=cand[0]||'domain'; for(const c of cand){ if(fsDomainExists(c)){ folder=c; break; } }
    log('ctx host='+host+' folder='+folder+' tenant='+domainIdFromFolder(folder)); return {host,id:domainIdFromFolder(folder),folder};
  }

  function parseBasic(req){ const h=req.headers.authorization||''; if(h.toLowerCase().indexOf('basic ')!==0)return null; let raw=''; try{raw=Buffer.from(h.substring(6),'base64').toString('utf8');}catch(e){return null;} const i=raw.indexOf(':'); if(i<0)return null; return {username:raw.substring(0,i),password:raw.substring(i+1)}; }
  function dbGet(id){ return new Promise(resolve=>{ const db=obj.meshServer&&(obj.meshServer.db||(obj.meshServer.webserver&&obj.meshServer.webserver.db)); if(!db||typeof db.Get!=='function')return resolve(null); try{ db.Get(id,(er,docs)=>{ if(er)return resolve(null); resolve(Array.isArray(docs)?(docs[0]||null):(docs||null)); }); }catch(e){ resolve(null); } }); }
  function tseq(a,b){ a=String(a||''); b=String(b||''); const ab=Buffer.from(a),bb=Buffer.from(b); if(ab.length!==bb.length)return false; try{return crypto.timingSafeEqual(ab,bb);}catch(e){return false;} }
  function hashLen(h){ try{const b=Buffer.from(String(h||''),'base64'); if(b&&b.length>0)return b.length;}catch(e){} return 64; }
  function pbkdf2(p,s,stored){ return new Promise(resolve=>{ try{ crypto.pbkdf2(p,s,cfg.passwordIterations,hashLen(stored),'sha384',(er,h)=>{ if(er)return resolve(null); resolve(h.toString('base64')); }); }catch(e){resolve(null);} }); }
  function nativeResultOk(r){ if(r===true)return true; if(r===false||r==null)return false; if(typeof r==='string')return ['ok','true'].indexOf(r.toLowerCase())>=0; if(typeof r==='object')return !!(r.ok||r.success||r.valid||r.authenticated||r._id||r.userid||r.user||r.name); return false; }
  function getContainerPath(n){ if(n==='webserver')return obj.meshServer&&obj.meshServer.webserver; if(n==='meshServer')return obj.meshServer; if(n==='parent')return parent; if(n==='parentParent')return parent&&parent.parent; return null; }
  function callNativeFunction(fn,args){ return new Promise(resolve=>{ let done=false; function finish(v){ if(!done){ done=true; resolve(v); } } const t=setTimeout(()=>finish({status:'timeout'}),250); const cb=function(a,b){ clearTimeout(t); finish({status:'callback',result:(arguments.length>1?b:a)}); }; try{ const r=fn.apply(null,args.concat([cb])); if(r&&typeof r.then==='function')r.then(v=>{clearTimeout(t);finish({status:'promise',result:v});}).catch(e=>{clearTimeout(t);finish({status:'promise-error',result:e});}); else if(r!==undefined){clearTimeout(t);finish({status:'return',result:r});} }catch(e){clearTimeout(t);finish({status:'throw',result:e});} }); }
  async function tryNativeMeshAuth(username,password,ctx,userDoc){ const methods=['validateUser','ValidateUser','validateUserPassword','verifyUserPassword','checkUserPassword','checkUserPass','authenticateUser','authUser','loginUser','checkUserLogin','validateLogin']; const containers=['webserver','meshServer','parent','parentParent']; const user=norm(username),domainId=(ctx&&ctx.id)||'',userId=(userDoc&&userDoc._id)||(domainId?('user/'+domainId+'/'+user):('user//'+user)); for(const cn of containers){ const c=getContainerPath(cn); if(!c)continue; for(const mn of methods){ const fn=c[mn]; if(typeof fn!=='function')continue; const vars=[[domainId,user,password],[user,password,domainId],[userId,password],[userDoc,password],[{domain:domainId,userid:userId,username:user,user:userDoc,password}],[user,password]]; for(const v of vars){ const rr=await callNativeFunction(fn,v); if(nativeResultOk(rr.result))return true; } } } return null; }
  async function findUser(username,ctx){ const u=norm(username),ids=[]; if(ctx&&ctx.id){addUnique(ids,'user/'+ctx.id+'/'+u);addUnique(ids,'user/'+ctx.id+'/user-'+u);} addUnique(ids,'user//'+u);addUnique(ids,'user/domain/'+u);addUnique(ids,'user//user-'+u);addUnique(ids,'user/domain/user-'+u); if(ctx&&ctx.folder&&ctx.folder!=='domain'){addUnique(ids,'user/'+ctx.folder+'/'+u);addUnique(ids,'user/'+ctx.folder+'/user-'+u);} for(const id of ids){ const d=await dbGet(id); if(d)return {id,doc:d,username:u,domainContext:ctx}; } return {id:ids[0]||('user//'+u),doc:null,username:u,domainContext:ctx}; }
  async function validate(username,password,ctx){ const f=await findUser(username,ctx),d=f.doc; if(!d||d.locked||d.siteadmin===-1)return null; const nativeOk=await tryNativeMeshAuth(username,password,ctx,d); if(nativeOk===true)return {id:d._id||f.id,username:f.username,doc:d,domainContext:ctx}; const salt=d.salt,stored=d.hash||d.passhash||d.pwhash||d.passwordhash; if(!salt||!stored)return null; const computed=await pbkdf2(password,salt,stored); if(!computed||(!tseq(stored,computed)&&!tseq(String(stored).toLowerCase(),String(computed).toLowerCase())))return null; return {id:d._id||f.id,username:f.username,doc:d,domainContext:ctx}; }
  function authReq(res,realm){ res.writeHead(401,{'WWW-Authenticate':'Basic realm="'+(realm||'Mesh Drive')+'"','Content-Type':'text/plain; charset=utf-8'}); res.end('Authentication required'); }
  function anonymousUser(ctx){ return {id:'anonymous',username:'anonymous',anonymous:true,doc:{},domainContext:ctx}; }
  async function auth(req,res,requireAdmin,optional){
    const ctx=resolveDomainContext(req),b=parseBasic(req);
    if(!b){
      if(optional){ log('auth anonymous folder='+ctx.folder); return anonymousUser(ctx); }
      log('auth challenge folder='+ctx.folder);
      authReq(res,requireAdmin?'Mesh Drive Admin':'Mesh Drive'); return null;
    }
    const nu=norm(b.username);
    const u=await validate(b.username,b.password,ctx);
    if(!u){ log('auth fail user='+nu+' folder='+ctx.folder); authReq(res,requireAdmin?'Mesh Drive Admin':'Mesh Drive'); return null; }
    log('auth ok user='+u.username+' folder='+(u.domainContext&&u.domainContext.folder)+' anon='+!!u.anonymous);
    if(requireAdmin&&!(u.doc&&u.doc.siteadmin&&u.doc.siteadmin!==0)){res.writeHead(403,{'Content-Type':'text/plain; charset=utf-8'});res.end('Admin required');return null;}
    return u;
  }
  async function authDrive(req,res,rel){
    const ctx=resolveDomainContext(req),b=parseBasic(req);
    if(!b){
      const parts=String(rel||'/').split('/').filter(Boolean);
      if(parts.length>0){
        const au=anonymousUser(ctx);
        const share=findDriveShareByName(au,parts[0]);
        if(share){ log('auth anonymous share='+share.name+' folder='+ctx.folder); return au; }
      }
      log('auth challenge folder='+ctx.folder);
      authReq(res,'Mesh Drive');
      return null;
    }
    const nu=norm(b.username);
    const u=await validate(b.username,b.password,ctx);
    if(!u){ log('auth fail user='+nu+' folder='+ctx.folder); authReq(res,'Mesh Drive'); return null; }
    log('auth ok user='+u.username+' folder='+(u.domainContext&&u.domainContext.folder)+' anon='+!!u.anonymous);
    return u;
  }



  function tenantRoot(u){ return rootDomainForFolder((u&&u.domainContext&&u.domainContext.folder)||cfg.meshDomainFolder||'domain'); }
  function userRoot(u){
    const name=norm((u&&(u.username||u.id))||'user');
    const r=path.join(tenantRoot(u),cfg.userFolderPrefix+name);
    log('userRoot user='+name+' path='+r+' exists='+fs.existsSync(r));
    mkdir(r);
    return path.resolve(r);
  }
  function routePath(req,route){ let u=req.url||'/',q=u.indexOf('?'); if(q>=0)u=u.substring(0,q); try{u=decodeURIComponent(u);}catch(e){} if(u.indexOf(route)===0)u=u.substring(route.length); if(u.indexOf('/')!==0)u='/'+u; return u; }
  function userIdentifiers(u){ const ids=['*']; if(!u)return ids; addUnique(ids,norm(u.username)); if(u.id)addUnique(ids,String(u.id).toLowerCase()); if(u.doc){ if(u.doc._id)addUnique(ids,String(u.doc._id).toLowerCase()); if(u.doc.name)addUnique(ids,norm(u.doc.name)); if(u.doc.email)addUnique(ids,String(u.doc.email).toLowerCase()); } return ids; }
  function userGroupIdentifiers(u){ const out=[]; if(!u||!u.doc)return out; ['groups','ugroups','usergroups'].forEach(k=>{ if(Array.isArray(u.doc[k]))u.doc[k].forEach(g=>{addUnique(out,String(g).toLowerCase());addUnique(out,norm(g));}); }); if(u.doc.links)Object.keys(u.doc.links).forEach(k=>{ if(k.toLowerCase().indexOf('usergroup')>=0||k.toLowerCase().indexOf('ugrp')>=0){addUnique(out,k.toLowerCase());addUnique(out,norm(k.split('/').pop()));} }); return out; }
  function hasAny(list,ids){ list=listField(list); if(list.indexOf('*')>=0)return true; for(const v of list)if(ids.indexOf(String(v).toLowerCase())>=0||ids.indexOf(norm(v))>=0)return true; return false; }
  function permissionForShare(share,u){ share=normalizeShare(share); if(u&&u.anonymous){ if(share.anonymousAccess==='write')return 'write'; if(share.anonymousAccess==='read')return 'read'; return null; } const ids=userIdentifiers(u),gids=userGroupIdentifiers(u); if(hasAny(share.writeUsers,ids)||hasAny(share.writeGroups,gids))return 'write'; if(hasAny(share.readUsers,ids)||hasAny(share.readGroups,gids))return 'read'; return null; }
  function allowedShares(u){ return readSharesConfig(u.domainContext).shares.map(normalizeShare).map(s=>{ const perm=permissionForShare(s,u); if(!perm)return null; return Object.assign({},s,{permission:perm}); }).filter(Boolean); }
  function allowedDriveShares(u){ return allowedShares(u).filter(s=>!s.carddav); }
  function allowedCardDavShares(u){ return allowedShares(u).filter(s=>!!s.carddav); }
  function findDriveShareByName(u,name){ name=safe(name); for(const s of allowedDriveShares(u))if(safe(s.name).toLowerCase()===name.toLowerCase())return s; return null; }
  function findCardDavShareByName(u,name){ name=safe(name); for(const s of allowedCardDavShares(u))if(safe(s.name).toLowerCase()===name.toLowerCase())return s; return null; }
  function findShareByName(u,name){ return findDriveShareByName(u,name); }
  function shareRoot(u,share){ const root=tenantRoot(u),rel=safePath(share.path||('shares/'+share.name)),p=path.resolve(path.join(root,rel)); if(p!==root&&p.indexOf(root+path.sep)!==0)return null; mkdir(p); return p; }
  function driveTarget(u,rel){ const parts=rel.split('/').filter(Boolean); if(parts.length===0){ const root = u.anonymous ? null : userRoot(u); log('rootPropfind user='+(u&&u.username)+' anon='+!!(u&&u.anonymous)+' root='+root+' exists='+(root?fs.existsSync(root):false)); return {kind:'root',root,path:root,rel:'/',readOnly:u.anonymous||cfg.readOnly}; } const share=findDriveShareByName(u,parts[0]); if(share){ const root=shareRoot(u,share),inside=parts.slice(1).join('/'),p=path.resolve(path.join(root,safePath(inside))); if(p!==root&&p.indexOf(root+path.sep)!==0)return null; return {kind:'share',share,root,path:p,rel:'/'+parts.join('/'),readOnly:share.permission!=='write'}; } if(u.anonymous) return null; const root=userRoot(u),p=path.resolve(path.join(root,safePath(parts.join('/')))); if(p!==root&&p.indexOf(root+path.sep)!==0)return null; return {kind:'personal',root,path:p,rel:'/'+parts.join('/'),readOnly:cfg.readOnly}; }

  function x(s){ return String(s).replace(/[<>&'"]/g,c=>({'<':'&lt;','>':'&gt;','&':'&amp;',"'":'&apos;','"':'&quot;'}[c])); }
  function hrefFor(route,rel){ let r=rel||'/'; if(r.indexOf('/')!==0)r='/'+r; return route.replace(/\/$/,'')+encodeURI(r).replace(/#/g,'%23'); }
  function href(rel){ return hrefFor(cfg.route, rel); }
  function propReal(f,rel){ const st=fs.statSync(f), isD=st.isDirectory(), display=path.basename(f)||'/'; return '<D:response><D:href>'+x(href(rel+(isD&&!rel.endsWith('/')?'/':'')))+'</D:href><D:propstat><D:prop><D:displayname>'+x(display)+'</D:displayname><D:getlastmodified>'+st.mtime.toUTCString()+'</D:getlastmodified><D:creationdate>'+st.birthtime.toISOString()+'</D:creationdate>'+(isD?'<D:resourcetype><D:collection/></D:resourcetype>':'<D:resourcetype/>')+(!isD?'<D:getcontentlength>'+st.size+'</D:getcontentlength>':'')+'<D:getetag>"'+st.size+'-'+Number(st.mtimeMs).toString(16)+'"</D:getetag></D:prop><D:status>HTTP/1.1 200 OK</D:status></D:propstat></D:response>'; }
  function propVirtual(name,rel,route){ route=route||cfg.route; return '<D:response><D:href>'+x(hrefFor(route,rel.endsWith('/')?rel:rel+'/'))+'</D:href><D:propstat><D:prop><D:displayname>'+x(name)+'</D:displayname><D:resourcetype><D:collection/></D:resourcetype></D:prop><D:status>HTTP/1.1 200 OK</D:status></D:propstat></D:response>'; }
  function xml(res,code,body,h){ res.writeHead(code,Object.assign({'Content-Type':'application/xml; charset=utf-8'},h||{})); res.end(body); }
  function readBody(req){ return new Promise(resolve=>{ const chunks=[]; req.on('data',d=>chunks.push(d)); req.on('end',()=>resolve(Buffer.concat(chunks).toString('utf8'))); }); }
  function sendOptions(res,card){ res.writeHead(200, card?{'DAV':'1, 2, 3, addressbook','Allow':'OPTIONS, PROPFIND, REPORT, GET, PUT, DELETE'}:{'DAV':'1, 2','Allow':'OPTIONS, PROPFIND, GET, HEAD, PUT, DELETE, MKCOL, MOVE, COPY, LOCK, UNLOCK, PROPPATCH','MS-Author-Via':'DAV'}); res.end(); }
  function copyRec(s,d){ const st=fs.statSync(s); if(st.isDirectory()){ mkdir(d); fs.readdirSync(s).forEach(f=>copyRec(path.join(s,f),path.join(d,f))); } else fs.copyFileSync(s,d); }

  function rootPropfind(req,res,u){
    const depth=req.headers.depth||'1';
    let out='';
    const root = u.anonymous ? null : userRoot(u);
    if(root && fs.existsSync(root)){
      out += propReal(root,'/');
      if(depth !== '0'){
        fs.readdirSync(root).forEach(n=>{ out += propReal(path.join(root,n),'/'+n); });
        allowedDriveShares(u).forEach(s=>{ out += propVirtual(s.name,'/'+s.name); });
      }
    } else {
      out += propVirtual('drive','/');
      if(depth !== '0') allowedDriveShares(u).forEach(s=>{ out += propVirtual(s.name,'/'+s.name); });
    }
    return xml(res,207,'<?xml version="1.0" encoding="utf-8"?><D:multistatus xmlns:D="DAV:">'+out+'</D:multistatus>');
  }
  function handleRealDav(req,res,target,u){ switch((req.method||'GET').toUpperCase()){
    case 'PROPFIND': { if(!fs.existsSync(target.path)){res.writeHead(404);return res.end();} let out=propReal(target.path,target.rel); const depth=req.headers.depth||'1',st=fs.statSync(target.path); if(depth!=='0'&&st.isDirectory())fs.readdirSync(target.path).forEach(n=>{out+=propReal(path.join(target.path,n),path.posix.join(target.rel,n));}); return xml(res,207,'<?xml version="1.0" encoding="utf-8"?><D:multistatus xmlns:D="DAV:">'+out+'</D:multistatus>'); }
    case 'GET': case 'HEAD': { if(!fs.existsSync(target.path)){res.writeHead(404);return res.end();} const st=fs.statSync(target.path); if(st.isDirectory()){res.writeHead(403);return res.end();} res.writeHead(200,{'Content-Length':st.size}); if(req.method.toUpperCase()==='HEAD')res.end(); else fs.createReadStream(target.path).pipe(res); break; }
    case 'PUT': if(target.readOnly){res.writeHead(405);return res.end();} mkdir(path.dirname(target.path)); req.pipe(fs.createWriteStream(target.path)).on('finish',()=>{res.writeHead(201);res.end();}); break;
    case 'MKCOL': if(target.readOnly){res.writeHead(405);return res.end();} if(fs.existsSync(target.path)){res.writeHead(405);return res.end();} mkdir(target.path); res.writeHead(201); res.end(); break;
    case 'DELETE': if(target.readOnly){res.writeHead(405);return res.end();} if(!fs.existsSync(target.path)){res.writeHead(404);return res.end();} fs.rmSync(target.path,{recursive:true,force:true}); res.writeHead(204); res.end(); break;
    case 'MOVE': case 'COPY': { if(target.readOnly){res.writeHead(405);return res.end();} const dh=req.headers.destination; if(!dh){res.writeHead(400);return res.end();} const du=new URL(dh,'https://'+(req.headers.host||'localhost')+cfg.route); let dr=decodeURIComponent(du.pathname); if(dr.indexOf(cfg.route)===0)dr=dr.substring(cfg.route.length)||'/'; const dest=driveTarget(u,dr); if(!dest||dest.kind==='root'||dest.readOnly||!dest.path){res.writeHead(403);return res.end();} mkdir(path.dirname(dest.path)); if(req.method.toUpperCase()==='MOVE')fs.renameSync(target.path,dest.path); else copyRec(target.path,dest.path); res.writeHead(201); res.end(); break; }
    case 'LOCK': res.writeHead(200,{'Lock-Token':'<opaquelocktoken:'+crypto.randomUUID()+'>'}); res.end(); break;
    case 'UNLOCK': res.writeHead(204); res.end(); break;
    default: res.writeHead(405); res.end(); }
  }
  async function driveDav(req,res){ const method=(req.method||'GET').toUpperCase(); if(method==='OPTIONS')return sendOptions(res,false); const rel=routePath(req,cfg.route),u=await authDrive(req,res,rel); if(!u)return; const target=driveTarget(u,rel); if(!target){res.writeHead(404);return res.end();} try{ if(target.kind==='root'){
      if(method==='PROPFIND')return rootPropfind(req,res,u);
      res.writeHead(403); return res.end();
    }
    return handleRealDav(req,res,target,u); }catch(e){ if(cfg.debug)console.error(e); try{res.writeHead(500);res.end();}catch(ex){} } }

  function cardHref(rel){ let r=rel||'/'; if(r.indexOf('/')!==0)r='/'+r; return cfg.carddavRoute.replace(/\/$/,'')+encodeURI(r).replace(/#/g,'%23'); }
  function cardResp(h,props){ return '<D:response><D:href>'+x(h)+'</D:href><D:propstat><D:prop>'+props+'</D:prop><D:status>HTTP/1.1 200 OK</D:status></D:propstat></D:response>'; }
  function cardMulti(res,out){ return xml(res,207,'<?xml version="1.0" encoding="utf-8"?><D:multistatus xmlns:D="DAV:" xmlns:CARD="urn:ietf:params:xml:ns:carddav">'+out+'</D:multistatus>'); }
  function vcfFiles(root){ try{return fs.readdirSync(root).filter(f=>f.toLowerCase().endsWith('.vcf')).slice(0,cfg.maxCardDavItems||500);}catch(e){return[];} }
  function cardCollectionProps(name){ return '<D:displayname>'+x(name)+'</D:displayname><D:resourcetype><D:collection/><CARD:addressbook/></D:resourcetype><CARD:supported-address-data><CARD:address-data-type content-type="text/vcard" version="3.0"/><CARD:address-data-type content-type="text/vcard" version="4.0"/></CARD:supported-address-data>'; }
  function cardFileProps(file,full){ const st=fs.statSync(full); return '<D:displayname>'+x(file)+'</D:displayname><D:getetag>"'+st.size+'-'+Number(st.mtimeMs).toString(16)+'"</D:getetag><D:getcontenttype>text/vcard; charset=utf-8</D:getcontenttype><D:getcontentlength>'+st.size+'</D:getcontentlength><D:resourcetype/>'; }
  function cardData(full){ try{return '<CARD:address-data>'+x(fs.readFileSync(full,'utf8'))+'</CARD:address-data>';}catch(e){return '<CARD:address-data/>';} }
  async function carddav(req,res){ const u=await auth(req,res,false,true); if(!u)return; const method=(req.method||'GET').toUpperCase(); if(method==='OPTIONS')return sendOptions(res,true); const rel=routePath(req,cfg.carddavRoute),parts=rel.split('/').filter(Boolean),baseUser=norm(u.username||'anonymous'); try{
    if(method==='PROPFIND'){
      const depth=req.headers.depth||'0'; let out='';
      if(parts.length===0){ out+=cardResp(cardHref('/'),'<D:displayname>Mesh Drive CardDAV</D:displayname><D:resourcetype><D:collection/></D:resourcetype><D:current-user-principal><D:href>'+x(cardHref('/principals/'+baseUser+'/'))+'</D:href></D:current-user-principal>'); return cardMulti(res,out); }
      if(parts[0]==='principals'){ out+=cardResp(cardHref('/principals/'+baseUser+'/'),'<D:displayname>'+x(baseUser)+'</D:displayname><D:resourcetype><D:collection/><D:principal/></D:resourcetype><CARD:addressbook-home-set><D:href>'+x(cardHref('/addressbooks/'+baseUser+'/'))+'</D:href></CARD:addressbook-home-set>'); return cardMulti(res,out); }
      if(parts[0]==='addressbooks'&&parts[1]===baseUser&&parts.length===2){ out+=cardResp(cardHref('/addressbooks/'+baseUser+'/'),'<D:displayname>Address books</D:displayname><D:resourcetype><D:collection/></D:resourcetype>'); if(depth!=='0')allowedCardDavShares(u).forEach(s=>{out+=cardResp(cardHref('/addressbooks/'+baseUser+'/'+s.name+'/'),cardCollectionProps(s.name));}); return cardMulti(res,out); }
      if(parts[0]==='addressbooks'&&parts[1]===baseUser&&parts[2]){ const share=findCardDavShareByName(u,parts[2]); if(!share){res.writeHead(404);return res.end();} const root=shareRoot(u,share); if(parts.length===3){ out+=cardResp(cardHref('/addressbooks/'+baseUser+'/'+share.name+'/'),cardCollectionProps(share.name)); if(depth!=='0')vcfFiles(root).forEach(f=>{out+=cardResp(cardHref('/addressbooks/'+baseUser+'/'+share.name+'/'+f),cardFileProps(f,path.join(root,f)));}); return cardMulti(res,out); } const file=safePath(parts.slice(3).join('/')),full=path.resolve(path.join(root,file)); if(full.indexOf(root+path.sep)!==0||!fs.existsSync(full)){res.writeHead(404);return res.end();} out+=cardResp(cardHref('/addressbooks/'+baseUser+'/'+share.name+'/'+file),cardFileProps(file,full)+cardData(full)); return cardMulti(res,out); }
      res.writeHead(404); return res.end(); }
    if(method==='REPORT'){
      if(!(parts[0]==='addressbooks'&&parts[1]===baseUser&&parts[2])){res.writeHead(404);return res.end();} const share=findCardDavShareByName(u,parts[2]); if(!share){res.writeHead(404);return res.end();} const root=shareRoot(u,share),body=await readBody(req); let out='',hrefs=[...body.matchAll(/<[^:>]*:?href[^>]*>([^<]+)<\/[^:>]*:?href>/gi)].map(m=>decodeURIComponent(m[1])).slice(0,cfg.maxCardDavItems||500); if(hrefs.length){ hrefs.forEach(h=>{const f=path.basename(h),full=path.join(root,safePath(f)); if(fs.existsSync(full))out+=cardResp(cardHref('/addressbooks/'+baseUser+'/'+share.name+'/'+f),cardFileProps(f,full)+cardData(full));}); } else {vcfFiles(root).forEach(f=>{const full=path.join(root,f); out+=cardResp(cardHref('/addressbooks/'+baseUser+'/'+share.name+'/'+f),cardFileProps(f,full)+cardData(full));});} return cardMulti(res,out); }
    if(method==='GET'||method==='HEAD'||method==='PUT'||method==='DELETE'){
      if(!(parts[0]==='addressbooks'&&parts[1]===baseUser&&parts[2]&&parts[3])){res.writeHead(404);return res.end();} const share=findCardDavShareByName(u,parts[2]); if(!share){res.writeHead(404);return res.end();} const root=shareRoot(u,share),file=safePath(parts.slice(3).join('/')); if(!file.toLowerCase().endsWith('.vcf')){res.writeHead(415);return res.end();} const full=path.resolve(path.join(root,file)); if(full.indexOf(root+path.sep)!==0){res.writeHead(403);return res.end();}
      if(method==='GET'||method==='HEAD'){ if(!fs.existsSync(full)){res.writeHead(404);return res.end();} const st=fs.statSync(full); res.writeHead(200,{'Content-Type':'text/vcard; charset=utf-8','Content-Length':st.size,'ETag':'"'+st.size+'-'+Number(st.mtimeMs).toString(16)+'"'}); if(method==='HEAD')res.end(); else fs.createReadStream(full).pipe(res); return; }
      if(share.permission!=='write'){res.writeHead(405);return res.end();}
      if(method==='PUT'){ const exists=fs.existsSync(full); mkdir(path.dirname(full)); req.pipe(fs.createWriteStream(full)).on('finish',()=>{res.writeHead(exists?204:201);res.end();}); return; }
      if(method==='DELETE'){ if(!fs.existsSync(full)){res.writeHead(404);return res.end();} fs.rmSync(full,{force:true}); res.writeHead(204); return res.end(); }
    }
    res.writeHead(405); res.end(); }catch(e){ if(cfg.debug)console.error(e); try{res.writeHead(500);res.end();}catch(ex){} } }

  function htmlPage(ctx){ const fileName=path.basename(sharesFileForContext(ctx)); return '<!doctype html><html><head><meta charset="utf-8"><title>Mesh Drive - Compartilhamentos</title><style>body{font-family:Segoe UI,Arial,sans-serif;margin:24px;background:#f6f8fa;color:#24292f}.card{background:white;border:1px solid #d0d7de;border-radius:10px;padding:18px;margin-bottom:14px}label{display:block;font-weight:600;margin:8px 0 4px}input,textarea,select{width:100%;box-sizing:border-box;padding:8px;border:1px solid #d0d7de;border-radius:6px}button{padding:8px 12px;border-radius:6px;border:1px solid #1f6feb;background:#1f6feb;color:white;cursor:pointer;margin-right:6px}.danger{background:#cf222e;border-color:#cf222e}.secondary{background:#57606a;border-color:#57606a}.row{display:grid;grid-template-columns:1fr 1fr 170px 170px;gap:10px}.acl{display:grid;grid-template-columns:1fr 1fr;gap:12px}.small{color:#57606a;font-size:13px}</style></head><body><h1>Mesh Drive - Compartilhamentos</h1><p class="small">Tenant: <b>'+x(tenantKey(ctx))+'</b> | Arquivo: <code>'+x(fileName)+'</code> | /drive: arquivos pessoais na raiz</p><div id="list"></div><button onclick="addShare()">Adicionar compartilhamento</button><button class="secondary" onclick="load()">Recarregar</button><script>let data={shares:[]};function esc(s){return String(s||\'\').replace(/[&<>\"]/g,c=>({\'&\':\'&amp;\',\'<\':\'&lt;\',\'>\':\'&gt;\',\'"\':\'&quot;\'}[c]))}function splitList(v){return String(v||\'\').split(/\\n|,/).map(x=>x.trim()).filter(Boolean)}async function load(){const r=await fetch(location.pathname+\'/config\');data=await r.json();render()}function render(){const el=document.getElementById(\'list\');el.innerHTML=\'\';(data.shares||[]).forEach((s,i)=>{const d=document.createElement(\'div\');d.className=\'card\';d.innerHTML=`<div class="row"><div><label>Nome / Address Book</label><input data-field="name" value="${esc(s.name)}"></div><div><label>Diretório</label><input data-field="path" value="${esc(s.path)}"></div><div><label>Acesso anônimo</label><select data-field="anonymousAccess"><option value="none" ${(!s.anonymousAccess||s.anonymousAccess===\'none\')?\'selected\':\'\'}>Não permitir</option><option value="read" ${s.anonymousAccess===\'read\'?\'selected\':\'\'}>Somente leitura</option><option value="write" ${s.anonymousAccess===\'write\'?\'selected\':\'\'}>Leitura e gravação</option></select></div><div><label>CardDAV</label><select data-field="carddav"><option value="false" ${!s.carddav?\'selected\':\'\'}>Não</option><option value="true" ${s.carddav?\'selected\':\'\'}>Sim</option></select></div></div><div class="acl"><div><label>Usuários com leitura</label><textarea data-field="readUsers" rows="3">${esc((s.readUsers||s.users||[]).join(\'\\n\'))}</textarea></div><div><label>Usuários com gravação</label><textarea data-field="writeUsers" rows="3">${esc((s.writeUsers||[]).join(\'\\n\'))}</textarea></div><div><label>Grupos com leitura</label><textarea data-field="readGroups" rows="3">${esc((s.readGroups||s.groups||[]).join(\'\\n\'))}</textarea></div><div><label>Grupos com gravação</label><textarea data-field="writeGroups" rows="3">${esc((s.writeGroups||[]).join(\'\\n\'))}</textarea></div></div><br><button onclick="save()">Salvar</button><button class="danger" onclick="removeShare(${i})">Remover</button>`;el.appendChild(d)})}function collect(){data.shares=[...document.querySelectorAll(\'.card\')].map(card=>({name:card.querySelector(\'[data-field=name]\').value.trim(),path:card.querySelector(\'[data-field=path]\').value.trim(),anonymousAccess:card.querySelector(\'[data-field=anonymousAccess]\').value,carddav:card.querySelector(\'[data-field=carddav]\').value===\'true\',readUsers:splitList(card.querySelector(\'[data-field=readUsers]\').value),writeUsers:splitList(card.querySelector(\'[data-field=writeUsers]\').value),readGroups:splitList(card.querySelector(\'[data-field=readGroups]\').value),writeGroups:splitList(card.querySelector(\'[data-field=writeGroups]\').value)}));}function addShare(){collect();data.shares.push({name:\'Novo\',path:\'shares/novo\',anonymousAccess:\'none\',carddav:false,readUsers:[],writeUsers:[],readGroups:[],writeGroups:[]});render()}function removeShare(i){collect();data.shares.splice(i,1);render()}async function save(){collect();const r=await fetch(location.pathname+\'/config\',{method:\'POST\',headers:{\'Content-Type\':\'application/json\'},body:JSON.stringify(data)});if(!r.ok){alert(await r.text());return}data=await r.json();render();alert(\'Configuração salva.\')}load();</script></body></html>'; }
  async function adminHandler(req,res){ const u=await auth(req,res,true,false); if(!u)return; const ctx=u.domainContext,pathname=(req.url||'').split('?')[0].replace(/\/$/,''); if(pathname.endsWith('/config')){ if((req.method||'GET').toUpperCase()==='GET'){ res.writeHead(200,{'Content-Type':'application/json;charset=utf-8'}); return res.end(JSON.stringify(readSharesConfig(ctx),null,2)); } if((req.method||'GET').toUpperCase()==='POST'){ try{ const saved=writeSharesConfig(ctx,JSON.parse(await readBody(req))); res.writeHead(200,{'Content-Type':'application/json;charset=utf-8'}); return res.end(JSON.stringify(saved,null,2)); }catch(e){ res.writeHead(400,{'Content-Type':'text/plain;charset=utf-8'}); return res.end(String(e.message||e)); } } } res.writeHead(200,{'Content-Type':'text/html;charset=utf-8'}); res.end(htmlPage(ctx)); }
  function app(){ const c=[obj.meshServer&&obj.meshServer.webserver&&obj.meshServer.webserver.app,obj.meshServer&&obj.meshServer.app,parent&&parent.app,parent&&parent.webserver&&parent.webserver.app]; for(const a of c)if(a&&typeof a.use==='function')return a; return null; }
  obj.hook_setupHttpHandlers=function(){ log('setup routes route='+cfg.route+' carddavRoute='+cfg.carddavRoute+' adminRoute='+cfg.adminRoute+' meshFilesRoot='+cfg.meshFilesRoot); if(cfg.enabled===false)return; const key='__meshdrive_handlers_registered__'; if(global[key]){log('handlers already registered');return;} const a=app(); if(!a)return; global[key]=true; mkdir(pluginDir); mkdir(rootDomainForFolder(cfg.meshDomainFolder||'domain')); a.use(cfg.route,(req,res)=>driveDav(req,res)); a.use(cfg.carddavRoute,(req,res)=>carddav(req,res)); a.use(cfg.adminRoute,(req,res)=>adminHandler(req,res)); log('handlers registered once'); };
  obj.server_startup=function(){ log('loaded 1.2.10'); };
  obj.copyDetectedAddress=function(){ const host=window.location.hostname||window.location.host||'localhost'; const address='\\\\'+host+'@SSL\\drive'; if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(address).then(()=>alert('Endereço copiado:\n\n'+address),()=>prompt('Copie o endereço:',address)); else prompt('Copie o endereço:',address); };
  obj.copyMapCommand=function(){ const host=window.location.hostname||window.location.host||'localhost'; const command=['$meshHost="'+host.replace(/"/g,'')+'";','$path="\\\\$($meshHost)@SSL\\drive";','foreach($l in "M","N","O","P","Q","R","S","T","U","V","W","X","Y","Z"){','if(-not (Get-PSDrive -Name $l -ErrorAction SilentlyContinue)){','net use "$($l):" $path;','if($LASTEXITCODE -eq 0){explorer "$($l):\\"};','break','}','}'].join(''); if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(command).then(()=>alert('Comando copiado:\n\n'+command),()=>prompt('Copie o comando:',command)); else prompt('Copie o comando:',command); };
  obj.openMeshDriveAdmin=function(){ try{window.open('/meshdrive','_blank','noopener');}catch(e){window.location.href='/meshdrive';} };
  obj.injectMeshDriveLauncher=function(){ try{ if(document.getElementById('plugin_meshDriveLauncher'))return; const b='<span id="plugin_meshDriveLauncher" style="display:inline-flex;align-items:center;gap:6px;margin-left:auto;white-space:nowrap;"><button onclick="pluginHandler.meshdrive.copyDetectedAddress();" style="padding:5px 9px;border-radius:6px;border:1px solid #57606a;background:#f6f8fa;color:#24292f;cursor:pointer;font-size:12px;line-height:16px;">Mesh Drive</button><button onclick="pluginHandler.meshdrive.copyMapCommand();" style="padding:5px 9px;border-radius:6px;border:1px solid #16803c;background:#16803c;color:white;cursor:pointer;font-size:12px;line-height:16px;">Mapear</button><button onclick="pluginHandler.meshdrive.openMeshDriveAdmin();" style="padding:5px 9px;border-radius:6px;border:1px solid #8250df;background:#8250df;color:white;cursor:pointer;font-size:12px;line-height:16px;">Compartilhamentos</button></span>'; let t=null,hs=document.querySelectorAll('h1,h2,h3,div,span'); for(let i=0;i<hs.length;i++){let txt=(hs[i].innerText||hs[i].textContent||'').trim().toLowerCase(); if(txt==='meus arquivos'||txt==='my files'){t=hs[i];break;}} if(t){t.style.display='flex';t.style.alignItems='center';t.style.flexWrap='nowrap';t.style.width='100%';t.insertAdjacentHTML('beforeend',b);} }catch(e){} };
  obj.onWebUIStartupEnd=function(){ setTimeout(pluginHandler.meshdrive.injectMeshDriveLauncher,500); setTimeout(pluginHandler.meshdrive.injectMeshDriveLauncher,2000); };
  obj.goPageEnd=function(){ setTimeout(pluginHandler.meshdrive.injectMeshDriveLauncher,300); };
  return obj;
};
