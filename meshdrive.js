"use strict";

module.exports.meshdrive = function (parent) {
    var fs = require('fs');
    var path = require('path');
    var crypto = require('crypto');

    var obj = {};
    obj.parent = parent;
    obj.meshServer = parent.parent;
    obj.debug = obj.meshServer.debug;
    obj.exports = ['onWebUIStartupEnd', 'goPageEnd', 'copyDetectedAddress', 'copyMapCommand', 'injectMeshDriveLauncher'];

    var serverConfig = (obj.meshServer || {}).config || {};
    var settings = serverConfig.settings || {};
    var cfg = Object.assign({
        enabled: true,
        route: '/drive',
        publicUrl: null,
        meshFilesRoot: '/opt/meshcentral/meshcentral-files',
        meshDomainFolder: 'domain',
        userFolderPrefix: 'user-',
        defaultUserSubFolder: '',
        readOnly: false,
        allowPublic: false,
        passwordIterations: 12000,
        hostDomainMap: {},
        debugMultiTenant: true
    }, settings.meshDrive || settings.meshdrive || {});

    function log(m) { try { obj.debug('PLUGIN', 'Mesh Drive', m); } catch (e) {} try { console.log('PLUGIN: Mesh Drive: ' + m); } catch (e) {} }
    function safe(v) { return String(v || '').replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 160) || '_'; }
    function norm(u) { u = String(u || '').trim(); if (u.indexOf('\\') >= 0) u = u.split('\\').pop(); if (u.indexOf('/') >= 0) u = u.split('/').pop(); if (u.indexOf('@') >= 0) u = u.split('@')[0]; if (u.toLowerCase().indexOf('user-') === 0) u = u.substring(5); return safe(u.toLowerCase()); }
    function mkdir(d) { fs.mkdirSync(d, { recursive: true }); }
    function normalizeHost(h) { h = String(h || '').split(',')[0].trim().toLowerCase(); if (h.indexOf('://') >= 0) { try { h = new URL(h).hostname; } catch (e) {} } return h.split(':')[0]; }
    function rootDomainForFolder(folder) { return path.resolve(path.join(cfg.meshFilesRoot, folder || 'domain')); }
    function fsDomainExists(folder) { try { return fs.existsSync(rootDomainForFolder(folder)); } catch (e) { return false; } }
    function domainFolderFromId(id) { id = String(id || '').trim().toLowerCase(); if (!id || id === 'domain' || id === 'default') return 'domain'; if (id.indexOf('domain-') === 0) return safe(id); return 'domain-' + safe(id); }
    function domainIdFromFolder(folder) { folder = String(folder || 'domain').toLowerCase(); if (folder === 'domain') return ''; if (folder.indexOf('domain-') === 0) return folder.substring(7); return folder; }
    function addUnique(list, value) { if (value && list.indexOf(value) < 0) list.push(value); }

    function findDomainIdByHost(host) {
        host = normalizeHost(host);
        var domains = serverConfig.domains || {};
        for (var key in domains) {
            if (!Object.prototype.hasOwnProperty.call(domains, key)) continue;
            var d = domains[key] || {};
            var dns = normalizeHost(d.dns);
            var cert = normalizeHost(d.certUrl);
            if (dns === host || cert === host) {
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
        var source = 'default';
        if (mapped) { domainId = String(mapped).toLowerCase(); source = 'hostDomainMap'; }
        if (domainId === null) {
            domainId = findDomainIdByHost(host);
            if (domainId !== null) source = 'meshConfig.domains';
        }
        var candidates = [];
        if (domainId !== null) addUnique(candidates, domainFolderFromId(domainId));
        if (host) {
            var parts = host.split('.').filter(Boolean);
            if (parts[0] === 'mesh' && parts[1]) addUnique(candidates, domainFolderFromId(parts[1]));
            if (parts[0]) addUnique(candidates, domainFolderFromId(parts[0]));
            if (parts[1]) addUnique(candidates, domainFolderFromId(parts[1]));
            addUnique(candidates, domainFolderFromId(host));
        }
        addUnique(candidates, cfg.meshDomainFolder || 'domain');
        var folder = candidates[0] || 'domain';
        for (var i = 0; i < candidates.length; i++) { if (fsDomainExists(candidates[i])) { folder = candidates[i]; break; } }
        var id = domainIdFromFolder(folder);
        var ctx = { host: host, id: id, folder: folder, source: source, candidates: candidates };
        if (cfg.debugMultiTenant) log('tenant resolve host=' + host + ', id=' + id + ', folder=' + folder + ', source=' + source + ', candidates=' + candidates.join('|'));
        return ctx;
    }

    function parseBasic(req) { var h = req.headers.authorization || ''; if (h.toLowerCase().indexOf('basic ') !== 0) return null; var raw = ''; try { raw = Buffer.from(h.substring(6), 'base64').toString('utf8'); } catch (e) { return null; } var i = raw.indexOf(':'); if (i < 0) return null; return { username: raw.substring(0, i), password: raw.substring(i + 1) }; }
    function dbGet(id) { return new Promise(function(resolve) { var db = obj.meshServer && (obj.meshServer.db || (obj.meshServer.webserver && obj.meshServer.webserver.db)); if (!db || typeof db.Get !== 'function') return resolve(null); try { db.Get(id, function(err, docs) { if (err) return resolve(null); if (Array.isArray(docs)) return resolve(docs[0] || null); resolve(docs || null); }); } catch (e) { resolve(null); } }); }
    function tseq(a, b) { a = String(a || ''); b = String(b || ''); var ab = Buffer.from(a), bb = Buffer.from(b); if (ab.length !== bb.length) return false; try { return crypto.timingSafeEqual(ab, bb); } catch (e) { return false; } }
    function hashLen(h) { try { var b = Buffer.from(String(h || ''), 'base64'); if (b && b.length > 0) return b.length; } catch (e) {} return 64; }
    function pbkdf2(pw, salt, stored) { return new Promise(function(resolve) { try { crypto.pbkdf2(pw, salt, cfg.passwordIterations, hashLen(stored), 'sha384', function(err, h) { if (err) return resolve(null); resolve(h.toString('base64')); }); } catch (e) { resolve(null); } }); }

    function getContainerPath(name) {
        if (name === 'webserver') return obj.meshServer && obj.meshServer.webserver;
        if (name === 'meshServer') return obj.meshServer;
        if (name === 'parent') return parent;
        if (name === 'parentParent') return parent && parent.parent;
        return null;
    }
    function listPossibleNativeAuthMethods() {
        var names = ['webserver', 'meshServer', 'parent', 'parentParent'];
        var found = [];
        names.forEach(function(containerName) {
            var c = getContainerPath(containerName);
            if (!c) return;
            try {
                Object.keys(c).forEach(function(k) {
                    var lk = k.toLowerCase();
                    if (typeof c[k] === 'function' && (lk.indexOf('auth') >= 0 || lk.indexOf('login') >= 0 || lk.indexOf('pass') >= 0 || lk.indexOf('verify') >= 0 || lk.indexOf('valid') >= 0)) {
                        found.push(containerName + '.' + k);
                    }
                });
            } catch (e) {}
        });
        return found;
    }
    function nativeResultOk(result) {
        if (result === true) return true;
        if (result === false || result == null) return false;
        if (typeof result === 'string') return result.toLowerCase() === 'ok' || result.toLowerCase() === 'true';
        if (typeof result === 'object') {
            if (result.ok === true || result.success === true || result.valid === true || result.authenticated === true) return true;
            if (result._id || result.userid || result.user || result.name) return true;
        }
        return false;
    }
    function callNativeFunction(fn, args, label) {
        return new Promise(function(resolve) {
            var done = false;
            function finish(v) { if (!done) { done = true; resolve(v); } }
            var timeout = setTimeout(function() { finish({ status: 'timeout' }); }, 300);
            var cb = function(a, b, c) {
                clearTimeout(timeout);
                if (a && (a instanceof Error || (typeof a === 'object' && a.message && !nativeResultOk(a)))) { finish({ status: 'callback-error', result: a }); return; }
                if (arguments.length > 1) finish({ status: 'callback', result: b }); else finish({ status: 'callback', result: a });
            };
            try {
                var r = fn.apply(null, args.concat([cb]));
                if (r && typeof r.then === 'function') {
                    r.then(function(v) { clearTimeout(timeout); finish({ status: 'promise', result: v }); }).catch(function(e) { clearTimeout(timeout); finish({ status: 'promise-error', result: e }); });
                } else if (r !== undefined) {
                    clearTimeout(timeout); finish({ status: 'return', result: r });
                }
            } catch (e) { clearTimeout(timeout); finish({ status: 'throw', result: e }); }
        });
    }
    async function tryNativeMeshAuth(username, password, ctx, userDoc) {
        var methods = [
            'validateUser', 'ValidateUser', 'validateUserPassword', 'verifyUserPassword', 'checkUserPassword', 'checkUserPass', 'authenticateUser', 'authUser', 'loginUser', 'checkUserLogin', 'validateLogin'
        ];
        var containers = ['webserver', 'meshServer', 'parent', 'parentParent'];
        var user = norm(username);
        var domainId = (ctx && ctx.id) || '';
        var userId = (userDoc && userDoc._id) || (domainId ? ('user/' + domainId + '/' + user) : ('user//' + user));
        if (cfg.debugMultiTenant) log('native auth available methods=' + listPossibleNativeAuthMethods().join('|'));
        for (var ci = 0; ci < containers.length; ci++) {
            var c = getContainerPath(containers[ci]);
            if (!c) continue;
            for (var mi = 0; mi < methods.length; mi++) {
                var name = methods[mi];
                if (typeof c[name] !== 'function') continue;
                var fn = c[name];
                var variants = [
                    [domainId, user, password],
                    [user, password, domainId],
                    [userId, password],
                    [userDoc, password],
                    [{ domain: domainId, userid: userId, username: user, user: userDoc, password: password }],
                    [user, password]
                ];
                for (var vi = 0; vi < variants.length; vi++) {
                    var label = containers[ci] + '.' + name + '#' + vi;
                    var r = await callNativeFunction(fn, variants[vi], label);
                    if (cfg.debugMultiTenant) log('native auth tried ' + label + ', status=' + r.status + ', ok=' + nativeResultOk(r.result));
                    if (nativeResultOk(r.result)) return true;
                }
            }
        }
        return null;
    }

    async function findUser(username, ctx) {
        var u = norm(username), ids = [];
        if (ctx && ctx.id) { addUnique(ids, 'user/' + ctx.id + '/' + u); addUnique(ids, 'user/' + ctx.id + '/user-' + u); }
        addUnique(ids, 'user//' + u); addUnique(ids, 'user/domain/' + u); addUnique(ids, 'user//user-' + u); addUnique(ids, 'user/domain/user-' + u);
        if (ctx && ctx.folder && ctx.folder !== 'domain') { addUnique(ids, 'user/' + ctx.folder + '/' + u); addUnique(ids, 'user/' + ctx.folder + '/user-' + u); }
        for (var i = 0; i < ids.length; i++) { var d = await dbGet(ids[i]); if (d) { if (cfg.debugMultiTenant) log('tenant user found id=' + ids[i]); return { id: ids[i], doc: d, username: u, domainContext: ctx }; } }
        if (cfg.debugMultiTenant) log('tenant user not found username=' + u + ', tried=' + ids.join('|'));
        return { id: ids[0] || ('user//' + u), doc: null, username: u, domainContext: ctx };
    }
    async function validate(username, password, ctx) {
        if (cfg.allowPublic === true) return { id: 'public', username: 'public', domainContext: ctx };
        if (cfg.debugMultiTenant) log('auth start username=' + norm(username) + ', host=' + ((ctx && ctx.host) || '') + ', domainId=' + ((ctx && ctx.id) || '') + ', folder=' + ((ctx && ctx.folder) || ''));
        var f = await findUser(username, ctx), d = f.doc;
        if (!d) { if (cfg.debugMultiTenant) log('auth failed: user document not found for username=' + norm(username)); return null; }
        if (cfg.debugMultiTenant) log('auth user doc=' + (d._id || f.id || '') + ', docDomain=' + (d.domain || '') + ', siteadmin=' + d.siteadmin + ', locked=' + (d.locked ? 'true' : 'false'));
        if (d.locked || d.siteadmin === -1) { if (cfg.debugMultiTenant) log('auth failed: user locked or disabled id=' + (d._id || f.id || '')); return null; }

        var nativeOk = await tryNativeMeshAuth(username, password, ctx, d);
        if (nativeOk === true) {
            if (cfg.debugMultiTenant) log('auth success native id=' + (d._id || f.id || '') + ', username=' + f.username + ', folder=' + ((ctx && ctx.folder) || ''));
            return { id: d._id || f.id, username: f.username, doc: d, domainContext: ctx };
        }
        if (cfg.debugMultiTenant) log('native auth unavailable or unsuccessful, falling back to manual PBKDF2 id=' + (d._id || f.id || ''));

        var salt = d.salt, stored = d.hash || d.passhash || d.pwhash || d.passwordhash;
        if (cfg.debugMultiTenant) log('auth material id=' + (d._id || f.id || '') + ', hasSalt=' + (!!salt) + ', hasHash=' + (!!stored) + ', storedLen=' + String(stored || '').length + ', saltLen=' + String(salt || '').length + ', iterations=' + cfg.passwordIterations);
        if (!salt || !stored) { if (cfg.debugMultiTenant) log('auth failed: missing salt/hash id=' + (d._id || f.id || '')); return null; }
        var computed = await pbkdf2(password, salt, stored);
        if (!computed) { if (cfg.debugMultiTenant) log('auth failed: pbkdf2 returned null id=' + (d._id || f.id || '')); return null; }
        var matchExact = tseq(stored, computed);
        var matchLower = tseq(String(stored).toLowerCase(), String(computed).toLowerCase());
        if (cfg.debugMultiTenant) log('auth compare id=' + (d._id || f.id || '') + ', computedLen=' + String(computed || '').length + ', matchExact=' + matchExact + ', matchLower=' + matchLower);
        if (!matchExact && !matchLower) { if (cfg.debugMultiTenant) log('auth failed: hash mismatch id=' + (d._id || f.id || '')); return null; }
        if (cfg.debugMultiTenant) log('auth success manual id=' + (d._id || f.id || '') + ', username=' + f.username + ', folder=' + ((ctx && ctx.folder) || ''));
        return { id: d._id || f.id, username: f.username, doc: d, domainContext: ctx };
    }
    function authReq(res) { res.writeHead(401, { 'WWW-Authenticate': 'Basic realm="Mesh Drive"', 'Content-Type': 'text/plain; charset=utf-8' }); res.end('Authentication required'); }
    async function auth(req, res) { var ctx = resolveDomainContext(req); var b = parseBasic(req); if (!b && cfg.allowPublic !== true) { authReq(res); return null; } var u = await validate(b ? b.username : 'public', b ? b.password : '', ctx); if (!u) { authReq(res); return null; } return u; }
    function userRoot(u) { var ctx = (u && u.domainContext) || { folder: cfg.meshDomainFolder || 'domain' }; var r = path.join(rootDomainForFolder(ctx.folder), cfg.userFolderPrefix + norm(u.username || u.id || 'user')); if (cfg.defaultUserSubFolder) r = path.join(r, safe(cfg.defaultUserSubFolder)); mkdir(r); if (cfg.debugMultiTenant) log('tenant userRoot=' + r); return path.resolve(r); }
    function reqPath(req) { var u = req.url || '/', q = u.indexOf('?'); if (q >= 0) u = u.substring(0, q); try { u = decodeURIComponent(u); } catch (e) {} if (u.indexOf(cfg.route) === 0) u = u.substring(cfg.route.length); if (u.indexOf('/') !== 0) u = '/' + u; return u; }
    function full(u, rel) { var r = userRoot(u), clean = path.normalize('/' + rel).replace(/^([/\\])+/, ''); var p = path.resolve(path.join(r, clean)); if (p !== r && p.indexOf(r + path.sep) !== 0) return null; return p; }
    function x(s) { return String(s).replace(/[<>&'"]/g, function(c) { return {'<':'&lt;','>':'&gt;','&':'&amp;',"'":'&apos;','"':'&quot;'}[c]; }); }
    function href(rel) { var r = rel || '/'; if (r.indexOf('/') !== 0) r = '/' + r; return cfg.route.replace(/\/$/, '') + encodeURI(r).replace(/#/g, '%23'); }
    function prop(f, rel) { var st = fs.statSync(f), isD = st.isDirectory(), display = path.basename(f) || '/'; return '<D:response><D:href>' + x(href(rel + (isD && !rel.endsWith('/') ? '/' : ''))) + '</D:href><D:propstat><D:prop><D:displayname>' + x(display) + '</D:displayname><D:getlastmodified>' + st.mtime.toUTCString() + '</D:getlastmodified><D:creationdate>' + st.birthtime.toISOString() + '</D:creationdate>' + (isD ? '<D:resourcetype><D:collection/></D:resourcetype>' : '<D:resourcetype/>') + (!isD ? '<D:getcontentlength>' + st.size + '</D:getcontentlength>' : '') + '<D:getetag>"' + st.size + '-' + Number(st.mtimeMs).toString(16) + '"</D:getetag></D:prop><D:status>HTTP/1.1 200 OK</D:status></D:propstat></D:response>'; }
    function xml(res, code, body, h) { res.writeHead(code, Object.assign({ 'Content-Type': 'application/xml; charset=utf-8' }, h || {})); res.end(body); }
    function copyRec(s, d) { var st = fs.statSync(s); if (st.isDirectory()) { mkdir(d); fs.readdirSync(s).forEach(function(f) { copyRec(path.join(s, f), path.join(d, f)); }); } else { fs.copyFileSync(s, d); } }
    async function dav(req, res) { var u = await auth(req, res); if (!u) return; var rel = reqPath(req), fp = full(u, rel); if (!fp) { res.writeHead(403); return res.end(); } try { switch ((req.method || 'GET').toUpperCase()) { case 'OPTIONS': res.writeHead(200, { 'DAV': '1, 2', 'Allow': 'OPTIONS, PROPFIND, GET, HEAD, PUT, DELETE, MKCOL, MOVE, COPY, LOCK, UNLOCK, PROPPATCH', 'MS-Author-Via': 'DAV' }); res.end(); break; case 'PROPFIND': { if (!fs.existsSync(fp)) { res.writeHead(404); return res.end(); } var depth = req.headers.depth || '1', out = prop(fp, rel), st = fs.statSync(fp); if (depth !== '0' && st.isDirectory()) fs.readdirSync(fp).forEach(function(n) { out += prop(path.join(fp, n), path.posix.join(rel, n)); }); xml(res, 207, '<?xml version="1.0" encoding="utf-8"?><D:multistatus xmlns:D="DAV:">' + out + '</D:multistatus>'); break; } case 'GET': case 'HEAD': { if (!fs.existsSync(fp)) { res.writeHead(404); return res.end(); } var st2 = fs.statSync(fp); if (st2.isDirectory()) { res.writeHead(403); return res.end(); } res.writeHead(200, { 'Content-Length': st2.size }); if (req.method.toUpperCase() === 'HEAD') res.end(); else fs.createReadStream(fp).pipe(res); break; } case 'PUT': if (cfg.readOnly) { res.writeHead(405); return res.end(); } mkdir(path.dirname(fp)); req.pipe(fs.createWriteStream(fp)).on('finish', function() { res.writeHead(201); res.end(); }); break; case 'MKCOL': if (cfg.readOnly) { res.writeHead(405); return res.end(); } if (fs.existsSync(fp)) { res.writeHead(405); return res.end(); } mkdir(fp); res.writeHead(201); res.end(); break; case 'DELETE': if (cfg.readOnly) { res.writeHead(405); return res.end(); } if (!fs.existsSync(fp)) { res.writeHead(404); return res.end(); } fs.rmSync(fp, { recursive: true, force: true }); res.writeHead(204); res.end(); break; case 'MOVE': case 'COPY': { if (cfg.readOnly) { res.writeHead(405); return res.end(); } var dh = req.headers.destination; if (!dh) { res.writeHead(400); return res.end(); } var du = new URL(dh, cfg.publicUrl || ('https://' + (req.headers.host || 'localhost') + cfg.route)), dr = decodeURIComponent(du.pathname); if (dr.indexOf(cfg.route) === 0) dr = dr.substring(cfg.route.length) || '/'; var dest = full(u, dr); if (!dest) { res.writeHead(403); return res.end(); } mkdir(path.dirname(dest)); if (req.method.toUpperCase() === 'MOVE') fs.renameSync(fp, dest); else copyRec(fp, dest); res.writeHead(201); res.end(); break; } case 'LOCK': { var token = 'opaquelocktoken:' + crypto.randomUUID(); xml(res, 200, '<?xml version="1.0" encoding="utf-8"?><D:prop xmlns:D="DAV:"><D:lockdiscovery><D:activelock><D:locktype><D:write/></D:locktype><D:lockscope><D:exclusive/></D:lockscope><D:depth>infinity</D:depth><D:owner>Mesh Drive</D:owner><D:timeout>Second-3600</D:timeout><D:locktoken><D:href>' + token + '</D:href></D:locktoken></D:activelock></D:lockdiscovery></D:prop>', { 'Lock-Token': '<' + token + '>' }); break; } case 'UNLOCK': res.writeHead(204); res.end(); break; case 'PROPPATCH': xml(res, 207, '<?xml version="1.0" encoding="utf-8"?><D:multistatus xmlns:D="DAV:"><D:response><D:href>' + x(href(rel)) + '</D:href><D:propstat><D:prop/><D:status>HTTP/1.1 200 OK</D:status></D:propstat></D:response></D:multistatus>'); break; default: res.writeHead(405); res.end(); } } catch (e) { log('handler error: ' + (e.stack || e)); try { res.writeHead(500); res.end(); } catch (ex) {} } }
    function app() { var c = [obj.meshServer && obj.meshServer.webserver && obj.meshServer.webserver.app, obj.meshServer && obj.meshServer.app, parent && parent.app, parent && parent.webserver && parent.webserver.app]; for (var i = 0; i < c.length; i++) if (c[i] && typeof c[i].use === 'function') return c[i]; return null; }
    obj.hook_setupHttpHandlers = function() { if (cfg.enabled === false) return; var a = app(); if (!a) { log('Express app not found'); return; } mkdir(rootDomainForFolder(cfg.meshDomainFolder || 'domain')); a.use(cfg.route, function(req, res) { dav(req, res); }); log('registered route ' + cfg.route + ' -> ' + cfg.meshFilesRoot + '/<tenant>/' + cfg.userFolderPrefix + '<username>'); };
    obj.server_startup = function() { log('loaded for dynamic-host, root=' + cfg.meshFilesRoot); };

    obj.copyDetectedAddress = function() { var ua = navigator.userAgent || '', host = window.location.hostname || window.location.host || 'localhost', os = 'other'; if (/Windows/i.test(ua)) os = 'windows'; else if (/Macintosh|Mac OS/i.test(ua)) os = 'macos'; else if (/Linux/i.test(ua)) os = 'linux'; var address = 'https://' + host + '/drive/'; if (os === 'windows') address = '\\\\' + host + '@SSL\\drive'; else if (os === 'linux' || os === 'macos') address = 'davs://' + host + '/drive/'; var where = (os === 'windows') ? 'Windows Explorer' : ((os === 'linux') ? 'gerenciador de arquivos do Linux' : ((os === 'macos') ? 'Finder' : 'navegador')); var msg = 'Endereço do Mesh Drive copiado.\n\nCole este endereço no ' + where + ' para abrir seus arquivos:\n\n' + address; if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(address).then(function() { alert(msg); }, function() { prompt('Copie o endereço abaixo:', address); }); else prompt('Copie o endereço abaixo:', address); };
    obj.copyMapCommand = function() { var ua = navigator.userAgent || '', host = window.location.hostname || window.location.host || 'localhost', os = 'other'; if (/Windows/i.test(ua)) os = 'windows'; else if (/Macintosh|Mac OS/i.test(ua)) os = 'macos'; else if (/Linux/i.test(ua)) os = 'linux'; var command; if (os === 'windows') { command = ['$meshHost="' + host.replace(/"/g, '') + '";', '$path="\\\\$($meshHost)@SSL\\drive";', 'foreach($l in "M","N","O","P","Q","R","S","T","U","V","W","X","Y","Z"){', 'if(-not (Get-PSDrive -Name $l -ErrorAction SilentlyContinue)){', 'net use "$($l):" $path;', 'if($LASTEXITCODE -eq 0){', '$rk="HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\DriveIcons\\$l\\DefaultLabel";', 'reg add $rk /ve /d "Mesh Drive" /f | Out-Null;', 'try{(New-Object -ComObject Shell.Application).NameSpace("$($l):\\").Self.Name="Mesh Drive"}catch{};', 'explorer "$($l):\\"', '};', 'break', '}', '}'].join(''); } else if (os === 'linux') { command = 'URL="davs://' + host.replace(/"/g, '') + '/drive/"; if command -v gio >/dev/null 2>&1; then gio mount "$URL"; fi; if command -v xdg-open >/dev/null 2>&1; then xdg-open "$URL"; else echo "$URL"; fi'; } else if (os === 'macos') { command = 'open "davs://' + host.replace(/"/g, '') + '/drive/"'; } else { command = 'https://' + host.replace(/"/g, '') + '/drive/'; } var osName = (os === 'windows') ? 'Windows' : ((os === 'linux') ? 'Linux' : ((os === 'macos') ? 'macOS' : 'sistema atual')); var msg = 'Comando copiado para ' + osName + '. Execute no terminal para abrir/mapear o Mesh Drive.'; var popupText = msg + '\n\n' + command; if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(command).then(function() { alert(popupText); }, function() { prompt(msg, command); }); else prompt(msg, command); };
    obj.injectMeshDriveLauncher = function() { try { if (document.getElementById('plugin_meshDriveLauncher')) return; var b = '<span id="plugin_meshDriveLauncher" style="display:inline-flex;align-items:center;gap:6px;margin-left:auto;white-space:nowrap;">' + '<button onclick="pluginHandler.meshdrive.copyDetectedAddress();" style="padding:5px 9px;border-radius:6px;border:1px solid #57606a;background:#f6f8fa;color:#24292f;cursor:pointer;font-size:12px;line-height:16px;">Mesh Drive</button>' + '<button onclick="pluginHandler.meshdrive.copyMapCommand();" style="padding:5px 9px;border-radius:6px;border:1px solid #16803c;background:#16803c;color:white;cursor:pointer;font-size:12px;line-height:16px;">Mapear</button>' + '</span>'; var t = null, hs = document.querySelectorAll('h1,h2,h3,div,span'); for (var i = 0; i < hs.length; i++) { var txt = (hs[i].innerText || hs[i].textContent || '').trim().toLowerCase(); if (txt === 'meus arquivos' || txt === 'my files') { t = hs[i]; break; } } if (t) { t.style.display = 'flex'; t.style.alignItems = 'center'; t.style.flexWrap = 'nowrap'; t.style.width = '100%'; t.insertAdjacentHTML('beforeend', b); } } catch (e) { console.log('Mesh Drive My Files injection failed', e); } };
    obj.onWebUIStartupEnd = function() { setTimeout(pluginHandler.meshdrive.injectMeshDriveLauncher, 500); setTimeout(pluginHandler.meshdrive.injectMeshDriveLauncher, 2000); };
    obj.goPageEnd = function() { setTimeout(pluginHandler.meshdrive.injectMeshDriveLauncher, 300); };
    return obj;
};
