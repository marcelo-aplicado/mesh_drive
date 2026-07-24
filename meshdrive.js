"use strict";

module.exports.meshdrive = function (parent) {
    var fs = require('fs');
    var path = require('path');
    var crypto = require('crypto');

    var obj = {};
    obj.parent = parent;
    obj.meshServer = parent.parent;
    obj.debug = obj.meshServer.debug;
    obj.exports = ['onWebUIStartupEnd', 'goPageEnd', 'copyDetectedAddress', 'copyMapCommand', 'copySharedAddress', 'openMeshDriveAdmin', 'injectMeshDriveLauncher'];

    var serverConfig = (obj.meshServer || {}).config || {};
    var settings = serverConfig.settings || {};
    var pluginDir = __dirname;
    var sharesFile = path.join(pluginDir, 'shares.json');

    var cfg = Object.assign({
        enabled: true,
        route: '/drive',
        sharedRoute: '/shared',
        adminRoute: '/meshdrive',
        publicUrl: null,
        meshFilesRoot: '/opt/meshcentral/meshcentral-files',
        meshDomainFolder: 'domain',
        userFolderPrefix: 'user-',
        defaultUserSubFolder: '',
        readOnly: false,
        allowPublic: false,
        passwordIterations: 12000,
        hostDomainMap: {},
        debugMultiTenant: false
    }, settings.meshDrive || settings.meshdrive || {});

    function log(m) { try { obj.debug('PLUGIN', 'Mesh Drive', m); } catch (e) {} try { console.log('PLUGIN: Mesh Drive: ' + m); } catch (e) {} }
    function safe(v) { return String(v || '').replace(/[^a-zA-Z0-9._ -]/g, '_').trim().slice(0, 160) || '_'; }
    function safePath(v) { return String(v || '').replace(/^[\\/]+/, '').replace(/\.\./g, '_'); }
    function norm(u) { u = String(u || '').trim(); if (u.indexOf('\\') >= 0) u = u.split('\\').pop(); if (u.indexOf('/') >= 0) u = u.split('/').pop(); if (u.indexOf('@') >= 0) u = u.split('@')[0]; if (u.toLowerCase().indexOf('user-') === 0) u = u.substring(5); return safe(u.toLowerCase()).replace(/ /g, '_'); }
    function mkdir(d) { fs.mkdirSync(d, { recursive: true }); }
    function normalizeHost(h) { h = String(h || '').split(',')[0].trim().toLowerCase(); if (h.indexOf('://') >= 0) { try { h = new URL(h).hostname; } catch (e) {} } return h.split(':')[0]; }
    function rootDomainForFolder(folder) { return path.resolve(path.join(cfg.meshFilesRoot, folder || 'domain')); }
    function fsDomainExists(folder) { try { return fs.existsSync(rootDomainForFolder(folder)); } catch (e) { return false; } }
    function domainFolderFromId(id) { id = String(id || '').trim().toLowerCase(); if (!id || id === 'domain' || id === 'default') return 'domain'; if (id.indexOf('domain-') === 0) return safe(id).replace(/ /g, '_'); return 'domain-' + safe(id).replace(/ /g, '_'); }
    function domainIdFromFolder(folder) { folder = String(folder || 'domain').toLowerCase(); if (folder === 'domain') return ''; if (folder.indexOf('domain-') === 0) return folder.substring(7); return folder; }
    function addUnique(list, value) { if (value && list.indexOf(value) < 0) list.push(value); }

    function ensureSharesFile() { if (!fs.existsSync(sharesFile)) { mkdir(pluginDir); fs.writeFileSync(sharesFile, JSON.stringify({ shares: [] }, null, 2)); } }
    function readSharesConfig() { ensureSharesFile(); try { var d = JSON.parse(fs.readFileSync(sharesFile, 'utf8')); return (d && Array.isArray(d.shares)) ? d : { shares: [] }; } catch (e) { log('shares.json parse error: ' + e); return { shares: [] }; } }
    function writeSharesConfig(data) {
        if (!data || !Array.isArray(data.shares)) throw new Error('shares must be an array');
        var clean = { shares: data.shares.map(function(s) { return { name: safe(s.name || 'Share'), path: safePath(s.path || ('shares/' + safe(s.name || 'Share'))), access: String(s.access || 'read').toLowerCase() === 'write' ? 'write' : 'read', users: Array.isArray(s.users) ? s.users.map(String) : [], groups: Array.isArray(s.groups) ? s.groups.map(String) : [] }; }) };
        fs.writeFileSync(sharesFile, JSON.stringify(clean, null, 2));
        return clean;
    }

    function findDomainIdByHost(host) {
        host = normalizeHost(host);
        var domains = serverConfig.domains || {};
        for (var key in domains) {
            if (!Object.prototype.hasOwnProperty.call(domains, key)) continue;
            var d = domains[key] || {};
            if (normalizeHost(d.dns) === host || normalizeHost(d.certUrl) === host) {
                var k = String(key || '').trim();
                if (!k || k === '_') return '';
                return k.toLowerCase();
            }
        }
        return null;
    }
    function resolveDomainContext(req) {
        var host = normalizeHost((req && req.headers && (req.headers.host || req.headers['x-forwarded-host'])) || '');
        var mapped = cfg.hostDomainMap && (cfg.hostDomainMap[host] || cfg.hostDomainMap['*']);
        var domainId = null;
        if (mapped) domainId = String(mapped).toLowerCase();
        if (domainId === null) domainId = findDomainIdByHost(host);
        var candidates = [];
        if (domainId !== null) addUnique(candidates, domainFolderFromId(domainId));
        if (host) {
            var p = host.split('.').filter(Boolean);
            if (p[0] === 'mesh' && p[1]) addUnique(candidates, domainFolderFromId(p[1]));
            if (p[0]) addUnique(candidates, domainFolderFromId(p[0]));
            if (p[1]) addUnique(candidates, domainFolderFromId(p[1]));
        }
        addUnique(candidates, cfg.meshDomainFolder || 'domain');
        var folder = candidates[0] || 'domain';
        for (var i = 0; i < candidates.length; i++) { if (fsDomainExists(candidates[i])) { folder = candidates[i]; break; } }
        return { host: host, id: domainIdFromFolder(folder), folder: folder };
    }

    function parseBasic(req) { var h = req.headers.authorization || ''; if (h.toLowerCase().indexOf('basic ') !== 0) return null; var raw = ''; try { raw = Buffer.from(h.substring(6), 'base64').toString('utf8'); } catch (e) { return null; } var i = raw.indexOf(':'); if (i < 0) return null; return { username: raw.substring(0, i), password: raw.substring(i + 1) }; }
    function dbGet(id) { return new Promise(function(resolve) { var db = obj.meshServer && (obj.meshServer.db || (obj.meshServer.webserver && obj.meshServer.webserver.db)); if (!db || typeof db.Get !== 'function') return resolve(null); try { db.Get(id, function(err, docs) { if (err) return resolve(null); if (Array.isArray(docs)) return resolve(docs[0] || null); resolve(docs || null); }); } catch (e) { resolve(null); } }); }
    function tseq(a, b) { a = String(a || ''); b = String(b || ''); var ab = Buffer.from(a), bb = Buffer.from(b); if (ab.length !== bb.length) return false; try { return crypto.timingSafeEqual(ab, bb); } catch (e) { return false; } }
    function hashLen(h) { try { var b = Buffer.from(String(h || ''), 'base64'); if (b && b.length > 0) return b.length; } catch (e) {} return 64; }
    function pbkdf2(pw, salt, stored) { return new Promise(function(resolve) { try { crypto.pbkdf2(pw, salt, cfg.passwordIterations, hashLen(stored), 'sha384', function(err, h) { if (err) return resolve(null); resolve(h.toString('base64')); }); } catch (e) { resolve(null); } }); }
    function nativeResultOk(r) { if (r === true) return true; if (r === false || r == null) return false; if (typeof r === 'string') return ['ok', 'true'].indexOf(r.toLowerCase()) >= 0; if (typeof r === 'object') return !!(r.ok || r.success || r.valid || r.authenticated || r._id || r.userid || r.user || r.name); return false; }
    function getContainerPath(n) { if (n === 'webserver') return obj.meshServer && obj.meshServer.webserver; if (n === 'meshServer') return obj.meshServer; if (n === 'parent') return parent; if (n === 'parentParent') return parent && parent.parent; return null; }
    function callNativeFunction(fn, args) { return new Promise(function(resolve) { var done = false; function finish(v) { if (!done) { done = true; resolve(v); } } var t = setTimeout(function() { finish({ status: 'timeout' }); }, 300); var cb = function(a, b) { clearTimeout(t); finish({ status: 'callback', result: (arguments.length > 1 ? b : a) }); }; try { var r = fn.apply(null, args.concat([cb])); if (r && typeof r.then === 'function') r.then(function(v) { clearTimeout(t); finish({ status: 'promise', result: v }); }).catch(function(e) { clearTimeout(t); finish({ status: 'promise-error', result: e }); }); else if (r !== undefined) { clearTimeout(t); finish({ status: 'return', result: r }); } } catch (e) { clearTimeout(t); finish({ status: 'throw', result: e }); } }); }
    async function tryNativeMeshAuth(username, password, ctx, userDoc) { var methods = ['validateUser','ValidateUser','validateUserPassword','verifyUserPassword','checkUserPassword','checkUserPass','authenticateUser','authUser','loginUser','checkUserLogin','validateLogin']; var containers = ['webserver','meshServer','parent','parentParent']; var user = norm(username), domainId = (ctx && ctx.id) || '', userId = (userDoc && userDoc._id) || (domainId ? ('user/' + domainId + '/' + user) : ('user//' + user)); for (var ci=0; ci<containers.length; ci++) { var c = getContainerPath(containers[ci]); if (!c) continue; for (var mi=0; mi<methods.length; mi++) { var fn = c[methods[mi]]; if (typeof fn !== 'function') continue; var variants = [[domainId,user,password],[user,password,domainId],[userId,password],[userDoc,password],[{domain:domainId,userid:userId,username:user,user:userDoc,password:password}],[user,password]]; for (var vi=0; vi<variants.length; vi++) { var rr = await callNativeFunction(fn, variants[vi]); if (nativeResultOk(rr.result)) return true; } } } return null; }
    async function findUser(username, ctx) { var u = norm(username), ids = []; if (ctx && ctx.id) { addUnique(ids, 'user/' + ctx.id + '/' + u); addUnique(ids, 'user/' + ctx.id + '/user-' + u); } addUnique(ids, 'user//' + u); addUnique(ids, 'user/domain/' + u); addUnique(ids, 'user//user-' + u); addUnique(ids, 'user/domain/user-' + u); if (ctx && ctx.folder && ctx.folder !== 'domain') { addUnique(ids, 'user/' + ctx.folder + '/' + u); addUnique(ids, 'user/' + ctx.folder + '/user-' + u); } for (var i=0; i<ids.length; i++) { var d = await dbGet(ids[i]); if (d) return { id: ids[i], doc: d, username: u, domainContext: ctx }; } return { id: ids[0] || ('user//' + u), doc: null, username: u, domainContext: ctx }; }
    async function validate(username, password, ctx) { if (cfg.allowPublic === true) return { id: 'public', username: 'public', domainContext: ctx }; var f = await findUser(username, ctx), d = f.doc; if (!d || d.locked || d.siteadmin === -1) return null; var nativeOk = await tryNativeMeshAuth(username, password, ctx, d); if (nativeOk === true) return { id: d._id || f.id, username: f.username, doc: d, domainContext: ctx }; var salt = d.salt, stored = d.hash || d.passhash || d.pwhash || d.passwordhash; if (!salt || !stored) return null; var computed = await pbkdf2(password, salt, stored); if (!computed) return null; if (!tseq(stored, computed) && !tseq(String(stored).toLowerCase(), String(computed).toLowerCase())) return null; return { id: d._id || f.id, username: f.username, doc: d, domainContext: ctx }; }
    function authReq(res, realm) { res.writeHead(401, { 'WWW-Authenticate': 'Basic realm="' + (realm || 'Mesh Drive') + '"', 'Content-Type': 'text/plain; charset=utf-8' }); res.end('Authentication required'); }
    async function auth(req, res, requireAdmin) { var ctx = resolveDomainContext(req), b = parseBasic(req); if (!b && cfg.allowPublic !== true) { authReq(res, requireAdmin ? 'Mesh Drive Admin' : 'Mesh Drive'); return null; } var u = await validate(b ? b.username : 'public', b ? b.password : '', ctx); if (!u) { authReq(res, requireAdmin ? 'Mesh Drive Admin' : 'Mesh Drive'); return null; } if (requireAdmin && !(u.doc && u.doc.siteadmin && u.doc.siteadmin !== 0)) { res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' }); res.end('Admin required'); return null; } return u; }

    function tenantRoot(u) { var folder = (u && u.domainContext && u.domainContext.folder) || cfg.meshDomainFolder || 'domain'; return rootDomainForFolder(folder); }
    function userRoot(u) { var r = path.join(tenantRoot(u), cfg.userFolderPrefix + norm(u.username || u.id || 'user')); if (cfg.defaultUserSubFolder) r = path.join(r, safe(cfg.defaultUserSubFolder)); mkdir(r); return path.resolve(r); }
    function routePath(req, route) { var u = req.url || '/', q = u.indexOf('?'); if (q >= 0) u = u.substring(0, q); try { u = decodeURIComponent(u); } catch (e) {} if (u.indexOf(route) === 0) u = u.substring(route.length); if (u.indexOf('/') !== 0) u = '/' + u; return u; }
    function full(u, rel) { var r = userRoot(u), clean = path.normalize('/' + rel).replace(/^([/\\])+/, ''); var p = path.resolve(path.join(r, clean)); if (p !== r && p.indexOf(r + path.sep) !== 0) return null; return p; }
    function isWriteMethod(m) { return ['PUT','DELETE','MOVE','COPY','MKCOL','PROPPATCH'].indexOf(String(m || '').toUpperCase()) >= 0; }

    function userIdentifiers(u) { var ids = ['*']; if (!u) return ids; addUnique(ids, norm(u.username)); if (u.id) addUnique(ids, String(u.id).toLowerCase()); if (u.doc) { if (u.doc._id) addUnique(ids, String(u.doc._id).toLowerCase()); if (u.doc.name) addUnique(ids, norm(u.doc.name)); if (u.doc.email) addUnique(ids, String(u.doc.email).toLowerCase()); } return ids; }
    function userGroupIdentifiers(u) { var out = []; if (!u || !u.doc) return out; ['groups','ugroups','usergroups'].forEach(function(k) { if (Array.isArray(u.doc[k])) u.doc[k].forEach(function(g) { addUnique(out, String(g).toLowerCase()); addUnique(out, norm(g)); }); }); if (u.doc.links) { Object.keys(u.doc.links).forEach(function(k) { if (k.toLowerCase().indexOf('usergroup') >= 0 || k.toLowerCase().indexOf('ugrp') >= 0) { addUnique(out, k.toLowerCase()); addUnique(out, norm(k.split('/').pop())); } }); } return out; }
    function shareAccessForUser(share, u) { var access = String(share.access || 'read').toLowerCase() === 'write' ? 'write' : 'read'; var users = Array.isArray(share.users) ? share.users.map(String) : [], groups = Array.isArray(share.groups) ? share.groups.map(String) : []; var ids = userIdentifiers(u), gids = userGroupIdentifiers(u); if (users.indexOf('*') >= 0) return access; for (var i=0; i<users.length; i++) { if (ids.indexOf(String(users[i]).toLowerCase()) >= 0 || ids.indexOf(norm(users[i])) >= 0) return access; } for (var j=0; j<groups.length; j++) { if (gids.indexOf(String(groups[j]).toLowerCase()) >= 0 || gids.indexOf(norm(groups[j])) >= 0) return access; } return null; }
    function allowedShares(u) { return readSharesConfig().shares.map(function(s) { var access = shareAccessForUser(s, u); if (!access) return null; return Object.assign({}, s, { name: safe(s.name || path.basename(s.path || 'share')), access: access }); }).filter(Boolean); }
    function findShareByName(u, name) { var list = allowedShares(u); name = safe(name); for (var i=0; i<list.length; i++) if (safe(list[i].name).toLowerCase() === name.toLowerCase()) return list[i]; return null; }
    function shareRoot(u, share) { var root = tenantRoot(u), rel = safePath(share.path || ('shares/' + share.name)); var p = path.resolve(path.join(root, rel)); if (p !== root && p.indexOf(root + path.sep) !== 0) return null; mkdir(p); return p; }
    function sharedTarget(u, rel) { var parts = rel.split('/').filter(Boolean); if (parts.length === 0) return { kind:'root', rel:'/' }; var share = findShareByName(u, parts[0]); if (!share) return null; var root = shareRoot(u, share); if (!root) return null; var inside = parts.slice(1).join('/'); var p = path.resolve(path.join(root, safePath(inside))); if (p !== root && p.indexOf(root + path.sep) !== 0) return null; return { kind:'share', share:share, root:root, path:p, rel:'/' + parts.join('/'), readOnly:String(share.access).toLowerCase() !== 'write' }; }

    function x(s) { return String(s).replace(/[<>&'"]/g, function(c) { return {'<':'&lt;','>':'&gt;','&':'&amp;',"'":'&apos;','"':'&quot;'}[c]; }); }
    function hrefFor(route, rel) { var r = rel || '/'; if (r.indexOf('/') !== 0) r = '/' + r; return route.replace(/\/$/, '') + encodeURI(r).replace(/#/g, '%23'); }
    function prop(route, f, rel) { var st = fs.statSync(f), isD = st.isDirectory(), display = path.basename(f) || '/'; return '<D:response><D:href>' + x(hrefFor(route, rel + (isD && !rel.endsWith('/') ? '/' : ''))) + '</D:href><D:propstat><D:prop><D:displayname>' + x(display) + '</D:displayname><D:getlastmodified>' + st.mtime.toUTCString() + '</D:getlastmodified><D:creationdate>' + st.birthtime.toISOString() + '</D:creationdate>' + (isD ? '<D:resourcetype><D:collection/></D:resourcetype>' : '<D:resourcetype/>') + (!isD ? '<D:getcontentlength>' + st.size + '</D:getcontentlength>' : '') + '<D:getetag>"' + st.size + '-' + Number(st.mtimeMs).toString(16) + '"</D:getetag></D:prop><D:status>HTTP/1.1 200 OK</D:status></D:propstat></D:response>'; }
    function propVirtual(route, name, rel) { return '<D:response><D:href>' + x(hrefFor(route, rel.endsWith('/') ? rel : rel + '/')) + '</D:href><D:propstat><D:prop><D:displayname>' + x(name) + '</D:displayname><D:resourcetype><D:collection/></D:resourcetype></D:prop><D:status>HTTP/1.1 200 OK</D:status></D:propstat></D:response>'; }
    function xml(res, code, body, h) { res.writeHead(code, Object.assign({ 'Content-Type': 'application/xml; charset=utf-8' }, h || {})); res.end(body); }
    function copyRec(s, d) { var st = fs.statSync(s); if (st.isDirectory()) { mkdir(d); fs.readdirSync(s).forEach(function(f) { copyRec(path.join(s, f), path.join(d, f)); }); } else { fs.copyFileSync(s, d); } }

    async function personalDav(req, res) {
        var u = await auth(req, res, false); if (!u) return;
        var rel = routePath(req, cfg.route), fp = full(u, rel); if (!fp) { res.writeHead(403); return res.end(); }
        try { return handleRealDav(req, res, cfg.route, u, rel, fp, cfg.readOnly); } catch(e) { log('handler error: ' + (e.stack || e)); try { res.writeHead(500); res.end(); } catch(ex) {} }
    }

    async function sharedDav(req, res) {
        var u = await auth(req, res, false); if (!u) return;
        var rel = routePath(req, cfg.sharedRoute), target = sharedTarget(u, rel); if (!target) { res.writeHead(404); return res.end(); }
        try {
            var method = (req.method || 'GET').toUpperCase();
            if (method === 'OPTIONS') { res.writeHead(200, { 'DAV':'1, 2', 'Allow':'OPTIONS, PROPFIND, GET, HEAD, PUT, DELETE, MKCOL, MOVE, COPY, LOCK, UNLOCK, PROPPATCH', 'MS-Author-Via':'DAV' }); return res.end(); }
            if (method === 'PROPFIND' && target.kind === 'root') { var depth=req.headers.depth||'1', out=propVirtual(cfg.sharedRoute, 'shared', '/'); if (depth !== '0') allowedShares(u).forEach(function(s){ out += propVirtual(cfg.sharedRoute, s.name, '/' + s.name); }); return xml(res,207,'<?xml version="1.0" encoding="utf-8"?><D:multistatus xmlns:D="DAV:">' + out + '</D:multistatus>'); }
            if (target.kind !== 'share') { res.writeHead(404); return res.end(); }
            return handleRealDav(req, res, cfg.sharedRoute, u, rel, target.path, target.readOnly);
        } catch(e) { log('shared handler error: ' + (e.stack || e)); try { res.writeHead(500); res.end(); } catch(ex) {} }
    }

    function handleRealDav(req, res, route, u, rel, fp, readOnly) {
        switch ((req.method || 'GET').toUpperCase()) {
            case 'OPTIONS': res.writeHead(200, { 'DAV':'1, 2', 'Allow':'OPTIONS, PROPFIND, GET, HEAD, PUT, DELETE, MKCOL, MOVE, COPY, LOCK, UNLOCK, PROPPATCH', 'MS-Author-Via':'DAV' }); res.end(); break;
            case 'PROPFIND': { if (!fs.existsSync(fp)) { res.writeHead(404); return res.end(); } var depth=req.headers.depth||'1', out=prop(route,fp,rel), st=fs.statSync(fp); if (depth!=='0' && st.isDirectory()) fs.readdirSync(fp).forEach(function(n){ out += prop(route,path.join(fp,n), path.posix.join(rel,n)); }); xml(res,207,'<?xml version="1.0" encoding="utf-8"?><D:multistatus xmlns:D="DAV:">' + out + '</D:multistatus>'); break; }
            case 'GET': case 'HEAD': { if (!fs.existsSync(fp)) { res.writeHead(404); return res.end(); } var st2=fs.statSync(fp); if (st2.isDirectory()) { res.writeHead(403); return res.end(); } res.writeHead(200,{ 'Content-Length':st2.size }); if (req.method.toUpperCase()==='HEAD') res.end(); else fs.createReadStream(fp).pipe(res); break; }
            case 'PUT': if (readOnly) { res.writeHead(405); return res.end(); } mkdir(path.dirname(fp)); req.pipe(fs.createWriteStream(fp)).on('finish',function(){res.writeHead(201);res.end();}); break;
            case 'MKCOL': if (readOnly) {res.writeHead(405);return res.end();} if (fs.existsSync(fp)) {res.writeHead(405);return res.end();} mkdir(fp); res.writeHead(201); res.end(); break;
            case 'DELETE': if (readOnly) {res.writeHead(405);return res.end();} if (!fs.existsSync(fp)) {res.writeHead(404);return res.end();} fs.rmSync(fp,{recursive:true,force:true}); res.writeHead(204); res.end(); break;
            case 'MOVE': case 'COPY': { if (readOnly) {res.writeHead(405);return res.end();} var dh=req.headers.destination; if (!dh) {res.writeHead(400);return res.end();} var du=new URL(dh,cfg.publicUrl||('https://'+(req.headers.host||'localhost')+route)), dr=decodeURIComponent(du.pathname); if (dr.indexOf(route)===0) dr=dr.substring(route.length)||'/'; var dest = path.resolve(path.join(path.dirname(fp), path.basename(safePath(dr)))); mkdir(path.dirname(dest)); if(req.method.toUpperCase()==='MOVE')fs.renameSync(fp,dest); else copyRec(fp,dest); res.writeHead(201); res.end(); break; }
            case 'LOCK': { var token='opaquelocktoken:'+crypto.randomUUID(); xml(res,200,'<?xml version="1.0" encoding="utf-8"?><D:prop xmlns:D="DAV:"><D:lockdiscovery><D:activelock><D:locktype><D:write/></D:locktype><D:lockscope><D:exclusive/></D:lockscope><D:depth>infinity</D:depth><D:owner>Mesh Drive</D:owner><D:timeout>Second-3600</D:timeout><D:locktoken><D:href>'+token+'</D:href></D:locktoken></D:activelock></D:lockdiscovery></D:prop>', {'Lock-Token':'<'+token+'>'}); break; }
            case 'UNLOCK': res.writeHead(204); res.end(); break;
            case 'PROPPATCH': xml(res,207,'<?xml version="1.0" encoding="utf-8"?><D:multistatus xmlns:D="DAV:"><D:response><D:href>'+x(hrefFor(route,rel))+'</D:href><D:propstat><D:prop/><D:status>HTTP/1.1 200 OK</D:status></D:propstat></D:response></D:multistatus>'); break;
            default: res.writeHead(405); res.end();
        }
    }

    function htmlPage(){return '<!doctype html><html><head><meta charset="utf-8"><title>Mesh Drive - Compartilhamentos</title><style>body{font-family:Segoe UI,Arial,sans-serif;margin:24px;background:#f6f8fa;color:#24292f}h1{margin-top:0}.card{background:white;border:1px solid #d0d7de;border-radius:10px;padding:18px;margin-bottom:14px;box-shadow:0 1px 2px rgba(0,0,0,.04)}label{display:block;font-weight:600;margin:8px 0 4px}input,select,textarea{width:100%;box-sizing:border-box;padding:8px;border:1px solid #d0d7de;border-radius:6px}button{padding:8px 12px;border-radius:6px;border:1px solid #1f6feb;background:#1f6feb;color:white;cursor:pointer;margin-right:6px}.danger{background:#cf222e;border-color:#cf222e}.secondary{background:#57606a;border-color:#57606a}.row{display:grid;grid-template-columns:1fr 1fr 130px;gap:10px}.small{color:#57606a;font-size:13px}</style></head><body><h1>Mesh Drive - Compartilhamentos</h1><p class="small">Configuração salva em <code>plugins/meshdrive/shares.json</code>. Rota WebDAV experimental: <code>/shared</code>.</p><div id="list"></div><button onclick="addShare()">Adicionar compartilhamento</button><button class="secondary" onclick="load()">Recarregar</button><script>let data={shares:[]};function esc(s){return String(s||\'\').replace(/[&<>\"]/g,c=>({\'&\':\'&amp;\',\'<\':\'&lt;\',\'>\':\'&gt;\',\'"\':\'&quot;\'}[c]))}async function load(){const r=await fetch(location.pathname+\'/config\');data=await r.json();render()}function render(){const el=document.getElementById(\'list\');el.innerHTML=\'\';(data.shares||[]).forEach((s,i)=>{const d=document.createElement(\'div\');d.className=\'card\';d.innerHTML=`<div class="row"><div><label>Nome</label><input value="${esc(s.name)}" onchange="data.shares[${i}].name=this.value"></div><div><label>Caminho</label><input value="${esc(s.path)}" onchange="data.shares[${i}].path=this.value"></div><div><label>Permissão</label><select onchange="data.shares[${i}].access=this.value"><option value="read" ${s.access!==\'write\'?\'selected\':\'\'}>Leitura</option><option value="write" ${s.access===\'write\'?\'selected\':\'\'}>Gravação</option></select></div></div><label>Usuários</label><textarea rows="3" onchange="data.shares[${i}].users=this.value.split(/\\n|,/).map(x=>x.trim()).filter(Boolean)">${esc((s.users||[]).join(\'\\n\'))}</textarea><label>Grupos</label><textarea rows="2" onchange="data.shares[${i}].groups=this.value.split(/\\n|,/).map(x=>x.trim()).filter(Boolean)">${esc((s.groups||[]).join(\'\\n\'))}</textarea><br><br><button onclick="save()">Salvar</button><button class="danger" onclick="removeShare(${i})">Remover</button>`;el.appendChild(d)})}function addShare(){data.shares.push({name:\'Novo\',path:\'shares/novo\',access:\'read\',users:[],groups:[]});render()}function removeShare(i){data.shares.splice(i,1);render()}async function save(){const r=await fetch(location.pathname+\'/config\',{method:\'POST\',headers:{\'Content-Type\':\'application/json\'},body:JSON.stringify(data)});if(!r.ok){alert(await r.text());return}data=await r.json();render();alert(\'Configuração salva.\')}load();</script></body></html>';}
    function readBody(req){return new Promise(function(resolve){var chunks=[];req.on('data',function(d){chunks.push(d);});req.on('end',function(){resolve(Buffer.concat(chunks).toString('utf8'));});});}
    async function adminHandler(req,res){var u=await auth(req,res,true); if(!u)return; var pathname=(req.url||'').split('?')[0].replace(/\/$/,''); if(pathname.endsWith('/config')){ if((req.method||'GET').toUpperCase()==='GET'){res.writeHead(200,{'Content-Type':'application/json; charset=utf-8'});return res.end(JSON.stringify(readSharesConfig(),null,2));} if((req.method||'GET').toUpperCase()==='POST'){try{var body=await readBody(req);var saved=writeSharesConfig(JSON.parse(body));res.writeHead(200,{'Content-Type':'application/json; charset=utf-8'});return res.end(JSON.stringify(saved,null,2));}catch(e){res.writeHead(400,{'Content-Type':'text/plain; charset=utf-8'});return res.end(String(e.message||e));}}} res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});res.end(htmlPage());}

    function app(){var c=[obj.meshServer&&obj.meshServer.webserver&&obj.meshServer.webserver.app,obj.meshServer&&obj.meshServer.app,parent&&parent.app,parent&&parent.webserver&&parent.webserver.app];for(var i=0;i<c.length;i++)if(c[i]&&typeof c[i].use==='function')return c[i];return null;}
    obj.hook_setupHttpHandlers=function(){if(cfg.enabled===false)return;var a=app();if(!a){log('Express app not found');return;}ensureSharesFile();mkdir(rootDomainForFolder(cfg.meshDomainFolder||'domain'));a.use(cfg.route,function(req,res){personalDav(req,res);});a.use(cfg.sharedRoute,function(req,res){sharedDav(req,res);});a.use(cfg.adminRoute,function(req,res){adminHandler(req,res);});log('registered route '+cfg.route+', shared '+cfg.sharedRoute+' and admin '+cfg.adminRoute);};
    obj.server_startup=function(){log('loaded for dynamic-host, root='+cfg.meshFilesRoot+', shares='+sharesFile);};

    obj.copyDetectedAddress=function(){var ua=navigator.userAgent||'',host=window.location.hostname||window.location.host||'localhost',os='other';if(/Windows/i.test(ua))os='windows';else if(/Macintosh|Mac OS/i.test(ua))os='macos';else if(/Linux/i.test(ua))os='linux';var address='https://'+host+'/drive/';if(os==='windows')address='\\\\'+host+'@SSL\\drive';else if(os==='linux'||os==='macos')address='davs://'+host+'/drive/';var msg='Endereço do Mesh Drive copiado.\n\n'+address;if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(address).then(function(){alert(msg);},function(){prompt('Copie o endereço abaixo:',address);});else prompt('Copie o endereço abaixo:',address);};
    obj.copySharedAddress=function(){var ua=navigator.userAgent||'',host=window.location.hostname||window.location.host||'localhost',os='other';if(/Windows/i.test(ua))os='windows';else if(/Macintosh|Mac OS/i.test(ua))os='macos';else if(/Linux/i.test(ua))os='linux';var address='https://'+host+'/shared/';if(os==='windows')address='\\\\'+host+'@SSL\\shared';else if(os==='linux'||os==='macos')address='davs://'+host+'/shared/';var msg='Endereço compartilhado copiado.\n\n'+address;if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(address).then(function(){alert(msg);},function(){prompt('Copie o endereço abaixo:',address);});else prompt('Copie o endereço abaixo:',address);};
    obj.copyMapCommand=function(){var host=window.location.hostname||window.location.host||'localhost';var command=['$meshHost="'+host.replace(/"/g,'')+'";','$path="\\\\$($meshHost)@SSL\\drive";','foreach($l in "M","N","O","P","Q","R","S","T","U","V","W","X","Y","Z"){','if(-not (Get-PSDrive -Name $l -ErrorAction SilentlyContinue)){','net use "$($l):" $path;','if($LASTEXITCODE -eq 0){explorer "$($l):\\"};','break','}','}'].join('');var msg='Comando copiado para Windows. Execute no terminal para abrir/mapear o Mesh Drive.';var popupText=msg+'\n\n'+command;if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(command).then(function(){alert(popupText);},function(){prompt(msg,command);});else prompt(msg,command);};
    obj.openMeshDriveAdmin=function(){try{window.open('/meshdrive','_blank','noopener');}catch(e){window.location.href='/meshdrive';}};
    obj.injectMeshDriveLauncher=function(){try{if(document.getElementById('plugin_meshDriveLauncher'))return;var b='<span id="plugin_meshDriveLauncher" style="display:inline-flex;align-items:center;gap:6px;margin-left:auto;white-space:nowrap;"><button onclick="pluginHandler.meshdrive.copyDetectedAddress();" style="padding:5px 9px;border-radius:6px;border:1px solid #57606a;background:#f6f8fa;color:#24292f;cursor:pointer;font-size:12px;line-height:16px;">Mesh Drive</button><button onclick="pluginHandler.meshdrive.copyMapCommand();" style="padding:5px 9px;border-radius:6px;border:1px solid #16803c;background:#16803c;color:white;cursor:pointer;font-size:12px;line-height:16px;">Mapear</button><button onclick="pluginHandler.meshdrive.copySharedAddress();" style="padding:5px 9px;border-radius:6px;border:1px solid #0969da;background:#0969da;color:white;cursor:pointer;font-size:12px;line-height:16px;">Shared</button><button onclick="pluginHandler.meshdrive.openMeshDriveAdmin();" style="padding:5px 9px;border-radius:6px;border:1px solid #8250df;background:#8250df;color:white;cursor:pointer;font-size:12px;line-height:16px;">Compartilhamentos</button></span>';var t=null,hs=document.querySelectorAll('h1,h2,h3,div,span');for(var i=0;i<hs.length;i++){var txt=(hs[i].innerText||hs[i].textContent||'').trim().toLowerCase();if(txt==='meus arquivos'||txt==='my files'){t=hs[i];break;}}if(t){t.style.display='flex';t.style.alignItems='center';t.style.flexWrap='nowrap';t.style.width='100%';t.insertAdjacentHTML('beforeend',b);}}catch(e){console.log('Mesh Drive My Files injection failed',e);}};
    obj.onWebUIStartupEnd=function(){setTimeout(pluginHandler.meshdrive.injectMeshDriveLauncher,500);setTimeout(pluginHandler.meshdrive.injectMeshDriveLauncher,2000);};
    obj.goPageEnd=function(){setTimeout(pluginHandler.meshdrive.injectMeshDriveLauncher,300);};
    return obj;
};
