/**
 * @description Mesh Drive plugin for MeshCentral
 * @author Marcelo Henrique da Silva / Microsoft Copilot
 * @license MIT
 */
"use strict";

module.exports.meshdrive = function (parent) {
    var fs = require('fs');
    var path = require('path');
    var crypto = require('crypto');

    var obj = {};
    obj.parent = parent;
    obj.meshServer = parent.parent;
    obj.debug = obj.meshServer.debug;
    obj.exports = [
        'onWebUIStartupEnd',
        'goPageEnd',
        'openLauncher',
        'injectMeshDriveLauncher'
    ];

    var settings = ((obj.meshServer || {}).config || {}).settings || {};
    var cfg = Object.assign({
        enabled: true,
        route: '/drive',
        launcherRoute: '/meshdrive',
        publicUrl: 'https://mesh.aplicado.com.br/drive',
        launcherUrl: 'https://mesh.aplicado.com.br/meshdrive/launcher',
        meshFilesRoot: '/opt/meshcentral/meshcentral-files',
        meshDomainFolder: 'domain',
        userFolderPrefix: 'user-',
        defaultUserSubFolder: '',
        readOnly: false,
        allowPublic: false,
        debugAuth: false,
        passwordIterations: 12000
    }, settings.meshDrive || settings.meshdrive || {});

    function log(msg) { try { obj.debug('PLUGIN', 'Mesh Drive', msg); } catch (e) {} try { console.log('PLUGIN: Mesh Drive: ' + msg); } catch (e) {} }
    function safeSegment(v) { return String(v || '').replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 160) || '_'; }
    function ensureDir(d) { fs.mkdirSync(d, { recursive: true }); }
    function normalizeUsername(username) {
        var u = String(username || '').trim();
        if (u.indexOf('\\') >= 0) u = u.split('\\').pop();
        if (u.indexOf('/') >= 0) u = u.split('/').pop();
        if (u.indexOf('@') >= 0) u = u.split('@')[0];
        if (u.toLowerCase().indexOf('user-') === 0) u = u.substring(5);
        return safeSegment(u.toLowerCase());
    }
    function parseBasicAuth(req) {
        var h = req.headers.authorization || '';
        if (h.toLowerCase().indexOf('basic ') !== 0) return null;
        var raw = '';
        try { raw = Buffer.from(h.substring(6), 'base64').toString('utf8'); } catch (e) { return null; }
        var i = raw.indexOf(':');
        if (i < 0) return null;
        return { username: raw.substring(0, i), password: raw.substring(i + 1) };
    }
    function getDb() { return obj.meshServer && (obj.meshServer.db || (obj.meshServer.webserver && obj.meshServer.webserver.db)); }
    function dbGet(id) {
        return new Promise(function(resolve) {
            var db = getDb();
            if (!db || typeof db.Get !== 'function') return resolve(null);
            try {
                db.Get(id, function(err, docs) {
                    if (err) return resolve(null);
                    if (Array.isArray(docs)) return resolve(docs[0] || null);
                    return resolve(docs || null);
                });
            } catch (e) { resolve(null); }
        });
    }
    function timingSafeEquals(a, b) {
        a = String(a || ''); b = String(b || '');
        var ab = Buffer.from(a); var bb = Buffer.from(b);
        if (ab.length !== bb.length) return false;
        try { return crypto.timingSafeEqual(ab, bb); } catch (e) { return false; }
    }
    function getHashByteLength(storedHash) {
        try {
            var b = Buffer.from(String(storedHash || ''), 'base64');
            if (b && b.length > 0) return b.length;
        } catch (e) {}
        return 64;
    }
    function pbkdf2Hash(password, salt, storedHash) {
        return new Promise(function(resolve) {
            try {
                var keyLen = getHashByteLength(storedHash);
                crypto.pbkdf2(password, salt, cfg.passwordIterations, keyLen, 'sha384', function(err, hash) {
                    if (err) { log('pbkdf2 error: ' + err); return resolve(null); }
                    resolve(hash.toString('base64'));
                });
            } catch (e) { log('pbkdf2 exception: ' + (e && e.stack ? e.stack : e)); resolve(null); }
        });
    }
    async function findLocalUser(username) {
        var u = normalizeUsername(username);
        var candidates = ['user//' + u, 'user/' + cfg.meshDomainFolder + '/' + u, 'user//user-' + u, 'user/' + cfg.meshDomainFolder + '/user-' + u];
        for (var i = 0; i < candidates.length; i++) { var doc = await dbGet(candidates[i]); if (doc) return { id: candidates[i], doc: doc, username: u }; }
        return { id: 'user//' + u, doc: null, username: u };
    }
    async function validateLocalUser(username, password) {
        if (cfg.allowPublic === true) return { id: 'public', username: 'public' };
        var found = await findLocalUser(username), userDoc = found.doc;
        if (!userDoc) { if (cfg.debugAuth) log('user not found: ' + username); return null; }
        if (userDoc.locked || userDoc.siteadmin === -1) return null;
        var salt = userDoc.salt;
        var stored = userDoc.hash || userDoc.passhash || userDoc.pwhash || userDoc.passwordhash;
        if (!salt || !stored) { if (cfg.debugAuth) log('user has no local password hash: ' + found.username); return null; }
        var computed = await pbkdf2Hash(password, salt, stored);
        if (!computed) { if (cfg.debugAuth) log('could not compute password hash'); return null; }
        var ok = timingSafeEquals(stored, computed) || timingSafeEquals(String(stored).toLowerCase(), String(computed).toLowerCase());
        if (!ok) { if (cfg.debugAuth) log('invalid password for: ' + found.username); return null; }
        return { id: userDoc._id || found.id, username: found.username, doc: userDoc };
    }
    function sendAuth(res) { res.writeHead(401, { 'WWW-Authenticate': 'Basic realm="Mesh Drive"', 'Content-Type': 'text/plain; charset=utf-8' }); res.end('Authentication required'); }
    async function authenticate(req, res) {
        var basic = parseBasicAuth(req);
        if (!basic && cfg.allowPublic !== true) { sendAuth(res); return null; }
        var user = await validateLocalUser(basic ? basic.username : 'public', basic ? basic.password : '');
        if (!user) { sendAuth(res); return null; }
        return user;
    }
    function nativeDomainRoot() { return path.resolve(path.join(cfg.meshFilesRoot, cfg.meshDomainFolder)); }
    function userRoot(user) {
        var root = path.join(nativeDomainRoot(), cfg.userFolderPrefix + normalizeUsername(user.username || user.id || 'user'));
        if (cfg.defaultUserSubFolder) root = path.join(root, safeSegment(cfg.defaultUserSubFolder));
        ensureDir(root); return path.resolve(root);
    }
    function requestPath(req) {
        var u = req.url || '/', q = u.indexOf('?'); if (q >= 0) u = u.substring(0, q);
        try { u = decodeURIComponent(u); } catch (e) {}
        if (u.indexOf(cfg.route) === 0) u = u.substring(cfg.route.length);
        if (u.indexOf('/') !== 0) u = '/' + u; return u;
    }
    function fullPath(user, rel) {
        var root = userRoot(user), clean = path.normalize('/' + rel).replace(/^([/\\])+/, ''), p = path.resolve(path.join(root, clean));
        if (p !== root && p.indexOf(root + path.sep) !== 0) return null;
        return p;
    }
    function externalHref(rel) { var r = rel || '/'; if (r.indexOf('/') !== 0) r = '/' + r; return cfg.route.replace(/\/$/, '') + encodeURI(r).replace(/#/g, '%23'); }
    function xmlEscape(s) { return String(s).replace(/[<>&'"]/g, function(c) { return {'<':'&lt;','>':'&gt;','&':'&amp;',"'":'&apos;','"':'&quot;'}[c]; }); }
    function propResponse(f, rel) {
        var st = fs.statSync(f), isDir = st.isDirectory(), display = path.basename(f) || '/', href = externalHref(rel + (isDir && !rel.endsWith('/') ? '/' : ''));
        return '<D:response><D:href>' + xmlEscape(href) + '</D:href><D:propstat><D:prop><D:displayname>' + xmlEscape(display) + '</D:displayname><D:getlastmodified>' + st.mtime.toUTCString() + '</D:getlastmodified><D:creationdate>' + st.birthtime.toISOString() + '</D:creationdate>' + (isDir ? '<D:resourcetype><D:collection/></D:resourcetype>' : '<D:resourcetype/>') + (!isDir ? '<D:getcontentlength>' + st.size + '</D:getcontentlength>' : '') + '<D:getetag>"' + st.size + '-' + Number(st.mtimeMs).toString(16) + '"</D:getetag></D:prop><D:status>HTTP/1.1 200 OK</D:status></D:propstat></D:response>';
    }
    function sendXml(res, code, body, headers) { res.writeHead(code, Object.assign({ 'Content-Type': 'application/xml; charset=utf-8' }, headers || {})); res.end(body); }
    function methodNotAllowed(res) { res.writeHead(405); res.end(); }
    function copyRecursive(src, dest) { var st = fs.statSync(src); if (st.isDirectory()) { ensureDir(dest); fs.readdirSync(src).forEach(function(f) { copyRecursive(path.join(src, f), path.join(dest, f)); }); } else { fs.copyFileSync(src, dest); } }

    async function davHandler(req, res) {
        var user = await authenticate(req, res); if (!user) return;
        var rel = requestPath(req), fp = fullPath(user, rel); if (!fp) { res.writeHead(403); res.end(); return; }
        try {
            switch ((req.method || 'GET').toUpperCase()) {
                case 'OPTIONS': res.writeHead(200, { 'DAV': '1, 2', 'Allow': 'OPTIONS, PROPFIND, GET, HEAD, PUT, DELETE, MKCOL, MOVE, COPY, LOCK, UNLOCK, PROPPATCH', 'MS-Author-Via': 'DAV' }); res.end(); break;
                case 'PROPFIND': { if (!fs.existsSync(fp)) { res.writeHead(404); res.end(); return; } var depth = req.headers.depth || '1', responses = propResponse(fp, rel), stat = fs.statSync(fp); if (depth !== '0' && stat.isDirectory()) { fs.readdirSync(fp).forEach(function(name) { responses += propResponse(path.join(fp, name), path.posix.join(rel, name)); }); } sendXml(res, 207, '<?xml version="1.0" encoding="utf-8"?><D:multistatus xmlns:D="DAV:">' + responses + '</D:multistatus>'); break; }
                case 'GET': case 'HEAD': { if (!fs.existsSync(fp)) { res.writeHead(404); res.end(); return; } var st = fs.statSync(fp); if (st.isDirectory()) { res.writeHead(403); res.end(); return; } res.writeHead(200, { 'Content-Length': st.size }); if (req.method.toUpperCase() === 'HEAD') res.end(); else fs.createReadStream(fp).pipe(res); break; }
                case 'PUT': if (cfg.readOnly) return methodNotAllowed(res); ensureDir(path.dirname(fp)); req.pipe(fs.createWriteStream(fp)).on('finish', function() { res.writeHead(201); res.end(); }).on('error', function() { res.writeHead(500); res.end(); }); break;
                case 'MKCOL': if (cfg.readOnly) return methodNotAllowed(res); if (fs.existsSync(fp)) { res.writeHead(405); res.end(); return; } ensureDir(fp); res.writeHead(201); res.end(); break;
                case 'DELETE': if (cfg.readOnly) return methodNotAllowed(res); if (!fs.existsSync(fp)) { res.writeHead(404); res.end(); return; } fs.rmSync(fp, { recursive: true, force: true }); res.writeHead(204); res.end(); break;
                case 'MOVE': case 'COPY': { if (cfg.readOnly) return methodNotAllowed(res); if (!fs.existsSync(fp)) { res.writeHead(404); res.end(); return; } var destHeader = req.headers.destination; if (!destHeader) { res.writeHead(400); res.end(); return; } var destUrl = new URL(destHeader, cfg.publicUrl), destRel = decodeURIComponent(destUrl.pathname); if (destRel.indexOf(cfg.route) === 0) destRel = destRel.substring(cfg.route.length) || '/'; var dest = fullPath(user, destRel); if (!dest) { res.writeHead(403); res.end(); return; } ensureDir(path.dirname(dest)); if (req.method.toUpperCase() === 'MOVE') fs.renameSync(fp, dest); else copyRecursive(fp, dest); res.writeHead(201); res.end(); break; }
                case 'LOCK': { var token = 'opaquelocktoken:' + crypto.randomUUID(); sendXml(res, 200, '<?xml version="1.0" encoding="utf-8"?><D:prop xmlns:D="DAV:"><D:lockdiscovery><D:activelock><D:locktype><D:write/></D:locktype><D:lockscope><D:exclusive/></D:lockscope><D:depth>infinity</D:depth><D:owner>Mesh Drive</D:owner><D:timeout>Second-3600</D:timeout><D:locktoken><D:href>' + token + '</D:href></D:locktoken></D:activelock></D:lockdiscovery></D:prop>', { 'Lock-Token': '<' + token + '>' }); break; }
                case 'UNLOCK': res.writeHead(204); res.end(); break;
                case 'PROPPATCH': sendXml(res, 207, '<?xml version="1.0" encoding="utf-8"?><D:multistatus xmlns:D="DAV:"><D:response><D:href>' + xmlEscape(externalHref(rel)) + '</D:href><D:propstat><D:prop/><D:status>HTTP/1.1 200 OK</D:status></D:propstat></D:response></D:multistatus>'); break;
                default: methodNotAllowed(res);
            }
        } catch (e) { log('handler error: ' + (e && e.stack ? e.stack : e)); try { res.writeHead(500); res.end(); } catch (ex) {} }
    }

    function htmlEscape(s) { return String(s).replace(/[<>&'"]/g, function(c) { return {'<':'&lt;','>':'&gt;','&':'&amp;',"'":'&#39;','"':'&quot;'}[c]; }); }
    function sendText(res, name, content, contentType) {
        res.writeHead(200, { 'Content-Type': contentType || 'text/plain; charset=utf-8', 'Content-Disposition': 'attachment; filename="' + name + '"' });
        res.end(content);
    }
    function launcherHtml() {
        var webdavUrl = cfg.publicUrl.replace(/\/$/, '/') ;
        var host = webdavUrl.replace(/^https:\/\//, '').replace(/\/drive\/?$/, '');
        var winUnc = '\\\\' + host + '@SSL\\drive';
        var winDavRoot = '\\\\' + host + '@SSL\\DavWWWRoot\\drive';
        var davsUrl = 'davs://' + host + '/drive/';
        return '<!DOCTYPE html><html lang="pt-br"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Mesh Drive</title><style>body{font-family:Segoe UI,Arial,sans-serif;background:#f4f7fb;margin:0;color:#1f2937}.wrap{max-width:1050px;margin:0 auto;padding:32px}.hero{background:#fff;border:1px solid #dbe3ef;border-radius:18px;padding:28px;box-shadow:0 10px 25px rgba(15,23,42,.08)}h1{margin:0 0 8px;font-size:32px}.muted{color:#667085}.cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:16px;margin-top:20px}.card{background:#fff;border:1px solid #dbe3ef;border-radius:16px;padding:20px}.card.reco{border-color:#2563eb;box-shadow:0 0 0 3px rgba(37,99,235,.12)}.badge{display:inline-block;background:#e0ecff;color:#1d4ed8;border-radius:999px;padding:4px 10px;font-size:12px;font-weight:600}.actions{display:flex;flex-wrap:wrap;gap:10px;margin-top:14px}.btn{display:inline-block;background:#2563eb;color:#fff;text-decoration:none;border:0;border-radius:10px;padding:10px 14px;font-weight:600;cursor:pointer}.btn.secondary{background:#eef2f7;color:#1f2937}.btn.green{background:#16803c}code,pre{background:#0f172a;color:#e5e7eb;border-radius:8px;padding:10px;display:block;white-space:pre-wrap;overflow:auto}.small{font-size:13px}.ok{color:#16803c;font-weight:600}</style></head><body><div class="wrap"><div class="hero"><span class="badge">Mesh Drive</span><h1>Abrir ou mapear seus arquivos</h1><p class="muted">O sistema detecta seu sistema operacional e mostra a melhor opção. Seus arquivos são acessados via WebDAV em <b>' + htmlEscape(webdavUrl) + '</b>.</p><p id="detected" class="ok">Detectando sistema...</p><div class="actions"><button class="btn" onclick="copyText(\'' + htmlEscape(webdavUrl) + '\')">Copiar URL WebDAV</button><button class="btn secondary" onclick="copyText(\'' + htmlEscape(winUnc) + '\')">Copiar caminho Windows</button></div></div><div class="cards"><div class="card" id="card-windows"><span class="badge">Windows</span><h2>Abrir no Explorer</h2><p class="small">Use o caminho WebDAV UNC. Se o navegador bloquear links file://, copie e cole no Explorer.</p><code>' + htmlEscape(winUnc) + '</code><div class="actions"><a class="btn" href="file:///' + encodeURI(winUnc.replace(/\\/g, '/')) + '">Tentar abrir</a><button class="btn secondary" onclick="copyText(\'' + htmlEscape(winUnc) + '\')">Copiar</button></div><h3>Mapear unidade</h3><code>net use M: ' + htmlEscape(winUnc) + ' /user:%USERNAME% * /persistent:yes</code><div class="actions"><a class="btn green" href="/meshdrive/scripts/windows-map.cmd">Baixar .CMD</a><button class="btn secondary" onclick="copyText(\'net use M: ' + htmlEscape(winUnc) + ' /user:%USERNAME% * /persistent:yes\')">Copiar comando</button></div><p class="small">Alternativa: <code>' + htmlEscape(winDavRoot) + '</code></p></div><div class="card" id="card-linux"><span class="badge">Linux</span><h2>Abrir no gerenciador de arquivos</h2><code>' + htmlEscape(davsUrl) + '</code><div class="actions"><a class="btn" href="' + htmlEscape(davsUrl) + '">Tentar abrir</a><button class="btn secondary" onclick="copyText(\'' + htmlEscape(davsUrl) + '\')">Copiar</button></div><h3>Montar com davfs2</h3><code>mkdir -p ~/MeshDrive\nsudo mount -t davfs ' + htmlEscape(webdavUrl) + ' ~/MeshDrive</code><div class="actions"><a class="btn green" href="/meshdrive/scripts/linux-map.sh">Baixar .SH</a></div></div><div class="card" id="card-macos"><span class="badge">macOS</span><h2>Abrir no Finder</h2><code>' + htmlEscape(davsUrl) + '</code><div class="actions"><a class="btn" href="' + htmlEscape(davsUrl) + '">Tentar abrir</a><button class="btn secondary" onclick="copyText(\'' + htmlEscape(davsUrl) + '\')">Copiar</button></div><h3>Montar via terminal</h3><code>mkdir -p ~/MeshDrive\nmount_webdav ' + htmlEscape(webdavUrl) + ' ~/MeshDrive</code><div class="actions"><a class="btn green" href="/meshdrive/scripts/macos-map.sh">Baixar .SH</a></div></div></div></div><script>function copyText(t){navigator.clipboard.writeText(t).then(function(){alert("Copiado: "+t);},function(){prompt("Copie o texto abaixo:",t);});}var ua=navigator.userAgent||"";var os="Sistema não identificado";var id="";if(/Windows/i.test(ua)){os="Windows";id="card-windows";}else if(/Macintosh|Mac OS/i.test(ua)){os="macOS";id="card-macos";}else if(/Linux/i.test(ua)){os="Linux";id="card-linux";}document.getElementById("detected").innerText="Sistema detectado: "+os;if(id){document.getElementById(id).classList.add("reco");}</script></body></html>';
    }
    function launcherHandler(req, res) {
        var url = req.url || '';
        if (url.indexOf('/scripts/windows-map.cmd') >= 0) {
            var win = '@echo off\r\nset DRIVE=M:\r\nset TARGET=\\\\mesh.aplicado.com.br@SSL\\drive\r\necho Mapping Mesh Drive to %DRIVE%\r\nnet use %DRIVE% /delete /y >nul 2>nul\r\nnet use %DRIVE% %TARGET% /persistent:yes\r\nif errorlevel 1 pause\r\nexplorer %DRIVE%\r\n';
            return sendText(res, 'MapMeshDrive.cmd', win, 'application/octet-stream');
        }
        if (url.indexOf('/scripts/linux-map.sh') >= 0) {
            var lin = '#!/bin/sh\nmkdir -p "$HOME/MeshDrive"\necho "Mounting Mesh Drive in $HOME/MeshDrive"\nsudo mount -t davfs https://mesh.aplicado.com.br/drive/ "$HOME/MeshDrive"\nxdg-open "$HOME/MeshDrive" >/dev/null 2>&1 &\n';
            return sendText(res, 'map-mesh-drive-linux.sh', lin, 'application/x-sh; charset=utf-8');
        }
        if (url.indexOf('/scripts/macos-map.sh') >= 0) {
            var mac = '#!/bin/sh\nmkdir -p "$HOME/MeshDrive"\necho "Mounting Mesh Drive in $HOME/MeshDrive"\nmount_webdav https://mesh.aplicado.com.br/drive/ "$HOME/MeshDrive"\nopen "$HOME/MeshDrive"\n';
            return sendText(res, 'map-mesh-drive-macos.sh', mac, 'application/x-sh; charset=utf-8');
        }
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(launcherHtml());
    }
    function findApp() { var c = [obj.meshServer && obj.meshServer.webserver && obj.meshServer.webserver.app, obj.meshServer && obj.meshServer.app, parent && parent.app, parent && parent.webserver && parent.webserver.app]; for (var i = 0; i < c.length; i++) if (c[i] && typeof c[i].use === 'function') return c[i]; return null; }

    obj.hook_setupHttpHandlers = function() {
        if (cfg.enabled === false) { log('disabled'); return; }
        var app = findApp();
        if (!app) { log('Express app not found; cannot register routes'); return; }
        ensureDir(nativeDomainRoot());
        app.use(cfg.route, function(req, res) { davHandler(req, res); });
        app.use(cfg.launcherRoute, function(req, res) { launcherHandler(req, res); });
        log('registered route ' + cfg.route + ' -> ' + nativeDomainRoot() + '/' + cfg.userFolderPrefix + '<username>');
        log('registered launcher route ' + cfg.launcherRoute + '/launcher');
    };
    obj.server_startup = function() { log('loaded for ' + cfg.publicUrl + ', root=' + nativeDomainRoot()); };

    /* Browser-side helpers exported to MeshCentral Web UI */
    obj.openLauncher = function() { window.open('/meshdrive/launcher', '_blank'); };
    obj.injectMeshDriveLauncher = function() {
        try {
            if (document.getElementById('plugin_meshDriveLauncher')) return;
            var html = '<div id="plugin_meshDriveLauncher" style="margin:10px 0;padding:10px;border:1px solid #d0d7de;border-radius:8px;background:#f6f8fa;max-width:420px;">' +
                '<div style="font-weight:600;margin-bottom:4px;">📁 Mesh Drive</div>' +
                '<div style="font-size:12px;margin-bottom:8px;color:#57606a;">Abra ou mapeie seus arquivos do My Files no Windows, Linux ou macOS.</div>' +
                '<button onclick="pluginHandler.meshdrive.openLauncher();" style="padding:6px 10px;border-radius:6px;border:1px solid #1f6feb;background:#1f6feb;color:white;cursor:pointer;">Abrir opções do Mesh Drive</button>' +
                '</div>';
            var targets = [];
            var ids = ['p5', 'p13', 'p11', 'p2', 'p3'];
            for (var i = 0; i < ids.length; i++) { var el = document.getElementById(ids[i]); if (el) targets.push(el); }
            var all = document.querySelectorAll('div,section,td');
            for (var j = 0; j < all.length && targets.length < 8; j++) {
                var txt = (all[j].innerText || '').toLowerCase();
                if ((txt.indexOf('my files') >= 0 || txt.indexOf('meus arquivos') >= 0 || txt.indexOf('arquivos') >= 0) && all[j].offsetParent != null) targets.push(all[j]);
            }
            if (targets.length > 0) { targets[0].insertAdjacentHTML('afterbegin', html); return; }
            var account = document.querySelector('#p2AccountActions p.mL');
            if (account) { account.insertAdjacentHTML('beforeend', '<span id="plugin_meshDriveLauncher" style="display:block"><a onclick="pluginHandler.meshdrive.openLauncher();">📁 Mesh Drive</a></span>'); }
        } catch (e) { console.log('Mesh Drive launcher injection failed', e); }
    };
    obj.onWebUIStartupEnd = function() { setTimeout(pluginHandler.meshdrive.injectMeshDriveLauncher, 500); setTimeout(pluginHandler.meshdrive.injectMeshDriveLauncher, 2000); };
    obj.goPageEnd = function() { setTimeout(pluginHandler.meshdrive.injectMeshDriveLauncher, 300); };

    return obj;
};
